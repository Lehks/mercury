import fs from 'fs';
import _ from 'lodash';
import { IInternalCredentials, IConnectionData } from '../typings/connection-credentials';
import { IDatabaseConnection } from '../typings/database-connection';
import logger from '../logger';
import ErrorBase from '../errors/error-base';
import MultiError from '../errors/multi-error';

class ConnectionDataProvider implements ConnectionDataProvider.IStrategy {
    private readonly strategy: ConnectionDataProvider.IStrategy;
    private readonly connection: IDatabaseConnection;
    private readonly type: 'default' | 'admin';
    private readonly requirements: ConnectionDataProvider.IRequirements;
    private readonly databaseName: string;
    private data?: ConnectionDataProvider.IConnectionData;

    public constructor(
        connection: IDatabaseConnection,
        type: 'default' | 'admin',
        requirements: ConnectionDataProvider.IRequirements,
        databaseName: string
    ) {
        this.connection = connection;
        this.type = type;
        this.requirements = requirements;
        this.databaseName = databaseName;
        this.strategy = this.getStrategy();
    }

    public async getData(): Promise<ConnectionDataProvider.IConnectionData> {
        if (!this.data) {
            this.data = _.merge(this.getDataObject().data, await this.strategy.getData());
            this.checkRequirements();
        }

        return this.data;
    }

    private getStrategy(): ConnectionDataProvider.IStrategy {
        const credentials = this.getDataObject().credentials;

        if (typeof credentials === 'string') {
            if (credentials === 'ENVIRONMENT') {
                return new ConnectionDataProvider.EnvironmentCredentialsStrategy(this.type, this.databaseName);
            } else {
                return new ConnectionDataProvider.ExternalCredentialsStrategy(credentials);
            }
        } else {
            return new ConnectionDataProvider.InternalCredentialsStrategy(credentials);
        }
    }

    private getDataObject(): IConnectionData {
        if (this.type === 'admin' && this.connection.admin) {
            return this.connection.admin;
        } else {
            return this.connection.default;
        }
    }

    private checkRequirements(): void {
        const dataKeys = Object.keys(this.data!);

        dataKeys.forEach(key => {
            if (!this.requirements[key]) {
                logger.warn(`Connection data key '${key}' is not known to the driver and will not do anything.`);
            }
        });

        const errors = Object.keys(_.pickBy(this.requirements, value => value === 'required'))
            .filter(key => !dataKeys.includes(key))
            .map(key => new ConnectionDataProvider.MissingRequiredConnectionKeyError(key));

        if (errors.length > 0) {
            throw new MultiError(...errors);
        }
    }
}

namespace ConnectionDataProvider {
    export interface IConnectionData {
        [key: string]: any;
    }

    export interface IStrategy {
        getData: () => Promise<IConnectionData>;
    }

    export class InternalCredentialsStrategy implements IStrategy {
        private readonly credentials: IInternalCredentials;

        public constructor(credentials: IInternalCredentials) {
            this.credentials = credentials;
        }

        public async getData(): Promise<ConnectionDataProvider.IConnectionData> {
            return this.credentials;
        }
    }

    export class ExternalCredentialsStrategy implements IStrategy {
        private readonly path: string;

        public constructor(path: string) {
            this.path = path;
        }

        public async getData(): Promise<ConnectionDataProvider.IConnectionData> {
            return JSON.parse(await fs.promises.readFile(this.path, 'utf-8'));
        }
    }

    export class EnvironmentCredentialsStrategy implements IStrategy {
        private readonly prefix: string;

        public constructor(type: 'default' | 'admin', databaseName: string) {
            this.prefix = `MERCURY_${type.toUpperCase()}_${databaseName}_`;
        }

        public async getData(): Promise<ConnectionDataProvider.IConnectionData> {
            const selectedVariables = _.pickBy(
                process.env,
                (value, key) => value && key && key.startsWith(this.prefix)
            );
            return _.mapKeys(selectedVariables, key => key?.substring(this.prefix.length));
        }
    }

    export type RequirementState = 'required' | 'allowed';

    export interface IRequirements {
        [key: string]: RequirementState;
    }

    export class MissingRequiredConnectionKeyError extends ErrorBase {
        public key: string;

        public constructor(key: string) {
            super(
                ErrorBase.Code.MISSING_REQUIRED_CONNECTION_KEY,
                `The connection key '${key}' is required but missing from the connection data.`
            );
            this.key = key;
        }
    }
}

export = ConnectionDataProvider;

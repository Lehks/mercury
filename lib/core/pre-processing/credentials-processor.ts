import { IDatabaseDefinition } from '../typings/database-definition';
import logger from '../logger';
import { IConnectionData } from '../typings/connection-credentials';
import path from 'path';

namespace CredentialsResolver {
    type IDatabaseDef = IDatabaseDefinition;

    export async function run(ddf: IDatabaseDef) {
        Object.entries(ddf.databases).forEach(entry => {
            logger.debug(`Processing credentials of database '${entry[0]}'.`);

            const database = entry[1];

            logger.debug('Processing default credentials.');
            processCredentials(database.connection.default, ddf._ddfPath);
            logger.debug('Processing admin credentials.');
            processCredentials(database.connection.admin, ddf._ddfPath);
        });
    }

    function processCredentials(data: IConnectionData | undefined, ddfPath: string): void {
        if (data) {
            if (typeof data.credentials === 'string') {
                if (data.credentials !== 'ENVIRONMENT') {
                    data.credentials = path.resolve(ddfPath, data.credentials);
                }
            }
        }
    }
}

export = CredentialsResolver;

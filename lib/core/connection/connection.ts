import ConnectionDrivers from './connection-drivers';
import ConnectionManager from './connection-manager';
import ErrorBase from '../errors/error-base';
import UnexpectedError from '../errors/unexpected-error';
import _ from 'lodash';

class Connection {
    protected readonly manager: ConnectionManager;
    protected readonly driver: ConnectionDrivers.IConnectionDriver;

    public constructor(manager: ConnectionManager, driver: ConnectionDrivers.IConnectionDriver) {
        this.manager = manager;
        this.driver = driver;
    }

    public async query(sql: string, params?: ConnectionManager.Parameters): Promise<ConnectionManager.IQueryResult> {
        try {
            return await this.driver.query(sql, this.processParams(params));
        } catch (error) {
            throw this.mapErrorsWrapper(this.manager.getDriver(), error);
        }
    }

    private processParams(params?: ConnectionManager.Parameters): ConnectionManager.CellValue[] {
        if (params) {
            if (_.isArray(params)) {
                return params;
            } else {
                return [params];
            }
        } else {
            return [];
        }
    }

    private mapErrorsWrapper(driver: ConnectionDrivers.IConnectionManagerDriver, error: any): ErrorBase {
        const mapped = driver.mapErrors(error);

        if (!(mapped instanceof ErrorBase)) {
            return new UnexpectedError(mapped);
        } else {
            return mapped;
        }
    }
}

export = Connection;

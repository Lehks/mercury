import ErrorBase from '../errors/error-base';
import ConnectionManager from './connection-manager';
import ConnectionDataProvider from './connection-data-provider';

namespace ConnectionDrivers {
    export interface IConnectionManagerDriver {
        getConnectionDataRequirements: () => ConnectionDataProvider.IRequirements;
        initialize: (provider: ConnectionDataProvider.IConnectionData) => Promise<void>;
        terminate: () => Promise<void>;
        getConnection: () => Promise<IConnectionDriver>;
        mapErrors: (error: any) => ErrorBase;
        useDatabase: (database: string) => Promise<void>;
    }

    export interface IConnectionDriver {
        query: (sql: string, parameters?: ConnectionManager.CellValue[]) => Promise<ConnectionManager.IQueryResult>;
        beginTransaction: () => Promise<void>;
        commitTransaction: () => Promise<void>;
        rollbackTransaction: () => Promise<void>;
        end: () => Promise<void>;
    }
}

export = ConnectionDrivers;

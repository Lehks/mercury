import ErrorBase from '../errors/error-base';
import ConnectionManager from './connection-manager';
import ConnectionDataProvider from './connection-data-provider';

namespace ConnectionDrivers {
    export interface IConnectionManagerDriver {
        getConnectionDataRequirements: () => ConnectionDataProvider.IRequirements;
        initialize: (provider: ConnectionDataProvider.IConnectionData, database?: string) => Promise<void>;
        terminate: () => Promise<void>;
        getConnection: () => Promise<IConnectionDriver>;
        mapErrors: (error: any) => ErrorBase;
        getSQLQueries: () => ISQLQueries;
    }

    export interface IConnectionDriver {
        query: (sql: string, parameters?: ConnectionManager.CellValue[]) => Promise<ConnectionManager.IQueryResult>;
        beginTransaction: () => Promise<void>;
        commitTransaction: () => Promise<void>;
        rollbackTransaction: () => Promise<void>;
        end: () => Promise<void>;
    }

    export interface ISQLQueries {
        useDatabase: (databaseName: string) => Promise<string>;
        getQuery: (table: string, columns: string[], pkNames: string[]) => Promise<string>;
        setQuery: (table: string, columns: string[], pkNames: string[]) => Promise<string>;
        insertQuery: (table: string, columns: string[]) => Promise<string>;
        deleteQuery: (table: string, pkNames: string[]) => Promise<string>;
    }
}

export = ConnectionDrivers;

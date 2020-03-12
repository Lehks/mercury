import { IDatabaseConnection } from './database-connection';
import Meta from './meta';
import { ITable } from './table';

export interface IDatabase {
    _partialTables: {
        [key: string]: ITable;
    };
    connection: IDatabaseConnection;
    meta: Meta.IDatabaseMeta;
    tables: {
        [key: string]: ITable;
    };
}

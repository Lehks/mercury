import { IDatabaseConnection } from './database-connection';
import Meta from './meta';
import { ITable } from './table';

export interface IDatabase {
    connection: IDatabaseConnection;
    meta: Meta.IDatabaseMeta;
    tables: {
        [key: string]: ITable;
    };
}

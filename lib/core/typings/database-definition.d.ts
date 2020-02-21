import Meta from './meta';
import { IDatabase } from './database';
import { IColumn } from './column';
import { ITable } from './table';
import { IType } from './type';

export interface IDatabaseDefinition {
    _ddfPath: string;
    schema: string;
    includes: string[];
    databases: {
        [key: string]: IDatabase;
    };
    meta: Meta.IGlobalMeta;
    columnDefinitions: {
        [key: string]: IColumn;
    };

    typeDefs: {
        [key: string]: IType;
    };

    partialTables: {
        [key: string]: ITable;
    };
}

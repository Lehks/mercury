import Meta from './meta';
import { IDatabase } from './database';

export interface IDatabaseDefinition {
    schema: string;
    includes: string[];
    databases: {
        [key: string]: IDatabase;
    };
    meta: Meta.IGlobalMeta;
    columnDefinitions: IColumnDefinitions;
    typeDefinitions: ITypeDefinitions;
    partialTables: IPartialTables;
}

export interface IColumnDefinitions {}
export interface ITypeDefinitions {}
export interface IPartialTables {}

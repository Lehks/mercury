import Meta from './meta';
import { IColumn } from './column';
import { IPrimaryKey } from './primary-key';
import { IConstraints } from './constraints';

export interface ITable {
    meta: Meta.ITableMeta;
    extends?: string;
    columns: {
        [key: string]: IColumn;
    };
    primaryKey: IPrimaryKey;
    constraints: IConstraints;
}

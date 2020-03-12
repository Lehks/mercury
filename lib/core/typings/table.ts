import Meta from './meta';
import { IColumn } from './column';
import { IPrimaryKey } from './primary-key';
import { IConstraints } from './constraints';

export interface ITable {
    _name: string;
    meta: Meta.ITableMeta;
    extends?: string;
    _parent?: ITable;
    columns: {
        [key: string]: IColumn;
    };
    primaryKey: IPrimaryKey;
    constraints: IConstraints;
}

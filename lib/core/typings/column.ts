import Meta from './meta';
import { IType } from './type';

export type IColumn = string | IConcreteColumn;

export interface IConcreteColumn {
    type: IType;
    nullable: boolean;
    unique: boolean;
    meta: Meta.IColumnMeta;
}

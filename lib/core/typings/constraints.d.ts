import { IForeignKey } from './foreign-key';

export interface IConstraints {
    foreignKeys: {
        [key: string]: IForeignKey;
    };
}

import { IConnectionData } from './connection-credentials';

export interface IDatabaseConnection {
    driver: string;
    default: IConnectionData;
    admin?: IConnectionData;
}

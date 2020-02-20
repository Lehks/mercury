import { IConnectionCredentials } from './connection-credentials';

export interface IDatabaseConnection {
    driver: string;
    default: IConnectionCredentials;
    admin?: IConnectionCredentials;
}

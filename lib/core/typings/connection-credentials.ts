export interface IConnectionData {
    credentials: IConnectionCredentials;
    data: {
        [key: string]: any;
    };
}

export type IConnectionCredentials = IInternalCredentials | string | 'ENVIRONMENT';

export interface IInternalCredentials {
    [key: string]: any;
    host?: string;
    user?: string;
    password?: string;
}

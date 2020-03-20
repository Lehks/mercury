export interface IConnectionData {
    credentials: IConnectionCredentials;
    data: {
        [key: string]: any;
    };
}

export type IConnectionCredentials = IInternalCredentials | string | 'ENVIRONMENT';

export interface IInternalCredentials {
    host?: string;
    user?: string;
    password?: string;
    [key: string]: any;
}

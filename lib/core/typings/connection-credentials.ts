export interface IConnectionCredentials {
    credentials: IInternalCredentials | string | 'ENVIRONMENT';
    data: {
        [key: string]: any;
    };
}

export interface IInternalCredentials {
    host?: string;
    user?: string;
    password?: string;
    [key: string]: any;
}

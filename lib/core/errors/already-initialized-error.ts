import ErrorBase from './error-base';

class AlreadyInitializedError extends ErrorBase {
    public constructor() {
        super(ErrorBase.Code.ALREADY_INITIALIZED, 'Database connection has already been initialized.');
    }
}

export = AlreadyInitializedError;

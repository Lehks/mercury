import ErrorBase from './error-base';

class NotInitializedError extends ErrorBase {
    public constructor() {
        super(ErrorBase.Code.NOT_INITIALIZED, 'Database connection is not initialized.');
    }
}

export = NotInitializedError;

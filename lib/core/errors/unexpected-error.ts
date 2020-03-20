import ErrorBase from './error-base';

class UnexpectedError extends ErrorBase {
    public readonly cause?: ErrorBase;

    public constructor(cause?: ErrorBase) {
        super(ErrorBase.Code.UNEXPECTED, 'Unexpected error.');
        this.cause = cause;
    }
}

export = UnexpectedError;

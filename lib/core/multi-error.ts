import ErrorBase from './error-base';

class MultiError extends ErrorBase {
    public readonly errors: ErrorBase[];

    public constructor(...errors: ErrorBase[]) {
        super(ErrorBase.Code.MULTI_ERROR, errors.map(e => e.message).join('\n'));
        this.errors = errors;
    }
}

export = MultiError;

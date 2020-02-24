abstract class ErrorBase extends Error {
    public readonly code: ErrorBase.Code;

    protected constructor(code: ErrorBase.Code, message: string) {
        super(message);
        this.code = code;
    }
}

namespace ErrorBase {
    export enum Code {
        MULTI_ERROR = 0,
        INCLUDE_DUPLICATE_DATABASE = 1,
        INCLUDE_DUPLICATE_COLUMN_DEFINITION = 2,
        INCLUDE_DUPLICATE_TYPE_DEFINITION = 3,
        INCLUDE_DUPLICATE_PARTIAL_TABLE = 4,
        FILE_NOT_FOUND = 5,
        VALIDATION_ERROR = 6,
        INVALID_PARTIAL_TABLE = 7,
        CIRCULAR_INHERITANCE = 8,
        DUPLICATE_COLUMN = 9,
        INVALID_COLUMN_DEFINITION = 10,
        INVALID_TYPE_DEFINITION = 11,
        INVALID_FOREIGN_KEY_ON = 12,
        INVALID_FOREIGN_KEY_REFERENCE_TABLE = 13,
        INVALID_FOREIGN_KEY_REFERENCE_COLUMN = 14,
        FOREIGN_KEY_SELF_REFERENCE = 15
    }
}

export = ErrorBase;

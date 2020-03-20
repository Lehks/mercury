import { IDatabaseDefinition } from '../typings/database-definition';
import { ITable } from '../typings/table';
import { IColumn, IConcreteColumn } from '../typings/column';
import { IConcreteType } from '../typings/type';
import { IInteger } from '../typings/types/integer';
import { IFloatingPoint } from '../typings/types/floating-point';
import { IString } from '../typings/types/string';
import { IEnum } from '../typings/types/enum';
import { ITemporal } from '../typings/types/temporal';
import { IBoolean } from '../typings/types/boolean';
import ErrorBase from '../errors/error-base';

namespace TypeChecker {
    export async function run(ddf: IDatabaseDefinition) {
        Object.values(ddf.databases).forEach(database => {
            Object.values(database.tables).forEach(table => {
                checkTableTypes(table);
            });
        });
    }

    function checkTableTypes(table: ITable) {
        Object.entries(table.columns).forEach(entry => {
            const name = entry[0];
            const column = entry[1];

            checkColumnType(name, column);
        });

        if (table._parent) {
            checkTableTypes(table._parent);
        }
    }

    function checkColumnType(columnName: string, rawColumn: IColumn) {
        const column = rawColumn as IConcreteColumn;
        const type = column.type as IConcreteType;

        checkNull(columnName, column, type);

        switch (type.base) {
            case 'small-int':
            case 'int':
            case 'big-int':
                checkInteger(type, columnName);
                break;
            case 'float':
            case 'double':
                checkFloat(type, columnName);
                break;
            case 'char':
            case 'var-char':
                checkString(type, columnName);
                break;
            case 'enum':
                checkEnum(type, columnName);
                break;
            case 'date':
            case 'time':
            case 'date-time':
                checkTemporal(type);
                break;
            case 'boolean':
                checkBoolean(type);
                break;
        }
    }

    function checkNull(columnName: string, column: IConcreteColumn, type: IConcreteType) {
        if (column.nullable && type.default === null) {
            throw new InvalidNullDefault(columnName);
        }
    }

    function checkInteger(type: IInteger, columnName: string) {
        checkUnsigned(type, columnName);
    }

    function checkFloat(type: IFloatingPoint, columnName: string) {
        checkUnsigned(type, columnName);
    }

    function checkString(type: IString, columnName: string) {
        if (typeof type.default === 'string' && type.default.length > type.length) {
            throw new InvalidDefaultStringLength(columnName, type);
        }
    }

    function checkEnum(type: IEnum, columnName: string) {
        if (typeof type.default === 'string' && !type.literals.includes(type.default)) {
            throw new InvalidEnumDefaultLiteral(columnName, type);
        }
    }

    function checkTemporal(type: ITemporal) {
        // no checks required
    }

    function checkBoolean(type: IBoolean) {
        // no checks required
    }

    function checkUnsigned(type: IInteger | IFloatingPoint, columnName: string) {
        if (type.unsigned && typeof type.default === 'number' && type.default < 0) {
            throw new InvalidDefaultSign(columnName);
        }
    }

    export class InvalidNullDefault extends ErrorBase {
        public readonly column: string;

        public constructor(column: string) {
            super(
                ErrorBase.Code.INVALID_NULL_DEFAULT,
                `The type of '${column}' is default by null but the column is not nullable.`
            );
            this.column = column;
        }
    }

    export class InvalidEnumDefaultLiteral extends ErrorBase {
        public readonly literal: string;
        public readonly column: string;

        public constructor(column: string, enumType: IEnum) {
            super(
                ErrorBase.Code.INVALID_ENUM_DEFAULT_LITERAL,
                `The literal '${enumType.default}' does not exist in the type of the column '${column}'.`
            );
            this.literal = enumType.default as string;
            this.column = column;
        }
    }

    export class InvalidDefaultSign extends ErrorBase {
        public readonly column: string;

        public constructor(column: string) {
            super(
                ErrorBase.Code.INVALID_DEFAULT_SIGN,
                `The type of the column '${column}' is unsigned, but the default value is negative..`
            );
            this.column = column;
        }
    }

    export class InvalidDefaultStringLength extends ErrorBase {
        public readonly column: string;

        public constructor(column: string, type: IString) {
            super(
                ErrorBase.Code.INVALID_DEFAULT_STRING_LENGTH,
                `The maximum length of the type of the column '${column}' is ${type.length} ` +
                    `but its default value's length is greater than that.`
            );
            this.column = column;
        }
    }
}

export = TypeChecker;

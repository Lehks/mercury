import { IDatabaseDefinition } from '../typings/database-definition';
import { ITable } from '../typings/table';
import ErrorBase from '../errors/error-base';
import { ICompoundPrimaryKey } from '../typings/primary-key';
import MultiError from '../errors/multi-error';

namespace PrimaryKeyResolver {
    export async function run(ddf: IDatabaseDefinition): Promise<void> {
        Object.values(ddf.databases).forEach(database => {
            Object.entries(database.tables).forEach(entry => {
                resolverPrimaryKeys(entry[1]);

                if (entry[1].primaryKey.length === 0) {
                    throw new MissingPrimaryKey(entry[0]);
                }

                checkPrimaryKeyExistence(entry[1]);
            });
        });
    }

    function resolverPrimaryKeys(table: ITable): void {
        resolveOwnPrimaryKey(table);

        // resolve parent PKs and add parent PKs to this table
        if (table._parent) {
            resolverPrimaryKeys(table._parent);
            (table.primaryKey as ICompoundPrimaryKey).push(...(table._parent.primaryKey as ICompoundPrimaryKey));
        }
    }

    // turns any primary key in an array PK
    function resolveOwnPrimaryKey(table: ITable): void {
        if (table.primaryKey === undefined) {
            table.primaryKey = [];
        } else if (typeof table.primaryKey === 'string') {
            table.primaryKey = [table.primaryKey];
        }
    }

    function checkPrimaryKeyExistence(table: ITable): void {
        const errors = [] as ErrorBase[];

        (table.primaryKey as ICompoundPrimaryKey).forEach(pk => {
            if (!hasColumn(pk, table)) {
                errors.push(new MissingPrimaryKeyColumn(table._name, pk));
            }
        });

        if (errors.length > 0) {
            throw new MultiError(...errors);
        }
    }

    function hasColumn(column: string, table: ITable): boolean {
        if (Object.keys(table.columns).includes(column)) {
            return true;
        }

        if (table._parent) {
            return hasColumn(column, table._parent);
        } else {
            return false;
        }
    }

    export class MissingPrimaryKey extends ErrorBase {
        public readonly table: string;

        public constructor(table: string) {
            super(ErrorBase.Code.MISSING_PRIMARY_KEY, `The table '${table}' does not contain a primary key.`);
            this.table = table;
        }
    }

    export class MissingPrimaryKeyColumn extends ErrorBase {
        public readonly table: string;
        public readonly column: string;

        public constructor(table: string, column: string) {
            super(
                ErrorBase.Code.MISSING_PRIMARY_KEY,
                `The table '${table}' names the column '${column}' as primary key, but it does not exist.`
            );
            this.table = table;
            this.column = column;
        }
    }
}

export = PrimaryKeyResolver;

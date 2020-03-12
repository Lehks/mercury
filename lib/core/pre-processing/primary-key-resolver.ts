import { IDatabaseDefinition } from '../typings/database-definition';
import { ITable } from '../typings/table';
import ErrorBase from '../error-base';
import { ICompoundPrimaryKey } from '../typings/primary-key';

namespace PrimaryKeyResolver {
    export async function run(ddf: IDatabaseDefinition) {
        Object.values(ddf.databases).forEach(database => {
            Object.entries(database.tables).forEach(entry => {
                resolverPrimaryKeys(entry[1]);

                if (entry[1].primaryKey.length === 0) {
                    throw new MissingPrimaryKey(entry[0]);
                }
            });
        });
    }

    function resolverPrimaryKeys(table: ITable) {
        resolveOwnPrimaryKey(table);

        // resolve parent PKs and add parent PKs to this table
        if (table._parent) {
            resolverPrimaryKeys(table._parent);
            (table.primaryKey as ICompoundPrimaryKey).push(...(table._parent.primaryKey as ICompoundPrimaryKey));
        }
    }

    // turns any primary key in an array PK
    function resolveOwnPrimaryKey(table: ITable) {
        if (table.primaryKey === undefined) {
            table.primaryKey = [];
        } else if (typeof table.primaryKey == 'string') {
            table.primaryKey = [table.primaryKey];
        }
    }

    export class MissingPrimaryKey extends ErrorBase {
        public readonly table: string;

        public constructor(table: string) {
            super(ErrorBase.Code.MISSING_PRIMARY_KEY, `The table '${table}' does not contain a primary key.`);
            this.table = table;
        }
    }
}

export = PrimaryKeyResolver;

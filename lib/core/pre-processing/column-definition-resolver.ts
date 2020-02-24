import { IDatabaseDefinition } from '../typings/database-definition';
import { ITable } from '../typings/table';
import ErrorBase from '../error-base';
import _ from 'lodash';
import MultiError from '../multi-error';

namespace ColumnDefinitionResolver {
    export async function run(ddf: IDatabaseDefinition) {
        const errors = [] as ErrorBase[];

        Object.values(ddf.databases).forEach(database => {
            Object.values(database.tables).forEach(table => {
                try {
                    resolveColumnsInTable(ddf, table);
                } catch (error) {
                    errors.push(error);
                }
            });
        });

        if (errors.length > 0) {
            throw new MultiError(...errors);
        }
    }

    function resolveColumnsInTable(ddf: IDatabaseDefinition, table: ITable) {
        Object.entries(table.columns).forEach(entry => {
            const name = entry[0];
            const column = entry[1];

            if (typeof column === 'string') {
                const columnDefinition = ddf.columnDefinitions[column];

                if (columnDefinition) {
                    table.columns[name] = _.cloneDeep(columnDefinition);
                } else {
                    throw new InvalidColumDefinition(column);
                }
            }
        });

        if (table._parent) {
            resolveColumnsInTable(ddf, table._parent);
        }
    }

    export class InvalidColumDefinition extends ErrorBase {
        public readonly columnDefinition: string;

        public constructor(columDefinition: string) {
            super(ErrorBase.Code.INVALID_COLUMN_DEFINITION, `The column definition '${columDefinition}' is invalid.`);
            this.columnDefinition = columDefinition;
        }
    }
}

export = ColumnDefinitionResolver;

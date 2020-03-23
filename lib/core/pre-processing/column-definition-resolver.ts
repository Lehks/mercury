import _ from 'lodash';
import { IDatabaseDefinition } from '../typings/database-definition';
import { ITable } from '../typings/table';
import ErrorBase from '../errors/error-base';
import MultiError from '../errors/multi-error';
import logger from '../logger';

namespace ColumnDefinitionResolver {
    export async function run(ddf: IDatabaseDefinition): Promise<void> {
        const errors = [] as ErrorBase[];

        Object.entries(ddf.databases).forEach(databaseEntry => {
            logger.debug(`Resolving columns in database '${databaseEntry[0]}'.`);
            Object.entries(databaseEntry[1].tables).forEach(tableEntry => {
                try {
                    logger.debug(`Resolving columns in table '${tableEntry[0]}'.`);
                    resolveColumnsInTable(ddf, tableEntry[1]);
                } catch (error) {
                    errors.push(error);
                }
            });
        });

        if (errors.length > 0) {
            throw new MultiError(...errors);
        }
    }

    function resolveColumnsInTable(ddf: IDatabaseDefinition, table: ITable): void {
        Object.entries(table.columns).forEach(entry => {
            const name = entry[0];
            const column = entry[1];

            if (typeof column === 'string') {
                logger.debug(`Resolving column '${name}' to '${column}'.`);
                const columnDefinition = ddf.columnDefinitions[column];

                if (columnDefinition) {
                    table.columns[name] = _.cloneDeep(columnDefinition);
                } else {
                    throw new InvalidColumDefinition(column);
                }
            } else {
                logger.debug(`The column '${name}' does not need to be resolved.`);
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

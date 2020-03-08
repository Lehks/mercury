import { IDatabaseDefinition } from '../typings/database-definition';
import { ITable } from '../typings/table';
import ErrorBase from '../error-base';
import _ from 'lodash';
import MultiError from '../multi-error';
import logger from '../logger';

namespace TypeDefinitionResolver {
    export async function run(ddf: IDatabaseDefinition) {
        const errors = [] as ErrorBase[];

        Object.entries(ddf.databases).forEach(databaseEntry => {
            logger.debug(`Resolving types in database '${databaseEntry[0]}'.`);
            Object.entries(databaseEntry[1].tables).forEach(tableEntry => {
                try {
                    resolveTypesInTable(ddf, tableEntry[1], tableEntry[0]);
                } catch (error) {
                    errors.push(error);
                }
            });
        });

        if (errors.length > 0) {
            throw new MultiError(...errors);
        }
    }

    function resolveTypesInTable(ddf: IDatabaseDefinition, table: ITable, tableName: string) {
        logger.debug(`Resolving types in table '${tableName}'.`);
        Object.values(table.columns).forEach(column => {
            if (typeof column !== 'string') {
                if (typeof column.type === 'string') {
                    logger.debug(`Resolving type '${column.type}'.`);
                    const typeDefinition = ddf.typeDefinitions[column.type];

                    if (typeDefinition) {
                        column.type = _.cloneDeep(typeDefinition);
                    } else {
                        throw new InvalidTypeDefinition(column.type);
                    }
                } else {
                    logger.debug('The type does not need to be resolved.');
                }
            }
        });

        if (table._parent) {
            resolveTypesInTable(ddf, table._parent, table._parent._name);
        }
    }

    export class InvalidTypeDefinition extends ErrorBase {
        public readonly typeDefinition: string;

        public constructor(typeDefinition: string) {
            super(ErrorBase.Code.INVALID_TYPE_DEFINITION, `The type definition '${typeDefinition}' is invalid.`);
            this.typeDefinition = typeDefinition;
        }
    }
}

export = TypeDefinitionResolver;

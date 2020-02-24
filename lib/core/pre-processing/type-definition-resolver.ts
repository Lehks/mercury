import { IDatabaseDefinition } from '../typings/database-definition';
import { ITable } from '../typings/table';
import ErrorBase from '../error-base';
import _ from 'lodash';
import MultiError from '../multi-error';

namespace TypeDefinitionResolver {
    export async function run(ddf: IDatabaseDefinition) {
        const errors = [] as ErrorBase[];

        Object.values(ddf.databases).forEach(database => {
            Object.values(database.tables).forEach(table => {
                try {
                    resolveTypesInTable(ddf, table);
                } catch (error) {
                    errors.push(error);
                }
            });
        });

        if (errors.length > 0) {
            throw new MultiError(...errors);
        }
    }

    function resolveTypesInTable(ddf: IDatabaseDefinition, table: ITable) {
        Object.values(table.columns).forEach(column => {
            if (typeof column !== 'string') {
                if (typeof column.type === 'string') {
                    const typeDefinition = ddf.typeDefinitions[column.type];

                    if (typeDefinition) {
                        column.type = _.cloneDeep(typeDefinition);
                    } else {
                        throw new InvalidTypeDefinition(column.type);
                    }
                }
            }
        });

        if (table._parent) {
            resolveTypesInTable(ddf, table._parent);
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

import { IDatabaseDefinition } from '../typings/database-definition';
import ErrorBase from '../error-base';
import { ITable } from '../typings/table';
import MultiError from '../multi-error';
import _ from 'lodash';
import { IDatabase } from '../typings/database';

namespace PartialTableResolver {
    type Indices = {
        children: string[];
        columns: string[];
    };

    export async function run(ddf: IDatabaseDefinition) {
        const errors = [] as ErrorBase[];

        Object.values(ddf.databases).forEach(database => {
            database._partialTables = {};

            Object.entries(database.tables).forEach(entry => {
                try {
                    const children = [] as string[];
                    const columns = [] as string[];

                    processParentTable(ddf, database, entry[0], entry[1], { children, columns });
                } catch (error) {
                    errors.push(error);
                }
            });
        });

        if (errors.length > 0) {
            throw new MultiError(...errors);
        }
    }

    async function processParentTable(
        ddf: IDatabaseDefinition,
        database: IDatabase,
        tableName: string,
        table: ITable,
        indices: Indices
    ) {
        table._name = tableName;

        if (table.extends) {
            checkForCircularInheritance(indices, table);

            addPartialToDatabaseIndex(ddf, database, table, indices);

            const parentTable = database._partialTables[table.extends];

            if (parentTable) {
                indices.children.push(table.extends);

                table._parent = parentTable;
            } else {
                throw new InvalidPartialTableError(table.extends, tableName);
            }
        }

        // run this outside the if to also check tables that
        checkForDuplicateColumns(table, indices);
    }

    function checkForCircularInheritance(indices: Indices, table: ITable) {
        if (indices.children.includes(table.extends!)) {
            throw new CircularInheritanceError(table.extends!, indices.children);
        }
    }

    /*
     * Add the parent table of the passed table to the database._partialTables index (if it is not already on it).
     * Also processes the the base classes of the parent table
     */
    function addPartialToDatabaseIndex(ddf: IDatabaseDefinition, database: IDatabase, table: ITable, indices: Indices) {
        if (!Object.keys(database._partialTables).includes(table.extends!)) {
            const ddfParentTable = ddf.partialTables[table.extends!];

            if (ddfParentTable) {
                processParentTable(ddf, database, table.extends!, ddfParentTable, indices);
                database._partialTables[table.extends!] = _.cloneDeep(ddfParentTable);
            }
        }
    }

    function checkForDuplicateColumns(table: ITable, indices: Indices) {
        const columns = Object.keys(table.columns);

        for (const column of columns) {
            if (indices.columns.includes(column)) {
                throw new DuplicateColumnError(column);
            }

            indices.columns.push(column);
        }
    }

    export class InvalidPartialTableError extends ErrorBase {
        public readonly partialTable: string;
        public readonly usedIn: string;

        public constructor(partialTable: string, usedIn: string) {
            super(
                ErrorBase.Code.INVALID_PARTIAL_TABLE,
                `Partial table '${partialTable}' used in table '${usedIn}' does not exist.`
            );

            this.partialTable = partialTable;
            this.usedIn = usedIn;
        }
    }

    export class CircularInheritanceError extends ErrorBase {
        public readonly partialTable: string;
        public readonly tables: string[];

        public constructor(partialTable: string, tables: string[]) {
            super(
                ErrorBase.Code.CIRCULAR_INHERITANCE,
                `Partial table '${partialTable}' forms a circular inheritance chain with the tables '${tables}'.`
            );

            this.partialTable = partialTable;
            this.tables = tables;
        }
    }

    export class DuplicateColumnError extends ErrorBase {
        public readonly column: string;

        public constructor(column: string) {
            super(
                ErrorBase.Code.DUPLICATE_COLUMN,
                `The column '${column}' already exists in one of the parent tables.`
            );
            this.column = column;
        }
    }
}

export = PartialTableResolver;

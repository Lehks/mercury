import { IDatabaseDefinition } from '../typings/database-definition';
import { ITable } from '../typings/table';
import ErrorBase from '../errors/error-base';
import MultiError from '../errors/multi-error';
import { IForeignKey } from '../typings/foreign-key';
import { IDatabase } from '../typings/database';
import logger from '../logger';

namespace ForeignKeyResolver {
    export async function run(ddf: IDatabaseDefinition): Promise<void> {
        const errors = [] as ErrorBase[];

        Object.entries(ddf.databases).forEach(databaseEntry => {
            logger.debug(`Resolving foreign keys in database '${databaseEntry[0]}'.`);
            Object.entries(databaseEntry[1].tables).forEach(tableEntry => {
                try {
                    resolveForeignKeysInTable(ddf, databaseEntry[1], tableEntry[1], tableEntry[0]);
                } catch (error) {
                    errors.push(error);
                }
            });
        });

        if (errors.length > 0) {
            throw new MultiError(...errors);
        }
    }

    function resolveForeignKeysInTable(
        ddf: IDatabaseDefinition,
        database: IDatabase,
        table: ITable,
        tableName: string
    ): void {
        logger.debug(`Resolving foreign keys in table '${tableName}'.`);

        Object.entries(table.constraints.foreignKeys).forEach(entry => {
            logger.debug(`Resolving foreign key '${entry[0]}'.`);
            const name = entry[0];
            const foreignKey = entry[1];

            foreignKey._name = name;

            checkOn(table, foreignKey);
            checkSelfReference(table, foreignKey);
            checkReference(database, table, foreignKey);
        });

        if (table._parent) {
            resolveForeignKeysInTable(ddf, database, table._parent, table._parent._name);
        }
    }

    function checkSelfReference(table: ITable, foreignKey: IForeignKey): void {
        if (foreignKey.references.table === table._name) {
            throw new ForeignKeySelfReference(foreignKey._name, table._name);
        }
    }

    function checkOn(table: ITable, foreignKey: IForeignKey): void {
        if (!Object.keys(table.columns).includes(foreignKey.on)) {
            throw new InvalidForeignKeyOn(table._name, foreignKey);
        }
    }

    function checkReference(database: IDatabase, table: ITable, foreignKey: IForeignKey): void {
        if (!Object.keys(database.tables).includes(foreignKey.references.table)) {
            throw new InvalidForeignKeyTable(table._name, foreignKey);
        }

        const referencedTable = database.tables[foreignKey.references.table];

        if (!Object.keys(referencedTable.columns).includes(foreignKey.references.column)) {
            throw new InvalidForeignKeyColumn(table._name, foreignKey);
        }
    }

    export class InvalidForeignKeyOn extends ErrorBase {
        public readonly foreignKey: string;
        public readonly table: string;
        public readonly on: string;

        public constructor(table: string, foreignKey: IForeignKey) {
            super(
                ErrorBase.Code.INVALID_FOREIGN_KEY_ON,
                `The column '${foreignKey.on}' used in foreign key '${table}.${foreignKey._name}' does not exist.`
            );
            this.table = table;
            this.on = foreignKey.on;
            this.foreignKey = foreignKey._name;
        }
    }

    export class InvalidForeignKeyTable extends ErrorBase {
        public readonly table: string;
        public readonly foreignKey: string;
        public readonly referencedTable: string;

        public constructor(table: string, foreignKey: IForeignKey) {
            super(
                ErrorBase.Code.INVALID_FOREIGN_KEY_REFERENCE_TABLE,
                `The table '${foreignKey.references.table}' ` +
                    `referenced in foreign key '${table}.${foreignKey._name}' does not exist.`
            );
            this.table = table;
            this.foreignKey = foreignKey._name;
            this.referencedTable = foreignKey.references.table;
        }
    }

    export class InvalidForeignKeyColumn extends ErrorBase {
        public readonly table: string;
        public readonly foreignKey: string;
        public readonly referencedTable: string;
        public readonly referencedColumn: string;

        public constructor(table: string, foreignKey: IForeignKey) {
            super(
                ErrorBase.Code.INVALID_FOREIGN_KEY_REFERENCE_TABLE,
                `The column '${foreignKey.references.table}.${foreignKey.references.column}' ` +
                    `referenced in foreign key '${table}.${foreignKey._name}' does not exist.`
            );
            this.table = table;
            this.foreignKey = foreignKey._name;
            this.referencedTable = foreignKey.references.table;
            this.referencedColumn = foreignKey.references.column;
        }
    }

    export class ForeignKeySelfReference extends ErrorBase {
        public readonly foreignKey: string;
        public readonly table: string;

        public constructor(foreignKey: string, table: string) {
            super(
                ErrorBase.Code.FOREIGN_KEY_SELF_REFERENCE,
                `The foreign key '${table}.${foreignKey}' references its own table.`
            );
            this.foreignKey = foreignKey;
            this.table = table;
        }
    }
}

export = ForeignKeyResolver;

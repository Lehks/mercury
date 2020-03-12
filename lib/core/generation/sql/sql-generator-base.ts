import { IConcreteType } from '../../typings/type';
import { TriggerAction } from '../../typings/foreign-key';
import { IDatabase } from '../../typings/database';
import { ITable } from '../../typings/table';
import { IConcreteColumn } from '../../typings/column';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import logger from '../../logger';

abstract class SQLGeneratorBase {
    protected abstract async createDatabase(database: NS.IDatabase): Promise<string>;
    protected abstract async addTable(table: NS.ITable): Promise<string>;
    protected abstract async addColumn(table: NS.ITable, column: NS.IColumn): Promise<string>;
    protected abstract async addForeignKey(table: NS.ITable, foreignKey: NS.IForeignKey): Promise<string>;
    protected abstract async addPrimaryKey(table: NS.ITable, column: NS.IPKColumn): Promise<string>;

    public async run(name: string, database: IDatabase, outDir: string) {
        logger.debug(`Generating SQL for database '${name}'.`);

        logger.debug('Generating create database SQL.');
        const sql = [await this.createDatabase({ name: database.meta.rdbmsName })];
        logger.debug('Successfully generated create database SQL.');

        for (const tableName in database.tables) {
            const table = database.tables[tableName];

            logger.debug('Generating create tables SQL.');
            sql.push(await this.addTable({ name: table.meta.rdbmsName }));
            logger.debug('Successfully generated create tables SQL.');

            logger.debug('Generating create columns SQL.');
            sql.push(...(await this.generateColumns(table)));
            logger.debug('Successfully generated create columns SQL.');

            logger.debug('Generating create foreign keys SQL.');
            sql.push(...(await this.generateForeignKeys(table)));
            logger.debug('Successfully generated create foreign keys SQL.');

            logger.debug('Generating create primary keys SQL.');
            sql.push(...(await this.generatePrimaryKeys(table)));
            logger.debug('Successfully generated create primary keys SQL.');
        }

        await this.write(outDir, name, sql);
    }

    private async generateColumns(table: ITable, tableName: string = table.meta.rdbmsName): Promise<string[]> {
        const ret = [] as string[];

        for (const columnName in table.columns) {
            const column = table.columns[columnName] as IConcreteColumn;
            ret.push(
                await this.addColumn(
                    { name: tableName },
                    {
                        name: column.meta.rdbmsName,
                        nullable: column.nullable,
                        unique: column.unique,
                        type: column.type as IConcreteType
                    }
                )
            );
        }

        if (table._parent) {
            ret.push(...(await this.generateColumns(table._parent, tableName)));
        }

        return ret;
    }

    private async generateForeignKeys(table: ITable, tableName: string = table.meta.rdbmsName): Promise<string[]> {
        const ret = [] as string[];

        for (const foreignKeyName in table.constraints.foreignKeys) {
            const foreignKey = table.constraints.foreignKeys[foreignKeyName];
            ret.push(
                await this.addForeignKey(
                    { name: tableName },
                    {
                        name: foreignKeyName,
                        ...foreignKey
                    }
                )
            );
        }

        if (table._parent) {
            ret.push(...(await this.generateForeignKeys(table._parent, tableName)));
        }

        return ret;
    }

    private async generatePrimaryKeys(table: ITable): Promise<string[]> {
        const ret = [] as string[];

        for (const primaryKey of table.primaryKey) {
            ret.push(
                await this.addPrimaryKey(
                    { name: table.meta.rdbmsName },
                    {
                        name: primaryKey
                    }
                )
            );
        }

        return ret;
    }

    private async write(outDir: string, databaseName: string, sql: string[]) {
        await fs.promises.writeFile(path.join(outDir, `${databaseName}.sql`), sql.join('\n'));
    }
}

namespace SQLGeneratorBase {
    interface INamed {
        name: string;
    }

    export type IDatabase = INamed;
    export type ITable = INamed;

    export interface IColumn extends INamed {
        nullable: boolean;
        unique: boolean;
        type: IType;
    }

    export type IType = IConcreteType;

    export interface IForeignKey extends INamed {
        on: string;
        references: {
            table: string;
            column: string;
        };
        onUpdate: TriggerAction;
        onDelete: TriggerAction;
    }

    export type IPKColumn = INamed;
}

import NS = SQLGeneratorBase;

export = SQLGeneratorBase;

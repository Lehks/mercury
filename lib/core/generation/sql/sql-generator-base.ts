import fs from 'fs';
import { IConcreteType } from '../../typings/type';
import { TriggerAction } from '../../typings/foreign-key';
import { IDatabase } from '../../typings/database';
import { ITable } from '../../typings/table';
import { IConcreteColumn } from '../../typings/column';
import logger from '../../logger';
import Util from './util';

abstract class SQLGeneratorBase {
    public async run(name: string, database: IDatabase, outDir: string): Promise<void> {
        logger.debug(`Generating SQL for database '${name}'.`);

        logger.debug('Generating create database SQL.');
        const sql = [await this.createDatabase({ name: database.meta.rdbmsName })];
        logger.debug('Successfully generated create database SQL.');

        for (const tableName in database.tables) {
            if (tableName) {
                const table = database.tables[tableName];

                logger.debug('Generating create tables SQL.');
                sql.push(
                    await this.addTable({ database: { name: database.meta.rdbmsName }, name: table.meta.rdbmsName })
                );
                logger.debug('Successfully generated create tables SQL.');

                logger.debug('Generating create columns SQL.');
                sql.push(...(await this.generateColumns(table, database.meta.rdbmsName)));
                logger.debug('Successfully generated create columns SQL.');

                logger.debug('Generating create foreign keys SQL.');
                sql.push(...(await this.generateForeignKeys(table, database.meta.rdbmsName)));
                logger.debug('Successfully generated create foreign keys SQL.');

                logger.debug('Generating create primary keys SQL.');
                sql.push(...(await this.generatePrimaryKeys(table, database.meta.rdbmsName)));
                logger.debug('Successfully generated create primary keys SQL.');

                logger.debug('Running post add table step.');
                sql.push(
                    await this.postAddTable({ database: { name: database.meta.rdbmsName }, name: table.meta.rdbmsName })
                );
                logger.debug('Successfully ran post add table step.');
            }
        }

        await this.write(outDir, name, sql);
    }

    private async generateColumns(
        table: ITable,
        databaseName: string,
        tableName: string = table.meta.rdbmsName
    ): Promise<string[]> {
        const ret = [] as string[];
        for (const columnName in table.columns) {
            if (columnName) {
                const column = table.columns[columnName] as IConcreteColumn;
                ret.push(
                    await this.addColumn({
                        table: {
                            database: { name: databaseName },
                            name: tableName
                        },
                        name: column.meta.rdbmsName,
                        nullable: column.nullable,
                        unique: column.unique,
                        type: column.type as IConcreteType
                    })
                );
            }
        }

        if (table._parent) {
            ret.push(...(await this.generateColumns(table._parent, databaseName, tableName)));
        }

        return ret;
    }

    private async generateForeignKeys(
        table: ITable,
        databaseName: string,
        tableName: string = table.meta.rdbmsName
    ): Promise<string[]> {
        const ret = [] as string[];

        for (const foreignKeyName in table.constraints.foreignKeys) {
            if (foreignKeyName) {
                const foreignKey = table.constraints.foreignKeys[foreignKeyName];
                ret.push(
                    await this.addForeignKey({
                        table: {
                            database: { name: databaseName },
                            name: table.meta.rdbmsName
                        },
                        name: foreignKeyName,
                        ...foreignKey
                    })
                );
            }
        }

        if (table._parent) {
            ret.push(...(await this.generateForeignKeys(table._parent, databaseName, tableName)));
        }

        return ret;
    }

    private async generatePrimaryKeys(table: ITable, databaseName: string): Promise<string[]> {
        const ret = [] as string[];

        for (const primaryKey of table.primaryKey) {
            ret.push(
                await this.addPrimaryKey({
                    table: { database: { name: databaseName }, name: table.meta.rdbmsName },
                    name: primaryKey
                })
            );
        }

        return ret;
    }

    private async write(outDir: string, databaseName: string, sql: string[]): Promise<void> {
        await fs.promises.writeFile(Util.getSQLFilePath(outDir, databaseName), sql.join('\n'));
    }

    protected abstract async createDatabase(database: NS.IDatabase): Promise<string>;
    protected abstract async addTable(table: NS.ITable): Promise<string>;
    protected abstract async addColumn(column: NS.IColumn): Promise<string>;
    protected abstract async addForeignKey(foreignKey: NS.IForeignKey): Promise<string>;
    protected abstract async addPrimaryKey(column: NS.IPKColumn): Promise<string>;
    protected abstract async postAddTable(table: NS.ITable): Promise<string>;
}

namespace SQLGeneratorBase {
    interface INamed {
        name: string;
    }

    export type IDatabase = INamed;

    export interface ITable extends INamed {
        database: IDatabase;
    }

    export interface IColumn extends INamed {
        table: ITable;
        nullable: boolean;
        unique: boolean;
        type: IType;
    }

    export type IType = IConcreteType;

    export interface IForeignKey extends INamed {
        table: ITable;
        on: string;
        references: {
            table: string;
            column: string;
        };
        onUpdate: TriggerAction;
        onDelete: TriggerAction;
    }

    export interface IPKColumn extends INamed {
        table: ITable;
    }
}

import NS = SQLGeneratorBase;

export = SQLGeneratorBase;

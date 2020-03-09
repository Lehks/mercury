import { IConcreteType } from '../../typings/type';
import { TriggerAction } from '../../typings/foreign-key';
import { IDatabase } from '../../typings/database';
import { ITable } from '../../typings/table';
import { IConcreteColumn } from '../../typings/column';
import fs from 'fs';
import path from 'path';

interface Pair {
    name: string;
    database: string;
}

abstract class SQLGeneratorBase {
    protected abstract async generateDatabase(database: SQLGeneratorBase.IDatabase): Promise<string>;

    public async run(name: string, database: IDatabase, outDir: string) {
        const generatedDatabase = this.transformDatabase(database);

        await this.write(outDir, {
            name,
            database: await this.generateDatabase(generatedDatabase)
        });
    }

    private async write(outDir: string, pair: Pair) {
        await fs.promises.writeFile(path.join(outDir, `${pair.name}.sql`), pair.database);
    }

    private transformDatabase(database: IDatabase): SQLGeneratorBase.IDatabase {
        return {
            name: database.meta.rdbmsName,
            tables: this.transformTables(database)
        };
    }

    private transformTables(database: IDatabase): SQLGeneratorBase.ITable[] {
        return Object.values(database.tables).map<SQLGeneratorBase.ITable>(table => {
            return {
                name: table.meta.rdbmsName,
                columns: this.transformColumns(table),
                primaryKey: this.transformPrimaryKeys(table)
            };
        });
    }

    private transformColumns(table: ITable): SQLGeneratorBase.IColumn[] {
        return Object.values(table.columns).map<SQLGeneratorBase.IColumn>(column => {
            const col = column as IConcreteColumn;

            return {
                name: col.meta.rdbmsName,
                nullable: col.nullable,
                unique: col.unique,
                type: col.type as IConcreteType
            };
        });
    }

    private transformPrimaryKeys(table: ITable, ret: string[] = []): string[] {
        if (typeof table.primaryKey === 'string') {
            ret.push(table.primaryKey);
        } else {
            ret.push(...table.primaryKey);
        }

        if (table._parent) {
            this.transformPrimaryKeys(table._parent, ret);
        }

        return ret;
    }
}

namespace SQLGeneratorBase {
    export interface IDatabase {
        name: string;
        tables: ITable[];
    }

    export interface ITable {
        name: string;
        columns: IColumn[];
        primaryKey: string[];
    }

    export interface IColumn {
        name: string;
        nullable: boolean;
        unique: boolean;
        type: IType;
    }

    export type IType = IConcreteType;

    export interface IConstraints {
        foreignKeys: IForeignKey[];
    }

    export interface IForeignKey {
        name: string;
        on: string;
        references: {
            table: string;
            column: string;
        };
        onUpdate: TriggerAction;
        onDelete: TriggerAction;
    }
}

export = SQLGeneratorBase;

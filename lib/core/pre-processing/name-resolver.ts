import { IDatabaseDefinition } from '../typings/database-definition';
import { IConcreteColumn } from '../typings/column';
import { ITable } from '../typings/table';
import Meta from '../typings/meta';
import { camelCase, constantCase, pascalCase, snakeCase, paramCase } from 'change-case';
import { IDatabase } from '../typings/database';
import logger from '../logger';

namespace NameResolver {
    export async function run(ddf: IDatabaseDefinition) {
        Object.entries(ddf.databases).forEach(databaseEntry => {
            logger.debug(`Resolving names in database '${databaseEntry[0]}'.`);
            mergeIntoDatabaseConventions(ddf.meta.naming, databaseEntry[1].meta.naming);
            resolveDatabaseNames(databaseEntry[1], databaseEntry[0]);

            Object.entries(databaseEntry[1].tables).forEach(tableEntry => {
                logger.debug(`Resolving names in table '${tableEntry[0]}'.`);
                runForTable(databaseEntry[1], tableEntry[1], tableEntry[0]);
            });

            Object.entries(databaseEntry[1]._partialTables).forEach(tableEntry => {
                logger.debug(`Resolving names in partial table '${tableEntry[0]}'.`);
                runForTable(databaseEntry[1], tableEntry[1], tableEntry[0]);
            });
        });
    }

    function runForTable(database: IDatabase, table: ITable, tableName: string) {
        mergeIntoTableConventions(database.meta.naming, table.meta.naming);
        resolveTableNames(table, tableName);

        Object.entries(table.columns).forEach(columnEntry => {
            logger.debug(`Resolving names in column '${columnEntry[0]}'.`);
            const concreteColumn = columnEntry[1] as IConcreteColumn;

            mergeIntoColumnConventions(table.meta.naming, concreteColumn.meta.naming);
            resolveColumnNames(concreteColumn, columnEntry[0]);
        });
    }

    function resolveDatabaseNames(database: IDatabase, databaseName: string) {
        const conventions = database.meta.naming;

        if (!database.meta.moduleName) {
            database.meta.moduleName = convertName(databaseName, conventions.moduleNameConvention);
        }

        if (!database.meta.rdbmsName) {
            database.meta.rdbmsName = convertName(databaseName, conventions.rdbmsDatabaseNameConvention);
        }
    }

    function resolveTableNames(table: ITable, tableName: string) {
        const conventions = table.meta.naming;

        if (!table.meta.className) {
            table.meta.className = convertName(tableName, conventions.classNameConvention);
        }

        if (!table.meta.moduleName) {
            table.meta.moduleName = convertName(tableName, conventions.moduleNameConvention);
        }

        if (!table.meta.rdbmsName) {
            table.meta.rdbmsName = convertName(tableName, conventions.rdbmsTableNameConvention);
        }
    }

    function resolveColumnNames(column: IConcreteColumn, columnName: string) {
        const conventions = column.meta.naming;

        if (!column.meta.constantName) {
            column.meta.constantName = convertName(columnName, conventions.constantNameConvention);
        }

        if (!column.meta.getterName) {
            column.meta.getterName = convertName(makeGetterName(columnName), conventions.methodNameConvention);
        }

        if (!column.meta.setterName) {
            column.meta.setterName = convertName(makeSetterName(columnName), conventions.methodNameConvention);
        }

        if (!column.meta.rdbmsName) {
            column.meta.rdbmsName = convertName(columnName, conventions.rdbmsColumnNameConvention);
        }
    }

    function convertName(name: string, convention: Meta.NamingConvention): string {
        switch (convention) {
            case 'upper-camel-case':
                return pascalCase(name);
            case 'camel-case':
                return camelCase(name);
            case 'snake-case':
                return snakeCase(name);
            case 'constant-case':
                return constantCase(name);
            case 'minus-case':
                return paramCase(name);
        }
    }

    function makeGetterName(columnName: string): string {
        return `get ${columnName}`;
    }

    function makeSetterName(columnName: string): string {
        return `set ${columnName}`;
    }

    function mergeIntoDatabaseConventions(
        globalConventions: Meta.IGlobalLevelNamingConventions,
        databaseConventions: Meta.IDatabaseLevelNamingConventions
    ) {
        databaseConventions.rdbmsDatabaseNameConvention = mergeConvention(
            globalConventions.rdbmsDatabaseNameConvention,
            databaseConventions.rdbmsDatabaseNameConvention
        );

        mergeIntoTableConventions(globalConventions, databaseConventions);
    }

    function mergeIntoTableConventions(
        databaseConventions: Meta.IDatabaseLevelNamingConventions,
        tableConventions: Meta.ITableLevelNamingConventions
    ) {
        tableConventions.classNameConvention = mergeConvention(
            databaseConventions.classNameConvention,
            tableConventions.classNameConvention
        );

        tableConventions.moduleNameConvention = mergeConvention(
            databaseConventions.moduleNameConvention,
            tableConventions.moduleNameConvention
        );

        tableConventions.rdbmsTableNameConvention = mergeConvention(
            databaseConventions.rdbmsTableNameConvention,
            tableConventions.rdbmsTableNameConvention
        );

        mergeIntoColumnConventions(databaseConventions, tableConventions);
    }

    function mergeIntoColumnConventions(
        tableConventions: Meta.ITableLevelNamingConventions,
        columnConventions: Meta.IColumnLevelNamingConventions
    ) {
        columnConventions.constantNameConvention = mergeConvention(
            tableConventions.constantNameConvention,
            columnConventions.constantNameConvention
        );

        columnConventions.methodNameConvention = mergeConvention(
            tableConventions.methodNameConvention,
            columnConventions.methodNameConvention
        );

        columnConventions.rdbmsColumnNameConvention = mergeConvention(
            tableConventions.rdbmsColumnNameConvention,
            columnConventions.rdbmsColumnNameConvention
        );
    }

    function mergeConvention(
        convention: Meta.NamingConvention,
        override: Meta.NamingConvention
    ): Meta.NamingConvention {
        return override ? override : convention;
    }
}

export = NameResolver;

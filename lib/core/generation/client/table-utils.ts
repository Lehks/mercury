import ConnectionManager from '../../connection/connection-manager';
import Connection from '../../connection/connection';
import ConnectionDrivers from '../../connection/connection-drivers';

namespace TableUtils {
    export interface ITableFunctionData {
        connectionManager: ConnectionManager;
        table: string;
        primaryKeyNames: string[];
    }

    export type IMultiGetResult = ConnectionManager.IRow;
    export type IInsertData = ConnectionManager.IRow;

    export interface IColumnLiteralBase {
        rdbmsName: string;
        propertyName: string;
    }

    export type StringMap = { [key: string]: string };

    export interface IGenericMultiSetData {
        [key: string]: ConnectionManager.CellValue | undefined;
    }

    function getSQL(data: ITableFunctionData): ConnectionDrivers.ISQLQueries {
        return data.connectionManager.getDriver().getSQLQueries();
    }

    async function query(
        data: ITableFunctionData,
        sql: string,
        parameters: ConnectionManager.Parameters,
        connection?: Connection
    ): Promise<ConnectionManager.IQueryResult> {
        if (connection) {
            return connection.query(sql, parameters);
        } else {
            return data.connectionManager.query(sql, parameters);
        }
    }

    function rename(input: ConnectionManager.IRow, nameMap: StringMap): ConnectionManager.IRow {
        const ret: ConnectionManager.IRow = {};

        for (const inputKey in input) {
            if (input.hasOwnProperty(inputKey)) {
                const inputValue = input[inputKey];
                ret[nameMap[inputKey]] = inputValue;
            }
        }

        return ret;
    }

    export async function get<T extends ConnectionManager.CellValue>(
        data: ITableFunctionData,
        column: string,
        primaryKeyValues: ConnectionManager.CellValue[],
        connection?: Connection
    ): Promise<T> {
        const sql = await getSQL(data).getQuery(data.table, column, data.primaryKeyNames);
        const result = await query(data, sql, primaryKeyValues, connection);

        if (result.rows.length > 0) {
            return result.rows[0][column] as T;
        } else {
            throw new Error();
        }
    }

    export async function multiGetInternal<T>(
        data: ITableFunctionData,
        columns: string[],
        primaryKeyValues: ConnectionManager.CellValue[],
        nameMap: StringMap,
        connection?: Connection
    ): Promise<T> {
        const sql = await getSQL(data).multiGetQuery(data.table, columns, data.primaryKeyNames);
        const result = await query(data, sql, data.primaryKeyNames, connection);

        if (result.rows.length > 0) {
            return (rename(result.rows[0], nameMap) as unknown) as T;
        } else {
            throw new Error();
        }
    }

    export async function set<T extends ConnectionManager.CellValue>(
        data: ITableFunctionData,
        column: string,
        primaryKeyValues: ConnectionManager.CellValue[],
        value: T,
        connection?: Connection
    ): Promise<void> {
        const sql = await getSQL(data).setQuery(data.table, column, data.primaryKeyNames);
        const result = await query(data, sql, [value, ...primaryKeyValues], connection);

        if (result.affectedRows !== 1) {
            throw new Error();
        }
    }

    export async function multiSetInternal(
        data: ITableFunctionData,
        values: IGenericMultiSetData,
        primaryKeyValues: ConnectionManager.CellValue[],
        nameMap: StringMap,
        connection?: Connection
    ): Promise<void> {
        // remove possibility of 'undefined' values
        const row = values as ConnectionManager.IRow;

        const sql = await getSQL(data).multiSetQuery(
            data.table,
            Object.keys(rename(row, nameMap)),
            data.primaryKeyNames
        );
        const result = await query(data, sql, [...Object.values(row), ...primaryKeyValues], connection);

        if (result.affectedRows === 0) {
            throw new Error();
        }
    }

    // todo
    /*
    export function equalsInternal(data: ITableFunctionData, other: TableBase): boolean {
        return _.isEqual(data.primaryKeyNames, other.pkValues);
    }*/

    export async function exists(
        data: ITableFunctionData,
        primaryKeyValues: ConnectionManager.CellValue[],
        connection?: Connection
    ): Promise<boolean> {
        try {
            // simply query a column that exists and check if an error is thrown
            await get(data, data.primaryKeyNames[0], primaryKeyValues, connection);
            return true;
        } catch (error) {
            return false;
        }
    }

    export async function insert(
        data: ITableFunctionData,
        insertData: TableUtils.IInsertData,
        nameMap: TableUtils.StringMap,
        connection?: Connection
    ): Promise<ConnectionManager.IQueryResult> {
        const renamedData = rename(insertData, nameMap);

        const sql = await getSQL(data).insertQuery(data.table, Object.keys(renamedData));

        return query(data, sql, Object.values(renamedData), connection);
    }

    export async function deleteInternal(
        data: ITableFunctionData,
        primaryKeyValues: ConnectionManager.CellValue[],
        connection?: Connection
    ): Promise<void> {
        const sql = await getSQL(data).deleteQuery(data.table, data.primaryKeyNames);
        const result = await query(data, sql, data.primaryKeyNames, connection);

        if (result.affectedRows === 0) {
            throw new Error();
        }
    }
}

export = TableUtils;

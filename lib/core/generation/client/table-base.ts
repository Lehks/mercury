import _ from 'lodash';
import Connection from '../../connection/connection';
import ConnectionManager from '../../connection/connection-manager';
import ConnectionDrivers from '../../connection/connection-drivers';

function rename(input: ConnectionManager.IRow, nameMap: TableBase.StringMap): ConnectionManager.IRow {
    const ret: ConnectionManager.IRow = {};

    for (const inputKey in input) {
        if (input.hasOwnProperty(inputKey)) {
            const inputValue = input[inputKey];
            ret[nameMap[inputKey]] = inputValue;
        }
    }

    return ret;
}

function makePrimaryKeyArray(primaryKey: any): ConnectionManager.CellValue[] {
    if (
        typeof primaryKey === 'string' ||
        typeof primaryKey === 'number' ||
        typeof primaryKey === 'boolean' ||
        primaryKey === null ||
        primaryKey.constructor.name === 'Date' ||
        primaryKey.constructor.name === 'Buffer'
    ) {
        return [primaryKey];
    } else {
        return Object.values(primaryKey);
    }
}

abstract class TableBase<PrimaryKey = unknown> {
    public readonly primaryKey: PrimaryKey;

    protected readonly data: TableBase.ITableFunctionData;
    protected readonly primaryKeyValues: ConnectionManager.CellValue[];
    protected readonly rdbmsToPropertyNameMap: TableBase.StringMap;
    protected readonly propertyToRdbmsNameMap: TableBase.StringMap;

    protected constructor(
        data: TableBase.ITableFunctionData,
        primaryKey: PrimaryKey,
        rdbmsToPropertyNameMap: TableBase.StringMap,
        propertyToRdbmsNameMap: TableBase.StringMap
    ) {
        this.data = data;
        this.primaryKeyValues = makePrimaryKeyArray(primaryKey);
        this.rdbmsToPropertyNameMap = rdbmsToPropertyNameMap;
        this.propertyToRdbmsNameMap = propertyToRdbmsNameMap;

        this.primaryKey = primaryKey;
    }

    public equals(other: TableBase<PrimaryKey>): boolean {
        // make sure the table is the same and the primary key values
        return this.data.table === other.data.table && _.isEqual(this.data.primaryKeyNames, other.primaryKeyValues);
    }

    public async exists(connection?: Connection): Promise<boolean> {
        try {
            // simply query a column that exists and check if an error is thrown
            await this.get(this.data.primaryKeyNames[0], connection);
            return true;
        } catch (error) {
            return false;
        }
    }

    public async delete(connection?: Connection): Promise<void> {
        const sql = await this.getSQL().deleteQuery(this.data.table, this.data.primaryKeyNames);
        const result = await this.query(sql, this.primaryKeyValues, connection);

        if (result.affectedRows === 0) {
            throw new Error();
        }
    }

    protected async get<T extends ConnectionManager.CellValue>(column: string, connection?: Connection): Promise<T> {
        const sql = await this.getSQL().getQuery(this.data.table, [column], this.data.primaryKeyNames);
        const result = await this.query(sql, this.primaryKeyValues, connection);

        if (result.rows.length > 0) {
            return result.rows[0][column] as T;
        } else {
            throw new Error();
        }
    }

    protected async multiGetInternal<T>(columns: string[], connection?: Connection): Promise<T> {
        const sql = await this.getSQL().getQuery(this.data.table, columns, this.data.primaryKeyNames);
        const result = await this.query(sql, this.primaryKeyValues, connection);

        if (result.rows.length > 0) {
            return (rename(result.rows[0], this.rdbmsToPropertyNameMap) as unknown) as T;
        } else {
            throw new Error();
        }
    }

    protected async set<T extends ConnectionManager.CellValue>(
        data: TableBase.ITableFunctionData,
        column: string,
        primaryKeyValues: ConnectionManager.CellValue[],
        value: T,
        connection?: Connection
    ): Promise<void> {
        const sql = await this.getSQL().setQuery(data.table, [column], data.primaryKeyNames);
        const result = await this.query(sql, [value, ...primaryKeyValues], connection);

        if (result.affectedRows !== 1) {
            throw new Error();
        }
    }

    protected async multiSetInternal(values: TableBase.IGenericMultiSetData, connection?: Connection): Promise<void> {
        // remove possibility of 'undefined' values
        const row = values as ConnectionManager.IRow;

        const sql = await this.getSQL().setQuery(
            this.data.table,
            Object.keys(rename(row, this.propertyToRdbmsNameMap)),
            this.data.primaryKeyNames
        );
        const result = await this.query(sql, [...Object.values(row), ...this.primaryKeyValues], connection);

        if (result.affectedRows === 0) {
            throw new Error();
        }
    }

    private getSQL(): ConnectionDrivers.ISQLQueries {
        return this.data.connectionManager.getDriver().getSQLQueries();
    }

    private async query(
        sql: string,
        parameters: ConnectionManager.Parameters,
        connection?: Connection
    ): Promise<ConnectionManager.IQueryResult> {
        return TableBase.query(this.data, sql, parameters, connection);
    }
}

namespace TableBase {
    export interface ITableFunctionData {
        connectionManager: ConnectionManager;
        table: string;
        primaryKeyNames: string[];
    }

    export type IGenericInsertData = ConnectionManager.IRow;

    export interface IOwnColumnConstantBase {
        rdbmsName: string;
        propertyName: string;
    }

    export type IColumnConstantBase = never;

    export type StringMap = { [key: string]: string };

    export interface IGenericMultiSetData {
        [key: string]: ConnectionManager.CellValue | undefined;
    }

    export type IMultiGetResult = {
        // supposed to be empty
        // tables (or partial tables) will always construct their IMultiGetResult from that of their parent class
        // this empty interface needs to exist so that the end of the inheritance chain (i.e. the table that has this
        // class as parent) can still use this type to build its IMultiGetResult
    };

    export type IMultiSetData = {
        // supposed to be empty
        // tables (or partial tables) will always construct their IMultiSetData from that of their parent class
        // this empty interface needs to exist so that the end of the inheritance chain (i.e. the table that has this
        // class as parent) can still use this type to build its IMultiSetData
    };

    export type IInsertData = {
        // supposed to be empty
        // tables (or partial tables) will always construct their IInsertData from that of their parent class
        // this empty interface needs to exist so that the end of the inheritance chain (i.e. the table that has this
        // class as parent) can still use this type to build its IInsertData
    };

    export async function insertHelper(
        data: ITableFunctionData,
        insertData: TableBase.IGenericInsertData,
        propertyToRdbmsNameMap: StringMap,
        connection?: Connection
    ): Promise<ConnectionManager.IQueryResult> {
        const renamedData = rename(insertData, propertyToRdbmsNameMap);

        const sql = await data.connectionManager
            .getDriver()
            .getSQLQueries()
            .insertQuery(data.table, Object.keys(renamedData));

        return query(data, sql, Object.values(renamedData), connection);
    }

    export async function query(
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
}

export = TableBase;

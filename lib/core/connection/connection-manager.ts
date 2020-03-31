import { IDatabaseConnection } from '../typings/database-connection';
import NotInitializedError from '../errors/not-initialized-error';
import AlreadyInitializedError from '../errors/already-initialized-error';
import ConnectionDrivers from './connection-drivers';
import ConnectionDataProvider from './connection-data-provider';
import Connection from './connection';
import TransactionConnection from './transaction-connection';

class ConnectionManager {
    public driver?: ConnectionDrivers.IConnectionManagerDriver;
    public isInitialized: boolean;
    public isUsingDatabase: boolean;
    private readonly connectionData: IDatabaseConnection;
    private readonly type: 'default' | 'admin';
    private readonly databaseName: string;

    public constructor(connectionData: IDatabaseConnection, type: 'default' | 'admin', databaseName: string) {
        this.isInitialized = false;
        this.connectionData = connectionData;
        this.type = type;
        this.databaseName = databaseName;
        this.isUsingDatabase = false;
    }

    public async initialize(useDatabase = true): Promise<void> {
        if (!this.isInitialized) {
            // driver cannot be in the import stmt, this is not possible: await import(this.connectionData.driver)
            const driver = this.connectionData.driver;
            const imported = await import(driver);

            this.driver = new imported.ConnectionManagerDriver();
            const connectionDataProvider = new ConnectionDataProvider(
                this.connectionData,
                this.type,
                this.getDriver().getConnectionDataRequirements(),
                this.databaseName
            );

            await this.getDriver().initialize(await connectionDataProvider.getData());

            if (useDatabase) {
                await this.startUsingDatabase();
            }

            this.isInitialized = true;
        } else {
            throw new AlreadyInitializedError();
        }
    }

    public async terminate(): Promise<void> {
        if (this.isInitialized) {
            await this.getDriver().terminate();
        } else {
            throw new NotInitializedError();
        }
    }

    public async startUsingDatabase(): Promise<void> {
        await this.query(
            await this.getDriver()
                .getSQLQueries()
                .useDatabase(this.databaseName)
        );
        this.isUsingDatabase = true;
    }

    public async query(sql: string, params?: ConnectionManager.Parameters): Promise<ConnectionManager.IQueryResult> {
        return this.multiQuery(async conn => conn.query(sql, params));
    }

    public async multiQuery<T>(callback: ConnectionManager.QueryCallback<T>): Promise<T> {
        if (!this.isInitialized) {
            throw new NotInitializedError();
        }

        let conn: ConnectionDrivers.IConnectionDriver | null = null;

        try {
            conn = await this.getDriver().getConnection();
            const ret = await callback(new Connection(this, conn));
            await conn.end();
            return ret;
        } catch (error) {
            if (conn !== null) {
                await conn.end();
            }

            throw error;
        }
    }

    public async transaction<T>(callback: ConnectionManager.QueryCallback<T>): Promise<T> {
        if (!this.isInitialized) {
            throw new NotInitializedError();
        }

        let conn: ConnectionDrivers.IConnectionDriver | null = null;
        let requiresRollback = false;

        try {
            conn = await this.getDriver().getConnection();
            await conn.beginTransaction();
            requiresRollback = true;

            const ret = await callback(new Connection(this, conn));

            await conn.commitTransaction();
            await conn.end();
            return ret;
        } catch (error) {
            if (conn && requiresRollback) {
                await conn.rollbackTransaction();
            }

            if (conn !== null) {
                await conn.end();
            }

            throw error;
        }
    }

    public async beginTransaction(): Promise<TransactionConnection> {
        const driver = await this.getDriver().getConnection();
        const ret = new TransactionConnection(this, driver);
        await driver.beginTransaction();
        return ret;
    }

    public getDriver(): ConnectionDrivers.IConnectionManagerDriver {
        return this.driver!;
    }
}

namespace ConnectionManager {
    export type CellValue = string | number | boolean | Date | Buffer | null;
    export type Parameters = CellValue | CellValue[];
    export type QueryCallback<T> = (conn: Connection) => Promise<T>;

    export interface IRow {
        [key: string]: CellValue;
    }

    export interface IQueryResult {
        affectedRows: number;
        insertId: any;
        rows: IRow[];
    }
}

export = ConnectionManager;

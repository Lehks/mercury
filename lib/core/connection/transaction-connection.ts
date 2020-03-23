import Connection from './connection';

class TransactionConnection extends Connection {
    public async commit(): Promise<void> {
        await this.driver.commitTransaction();
        return this.driver.end();
    }

    public async rollback(): Promise<void> {
        await this.driver.rollbackTransaction();
        return this.driver.end();
    }
}

export = TransactionConnection;

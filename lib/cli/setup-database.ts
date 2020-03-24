import fs from 'fs';
import yargs from 'yargs';
import packageJSON from '../../package.json';
import logger from '../core/logger.js';
import ConnectionManager from '../core/connection/connection-manager';
import GeneratorUtil from '../core/generation/sql/util';
import PreProcessor from '../core/pre-processing/pre-processor';
import Util from './util';

namespace SetupDatabase {
    export function build(command: yargs.Argv): void {
        command
            .version(packageJSON.version)
            .option('verbosity', Util.makeVerbosityOption())
            .help()
            .alias('help', 'h')
            .alias('version', 'v');
    }

    export async function execute(argv: yargs.Arguments): Promise<void> {
        const filePath = Util.processPath(argv._[1] ? argv._[1] : 'database-definition.json');

        Util.setLoggingLevel(argv.verbosity as string);

        try {
            const ddf = await new PreProcessor(filePath).run();

            for (const databaseName in ddf.databases) {
                if (ddf.databases.hasOwnProperty(databaseName)) {
                    logger.debug(`Setting up database '${databaseName}'.`);
                    const database = ddf.databases[databaseName];

                    logger.debug('Initializing connection to database...');
                    const connectionManager = new ConnectionManager(database.connection, 'admin', databaseName);
                    await connectionManager.initialize(false);
                    logger.debug('Initialized connection to database.');

                    const statements = await loadSQLStatements(ddf.meta.sqlOutputDir, databaseName);

                    try {
                        await connectionManager.multiQuery(async conn => {
                            for (const statement of statements) {
                                await conn.query(statement);
                                logger.debug(`Executed '${statement}'.`);
                            }
                        });
                    } catch (error) {
                        logger.error(error);
                    } finally {
                        if (connectionManager.isInitialized) {
                            await connectionManager.terminate();
                        }
                    }

                    logger.debug(`Done setting up database '${databaseName}'.`);
                }
            }
        } catch (error) {
            logger.error(error);
        }
    }

    async function loadSQLStatements(sqlDir: string, databaseName: string): Promise<string[]> {
        const path = GeneratorUtil.getSQLFilePath(sqlDir, databaseName);
        logger.debug(`Loading SQL from '${path}'.`);
        const sql = await fs.promises.readFile(path, 'utf-8');
        const ret = sql.split('\n').filter(stmt => stmt.trim().length !== 0);
        logger.debug(`Loaded ${ret.length} statements.`);

        return ret;
    }
}

export = SetupDatabase;

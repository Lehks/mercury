import { IDatabaseDefinition } from '../../typings/database-definition';
import logger from '../../logger';
import SQLGeneratorBase from './sql-generator-base';

namespace SQLGenerator {
    export async function run(ddf: IDatabaseDefinition): Promise<void> {
        logger.info('Starting SQL generation.');
        for (const name in ddf.databases) {
            if (name) {
                logger.info(`Generating SQL from database '${name}'.`);
                const database = ddf.databases[name];

                logger.debug(`Using driver '${database.connection.driver}'.`);
                logger.debug(`Generating into '${ddf.meta.sqlOutputDir}'.`);
                const Generator = require(database.connection.driver).SQLGenerator;
                logger.debug('Successfully loaded driver.');

                const generator = new Generator() as SQLGeneratorBase;
                await generator.run(name, database, ddf.meta.sqlOutputDir);
            }
        }
        logger.info('SQL generation finished.');
    }
}

export = SQLGenerator;

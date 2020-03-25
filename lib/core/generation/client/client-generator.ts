import { IDatabaseDefinition } from '../../typings/database-definition';
import logger from '../../logger';
import JSGenerator from './js-generator';

namespace ClientGenerator {
    export async function run(ddf: IDatabaseDefinition): Promise<void> {
        logger.info('Starting client generation.');
        for (const name in ddf.databases) {
            if (name) {
                logger.info(`Generating client from database '${name}'.`);
                const database = ddf.databases[name];

                logger.debug(`Generating into '${ddf.meta.clientOutputDir}'.`);
                const generator = new JSGenerator();
                await generator.run(database, ddf.meta.clientOutputDir);
            }
        }
        logger.info('client generation finished.');
    }
}

export = ClientGenerator;

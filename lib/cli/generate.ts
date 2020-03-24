import yargs from 'yargs';
import packageJSON from '../../package.json';
import PreProcessor from '../core/pre-processing/pre-processor';
import logger from '../core/logger.js';
import SQLGenerator from '../core/generation/sql/sql-generator.js';
import Util from './util';

namespace Generate {
    export function build(command: yargs.Argv): void {
        command
            .version(packageJSON.version)
            .option('phase', {
                alias: 'p',
                choices: PreProcessor.ALL_PHASES,
                default: PreProcessor.ALL_PHASES[PreProcessor.ALL_PHASES.length - 1],
                description: 'Pre-Process until a certain phase, then exit. Used for debugging.'
            })
            .option('verbosity', {
                choices: ['silent', 'minimal', 'debug'],
                default: 'silent',
                description: 'Set logging level.'
            })
            .option('log-ddf', {
                alias: 'l',
                boolean: true,
                default: false,
                description: 'Log pre-processed DDF. Used for debugging.'
            })
            .help()
            .alias('help', 'h')
            .alias('version', 'v');
    }

    export async function execute(argv: yargs.Arguments): Promise<void> {
        const filePath = Util.processPath(argv._[1] ? argv._[1] : 'database-definition.json');

        Util.setLoggingLevel(argv.verbosity as string);

        try {
            const preProcessor = new PreProcessor(filePath);
            const ddf = await preProcessor.run(argv.phase as PreProcessor.Phase);

            if (argv.logDdf) {
                logger.info(JSON.stringify(ddf, null, 4));
            }

            await SQLGenerator.run(ddf);
        } catch (error) {
            logger.error(error);
        }
    }
}

export = Generate;

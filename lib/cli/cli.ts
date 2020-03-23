#!/bin/env node
import yargs from 'yargs';
import Generate from './generate';

yargs
    .command(
        '$0',
        'Shows help, when no sub-command is specified.',
        () => {
            // do nothing
        },
        () => {
            yargs.showHelp();
        }
    )
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    .command('generate', 'Generate a client from a DDF.', Generate.build, Generate.execute)
    .help()
    .alias('help', 'h')
    .alias('version', 'v')
    .parse();

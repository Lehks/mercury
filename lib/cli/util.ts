import path from 'path';
import yargs from 'yargs';
import logger from '../core/logger.js';

namespace Util {
    // turn 'dir/file.json' relatives paths into './dir/file.json'
    // required, b/c otherwise, the Loader will load from the wrong directory
    export function processPath(p: string): string {
        if (!path.isAbsolute(p) && !p.startsWith('.')) {
            return `.${path.sep}${p}`;
        }

        return p;
    }

    export function setLoggingLevel(level: string): void {
        switch (level) {
            case 'silent':
            default:
                logger.level = 'error';
                break;
            case 'minimal':
                logger.level = 'info';
                break;
            case 'debug':
                logger.level = 'debug';
                break;
        }
    }

    export function makeVerbosityOption(): yargs.Options {
        return {
            choices: ['silent', 'minimal', 'debug'],
            default: 'silent',
            description: 'Set logging level.'
        };
    }
}

export = Util;

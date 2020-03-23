import path from 'path';
import { IDatabaseDefinition } from '../typings/database-definition';
import ErrorBase from '../errors/error-base';
import logger from '../logger';

namespace Loader {
    export async function load(ddfPath: string, relativePath: string = process.cwd()): Promise<IDatabaseDefinition> {
        try {
            const actualPath = resolveIncludePath(ddfPath, relativePath);
            logger.debug(`Loading file from '${actualPath}'.`);

            const ret = (await import(actualPath)) as IDatabaseDefinition;

            // property inserted by import()
            delete (ret as any).default;

            ret._ddfPath = actualPath;
            return ret;
        } catch (error) {
            throw new FileNotFoundError(ddfPath);
        }
    }

    function resolveIncludePath(includePath: string, relativePath: string): string {
        if (path.isAbsolute(includePath)) {
            // absolute paths can be returned as-is
            return includePath;
        } else if (includePath.startsWith('.')) {
            // relative paths will be resolved
            return path.resolve(relativePath, includePath);
        } else {
            return resolveModulePath(includePath);
        }
    }

    function resolveModulePath(includePath: string): string {
        if (!includePath.includes(path.delimiter)) {
            // module names will replaced with <module name>/database-definition.json
            return path.join(includePath, 'database-definition.json');
        } else {
            // regular module-relative paths can be returned as-is
            return includePath;
        }
    }

    export class FileNotFoundError extends ErrorBase {
        public constructor(file: string) {
            super(ErrorBase.Code.FILE_NOT_FOUND, `File '${file}' could not be accessed.`);
        }
    }
}

export = Loader;

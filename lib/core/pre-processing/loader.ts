import { IDatabaseDefinition } from '../typings/database-definition';
import path from 'path';
import ErrorBase from '../error-base';

namespace Loader {
    export async function load(ddfPath: string, relativePath: string = process.cwd()): Promise<any> {
        try {
            const ret = (await import(resolveIncludePath(ddfPath, relativePath))) as IDatabaseDefinition;
            delete (ret as any).default;
            ret._ddfPath = ddfPath;
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

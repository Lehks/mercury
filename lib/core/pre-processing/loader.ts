import { IDatabaseDefinition } from '../typings/database-definition';
import path from 'path';
import ErrorBase from '../error-base';

namespace Loader {
    export async function load(ddfPath: string): Promise<any> {
        try {
            const ret = (await import(ddfPath)) as IDatabaseDefinition;
            ret._ddfPath = ddfPath;
            return ret;
        } catch (error) {
            throw new FileNotFoundError(ddfPath);
        }
    }

    export class FileNotFoundError extends ErrorBase {
        public constructor(file: string) {
            super(ErrorBase.Code.FILE_NOT_FOUND, `File '${file}' could not be accessed.`);
        }
    }
}

export = Loader;

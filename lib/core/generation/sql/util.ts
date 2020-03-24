import path from 'path';

namespace Util {
    export function getSQLFilePath(outDir: string, databaseName: string): string {
        return path.join(outDir, `${databaseName}.sql`);
    }
}

export = Util;

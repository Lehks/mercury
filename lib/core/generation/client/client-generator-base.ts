import fs from 'fs';
import path from 'path';
import { ITable } from '../../typings/table';
import { IDatabase } from '../../typings/database';
import logger from '../../logger';

type TableModulesList = { name: string; code: ClientGeneratorBase.IModuleCode }[];
type DatabaseTableList = { [key: string]: ITable };

abstract class ClientGeneratorBase {
    public async run(database: IDatabase, outDir: string): Promise<void> {
        logger.debug('Generating connection module.');
        const connectionModule = await this.generateConnectionModule(database);
        logger.debug('Done generating connection module.');

        logger.debug('Generating table modules.');
        const tableModules = await this.generateTableModules(database.tables, database);
        logger.debug('Done generating table modules.');

        logger.debug('Generating partial table modules.');
        const partialTableModules = await this.generatePartialTableModules(database._partialTables);
        logger.debug('Done generating partial table modules.');

        logger.debug('Generating query builder module.');
        const queryBuilderModule = await this.generateQueryBuilderModule(database);
        logger.debug('Done generating query builder module.');

        const moduleSubdirectory = path.join(outDir, database.meta.moduleName);

        logger.debug('Writing connection module.');
        await this.write(outDir, database.meta.moduleName, connectionModule);
        logger.debug('Done writing connection module.');

        logger.debug('Writing table modules.');
        await this.writeModules(moduleSubdirectory, tableModules);
        logger.debug('Done writing table modules.');

        logger.debug('Writing partial table modules.');
        await this.writeModules(moduleSubdirectory, partialTableModules);
        logger.debug('Done writing partial table modules.');

        logger.debug('Writing query builder module.');
        await this.write(moduleSubdirectory, 'query-builder', queryBuilderModule);
        logger.debug('Done writing query builder module.');
    }

    private async generateTableModules(tables: DatabaseTableList, database: IDatabase): Promise<TableModulesList> {
        const ret: TableModulesList = [];

        for (const tableName in tables) {
            if (tables.hasOwnProperty(tableName)) {
                const table = tables[tableName];

                ret.push({
                    name: table.meta.moduleName,
                    code: await this.generateTableModule(table, database)
                });
            }
        }

        return ret;
    }

    private async generatePartialTableModules(tables: DatabaseTableList): Promise<TableModulesList> {
        const ret: TableModulesList = [];

        for (const tableName in tables) {
            if (tables.hasOwnProperty(tableName)) {
                const table = tables[tableName];

                ret.push({
                    name: table.meta.moduleName,
                    code: await this.generatePartialTableModule(table)
                });
            }
        }

        return ret;
    }

    private async write(outDir: string, fileName: string, module: ClientGeneratorBase.IModuleCode): Promise<void> {
        const jsPath = path.join(outDir, `${fileName}.js`);
        const typingsPath = path.join(outDir, `${fileName}.d.ts`);
        logger.debug(`Writing module into files '${jsPath}' and '${typingsPath}'.`);
        await fs.promises.mkdir(path.dirname(jsPath), { recursive: true });
        await fs.promises.writeFile(jsPath, module.js);
        await fs.promises.writeFile(typingsPath, module.typings);
    }

    private async writeModules(outDir: string, modules: TableModulesList): Promise<void> {
        for (const module of modules) {
            await this.write(outDir, module.name, module.code);
        }
    }
    protected abstract async generateConnectionModule(database: IDatabase): Promise<ClientGeneratorBase.IModuleCode>;
    protected abstract async generateTableModule(
        table: ITable,
        database: IDatabase
    ): Promise<ClientGeneratorBase.IModuleCode>;
    protected abstract async generatePartialTableModule(table: ITable): Promise<ClientGeneratorBase.IModuleCode>;
    protected abstract async generateQueryBuilderModule(database: IDatabase): Promise<ClientGeneratorBase.IModuleCode>;
}

namespace ClientGeneratorBase {
    export interface IModuleCode {
        js: string;
        typings: string;
    }
}

export = ClientGeneratorBase;

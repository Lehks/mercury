import path from 'path';
import { IDatabaseDefinition } from '../typings/database-definition';
import ErrorBase from '../errors/error-base';
import MultiError from '../errors/multi-error';
import Meta from '../typings/meta';
import logger from '../logger';
import Loader from './loader';
import Validator from './validator';

namespace IncludeResolver {
    type IDatabaseDef = IDatabaseDefinition;

    export async function run(ddf: IDatabaseDef): Promise<void> {
        // start with _ddfPath in array to avoid the re-inclusion of the root ddf
        const processedIncludes = [ddf._ddfPath] as string[];

        return runWrapper(ddf, processedIncludes);
    }

    async function runWrapper(ddf: IDatabaseDef, processedIncludes: string[]): Promise<void> {
        for (const includePath of ddf.includes) {
            logger.debug(`Resolving include file '${includePath}'.`);

            // already load ddf to access the _ddfPath
            const includeDDF = await Loader.load(includePath, path.dirname(ddf._ddfPath));

            if (!processedIncludes.includes(includeDDF._ddfPath)) {
                logger.debug('Include file has not yet been processed.');
                processedIncludes.push(includeDDF._ddfPath);

                logger.debug('Validating include file.');
                await Validator.run(includeDDF);
                removeMetaObjects(includeDDF);
                await runWrapper(includeDDF, processedIncludes);

                mergeInto(includeDDF, ddf);
            } else {
                logger.debug('Include file has already been processed.');
            }
        }
    }

    // override all meta objects in included DDFs with {naming:{}}
    function removeMetaObjects(ddf: IDatabaseDef): void {
        ddf.meta = {
            naming: {} as Meta.IGlobalLevelNamingConventions
        } as Meta.IGlobalMeta;

        Object.values(ddf.databases).forEach(database => {
            database.meta = {
                naming: {} as Meta.IDatabaseLevelNamingConventions
            } as Meta.IDatabaseMeta;

            Object.values(database.tables).forEach(table => {
                table.meta = {
                    naming: {} as Meta.ITableLevelNamingConventions
                } as Meta.ITableMeta;

                Object.values(table.columns).forEach(column => {
                    if (typeof column !== 'string') {
                        column.meta = {
                            naming: {} as Meta.IColumnLevelNamingConventions
                        } as Meta.IColumnMeta;
                    }
                });
            });
        });
    }

    function mergeInto(source: IDatabaseDef, destination: IDatabaseDef): void {
        checkIfDDFsCanBeMerged(source, destination);
        mergeDDFs(source, destination);
    }

    function checkIfDDFsCanBeMerged(source: IDatabaseDef, destination: IDatabaseDef): void {
        const errors = [] as ErrorBase[];

        checkDuplicateDatabases(source, destination, errors);
        checkDuplicateColumnDefinitions(source, destination, errors);
        checkDuplicateTypeDefinitions(source, destination, errors);
        checkDuplicatePartialTables(source, destination, errors);

        if (errors.length !== 0) {
            throw new MultiError(...errors);
        }
    }

    function checkDuplicateDatabases(source: IDatabaseDef, destination: IDatabaseDef, errors: ErrorBase[]): void {
        const sourceDatabases = Object.keys(source.databases);
        const destinationDatabases = Object.keys(destination.databases);

        const duplicateDatabases = sourceDatabases.filter(db => destinationDatabases.includes(db));

        if (duplicateDatabases.length !== 0) {
            duplicateDatabases.forEach(db => errors.push(new DuplicateDatabaseError(db, source, destination)));
        }
    }

    function checkDuplicateColumnDefinitions(
        source: IDatabaseDef,
        destination: IDatabaseDef,
        errors: ErrorBase[]
    ): void {
        const sourceColDefs = Object.keys(source.columnDefinitions);
        const destinationColDefs = Object.keys(destination.columnDefinitions);

        const duplicateColDefs = sourceColDefs.filter(def => destinationColDefs.includes(def));

        if (duplicateColDefs.length !== 0) {
            duplicateColDefs.forEach(def => errors.push(new DuplicateColumnDefinitionError(def, source, destination)));
        }
    }

    function checkDuplicateTypeDefinitions(source: IDatabaseDef, destination: IDatabaseDef, errors: ErrorBase[]): void {
        const sourceTypeDefs = Object.keys(source.typeDefinitions);
        const destinationTypeDefs = Object.keys(destination.typeDefinitions);

        const duplicateTypeDefs = sourceTypeDefs.filter(def => destinationTypeDefs.includes(def));

        if (duplicateTypeDefs.length !== 0) {
            duplicateTypeDefs.forEach(def => errors.push(new DuplicateTypeDefinitionError(def, source, destination)));
        }
    }

    function checkDuplicatePartialTables(source: IDatabaseDef, destination: IDatabaseDef, errors: ErrorBase[]): void {
        const sourcePartialTables = Object.keys(source.partialTables);
        const destinationPartialTables = Object.keys(destination.partialTables);

        const duplicatePartialTables = sourcePartialTables.filter(table => destinationPartialTables.includes(table));

        if (duplicatePartialTables.length !== 0) {
            duplicatePartialTables.forEach(table =>
                errors.push(new DuplicatePartialTableError(table, source, destination))
            );
        }
    }

    function mergeDDFs(source: IDatabaseDef, destination: IDatabaseDef): void {
        for (const sourceDatabase in source.databases) {
            if (sourceDatabase) {
                destination.databases[sourceDatabase] = source.databases[sourceDatabase];
            }
        }

        for (const sourceColDefs in source.columnDefinitions) {
            if (sourceColDefs) {
                destination.columnDefinitions[sourceColDefs] = source.columnDefinitions[sourceColDefs];
            }
        }

        for (const sourceTypeDefs in source.typeDefinitions) {
            if (sourceTypeDefs) {
                destination.typeDefinitions[sourceTypeDefs] = source.typeDefinitions[sourceTypeDefs];
            }
        }

        for (const sourcePartialTables in source.partialTables) {
            if (sourcePartialTables) {
                destination.partialTables[sourcePartialTables] = source.partialTables[sourcePartialTables];
            }
        }
    }

    export class DuplicateDatabaseError extends ErrorBase {
        public constructor(database: string, source: IDatabaseDef, destination: IDatabaseDef) {
            super(
                ErrorBase.Code.INCLUDE_DUPLICATE_DATABASE,
                `Database '${database}' exists in both the DDFs ${source._ddfPath} and ${destination._ddfPath}.`
            );
        }
    }

    export class DuplicateColumnDefinitionError extends ErrorBase {
        public constructor(columnDefinition: string, source: IDatabaseDef, destination: IDatabaseDef) {
            super(
                ErrorBase.Code.INCLUDE_DUPLICATE_DATABASE,
                `Column definition '${columnDefinition}' exists in both` +
                    ` the DDFs ${source._ddfPath} and ${destination._ddfPath}.`
            );
        }
    }

    export class DuplicateTypeDefinitionError extends ErrorBase {
        public constructor(typeDefinition: string, source: IDatabaseDef, destination: IDatabaseDef) {
            super(
                ErrorBase.Code.INCLUDE_DUPLICATE_DATABASE,
                `Type definition '${typeDefinition}' exists in both` +
                    ` the DDFs ${source._ddfPath} and ${destination._ddfPath}.`
            );
        }
    }

    export class DuplicatePartialTableError extends ErrorBase {
        public constructor(partialTable: string, source: IDatabaseDef, destination: IDatabaseDef) {
            super(
                ErrorBase.Code.INCLUDE_DUPLICATE_DATABASE,
                `Partial table '${partialTable}' exists in both` +
                    ` the DDFs ${source._ddfPath} and ${destination._ddfPath}.`
            );
        }
    }
}

export = IncludeResolver;

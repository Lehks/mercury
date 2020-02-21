import { IDatabaseDefinition } from '../typings/database-definition';
import Validator from './validator';
import ErrorBase from '../error-base';
import Loader from './loader';
import MultiError from '../multi-error';
import path from 'path';

namespace IncludeResolver {
    type IDatabaseDef = IDatabaseDefinition;

    export async function resolveIncludes(ddf: IDatabaseDef) {
        const processedIncludes = [] as string[];

        return resolveIncludesWrapper(ddf, processedIncludes);
    }

    async function resolveIncludesWrapper(ddf: IDatabaseDef, processedIncludes: string[]) {
        for (const includePath of ddf.includes) {
            if (processedIncludes.includes(includePath)) {
                processedIncludes.push(includePath);

                const include = Loader.load(resolveIncludePath(includePath, ddf));
                const validated = await Validator.validateDDF(include);
                await resolveIncludesWrapper(validated, processedIncludes);

                mergeInto(validated, ddf);
            }
        }
    }

    function resolveIncludePath(includePath: string, ddf: IDatabaseDef): string {
        if (path.isAbsolute(includePath)) {
            // absolute paths can be returned as-is
            return includePath;
        } else if (includePath.startsWith('.')) {
            // relative paths will be resolved relative to the location of the ddf that they were included from
            return path.resolve(path.dirname(ddf._ddfPath), includePath);
        } else if (!includePath.includes('/') && !includePath.includes('\\')) {
            // module names will replaced with <module name>/database-definition.json
            return path.join(includePath, 'database-definition.json');
        } else {
            // regular module-relative paths can be returned as-is
            return includePath;
        }
    }

    function mergeInto(source: IDatabaseDef, destination: IDatabaseDef) {
        checkIfDDFsCanBeMerged(source, destination);
        mergeDDFs(source, destination);
    }

    function checkIfDDFsCanBeMerged(source: IDatabaseDef, destination: IDatabaseDef) {
        const errors = [] as ErrorBase[];

        checkDuplicateDatabases(source, destination, errors);
        checkDuplicateColumnDefinitions(source, destination, errors);
        checkDuplicateTypeDefinitions(source, destination, errors);
        checkDuplicatePartialTables(source, destination, errors);

        if (errors.length != 0) {
            throw new MultiError(...errors);
        }

        return true;
    }

    function checkDuplicateDatabases(source: IDatabaseDef, destination: IDatabaseDef, errors: ErrorBase[]) {
        const sourceDatabases = Object.keys(source.databases);
        const destinationDatabases = Object.keys(destination.databases);

        const duplicateDatabases = sourceDatabases.filter(db => destinationDatabases.includes(db));

        if (duplicateDatabases.length != 0) {
            duplicateDatabases.forEach(db => errors.push(new DuplicateDatabaseError(db, source, destination)));
        }
    }

    function checkDuplicateColumnDefinitions(source: IDatabaseDef, destination: IDatabaseDef, errors: ErrorBase[]) {
        const sourceColDefs = Object.keys(source.columnDefinitions);
        const destinationColDefs = Object.keys(destination.columnDefinitions);

        const duplicateColDefs = sourceColDefs.filter(def => destinationColDefs.includes(def));

        if (duplicateColDefs.length != 0) {
            duplicateColDefs.forEach(def => errors.push(new DuplicateColumnDefinitionError(def, source, destination)));
        }
    }

    function checkDuplicateTypeDefinitions(source: IDatabaseDef, destination: IDatabaseDef, errors: ErrorBase[]) {
        const sourceTypeDefs = Object.keys(source.typeDefs);
        const destinationTypeDefs = Object.keys(destination.typeDefs);

        const duplicateTypeDefs = sourceTypeDefs.filter(def => destinationTypeDefs.includes(def));

        if (duplicateTypeDefs.length != 0) {
            duplicateTypeDefs.forEach(def => errors.push(new DuplicateTypeDefinitionError(def, source, destination)));
        }
    }

    function checkDuplicatePartialTables(source: IDatabaseDef, destination: IDatabaseDef, errors: ErrorBase[]) {
        const sourcePartialTables = Object.keys(source.partialTables);
        const destinationPartialTables = Object.keys(destination.partialTables);

        const duplicatePartialTables = sourcePartialTables.filter(table => destinationPartialTables.includes(table));

        if (duplicatePartialTables.length != 0) {
            duplicatePartialTables.forEach(table =>
                errors.push(new DuplicatePartialTableError(table, source, destination))
            );
        }
    }

    function mergeDDFs(source: IDatabaseDef, destination: IDatabaseDef) {
        for (const sourceDatabase in source.databases) {
            destination.databases[sourceDatabase] = source.databases[sourceDatabase];
        }

        for (const sourceColDefs in source.columnDefinitions) {
            destination.columnDefinitions[sourceColDefs] = source.columnDefinitions[sourceColDefs];
        }

        for (const sourceTypeDefs in source.typeDefs) {
            destination.typeDefs[sourceTypeDefs] = source.typeDefs[sourceTypeDefs];
        }

        for (const sourcePartialTables in source.partialTables) {
            destination.partialTables[sourcePartialTables] = source.partialTables[sourcePartialTables];
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
                `Column definition '${columnDefinition}' exists in both the DDFs ${source._ddfPath} and ${destination._ddfPath}.`
            );
        }
    }

    export class DuplicateTypeDefinitionError extends ErrorBase {
        public constructor(typeDefinition: string, source: IDatabaseDef, destination: IDatabaseDef) {
            super(
                ErrorBase.Code.INCLUDE_DUPLICATE_DATABASE,
                `Type definition '${typeDefinition}' exists in both the DDFs ${source._ddfPath} and ${destination._ddfPath}.`
            );
        }
    }

    export class DuplicatePartialTableError extends ErrorBase {
        public constructor(partialTable: string, source: IDatabaseDef, destination: IDatabaseDef) {
            super(
                ErrorBase.Code.INCLUDE_DUPLICATE_DATABASE,
                `Partial table '${partialTable}' exists in both the DDFs ${source._ddfPath} and ${destination._ddfPath}.`
            );
        }
    }
}

export = IncludeResolver;

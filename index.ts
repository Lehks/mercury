import logger from './lib/core/logger';
import ErrorBase from './lib/core/errors/error-base';
import MultiError from './lib/core/errors/multi-error';

import ColumnDefinitionResolver from './lib/core/pre-processing/column-definition-resolver';
import ForeignKeyResolver from './lib/core/pre-processing/foreign-key-resolver';
import IncludeResolver from './lib/core/pre-processing/include-resolver';
import Loader from './lib/core/pre-processing/loader';
import NameResolver from './lib/core/pre-processing/name-resolver';
import PartialTableResolver from './lib/core/pre-processing/partial-table-resolver';
import PreProcessor from './lib/core/pre-processing/pre-processor';
import TypeChecker from './lib/core/pre-processing/type-checker';
import TypeDefinitionResolver from './lib/core/pre-processing/type-definition-resolver';
import Validator from './lib/core/pre-processing/validator';

import SQLGeneratorBase from './lib/core/generation/sql/sql-generator-base';

export = {
    core: {
        generation: {
            sql: {
                SQLGeneratorBase
            }
        },
        preProcessing: {
            ColumnDefinitionResolver,
            ForeignKeyResolver,
            IncludeResolver,
            Loader,
            NameResolver,
            PartialTableResolver,
            PreProcessor,
            TypeChecker,
            TypeDefinitionResolver,
            Validator
        },
        ErrorBase,
        logger,
        MultiError
    }
};

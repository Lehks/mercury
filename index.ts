import logger from './lib/core/logger';
import ErrorBase from './lib/core/error-base';
import MultiError from './lib/core/multi-error';

import ColumnDefinitionResolver from './lib/core/pre-processing/column-definition-resolver';
import ForeignKeyResolver from './lib/core/pre-processing/column-definition-resolver';
import IncludeResolver from './lib/core/pre-processing/column-definition-resolver';
import Loader from './lib/core/pre-processing/column-definition-resolver';
import NameResolver from './lib/core/pre-processing/column-definition-resolver';
import PartialTableResolver from './lib/core/pre-processing/column-definition-resolver';
import PreProcessor from './lib/core/pre-processing/column-definition-resolver';
import TypeChecker from './lib/core/pre-processing/column-definition-resolver';
import TypeDefinitionResolver from './lib/core/pre-processing/column-definition-resolver';
import Validator from './lib/core/pre-processing/column-definition-resolver';

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

import path from 'path';
import Ajv from 'ajv';
import { IDatabaseDefinition } from '../typings/database-definition';
import ErrorBase from '../errors/error-base';
import MultiError from '../errors/multi-error';

namespace Validator {
    // __dirname / pre-processing / core / lib / dist
    const PROJECT_ROOT = path.join(__dirname, '..', '..', '..', '..');
    const SCHEMA_LOCATION = path.join(PROJECT_ROOT, 'res', 'schema');

    const SCHEMA_FILES = [
        './database-definition.schema.json',
        './table.schema.json',
        './constraints.schema.json',
        './column.schema.json',
        './database-connection.schema.json',
        './type.schema.json',
        './types/string.schema.json',
        './types/floating-point.schema.json',
        './types/boolean.schema.json',
        './types/integer.schema.json',
        './types/temporal.schema.json',
        './types/enum.schema.json',
        './primary-key.schema.json',
        './meta.schema.json',
        './connection-credentials.schema.json',
        './foreign-key.schema.json',
        './database.schema.json'
    ];

    export async function run(ddf: IDatabaseDefinition): Promise<void> {
        const ajv = await setupAjv();
        const validate = getValidateFunction(ajv);

        const valid = validate(ddf);

        if (valid) {
            await Object.assign(ddf, valid);
        } else {
            throw new MultiError(...validate.errors!.map(e => new ValidationError(e)));
        }
    }

    async function loadSchema(file: string): Promise<any> {
        return import(path.join(SCHEMA_LOCATION, file));
    }

    async function setupAjv(): Promise<Ajv.Ajv> {
        return new Ajv({
            useDefaults: true,
            schemas: await Promise.all(SCHEMA_FILES.map(async file => loadSchema(file)))
        });
    }

    function getValidateFunction(ajv: Ajv.Ajv): Ajv.ValidateFunction {
        return ajv.getSchema('http://lehks.github.com/mercury-js/schemas/database-definition.schema.json');
    }

    export class ValidationError extends ErrorBase {
        public readonly errorObject: Ajv.ErrorObject;

        public constructor(error: Ajv.ErrorObject) {
            super(ErrorBase.Code.VALIDATION_ERROR, error.message!);
            this.errorObject = error;
        }
    }
}

export = Validator;

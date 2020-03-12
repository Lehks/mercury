import Loader from './loader';
import Validator from './validator';
import IncludeResolver from './include-resolver';
import PartialTableResolver from './partial-table-resolver';
import ColumnDefinitionResolver from './column-definition-resolver';
import ForeignKeyResolver from './foreign-key-resolver';
import TypeChecker from './type-checker';
import NameResolver from './name-resolver';
import { IDatabaseDefinition } from '../typings/database-definition';
import logger from '../logger';
import TypeDefinitionResolver from './type-definition-resolver';
import PrimaryKeyResolver from './primary-key-resolver';

class PreProcessor {
    // all phases, in order of execution
    public static readonly ALL_PHASES = [
        'validate-ddf',
        'resolve-includes',
        'resolve-partial-tables',
        'resolve-column-definitions',
        'resolve-type-definitions',
        'resolve-foreign-keys',
        'resolve-primary-keys',
        'type-checks',
        'resolve-names'
    ] as PreProcessor.Phase[];

    private static readonly PHASE_MAP = {
        'validate-ddf': Validator.run,
        'resolve-includes': IncludeResolver.run,
        'resolve-partial-tables': PartialTableResolver.run,
        'resolve-column-definitions': ColumnDefinitionResolver.run,
        'resolve-type-definitions': TypeDefinitionResolver.run,
        'resolve-foreign-keys': ForeignKeyResolver.run,
        'resolve-primary-keys': PrimaryKeyResolver.run,
        'type-checks': TypeChecker.run,
        'resolve-names': NameResolver.run
    };

    public readonly path: string;

    public constructor(path: string) {
        this.path = path;
    }

    public async run(lastPhase: PreProcessor.Phase = 'resolve-names'): Promise<IDatabaseDefinition> {
        logger.info('Starting preprocessing.');
        logger.info(`Will preprocess until phase '${lastPhase}'.`);

        const ddf = await Loader.load(this.path);

        for (const phase of PreProcessor.ALL_PHASES) {
            logger.info(`Executing phase '${phase}'.`);
            const phaseFunction = PreProcessor.PHASE_MAP[phase];
            await phaseFunction(ddf);

            if (phase == lastPhase) {
                break;
            }
        }

        logger.info('Successfully finished preprocessing.');

        return ddf;
    }
}

namespace PreProcessor {
    export type Phase =
        | 'validate-ddf'
        | 'resolve-includes'
        | 'resolve-partial-tables'
        | 'resolve-column-definitions'
        | 'resolve-type-definitions'
        | 'resolve-foreign-keys'
        | 'resolve-primary-keys'
        | 'type-checks'
        | 'resolve-names';
}

export = PreProcessor;

import path from 'path';
import FileConfigurator from 'file-configurator';
import { IDatabase } from '../../typings/database';
import { ITable } from '../../typings/table';
import ClientGeneratorBase from './client-generator-base';
import TableModuleGenerator from './table-module-generator';
import PartialTableModuleGenerator from './partial-table-module-generator';

const TEMPLATE_ROOT = path.join(__dirname, '..', '..', '..', '..', '..', 'res', 'templates', 'client');

class JSGenerator extends ClientGeneratorBase {
    protected async generateConnectionModule(database: IDatabase): Promise<ClientGeneratorBase.IModuleCode> {
        return {
            js: await FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'connection-module.js.in'), {
                connectionData: JSON.stringify(database.connection, null, 4),
                databaseName: database.meta.moduleName
            }),
            typings: await FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'connection-module.d.ts.in'), {
                connectionData: JSON.stringify(database.connection, null, 4),
                databaseName: database.meta.moduleName
            })
        };
    }

    protected async generateTableModule(table: ITable, database: IDatabase): Promise<ClientGeneratorBase.IModuleCode> {
        return TableModuleGenerator.generateTableModule(table, database);
    }

    protected async generatePartialTableModule(table: ITable): Promise<ClientGeneratorBase.IModuleCode> {
        return PartialTableModuleGenerator.generateTableModule(table);
    }

    protected async generateQueryBuilderModule(database: IDatabase): Promise<ClientGeneratorBase.IModuleCode> {
        return {
            js: '',
            typings: ''
        };
    }
}

export = JSGenerator;

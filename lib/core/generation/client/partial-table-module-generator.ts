import path from 'path';
import FileConfigurator from 'file-configurator';
import { ITable } from '../../typings/table';
import ClientGeneratorBase from './client-generator-base';
import GenerationUtils from './generation-utils';

const TEMPLATE_ROOT = path.join(__dirname, '..', '..', '..', '..', '..', 'res', 'templates', 'client', 'table');

namespace PartialTableModuleGenerator {
    export async function generateTableModule(table: ITable): Promise<ClientGeneratorBase.IModuleCode> {
        const columns = GenerationUtils.collectColumns(table);

        return {
            js: await FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'partial-table-module.js.in'), {
                tableName: table.meta.className,
                primaryKeyNames: JSON.stringify(table.primaryKey),
                hasPartialParent: table._parent !== undefined,
                parentModule: table._parent?.meta.moduleName,
                columnConstants: await Promise.all(columns.map(async col => GenerationUtils.generateConstant(col))),
                getters: await Promise.all(
                    columns.map(async col => GenerationUtils.generateGetter(col, table.meta.className))
                ),
                setters: await Promise.all(
                    columns.map(async col => GenerationUtils.generateSetter(col, table.meta.className))
                )
            }),
            typings: await FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'partial-table-module.d.ts.in'), {
                tableName: table.meta.className,
                hasPartialParent: table._parent !== undefined,
                parentModule: table._parent?.meta.moduleName,
                columnConstants: await Promise.all(
                    columns.map(async col => GenerationUtils.generateConstantType(col, table))
                ),
                getters: await Promise.all(columns.map(async col => GenerationUtils.generateGetterType(col))),
                setters: await Promise.all(columns.map(async col => GenerationUtils.generateSetterType(col))),
                multiGetProperties: await GenerationUtils.generateMultiGetProperties(table),
                multiSetProperties: await GenerationUtils.generateMultiSetProperties(table),
                insertDataProperties: await GenerationUtils.generateInsertDataProperties(table)
            })
        };
    }
}

export = PartialTableModuleGenerator;

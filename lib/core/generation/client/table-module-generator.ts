import path from 'path';
import FileConfigurator from 'file-configurator';
import { ITable } from '../../typings/table';
import { IDatabase } from '../../typings/database';
import { IConcreteColumn } from '../../typings/column';
import { ICompoundPrimaryKey } from '../../typings/primary-key';
import logger from '../../logger';
import TableBase from './table-base';
import ClientGeneratorBase from './client-generator-base';
import GenerationUtils from './generation-utils';

const TEMPLATE_ROOT = path.join(__dirname, '..', '..', '..', '..', '..', 'res', 'templates', 'client', 'table');

namespace TableModuleGenerator {
    export async function generateTableModule(
        table: ITable,
        database: IDatabase
    ): Promise<ClientGeneratorBase.IModuleCode> {
        const columns = GenerationUtils.collectColumns(table);

        return {
            js: await FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'table-module.js.in'), {
                tableName: table.meta.className,
                connectionModule: database.meta.moduleName,
                rdbmsTableName: table.meta.rdbmsName,
                primaryKeyNames: JSON.stringify(table.primaryKey),
                rdbmsToPropertyNameMap: JSON.stringify(makeRdbmsToPropertyNameMap(table)),
                propertyToRdbmsNameMap: JSON.stringify(makePropertyToRdbmsNameMap(table)),
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
            typings: await FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'table-module.d.ts.in'), {
                tableName: table.meta.className,
                primaryKeyType: await makePrimaryKeyType(table),
                rdbmsTableName: table.meta.rdbmsName,
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

    function makeRdbmsToPropertyNameMap(table: ITable): TableBase.StringMap {
        logger.debug(`Generating RDBMS-to-property name map for table '${table._name}'.`);
        const ret: TableBase.StringMap = {};
        const columns = GenerationUtils.collectColumns(table, true);

        for (const column of columns) {
            ret[column.meta.rdbmsName] = column.meta.propertyName;
        }

        return ret;
    }

    function makePropertyToRdbmsNameMap(table: ITable): TableBase.StringMap {
        logger.debug(`Generating property-to-RDBMS name map for table '${table._name}'.`);
        const ret: TableBase.StringMap = {};
        const columns = GenerationUtils.collectColumns(table, true);

        for (const column of columns) {
            ret[column.meta.propertyName] = column.meta.rdbmsName;
        }

        return ret;
    }

    async function makePrimaryKeyType(table: ITable): Promise<string> {
        logger.debug(`Generating primary key type for table '${table._name}'.`);
        const compoundPk = table.primaryKey as ICompoundPrimaryKey;

        if (compoundPk.length === 1) {
            const column = getColumn(table, compoundPk[0]);

            return GenerationUtils.generateType(column);
        } else {
            return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'primary-key-object.d.ts.in'), {
                properties: await Promise.all(
                    compoundPk.map(async name => {
                        const column = getColumn(table, name);

                        const propertyName = column.meta.propertyName;
                        const type = await GenerationUtils.generateType(column);
                        return generateProperty(propertyName, type);
                    })
                )
            });
        }
    }

    async function generateProperty(name: string, type: string): Promise<string> {
        logger.debug(`Generating property with name '${name}' and type '${type}'.`);
        return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'property.d.ts.in'), {
            name,
            type
        });
    }

    // retrieves a column of a table, even if it is in a parent table
    function getColumn(table: ITable, name: string): IConcreteColumn {
        // the primary-key-resolver made sure, that the column exists
        return table.columns[name] !== undefined
            ? (table.columns[name] as IConcreteColumn)
            : getColumn(table._parent!, name);
    }
}

export = TableModuleGenerator;

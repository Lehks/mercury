import path from 'path';
import FileConfigurator from 'file-configurator';
import { ITable } from '../../typings/table';
import { IDatabase } from '../../typings/database';
import { IConcreteColumn, IColumn } from '../../typings/column';
import { IEnum } from '../../typings/types/enum';
import { IConcreteType } from '../../typings/type';
import { ICompoundPrimaryKey } from '../../typings/primary-key';
import TableUtils from './table-utils';
import ClientGeneratorBase from './client-generator-base';

const TEMPLATE_ROOT = path.join(__dirname, '..', '..', '..', '..', '..', 'res', 'templates');

namespace TableModuleGenerator {
    export async function generateTableModule(
        table: ITable,
        database: IDatabase
    ): Promise<ClientGeneratorBase.IModuleCode> {
        return {
            js: await FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'client', 'table-module.js.in'), {
                tableName: table.meta.className,
                connectionModule: database.meta.moduleName,
                rdbmsTableName: table.meta.rdbmsName,
                primaryKeyNames: JSON.stringify(table.primaryKey),
                rdbmsToPropertyNameMap: JSON.stringify(makeRdbmsToPropertyNameMap(table)),
                propertyToRdbmsNameMap: JSON.stringify(makePropertyToRdbmsNameMap(table)),
                columnConstants: await Promise.all(
                    Object.values(table.columns).map(async col => generateConstant(col, table._name))
                ),
                getters: await Promise.all(
                    Object.values(table.columns).map(async col => generateGetter(col, table.meta.className))
                ),
                setters: await Promise.all(
                    Object.values(table.columns).map(async col => generateSetter(col, table.meta.className))
                )
            }),
            typings: await FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'client', 'table-module.d.ts.in'), {
                tableName: table.meta.className,
                primaryKeyType: await makePrimaryKeyType(table),
                rdbmsTableName: table.meta.rdbmsName,
                columnConstants: await Promise.all(
                    Object.values(table.columns).map(async col => generateConstantType(col, table.meta.className))
                ),
                getters: await Promise.all(Object.values(table.columns).map(async col => generateGetterType(col))),
                setters: await Promise.all(Object.values(table.columns).map(async col => generateSetterType(col))),
                multiGetProperties: await generateMultiGetProperties(table),
                multiSetProperties: await generateMultiSetProperties(table),
                insertDataProperties: await generateInsertDataProperties(table)
            })
        };
    }

    function makeRdbmsToPropertyNameMap(table: ITable): TableUtils.StringMap {
        const ret: TableUtils.StringMap = {};

        for (const col of Object.values(table.columns)) {
            const column = col as IConcreteColumn;
            ret[column.meta.rdbmsName] = column.meta.rdbmsName; // todo actual property name
        }

        return ret;
    }

    function makePropertyToRdbmsNameMap(table: ITable): TableUtils.StringMap {
        const ret: TableUtils.StringMap = {};

        for (const col of Object.values(table.columns)) {
            const column = col as IConcreteColumn;
            ret[column.meta.rdbmsName] = column.meta.rdbmsName; // todo actual property name
        }

        return ret;
    }

    async function generateGetter(column: IColumn, table: string): Promise<string> {
        const concreteColumn = column as IConcreteColumn;

        return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'client', 'getter.js.in'), {
            methodName: concreteColumn.meta.getterName,
            constantName: concreteColumn.meta.constantName,
            tableName: table
        });
    }

    async function generateGetterType(column: IColumn): Promise<string> {
        const concreteColumn = column as IConcreteColumn;

        // (concreteColumn.type as IEnum) might fail, but in that case, the value 'undefined' is fine in the context
        return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'client', 'getter.d.ts.in'), {
            methodName: concreteColumn.meta.getterName,
            type: await generateType(column)
        });
    }

    async function generateSetter(column: IColumn, table: string): Promise<string> {
        const concreteColumn = column as IConcreteColumn;

        return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'client', 'setter.js.in'), {
            methodName: concreteColumn.meta.setterName,
            constantName: concreteColumn.meta.constantName,
            tableName: table
        });
    }

    async function generateSetterType(column: IColumn): Promise<string> {
        const concreteColumn = column as IConcreteColumn;

        // (concreteColumn.type as IEnum) might fail, but in that case, the value 'undefined' is fine in the context
        return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'client', 'setter.d.ts.in'), {
            methodName: concreteColumn.meta.setterName,
            type: await generateType(column)
        });
    }

    async function generateConstant(column: IColumn, table: string): Promise<string> {
        const concreteColumn = column as IConcreteColumn;

        return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'client', 'column-constant.js.in'), {
            constantName: concreteColumn.meta.constantName,
            rdbmsName: concreteColumn.meta.rdbmsName,
            propertyName: concreteColumn.meta.rdbmsName, // todo actual property name
            tableName: table
        });
    }

    async function generateConstantType(column: IColumn, table: string): Promise<string> {
        const concreteColumn = column as IConcreteColumn;

        return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'client', 'column-constant.d.ts.in'), {
            constantName: concreteColumn.meta.constantName,
            tableName: table
        });
    }

    async function generateType(column: IColumn): Promise<string> {
        const concreteColumn = column as IConcreteColumn;

        return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'client', 'type.d.ts.in'), {
            type: makeTypeHelper(column),
            literals: (concreteColumn.type as IEnum).literals
        });
    }

    function makeTypeHelper(column: IColumn): string {
        const concreteColumn = column as IConcreteColumn;

        if (concreteColumn.nullable) {
            return `${(concreteColumn.type as IConcreteType).base}-null`;
        } else {
            return (concreteColumn.type as IConcreteType).base;
        }
    }

    async function makePrimaryKeyType(table: ITable): Promise<string> {
        const compoundPk = table.primaryKey as ICompoundPrimaryKey;

        if (compoundPk.length === 1) {
            const column = getColumn(table, compoundPk[0]);

            return generateType(column);
        } else {
            return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'client', 'primary-key-object.d.ts.in'), {
                properties: await Promise.all(
                    compoundPk.map(async name => {
                        const column = getColumn(table, name);

                        // todo property name
                        const propertyName = column.meta.rdbmsName;
                        const type = await generateType(column);
                        return generateProperty(propertyName, type);
                    })
                )
            });
        }
    }

    async function generateProperty(name: string, type: string): Promise<string> {
        return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'client', 'property.d.ts.in'), {
            name,
            type
        });
    }

    // retrieves a column of a table, even if it is in a parent table
    function getColumn(table: ITable, name: string): IConcreteColumn {
        if (table === undefined) {
            return (undefined as unknown) as IConcreteColumn;
        }

        // the primary-key-resolver made sure, that the column exists
        return table.columns[name] !== undefined
            ? (table.columns[name] as IConcreteColumn)
            : getColumn(table._parent!, name);
    }

    async function generateMultiGetProperties(table: ITable): Promise<string[]> {
        return Promise.all(
            Object.values(table.columns).map(async col => {
                const concreteColumn = col as IConcreteColumn;

                return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'client', 'property.d.ts.in'), {
                    name: concreteColumn.meta.rdbmsName, // todo property name
                    type: await generateType(concreteColumn)
                });
            })
        );
    }

    async function generateMultiSetProperties(table: ITable): Promise<string[]> {
        return Promise.all(
            Object.values(table.columns).map(async col => {
                const concreteColumn = col as IConcreteColumn;

                return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'client', 'property.d.ts.in'), {
                    name: concreteColumn.meta.rdbmsName, // todo property name
                    type: await generateType(concreteColumn),
                    optional: true
                });
            })
        );
    }

    async function generateInsertDataProperties(table: ITable): Promise<string[]> {
        return Promise.all(
            Object.values(table.columns).map(async col => {
                const concreteColumn = col as IConcreteColumn;

                return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'client', 'property.d.ts.in'), {
                    name: concreteColumn.meta.rdbmsName, // todo property name
                    type: await generateType(concreteColumn),
                    optional: (concreteColumn.type as IConcreteType).default !== undefined
                });
            })
        );
    }
}

export = TableModuleGenerator;

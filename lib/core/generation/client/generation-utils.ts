import path from 'path';
import FileConfigurator from 'file-configurator';
import { ITable } from '../../typings/table';
import { IConcreteColumn } from '../../typings/column';
import { IConcreteType } from '../../typings/type';
import { IEnum } from '../../typings/types/enum';
import logger from '../../logger';

namespace GenerationUtils {
    const TEMPLATE_ROOT = path.join(__dirname, '..', '..', '..', '..', '..', 'res', 'templates', 'client', 'table');

    export function collectColumns(table: ITable, includeParents = false): IConcreteColumn[] {
        const ret: IConcreteColumn[] = [];

        Object.values(table.columns).forEach(col => ret.push(col as IConcreteColumn));

        if (includeParents && table._parent) {
            ret.push(...collectColumns(table._parent, true));
        }

        return ret;
    }

    export async function generateGetter(column: IConcreteColumn, table: string): Promise<string> {
        logger.debug(`Generating getter for column '${column.meta.rdbmsName}' (RDBMS Name).`);
        return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'getter.js.in'), {
            methodName: column.meta.getterName,
            constantName: column.meta.constantName,
            tableName: table
        });
    }

    export async function generateGetterType(column: IConcreteColumn): Promise<string> {
        logger.debug(`Generating getter type for column '${column.meta.rdbmsName}' (RDBMS Name).`);
        // (concreteColumn.type as IEnum) might fail, but in that case, the value 'undefined' is fine in the context
        return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'getter.d.ts.in'), {
            methodName: column.meta.getterName,
            type: await generateType(column)
        });
    }

    export async function generateSetter(column: IConcreteColumn, table: string): Promise<string> {
        logger.debug(`Generating setter for column '${column.meta.rdbmsName}' (RDBMS Name).`);
        return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'setter.js.in'), {
            methodName: column.meta.setterName,
            constantName: column.meta.constantName,
            tableName: table
        });
    }

    export async function generateSetterType(column: IConcreteColumn): Promise<string> {
        logger.debug(`Generating setter type for column '${column.meta.rdbmsName}' (RDBMS Name).`);
        // (concreteColumn.type as IEnum) might fail, but in that case, the value 'undefined' is fine in the context
        return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'setter.d.ts.in'), {
            methodName: column.meta.setterName,
            type: await generateType(column)
        });
    }

    export async function generateConstant(column: IConcreteColumn): Promise<string> {
        logger.debug(`Generating constant for column '${column.meta.rdbmsName}' (RDBMS Name).`);
        return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'column-constant.js.in'), {
            constantName: column.meta.constantName,
            rdbmsName: column.meta.rdbmsName,
            propertyName: column.meta.propertyName
        });
    }

    export async function generateConstantType(column: IConcreteColumn, table: ITable): Promise<string> {
        logger.debug(`Generating constant type for column '${column.meta.rdbmsName}' (RDBMS Name).`);
        return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'column-constant.d.ts.in'), {
            constantName: column.meta.constantName,
            tableName: table.meta.className
        });
    }

    export async function generateType(column: IConcreteColumn): Promise<string> {
        logger.debug(`Generating column type for column '${column.meta.rdbmsName}' (RDBMS Name).`);
        return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'type.d.ts.in'), {
            type: makeTypeHelper(column),
            literals: (column.type as IEnum).literals
        });
    }

    export function makeTypeHelper(column: IConcreteColumn): string {
        if (column.nullable) {
            return `${(column.type as IConcreteType).base}-null`;
        } else {
            return (column.type as IConcreteType).base;
        }
    }

    export async function generateMultiGetProperties(table: ITable): Promise<string[]> {
        logger.debug(`Generating multi get properties type for table '${table._name}'.`);
        return Promise.all(
            Object.values(table.columns).map(async col => {
                const concreteColumn = col as IConcreteColumn;

                return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'property.d.ts.in'), {
                    name: concreteColumn.meta.propertyName,
                    type: await generateType(concreteColumn)
                });
            })
        );
    }

    export async function generateMultiSetProperties(table: ITable): Promise<string[]> {
        logger.debug(`Generating multi set properties type for table '${table._name}'.`);
        return Promise.all(
            Object.values(table.columns).map(async col => {
                const concreteColumn = col as IConcreteColumn;

                return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'property.d.ts.in'), {
                    name: concreteColumn.meta.propertyName,
                    type: await generateType(concreteColumn),
                    optional: true
                });
            })
        );
    }

    export async function generateInsertDataProperties(table: ITable): Promise<string[]> {
        logger.debug(`Generating insert data properties type for table '${table._name}'.`);
        return Promise.all(
            Object.values(table.columns).map(async col => {
                const concreteColumn = col as IConcreteColumn;

                return FileConfigurator.configure(path.join(TEMPLATE_ROOT, 'property.d.ts.in'), {
                    name: concreteColumn.meta.propertyName,
                    type: await generateType(concreteColumn),
                    optional: (concreteColumn.type as IConcreteType).default !== undefined
                });
            })
        );
    }
}

export = GenerationUtils;

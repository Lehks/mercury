export type NamingConvention = 'camel-case' | 'upper-camel-case' | 'snake-case' | 'minus-case' | 'constant-case';

export interface IGlobalMeta {
    clientOutputDir: string;
    sqlOutputDir: string;
    naming: IGlobalLevelNamingConventions;
    singularClassNames: boolean;
}

export interface IDatabaseMeta {
    rdbmsName: string;
    moduleName: string;
    naming: IDatabaseLevelNamingConventions;
    singularClassNames: boolean;
}

export interface ITableMeta {
    rdbmsName: string;
    getterName: string;
    setterName: string;
    constantName: string;
    naming: IGlobalLevelNamingConventions;
}

export interface IColumnMeta {
    clientOutputDir: string;
    sqlOutputDir: string;
    naming: IGlobalLevelNamingConventions;
    singularClassNames: boolean;
}

export type IGlobalLevelNamingConventions = IDatabaseLevelNamingConventions;

export interface IDatabaseLevelNamingConventions extends ITableLevelNamingConventions {
    rdbmsDatabaseNameConvention: NamingConvention;
    moduleNameConvention: NamingConvention;
}

export interface ITableLevelNamingConventions extends IColumnLevelNamingConventions {
    rdbmsTableNameConvention: NamingConvention;
    classNameConvention: NamingConvention;
}

export interface IColumnLevelNamingConventions {
    rdbmsColumnNameConvention: NamingConvention;
    methodNameConvention: NamingConvention;
    constantNameConvention: NamingConvention;
}

export interface IForeignKey {
    _name: string;
    on: string;
    references: {
        table: string;
        column: string;
    };
    onUpdate: TriggerAction;
    onDelete: TriggerAction;
}

export type TriggerAction = 'restrict' | 'cascade' | 'set-null' | 'no-action' | 'set-default';

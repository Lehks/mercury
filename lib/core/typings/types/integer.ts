export interface IInteger {
    base: 'small-int' | 'int' | 'big-int';
    unsigned: boolean;
    default?: number | 'auto-increment' | null;
}

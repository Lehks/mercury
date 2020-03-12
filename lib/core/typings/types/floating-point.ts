export interface IFloatingPoint {
    base: 'float' | 'double';
    unsigned: boolean;
    default?: number | 'auto-increment' | null;
}

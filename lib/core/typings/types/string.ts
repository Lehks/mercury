export interface IString {
    base: 'char' | 'var-char';
    length: number;
    default?: string | null;
}

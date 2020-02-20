export type ITemporal = IDate | ITime | IDateTime;

export interface IDate {
    base: 'date';
    default: string | 'NOW' | null;
}

export interface ITime {
    base: 'time';
    default: string | 'NOW' | null;
}

export interface IDateTime {
    base: 'date-time';
    default: string | 'NOW' | null;
}

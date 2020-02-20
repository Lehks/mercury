import { IInteger } from './types/integer';
import { IFloatingPoint } from './types/floating-point';
import { IString } from './types/string';
import { IEnum } from './types/enum';
import { ITemporal } from './types/temporal';
import { IBoolean } from './types/boolean';

export type IType = string | IInteger | IFloatingPoint | IString | IEnum | ITemporal | IBoolean;

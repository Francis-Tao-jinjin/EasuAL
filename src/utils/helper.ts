import { isNumber, isString, isUndef } from './typeCheck';
import { EasuAL } from '../core/BaseClass';

export function toSeconds(value?): number {
    if (isNumber(value)) {
        return value;
    } else if (isString(value)) {
        return (new EasuAL.Time(value)).toSeconds();
    } else if (value && value.TimeObject) {
        return value.toSeconds();
    } else if (isUndef(value)) {
        return EasuAL.context.now();
    } else {
        throw new Error('can not convert the value to seconds');
    }
}
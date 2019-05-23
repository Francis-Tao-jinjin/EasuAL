import { EasuALContext } from './Context';
import { AudioParamTimeline } from './AutomationTimeline';
import { 
    EasuAudioNode, 
    EasuDestination, 
    EasuGain, 
    EasuAudioParam,
    EasuOscNode,
} from './AudioNode';
import { ConstantSource } from '../audioComponent/ConstantSource';
import { Oscillator } from '../audioComponent/oscillator';
import { EasuBuffer } from './AudioBuffer';
import { EasuBufferSource } from '../audioComponent/BufferSource';
import { BufferPlayer } from '../audioComponent/BufferPlayer';
import { Time } from './time/Time';
import { Ticks } from './time/Ticks';
import { isNumber, isString, isUndef } from '../utils/typeCheck';
import { SchedulerTime } from './time/SchedulerTime';

export class EasuAL {
    public static AudioParamTimeline:typeof AudioParamTimeline;
    public static EasuAudioNode:typeof EasuAudioNode;
    public static EasuAudioParam:typeof EasuAudioParam;
    public static EasuDestination:typeof EasuDestination;
    public static EasuGain:typeof EasuGain;
    public static EasuOscNode:typeof EasuOscNode;
    public static ConstantSource:typeof ConstantSource;
    public static Oscillator:typeof Oscillator;
    public static EasuBuffer:typeof EasuBuffer;
    public static EasuBufferSource:typeof EasuBufferSource;
    public static EasuALContext:typeof EasuALContext;
    public static BufferPlayer:typeof BufferPlayer;

    public static Time:typeof Time;
    public static Ticks:typeof Ticks;
    public static SchedulerTime:typeof SchedulerTime;

    public static destination:EasuDestination;
    public static context:EasuALContext;

    constructor() {}

    get context() {
        if (EasuAL.context == null) {
            throw new Error('EasuAL context not intinalized');
        } else {
            return (EasuAL.context as EasuALContext);
        }
    }

    get destination() {
        if (EasuAL.destination == null) {
            throw new Error('EasuAL destination not intinalized');
        } else {
            return (EasuAL.destination as EasuDestination);
        }
    }

    // decibel_level = 20 * log10(gain);
    public gainToDb(value) {
        return 20 * Math.log10(value);
    }

    public dbToGain(db) {
        return Math.pow(10, (db / 20));
    }

    public toSeconds(value?) : number{
        if (isUndef(value)) {
            return this.context.now();
        } else if (isNumber(value)) {
            return value;
        } else if (isString(value)) {
            return (new EasuAL.Time(value)).toSeconds();
        } else if (value && value.TimeObject) {
            return value.toSeconds();
        } else {
            throw new Error('can not convert the value to seconds');
        }
    }
}
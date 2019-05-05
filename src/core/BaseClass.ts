import { EasuALContext } from './Context';
import { AudioParamTimeline } from './AutomationTimeline';
import { 
    EasuAudioNode, 
    EasuDestination, 
    EasuGain, 
    EasuAudioParam,
    EasuOscNode,
} from './AudioNode';

export class EasuAL {
    public static AudioParamTimeline:typeof AudioParamTimeline;
    public static EasuAudioNode:typeof EasuAudioNode;
    public static EasuAudioParam:typeof EasuAudioParam;
    public static EasuDestination:typeof EasuDestination;
    public static EasuGain:typeof EasuGain;
    public static EasuOscNode:typeof EasuOscNode;
    public static EasuALContext:typeof EasuALContext;

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
}
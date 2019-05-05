import { EasuAL } from './EasuAL';
export function initEasuAL(context?:AudioContext) {
    EasuAL.context = new EasuAL.EasuALContext(context);
    EasuAL.destination = new EasuAL.EasuDestination();
    return EasuAL;
}
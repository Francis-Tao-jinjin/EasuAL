import EasuAL from './EasuAL';

export function createEasuAL(context:AudioContext) {
    return EasuAL.createInstance(context);
}
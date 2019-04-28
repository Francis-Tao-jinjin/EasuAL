import { EasuALContext } from './Context';

export class EasuAL {
    private _context:EasuALContext;
    constructor() {}

    public static createInstance(context?:AudioContext) {
        return (new EasuAL().initContext(context));
    }

    public initContext(context?:AudioContext) {
        this._context = new EasuALContext(context);
        return this;
    }

    get context() {
        return this._context;
    }
}
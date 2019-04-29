import EasuAL from "../EasuAL";

export abstract class EasuAudioNode extends EasuAL{
    public abstract input:AudioNode|AudioParam;
    public abstract output:AudioNode;

    constructor () {
        super();
    }

    public connect(dst:EasuAudioNode|AudioNode|AudioParam) {
        if (dst instanceof EasuAudioNode) {
            this.output.connect((dst.input as AudioNode));
        } else {
            this.output.connect((dst as AudioNode));
        }
    }

    public toDestination() {
    };
}

export class EasuDestination extends EasuAudioNode {
    public input:GainNode;
    public output:GainNode;
    public gain:GainNode;
    constructor() {
        super();
        this.input = this.gain = this.output = this.context.createGain();
        this.output.connect(this.context.destination);
    }
}

export class EasuGain extends EasuAudioNode {
    public input:GainNode;
    public output:GainNode;

    constructor() {
        super();
        this.input = this.output = this.context.createGain();
    }
}


enum AudioParamUnits {
    gain,
    decibel,
    hz,
}

export enum ParamEvent {
    SetValue,
    LinearRampToValue,
    ExponentialRampToValue,
    SetTarget,
    SetValueCurve,
    cancelScheduledValues,
}

interface EasuAudioParamArgs {
    param:AudioParam;
    unit:AudioParamUnits;
    value?:any;
}

export class EasuAudioParam extends EasuAudioNode {
    protected _param:AudioParam;
    protected _unit:AudioParamUnits;

    private _timeline
    private _value;

    constructor(args:EasuAudioParamArgs) {
        super();
        this._param = args.param;
    }

    public setValueAtTime(value, time?) {
        time = time === undefined ? this.context.now() : time;

    }

    public linearRampToValueAtTime() {

    }

    public exponentialRampToValueAtTime() {

    }
}
import { EasuAL } from './BaseClass';
import { AudioParamTimeline } from './AutomationTimeline';
import {
    AudioParamUnits,
    EasuAudioParamOpt,
    EasuOscNodeOpt
} from './type';

export abstract class EasuAudioNode extends EasuAL{
    public input?:AudioNode|AudioParam;
    public output?:AudioNode;

    constructor () {
        super();
    }

    public connect(dst:EasuAudioNode|AudioNode|AudioParam) {
        if (dst instanceof EasuAudioNode) {
            this.output && this.output.connect((dst.input as AudioNode));
        } else {
            this.output && this.output.connect((dst as AudioNode));
        }
    }

    public toDestination() {
        if (this.output && this.context.destination) {
            this.output.connect(this.context.destination);
        }
        return this;
    };
}

export class EasuDestination extends EasuAudioNode {
    public readonly input:GainNode;
    public readonly output:GainNode;
    public gain:GainNode;
    constructor() {
        super();
        this.input = this.gain = this.output = this.context.createGain();
        this.output.connect(this.context.destination);
    }
}

export class EasuGain extends EasuAudioNode {
    public readonly input:GainNode;
    public readonly output:GainNode;
    public gain:EasuAudioParam;
    private _gainNode:GainNode;

    constructor(gainNode?:GainNode) {
        super();
        if (gainNode !== undefined && gainNode instanceof GainNode) {
            this.input = this.output = this._gainNode = gainNode;
        } else {
            this.input = this.output = this._gainNode = this.context.createGain();
        }
        this.gain = new EasuAL.EasuAudioParam({
            param: this._gainNode.gain,
            unit: AudioParamUnits.gain,
            value: 1,
        });
    }
}

export class EasuAudioParam extends EasuAudioNode {
    public _param:AudioParam;
    protected _unit:AudioParamUnits;
    private _timeline:AudioParamTimeline;

    public readonly input;

    constructor(opt:EasuAudioParamOpt) {
        super();
        this._param = opt.param;
        this._unit = AudioParamUnits.gain;
        this._timeline = new EasuAL.AudioParamTimeline();
        this.input = this._param;
        if (opt.value !== undefined) {
            this.value = opt.value;
        }
    }

    public setValueAtTime(value, time?) {
        time = time === undefined ? this.context.now() : time;
        this._param.setValueAtTime(value, time);
        this._timeline.setValueAtTime(value, time);
    }

    public getValueAtTime(time) {
        return this._timeline.getValueAtTime(time);
    }

    get value() {
        return this._param.value;
    }

    set value(val) {
        this._timeline.setValueAtTime(val, this.context.now());
        this._param.setValueAtTime(val, this.context.now());
    }

    public cancelScheduledValues(time) {
        this._timeline.cancelAfter(time);
        this._param.cancelScheduledValues(time);
        return this;
    }

    public linearRampTo(value:number, rampTime:number, startTime?:number) {
        startTime = startTime === undefined ? EasuAL.context.now() : startTime;
        this._timeline.linearRampTo(value, rampTime, startTime);
        this._param.setValueAtTime(this.getValueAtTime(startTime), startTime);
        this._param.linearRampToValueAtTime(value, startTime + rampTime);
        return this;
    }

    public exponentialRampTo(value:number, rampTime:number, startTime?:number) {
        value = Math.max(1e-5, value);
        startTime = startTime === undefined ? EasuAL.context.now() : startTime;
        this._timeline.exponentialRampTo(value, rampTime, startTime);
        this._param.setValueAtTime(this.getValueAtTime(startTime), startTime);
        this._param.exponentialRampToValueAtTime(value, startTime + rampTime);
        return this;
    }

    public targetApproachTo(value:number, rampTime:number, startTime:number) {
        value = Math.max(1e-5, value);
        startTime = startTime === undefined ? EasuAL.context.now() : startTime;
        this._timeline.targetRampTo(value, rampTime, startTime);
        this._param.setValueAtTime(this.getValueAtTime(startTime), startTime);
        this._param.setTargetAtTime(value, startTime, rampTime/6);
        this._param.setValueAtTime(value, startTime + rampTime);
    }
}

export class EasuOscNode extends EasuAudioNode {
    public readonly output:GainNode;
    public frequency:EasuAudioParam;
    public detune:EasuAudioParam;
    public amp:EasuGain;
    
    private _startTime:number = -1;
    private _stopTime:number = -1;
    private _oscillator:OscillatorNode;
    constructor(opt:EasuOscNodeOpt = {}) {
        super();
        this.output = this.context.createGain();

        // this could be a envelope
        this.amp = new EasuAL.EasuGain(this.output);
        this.amp.gain.value = 1;
        opt = {
            type: 'sine',
            frequency: 440,
            detune: 0,
            onended: () => {},
            ...opt,
        };
        this._oscillator = this.context.createOscillator();
        this.frequency = new EasuAL.EasuAudioParam({
            param: this._oscillator.frequency,
            unit: AudioParamUnits.hz,
            value: opt.frequency,
        });
        this.detune = new EasuAL.EasuAudioParam({
            param: this._oscillator.detune,
            unit: AudioParamUnits.cent,
            value: opt.detune,
        });
        this.onended = (opt.onended as (param:any) => void);
        this._oscillator.connect(this.output);
    }

    set onended(fn:(param:any) => void) {
        this._oscillator.onended = fn;
    }

    public start(time?:number) {
        if (this._startTime === -1) {
            time = time === undefined ? this.context.now() : Math.max(time, this.context.now());
            this._startTime = time;
            this._oscillator.start(this._startTime);
            // this.amp.gain.setValueAtTime(1, this._startTime);
        } else {
            console.warn('OscillatorNode already started');
        }
        return this;
    }

    public stop(time?:number) {
        if (this._startTime === -1) {
            throw new Error('oscillator has not been start yet');
        }
        this._stopTime = time === undefined ? this.context.now() : Math.max(time, this.context.now());
        // this.amp.gain.cancelScheduledValues(this._stopTime + this.context.sampleTime);
        if (this._stopTime > this._startTime) {
            this.amp.gain.setValueAtTime(0, this._stopTime);
            this._oscillator.stop(this._stopTime);
        } else {
            this.amp.gain.cancelScheduledValues(this._startTime);
        }
        return this;
    }

    public setPeriodicWave(wave:PeriodicWave) {
        this._oscillator.setPeriodicWave(wave);
        return this;
    }
}

EasuAL.EasuAudioNode = EasuAudioNode;
EasuAL.EasuAudioParam = EasuAudioParam;
EasuAL.EasuDestination = EasuDestination;
EasuAL.EasuGain = EasuGain;
EasuAL.EasuOscNode = EasuOscNode;

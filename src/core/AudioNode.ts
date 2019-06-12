import { EasuAL } from './BaseClass';
import { AudioParamTimeline, ParamEvent } from './AutomationTimeline';
import {
    AudioParamUnits,
    EasuAudioParamOpt,
    EasuOscNodeOpt
} from './type';

export abstract class EasuAudioNode extends EasuAL {
    public input?:AudioNode|AudioParam|EasuAudioNode;
    public output?:AudioNode|EasuAudioNode;

    constructor () {
        super();
    }

    public connect(dst:EasuAudioNode|AudioNode|AudioParam) {
        let output = this.output;
        while (output instanceof EasuAudioNode && output.output) {
            output = output.output;
        }
        let input = dst;
        while (input instanceof EasuAudioNode && input.input) {
            input = input.input;
        }
        (output as AudioNode).connect(input as AudioNode);
    }

    public disconnect(dst:EasuAudioNode|AudioNode|AudioParam) {
    }

    public toDestination() {
        if (this.context.destination) {
            let _output = this.output;
            while (_output && ((_output as any).output !== undefined)) {
                _output = (_output as EasuAudioNode).output;
            }
            if (_output) {
                (_output as AudioNode).connect(this.context.destination);
            } else {
                console.error('invalid output to destination');
            }
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

    public setValueAtTime(value, _time?) {
        const time = this.toSeconds(_time);
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

    public cancelScheduledValues(_time?) {
        const time = this.toSeconds(_time);
        this._timeline.cancelAfter(time);
        this._param.cancelScheduledValues(time);
        return this;
    }

    public cancelAndHoldAtTime(_time?) {
        const time = this.toSeconds(_time);
        const valueAtTime = this.getValueAtTime(time);
        this._param.cancelScheduledValues(time);
        const recent = this._timeline.getMostRecent(time);
        const next = this._timeline.getRightNext(time);
        if (recent && recent.time === time) {
            if (next) {
                this._timeline.cancelAfter(next.time);
            } else {
                this._timeline.cancelAfter(time + this.context.sampleTime);
            }
        } else if (next) {
            this._timeline.cancelAfter(next.time);
            if (next.type === ParamEvent.LinearRampToValue) {
                this.linearRampTo(valueAtTime, time - recent.time, recent.time);
            } else if (next.type === ParamEvent.ExponentialRampToValue) {
                this.exponentialRampTo(valueAtTime, time - recent.time, recent.time);
            }
        }

        this._timeline.insert({
            type: ParamEvent.SetValue,
            value: valueAtTime,
            time: time,
        });
        this._param.setValueAtTime(valueAtTime, time);
        return this;
    }

    public linearRampTo(value:number, rampTime:number, _startTime?:any) {
        const startTime = this.toSeconds(_startTime);
        this.cancelAndHoldAtTime(startTime);
        this._timeline.linearRampTo(value, rampTime, startTime);
        this._param.setValueAtTime(this.getValueAtTime(startTime), startTime);
        this._param.linearRampToValueAtTime(value, startTime + rampTime);
        return this;
    }

    public exponentialRampTo(value:number, rampTime:number, _startTime?:any) {
        value = Math.max(1e-5, value);
        const startTime = this.toSeconds(_startTime);
        // this.cancelScheduledValues(startTime);
        this.cancelAndHoldAtTime(startTime);
        this._timeline.exponentialRampTo(value, rampTime, startTime);
        this._param.setValueAtTime(this.getValueAtTime(startTime), startTime);
        this._param.exponentialRampToValueAtTime(value, startTime + rampTime);
        return this;
    }

    public targetApproachTo(value:number, rampTime:number, _startTime:number) {
        value = Math.max(1e-5, value);
        const startTime = this.toSeconds(_startTime);
        // this.cancelScheduledValues(startTime);
        this.cancelAndHoldAtTime(startTime);
        this._timeline.targetRampTo(value, rampTime, startTime);
        this._param.setValueAtTime(this.getValueAtTime(startTime), startTime);
        this._param.setTargetAtTime(value, startTime, rampTime/6);
        this._param.setValueAtTime(value, startTime + rampTime);
    }

    public setValueCurveAtTime(valuse:number[], startTime:number, duration:number, scaling:number = 1) {
        duration = this.toSeconds(duration);
        startTime = this.toSeconds(startTime);
        this.setValueAtTime(valuse[0] * scaling, startTime);
        const segmentTime = duration / (valuse.length - 1);
        let segmentStartTime = startTime + segmentTime;
        for (let i = 1; i < valuse.length; i++) {
            this.linearRampTo(valuse[i] * scaling, segmentTime, segmentStartTime);
            segmentStartTime += segmentTime;
        }
        return this;
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

    public start(_time?:any) {
        if (this._startTime === -1) {
            const time = this.toSeconds(_time);
            this._startTime = time;
            this._oscillator.start(this._startTime);
            // this.amp.gain.setValueAtTime(1, this._startTime);
        } else {
            console.warn('OscillatorNode already started');
        }
        return this;
    }

    public stop(_time?:any) {
        if (this._startTime === -1) {
            throw new Error('oscillator has not been start yet');
        }
        this._stopTime = this.toSeconds(_time);
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

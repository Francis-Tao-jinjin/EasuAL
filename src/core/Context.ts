import { EasuAL } from './BaseClass';
import { BPMCurve } from './schedule/BPMCurve';

export class EasuALContext {

    public lookAhead:number;

    public readonly _ctx:AudioContext;
    public readonly createGain:() => GainNode;
    public readonly createConstantSource:() => any;
    public readonly createAnalyser:() => AnalyserNode;
    public readonly createBuffer:(numOfChannels:number, length:number, sampleRate:number) => AudioBuffer;
    public readonly createOscillator:() => OscillatorNode;
    public readonly createPeriodicWave:(real:Float32Array, imag:Float32Array, constraints?:{disableNormalization:boolean}) => PeriodicWave;
    public readonly createScriptProcessor:(bufferSize:number, numberOfInputChannels:number, numberOfOutputChannels:number) => ScriptProcessorNode;
    public readonly createBufferSource:() => AudioBufferSourceNode;
    public readonly decodeAudioData:(ArrayBuffer:ArrayBuffer, onSuccess?:(buffer) => void, onError?:(msg) => void) => Promise<AudioBuffer>;

    // beats per minute
    public _bpm?:BPMCurve;
    // ticks per quaterNote (beats)
    private _tpq:number = 192;

    constructor(context?:AudioContext, lookAhead?:number) {
        if (context === null || context === undefined) {
            context = new ((window as any).AudioContext || (window as any).webkitAudioContext);
        }
        this._ctx = (context as AudioContext);
        this.lookAhead = (lookAhead === undefined ? 0.03 : lookAhead);

        this.createGain = this._ctx.createGain.bind(this._ctx);
        this.createConstantSource = (this._ctx as any).createConstantSource.bind(this._ctx);
        this.createAnalyser = this._ctx.createAnalyser.bind(this._ctx);
        this.createBuffer = this._ctx.createBuffer.bind(this._ctx);
        this.createOscillator = this._ctx.createOscillator.bind(this._ctx);
        this.createPeriodicWave = this._ctx.createPeriodicWave.bind(this._ctx);
        this.createScriptProcessor = this._ctx.createScriptProcessor.bind(this._ctx);
        this.createBufferSource = this._ctx.createBufferSource.bind(this._ctx);
        this.decodeAudioData = this._ctx.decodeAudioData.bind(this._ctx);
    }

    get destination() {
        return this._ctx.destination;
    }

    get sampleRate() {
        return this._ctx.sampleRate;
    }

    get sampleTime() {
        return 1 / this._ctx.sampleRate;
    }

    get state() {
        return this._ctx.state;
    }

    public now() {
        return this._ctx.currentTime + this.lookAhead;
    }

    get TPQ() {
        return this._tpq;
    }

    get BPM() {
        if(this._bpm) {
            return this._bpm;
        } else {
            throw Error('no bpm without initinalized scheduler');
        }
    }

    public initScheduler() {
        this._bpm = new BPMCurve(this);
        this._bpm.value = 120;
    }
}

EasuAL.EasuALContext = EasuALContext;
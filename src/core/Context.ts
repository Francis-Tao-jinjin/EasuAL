export class EasuALContext {

    public lookAhead:number;

    public readonly _ctx:AudioContext;
    public readonly createGain:() => GainNode;
    public readonly createConstantSource:() => ConstantSourceNode;
    public readonly createAnalyser:() => AnalyserNode;
    public readonly createBuffer:(numOfChannels:number, length:number, sampleRate:number) => AudioBuffer;
    public readonly createOscillator:() => OscillatorNode;
    public readonly createPeriodicWave:(read:number[], imag:number[], constraints:{disableNormalization:boolean}) => PeriodicWave;
    public readonly createScriptProcessor:(bufferSize:number, numberOfInputChannels:number, numberOfOutputChannels:number) => ScriptProcessorNode;
    public readonly createBufferSource:() => AudioBufferSourceNode;
    public readonly decodeAudioData:(ArrayBuffer:ArrayBuffer, onSuccess:(buffer) => void, onError?:(msg) => void) => void;

    constructor(context?:AudioContext, lookAhead?:number) {
        if (context === null || context === undefined) {
            context = new ((window as any).AudioContext || (window as any).webkitAudioContext);
        }
        this._ctx = context;
        this.lookAhead = (lookAhead === undefined ? 0.03 : lookAhead);

        this.createGain = this._ctx.createGain;
        this.createConstantSource = this._ctx.createConstantSource;
        this.createAnalyser = this._ctx.createAnalyser;
        this.createBuffer = this._ctx.createBuffer;
        this.createOscillator = this._ctx.createOscillator;
        this.createPeriodicWave = this._ctx.createPeriodicWave;
        this.createScriptProcessor = this._ctx.createScriptProcessor;
        this.createBufferSource = this._ctx.createBufferSource;
        this.decodeAudioData = this._ctx.decodeAudioData;
    }

    // get currentTime() {
    //     return this._ctx.currentTime;
    // }

    get destination() {
        return this._ctx.destination;
    }

    get sampleRate() {
        return this._ctx.sampleRate;
    }

    get state() {
        return this._ctx.state;
    }

    public now() {
        return this._ctx.currentTime + this.lookAhead;
    }
}
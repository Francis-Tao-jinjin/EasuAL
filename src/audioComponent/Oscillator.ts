import { EasuAL } from '../core/BaseClass';
import { OscillatorOpt, AudioParamUnits } from '../core/type';
import { ConstantSource } from './ConstantSource';
import { EasuOscNode, EasuGain } from '../core/AudioNode';

export class Oscillator extends EasuAL.EasuAudioNode {
  
  private _type!:string;
  private _partials:number[];
  private _partialCount:number;
  private _wave!:PeriodicWave;
  private _oscillator:EasuOscNode|null = null;

  public detune:ConstantSource;
  public frequency:ConstantSource;

  public readonly output:GainNode;

  constructor(opt:OscillatorOpt = {}) {
    super();

    opt = {
      frequency: 440,
      type: 'sine',
      detune: 0,
      phase: 0,
      partials: [],
      partialCount: 0,
      ...opt,
    };

    this.type = opt.type;
    this.detune = new EasuAL.ConstantSource(opt.detune, AudioParamUnits.cent);
    this.frequency = new EasuAL.ConstantSource(opt.frequency, AudioParamUnits.hz);
    
    this._partials = (opt.partials as number[]);
    this._partialCount = (opt.partialCount as number);
    
    this.output = this.context.createGain();
  }

  // power of two
  private _getPeriodicWaveSize() {
    if (this.context.sampleRate <= 24000) {
      return 2048; 
    } else if (this.context.sampleRate <= 88200) {
      return 4096;
    }
    return 16384;
  }

  //https://cs.chromium.org/chromium/src/third_party/blink/renderer/modules/webaudio/periodic_wave.cc?l=303
  public _generateRealImagPart(type:string) {
    const fftSzie = this._getPeriodicWaveSize();
    const half_size = fftSzie / 2;
    
    const real = new Float32Array(half_size);
    const imag = new Float32Array(half_size);

    real[0] = 0;
    imag[0] = 0;

    let waveSize = half_size;
    let partialCount = 1;
    if (type === 'custom') {

    } else {
      const partial = /^(sine|triangle|square|sawtooth)(\d+)$/.exec(type);
      if (partial) {
        partialCount = Math.max(2, parseInt(partial[2]) + 1);
        waveSize = partialCount;
        this._partialCount = parseInt(partial[2]);
        type = partial[1];
      } else {
        this._partialCount = 0;
      }
      this._partials = [];
    }

    for(let n = 1; n < waveSize; n++) {
      let pi_factor = 2 / (n * Math.PI);
      let b;
      switch (type) {
        case 'sine':
          b = (n <= partialCount) ? 1 : 0;
          break;
        case 'square':
          b = (n & 1) ? 2 * pi_factor : 0;
          break;
        case 'sawtooth':
          b = pi_factor * ((n & 1) ? 1 : -1);
          break;
        case 'triangle':
          if (n & 1) {
            b = 2 * (pi_factor * pi_factor) * ((((n - 1) >> 1) & 1) ? -1 : 1);
          } else {
            b = 0;
          }
          break;
        case 'custom':
          b = this._partials[n - 1];
          break;
        default:
          throw new Error('Oscillator type error: ' + type);
          break;
      }
      if (type != 'custom') {
        this._partials[n - 1] = b;
      }
      real[n] = 0;
      imag[n] = b;
    }
    return {real, imag};
  }

  get type() {
    return this._type;
  }

  set type(t) {
    const coefs = this._generateRealImagPart(t);
    this._wave = this.context.createPeriodicWave(coefs.real, coefs.imag);
    if (this._oscillator !== null) {
      this._oscillator.setPeriodicWave(this._wave);
    }
    this._type = t;
  }

  public start(_time?) {
    const time = this.toSeconds(_time);
    this._oscillator = new EasuAL.EasuOscNode();
    this._oscillator.setPeriodicWave(this._wave);
    this._oscillator.connect(this.output);
    this.frequency.connect(this._oscillator.frequency);
    this.detune.connect(this._oscillator.detune);
    this._oscillator.start(time);
  }

  public stop(_time?) {
    const time = this.toSeconds(_time);
    if (this._oscillator) {
      this._oscillator.stop(time);
    }
    return this;
  }

  set volume(val) {
    this.output.gain.setValueAtTime(this.dbToGain(val), this.context.now());
  }

  get volume() {
    return this.gainToDb(this.output.gain.value);
  }
}

EasuAL.Oscillator = Oscillator;
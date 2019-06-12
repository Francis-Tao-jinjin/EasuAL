import { EasuAL } from '../core/BaseClass';
import { Oscillator } from '../audioComponent/oscillator';
import { ConstantSource } from '../audioComponent/ConstantSource';
import { EasuGain } from '../core/AudioNode';

interface AMOscillatorOpt {
  carrierType?:string;
  modulatorType?:string;
  frequency?:number;
  detune?:number;
  modulationScale?:number;
  harmonicity?:number;
}

export class AMOscillator extends EasuAL.EasuAudioNode {

  private _modulator:Oscillator;
  private _carrier:Oscillator;

  public _detune:ConstantSource;
  public _frequency:ConstantSource;
  public _harmonicity:ConstantSource;
  public _modulationScale:ConstantSource;

  private _mult_1:EasuGain;
  private _mult_2:EasuGain;
  private _mult_3:EasuGain;
  private _mult_4:EasuGain;
  private _add_1:EasuGain;
  private _add_2:EasuGain;

  private _one:ConstantSource;
  private _half:ConstantSource;

  constructor(opt:AMOscillatorOpt = {}) {
    super();
    const _opt = {
      frequency : 440,
      detune : 0,
      carrierType : 'sine',
      modulatorType : "square",
      modulationScale : 1,
      harmonicity: 0.03,
      ...opt,
    };
    this._detune = new EasuAL.ConstantSource();
    this._frequency = new EasuAL.ConstantSource();
    this._harmonicity = new EasuAL.ConstantSource();
    this._modulationScale = new EasuAL.ConstantSource();
    this._modulator = new EasuAL.Oscillator();
    this._carrier = new EasuAL.Oscillator();

    this.detune = _opt.detune;
    this.frequency = _opt.frequency;
    this.harmonicity = _opt.harmonicity;
    this.modulationScale = _opt.modulationScale;

    this._mult_1 = new EasuAL.EasuGain();
    this._mult_2 = new EasuAL.EasuGain();
    this._mult_3 = new EasuAL.EasuGain();
    this._mult_4 = new EasuAL.EasuGain();
    this._add_1 = new EasuAL.EasuGain();
    this._add_2 = new EasuAL.EasuGain();
    
    this._one = new EasuAL.ConstantSource();
    this._one.value = 1;
    this._half = new EasuAL.ConstantSource();
    this._half.value = 0.5;

    this._frequency.connect(this._mult_1.gain);
    this._harmonicity.connect(this._mult_1);
    this._mult_1.connect(this._modulator.frequency);
    this._modulator.connect(this._add_1);
    this._one.connect(this._add_1);

    this._half.connect(this._mult_2.gain);
    this._add_1.connect(this._mult_2);

    this._mult_2.connect(this._mult_3.gain);
    this._modulationScale.connect(this._mult_3);

    this._one.connect(this._add_2.gain);
    this._mult_3.connect(this._add_2);

    this._frequency.connect(this._carrier.frequency);
    this._add_2.connect(this._mult_4.gain);
    this._carrier.connect(this._mult_4);
    this.output = this._mult_4;
  }

  public start(time) {
    time = this.toSeconds(time);
    this._carrier.start(time);
    this._modulator.start(time);
  }

  public stop(time) {
    time = this.toSeconds(time);
    this._carrier.stop(time);
    this._modulator.stop(time);
  }

  set modulationScale(value) {
    this._modulationScale.value = value;
  }

  get modulationScale() {
    return this._modulationScale.value;
  }

  set frequency(value) {
    this._frequency.value = value;
  }

  get frequency() {
    return this._frequency.value;
  }

  get detune() {
    return this._detune.value;
  }

  set detune(value) {
    this._detune.value = value;
  }

  get harmonicity() {
    return this._harmonicity.value;
  }

  set harmonicity(value) {
    this._harmonicity.value = value;
  }
}

EasuAL.AMOscillator = AMOscillator;
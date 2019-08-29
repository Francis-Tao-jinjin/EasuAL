import { EasuAL } from '../core/BaseClass';
import { Oscillator } from '../audioComponent/oscillator';
import { ConstantSource } from '../audioComponent/ConstantSource';
import { EasuGain } from '../core/AudioNode';


interface FMOscillatorOpt {
  mFrequency?:number;
  cFrequency?:number;
  peakFreqDev?:number;
}

export class FMOscillator extends EasuAL.EasuAudioNode {

  private _frequencyConstant:ConstantSource;
  private _modulator:Oscillator;
  private _carrier:Oscillator;
  private _modulatorAmp:EasuGain;
  private _add:EasuGain;

  constructor(opt:FMOscillatorOpt = {}) {
    super();

    const _opt = {
      mFrequency: 50,
      cFrequency: 440,
      peakFreqDev: 50,
      ...opt,
    }

    this._modulator = new EasuAL.Oscillator();
    this._carrier = new EasuAL.Oscillator();
    this._modulatorAmp = new EasuAL.EasuGain();
    this._add = new EasuAL.EasuGain();
    this._modulator.connect(this._modulatorAmp);
    this._modulatorAmp.connect(this._add);
    this._frequencyConstant = new EasuAL.ConstantSource();
    this._frequencyConstant.connect(this._add);
    this._add.connect(this._carrier.frequency);

    this.cFrequency = _opt.cFrequency;
    this.mFrequency = _opt.mFrequency;
    this.peakFrequencyDeviation = _opt.peakFreqDev;
    this.output = this._carrier;
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

  set cFrequency(value) {
    this._frequencyConstant.value = value;
  }

  get cFrequency() {
    return this._frequencyConstant.value;
  }

  set mFrequency(value) {
    this._modulator.frequency.value = value;
  }

  get mFrequency() {
    return this._modulator.frequency.value;
  }

  set peakFrequencyDeviation(value) {
    this._modulatorAmp.gain.value = value;
  }

  get peakFrequencyDeviation() {
    return this._modulatorAmp.gain.value;
  }
}

EasuAL.FMOscillator = FMOscillator;
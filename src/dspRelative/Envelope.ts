import { EasuAL } from '../core/BaseClass';
import { EasuAudioParam, EasuGain } from '../core/AudioNode';
import { AudioParamUnits } from '../core/type';
import { isArray, isString } from '../utils/typeCheck';

interface EnvelopeOpt {
  attack?:number;
  decay?:number;
  sustain?:number;
  release?:number;
}

enum EnvelopeCurveType {
  Linear = 'Linear',
  Exponential = 'Exponential',
  Cosine = 'Cosine',
  Step = 'Step',
  Ripple = 'Ripple',
  Sine = 'Sine',
};

export class Envelope extends EasuAL.EasuAudioNode {
  public static TYPE:{[key:string]:any};

  public attack:number|string;
  public decay:number|string;
  public sustain:number;
  public release:number|string;

  private _attackCurve;
  private _decayCurve;
  private _releaseCurve;

  protected amp:EasuAudioParam;

  constructor(opt:EnvelopeOpt = {}) {
    super();
    const _opt = {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.5,
      release: 1,
      ...opt,
    };
    this.attack = _opt.attack;
    this.decay = _opt.decay;
    this.sustain = _opt.sustain;
    this.release = _opt.release;

    this._attackCurve = EnvelopeCurveType.Linear;  
    this._decayCurve = EnvelopeCurveType.Exponential;
    this._releaseCurve = EnvelopeCurveType.Exponential;

    this.input = this.output = new EasuAL.EasuGain();
    (this.input as EasuGain).gain.value = 0;
    this.amp = new EasuAL.EasuAudioParam({
      param: (this.input as EasuGain).gain._param,
      unit: AudioParamUnits.default,
    });
  }

  // velocity: 速度的缓急影像音量的大小
  public triggerAttack(time?, velocity?:number) {
    time = this.toSeconds(time);
    let attack = this.toSeconds(this.attack);
    const decay = this.toSeconds(this.decay);
    velocity = velocity === undefined ? 1 : velocity;

    const currentValue = this.getValueAtTime(time);
    
    // 之前的一个周期还没有完成
    if (currentValue > 0) {
      // 虽然不是很准确，到是当 attackCurve 是 linear 的时候是准确的
      attack = (1 - currentValue) * attack;
    }
    if (this._attackCurve === EnvelopeCurveType.Linear) {
      this.amp.linearRampTo(velocity, attack, time);
      console.log('amp.linearRampTo(', velocity, attack, time,')');
    } else if (this._attackCurve === EnvelopeCurveType.Exponential) {
      // this.amp.exponentialRampTo(velocity, attack, time);
      this.amp.targetApproachTo(velocity, attack, time);
    } else if (attack > 0) {
      this.amp.cancelAndHoldAtTime(time);
      let curve = this._attackCurve;
      if (curve && curve.length) {
        for (let i = 0; i < curve.length; i++) {
          if (curve[i - 1] <= currentValue && currentValue <= curve[i]) {
            curve = this._attackCurve.slice(i);
            curve[0] = currentValue;
            break;
          }
        }
      }
      this.amp.setValueCurveAtTime(curve, time, attack, velocity);
    }

    if (decay) {
      const decayValue = velocity * this.sustain;
      const decayStart = time + attack;
      if (this._decayCurve === EnvelopeCurveType.Linear) {
        this.amp.linearRampTo(decayValue, decay, decayStart + this.context.sampleTime);
      } else if (this._decayCurve === EnvelopeCurveType.Exponential) {
        this.amp.targetApproachTo(decayValue, decay, decayStart);
        console.log('amp.targetApproachTo(', decayValue, decay, decayStart,')');
      }
    }
    return this;
  }

  public triggerRelease(time?) {
    time = this.toSeconds(time);
    const currentValue = this.getValueAtTime(time);
    if (currentValue > 0) {
      const release = this.toSeconds(this.release);
      if (this._releaseCurve === EnvelopeCurveType.Linear) {
        this.amp.linearRampTo(0, release, time);
      } else if (this._releaseCurve === EnvelopeCurveType.Exponential) {
        this.amp.targetApproachTo(0, release, time);
      } else if (release > 0) { // this._releaseCurve 是数组
        const curve = this._releaseCurve;
        if (isArray(curve)) {
          this.amp.cancelAndHoldAtTime(time);
          this.amp.setValueCurveAtTime(curve, time, release, currentValue);
        }
      }
    }
    return this;
  }

  public triggerAttackRelease(duration, time?, velocity?) {
    time = this.toSeconds(time);
    this.triggerAttack(time, velocity);
    this.triggerRelease(time + this.toSeconds(duration));
    return this;
  }

  public getValueAtTime(time?) {
    time = this.toSeconds(time);
    return this.amp.getValueAtTime(time);
  }

  get attackCurve() {
    if (isString(this._attackCurve)) {
      return this._attackCurve;
    } else if (isArray(this._attackCurve)) {
      for (let t in Envelope.TYPE) {
        if (Envelope.TYPE[t]['In'] === this._attackCurve) {
          return t;
        }
      }
    }
    return;
  }

  set attackCurve(curve) {
    if (Envelope.TYPE.hasOwnProperty(curve as any)) {
      if (isString(Envelope.TYPE[curve as string])) {
        this._attackCurve = Envelope.TYPE[(curve as string)];
      } else {
        this._attackCurve = Envelope.TYPE[(curve as string)]['In'];
      }
    }
  }

  get releaseCurve() {
    if (isString(this._releaseCurve)) {
      return this._releaseCurve;
    } else if (isArray(this._releaseCurve)) {
      for (let t in Envelope.TYPE) {
        if (Envelope.TYPE[t]['Out'] === this._releaseCurve) {
          return t;
        }
      }
    }
    return;
  }

  set releaseCurve(curve) {
    if (Envelope.TYPE.hasOwnProperty(curve as any)) {
      if (isString(Envelope.TYPE[curve as string])) {
        this._releaseCurve = Envelope.TYPE[curve as string];
      } else {
        this._releaseCurve = Envelope.TYPE[curve as string]['Out'];
      }
    }
  }
}

EasuAL.Envelope = Envelope;

(function initCurves() {
  const curveLen = 128;

  let i;
  let k;
  // 从 0 到 1
  const sineCurve_1:number[] = [];
  for (i = 0; i < curveLen; i++) {
    sineCurve_1[i] = Math.sin((i / (curveLen - 1)) * (Math.PI / 2));
  }
  // 从 0 到 1
  const rippleCurve:number[] = [];
  for (i = 0; i < curveLen - 1; i++) {
    k = (i / (curveLen - 1));
    const sineWave = Math.sin(k * (Math.PI * 2) * 6 - (Math.PI / 2)) + 1;
    rippleCurve[i] = sineWave / 10 + k * 0.83;
  }
  rippleCurve[curveLen - 1] = 1;

  const stairsCurve:number[] = [];
  const step = 5;
  for (i = 0; i < curveLen - 1; i++) {
    stairsCurve[i] = Math.ceil(i / (curveLen - 1) * step) / step;
  }

  const sineCurve_2:number[] = [];
  for (i = 0; i < curveLen - 1; i++) {
    sineCurve_2[i] = 0.5 * (1 - Math.cos(i / (curveLen - 1) * Math.PI));
  }

  function invertCurve(curve){
    const out = new Array(curve.length);
    for (let j = 0; j < curve.length; j++){
      out[j] = 1 - curve[j];
    }
    return out;
  }
  
  function reverseCurve(curve) {
    return curve.slice(0).reverse();
  }

  if (!Envelope.TYPE) {
    Envelope.TYPE = {
      Linear: 'linear',
      Exponential: 'exponential',
      Cosine: {
        In: sineCurve_1,
        Out: invertCurve(sineCurve_1),
      },
      Step: {
        In: stairsCurve,
        Out: invertCurve(stairsCurve),
      },
      Ripple: {
        In: rippleCurve,
        Out: invertCurve(rippleCurve),
      },
      Sine: {
        In: sineCurve_2,
        Out: invertCurve(sineCurve_2),
      }
    }
  }
})()

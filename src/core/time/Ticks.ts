import { isString, isUndef, isDefined } from '../../utils/typeCheck';
import { EasuAL } from '../BaseClass';
import { Time } from './Time';

export class Ticks extends EasuAL {
  public readonly TimeObject = true;
  public defaultUnit = 'i';
  public unit:string;
  private _val;

  constructor(val?, unit?) {
    super();
    this._val = val;
    this.unit = unit;

    if (isUndef(this.unit) && isString(this._val) &&
        (parseFloat(this._val) == this._val) &&
        this._val.charAt(0) !== '+') {
      this._val = parseFloat(this._val);
      this.unit = this.defaultUnit;
    } else if (val && val.constructor === this.constructor) {
      this._val = val.val;
      this.unit = val.unit;
    } else if (val.TimeObject === true){
      this._val = val.toTicks();
    }
    return this;
  }

  public beatsToUnits(beats) {
    return this.getTPQ() * beats;
  }

  public getBPM() {
    if (this.context && this.context._bpm) {
      return this.context.BPM.value;
    } else {
      // 默认值为 120
      return 120;
    }
  }

  public getTPQ() {
    if (this.context) {
      return this.context.TPQ;
    } else {
      // 默认值 192
      return 192;
    }
  }

  public getTimeSignature() {
    if (this.context && this.context._scheduler) {
      return this.context._scheduler.timeSignature;
    } else {
      return 4;
    }
  }

  public secondsToUnits(seconds) {
    return Math.floor(seconds / (60 / this.getBPM())) * this.getTPQ();
  }

  public toSeconds() {
    return (this.valueOf() / this.getTPQ()) * (60 / this.getBPM());
  }

  public valueOf() {
    return Time.prototype.valueOf.call(this);
  }
}

EasuAL.Ticks = Ticks;
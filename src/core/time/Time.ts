import { isString, isUndef, isDefined } from '../../utils/typeCheck';
import { EasuAL } from '../BaseClass';

export class Time extends EasuAL {
  public readonly TimeObject = true;
  public defaultUnit = 's';
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
    } else if (val && val.TimeObject === true){
      this._val = val.toSeconds();
    }
    return this;
  }

  public valueOf() {
    if (isUndef(this._val)) {
      return this.context.now();
    } else if (isString(this._val) && isUndef(this.unit)) {
      for (let key in this._timeRegEx) {
        if (this._timeRegEx[key].regex.test(this._val.trim())) {
          this.unit = key;
          break;
        }
      }
    }
    if (isDefined(this.unit)) {
      const expression = this._timeRegEx[this.unit];
      if (!expression) {
        return -1;
      }
      const matching = this._val.toString().trim().match(expression.regex);
      if (matching) {
        if (this.unit === 'n') {
          return expression.method(matching[1], matching[2]);
        } else if (this.unit === 'bar') {
          return expression.method(matching[1], matching[2], matching[3]);
        } else {
          return expression.method(matching[1]);
        }
      } else {
        return expression.method(parseFloat(this._val));
      }
    } else {
      return this._val;
    }
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

  public now() {
    return this.context.now();
  }
  /**
   * 
   * @param beats number of beat
   * normally, a beat is a quarter note,
   * 1 beat => quarter note;
   * 0.5 beat => eighth note;
   * 0.25 beat=> sixteenth note;
   * 2 beat => Half note;
   * 4 beat => Whole note;
   */
  public beatsToUnit(beats) {
    return (60 / this.getBPM()) * beats;
  }

  public secondsToUnit(seconds) {
    return seconds;
  }

  public ticksToUnit(ticks) {
    return ticks * (this.beatsToUnit(1) / this.getTPQ());
  }

  public toSeconds() {
    return this.valueOf();
  }

  public toTicks() {
    const quarterNotes = this.valueOf() / this.beatsToUnit(1);
    return Math.round(quarterNotes * this.getTPQ());
  }

  private _timeRegEx = {
    n: {  // 音符
      // 匹配： 2n, 0.5n, 1.5n. 最后一个点是 附点，https://zh.wikipedia.org/wiki/%E9%99%84%E9%BB%9E%E9%9F%B3%E7%AC%A6
      regex: /^(\d+)n(\.?)$/,
      method: (value, dot) => {
        value = parseInt(value);
        const durationScale = dot === '.' ? 1.5 : 1;
        return this.beatsToUnit(4 / value) * durationScale;
      }
    },
    s: {  // 秒
      // 匹配： 1s, 1.5s
      regex: /^(\d+(?:.\d+)?)s$/,
      method: (value) => {
        return this.secondsToUnit(parseFloat(value));
      }
    },
    after: { // 多久之后
      // 匹配：+1s, +2.5s, +4n, +2n 
      regex: /^\+(.+)$/,
      method: (rest) => {
        return this.now() + (new Time(rest)).valueOf();
      }
    },
    bar: {
      // measure:quater:sixteenth
      regex: /^(\d+(?:.\d+)?):(\d+(?:.\d+)?):(\d+(?:.\d+)?)$/,
      method: (b, q, s) => {
        let count = 0;
        if (b !== undefined && b !== 0) {
          count += this.beatsToUnit(parseInt(b) * this.getTimeSignature());
        }
        if (q !== undefined && q !== 0) {
          count += this.beatsToUnit(parseInt(q));
        }
        if (s !== undefined && s !== 0) {
          count += this.beatsToUnit(parseInt(s) / 4);
        }
        return count;
      }
    }
  }
}

EasuAL.Time = Time;
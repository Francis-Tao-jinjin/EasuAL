import { EasuAL } from '../BaseClass';
import { EasuALContext } from '../Context';
import { ParamEvent } from '../AutomationTimeline';

/**
 * 默认参考系：bpm 120，参考音符 4分音符
 * 则一秒钟参考tick数 384
 * 
 * BPMCurve 从创建的时候就开始记录总 tick 数，在销毁永远不会中断，
 * 就如同 AudioContext 的 currentTime 属性一样
 */

export class BPMCurve extends EasuAL.AudioParamTimeline {
  private _context:EasuALContext;
  constructor(context:EasuALContext) {
    super();
    this._context = context;

    this.cancelAfter(0);
    this.setValueAtTime(1, 0);
  }

  public setRampPoint(time) {
    const value = this.getValueAtTime(time);
    this.setValueAtTime(this._toBPM(value), time);
    return this;
  }

  public linearRampTo(value:number, rampTime:number, startTime?:number) {
    value = this._fromBPM(value);
    startTime = startTime === undefined ? EasuAL.context.now() : Math.max(startTime, 0);
    EasuAL.AudioParamTimeline.prototype.linearRampTo.call(this, value, rampTime, startTime);
    return this;
  }

  // set BPM at time, argument is actually bpm,
  // then convert BPM to ticks;
  public setValueAtTime(value:number, time:number) {
    value = this._fromBPM(value);
    this.insert({
      time,
      value,
      type: ParamEvent.SetValue,
    });
    const event = this.getMostRecent(time);
    const previousEvent = this.previousPoint(event);
    if (previousEvent) {
      const ticksAccumulateTime = this._getTicksSinceEvent(previousEvent, time);
      event.ticks = Math.max(ticksAccumulateTime, 0);
    }
    return this;
  }

  private _getTicksSinceEvent(event?, time?:number) {
    if (event === null) {
      event = { ticks: 0, time: 0 };
    } else if (event.ticks === undefined) {
      const previousEvent = this.previousPoint(event);
      if (previousEvent) {
        event.ticks = this._getTicksSinceEvent(previousEvent, event.time);
      } else {
        event.ticks = 0;
      }
    }
    time = time === undefined ? this._context.now() : Math.max(time, event.time);
    const val0 = this.getValueAtTime(event.time);
    let val1 = this.getValueAtTime(time);

    const recent = this.getMostRecent(time);
    if (recent && recent.time === time &&
        recent.type === ParamEvent.SetValue) {
      val1 = this.getValueAtTime(time - this._context.sampleTime);
    }
    return 0.5 * (time - event.time) * (val0 + val1) + event.ticks;
  }

  public getTicksAtTime(time?:number){
    time = time === undefined ? this._context.now() : Math.max(0, time);
    const event = this.getMostRecent(time);
    return Math.max(this._getTicksSinceEvent(event, time), 0);
  }

  // get the time of a specific tick occured
  public timeOfTick(tick) {
    const recent = this.getMostRecent(tick, 'ticks');
    const after = this.getRightNext(tick, 'ticks');
    if (recent && recent.ticks === tick) {
      return recent.time;
    } else if (recent && after &&
              // 注意如果事件类型是 linear，则 after.time 是变化结束的时间点
              after.type === ParamEvent.LinearRampToValue) {
      // 应为 tick 为 BPM（TPQ） 函数的积分，所以先获得原函数 y = k/2x^2 + cx
      // 则 (tick - recent.ticks) = k/2x^2 + cx 就是要求解的方程
      // 用判别式和求更公式得到 x，则 x + recent.time 就是所求的时间
      const v2 = after.value;
      const v1 = recent.value;
      const k = (v2 - v1) / (after.time - recent.time);
      const s = tick - recent.ticks;
      const delta = Math.sqrt((v1*v1) + 2 * k * s);
      const x1 = ((-v1) + delta) / k;
      const x2 = ((-v1) - delta) / k;
      if (x1 > 0) {
        return x1 + recent.time;
      } else {
        return x2 + recent.time;
      }
    } else if (recent) {
      // 没有设置过 bpm
      if (recent.value === 0) {
        return Infinity;
      } else {
        // 注意，revent.value 存储的是该 bpm 下的一秒钟内的 tick 数，而不是 bpm
        return recent.time + (tick - recent.ticks) / recent.value;
      }
    } else {
      return tick / 384;
    }
  }

  // 从 t 时刻开始，n 个 tick 的时常是多少
  public durationOfTicks(ticks:number, time?:number) {
    time = time === undefined ? this._context.now() : Math.max(time, 0);
    const ticksA = this.getTicksAtTime(time);
    return this.timeOfTick(ticksA + ticks) - time;
  }

  get value() {
    return this._toBPM(this.getValueAtTime(this._context.now()));
  }

  set value(val) {
    this.setValueAtTime(val, this._context.now());
  }

  private _fromBPM(bpm) {
    // how many tick per second;
    return (bpm * this._context.TPQ) / 60;
    // return 1 / (60 / bpm / this._context.TPQ);
  }

  private _toBPM(ticksPerSecond) {
    // how many quarterNote per minute
    return (ticksPerSecond / this._context.TPQ) * 60;
  }
}
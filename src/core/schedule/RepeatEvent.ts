import { EasuAL } from '../BaseClass';
import { OrdinayEvent } from './OrdinayEvent';
import { OrdinayEventOpt, RepeatEventOpt } from '../type';
import { Ticks } from '../time/Ticks';
import { Scheduler } from './Scheduler';

export class RepeatEvent {
  public duration:Ticks;
  public interval:Ticks;
  private _currentId:number;
  private _nextId:number;
  private _nextTick:number;

  static eventId = 0;
  public readonly id:number;
  public time:number;
  public callback: (time:any) => void;
  public once:boolean;
  protected _scheduler:Scheduler;

  constructor(opt:RepeatEventOpt) {
    // super(opt);
    this.id = OrdinayEvent.eventId++;
    this._scheduler = opt.scheduler;
    this.once = opt.once === undefined ? false : opt.once;
    this.time = new EasuAL.Ticks(opt.time).valueOf();
    this.callback = opt.callback;

    const duration = opt.duration === undefined ? Infinity : opt.duration;
    const interval = opt.interval === undefined ? 1 : opt.interval;
    this.duration = new EasuAL.Ticks(duration);
    this.interval = new EasuAL.Ticks(interval);

    this._currentId = -1;
    this._nextId = -1;
    
    // 第一次时间出发的时间（ticks）
    this._nextTick = this.time;
    this.activate = this.activate.bind(this);
    this.activate();
  }

  public invoke(time:number) {
    this._check(time);
    // OrdinayEvent.prototype.invoke.call(this, time);
    if (this.callback) {
      this.callback(time);
      if (this.once) {
        this._scheduler.remove(this.id);
        console.log('remove', this.id);
      }
    }
  }

  private _check(time) {
    const t_interval = this.interval.valueOf();
    const t_duration = this.duration.valueOf();
    const ticksCount = this._scheduler.getCountOfTicks(time);
    if (ticksCount > this.time &&
      ticksCount >= this._nextTick &&
        this._nextTick + t_interval < this.time + t_duration) {
      this._nextTick += t_interval;
      this._currentId = this._nextId;
      this._nextId = this._scheduler.scheduleOnce(this.invoke.bind(this), new EasuAL.Ticks(this._nextTick));
    }
  }

  public activate(time?) {
    this._scheduler.remove(this._currentId);
    this._scheduler.remove(this._nextId);
    this._nextTick = this.time;
    const t_interval = this.interval.valueOf();
    const t_duration = this.duration.valueOf();
    const ticksCount = this._scheduler.getCountOfTicks(time);
    
    if (ticksCount > this.time + t_duration) {
      return;
    }
    // 如果当前的时间已经超过了第一次触发的时间
    if (ticksCount > this.time) {
      this._nextTick = this.time + Math.ceil((ticksCount - this.time) / t_interval) * t_interval;
    }
    this._currentId = this._scheduler.scheduleOnce(this.invoke.bind(this), new EasuAL.Ticks(this._nextTick));
    if (this._nextTick + t_interval < this.time + t_duration) {
      this._nextTick += t_interval;
      this._nextId = this._scheduler.scheduleOnce(this.invoke.bind(this), new EasuAL.Ticks(this._nextTick));
    }
  }

  public destory() {
    delete this._scheduler;
    delete this.callback;
    delete this.time;
    delete this.once;
    return this;
  }
}
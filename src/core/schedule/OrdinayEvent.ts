import { Scheduler } from './Scheduler';
import { OrdinayEventOpt } from '../type';
import { EasuAL } from '../BaseClass';

export class OrdinayEvent {
  static eventId = 0;
  public readonly id:number;
  public time:number;
  public callback: (time:any) => void;
  public once:boolean;
  protected _scheduler:Scheduler;

  constructor(opt:OrdinayEventOpt) {
    this.id = OrdinayEvent.eventId++;
    this._scheduler = opt.scheduler;
    this.once = opt.once === undefined ? false : opt.once;
    this.time = new EasuAL.Ticks(opt.time).valueOf();
    this.callback = opt.callback;
  }

  public invoke(time) {
    if (this.callback) {
      this.callback(time);
      if (this.once) {
        this._scheduler.remove(this.id);
        console.log('remove', this.id);
      }
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
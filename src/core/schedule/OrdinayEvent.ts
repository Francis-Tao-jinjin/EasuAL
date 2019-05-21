import { Scheduler } from './Scheduler';
import { OrdinayEventOpt } from '../type';

export class OrdinayEvent {
  static eventId = 0;
  public readonly id:number;
  public time;
  public callback: (time:any) => void;
  public once:boolean;
  private _scheduler:Scheduler;

  constructor(opt:OrdinayEventOpt) {
    this.id = OrdinayEvent.eventId++;
    this._scheduler = opt.scheduler;
    this.once = opt.once === undefined ? false : opt.once;
    this.time = opt.time;
    this.callback = opt.callback;
  }

  public invoke(time) {
    if (this.callback) {
      this.callback(time);
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
import { EasuALContext } from '../Context';
import { TickCounter } from './TickCounter';
import { StateRecords } from '../../utils/StateRecords';
import { PlayState } from '../type';
import { OrdinayEvent } from './OrdinayEvent';
import { EventArrangement } from './EventArrangement';
import { isNumber } from '../../utils/typeCheck';
import { isArray } from 'util';
import { EasuAL } from '../BaseClass';
import { toSeconds } from '../../utils/helper';
import { IntervalArrangement } from './IntervalArrangement';
import { RepeatEvent } from './RepeatEvent';

export class Scheduler {
  
  private _timeSignature:number = 4;
  private _tickCounter:TickCounter;
  private _lastUpdate:number = 0;
  private _context:EasuALContext;
  private _processTick:Function;
  private _state:StateRecords;
  private _ticker?:Ticker;

  private _secheduleEvents:{[id:string]: {event:OrdinayEvent, storage:any}} = {}

  private _arrangements:EventArrangement;
  private _repeatArrangement:IntervalArrangement;

  constructor(context:EasuALContext, tickCounter:TickCounter) {
    this._context = context;
    this._tickCounter = tickCounter;
    this._state = new StateRecords(PlayState.Stopped);
    this._state.setStateAtTime(PlayState.Stopped, 0);
    this._processTick = (time,ticks) => {
      // console.log('time:', time, 'ticks:', ticks);
      this._arrangements.forEachAtTick(ticks, (event) => {
        event.invoke(time);
      })
    };
    this._arrangements = new EventArrangement();
    this._repeatArrangement = new IntervalArrangement();
  }

  // this method should be called continuous
  public check() {
    // 这里看出 check 被触发的时间间隔应该要小于
    // context 的 lookAhead， 否则就会有事件被略过去
    const startTime = this._lastUpdate;
    const endTime = this._context.now();
    this._lastUpdate = endTime;
    if (startTime !== endTime) {

      this._tickCounter.forEachTickBetween(startTime, endTime, (time, ticks) => {
        this._processTick(time, ticks);
      });
    }
  }

  public start(_time?:any, offset?:number) {
    const time = toSeconds(_time);
    offset = offset === undefined ? 0 : Math.max(0, offset);

    this._context._ctx.resume();
    if (this._state.getRecentStateAtTime(time) !== PlayState.Started){
      this._state.setStateAtTime(PlayState.Started, time);
      this._tickCounter.start(time, offset);
      this._repeatArrangement.forEach((event:RepeatEvent) => {
        event.activate(time);
      });
    } else {
      console.warn('Scheduler already started');
    }
  }

  public stop(_time?:any) {
    const time = toSeconds(_time);
    if (this._state.getRecentStateAtTime(time) === PlayState.Stopped) {
      const recentStop = this._state.getMostRecent(time);
      recentStop && this._state.cancelAfter(recentStop.time);
    }
    this._state.setStateAtTime(PlayState.Stopped, time);
    this._tickCounter.stop(time);
    return this;
  }

  public createTicker() {
    if (this._ticker) {
      return;
    }
    this._ticker = new Ticker(this.check.bind(this), 0.05);
  }

  public schedule(callback:(time:any) => void, time?) {
    const event = new OrdinayEvent({
      scheduler: this,
      time: new EasuAL.SchedulerTime(time),
      callback,
    });
    this._addEvent(event, this._arrangements);
    return event.id;
  }

  public scheduleOnce(callback:(time:any) => void, time?) {
    const event = new OrdinayEvent({
      scheduler: this,
      time: new EasuAL.SchedulerTime(time),
      once: true,
      callback,
    });
    this._addEvent(event, this._arrangements);
    return event.id;
  }

  public scheduleRepeat(callback:(time:any) => void, startTime?, interval?, duration?) {
    const s_time = new EasuAL.SchedulerTime(startTime);
    const event = new RepeatEvent({
      scheduler: this,
      time: s_time,
      interval: new EasuAL.Time(interval),
      duration: new EasuAL.Time((duration === undefined ? Infinity : duration)),
      callback,
    });
    // console.log('startTime:', startTime, s_time.toSeconds());
    this._addEvent(event, this._repeatArrangement);
    return event.id;
  }

  public _addEvent(event:RepeatEvent, storage:IntervalArrangement);
  public _addEvent(event:OrdinayEvent, storage:EventArrangement);
  public _addEvent(event, storage) {
    this._secheduleEvents[event.id] = {
      event: event,
      storage: storage,
    };
    storage.add(event);
  }

  public remove(id:number) {
    if (this._secheduleEvents.hasOwnProperty(id)) {
      const item = this._secheduleEvents[id];
      item.storage.remove(item.event);
      item.event.destory();
      delete this._secheduleEvents[id.toString()];
    }
    return this;
  }

  get timeSignature() {
    return this._timeSignature;
  }

  set timeSignature(signatures:any) {
    if (isArray(signatures) && isNumber(signatures[0]) && isNumber(signatures[1])) {
      this._timeSignature = (signatures[0] / signatures[1]) * 4;
    } else if (isNumber(signatures)) {
      this._timeSignature = signatures;
    }
  }

  public getCountOfTicks(_time?) {
    const time = toSeconds(_time);
    // console.log('getCountOfTicks time:', time);
    return Math.round(this._tickCounter.getCountOfTicks(time));
  }

  get ticks() {
    return Math.ceil(this._tickCounter.getCountOfTicks(this._context.now()));
  }

  set ticks(t) {
    this._tickCounter.setTicksAtTime(t, this._context.now());
  }

  get seconds() {
    return this._tickCounter.getElapsedSecondsAtTime(this._context.now());
  }

  set seconds(s:number) {
    const now = this._context.now();
    const ticks = this._context.BPM.timeToTick(s, now);
    this._tickCounter.setTicksAtTime(ticks, now);
  }
}

class Ticker {
  private _interval:number;
  private _callback:() => void;
  private _worker?:Worker;
  constructor(callback, interval:number) {
    this._callback = callback;
    this._interval = interval;
    this._initWorker();
  }

  private _initWorker() {
    const _URL:(typeof window.URL) = window.URL || (window as any).webkitURL;
    const blob = new Blob([`
      var timeoutTime = ${(this._interval * 1000).toFixed(1)};
      self.onmessage = function(msg) {
        timeoutTime = parseInt(msg.data);
      };
      function tick() {
        setTimeout(tick, timeoutTime);
        self.postMessage('tick');
      }
      tick();
    `]);
    const blobUrl = _URL.createObjectURL(blob);
    const worker = new Worker(blobUrl);

    worker.onmessage = () => {
      this._callback();
    };
    this._worker = worker;
  }

  public destory() {
    (this._callback as any) = null;
    (this._worker as Worker).terminate();
  }
}
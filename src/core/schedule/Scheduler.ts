import { EasuALContext } from '../Context';
import { TickCounter } from './TickCounter';
import { StateRecords } from '../../utils/StateRecords';
import { PlayState } from '../type';

export class Scheduler {
  
  private _tickCounter:TickCounter;
  private _lastUpdate:number = 0;
  private _context:EasuALContext;
  private _processTick:Function;
  private _state:StateRecords;
  private _ticker?:Ticker;

  constructor(context:EasuALContext, processTick:Function, tickCounter:TickCounter) {
    this._context = context;
    this._processTick = processTick;
    this._tickCounter = tickCounter;
    this._state = new StateRecords(PlayState.Stopped);
    this._state.setStateAtTime(PlayState.Stopped, 0);
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

  public start(time?:number, offset?:number) {
    const now = this._context.now();
    time = time === undefined ? now : Math.max(now, time);
    offset = offset === undefined ? 0 : Math.max(0, offset);

    this._context._ctx.resume();
    if (this._state.getRecentStateAtTime(time) !== PlayState.Started){
      this._state.setStateAtTime(PlayState.Started, time);
      this._tickCounter.start(time, offset);
    } else {
      console.warn('Scheduler already started');
    }
  }

  public stop(time?:number) {
    const now = this._context.now();
    time = time === undefined ? now : Math.max(now, time);
    if (this._state.getRecentStateAtTime(time) === PlayState.Stopped) {
      const recentStop = this._state.getMostRecent(time);
      recentStop && this._state.cancelAfter(recentStop.time);
    }
    this._state.setStateAtTime(PlayState.Stopped, time);
  }

  public createTicker() {
    if (this._ticker) {
      return;
    }
    this._ticker = new Ticker(this.check, 0.05);
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
      function() {
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

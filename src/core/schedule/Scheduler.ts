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

  public start(time:number, offset:number) {
    this._context._ctx.resume();
    if (this._state.getRecentStateAtTime(time) !== PlayState.Started){
      this._state.setStateAtTime(PlayState.Started, time);
      // this._tickCounter
    }
  }
}
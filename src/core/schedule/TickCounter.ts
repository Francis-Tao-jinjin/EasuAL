import { BPMCurve } from './BPMCurve';
import { EasuALContext } from '../Context';
import { AudioParamTimeline } from '../AutomationTimeline';
import { EasuAL } from '../BaseClass';
import { StateRecords } from '../../utils/StateRecords';
import { PlayState } from '../type';

/**
 * TickCounter 需要支持 start、stop 等方法，只有在 start 之后才会记录
 * 流逝的 tick 数，并且支持设置 start 时的初始 tickOffset，
 * 这也是和 BPMCurve 根本性上不同的地方
 */

export class TickCounter {

  private _state:StateRecords;
  private _bpmCurve:BPMCurve;
  private _context:EasuALContext;
  private _tickOffset:AudioParamTimeline;
  constructor(context:EasuALContext, bpm:BPMCurve) {
    this._context = context;
    this._bpmCurve = bpm;
    this._tickOffset = new EasuAL.AudioParamTimeline();
    this.setTicksAtTime(0, 0);
    
    this._state = new StateRecords(PlayState.Stopped);
    this._state.setStateAtTime(PlayState.Stopped, 0);
  }

  public setTicksAtTime(ticks:number, time?:number) {
    time = time === undefined ? this._context.now() : Math.max(time, 0);
    this._tickOffset.cancelAfter(time);
    this._tickOffset.insert({
      time: time,
      ticks: ticks,
      seconds: this._bpmCurve.durationOfTicks(ticks, time),
    });
    return this;
  }

  public forEachTickBetween(startTime:number, endTime:number, callback) {
    let latestRecord = this._state.getMostRecent(startTime);
    if (latestRecord === null) {
      return;
    }
    startTime = Math.max(latestRecord.time, startTime);
    // 如果 tick计数器开始
    if (latestRecord.state === PlayState.Started) {
      const startTicks = this._bpmCurve.getTicksAtTime(startTime);
      const ticksAtBegin = this._bpmCurve.getTicksAtTime(latestRecord.time);
      // 处理的流逝的 tick 总数目需要是整数
      let offset = (startTicks - ticksAtBegin) % 1;
      if (offset !== 0) {
        offset = 1 - offset;
      }
      let nextTickTime = this._bpmCurve.timeOfTick(startTicks + offset);
      while (nextTickTime < endTime) {
        const tick = Math.round(this.)
      }
    }
  }

  public start(time?, offset?:number) {
    time = time === undefined ? this._context.now() : Math.max(0, time);
    if (this._state.getRecentStateAtTime(time)  !== PlayState.Started) {
      this._state.setStateAtTime(PlayState.Started, time);
      if (offset !== undefined) {
        this.setTicksAtTime(offset, time);
      }
    }
  }


}
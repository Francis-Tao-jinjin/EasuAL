import { BPMCurve } from './BPMCurve';
import { EasuALContext } from '../Context';
import { AudioParamTimeline } from '../AutomationTimeline';
import { EasuAL } from '../BaseClass';
import { StateRecords } from '../../utils/StateRecords';
import { PlayState } from '../type';

/**
 * TickCounter 需要支持 start、stop、pause 等方法，只有在 start 之后才会记录
 * 流逝的 tick 数，并且支持设置 start 时的初始 tickOffset，
 * 这也是和 BPMCurve 根本性上不同的地方
 * 比如：
 * stop---start.....pause-----start...pause----start.......pause---
 * 上面的例子中有效的 segment 为 3 个, 有效的 tick 总数为 5 + 3 + 7 = 15
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

  public getCountOfTicks(time?:number) {
    time = time === undefined ? this._context.now() : Math.max(time, 0);
    let lastStopRecord = this._state.getLastOneOfStateBeforeTime(PlayState.Stopped, time);
    if (lastStopRecord === null) {
      lastStopRecord = {state:PlayState.Stopped, time: 0};
    }
    let firstStartRecord = this._state.getFirstOneOfStateAfterTime(PlayState.Started, lastStopRecord.time);
    if (firstStartRecord === null) {
      firstStartRecord = {state:PlayState.Started, time: 0};
    }
    // 因为统计 tick 需要又一个非 Started 状态的值作为结尾
    let tempPause = { time, state: PlayState.Paused };
    this._state.add(tempPause);

    let elapsedTicks = 0;
    let previous = firstStartRecord;
    let segmentStart = firstStartRecord.time;
    this._state.forEachBetween(firstStartRecord.time, time + this._context.sampleTime, (bpmRecord:{state:PlayState, time:number}) => {
      const offsetState = this._tickOffset.getMostRecent(bpmRecord.time);
      if (offsetState !== null && offsetState.time >= previous.time) {
        elapsedTicks = offsetState.ticks;
      }
      if (bpmRecord.state === PlayState.Started) {
        segmentStart = bpmRecord.time;
      }
      if (previous.time !== bpmRecord.time &&
          previous.state === PlayState.Started && bpmRecord.state !== PlayState.Started) {
        elapsedTicks += this._bpmCurve.getTicksAtTime(bpmRecord.time) - this._bpmCurve.getTicksAtTime(segmentStart);
      }
      previous = bpmRecord;
    });
    this._state.remove(tempPause);
    return elapsedTicks;
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

  // startTime 和 endTime 正常的时间
  public forEachTickBetween(startTime:number, endTime:number, callback) {
    let latestRecord = this._state.getMostRecent(startTime);
    if (latestRecord === null) {
      return;
    }
    startTime = Math.max(latestRecord.time, startTime);
    // 如果 tick 计数器启动了，那么需要查看每个 tick 上是否有事件要触发
    if (latestRecord.state === PlayState.Started) {
      const startTicks = this._bpmCurve.getTicksAtTime(startTime);
      const ticksAtBegin = this._bpmCurve.getTicksAtTime(latestRecord.time);
      // 处理的流逝的 tick 总数目需要是整数
      let offset = (startTicks - ticksAtBegin) % 1;
      if (offset !== 0) {
        offset = 1 - offset;
      }
      // nextTickTime 就是希望执行某个时间的 context 时间（总应该大于等于 context.currentTime）
      let nextTickTime = this._bpmCurve.timeOfTick(startTicks + offset);
      while (nextTickTime < endTime) {
        const tickCount = Math.round(this.getCountOfTicks(nextTickTime));
        callback(nextTickTime, tickCount);
        nextTickTime += this._bpmCurve.durationOfTicks(1, nextTickTime);
      }
    }
    return this;
  }

  public start(time?:number, offset?:number) {
    time = time === undefined ? this._context.now() : Math.max(0, time);
    if (this._state.getRecentStateAtTime(time) !== PlayState.Started) {
      this._state.setStateAtTime(PlayState.Started, time);
      if (offset !== undefined) {
        this.setTicksAtTime(offset, time);
      }
    }
    return this;
  }

  public pause(time?:number) {
    time = time === undefined ? this._context.now() : Math.max(0, time);
    if (this._state.getRecentStateAtTime(time) === PlayState.Started) {
      this._state.setStateAtTime(PlayState.Paused, time);
    }
    return this;
  }

  public stop(time?:number) {
    time = time === undefined ? this._context.now() : Math.max(0, time);
    if (this._state.getRecentStateAtTime(time) === PlayState.Stopped) {
      const recentStop = this._state.getMostRecent(time);
      if (recentStop) {
        this._state.cancelAfter(recentStop.state);
        this._tickOffset.cancelAfter(recentStop.time);
      }
    }
    this._state.cancelAfter(time);
    this._state.setStateAtTime(PlayState.Stopped, time);
    return this;
  }
}
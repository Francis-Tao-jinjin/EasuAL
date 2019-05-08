import { EasuAL } from '../core/BaseClass';
import { EasuBuffer } from '../core/AudioBuffer';
import { BufferSourceOpt, AudioParamUnits, FadeCurve } from '../core/type';
import { EasuAudioParam } from '../core/AudioNode';

export class EasuBufferSource extends EasuAL.EasuAudioNode {
  private _buffer:EasuBuffer;
  private _gainNode:GainNode;
  private _sourceNode:AudioBufferSourceNode;

  private _stopTime:number = -1;
  private _startTime:number = -1;

  // public loop:boolean;
  public fadeCurve:FadeCurve;
  public volume:EasuAudioParam;
  public fadeInDuration:number;
  public fadeOutDuration:number;
  public playbackRate:EasuAudioParam;

  private _sourceStarted = false;
  private _sourceStopped = false;
  
  public onended:(param:any) => void;

  public readonly output;
  constructor(opt:BufferSourceOpt) {
    super();
    opt = {
      loopEnd: 0,
      loopStart: 0,
      fadeCurve: FadeCurve.Exponential,
      playbackRate: 1,
      fadeInDuration: 0,
      fadeOutDuration: 0,
      loop: false,
      onload: () => {},
      onended: () => {},
      ...opt,
    };

    this._sourceNode = this.context.createBufferSource();
    this.output = this._gainNode = this.context.createGain();
    this._buffer = new EasuAL.EasuBuffer({src: opt.buffer, onload: opt.onload});
    
    this.playbackRate = new EasuAL.EasuAudioParam({
      param: this._sourceNode.playbackRate,
      value: opt.playbackRate,
      unit: AudioParamUnits.default,
    });

    this.volume = new EasuAL.EasuAudioParam({
      param: this._gainNode.gain,
      value: 1,
      unit: AudioParamUnits.gain,
    });

    this.loop = (opt.loop as boolean);
    this.loopEnd = (Math.max(<number>opt.loopEnd, 0));
    this.loopStart = (opt.loopStart as number);
    this.fadeCurve = (opt.fadeCurve as FadeCurve);
    this.onended = (opt.onended as (param:any)=>void);
    this.fadeInDuration = (opt.fadeInDuration as number);
    this.fadeOutDuration = (opt.fadeOutDuration as number);
    this._sourceNode.connect(this._gainNode);
  }

  set loop(flag:boolean) {
    this._sourceNode.loop = flag;
  }

  get loop() {
    return this._sourceNode.loop;
  }

  set loopStart(value:number) {
    this._sourceNode.loopStart = value;
  }

  get loopStart() {
    return this._sourceNode.loopStart;
  }

  set loopEnd(value:number) {
    this._sourceNode.loopEnd = value;
  }

  get loopEnd() {
    return this._sourceNode.loopEnd;
  }

  public start(time?:number, offset?:number, duration?:number, gain?:number) {
    if (this._startTime !== -1) {
      throw('can only be start once');
    }
    if (this._buffer.length === 0) {
      throw('buffer is either not set or not loaded');
    }
    if (this._sourceStopped) {
      throw('source is already stopped');
    }
    gain = gain === undefined ? 1 : Math.max(gain, 0);
    time = time === undefined ? this.context.now() : Math.max(time, this.context.now());

    if (this.loop) {
      offset = offset === undefined ? this.loopStart : Math.max(offset, 0);
      const loopEnd = Math.min(Math.max(this.loopEnd, 0), this._buffer.duration) || this._buffer.duration;
      const loopStart = Math.min(Math.max(this.loopStart, 0), loopEnd);
      if (offset > loopEnd) {
        offset = ((offset - loopStart) % (loopEnd - loopStart)) + loopStart;
      }
      this.loopEnd = loopEnd;
      this.loopStart = loopStart;
    } else{
      offset = offset === undefined ? 0 : Math.max(offset, 0);
    }
    if (this.fadeInDuration > 0) {
      this.volume.setValueAtTime(0, time);

      if (this.fadeCurve === FadeCurve.Exponential) {
        this.volume.targetApproachTo(gain, this.fadeInDuration, time);
      } else {
        this.volume.linearRampTo(gain, this.fadeInDuration, time);
      }
    } else {
      this.volume.setValueAtTime(gain, time);
    }

    this._sourceNode.buffer = this._buffer.get();
    this._startTime = time;
    this._sourceNode.onended = this.onended.bind(this);
    this._sourceNode.start(time, offset);
    // 留出剩下的时间用来淡出
    if (duration !== undefined) {
      duration = Math.max(0, duration);
      this.stop(time + duration);
    }
    this._sourceStarted = true;
    return this;
  }

  public stop(time?:number) {
    if (this._buffer.length === 0) {
      console.warn('audioBuffer is empty');
      return;
    }
    if (this._sourceStopped) {
      console.warn('BufferSource already stopped');
      return;
    }
    if (this._stopTime !== -1) {
      if (this._startTime !== -1 && this._sourceStopped === false) {
        this.volume.cancelScheduledValues(this._startTime + this.fadeInDuration + this.context.sampleTime);
        this._stopTime = -1;
      }
    }
    time = time === undefined ? this.context.now() : Math.max(time, this.context.now());
    this._stopTime = time + this.fadeOutDuration;
    if (this.fadeOutDuration > 0) {
      if (this.fadeCurve === FadeCurve.Exponential) {
        this.volume.targetApproachTo(0, this.fadeOutDuration, time);
      } else {
        this.volume.linearRampTo(0, this.fadeOutDuration, time);
      }
    } else {
      this.volume.cancelScheduledValues(time);
      this.volume.setValueAtTime(0, time);
    }
    this._sourceNode.stop(this._stopTime);
    return this;
  }
}

EasuAL.EasuBufferSource = EasuBufferSource;
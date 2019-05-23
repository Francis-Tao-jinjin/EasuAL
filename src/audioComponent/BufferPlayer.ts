import { EasuAL } from '../core/BaseClass';
import { EasuBuffer } from '../core/AudioBuffer';
import {
  BufferSourceOpt,
  AudioParamUnits,
  FadeCurve,
  BufferPlayerOpt
} from '../core/type';
import { EasuAudioParam } from '../core/AudioNode';
import { EasuBufferSource } from './BufferSource';

export class BufferPlayer extends EasuAL.EasuAudioNode {
  public output;
  public sourceOpt:BufferSourceOpt;
  public autoStart:boolean = false;

  public onended:(param:any)=>void;
  private _sources:EasuBufferSource[] = [];
  constructor(opt:BufferPlayerOpt) {
    super();
    if (opt.autoStart !== undefined) {
      this.autoStart = opt.autoStart;
      delete opt.autoStart;
    }
    this.sourceOpt = {
      loopEnd: 0,
      loopStart: 0,
      fadeCurve: FadeCurve.Exponential,
      playbackRate: 1,
      fadeInDuration: 0,
      fadeOutDuration: 0,
      loop: false,
      onload: () => {},
      onended: () => {},
      ...(opt as BufferSourceOpt),
    };
    this.onended = (this.sourceOpt.onended as ()=>void);
    this.output = this.context.createGain();
  }

  public start(_time?:any, offset?:number, duration?:number) {
    const time = this.toSeconds(_time);
    const source = new EasuAL.EasuBufferSource(this.sourceOpt);
    source.connect(this.output);
    source.onended = this._onSourceEnd.bind(this);
    if (this.sourceOpt.loop) {
      offset = offset === undefined ? this.sourceOpt.loopStart : offset;
    } else {
      offset = offset === undefined ? 0 : offset;
    }
    let computedDuration = duration === undefined ? Math.max(this.sourceOpt.buffer.duration - <number>offset, 0) : duration;
    computedDuration = computedDuration / <number>this.sourceOpt.playbackRate;

    this._sources.push(source);
    if (this.sourceOpt.loop && duration !== undefined) {
      source.start(time, offset);
    } else {
      source.start(time, offset, computedDuration - <number>this.sourceOpt.fadeOutDuration);
    }
    return this;
  }

  public stop(_time?:any) {
    const time = this.toSeconds(_time);
    for (let i = 0; i < this._sources.length; i++) {
      this._sources[i].stop(time);
    }
    return this;
  }

  private _onLoaded() {

  }

  private _onSourceEnd(source:EasuBufferSource) {
    const idx = this._sources.indexOf(source);
    this._sources.splice(idx, 1);
    this.onended(source);
  }

  set fadeInDuration(val:number) {
    this.sourceOpt.fadeInDuration = val;
  }
  
  get fadeInDuration() {
    return (this.sourceOpt.fadeInDuration as number);
  }

  set fadeOutDuration(val:number) {
    this.sourceOpt.fadeOutDuration = val;
  }
  
  get fadeOutDuration() {
    return (this.sourceOpt.fadeOutDuration as number);
  }
  
  set loop(flag:boolean) {
    this.sourceOpt.loop = flag;
  }

  get loop(){
    return (this.sourceOpt.loop as boolean);
  }
}

EasuAL.BufferPlayer = BufferPlayer;
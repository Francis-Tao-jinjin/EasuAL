import { EasuBuffer } from './AudioBuffer';

export enum AudioParamUnits {
  gain,
  decibel,
  cent,
  hz,
  default,
};

export interface EasuAudioParamOpt {
  param:AudioParam;
  unit:AudioParamUnits;
  value?:any;
};

export interface EasuOscNodeOpt {
  type?:OscillatorType;
  frequency?:number;
  detune?:number;
  onended?:(param:any) => void;
};

export interface OscillatorOpt {
  frequency?:any;
  type?:any;
  detune?:number;
  phase?:any;
  partials?:number[];
  partialCount?:number;
};

export interface EasuBufferOpt {
  src?:string|AudioBuffer|EasuBuffer;
  onload?:(param:any)=>void;
  onerror?:(param:any)=>void;
};

export enum FadeCurve {
  Linear,
  Exponential,
}

export interface BufferSourceOpt {
  buffer:AudioBuffer|EasuBuffer;
  loop?:boolean;
  loopEnd?:number;
  loopStart?:number;
  playbackRate?:number;
  fadeCurve?:FadeCurve;
  fadeInDuration?:number;
  fadeOutDuration?:number;
  onload?:() => void;
  onended?:() => void;
}

export interface BufferPlayerOpt extends BufferSourceOpt {
  autoStart?:boolean;
}

export enum PlayState {
  Stopped,
  Started,
  Paused,
}
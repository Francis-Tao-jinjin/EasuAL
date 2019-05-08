import { EasuAL } from '../core/BaseClass';
import { AudioParamUnits } from '../core/type';

export class ConstantSource extends EasuAL.EasuAudioNode {
  private _constantSource = this.context.createConstantSource();
  private _param:AudioParam;
  private _unit:AudioParamUnits;
  public readonly setValueAtTime:(value, time?)=>void;
  public readonly getValueAtTime:(time?)=>void;
  public readonly linearRampTo:(value:number, rampTime:number, startTime?:number)=>void;
  public readonly exponentialRampTo:(value:number, rampTime:number, startTime?:number)=>void;
  public readonly targetApproachTo:(value:number, rampTime:number, startTime:number)=>void;

  public readonly input;
  public readonly output;
  constructor(value=1, unit=AudioParamUnits.default) {
    super();
    this._param = this._constantSource.offset;

    this.setValueAtTime = EasuAL.EasuAudioParam.prototype.setValueAtTime.bind(this);
    this.getValueAtTime = EasuAL.EasuAudioParam.prototype.getValueAtTime.bind(this);
    this.linearRampTo = EasuAL.EasuAudioParam.prototype.linearRampTo.bind(this);
    this.exponentialRampTo = EasuAL.EasuAudioParam.prototype.exponentialRampTo.bind(this);
    this.targetApproachTo = EasuAL.EasuAudioParam.prototype.targetApproachTo.bind(this);
    
    this._constantSource.start(0);
    this.input = this._param;
    this.output = this._constantSource;
    this.value = value;
    this._unit = unit;
  }

  set value(val) {
    this._constantSource.offset.value = val;
  }

  get value() {
    return this._constantSource.offset.value;
  }

  public connect(node:any) {
    if (node.constructor === EasuAL.ConstantSource ||
        node.constructor === EasuAL.EasuAudioParam) {
      node._param.cancelScheduledValues(0);
      node._param.setValueAtTime(0, 0);
    } else if (node instanceof AudioParam) {
      node.cancelScheduledValues(0);
      node.setValueAtTime(0, 0);
    }
    EasuAL.EasuAudioNode.prototype.connect.call(this, node);
    return this;
  }
}

EasuAL.ConstantSource = ConstantSource;



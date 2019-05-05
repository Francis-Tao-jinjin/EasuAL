import { EasuAL } from './BaseClass';

/**
 * original idea is from apple webkit implementation https://github.com/WebKit/webkit/blob/master/Source/WebCore/Modules/webaudio/AudioParamTimeline.cpp 
 * and jsantell adopt it to create these JavaScript version https://github.com/jsantell/web-audio-automation-timeline/blob/master/lib/timeline.js
 * it also adopt by mozilla and become part of devtools.
 * The ideas is use timeline to record any change of AudioParam's value which apply automation function to ramp value
 * make everything trackable alone time, it will be much easier if webaudio API expose those api, but they didn't, that why we actually
 * need to make this.
 */
const MINI = 1e-5;

export enum ParamEvent {
    SetValue,
    LinearRampToValue,
    exponentialRampToValue,
    SetTarget,
    SetValueCurve,
    cancelScheduledValues,
}

export class AudioParamTimeline {
    private _rampPoints:any[] = [];
    private _defaultValue:number;
    
    public capacity:number;
    

    constructor(capacity:number = 2000, defaultValue:number = 0) {
        this.capacity = capacity;
        this._defaultValue = defaultValue;
    }

    public insert(event) {
        const idx = this.search(event.time);
        this._rampPoints.splice(idx + 1, 0, event);
        if (this._rampPoints.length > this.capacity) {
            this._rampPoints.shift();
        }
    }

    public setValueAtTime(value, time:number) {
        const event = {
            type: ParamEvent.SetValue,
            time: time,
            value:value,
        }
        this.insert(event);
        return this;
    }

    public setRampPoint(time) {
        const value = this.getValueAtTime(time);
        this.setValueAtTime(value, time);
        return this;
    }

    public linearRampTo(value:number, rampTime:number, startTime?:number) {
        startTime = startTime === undefined ? EasuAL.context.now() : startTime;
        this.setRampPoint(startTime);
        this._linearRampToValueAtTime(value, rampTime + startTime);
        return this;
    }

    /**
     *  到达 value 时，曲线的斜率是 a^x
     *  y=d\cdot\left(\frac{10}{d}\right)^{\left(\frac{x}{10}\right)}
     *  https://www.desmos.com/calculator
     */
    public exponentialRampTo(value:number, rampTime:number, startTime?:number) {
        startTime = startTime === undefined ? EasuAL.context.now() : startTime;
        this.setRampPoint(startTime);
        this._exponentialRampToValueAtTime(value, rampTime + startTime);
        return this;
    }

    /**
     *  当 y 逼近 value 时， 曲线的斜率是 e^-x
     *  y=d+\left(10-d\right)\left(1-e^{\left(-\frac{x}{20}\right)}\right)
     *  https://www.desmos.com/calculator
     * */ 
    public targetRampTo(value:number, rampTime:number, startTime?:number) {
        const timeConstant = rampTime / 6;
        startTime = startTime === undefined ? EasuAL.context.now() : startTime;
        this.setRampPoint(startTime);
        this._setTargetAtTime(value, startTime, timeConstant);
        this.setValueAtTime(value, startTime + rampTime);
        return this;
    }

    private _linearRampToValueAtTime(value, endTime) {
        // start time is now
        const event = {
            type: ParamEvent.LinearRampToValue,
            time: endTime, // finished time
            value: value, // finished value
        };
        this.insert(event);
    }

    private _exponentialRampToValueAtTime(value, endTime) {
        // start time is now        
        const event = {
            type: ParamEvent.exponentialRampToValue,
            time: endTime,
            value: value,
        };
        this.insert(event);
    }
    /**
     *  according to API document, the equaction is
     *  y = 1 - e^(-(x/timeConstant)), x = t - startTime
     *  when x/timeConstant equal to 5, y = 99.33%
     *  when x/timeConstant equal to 10, y = 99.995%
     */
    private _setTargetAtTime(target, startTime, timeConstant) {
        const event = {
            type: ParamEvent.SetTarget,
            time: startTime,
            value: target,
            timeConstant: timeConstant,
        };
        this.insert(event);
    }

    public getValueAtTime(time) {
        const next = this.getRightNext(time);
        const recent = this.getMostRecent(time);
        let value;
        if (recent === null) {
            value = this._defaultValue;
        } else if (recent.type === ParamEvent.SetTarget) {
            // 此时, recent.time 是 start Time, recent.value 是 final value
            const previous = this.getPrevious(time);
            if (previous === null) {
                value = this._defaultValue; // value 是 begin value
            } else {
                value = previous.value;
            }
            value = setTargetInterpolate(value, recent.value, recent.time, time, recent.timeConstant);
        } else if (next === null) {
            value = recent.value;
        } else if (next.type === ParamEvent.LinearRampToValue) {
            // next 为 LinearRampToValue 时，结束时间为 next.time
            // 但是存在一个问题就是开始的时间其实没有严格的记录，这是因为 LinearRampToValue 本身没有考虑这个问题
            // 所以为了避免直接使用 LinearRampToValue 而将其变成私有方法
            value = linearRampToInterpolate(recent.value, next.value, recent.time, next.time, time);
        } else if (next.type === ParamEvent.exponentialRampToValue) {
            // next 为 LinearRampToValue 时，结束时间为 next.time
            // 问题同上
            value = exponentialRampToInterpolate(recent.value, next.value, recent.time, next.time, time);
        } else {
            // 从 recent 到 next，数值没有发生变动
            value = recent.value;
        }
        return value;
    }

    public search(time) {
        if (this._rampPoints.length === 0) {
            return -1;
        }
        if (this._rampPoints.length > 0 && this._rampPoints[this._rampPoints.length - 1].time <= time) {
            return this._rampPoints.length - 1;
        }
        for (let i = 0; i<this._rampPoints.length; i++) {
            if (this._rampPoints[i].time === time) {
                let j = i;
                // find the last one that have the same value
                while(j+1 < this._rampPoints.length && this._rampPoints[j+1].time === time) {
                    j++;
                }
                return j;
            } else if (this._rampPoints[i].time > time) {
                return i - 1;
            }
        }
        return -1;
    }

    public getRightNext(time) {
        const idx = this.search(time);
        if (idx + 1 < this._rampPoints.length) {
            return this._rampPoints[idx + 1];
        } else {
            return null;
        }
    }

    public getMostRecent(time) {
        const idx = this.search(time);
        if (idx !== -1) {
            return this._rampPoints[idx];
        } else {
            return null;
        }
    }

    public getPrevious(time) {
        if (this._rampPoints.length > 0 &&
            this._rampPoints[this._rampPoints.length-1].time < time) {
            return this._rampPoints[this._rampPoints.length-1];
        }
        const idx = this.search(time);
        if (idx > 0) {
            return this._rampPoints[idx-1];
        } else {
            return null;
        }
    }

    public cancelAfter(time:number) {
        let idx = this.search(time);
        if (idx) {
            if (this._rampPoints[idx].time === time) {
                let i = idx;
                for (;this._rampPoints[i].time && i > 0; i--) {}
                idx = i;
            }
            if (idx >= 0) {
                this._rampPoints = this._rampPoints.slice(0, idx);
            } 
        }
        else {
            this._rampPoints = [];
        }
    }
}

EasuAL.AudioParamTimeline = AudioParamTimeline;

function setTargetInterpolate(v0, v1, t0, t, timeConstant) {
    return v0 + (v1 - v0) * (1 - Math.exp(-(t-t0)/timeConstant));
}

function linearRampToInterpolate(v0, v1, t0, t1, t) {
    return ((v1 - v0) / (t1 - t0)) * (t - t0) + v0;
}

// https://github.com/WebKit/webkit/blob/master/Source/WebCore/Modules/webaudio/AudioParamTimeline.cpp#L237
// beware of v0, it cannot be ZERO
function exponentialRampToInterpolate(v0, v1, t0, t1, t) {
    return v0 * Math.pow((v1/v0), (t - t0)/(t1 - t0));
}


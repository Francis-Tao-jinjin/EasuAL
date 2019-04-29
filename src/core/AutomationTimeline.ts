/**
 * original idea is from https://github.com/WebKit/webkit/blob/master/Source/WebCore/Modules/webaudio/AudioParamTimeline.cpp 
 * and jsantell adopt it to create these JavaScript version https://github.com/jsantell/web-audio-automation-timeline/blob/master/lib/timeline.js
 * it also adopt by mozilla and become part of devtools.
 * The ideas is use timeline to record any change of AudioParam's value which apply automation function to ramp value
 * make state trackable alone time.
 */

export enum ParamEvent {
    SetValue,
    LinearRampToValue,
    exponentialRampToValue,
    SetTarget,
    SetValueCurve,
    cancelScheduledValues,
}

export class AduioParamTimeline {
    private _rampPoints = [];

    constructor() {

    }

    public insert(event) {
        const idx = this.search(event.time);
        this._rampPoints.splice(idx + 1, 0, event);
    }

    public setValueAtTime(value, time:number) {
        const event = {
            type: ParamEvent.SetValue,
            time: time,
            value:value,
        }
        this.insert(event);
    }

    public linearRampToValueAtTime(value, endTime) {
        // start time is now
        const event = {
            type: ParamEvent.LinearRampToValue,
            time: endTime, // finished time
            value: value, // finished value
        };
        this.insert(event);
    }

    public exponentialRampToValueAtTime(value, endTime) {
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
    public setTargetAtTime(target, startTime, timeConstant) {
        const event = {
            type: ParamEvent.SetTarget,
            time: startTime,
            value: target,
            timeConstant: timeConstant,
        };
        this.insert(event);
    }

    public getValueAtTime(time) {
        

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
                while(this._rampPoints[j].time === time) {
                    j++;
                }
                return j;
            } else if (this._rampPoints[i].time > time) {
                return i - 1;
            }
        }
    }

    private cancelAfter(time:number) {
        let idx = this.search(time);
        if (this._rampPoints[idx].time === time) {
            let i = idx;
            for (;this._rampPoints[i].time && i > 0; i--) {}
            idx = i;
        }
        if (idx >= 0) {
            this._rampPoints = this._rampPoints.slice(0, idx);
        } else {
            this._rampPoints = [];
        }
    }
}
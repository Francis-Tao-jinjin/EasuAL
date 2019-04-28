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
    ExponentialRampToValue,
    SetTarget,
    SetValueCurve,
    cancelScheduledValues,
}

export class AduioParamTimeline {
    private _events = [];

    constructor() {

    }

    public insertEvent(event) {
        const idx = this.search(event.time);
        this._events.slice(idx + 1, )
    }

    public setValueAtTime(value, time:number) {
        const event = {
            type:ParamEvent.SetValue,
            time: time,
            value:value,
        }
        this.insertEvent(event);
    }

    public linearRampToValueAtTime(value, time) {

    }

    public exponentialRampToValueAtTime(value, time) {

    }

    public setTargetAtTime(target, time, timeConstant) {

    }

    public cancelScheduledValues(time:number) {

    }

    public search(time) {
        if (this._events.length === 0) {
            return -1;
        }
        if (this._events.length > 0 && this._events[this._events.length - 1].time <= time) {
            return this._events.length - 1;
        }
        for (let i = 0; i<this._events.length; i++) {
            if (this._events[i].time === time) {
                let j = i;
                // find the last one that have the same value
                while(this._events[j].time === time) {
                    j++;
                }
                return j;
            } else if (this._events[i].time > time) {
                return i - 1;
            }
        }
    }

    private _cancelAfter(time:number) {
        let idx = this.search(time);
        if (this._events[idx].time === time) {
            let i = idx;
            for (;this._events[i].time && i > 0; i--) {}
            idx = i;
        }
        if (idx >= 0) {
            this._events = this._events.slice(0, idx);
        } else {
            this._events = [];
        }
    }
}
import { OrdinayEvent } from './OrdinayEvent';

export class EventArrangement {
  private _events:OrdinayEvent[] = [];

  constructor() {
  }

  public searchAloneTime(time:number) {
    if (this._events.length === 0) {
      return -1;
    }
    const len = this._events.length;
    let start = 0;
    let end = len;
    if (len > 0 && this._events[len - 1].time <= time) {
      return len - 1;
    }
    while (start < end) {
      let mid = Math.floor (start + (end - start) / 2);
      const event = this._events[mid];
      let nextEvent = this._events[mid + 1];
      if (event.time > time) {
        end = mid;
      } else if (event.time < time && nextEvent.time > time) {
        return mid;
      } else if (event.time === time) {
        for (let i = mid; i < this._events.length; i++) {
          if (this._events[i].time === time) {
            mid = i;
          }
        }
        return mid;
      } else {
        start = mid + 1;
      }
    }
    return -1;
  }

  public add(event:OrdinayEvent) {
    let idx = this.searchAloneTime(event.time);
    this._events.splice(idx + 1, 0, event);
    return this;
  }

  public forEachAtTick(tick, callback) {
    let idx = this.searchAloneTime(tick);
    const end = idx;
    if (idx >= 0 && this._events[idx].time === tick) {
      let i = idx;
      for (; this._events[i].time === tick && i > 0; i--) {}
    } else {
      return;
    }
    for (let i = idx; i <= end; i++) {
      callback(this._events[i]);
    }
  }

  public remove(event) {
    const idx = this._events.indexOf(event);
    if (idx !== -1) {
      this._events.splice(idx, 1);
    }
    return this;
  }
}
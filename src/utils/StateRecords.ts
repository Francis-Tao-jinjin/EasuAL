import { PlayState } from '../core/type';

export class StateRecords {
  private _records:{state:PlayState, time:number}[] = [];
  private _initialState:PlayState;
  
  constructor(initialState:PlayState) {
    this._initialState = initialState;
  }

  public searchAloneTime(time:number) {
    if (this._records.length === 0) {
      return -1;
    }
    const len = this._records.length;
    let start = 0;
    let end = len;
    if (len > 0 && this._records[len - 1].time <= time) {
      return len - 1;
    }
    while (start < end) {
      let mid = Math.floor(start + (end - start) / 2);
      const record = this._records[mid];
      let nextRecord = this._records[mid + 1];
      if (record.time > time) {
        end = mid;
      } else if (record.time < time && nextRecord.time > time) {
        return mid; // 返回小于等于time的那一项下标
      } else if (record.time === time) {
        for (let i = mid; i < this._records.length; i++) {
          if (this._records[i].time === time) {
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

  public forEachBetween(startTime, endTime, callback) {
    let end = this.searchAloneTime(endTime);
    let start = this.searchAloneTime(startTime);
    if (start !== -1 && end !== -1) {
      if (this._records[start].time !== startTime) {
        start += 1;
      }
      if (this._records[end].time === endTime) {
        end -= 1;
      }
    } else if (start === -1) {
      start = 0;
    }
    for (let i = start; i <= end; i++) {
      callback(this._records[i]);
    }
    return this;
  }

  public add(record:{state:PlayState, time:number}) {
    if (record.time === undefined || record.state === undefined) {
      throw new Error('StateMemo: unvalid attribute');
    }
    let idx = this.searchAloneTime(record.time);
    this._records.splice(idx + 1, 0, record);
    return this;
  }

  public remove(record) {
    const index = this._records.indexOf(record);
    if (index !== -1) {
      this._records.splice(index, 1);
    }
    return this;
  }

  public setStateAtTime(state, time?) {
    this.add({
      state,
      time,
    });
    return this;
  }

  public getMostRecent(time) {
    const idx = this.searchAloneTime(time);
    if (idx !== -1) {
      return this._records[idx];
    } else {
      return null;
    }
  }

  public getRecentStateAtTime(time) {
    const idx = this.searchAloneTime(time);
    if (idx !== -1) {
      return this._records[idx].state;
    } else {
      return this._initialState;
    }
  }

  public getLastOneOfStateBeforeTime(state, time) {
    const idx = this.searchAloneTime(time);
    for (let i = idx; i >= 0; i--) {
      const record = this._records[i];
      if (record.state === state) {
        return record;
      }
    }
    return null;
  }

  public getFirstOneOfStateAfterTime(state, time) {
    const idx = this.searchAloneTime(time);
    if (idx !== -1) {
      for (let i = idx; i < this._records.length; i++) {
        const record = this._records[i];
        if (record.state === state) {
          return record;
        }
      }
    }
    return null;
  }

  public cancelAfter(time:number) {
    let idx = this.searchAloneTime(time);
    if (idx >= 0) {
      if (this._records[idx].time === time) {
        let i = idx;
        for (;this._records[i].time && i > 0; i--) {}
        idx = i;
      }
      if (idx >= 0) {
        this._records = this._records.slice(0, idx);
      } 
    }
    else {
      this._records = [];
    }
  }
}


import { Time } from "./Time";
import { EasuAL } from '../BaseClass';

export class SchedulerTime extends Time {
  constructor(val?, unit?) {
    super(val, unit);
  }

  public now() {
    if (this.context._scheduler) {
      return this.context._scheduler.seconds;
    } else {
      return this.context.now();
    }
  }
}

EasuAL.SchedulerTime = SchedulerTime;
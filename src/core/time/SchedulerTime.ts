import { Time } from "./Time";
import { EasuAL } from '../BaseClass';

export class SchedulerTime extends Time {
  constructor(val?, unit?) {
    super(val, unit);
  }

  public now() {
    if (this.context._scheduler) {
      console.log('use _scheduler now');
      return this.context._scheduler.seconds;
    } else {
      console.log('use context now');
      return this.context.now();
    }
  }
}

EasuAL.SchedulerTime = SchedulerTime;
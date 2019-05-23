import { EasuAL } from "../src/EasuAL";

export function testScheduler(easual:typeof EasuAL) {
  console.log('\n#### Test Scheduler ####');
  easual.context.initScheduler();
  const scheduler = easual.context._scheduler;
  if (!scheduler) {
    console.error('no scheduler');
    return;
  }
  scheduler.createTicker();

  const testSchedulerBtn = document.createElement('button');
  testSchedulerBtn.innerText = 'testScheduler 1';
  document.body.appendChild(testSchedulerBtn);
  testSchedulerBtn.addEventListener('click', test1);

  function test1 () {
    if (easual.context.BPM === undefined || easual.context._tickCounter === undefined || scheduler === undefined) {
      return;
    }
    // easual.context._tickCounter.
    const beginTime = easual.context.now();
    easual.context.BPM.cancelAfter(beginTime);
    easual.context.BPM.value = 120;

    scheduler.start();
    const osc = (new easual.Oscillator()).toDestination();
    scheduler.scheduleOnce((time) => {
      console.log('start time:', time);
      osc.start(time);
    }, '+0:1:0');
    scheduler.scheduleOnce((time) => {
      console.log('stop time:', time);
      osc.stop(time);
    }, '+0:2:0');
    // scheduler.schedule((time) => {osc.start(time);}, '+0:3:0');
    // scheduler.schedule((time) => {osc.stop(time);}, '+0:4:0');
    scheduler.stop('+0:2:1');
  }
}
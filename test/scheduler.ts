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

  const test1SchedulerBtn = document.createElement('button');
  test1SchedulerBtn.innerText = 'testScheduler 1';
  document.body.appendChild(test1SchedulerBtn);
  test1SchedulerBtn.addEventListener('click', test1);

  const test2SchedulerBtn = document.createElement('button');
  test2SchedulerBtn.innerText = 'testScheduler 2';
  document.body.appendChild(test2SchedulerBtn);
  test2SchedulerBtn.addEventListener('click', test2);

  function test1 () {
    if (easual.context.BPM === undefined || easual.context._tickCounter === undefined || scheduler === undefined) {
      return;
    }
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
    // scheduler.stop('+0:2:1');
  }

  function test2() {
    if (easual.context.BPM === undefined || easual.context._tickCounter === undefined || scheduler === undefined) {
      return;
    }
    // const beginTime = easual.context.now();
    // easual.context.BPM.cancelAfter(beginTime);
    // easual.context.BPM.value = 120;
    // scheduler.start();
    // console.log('click Time', easual.context.now(), scheduler.seconds);
    // const osc = (new easual.Oscillator()).toDestination();
    // const id = scheduler.scheduleRepeat((time) => {
    //   console.log('osc beep:', time);
    //   osc.start(time);
    //   osc.stop(time + 0.25);
    // }, '+0.01', '1s', '0.5s');
    // scheduler.stop('+6s');

    easual.context.BPM.value = 120;
    const osc = (new easual.Oscillator()).toDestination();
    const s = scheduler;
    s.start();
    const id = s.scheduleRepeat((time) => {
      console.log('time:', time);
      osc.start(time);
        osc.stop(time + 0.25);
    }, '+0.01', 1, '5s'); console.log('now:', easual.context.now());

  }

}
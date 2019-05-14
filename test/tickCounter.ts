import { EasuAL } from "../src/EasuAL";

export function testTickCounter(easual:typeof EasuAL) {
  console.log('\n#### Test TickCounter ####');
  easual.context.initScheduler();
  function test1() {
    if (easual.context.BPM === undefined || easual.context._tickCounter === undefined) {
      return;
    }

    // ! => stop   @ => start   | => pause
    // !---@.....|-----@...|----@.......|---
    // 上面的例子中有效的 segment 为 3 个, 有效的 tick 总数为 5 + 3 + 7 = 15
    const beginTime = easual.context.now();
    easual.context.BPM.cancelAfter(beginTime);
    easual.context.BPM.value = 120;
    // easual.context._tickCounter.setTicksAtTime(0, beginTime);
    const startTime = beginTime + 3;
    easual.context._tickCounter.stop(beginTime);
    easual.context._tickCounter.start(startTime);
    easual.context._tickCounter.pause(startTime + 5);
    easual.context._tickCounter.start(startTime + 5 + 5);
    easual.context._tickCounter.pause(startTime + 5 + 5 + 3);
    easual.context._tickCounter.start(startTime + 5 + 5 + 3 + 4);
    const countOfTicks = easual.context._tickCounter.getCountOfTicks(startTime + 5 + 5 + 3 + 4 + 7);
    console.log('!---@.....|-----@...|----@.......|---');
    console.log('Count Of ticks at', startTime + 5 + 5 + 3 + 4 + 7, countOfTicks, Math.round(countOfTicks) === 15 * 384);
  }

  function test2() {
    if (easual.context.BPM === undefined || easual.context._tickCounter === undefined) {
      return;
    }

    // bpm:*(120)    *(60)           *(120)
    // TC :!---@..............|---@.......|----
    // 上例的 segmen 有两个，初始的 BPM 为 120，九秒之后 BPM 变为 60，23秒后又变为 120
    // bpm 为 120 时，TPS 为 384，bpm 为 60时，TPS 为 192 (TPS: tick per second)
    // 因此这个例子中的 tickCount 应该为：5 * 384 + 9 * 192 + 2 * 192 + 5 * 384 = 5952
    const beginTime = easual.context.now();
    easual.context.BPM.cancelAfter(beginTime);
    easual.context.BPM.value = 120;
    // easual.context._tickCounter.setTicksAtTime(0, beginTime);
    const startTime = beginTime + 3;
    easual.context._tickCounter.stop(beginTime);
    
    easual.context._tickCounter.start(startTime);
    easual.context.BPM.setValueAtTime(60, startTime + 5);
    easual.context._tickCounter.pause(startTime + 5 + 9);

    easual.context._tickCounter.start(startTime + 5 + 9 + 3);
    easual.context.BPM.setValueAtTime(120, startTime + 5 + 9 + 3 + 2);
    easual.context._tickCounter.pause(startTime + 5 + 9 + 3 + 2 + 5);
    const countOfTicks = easual.context._tickCounter.getCountOfTicks(startTime + 5 + 5 + 3 + 4 + 7);
    console.log('bpm:*(120)    *(60)           *(120)');
    console.log('TC :!---@..............|---@.......|----');
    console.log('countOfTicks', countOfTicks, Math.round(countOfTicks) === 5952);
  }
  
  function test3() {
    if (easual.context.BPM === undefined || easual.context._tickCounter === undefined) {
      return;
    }

    // bpm 初始值为 120，第四秒开始线性渐变到 60，变化时常 2 秒，第六秒维持 60，第七秒时开始线性递增到 120，变化时常3秒
    // 第三秒开始计数，到第十秒时，tickCount = 384 + (384+192) + 192 + (384+192)*1.5 = 2016
    const beginTime = easual.context.now();
    easual.context.BPM.cancelAfter(beginTime);
    easual.context.BPM.value = 120;
    easual.context._tickCounter.stop(beginTime);
    const startTime = beginTime + 3;

    easual.context.BPM.linearRampTo(60, 2, startTime + 1);
    easual.context.BPM.setRampPoint(startTime + 3);
    easual.context.BPM.linearRampTo(120, 3, startTime + 4);

    easual.context._tickCounter.start(startTime);
    const countOfTicks = easual.context._tickCounter.getCountOfTicks(startTime + 7);
    console.log('Count Of Ticks for 3 to 10 second', countOfTicks, Math.round(countOfTicks) === 2016);
  }

  function test4() {
    if (easual.context.BPM === undefined || easual.context._tickCounter === undefined) {
      return;
    }

    // bpm 初始值为 120，第四秒开始线性渐变到 60，变化时常 2 秒，第六秒维持 60，第七秒时开始线性递增到 120，变化时常3秒
    // 第三秒开始计数，到第十秒时，tickCount = 384 + (384+192) + 192 + (384+192)*1.5 = 2016
    const beginTime = easual.context.now();
    easual.context.BPM.cancelAfter(beginTime);
    easual.context.BPM.value = 120;
    easual.context._tickCounter.stop(beginTime);
    const startTime = beginTime + 3;
    easual.context.BPM.linearRampTo(60, 2, startTime + 1);
    easual.context.BPM.setRampPoint(startTime + 3);
    easual.context.BPM.linearRampTo(120, 3, startTime + 4);

    // 设置开始时已经有 200 个 tick 了
    easual.context._tickCounter.setTicksAtTime(200, startTime);
    easual.context._tickCounter.start(startTime);
    const countOfTicks = easual.context._tickCounter.getCountOfTicks(startTime + 7);
    console.log('Count Of Ticks for 3 to 10 second', countOfTicks, Math.round(countOfTicks) === 2016 + 200);
  }


  test1();
  test2();
  test3();
  test4();
}
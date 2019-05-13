import { EasuAL } from "../src/EasuAL";

export function testBpmCurve(easual:typeof EasuAL) {
  easual.context.initScheduler();
  if (easual.context.BPM === undefined) {
    return;
  }
  const t1 = easual.context.BPM.timeOfTick(384);
  console.log('t1 =', t1, 'tick: 384');
  const t2 = easual.context.BPM.timeOfTick(2 * 384);
  console.log('t2 =', t2, 'tick:', 384 * 2);
  console.log('initial bpm =', easual.context.BPM.value);
  console.log('TPQ at t2:', t2, 'is', easual.context.BPM.getValueAtTime(t2));
  easual.context.BPM.linearRampTo(60, 1, t2);
  const t3 = t2 + 1;
  console.log('TPQ at t3:', t3, 'is', easual.context.BPM.getValueAtTime(t3));
  console.log('from', t2, 'to', t2 + 0.5, 'totalTicks = ', easual.context.BPM.getTicksAtTime(t2 + 0.5) - easual.context.BPM.getTicksAtTime(t2));
  console.log('totalTicks at', t2 ,easual.context.BPM.getTicksAtTime(t2), 'should be 768', easual.context.BPM.getTicksAtTime(t2) === 768);
  console.log('totalTicks at', t2 + 0.1 ,easual.context.BPM.getTicksAtTime(t2 + 0.1));
  console.log('totalTicks at', t2 + 0.2 ,easual.context.BPM.getTicksAtTime(t2 + 0.2));
  console.log('totalTicks at', t2 + 0.3, easual.context.BPM.getTicksAtTime(t2 + 0.3));
  console.log('totalTicks at', t2 + 0.4, easual.context.BPM.getTicksAtTime(t2 + 0.4));
  console.log('totalTicks at', t2 + 0.5, easual.context.BPM.getTicksAtTime(t2 + 0.5), 'should be 936', easual.context.BPM.getTicksAtTime(t2 + 0.5) === 936);
  console.log('totalTicks at', t2 + 0.6, easual.context.BPM.getTicksAtTime(t2 + 0.6));
  console.log('totalTicks at', t2 + 0.7, easual.context.BPM.getTicksAtTime(t2 + 0.7));
  console.log('totalTicks at', t2 + 0.8, easual.context.BPM.getTicksAtTime(t2 + 0.8));
  console.log('totalTicks at', t2 + 0.9, easual.context.BPM.getTicksAtTime(t2 + 0.9));
  console.log('totalTicks at', t3, easual.context.BPM.getTicksAtTime(t3),' should be 1056', easual.context.BPM.getTicksAtTime(t3) === 1056);

  console.log('The error should be less than 0.01 milliseconds');
  console.log('duration of one tick at', t1, EasuAL.context.BPM.durationOfTicks(1, t1), '≈', 1/384);
  console.log('duration of one tick at', t2, EasuAL.context.BPM.durationOfTicks(1, t2), '≈', 1/384);
  console.log('duration of one tick at', t2 + 0.5, EasuAL.context.BPM.durationOfTicks(1, t2+0.5), '≈', 1/((384 + 192)/2));
  console.log('duration of one tick at', t3, EasuAL.context.BPM.durationOfTicks(1, t3), '≈', 1/192);
}
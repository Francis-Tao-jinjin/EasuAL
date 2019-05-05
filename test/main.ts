import { initEasuAL } from '../src';
import { ParamEvent } from '../src/EasuAL';
import { notEqual } from 'assert';

const EasuAL = initEasuAL();
(window as any).EasuAL = EasuAL;
console.log(EasuAL.context.now(), EasuAL.context.lookAhead);

function testSetValueAndSearch() {
  const automationLine = new EasuAL.AudioParamTimeline();
  automationLine.setValueAtTime(0.01, 0);
  automationLine.setValueAtTime(0.03, 1);
  automationLine.setValueAtTime(0.05, 2.3);
  
  console.log(automationLine.search(0) === 0);
  console.log(automationLine.search(1) === 1);
  console.log(automationLine.search(2) === 1);
  let event = automationLine.getMostRecent(0.02);
  console.log(event.time === 0);
  event = automationLine.getRightNext(0.02);
  console.log(event.time === 1);
}

function testAutomationRampValue() {
  // this is actually a simple ADSR enevelop test
  const automationLine = new EasuAL.AudioParamTimeline();
  automationLine.setValueAtTime(1, 0);
  automationLine.linearRampTo(0.5, 1, 0);
  automationLine.targetRampTo(2, 1, 2);
  automationLine.exponentialRampTo(1, 1, 3);
  automationLine.targetRampTo(0, 1, 6);

  console.log('value v at t = 0 is', automationLine.getValueAtTime(0));
  console.log('value v at t = 0.3 is', automationLine.getValueAtTime(0.3));
  console.log('value v at t = 0.7 is', automationLine.getValueAtTime(0.7));
  console.log('value v at t = 1 is', automationLine.getValueAtTime(1));

  console.log('value v at t = 2 is', automationLine.getValueAtTime(2));
  console.log('value v at t = 2.1 is', automationLine.getValueAtTime(2.1), '≈', 1.1768);
  console.log('value v at t = 2.2 is', automationLine.getValueAtTime(2.2), '≈', 1.5482);
  console.log('value v at t = 2.5 is', automationLine.getValueAtTime(2.5), '≈', 1.9253);
  console.log('value v at t = 2.8 is', automationLine.getValueAtTime(2.8), '≈', 1.9877);
  console.log('value v at t = 3 is', automationLine.getValueAtTime(3));

  console.log('value v at t = 3.2 is', automationLine.getValueAtTime(3.2), '≈', 1.7411);
  console.log('value v at t = 3.4 is', automationLine.getValueAtTime(3.4), '≈', 1.5157);
  console.log('value v at t = 3.6 is', automationLine.getValueAtTime(3.6), '≈', 1.3195);
  console.log('value v at t = 3.8 is', automationLine.getValueAtTime(3.8), '≈', 1.1487);
  console.log('value v at t = 4 is', automationLine.getValueAtTime(4));

  console.log('value v at t = 6 is', automationLine.getValueAtTime(6));
  console.log('value v at t = 6.1 is', automationLine.getValueAtTime(6.1), '≈', 0.5488);
  console.log('value v at t = 6.2 is', automationLine.getValueAtTime(6.2), '≈', 0.3012);
  console.log('value v at t = 6.3 is', automationLine.getValueAtTime(6.3), '≈', 0.1653);
  console.log('value v at t = 6.5 is', automationLine.getValueAtTime(6.5), '≈', 0.0498);
  console.log('value v at t = 7 is', automationLine.getValueAtTime(7), '=', 0);
}

function testOscNode() {
  const oscNode = new EasuAL.EasuOscNode({});
  const now = EasuAL.context.now();
  

  // oscNode.gain.gain.setValueAtTime(1, 0 + now);
  // oscNode.gain.gain.setValueAtTime(0.3, 0.3 + now);
  // oscNode.gain.gain.setValueAtTime(0.7, 0.6 + now);
  // oscNode.gain.gain.setValueAtTime(1, 0.9 + now);
  // oscNode.gain.gain.setValueAtTime(0.6, 1.2 + now);
  // oscNode.gain.gain.setValueAtTime(0, 1.5 + now);
  
  // oscNode.gain.gain.linearRampTo(0, 0.3, 0.3 + now);
  // oscNode.gain.gain.targetApproachTo(1, 0.3, 0.6 + now);
  // oscNode.gain.gain.exponentialRampTo(0.7, 0.1, 0.9 + now);
  // oscNode.gain.gain.targetApproachTo(0, 1, 1.3 + now);
  oscNode.onended = () => {
    console.log('oscNode.stop at', EasuAL.context.now());
  }
  // console.log(oscNode.gain.gain.getValueAtTime(1.3 + now));
  // console.log(oscNode.gain.gain.getValueAtTime(1.6 + now));
  // console.log(oscNode.gain.gain.getValueAtTime(1.9 + now));
  // console.log(oscNode.gain.gain.getValueAtTime(2 + now));
  let count = 0;
  const id = setInterval(() => {
    console.log(count * 0.1, 's, gain is', oscNode.gain.gain._param.value);
    count++;
  }, 100);

  setTimeout(() => {
    clearInterval(id);
  }, 2200);
  oscNode.start(now);
  oscNode.gain.gain._param.value = 0.1;
  oscNode.gain.gain._param.linearRampToValueAtTime(1, 0.3);
  oscNode.gain.gain._param.linearRampToValueAtTime(0, 0.6);
  oscNode.gain.gain._param.setValueAtTime(0, 0.7);
  // oscNode.gain.gain._param.setValueAtTime(0.1, 0.3 + now);
  // oscNode.gain.gain._param.setValueAtTime(1, 0.7 + now);
  // oscNode.gain.gain._param.setValueAtTime(0.1, 1.0 + now);

  // oscNode.stop(2 + now);
  (window as any).g = oscNode.gain.gain;
  oscNode.toDestination();
}
(window as any).testOscNode = testOscNode;

function testOscFrequency() {
  const oscNode = new EasuAL.EasuOscNode({});
  const now = EasuAL.context.now();
  oscNode.toDestination();
  oscNode.start();
  oscNode.frequency.exponentialRampTo(220, 0.5, now);
  oscNode.frequency.exponentialRampTo(880, 0.5, now);
  oscNode.stop(1 + now);
}
(window as any).testOscFrequency = testOscFrequency;

testSetValueAndSearch();
testAutomationRampValue();
// testOscNode();

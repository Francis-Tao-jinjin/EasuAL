import { EasuAL } from "../src/EasuAL";

export function automationTests(easual:typeof EasuAL) {
  function testSetValueAndSearch() {
    const automationLine = new easual.AudioParamTimeline();
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
    const automationLine = new easual.AudioParamTimeline();
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

  testSetValueAndSearch();
  testAutomationRampValue();
}
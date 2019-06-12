import { initEasuAL } from '../src';
import { oscTests } from './osc';
import { testBpmCurve } from './bpmCurve';
import { automationTests } from './automation';
import { audioBufferTest } from './audioBuffer';
import { bufferSourceTest } from './bufferSource';
import { testTickCounter } from './tickCounter';
import { testScheduler } from './scheduler';
import { envelopeTests } from './envelope';

const EasuAL = initEasuAL();
(window as any).EasuAL = EasuAL;
console.log(EasuAL.context.now(), EasuAL.context.lookAhead);

function activeContext() {
  // Create an empty three-second stereo buffer at the sample rate of the AudioContext
  const emptyBuffer = EasuAL.context.createBuffer(2, EasuAL.context.sampleRate * 0.1, EasuAL.context.sampleRate);
  const source = EasuAL.context.createBufferSource();
  source.buffer = emptyBuffer;
  source.connect(EasuAL.context._ctx.destination);
  source.start();
  document.body.removeEventListener('click', activeContext);
}

window.onload = () => {
  document.body.addEventListener('click', activeContext);

  automationTests(EasuAL);
  oscTests(EasuAL);
  audioBufferTest(EasuAL);
  bufferSourceTest(EasuAL);
  // setTimeout(() => {
  //   testBpmCurve(EasuAL);
  //   testTickCounter(EasuAL);
  // }, 200);
  testScheduler(EasuAL);
  envelopeTests(EasuAL);
}
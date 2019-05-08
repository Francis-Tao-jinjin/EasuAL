import { initEasuAL } from '../src';
import { ParamEvent } from '../src/EasuAL';
import { notEqual } from 'assert';
import { oscTests } from './osc';
import { automationTests } from './automation';
import { audioBufferTest } from './audioBuffer';
import { bufferSourceTest } from './bufferSource';

const EasuAL = initEasuAL();
(window as any).EasuAL = EasuAL;
console.log(EasuAL.context.now(), EasuAL.context.lookAhead);

window.onload = () => {
  automationTests(EasuAL);
  oscTests(EasuAL);
  audioBufferTest(EasuAL);
  bufferSourceTest(EasuAL);
}
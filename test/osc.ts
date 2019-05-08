import { EasuAL } from "../src/EasuAL";

export function oscTests(easual:typeof EasuAL) {
  
  function testOscNode() {
    const oscNode = new easual.EasuOscNode({});
    const now = easual.context.now();
    oscNode.amp.gain.setValueAtTime(1, 0 + now);
    oscNode.amp.gain.setValueAtTime(0.3, 0.3 + now);
    oscNode.amp.gain.setValueAtTime(0.7, 0.6 + now);
    oscNode.amp.gain.setValueAtTime(1, 0.9 + now);
    oscNode.amp.gain.setValueAtTime(0.6, 1.2 + now);
    oscNode.amp.gain.setValueAtTime(0, 1.5 + now);
    oscNode.onended = () => {
      console.log('oscNode.stop at', easual.context.now());
    }
    let count = 0;
    const id = setInterval(() => {
      console.log(count * 0.1, 's, gain is', oscNode.amp.gain._param.value);
      count++;
    }, 100);
  
    setTimeout(() => {
      clearInterval(id);
    }, 2200);
    oscNode.toDestination();
    oscNode.start(now);
    oscNode.stop(2 + now);
  }
  
  function testOscFrequency() {
    const oscNode = new easual.EasuOscNode({});
    const now = easual.context.now();
    oscNode.toDestination();
    oscNode.start();
    oscNode.frequency.exponentialRampTo(220, 0.5, now);
    oscNode.frequency.exponentialRampTo(880, 0.5, now + 0.5);
    oscNode.frequency.exponentialRampTo(220, 0.5, now + 1);
    oscNode.stop(1.5 + now);
  }

  const testOscNodeBtn = document.createElement('button');
  const testOscFrequencyBtn = document.createElement('button');
  testOscNodeBtn.innerText = 'testOscNode';
  testOscFrequencyBtn.innerText = 'testOscFrequency';

  document.body.appendChild(testOscNodeBtn);
  document.body.appendChild(testOscFrequencyBtn);
  
  testOscNodeBtn.addEventListener('click', testOscNode);
  testOscFrequencyBtn.addEventListener('click', testOscFrequency);
}
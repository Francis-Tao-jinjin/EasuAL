import { EasuAL } from "../src/EasuAL";

export function envelopeTests(easual:typeof EasuAL) {
  function test1() {
    const button = document.createElement('button');
    button.innerText = 'Envelop 1';
    document.body.appendChild(button);
    let osc = new easual.Oscillator();
    let envelope = new easual.Envelope();

    osc.connect(envelope);
    envelope.toDestination();
    osc.start();

    button.onmousedown = () => {
      envelope.triggerAttack();
    }
    button.onmouseup = () => {
      envelope.triggerRelease();
    }

    const envelope2 = new easual.Envelope();
    // envelope2.attack = 0.05;
    const canvas = document.createElement('canvas');
    canvas.width = 510;
    canvas.height = 80;
    const wrap = document.createElement('div');
    wrap.appendChild(canvas);
    
    const attackWrap = document.createElement('div');
    const attack_label = document.createElement('span');
    attack_label.innerText = 'attack: ';
    const attack_slide = document.createElement('input');
    attack_slide.type = 'range';
    attack_slide.min = '0';
    attack_slide.max = '1';
    attack_slide.step = '0.01';
    attackWrap.appendChild(attack_label);
    attackWrap.appendChild(attack_slide);

    const decayWrap = document.createElement('div');
    const decay_label = document.createElement('span');
    decay_label.innerText = 'decay: ';
    const decay_slide = document.createElement('input');
    decay_slide.type = 'range';
    decay_slide.min = '0';
    decay_slide.max = '1';
    decay_slide.step = '0.01';
    decayWrap.appendChild(decay_label);
    decayWrap.appendChild(decay_slide);

    const sustainWrap = document.createElement('div');
    const sustain_label = document.createElement('span');
    sustain_label.innerText = 'attack ';
    const sustain_slide = document.createElement('input');
    sustain_slide.type = 'range';
    sustain_slide.min = '0';
    sustain_slide.max = '1';
    sustain_slide.step = '0.01';
    sustainWrap.appendChild(sustain_label);
    sustainWrap.appendChild(sustain_slide);

    const releaseWrap = document.createElement('div');
    const release_label = document.createElement('span');
    release_label.innerText = 'attack ';
    const release_slide = document.createElement('input');
    release_slide.type = 'range';
    release_slide.min = '0';
    release_slide.max = '1';
    release_slide.step = '0.01';
    releaseWrap.appendChild(release_label);
    releaseWrap.appendChild(release_slide);
    
    wrap.appendChild(attackWrap);
    wrap.appendChild(decayWrap);
    wrap.appendChild(releaseWrap);
    document.body.appendChild(wrap);

    const ctx = canvas.getContext('2d');
    (window as any).ctx = ctx;
    if (!ctx) {
      console.error('ctx no exist');
      return;
    }
    const draw = (x, y) => {
      ctx.fillStyle = "rgb(" + String(1) + ", " + String(1) + ", " + String(1) + ")";
      ctx.fillRect(x, y-1, 1, 2);
    }

    const updateGraphy = () => {
      const attack = envelope2.toSeconds(envelope2.attack);
      const decay = envelope2.toSeconds(envelope2.decay);
      const release = envelope2.toSeconds(envelope2.release);

      const totalDuration = attack + decay + release;
      // const attackPixelLen = 500 * (attack / totalDuration);
      const timeStep = totalDuration / 500;
      ctx.clearRect(0, 0, 510, 80);
      const now = easual.context.now();
      // console.log('triggerTime: ', now);
      // envelope2.triggerAttack(now);
      envelope2.triggerAttackRelease(attack + decay, now);
      for (let i=0; i<totalDuration; i+=timeStep) {
        const value = envelope2.getValueAtTime(now + i);
        const x = i / totalDuration * 500 + 5;
        const y = (1 - value) * 70 + 5;
        draw(x, y);
        // console.log(x, value);
      }
    }
    (window as any).envelope2 = envelope2;
    (window as any).envelope = envelope;
    (window as any).updateGraphy = updateGraphy;
    updateGraphy();
  }
  test1();
}
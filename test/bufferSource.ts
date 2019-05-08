import { EasuAL } from '../src/EasuAL';
import { FadeCurve } from '../src/core/type';

export function bufferSourceTest(easual:typeof EasuAL) {
  const buffer = new easual.EasuBuffer({
    src: './assets/Helen Morgan - Que Sera Sera.mp3',
  });
  
  function expontialFadeInOut() {
    let startTime = 0;
    const song = new easual.EasuBufferSource({
      buffer: buffer,
      fadeInDuration: 1,
      fadeOutDuration: 1,
      onload: () => {
        startTime = easual.context.now();
        song.start(undefined, 2, 3, undefined);
      },
      onended:() => {
        console.log( easual.context.now() - startTime);
      }
    }).toDestination();
    if (buffer.length > 0) {
      startTime = easual.context.now();
      song.start(undefined, 2, 3, undefined);
    }
  }
  
  function linearFadeInOut() {
    let startTime = 0;
    const song = new easual.EasuBufferSource({
      buffer: buffer,
      fadeCurve: FadeCurve.Linear,
      fadeInDuration: 1,
      fadeOutDuration: 1,
      onload: () => {
        startTime = easual.context.now();
        song.start(undefined, 2, 3, undefined);
      },
      onended:() => {
        console.log( easual.context.now() - startTime);
      }
    }).toDestination();
    if (buffer.length > 0) {
      startTime = easual.context.now();
      song.start(undefined, 2, 3, undefined);
      song.stop(startTime + 5);
    }
  }

  function loopWithDuration() {
    var startTime = 0;
    var song = new EasuAL.EasuBufferSource({
      buffer: buffer,
      fadeInDuration: 1,
      fadeOutDuration: 1,
      onload:() => {
        startTime = EasuAL.context.now();
        song.start(undefined, 2,5 ,undefined );
      },
      onended:() => {
        console.log( EasuAL.context.now() - startTime);
      }
    })
    song.loop = true;
    song.toDestination();
    song.loopEnd = 4;
    song.loopStart = 0;
    if (buffer.length > 0) {
      startTime = EasuAL.context.now();
      // playe 2 - 4 s then 0 - 3 s, total duration is 5s, offset is 2s
      song.start(undefined, 2,5 ,undefined );
    }
  }

  const expontialFadeInOutBtn = document.createElement('button');
  expontialFadeInOutBtn.innerText = 'expontialFade';
  document.body.appendChild(expontialFadeInOutBtn);
  expontialFadeInOutBtn.addEventListener('click', expontialFadeInOut);

  const linearFadeInOutBtn = document.createElement('button');
  linearFadeInOutBtn.innerText = 'linearFade';
  document.body.appendChild(linearFadeInOutBtn);
  linearFadeInOutBtn.addEventListener('click', linearFadeInOut);

  const loopWithDurationBtn = document.createElement('button');
  loopWithDurationBtn.innerText = 'loopWithDuration';
  document.body.appendChild(loopWithDurationBtn);
  loopWithDurationBtn.addEventListener('click', loopWithDuration);
}
import { EasuAL } from '../src/EasuAL';

export function audioBufferTest(easual:typeof EasuAL) {
  function testDownload() {
    const buffer = new easual.EasuBuffer({
      src: './assets/Helen Morgan - Que Sera Sera.mp3',
      onload: () => {
        console.log('song loaded');
        console.log('song duration:', buffer.duration);        
      },
      onerror: (msg) => {
        console.warn(msg);
      }
    });
    
    const buffer2 = new easual.EasuBuffer({
      src: buffer,
      onload: () => {
        console.log('buffer2 loaded');
      },
      onerror: (msg) => {
        console.warn(msg);
      }
    });
  }

  const testDownloadBtn = document.createElement('button');
  testDownloadBtn.innerText = 'testDownload';
  document.body.appendChild(testDownloadBtn);
  testDownloadBtn.addEventListener('click', testDownload);
}
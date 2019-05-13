import { EasuAL } from './BaseClass';
import { EasuBufferOpt } from './type';

interface XHRObject {
  request:XMLHttpRequest;
  progress: number;
}

export class EasuBuffer extends EasuAL {
  private _buffer!:AudioBuffer;
  public onload:(param:any) => void = () => {};
  constructor(opt:EasuBufferOpt = {}) {
    super();

    opt.onload = opt.onload === undefined ? () => {} : opt.onload;
    opt.onerror = opt.onerror === undefined ? () => {} : opt.onerror;
    if (opt.src) {
      if (opt.src instanceof AudioBuffer || opt.src instanceof EasuBuffer) {
        this.set(opt.src);
        if (this.length <= 0) {
          this.onload = opt.onload;
        } else {
          this.onload = opt.onload;
          setTimeout(() => {
            this.onload(this);
          }, 0);
        }
      } else if (typeof opt.src === 'string') {
        this.load(opt.src, opt.onload, opt.onerror);
      }
    }
  }

  public set(buffer:AudioBuffer|EasuBuffer) {
    if (buffer instanceof EasuBuffer) {
      if (buffer.length > 0) {
        this._buffer = buffer.get();
      } else {
        buffer.onload = () => {
          this.set(buffer);
          this.onload(this);
        };
      }
    } else {
      this._buffer = buffer;
    }
  }

  public get() {
    return this._buffer;
  }

  get duration() {
    if (this._buffer) {
      return this._buffer.duration;
    } else {
      return 0;
    }
  }

  get length() {
    if (this._buffer) {
      return this._buffer.length;
    }
    return 0;
  }
  
  public load(url, onload?, onerror?) {
    const promise = new Promise((resolve, reject)=> {
      const requestItem = EasuBuffer.Load(url, (buffer) => {
        delete requestItem.request;
        this.set(buffer);
        resolve(this);
        this.onload(this);
        if (onload) {
          onload(this);
        }
        console.log('buffer', buffer);
      }, (error) => {
        delete requestItem.request;
        console.log('error:', error);
        reject(error);
        if (onerror) {
          onerror(error);
        }
      });
    });
    return promise;
  }

  private static _downloadQueue:XHRObject[] = [];
  
  public static Load(url:string, onload:(parma:any)=>void, onerror:(parma:any)=>void) {
    function onError(e) {
      EasuBuffer._removeRequestItem(requestItem);
      if (onerror) {
        onerror(e);
      } else {
        throw e;
      }
    }

    function onProgress() {
      let totalProgress = 0;
      for (let i = 0; i < EasuBuffer._downloadQueue.length; i++) {
        totalProgress += EasuBuffer._downloadQueue[i].progress;
      }
      console.log('progress:', totalProgress / EasuBuffer._downloadQueue.length);
      if (EasuBuffer._downloadQueue.length === 0) {
        console.log('all loaded');
      }
    }

    const request = new XMLHttpRequest();
    const requestItem:XHRObject = {
      request,
      progress:0,
    };
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    EasuBuffer._downloadQueue.push(requestItem);
    request.addEventListener('load', function() {
      if (request.status === 200) {
        EasuAL.context
          .decodeAudioData(request.response)
          .then((audiobuffer) => {
            requestItem.progress = 1;
            onProgress();
            onload(audiobuffer);
            EasuBuffer._removeRequestItem(requestItem);
          }, (msg) => {
            onError('EasuBuffer: could not decode audio data: ' + url)
          });
      } else {
        onError('EasuBuffer: could not locate file: ' + url);
      }
    });
    request.addEventListener('error', onError);
    request.addEventListener('progress', function(event) {
      if (event.lengthComputable) {
        requestItem.progress = (event.loaded / event.total) * 0.95;
        onProgress();
      }
    });
    request.send();
    return requestItem;
  }

  private static _removeRequestItem(item) {
    const index = EasuBuffer._downloadQueue.indexOf(item);
    if (index !== -1) {
      EasuBuffer._downloadQueue.splice(index, 1);
    }
  }
}

EasuAL.EasuBuffer = EasuBuffer;
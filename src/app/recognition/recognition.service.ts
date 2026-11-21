import { Injectable, OnDestroy } from '@angular/core';
import { RecognitionReply, RecognitionResult } from './models';

interface Pending {
  readonly resolve: (result: RecognitionResult) => void;
  readonly reject: (error: Error) => void;
}

/** Runs recognition in a lazily created Web Worker so the UI never blocks. */
@Injectable({ providedIn: 'root' })
export class RecognitionService implements OnDestroy {
  private worker?: Worker;
  private nextId = 0;
  private readonly pending = new Map<number, Pending>();

  recognize(samples: Float32Array, sampleRate: number): Promise<RecognitionResult> {
    if (typeof Worker === 'undefined') {
      return import('./recognizer').then(({ recognize }) => recognize(samples, sampleRate));
    }
    const worker = this.getWorker();
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ id, samples, sampleRate }, [samples.buffer]);
    });
  }

  /** Starts downloading the engine before the user needs it. */
  warmUp(): void {
    if (typeof Worker !== 'undefined') {
      this.getWorker();
    }
  }

  ngOnDestroy(): void {
    this.worker?.terminate();
  }

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./recognition.worker', import.meta.url), { type: 'module' });
      this.worker.onmessage = ({ data }: MessageEvent<RecognitionReply>) => {
        const pending = this.pending.get(data.id);
        this.pending.delete(data.id);
        if (data.result) {
          pending?.resolve(data.result);
        } else {
          pending?.reject(new Error(data.error ?? 'Recognition failed'));
        }
      };
      this.worker.onerror = (event) => {
        this.pending.forEach(({ reject }) => reject(new Error(event.message)));
        this.pending.clear();
      };
    }
    return this.worker;
  }
}

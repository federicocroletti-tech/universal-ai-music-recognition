import { Injectable, signal } from '@angular/core';

export type CaptureErrorCode = 'unsupported' | 'denied' | 'no-device' | 'failed';

export class CaptureError extends Error {
  constructor(readonly code: CaptureErrorCode) {
    super(`Audio capture failed: ${code}`);
  }
}

export interface CapturedAudio {
  readonly samples: Float32Array;
  readonly sampleRate: number;
  readonly seconds: number;
}

/** Sample rate used for analysis: enough for the voice fundamental, and 3x less work than 48 kHz. */
export const ANALYSIS_SAMPLE_RATE = 16000;

/**
 * Records the microphone only between start() and stop(), then returns mono PCM at 16 kHz.
 * Audio stays in memory on the device and the microphone is released as soon as recording stops.
 */
@Injectable({ providedIn: 'root' })
export class AudioCaptureService {
  /** Input level between 0 and 1 for the live meter. */
  readonly level = signal(0);

  private stream?: MediaStream;
  private recorder?: MediaRecorder;
  private context?: AudioContext;
  private chunks: Blob[] = [];
  private frame = 0;
  private startedAt = 0;

  isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.mediaDevices?.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined' &&
      typeof AudioContext !== 'undefined'
    );
  }

  async start(): Promise<void> {
    if (!this.isSupported()) {
      throw new CaptureError('unsupported');
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true },
      });
    } catch (error) {
      throw new CaptureError(toErrorCode(error));
    }
    this.context = new AudioContext();
    const analyser = this.context.createAnalyser();
    analyser.fftSize = 1024;
    this.context.createMediaStreamSource(this.stream).connect(analyser);

    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream);
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };
    this.recorder.start();
    this.startedAt = performance.now();

    const buffer = new Float32Array(analyser.fftSize);
    const measure = () => {
      analyser.getFloatTimeDomainData(buffer);
      let energy = 0;
      for (const sample of buffer) {
        energy += sample * sample;
      }
      this.level.set(Math.min(1, Math.sqrt(energy / buffer.length) * 6));
      this.frame = requestAnimationFrame(measure);
    };
    measure();
  }

  async stop(): Promise<CapturedAudio> {
    const recorder = this.recorder;
    const context = this.context;
    if (!recorder || !context) {
      throw new CaptureError('failed');
    }
    const stopped = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));
    recorder.stop();
    await stopped;
    const seconds = (performance.now() - this.startedAt) / 1000;
    const recording = new Blob(this.chunks, { type: recorder.mimeType });
    this.releaseMicrophone();
    try {
      const decoded = await context.decodeAudioData(await recording.arrayBuffer());
      return { samples: await resample(decoded), sampleRate: ANALYSIS_SAMPLE_RATE, seconds };
    } finally {
      this.context = undefined;
      void context.close();
    }
  }

  cancel(): void {
    if (this.recorder?.state === 'recording') {
      this.recorder.stop();
    }
    this.releaseMicrophone();
    void this.context?.close();
    this.context = undefined;
  }

  private releaseMicrophone(): void {
    if (typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.frame);
    }
    this.level.set(0);
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    this.recorder = undefined;
    this.chunks = [];
  }
}

async function resample(buffer: AudioBuffer): Promise<Float32Array> {
  const offline = new OfflineAudioContext(1, Math.ceil(buffer.duration * ANALYSIS_SAMPLE_RATE), ANALYSIS_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();
  // Copy so the buffer can be transferred to the worker.
  return rendered.getChannelData(0).slice();
}

function toErrorCode(error: unknown): CaptureErrorCode {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'denied';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'no-device';
  }
  return 'failed';
}

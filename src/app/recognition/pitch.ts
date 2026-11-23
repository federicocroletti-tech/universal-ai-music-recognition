import { PitchFrame } from './models.js';
import { hzToMidi } from './notation.js';

export interface PitchOptions {
  readonly minHz?: number;
  readonly maxHz?: number;
  /** YIN absolute threshold: lower is stricter. */
  readonly threshold?: number;
}

const HOP_SECONDS = 0.01;
const WINDOW_SECONDS = 0.032;
const SILENCE_RMS = 1e-4;

/** YIN pitch detection (de Cheveigné and Kawahara, 2002) on mono PCM samples. */
export function detectPitch(
  samples: Float32Array,
  sampleRate: number,
  { minHz = 70, maxHz = 1000, threshold = 0.15 }: PitchOptions = {},
): PitchFrame[] {
  const hop = Math.max(1, Math.round(sampleRate * HOP_SECONDS));
  const window = Math.round(sampleRate * WINDOW_SECONDS);
  const tauMin = Math.max(2, Math.floor(sampleRate / maxHz));
  const tauMax = Math.ceil(sampleRate / minHz);
  const cmnd = new Float64Array(tauMax + 2);
  const frames: PitchFrame[] = [];

  for (let start = 0; start + window + tauMax + 1 <= samples.length; start += hop) {
    const time = start / sampleRate;
    let energy = 0;
    for (let i = start; i < start + window; i++) {
      energy += samples[i] * samples[i];
    }
    const rms = Math.sqrt(energy / window);
    if (rms < SILENCE_RMS) {
      frames.push({ time, rms, midi: null });
      continue;
    }

    // Cumulative mean normalized difference function.
    let runningSum = 0;
    cmnd[0] = 1;
    for (let tau = 1; tau <= tauMax + 1; tau++) {
      let sum = 0;
      for (let i = start; i < start + window; i++) {
        const delta = samples[i] - samples[i + tau];
        sum += delta * delta;
      }
      runningSum += sum;
      cmnd[tau] = runningSum > 0 ? (sum * tau) / runningSum : 1;
    }

    let period = -1;
    for (let tau = tauMin; tau <= tauMax; tau++) {
      if (cmnd[tau] < threshold) {
        while (tau + 1 <= tauMax && cmnd[tau + 1] < cmnd[tau]) {
          tau++;
        }
        period = refinePeriod(cmnd, tau);
        break;
      }
    }
    frames.push({ time, rms, midi: period > 0 ? hzToMidi(sampleRate / period) : null });
  }
  return frames;
}

function refinePeriod(values: Float64Array, tau: number): number {
  const previous = values[tau - 1];
  const next = values[tau + 1];
  const denominator = previous - 2 * values[tau] + next;
  return denominator === 0 ? tau : tau + (previous - next) / (2 * denominator);
}

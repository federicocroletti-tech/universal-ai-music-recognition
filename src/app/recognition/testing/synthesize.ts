import { midiToHz } from '../notation';

/** Deterministic pseudo-random generator (mulberry32) for reproducible tests. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface HumOptions {
  readonly sampleRate?: number;
  readonly noteSeconds?: number;
  readonly gapSeconds?: number;
  readonly seed?: number;
}

/** Synthesizes a hum-like signal: harmonics, vibrato, soft envelopes, short gaps, and background noise. */
export function synthesizeHum(
  midiNotes: readonly number[],
  { sampleRate = 16000, noteSeconds = 0.35, gapSeconds = 0.05, seed = 1 }: HumOptions = {},
): Float32Array {
  const random = seededRandom(seed);
  const noteLength = Math.round(noteSeconds * sampleRate);
  const gapLength = Math.round(gapSeconds * sampleRate);
  const ramp = Math.round(0.02 * sampleRate);
  const output = new Float32Array(midiNotes.length * (noteLength + gapLength) + gapLength + Math.round(0.1 * sampleRate));
  for (let i = 0; i < output.length; i++) {
    output[i] = 0.004 * (random() * 2 - 1);
  }
  let offset = gapLength;
  for (const midi of midiNotes) {
    const hz = midiToHz(midi);
    let phase = 0;
    for (let i = 0; i < noteLength; i++) {
      const vibrato = 2 ** ((0.15 * Math.sin((2 * Math.PI * 5.5 * i) / sampleRate)) / 12);
      phase += (2 * Math.PI * hz * vibrato) / sampleRate;
      const envelope = Math.min(1, i / ramp, (noteLength - i) / ramp);
      output[offset + i] += 0.3 * envelope * (Math.sin(phase) + 0.5 * Math.sin(2 * phase) + 0.25 * Math.sin(3 * phase));
    }
    offset += noteLength + gapLength;
  }
  return output;
}

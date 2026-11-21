import { PitchFrame } from './models';
import { detectPitch } from './pitch';
import { median } from './segmentation';
import { synthesizeHum } from './testing/synthesize';

const SAMPLE_RATE = 16000;

function voicedMedian(frames: readonly PitchFrame[]): number {
  return median(frames.flatMap((frame) => (frame.midi === null ? [] : [frame.midi])));
}

describe('detectPitch', () => {
  it('detects a pure tone', () => {
    const tone = Float32Array.from(
      { length: SAMPLE_RATE / 2 },
      (_, i) => 0.5 * Math.sin((2 * Math.PI * 220 * i) / SAMPLE_RATE),
    );
    expect(Math.abs(voicedMedian(detectPitch(tone, SAMPLE_RATE)) - 57)).toBeLessThan(0.1);
  });

  it('finds the fundamental of a harmonic hum without octave errors', () => {
    const frames = detectPitch(synthesizeHum([55]), SAMPLE_RATE);
    expect(Math.abs(voicedMedian(frames) - 55)).toBeLessThan(0.2);
  });

  it('reports silence as unvoiced', () => {
    expect(detectPitch(new Float32Array(SAMPLE_RATE / 2), SAMPLE_RATE).every((frame) => frame.midi === null)).toBe(true);
  });
});

import { PitchFrame, SungNote } from './models.js';

const MIN_NOTE_SECONDS = 0.06;
const PITCH_JUMP_SEMITONES = 0.75;
const SMOOTHING_FRAMES = 5;
const RELATIVE_GATE = 0.1;
const ABSOLUTE_GATE = 0.003;

/** Groups voiced pitch frames into notes, splitting on silences and pitch jumps. */
export function segmentNotes(frames: readonly PitchFrame[]): SungNote[] {
  if (frames.length < 2) {
    return [];
  }
  const hop = frames[1].time - frames[0].time;
  const levels = frames.map((frame) => frame.rms).sort((a, b) => a - b);
  // Relative gate adapts to microphone gain; 95th percentile ignores isolated peaks.
  const gate = Math.max(ABSOLUTE_GATE, RELATIVE_GATE * levels[Math.floor(0.95 * (levels.length - 1))]);
  const pitches = smooth(frames.map((frame) => (frame.rms >= gate ? frame.midi : null)));
  const minFrames = Math.max(1, Math.round(MIN_NOTE_SECONDS / hop));

  const notes: SungNote[] = [];
  let current: number[] = [];
  let startIndex = 0;
  const flush = () => {
    if (current.length >= minFrames) {
      notes.push({ midi: median(current), start: frames[startIndex].time, duration: current.length * hop });
    }
    current = [];
  };

  pitches.forEach((pitch, index) => {
    if (pitch === null) {
      flush();
      return;
    }
    if (current.length > 0 && Math.abs(pitch - median(current.slice(-SMOOTHING_FRAMES))) > PITCH_JUMP_SEMITONES) {
      flush();
    }
    if (current.length === 0) {
      startIndex = index;
    }
    current.push(pitch);
  });
  flush();
  return notes;
}

/** Median filter that keeps unvoiced frames unvoiced and removes isolated octave errors. */
function smooth(values: readonly (number | null)[]): (number | null)[] {
  const half = Math.floor(SMOOTHING_FRAMES / 2);
  return values.map((value, index) => {
    if (value === null) {
      return null;
    }
    const neighbours = values
      .slice(Math.max(0, index - half), index + half + 1)
      .filter((neighbour): neighbour is number => neighbour !== null);
    return median(neighbours);
  });
}

export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

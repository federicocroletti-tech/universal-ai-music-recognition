import { MelodyNote } from './models.js';

const NOTE_OFFSETS: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const TOKEN = /^([A-G])([#b]?)(\d)(?::(\d+(?:\.\d+)?))?$/;

/**
 * Parses a compact score such as "E4 E4 F4 G4:2 | C#5:0.5".
 * Each token is pitch + octave with an optional duration in beats (default 1). "|" is a bar line.
 */
export function parseNotes(score: string): MelodyNote[] {
  return score
    .split(/\s+/)
    .filter((token) => token !== '' && token !== '|')
    .map((token) => {
      const match = TOKEN.exec(token);
      if (!match) {
        throw new Error(`Invalid note token: ${token}`);
      }
      const [, letter, accidental, octave, beats] = match;
      const shift = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
      return {
        midi: 12 * (Number(octave) + 1) + NOTE_OFFSETS[letter] + shift,
        beats: beats ? Number(beats) : 1,
      };
    });
}

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

import { CATALOG } from './catalog';
import { parseNotes } from './notation';

describe('parseNotes', () => {
  it('parses pitch, accidentals, octave and duration', () => {
    expect(parseNotes('C4 A4 | C#5:0.5 Bb3:2')).toEqual([
      { midi: 60, beats: 1 },
      { midi: 69, beats: 1 },
      { midi: 73, beats: 0.5 },
      { midi: 58, beats: 2 },
    ]);
  });

  it('rejects invalid tokens', () => {
    expect(() => parseNotes('H4')).toThrowError(/Invalid note token/);
  });
});

describe('CATALOG', () => {
  it('has unique ids and melodies long enough to be recognized', () => {
    expect(new Set(CATALOG.map((melody) => melody.id)).size).toBe(CATALOG.length);
    for (const melody of CATALOG) {
      expect(melody.notes.length, melody.id).toBeGreaterThanOrEqual(8);
    }
  });
});

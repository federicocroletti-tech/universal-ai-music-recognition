import { CATALOG } from './catalog';
import { matchPitches, toIntervals } from './matcher';
import { seededRandom } from './testing/synthesize';

const random = seededRandom(42);
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

/** Simulates a human hum: transposed, slightly compressed intervals, ±0.5 semitone errors, sometimes a skipped note. */
function humanize(pitches: readonly number[]): number[] {
  const hummed = pitches.map((pitch) => pitches[0] + (pitch - pitches[0]) * 0.95 + 3 + (random() - 0.5));
  if (random() < 0.3) {
    hummed.splice(1 + Math.floor(random() * (hummed.length - 2)), 1);
  }
  return hummed;
}

/** A plausible melody that is not in the catalog: a random walk on the major scale. */
function unknownMelody(length: number): number[] {
  let degree = 7;
  return Array.from({ length }, () => {
    degree = Math.max(0, Math.min(14, degree + Math.round((random() - 0.5) * 4.2)));
    return 60 + 12 * Math.floor(degree / 7) + MAJOR_SCALE[degree % 7];
  });
}

describe('toIntervals', () => {
  it('ignores the key and merges repeated notes', () => {
    expect(toIntervals([60, 60, 62, 64, 64.2, 59])).toEqual([2, 2, -5]);
    expect(toIntervals([65, 67, 69])).toEqual(toIntervals([60, 62, 64]));
  });
});

describe('matchPitches', () => {
  it('identifies catalog melodies from imperfect 12-note hums', () => {
    let top1 = 0;
    let confidentMatches = 0;
    let wrongMatches = 0;
    let total = 0;
    for (const melody of CATALOG) {
      const pitches = melody.notes.map((note) => note.midi);
      for (let attempt = 0; attempt < 4; attempt++) {
        const start = attempt === 0 ? 0 : Math.floor(random() * Math.max(1, pitches.length - 12));
        const result = matchPitches(humanize(pitches.slice(start, start + 12)), CATALOG);
        const correct = result.candidates[0].melody.id === melody.id;
        total++;
        top1 += correct ? 1 : 0;
        if (result.verdict === 'match') {
          confidentMatches += correct ? 1 : 0;
          wrongMatches += correct ? 0 : 1;
        }
      }
    }
    expect(top1 / total).toBeGreaterThanOrEqual(0.85);
    expect(confidentMatches / total).toBeGreaterThanOrEqual(0.5);
    expect(wrongMatches / total).toBeLessThanOrEqual(0.03);
  });

  it('rarely claims a confident match for melodies outside the catalog', () => {
    const results = Array.from({ length: 100 }, () => matchPitches(humanize(unknownMelody(12)), CATALOG));
    expect(results.filter((result) => result.verdict === 'match').length).toBeLessThanOrEqual(5);
  });

  it('asks for a longer hum when too few distinct notes are sung', () => {
    const result = matchPitches([60, 62, 62, 64], CATALOG);
    expect(result.verdict).toBe('too-short');
    expect(result.noteCount).toBe(3);
  });
});

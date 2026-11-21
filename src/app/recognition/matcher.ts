import { Melody, RecognitionResult, Verdict } from './models';

/** Consecutive notes closer than this (semitones) count as the same note. */
const SAME_NOTE = 0.5;
const SUBSTITUTION_CAP = 3;
const GAP = 2.5;
const MERGE = 1.5;
const MIN_INTERVALS = 4;
// Calibrated on synthetic hums with ±0.5 semitone noise, skipped notes, and non-catalog diatonic melodies.
const MATCH_MIN_DISTINCTNESS = 0.45;
const MATCH_MIN_MARGIN = 0.2;
const UNCERTAIN_MIN_DISTINCTNESS = 0.35;

/**
 * Converts pitches to the intervals between distinct consecutive notes.
 * Intervals make matching independent of key; merging repeats makes it robust to how notes are split.
 */
export function toIntervals(pitches: readonly number[]): number[] {
  const contour: number[] = [];
  for (const pitch of pitches) {
    if (contour.length === 0 || Math.abs(pitch - contour[contour.length - 1]) >= SAME_NOTE) {
      contour.push(pitch);
    }
  }
  return contour.slice(1).map((pitch, index) => pitch - contour[index]);
}

export interface AlignmentOptions {
  readonly gap?: number;
  readonly merge?: number;
}

/**
 * Semi-global alignment: the whole query must align with any part of the target.
 * Supports skipped or extra notes. Returns the average cost per query interval.
 */
export function alignmentCost(
  query: readonly number[],
  target: readonly number[],
  { gap = GAP, merge = MERGE }: AlignmentOptions = {},
): number {
  const rows = query.length;
  const width = target.length + 1;
  const cost = new Float64Array((rows + 1) * width);
  for (let i = 1; i <= rows; i++) {
    cost[i * width] = i * gap;
  }
  for (let i = 1; i <= rows; i++) {
    for (let j = 1; j < width; j++) {
      let best = cost[(i - 1) * width + j - 1] + substitution(query[i - 1], target[j - 1]);
      best = Math.min(best, cost[(i - 1) * width + j] + gap, cost[i * width + j - 1] + gap);
      if (j >= 2) {
        const skipped = substitution(query[i - 1], target[j - 2] + target[j - 1]);
        best = Math.min(best, cost[(i - 1) * width + j - 2] + skipped + merge);
      }
      if (i >= 2) {
        const extra = substitution(query[i - 2] + query[i - 1], target[j - 1]);
        best = Math.min(best, cost[(i - 2) * width + j - 1] + extra + merge);
      }
      cost[i * width + j] = best;
    }
  }
  let minimum = Infinity;
  for (let j = 0; j < width; j++) {
    minimum = Math.min(minimum, cost[rows * width + j]);
  }
  return minimum / rows;
}

export function matchPitches(pitches: readonly number[], catalog: readonly Melody[]): RecognitionResult {
  const query = toIntervals(pitches);
  const noteCount = pitches.length === 0 ? 0 : query.length + 1;
  if (query.length < MIN_INTERVALS) {
    return { verdict: 'too-short', candidates: [], noteCount };
  }
  const ranked = catalog
    .map((melody) => ({ melody, cost: alignmentCost(query, intervalsOf(melody)) }))
    .sort((a, b) => a.cost - b.cost);
  // Distinctness: how far the best candidate stands out from the typical (median) candidate.
  const medianCost = ranked[Math.floor(ranked.length / 2)].cost;
  const distinctness = (cost: number) => (medianCost > 0 ? (medianCost - cost) / medianCost : 0);
  const [best, second] = ranked;
  const margin = second ? second.cost - best.cost : Infinity;
  const bestDistinctness = distinctness(best.cost);
  const verdict: Verdict =
    bestDistinctness >= MATCH_MIN_DISTINCTNESS && margin >= MATCH_MIN_MARGIN
      ? 'match'
      : bestDistinctness >= UNCERTAIN_MIN_DISTINCTNESS
        ? 'uncertain'
        : 'none';
  return {
    verdict,
    noteCount,
    candidates: ranked.slice(0, 3).map(({ melody, cost }) => ({ melody, score: toScore(distinctness(cost)) })),
  };
}

const intervalCache = new WeakMap<Melody, number[]>();

function intervalsOf(melody: Melody): number[] {
  let intervals = intervalCache.get(melody);
  if (!intervals) {
    intervals = toIntervals(melody.notes.map((note) => note.midi));
    intervalCache.set(melody, intervals);
  }
  return intervals;
}

function substitution(a: number, b: number): number {
  return Math.min(Math.abs(a - b), SUBSTITUTION_CAP);
}

/** Maps distinctness to a 0–0.99 display score: clear matches land around 0.7–0.95, unrelated melodies below 0.4. */
function toScore(distinctness: number): number {
  return Math.max(0, Math.min(0.99, distinctness / 0.9));
}

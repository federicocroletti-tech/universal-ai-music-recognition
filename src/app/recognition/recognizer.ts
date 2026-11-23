import { CATALOG } from './catalog.js';
import { matchPitches } from './matcher.js';
import { Melody, RecognitionResult } from './models.js';
import { detectPitch } from './pitch.js';
import { segmentNotes } from './segmentation.js';

export function recognize(
  samples: Float32Array,
  sampleRate: number,
  catalog: readonly Melody[] = CATALOG,
): RecognitionResult {
  const notes = segmentNotes(detectPitch(samples, sampleRate));
  return matchPitches(
    notes.map((note) => note.midi),
    catalog,
  );
}

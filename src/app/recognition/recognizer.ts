import { CATALOG } from './catalog';
import { matchPitches } from './matcher';
import { Melody, RecognitionResult } from './models';
import { detectPitch } from './pitch';
import { segmentNotes } from './segmentation';

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

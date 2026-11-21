import { CATALOG } from './catalog';
import { recognize } from './recognizer';
import { synthesizeHum } from './testing/synthesize';

const SAMPLE_RATE = 16000;

describe('recognize (synthetic hummed audio)', () => {
  it.each([
    ['ode-to-joy', -5],
    ['twinkle', 0],
    ['frere-jacques', -7],
    ['happy-birthday', -12],
  ])('recognizes a hummed %s', (id, transpose) => {
    const melody = CATALOG.find((entry) => entry.id === id);
    const notes = (melody?.notes ?? []).slice(0, 14).map((note) => note.midi + transpose);

    const result = recognize(synthesizeHum(notes, { seed: notes.length }), SAMPLE_RATE);

    expect(result.candidates[0]?.melody.id).toBe(id);
    expect(result.verdict).toBe('match');
  });

  it('asks for a longer hum when there is only silence', () => {
    expect(recognize(new Float32Array(SAMPLE_RATE), SAMPLE_RATE).verdict).toBe('too-short');
  });
});

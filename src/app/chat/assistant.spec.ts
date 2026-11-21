import { CATALOG } from '../recognition/catalog';
import { RecognitionResult } from '../recognition/models';
import { LocalAssistant } from './assistant';

describe('LocalAssistant', () => {
  const assistant = new LocalAssistant();

  it('lists the catalog when asked which songs it knows', async () => {
    const reply = await assistant.reply('Quali brani conosci?');
    expect(reply.items?.length).toBe(CATALOG.length);
  });

  it('links the privacy notice for privacy questions', async () => {
    expect((await assistant.reply('Che fine fanno i miei dati?')).link?.path).toBe('/privacy');
  });

  it('suggests supported questions for anything else', async () => {
    expect((await assistant.reply('Che tempo fa?')).text).toContain('come funziona');
  });

  it('names the melody on a confident match', async () => {
    const result: RecognitionResult = { verdict: 'match', noteCount: 10, candidates: [{ melody: CATALOG[0], score: 0.9 }] };
    expect((await assistant.describeResult(result)).text).toContain(CATALOG[0].title);
  });

  it('asks to hum louder when no notes were heard', async () => {
    const result: RecognitionResult = { verdict: 'too-short', noteCount: 0, candidates: [] };
    expect((await assistant.describeResult(result)).text).toContain('Non ho sentito');
  });
});

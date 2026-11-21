import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AudioCaptureService, CaptureError } from '../audio/audio-capture.service';
import { CATALOG } from '../recognition/catalog';
import { RecognitionResult } from '../recognition/models';
import { RecognitionService } from '../recognition/recognition.service';
import { Assistant, LocalAssistant } from './assistant';
import { ChatStore } from './chat.store';

const MATCH: RecognitionResult = { verdict: 'match', noteCount: 9, candidates: [{ melody: CATALOG[0], score: 0.9 }] };

describe('ChatStore', () => {
  let capture: { level: ReturnType<typeof signal<number>>; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn> };
  let recognition: { warmUp: ReturnType<typeof vi.fn>; recognize: ReturnType<typeof vi.fn> };
  let store: ChatStore;

  beforeEach(() => {
    capture = {
      level: signal(0),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue({ samples: new Float32Array(16000), sampleRate: 16000, seconds: 6.2 }),
      cancel: vi.fn(),
    };
    recognition = { warmUp: vi.fn(), recognize: vi.fn().mockResolvedValue(MATCH) };
    TestBed.configureTestingModule({
      providers: [
        ChatStore,
        { provide: AudioCaptureService, useValue: capture },
        { provide: RecognitionService, useValue: recognition },
        { provide: Assistant, useClass: LocalAssistant },
      ],
    });
    store = TestBed.inject(ChatStore);
  });

  it('records, analyzes and answers with the recognized melody', async () => {
    await store.toggleRecording();
    expect(store.status()).toBe('recording');

    await store.toggleRecording();

    expect(store.status()).toBe('idle');
    expect(capture.cancel).not.toHaveBeenCalled();
    expect(recognition.recognize).toHaveBeenCalledWith(expect.any(Float32Array), 16000);
    expect(store.messages().map((message) => message.kind)).toEqual(['text', 'recording', 'result']);
    const last = store.messages().at(-1);
    expect(last?.role === 'assistant' && last.reply.text).toContain(CATALOG[0].title);
  });

  it('explains how to enable the microphone when permission is denied', async () => {
    capture.start.mockRejectedValue(new CaptureError('denied'));

    await store.toggleRecording();

    expect(store.status()).toBe('idle');
    const last = store.messages().at(-1);
    expect(last?.role === 'assistant' && last.reply.text).toContain('Non ho accesso al microfono');
  });

  it('ignores empty messages and trims long ones', async () => {
    await store.send('   ');
    expect(store.messages().length).toBe(1);

    await store.send('a'.repeat(500));
    const userMessage = store.messages()[1];
    expect(userMessage.role === 'user' && userMessage.kind === 'text' && userMessage.text.length).toBe(300);
  });
});

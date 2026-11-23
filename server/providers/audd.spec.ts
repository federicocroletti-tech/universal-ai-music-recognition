import { describe, expect, it, vi } from 'vitest';
import { AudDProvider } from './audd.js';

describe('AudDProvider', () => {
  it('normalizes a matched track', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        result: {
          title: 'Test Song',
          artist: 'Test Artist; Featured Artist',
          album: 'Test Album',
          release_date: '2026-01-01',
          isrc: 'TEST00000001',
          timecode: '00:00:12.5',
          score: 0.96,
          spotify: { external_urls: { spotify: 'https://open.spotify.com/track/test' } },
        },
      }),
    }));

    const provider = new AudDProvider('test-token');
    const result = await provider.recognize({
      buffer: new Uint8Array([1, 2, 3]),
      mimeType: 'audio/wav',
      filename: 'sample.wav',
      consentReference: 'consent-test',
    });

    expect(result.status).toBe('matched');
    expect(result.track?.title).toBe('Test Song');
    expect(result.track?.artists).toEqual(['Test Artist', 'Featured Artist']);
    expect(result.offsetSeconds).toBe(12.5);
    expect(result.confidence).toBe(0.96);
  });

  it('normalizes no-match responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', result: null }),
    }));

    const provider = new AudDProvider('test-token');
    await expect(provider.recognize({
      buffer: new Uint8Array([1, 2, 3]),
      mimeType: 'audio/wav',
      filename: 'sample.wav',
      consentReference: 'consent-test',
    })).resolves.toEqual({ provider: 'audd', status: 'no-match' });
  });

  it('rejects malformed provider match objects and filters non-HTTPS links', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        result: {
          title: 'Test Song',
          song_link: 'javascript:alert(1)',
          spotify: { external_urls: { spotify: 'https://open.spotify.com/track/test' } },
        },
      }),
    }));

    const provider = new AudDProvider('test-token');
    const result = await provider.recognize({
      buffer: new Uint8Array([1, 2, 3]),
      mimeType: 'audio/wav',
      filename: 'sample.wav',
      consentReference: 'consent-test',
    });

    expect(result.track?.externalLinks).toEqual({
      spotify: 'https://open.spotify.com/track/test',
    });
  });

  it('omits invalid or non-finite provider timecodes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        result: {
          title: 'Test Song',
          timecode: '9'.repeat(400),
        },
      }),
    }));

    const provider = new AudDProvider('test-token');
    const result = await provider.recognize({
      buffer: new Uint8Array([1, 2, 3]),
      mimeType: 'audio/wav',
      filename: 'sample.wav',
      consentReference: 'consent-test',
    });

    expect(result.offsetSeconds).toBeUndefined();
  });
});

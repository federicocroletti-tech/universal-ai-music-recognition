import { describe, expect, it } from 'vitest';
import { decodePcm16Base64 } from './index';

describe('decodePcm16Base64', () => {
  it('decodes little-endian PCM16 samples as normalized floats', () => {
    const buffer = Buffer.alloc(6);
    buffer.writeInt16LE(-32768, 0);
    buffer.writeInt16LE(0, 2);
    buffer.writeInt16LE(32767, 4);

    const samples = decodePcm16Base64(buffer.toString('base64'), 16000);

    expect(samples).toEqual(new Float32Array([-1, 0, 32767 / 32768]));
  });

  it('rejects incomplete PCM16 data', () => {
    expect(() => decodePcm16Base64(Buffer.from([1]).toString('base64'), 16000)).toThrow(
      'PCM16 data must contain complete 16-bit samples',
    );
  });

  it('rejects unsupported sample rates', () => {
    expect(() => decodePcm16Base64(Buffer.from([0, 0]).toString('base64'), 44100.5)).toThrow(
      'sampleRate must be an integer',
    );
  });

  it('rejects malformed base64 instead of silently decoding it', () => {
    expect(() => decodePcm16Base64('%%%=', 16000)).toThrow('PCM audio must be valid base64');
  });

  it('rejects empty audio', () => {
    expect(() => decodePcm16Base64('', 16000)).toThrow('PCM audio is empty');
  });
});

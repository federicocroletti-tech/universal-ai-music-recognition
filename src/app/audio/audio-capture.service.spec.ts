import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioCaptureService } from './audio-capture.service';

describe('AudioCaptureService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('can cancel safely when animation frame APIs are unavailable during SSR', () => {
    vi.stubGlobal('cancelAnimationFrame', undefined);

    expect(() => new AudioCaptureService().cancel()).not.toThrow();
  });
});

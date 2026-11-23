import { RecognitionAudio, RecognitionMatch, RecognitionProvider } from './types.js';
import * as z from 'zod/v4';

const linkSchema = z.string().url();
const auddResultSchema = z.object({
  title: z.string().min(1),
  artist: z.string().optional(),
  album: z.string().optional(),
  release_date: z.string().optional(),
  isrc: z.string().optional(),
  timecode: z.string().optional(),
  score: z.number().finite().optional(),
  song_link: linkSchema.optional(),
  apple_music: z.object({ url: linkSchema.optional() }).optional(),
  spotify: z.object({ external_urls: z.object({ spotify: linkSchema.optional() }).optional() }).optional(),
  deezer: z.object({ link: linkSchema.optional() }).optional(),
}).passthrough();
const auddResponseSchema = z.object({
  status: z.string(),
  result: z.union([auddResultSchema, z.array(auddResultSchema), z.null()]).optional(),
  error: z.object({ error_code: z.number().optional() }).passthrough().optional(),
}).passthrough();

export class ProviderRequestError extends Error {
  constructor(
    readonly code: 'provider_timeout' | 'provider_unavailable' | 'provider_rejected',
    message: string,
  ) {
    super(message);
  }
}

export class AudDProvider implements RecognitionProvider {
  readonly id = 'audd';
  readonly name = 'AudD';

  constructor(
    private readonly apiToken: string,
    private readonly endpoint = 'https://api.audd.io/',
  ) {}

  async recognize(audio: RecognitionAudio): Promise<RecognitionMatch> {
    if (!this.apiToken) {
      throw new Error('AUDD_API_TOKEN is required');
    }

    const form = new FormData();
    form.set('api_token', this.apiToken);
    form.set('return', 'apple_music,spotify,deezer,musicbrainz');
    form.set(
      'file',
      new Blob([new Uint8Array(audio.buffer)], { type: audio.mimeType }),
      audio.filename,
    );

    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new ProviderRequestError('provider_timeout', 'Recognition provider timed out');
      }
      throw new ProviderRequestError('provider_unavailable', 'Recognition provider is unavailable');
    }
    if (!response.ok) {
      throw new ProviderRequestError('provider_unavailable', `Recognition provider returned HTTP ${response.status}`);
    }

    let payload: z.output<typeof auddResponseSchema>;
    try {
      payload = auddResponseSchema.parse(await response.json());
    } catch {
      throw new ProviderRequestError('provider_unavailable', 'Recognition provider returned invalid JSON');
    }
    if (payload.status !== 'success') {
      throw new ProviderRequestError(
        'provider_rejected',
        `Recognition provider rejected the request${payload.error?.error_code ? ` (${payload.error.error_code})` : ''}`,
      );
    }
    if (!payload.result) {
      return { provider: this.id, status: 'no-match' };
    }

    const result = Array.isArray(payload.result) ? payload.result[0] : payload.result;
    if (!result) {
      return { provider: this.id, status: 'no-match' };
    }

    const externalLinks: Record<string, string> = {};
    if (isHttpsUrl(result.song_link)) externalLinks.audd = result.song_link;
    if (isHttpsUrl(result.apple_music?.url)) externalLinks.appleMusic = result.apple_music.url;
    if (isHttpsUrl(result.spotify?.external_urls?.spotify)) externalLinks.spotify = result.spotify.external_urls.spotify;
    if (isHttpsUrl(result.deezer?.link)) externalLinks.deezer = result.deezer.link;

    return {
      provider: this.id,
      status: 'matched',
      confidence: typeof result.score === 'number' && result.score >= 0 && result.score <= 1
        ? result.score
        : undefined,
      offsetSeconds: parseTimecode(result.timecode),
      track: {
        title: result.title,
        artists: result.artist ? result.artist.split(/\s*[,;&]\s*/).filter(Boolean) : [],
        album: result.album,
        releaseDate: result.release_date,
        isrc: result.isrc,
        externalLinks,
      },
    };
  }
}

function isHttpsUrl(value: string | undefined): value is string {
  if (!value) {
    return false;
  }
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function parseTimecode(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  if (/^\d+(?:\.\d+)?$/.test(value)) {
    const seconds = Number(value);
    return Number.isFinite(seconds) ? seconds : undefined;
  }
  const match = /^(\d{1,2}):([0-5]\d):([0-5]\d(?:\.\d+)?)$/.exec(value);
  if (!match) {
    return undefined;
  }
  const seconds = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  return Number.isFinite(seconds) ? seconds : undefined;
}

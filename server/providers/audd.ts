import { RecognitionAudio, RecognitionMatch, RecognitionProvider } from './types.js';

interface AuddResult {
  readonly title?: string;
  readonly artist?: string;
  readonly album?: string;
  readonly release_date?: string;
  readonly isrc?: string;
  readonly timecode?: string;
  readonly score?: number;
  readonly song_link?: string;
  readonly apple_music?: { readonly url?: string };
  readonly spotify?: { readonly external_urls?: { readonly spotify?: string } };
  readonly deezer?: { readonly link?: string };
  readonly musicbrainz?: { readonly release_group_id?: string };
}

interface AuddResponse {
  readonly status?: string;
  readonly result?: AuddResult | readonly AuddResult[] | null;
  readonly error?: { readonly error_message?: string; readonly error_code?: number };
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

    const response = await fetch(this.endpoint, { method: 'POST', body: form });
    if (!response.ok) {
      throw new Error(`AudD returned HTTP ${response.status}`);
    }

    const payload = (await response.json()) as AuddResponse;
    if (payload.status !== 'success') {
      throw new Error(payload.error?.error_message ?? 'AudD recognition failed');
    }
    if (!payload.result) {
      return { provider: this.id, status: 'no-match' };
    }

    const result = Array.isArray(payload.result) ? payload.result[0] : payload.result;
    if (!result) {
      return { provider: this.id, status: 'no-match' };
    }

    const externalLinks: Record<string, string> = {};
    if (result.song_link) externalLinks.audd = result.song_link;
    if (result.apple_music?.url) externalLinks.appleMusic = result.apple_music.url;
    if (result.spotify?.external_urls?.spotify) externalLinks.spotify = result.spotify.external_urls.spotify;
    if (result.deezer?.link) externalLinks.deezer = result.deezer.link;

    return {
      provider: this.id,
      status: 'matched',
      confidence: typeof result.score === 'number' ? result.score : undefined,
      offsetSeconds: result.timecode ? Number(result.timecode) : undefined,
      track: {
        title: result.title ?? 'Unknown title',
        artists: result.artist ? result.artist.split(/\\s*[,;&]\\s*/).filter(Boolean) : [],
        album: result.album,
        releaseDate: result.release_date,
        isrc: result.isrc,
        externalLinks,
      },
    };
  }
}

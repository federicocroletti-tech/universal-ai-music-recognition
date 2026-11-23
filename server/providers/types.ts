export interface RecognitionAudio {
  readonly buffer: Uint8Array;
  readonly mimeType: string;
  readonly filename: string;
  readonly consentReference: string;
}

export interface RecognitionTrack {
  readonly title: string;
  readonly artists: readonly string[];
  readonly album?: string;
  readonly releaseDate?: string;
  readonly isrc?: string;
  readonly externalLinks: Readonly<Record<string, string>>;
}

export interface RecognitionMatch {
  readonly provider: string;
  readonly status: 'matched' | 'no-match';
  readonly confidence?: number;
  readonly track?: RecognitionTrack;
  readonly offsetSeconds?: number;
}

export interface RecognitionProvider {
  readonly id: string;
  readonly name: string;
  recognize(audio: RecognitionAudio): Promise<RecognitionMatch>;
}

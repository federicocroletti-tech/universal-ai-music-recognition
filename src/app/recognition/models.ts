export interface MelodyNote {
  /** MIDI note number (60 = C4). */
  readonly midi: number;
  readonly beats: number;
}

export interface Melody {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly year: string;
  readonly notes: readonly MelodyNote[];
}

export interface PitchFrame {
  readonly time: number;
  /** Fractional MIDI pitch, or null when the frame is unvoiced. */
  readonly midi: number | null;
  readonly rms: number;
}

export interface SungNote {
  readonly midi: number;
  readonly start: number;
  readonly duration: number;
}

export type Verdict = 'match' | 'uncertain' | 'none' | 'too-short';

export interface Candidate {
  readonly melody: Melody;
  /** Similarity between 0 and 1. */
  readonly score: number;
}

export interface RecognitionResult {
  readonly verdict: Verdict;
  readonly candidates: readonly Candidate[];
  readonly noteCount: number;
}

export interface RecognitionRequest {
  readonly id: number;
  readonly samples: Float32Array;
  readonly sampleRate: number;
}

export interface RecognitionReply {
  readonly id: number;
  readonly result?: RecognitionResult;
  readonly error?: string;
}

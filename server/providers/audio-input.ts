import { RecognitionAudio } from './types.js';

export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
export const MAX_BASE64_LENGTH = 4 * Math.ceil(MAX_AUDIO_BYTES / 3);

const MIME_TYPES = new Set([
  'audio/aac',
  'audio/flac',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/x-wav',
]);

export class AudioInputError extends Error {
  constructor(
    readonly code: 'invalid_audio' | 'invalid_mime_type' | 'consent_required',
    message: string,
  ) {
    super(message);
  }
}

export function createRecognitionAudio(input: {
  readonly audioBase64: string;
  readonly mimeType: string;
  readonly filename: string;
  readonly consentGranted: boolean;
  readonly consentReference: string;
}): RecognitionAudio {
  if (input.consentGranted !== true || !/^[A-Za-z0-9._:-]{8,128}$/.test(input.consentReference)) {
    throw new AudioInputError('consent_required', 'Explicit consent and a valid reference are required');
  }

  if (!MIME_TYPES.has(input.mimeType.toLowerCase())) {
    throw new AudioInputError('invalid_mime_type', 'Unsupported audio MIME type');
  }

  const { audioBase64 } = input;
  if (
    audioBase64.length === 0 ||
    audioBase64.length > MAX_BASE64_LENGTH ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(audioBase64)
  ) {
    throw new AudioInputError('invalid_audio', 'Audio must be valid base64 and no larger than 10 MB');
  }

  const buffer = Buffer.from(audioBase64, 'base64');
  if (
    buffer.length === 0 ||
    buffer.length > MAX_AUDIO_BYTES ||
    buffer.toString('base64') !== audioBase64
  ) {
    throw new AudioInputError('invalid_audio', 'Audio must be valid base64 and no larger than 10 MB');
  }

  const filename = input.filename.trim();
  if (
    filename.length === 0 ||
    filename.length > 128 ||
    /[\u0000-\u001f\u007f/\\]/.test(filename)
  ) {
    throw new AudioInputError('invalid_audio', 'Filename is invalid');
  }

  return {
    buffer,
    mimeType: input.mimeType.toLowerCase(),
    filename,
    consentReference: input.consentReference,
  };
}

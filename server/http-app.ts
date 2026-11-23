import { timingSafeEqual } from 'node:crypto';
import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';
import * as z from 'zod/v4';
import { AudioInputError, MAX_AUDIO_BYTES, MAX_BASE64_LENGTH, createRecognitionAudio } from './providers/audio-input.js';
import { RecognitionProvider } from './providers/types.js';

const MAX_REQUEST_BYTES = MAX_BASE64_LENGTH + 16 * 1024;
const recognitionRequestSchema = z.object({
  audioBase64: z.string().min(1).max(MAX_BASE64_LENGTH),
  mimeType: z.string().min(1).max(64).default('audio/wav'),
  filename: z.string().min(1).max(128).default('recording.wav'),
  consentGranted: z.boolean(),
  consentReference: z.string().min(8).max(128),
}).strict();

export interface RecognitionHttpOptions {
  readonly apiKey?: string;
  readonly provider?: RecognitionProvider;
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

function readJson(request: IncomingMessage): Promise<unknown> {
  const contentLength = Number(request.headers['content-length'] ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return Promise.reject(new Error('payload_too_large'));
  }

  return new Promise((resolve, reject) => {
    let size = 0;
    let exceededLimit = false;
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_REQUEST_BYTES) {
        exceededLimit = true;
        chunks.length = 0;
        return;
      }
      if (!exceededLimit) {
        chunks.push(chunk);
      }
    });
    request.on('end', () => {
      if (exceededLimit) {
        reject(new Error('payload_too_large'));
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown);
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    request.on('error', reject);
  });
}

function hasValidApiKey(request: IncomingMessage, expected: string): boolean {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return false;
  }
  const provided = Buffer.from(authorization.slice(7));
  const configured = Buffer.from(expected);
  return provided.length === configured.length && timingSafeEqual(provided, configured);
}

export function createRecognitionHttpServer({
  apiKey,
  provider,
}: RecognitionHttpOptions): Server {
  const server = createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      sendJson(response, 200, {
        status: 'ok',
        ready: Boolean(apiKey && provider),
        provider: provider?.id ?? 'none',
      });
      return;
    }

    if (request.method !== 'POST' || request.url !== '/v1/recognitions') {
      sendJson(response, 404, { error: 'not_found' });
      return;
    }

    if (!apiKey) {
      sendJson(response, 503, { error: 'authentication_not_configured' });
      return;
    }
    if (!hasValidApiKey(request, apiKey)) {
      sendJson(response, 401, { error: 'unauthorized' });
      return;
    }
    if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
      sendJson(response, 415, { error: 'unsupported_media_type' });
      return;
    }

    try {
      const body = await readJson(request);
      const parsed = recognitionRequestSchema.safeParse(body);
      if (!parsed.success) {
        sendJson(response, 400, { error: 'invalid_request' });
        return;
      }

      const audio = createRecognitionAudio(parsed.data);
      if (audio.buffer.length > MAX_AUDIO_BYTES) {
        sendJson(response, 413, { error: 'payload_too_large' });
        return;
      }
      if (!provider) {
        sendJson(response, 503, { error: 'provider_not_configured' });
        return;
      }

      const result = await provider.recognize(audio);
      sendJson(response, 200, result);
    } catch (error) {
      if (error instanceof AudioInputError) {
        sendJson(response, 400, { error: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : '';
      if (message === 'payload_too_large') {
        sendJson(response, 413, { error: 'payload_too_large' });
        return;
      }
      if (message === 'invalid_json') {
        sendJson(response, 400, { error: 'invalid_json' });
        return;
      }
      if (response.headersSent || response.destroyed) {
        return;
      }
      sendJson(response, 502, { error: 'recognition_provider_failed' });
    }
  });

  server.headersTimeout = 10_000;
  server.requestTimeout = 15_000;
  return server;
}

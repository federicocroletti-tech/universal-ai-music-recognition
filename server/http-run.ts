import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { createProvider } from './index.js';

const MAX_AUDIO_BYTES = 16 * 1024 * 1024;
const port = Number(process.env['PORT'] ?? 4318);

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_AUDIO_BYTES + 1024 * 1024) {
        reject(new Error('payload_too_large'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>);
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    request.on('error', reject);
  });
}

const server = createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    sendJson(response, 200, { status: 'ok', provider: process.env['AUDD_API_TOKEN'] ? 'audd' : 'none' });
    return;
  }

  if (request.method !== 'POST' || request.url !== '/v1/recognitions') {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  const requiredKey = process.env['UAMR_API_KEY'];
  if (requiredKey) {
    const authorization = request.headers.authorization;
    if (authorization !== `Bearer ${requiredKey}`) {
      sendJson(response, 401, { error: 'unauthorized' });
      return;
    }
  }

  try {
    const body = await readJson(request);
    const audioBase64 = typeof body['audioBase64'] === 'string' ? body['audioBase64'] : '';
    const consentReference = typeof body['consentReference'] === 'string' ? body['consentReference'] : '';
    const mimeType = typeof body['mimeType'] === 'string' ? body['mimeType'] : 'audio/wav';
    const filename = typeof body['filename'] === 'string' ? body['filename'] : 'recording.wav';
    if (!consentReference) {
      sendJson(response, 400, { error: 'consent_required' });
      return;
    }

    const provider = createProvider();
    if (!provider) {
      sendJson(response, 503, { error: 'provider_not_configured' });
      return;
    }

    const buffer = Buffer.from(audioBase64, 'base64');
    if (buffer.length === 0 || buffer.length > MAX_AUDIO_BYTES) {
      sendJson(response, 400, { error: 'invalid_audio', maxBytes: MAX_AUDIO_BYTES });
      return;
    }

    const result = await provider.recognize({ buffer, mimeType, filename, consentReference });
    sendJson(response, result.status === 'matched' ? 200 : 404, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'recognition_failed';
    const status = message === 'payload_too_large' ? 413 : message === 'invalid_json' ? 400 : 502;
    sendJson(response, status, { error: status === 502 ? 'recognition_failed' : message });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Universal AI Music Recognition API listening on http://127.0.0.1:${port}`);
});

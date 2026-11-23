import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRecognitionHttpServer } from './http-app.js';
import { RecognitionProvider } from './providers/types.js';
import { Server } from 'node:http';

describe('recognition HTTP API', () => {
  const servers: Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    })));
  });

  async function start(options: Parameters<typeof createRecognitionHttpServer>[0] = {}): Promise<string> {
    const server = createRecognitionHttpServer(options);
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Test server did not bind to a TCP port');
    }
    return `http://127.0.0.1:${address.port}`;
  }

  function provider(): RecognitionProvider {
    return {
      id: 'test-provider',
      name: 'Test Provider',
      recognize: vi.fn().mockResolvedValue({
        provider: 'test-provider',
        status: 'matched',
        track: { title: 'Test Track', artists: ['Test Artist'], externalLinks: {} },
      }),
    };
  }

  function requestBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      audioBase64: Buffer.from('audio bytes').toString('base64'),
      mimeType: 'audio/wav',
      filename: 'recording.wav',
      consentGranted: true,
      consentReference: 'consent-123',
      ...overrides,
    };
  }

  it('does not expose the recognition route without configured API authentication', async () => {
    const baseUrl = await start({ provider: provider() });
    const response = await fetch(`${baseUrl}/v1/recognitions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(requestBody()),
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'authentication_not_configured' });
  });

  it('rejects invalid bearer credentials', async () => {
    const baseUrl = await start({ apiKey: 'secret-key', provider: provider() });
    const response = await fetch(`${baseUrl}/v1/recognitions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer wrong-key' },
      body: JSON.stringify(requestBody()),
    });

    expect(response.status).toBe(401);
  });

  it('requires explicit consent before forwarding any audio', async () => {
    const recognitionProvider = provider();
    const baseUrl = await start({ apiKey: 'secret-key', provider: recognitionProvider });
    const response = await fetch(`${baseUrl}/v1/recognitions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer secret-key' },
      body: JSON.stringify(requestBody({ consentGranted: false })),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'consent_required' });
    expect(recognitionProvider.recognize).not.toHaveBeenCalled();
  });

  it('validates input and forwards only normalized audio to the provider', async () => {
    const recognitionProvider = provider();
    const baseUrl = await start({ apiKey: 'secret-key', provider: recognitionProvider });
    const response = await fetch(`${baseUrl}/v1/recognitions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer secret-key' },
      body: JSON.stringify(requestBody()),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'matched', provider: 'test-provider' });
    expect(recognitionProvider.recognize).toHaveBeenCalledWith(expect.objectContaining({
      mimeType: 'audio/wav',
      filename: 'recording.wav',
      consentReference: 'consent-123',
      buffer: expect.any(Buffer),
    }));
  });

  it('rejects malformed base64 and unsupported MIME types', async () => {
    const baseUrl = await start({ apiKey: 'secret-key', provider: provider() });
    const headers = { 'content-type': 'application/json', authorization: 'Bearer secret-key' };

    const malformedAudio = await fetch(`${baseUrl}/v1/recognitions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody({ audioBase64: '%%%=' })),
    });
    expect(malformedAudio.status).toBe(400);
    expect(await malformedAudio.json()).toEqual({ error: 'invalid_audio' });

    const unsupportedMime = await fetch(`${baseUrl}/v1/recognitions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody({ mimeType: 'text/plain' })),
    });
    expect(unsupportedMime.status).toBe(400);
    expect(await unsupportedMime.json()).toEqual({ error: 'invalid_mime_type' });
  });

  it('reports provider failures without leaking upstream details', async () => {
    const failingProvider: RecognitionProvider = {
      id: 'test-provider',
      name: 'Test Provider',
      recognize: vi.fn().mockRejectedValue(new Error('private upstream token detail')),
    };
    const baseUrl = await start({ apiKey: 'secret-key', provider: failingProvider });
    const response = await fetch(`${baseUrl}/v1/recognitions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer secret-key' },
      body: JSON.stringify(requestBody()),
    });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'recognition_provider_failed' });
  });
});

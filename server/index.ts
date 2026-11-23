import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CATALOG } from '../src/app/recognition/catalog.js';
import { recognize } from '../src/app/recognition/recognizer.js';
import { AudDProvider } from './providers/audd.js';
import { RecognitionProvider } from './providers/types.js';

const PCM16_MAX_BYTES = 16 * 1024 * 1024;

export function decodePcm16Base64(input: string, sampleRate: number): Float32Array {
  if (!Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 48000) {
    throw new Error('sampleRate must be an integer between 8000 and 48000');
  }
  if (input.length === 0) {
    throw new Error('PCM audio is empty');
  }
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input)) {
    throw new Error('PCM audio must be valid base64');
  }
  if (input.length > 4 * Math.ceil(PCM16_MAX_BYTES / 3)) {
    throw new Error('PCM audio exceeds the 16 MB limit');
  }

  const buffer = Buffer.from(input, 'base64');
  if (buffer.length > PCM16_MAX_BYTES) {
    throw new Error('PCM audio exceeds the 16 MB limit');
  }
  if (buffer.toString('base64') !== input) {
    throw new Error('PCM audio must be valid base64');
  }
  if (buffer.length % 2 !== 0) {
    throw new Error('PCM16 data must contain complete 16-bit samples');
  }

  const samples = new Float32Array(buffer.length / 2);
  for (let index = 0; index < samples.length; index++) {
    samples[index] = buffer.readInt16LE(index * 2) / 32768;
  }
  return samples;
}

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'universal-ai-music-recognition',
    version: '0.1.0',
  });

  server.registerTool('recognize_hum', {
    title: 'Recognize a hummed melody',
    description:
      'Recognizes mono hummed audio encoded as base64 PCM16. The audio stays local and is matched against the bundled public-domain catalog.',
    inputSchema: {
      pcm16Base64: z.string().min(1).describe('Base64-encoded little-endian signed 16-bit PCM samples'),
      sampleRate: z
        .number()
        .int()
        .min(8000)
        .max(48000)
        .default(16000)
        .describe('Audio sample rate in Hz'),
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  }, async ({ pcm16Base64, sampleRate }) => {
    const samples = decodePcm16Base64(pcm16Base64, sampleRate);
    const result = recognize(samples, sampleRate);
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
      structuredContent: {
        verdict: result.verdict,
        noteCount: result.noteCount,
        candidates: result.candidates.map(({ melody, score }) => ({
          id: melody.id,
          title: melody.title,
          author: melody.author,
          year: melody.year,
          score,
        })),
      },
    };
  });

  server.registerTool('list_catalog', {
    title: 'List recognized melodies',
    description: 'Lists the bundled public-domain melody catalog available to recognition.',
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  }, async () => ({
    content: [{
      type: 'text',
      text: JSON.stringify(CATALOG.map(({ id, title, author, year }) => ({ id, title, author, year }))),
    }],
  }));

  server.registerTool('identify_song', {
    title: 'Identify a recorded song',
    description:
      'Identifies recorded audio through the configured enterprise provider. Raw audio is sent only when AUDD_API_TOKEN is configured and a consentReference is supplied.',
    inputSchema: {
      audioBase64: z.string().min(1).describe('Base64-encoded audio file'),
      mimeType: z.string().default('audio/wav').describe('IANA audio MIME type'),
      filename: z.string().default('recording.wav').describe('Filename used for the upload'),
      consentReference: z.string().min(1).describe('Reference to explicit user consent for this recognition request'),
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: true,
    },
  }, async ({ audioBase64, mimeType, filename, consentReference }) => {
    const provider = createProvider();
    if (!provider) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'No enterprise recognition provider is configured. Set AUDD_API_TOKEN.' }],
      };
    }

    const buffer = Buffer.from(audioBase64, 'base64');
    if (buffer.length === 0 || buffer.length > PCM16_MAX_BYTES) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Audio must be non-empty and at most 16 MB' }],
      };
    }

    const result = await provider.recognize({ buffer, mimeType, filename, consentReference });
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
      structuredContent: JSON.parse(JSON.stringify(result)) as Record<string, unknown>,
    };
  });

  return server;
}

export function createProvider(): RecognitionProvider | undefined {
  const apiToken = process.env['AUDD_API_TOKEN'];
  return apiToken ? new AudDProvider(apiToken) : undefined;
}

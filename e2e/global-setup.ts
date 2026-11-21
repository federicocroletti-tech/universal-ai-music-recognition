import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { CATALOG } from '../src/app/recognition/catalog';
import { synthesizeHum } from '../src/app/recognition/testing/synthesize';
import { HUM_WAV } from './paths';

const SAMPLE_RATE = 48000;

/** Writes a 16-bit PCM mono WAV that Chromium plays as a fake microphone. */
export default function globalSetup(): void {
  const melody = CATALOG.find((entry) => entry.id === 'ode-to-joy');
  const notes = (melody?.notes ?? []).slice(0, 14).map((note) => note.midi - 5);
  const samples = synthesizeHum(notes, { sampleRate: SAMPLE_RATE, seed: 5 });

  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((sample, index) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), index * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  mkdirSync(dirname(HUM_WAV), { recursive: true });
  writeFileSync(HUM_WAV, Buffer.concat([header, data]));
}

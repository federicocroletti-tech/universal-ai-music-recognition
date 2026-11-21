import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { AudioCaptureService, CaptureError, CaptureErrorCode } from '../audio/audio-capture.service';
import { RecognitionService } from '../recognition/recognition.service';
import { Assistant, WELCOME } from './assistant';
import { AssistantReply, ChatMessage, ChatStatus, NewChatMessage } from './chat.models';

export const MAX_RECORDING_SECONDS = 12;
const MAX_TEXT_LENGTH = 300;

const CAPTURE_ERRORS: Record<CaptureErrorCode, string> = {
  unsupported: 'Questo browser non supporta la registrazione audio. Prova con una versione recente di Chrome, Edge, Firefox o Safari.',
  denied: 'Non ho accesso al microfono. Puoi consentirlo dalle impostazioni del sito nel browser (icona accanto all’indirizzo).',
  'no-device': 'Non trovo nessun microfono collegato.',
  failed: 'Non riesco ad avviare il microfono. Riprova tra un momento.',
};

/** Facade for the chat page: conversation state, recording lifecycle, and recognition. */
@Injectable()
export class ChatStore implements OnDestroy {
  private readonly capture = inject(AudioCaptureService);
  private readonly recognition = inject(RecognitionService);
  private readonly assistant = inject(Assistant);
  private nextId = 1;
  private timer?: ReturnType<typeof setInterval>;

  readonly messages = signal<readonly ChatMessage[]>([{ id: 0, role: 'assistant', kind: 'text', reply: WELCOME }]);
  readonly status = signal<ChatStatus>('idle');
  readonly elapsed = signal(0);
  readonly level = this.capture.level;

  /** Downloads the recognition engine in the background when the user shows intent to record. */
  prepare(): void {
    this.recognition.warmUp();
  }

  async toggleRecording(): Promise<void> {
    if (this.status() === 'recording') {
      await this.stopRecording();
    } else if (this.status() === 'idle') {
      await this.startRecording();
    }
  }

  async send(text: string): Promise<void> {
    const trimmed = text.trim().slice(0, MAX_TEXT_LENGTH);
    if (!trimmed) {
      return;
    }
    this.add({ role: 'user', kind: 'text', text: trimmed });
    this.addReply(await this.assistant.reply(trimmed));
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    this.capture.cancel();
  }

  private async startRecording(): Promise<void> {
    this.status.set('starting');
    try {
      await this.capture.start();
    } catch (error) {
      this.status.set('idle');
      this.addReply({ text: CAPTURE_ERRORS[error instanceof CaptureError ? error.code : 'failed'] });
      return;
    }
    this.status.set('recording');
    this.elapsed.set(0);
    const startedAt = Date.now();
    this.timer = setInterval(() => {
      const seconds = (Date.now() - startedAt) / 1000;
      this.elapsed.set(seconds);
      if (seconds >= MAX_RECORDING_SECONDS) {
        void this.stopRecording();
      }
    }, 200);
  }

  private async stopRecording(): Promise<void> {
    if (this.status() !== 'recording') {
      return;
    }
    clearInterval(this.timer);
    this.status.set('analyzing');
    try {
      const audio = await this.capture.stop();
      this.add({ role: 'user', kind: 'recording', seconds: audio.seconds });
      const result = await this.recognition.recognize(audio.samples, audio.sampleRate);
      this.add({ role: 'assistant', kind: 'result', result, reply: await this.assistant.describeResult(result) });
    } catch {
      this.addReply({ text: 'Qualcosa è andato storto durante l’analisi. Riprova.' });
    } finally {
      this.status.set('idle');
    }
  }

  private addReply(reply: AssistantReply): void {
    this.add({ role: 'assistant', kind: 'text', reply });
  }

  private add(message: NewChatMessage): void {
    this.messages.update((messages) => [...messages, { ...message, id: this.nextId++ } as ChatMessage]);
  }
}

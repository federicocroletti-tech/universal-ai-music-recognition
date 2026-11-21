import { Injectable, OnDestroy, signal } from '@angular/core';
import { Melody } from '../recognition/models';
import { midiToHz } from '../recognition/notation';

const BEAT_SECONDS = 60 / 110;
const MAX_NOTES = 24;

/** Plays a melody preview with a soft synthesized tone (no audio files, nothing downloaded). */
@Injectable({ providedIn: 'root' })
export class MelodyPlayerService implements OnDestroy {
  readonly playingId = signal<string | null>(null);

  private context?: AudioContext;
  private oscillators: OscillatorNode[] = [];
  private endTimer?: ReturnType<typeof setTimeout>;

  toggle(melody: Melody): void {
    if (this.playingId() === melody.id) {
      this.stop();
    } else {
      this.play(melody);
    }
  }

  play(melody: Melody): void {
    this.stop();
    const context = (this.context ??= new AudioContext());
    void context.resume();
    let time = context.currentTime + 0.05;
    for (const note of melody.notes.slice(0, MAX_NOTES)) {
      const duration = note.beats * BEAT_SECONDS;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = midiToHz(note.midi);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.18, time + 0.02);
      gain.gain.setTargetAtTime(0, time + duration * 0.75, 0.05);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(time);
      oscillator.stop(time + duration + 0.25);
      this.oscillators.push(oscillator);
      time += duration;
    }
    this.playingId.set(melody.id);
    this.endTimer = setTimeout(() => this.playingId.set(null), (time - context.currentTime) * 1000);
  }

  stop(): void {
    clearTimeout(this.endTimer);
    this.oscillators.forEach((oscillator) => {
      oscillator.stop();
      oscillator.disconnect();
    });
    this.oscillators = [];
    this.playingId.set(null);
  }

  ngOnDestroy(): void {
    this.stop();
    void this.context?.close();
  }
}

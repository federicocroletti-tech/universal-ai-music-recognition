import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChatStore, MAX_RECORDING_SECONDS } from './chat.store';
import { ResultCard } from './result-card';

@Component({
  selector: 'app-chat-page',
  imports: [RouterLink, ResultCard],
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ChatStore],
})
export class ChatPage {
  protected readonly store = inject(ChatStore);
  protected readonly maxSeconds = MAX_RECORDING_SECONDS;
  protected readonly recording = computed(() => this.store.status() === 'recording');
  protected readonly busy = computed(() => ['starting', 'analyzing'].includes(this.store.status()));
  private readonly log = viewChild.required<ElementRef<HTMLElement>>('log');

  constructor() {
    afterRenderEffect(() => {
      this.store.messages();
      this.store.status();
      const log = this.log().nativeElement;
      log.scrollTop = log.scrollHeight;
    });
  }

  protected submit(event: Event, field: HTMLInputElement): void {
    event.preventDefault();
    const text = field.value;
    field.value = '';
    void this.store.send(text);
  }

  protected formatSeconds(seconds: number): string {
    return seconds.toFixed(1).replace('.', ',');
  }
}

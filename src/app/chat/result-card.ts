import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, inject, input } from '@angular/core';
import { MelodyPlayerService } from '../audio/melody-player.service';
import { Melody, RecognitionResult } from '../recognition/models';

@Component({
  selector: 'app-result-card',
  templateUrl: './result-card.html',
  styleUrl: './result-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultCard {
  readonly result = input.required<RecognitionResult>();
  protected readonly player = inject(MelodyPlayerService);
  protected readonly best = computed(() => this.result().candidates[0]);
  protected readonly alternatives = computed(() => this.result().candidates.slice(1));

  constructor() {
    // The card is deferred, so it renders after the conversation has already scrolled.
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    afterNextRender(() => host.nativeElement.scrollIntoView({ block: 'nearest' }));
  }

  protected percent(score: number): number {
    return Math.round(score * 100);
  }

  protected searchUrl({ title, author }: Melody): string {
    const query = `${title.replace(/\s*\(.*\)\s*$/, '')} ${author}`;
    return `https://it.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`;
  }
}

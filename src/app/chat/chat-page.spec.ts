import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Assistant, LocalAssistant } from './assistant';
import { ChatPage } from './chat-page';

describe('ChatPage', () => {
  async function render() {
    await TestBed.configureTestingModule({
      imports: [ChatPage],
      providers: [provideRouter([]), { provide: Assistant, useClass: LocalAssistant }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ChatPage);
    await fixture.whenStable();
    return fixture;
  }

  it('greets the user and exposes an accessible record button', async () => {
    const page = (await render()).nativeElement as HTMLElement;

    expect(page.querySelector('[role="log"]')?.textContent).toContain('canticchia una melodia');
    const mic = page.querySelector<HTMLButtonElement>('button.mic');
    expect(mic?.getAttribute('aria-label')).toBe('Registra e canticchia');
    expect(mic?.getAttribute('aria-pressed')).toBe('false');
  });

  it('answers typed questions in the conversation', async () => {
    const fixture = await render();
    const page = fixture.nativeElement as HTMLElement;
    page.querySelector<HTMLInputElement>('#chat-input')!.value = 'come funziona?';

    page.querySelector('form')?.dispatchEvent(new Event('submit'));
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();

    expect(page.querySelector('[role="log"]')?.textContent).toContain('confronto gli intervalli');
  });
});

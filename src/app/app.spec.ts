import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  it('renders the skip link and the main navigation', async () => {
    await TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.skip-link')?.getAttribute('href')).toBe('#main');
    const links = [...element.querySelectorAll('nav[aria-label="Principale"] a')].map((link) => link.textContent?.trim());
    expect(links).toEqual(['Chat', 'Privacy', 'GitHub (si apre in una nuova scheda)']);
  });
});

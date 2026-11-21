import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';
import { TitleStrategy, provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { Assistant, LocalAssistant } from './chat/assistant';
import { SeoTitleStrategy } from './seo';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    // Incremental hydration (default since Angular 22) turns on event replay, which injects inline
    // scripts that the strict Content Security Policy in vercel.json would block.
    provideClientHydration(withNoIncrementalHydration()),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    // Swap LocalAssistant for an LLM-backed implementation here.
    { provide: Assistant, useClass: LocalAssistant },
  ],
};

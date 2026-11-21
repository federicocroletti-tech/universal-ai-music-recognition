import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/** Production origin, used for canonical and social URLs. Keep in sync with public/robots.txt and public/sitemap.xml. */
export const SITE_URL = 'https://hum-finder-croletti.vercel.app';

const DEFAULT_TITLE = 'Hum Finder';
const DEFAULT_DESCRIPTION =
  'Canticchia una melodia e Hum Finder prova a riconoscerla. Prototipo gratuito: l’audio viene analizzato solo sul tuo dispositivo.';

/** Sets title, description, canonical URL, and social tags for each route, including the prerendered HTML. */
@Injectable()
export class SeoTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let route = snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const title = this.buildTitle(snapshot) ?? DEFAULT_TITLE;
    const description: string = route.data['description'] ?? DEFAULT_DESCRIPTION;
    const path = snapshot.url.split(/[?#]/)[0];
    const url = `${SITE_URL}${path === '/' ? '/' : path}`;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    let canonical = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.appendChild(canonical);
    }
    canonical.href = url;
  }
}

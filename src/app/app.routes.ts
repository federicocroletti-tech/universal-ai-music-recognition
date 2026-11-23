import { Routes } from '@angular/router';
import { ChatPage } from './chat/chat-page';

export const routes: Routes = [
  {
    path: '',
    component: ChatPage,
    title: 'Hum Finder · Riconosci una melodia canticchiando',
    data: {
      description:
        'Canticchia una melodia e Hum Finder prova a riconoscerla. Prototipo gratuito: l’audio viene analizzato solo sul tuo dispositivo.',
    },
  },
  {
    path: 'privacy',
    loadComponent: () => import('./privacy/privacy-page').then((m) => m.PrivacyPage),
    title: 'Informativa privacy · Hum Finder',
    data: {
      description: 'Come Hum Finder tratta i dati: audio analizzato solo nel browser, nessun cookie, nessun tracciamento.',
    },
  },
  { path: '**', redirectTo: '' },
];

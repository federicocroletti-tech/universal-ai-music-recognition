import { Routes } from '@angular/router';
import { ChatPage } from './chat/chat-page';

export const routes: Routes = [
  { path: '', component: ChatPage, title: 'Hum Finder · Riconosci una melodia canticchiando' },
  {
    path: 'privacy',
    loadComponent: () => import('./privacy/privacy-page').then((m) => m.PrivacyPage),
    title: 'Informativa privacy · Hum Finder',
  },
  { path: '**', redirectTo: '' },
];

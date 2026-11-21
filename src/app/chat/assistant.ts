import { Injectable } from '@angular/core';
import { RecognitionResult } from '../recognition/models';
import { AssistantReply } from './chat.models';

/**
 * Conversation strategy. The prototype uses LocalAssistant (pre-written replies, no AI model).
 * An LLM-backed implementation can replace it in app.config.ts without touching the UI.
 */
export abstract class Assistant {
  abstract reply(text: string): Promise<AssistantReply>;
  abstract describeResult(result: RecognitionResult): Promise<AssistantReply>;
}

export const WELCOME: AssistantReply = {
  text: 'Ciao! Premi il microfono e canticchia una melodia per 5–10 secondi: provo a riconoscerla. Usa una sillaba come «na» o «da» per ogni nota.',
};

const HELP: AssistantReply = {
  text: 'Premi il microfono, canticchia almeno 8 note e premi di nuovo per fermare (mi fermo da solo dopo 12 secondi). Analizzo l’altezza delle note e confronto gli intervalli con le melodie che conosco, quindi la tonalità non conta.',
};

const PRIVACY: AssistantReply = {
  text: 'L’audio viene analizzato solo nel tuo browser: non viene salvato né inviato a nessun server. Il microfono si spegne appena finisci di registrare.',
  link: { label: 'Leggi l’informativa privacy', path: '/privacy' },
};

const FALLBACK: AssistantReply = {
  text: 'Per ora capisco poche domande: prova «come funziona», «quali brani conosci» o «privacy». Oppure premi il microfono e canticchia.',
};

const quote = (title: string) => `«${title}»`;

@Injectable()
export class LocalAssistant extends Assistant {
  async reply(text: string): Promise<AssistantReply> {
    const normalized = text.toLowerCase();
    if (/\b(ciao|salve|buongiorno|buonasera|hey)\b/.test(normalized)) {
      return WELCOME;
    }
    if (/(come funziona|aiuto|help|istruzioni)/.test(normalized)) {
      return HELP;
    }
    if (/(brani|canzoni|melodie|catalogo|elenco|lista|conosci)/.test(normalized)) {
      const { CATALOG } = await import('../recognition/catalog');
      return {
        text: `Conosco ${CATALOG.length} melodie di pubblico dominio:`,
        items: CATALOG.map((melody) => `${melody.title} · ${melody.author}`),
      };
    }
    if (/(privacy|dati|registr|microfono|gdpr)/.test(normalized)) {
      return PRIVACY;
    }
    return FALLBACK;
  }

  async describeResult({ verdict, candidates, noteCount }: RecognitionResult): Promise<AssistantReply> {
    const best = candidates[0]?.melody;
    switch (verdict) {
      case 'match':
        return { text: `Credo sia ${quote(best.title)} di ${best.author} (${best.year}).` };
      case 'uncertain':
        return { text: `Non ne sono sicuro: potrebbe essere ${quote(best.title)}. Ecco le melodie più vicine.` };
      case 'none':
        return {
          text: 'Non riconosco questa melodia. Conosco solo poche melodie di pubblico dominio: scrivi «quali brani conosci» per vederle.',
        };
      case 'too-short':
        return {
          text:
            noteCount === 0
              ? 'Non ho sentito una melodia. Avvicinati al microfono e canticchia un po’ più forte.'
              : `Ho sentito solo ${noteCount} note diverse. Canticchia almeno 8 note, con una sillaba per nota.`,
        };
    }
  }
}

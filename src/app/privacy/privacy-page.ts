import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; padding: 2rem 1rem 4rem; }
    article { width: min(100%, 720px); margin-inline: auto; line-height: 1.65; }
    h1 { font-size: clamp(1.8rem, 4vw, 2.4rem); line-height: 1.15; margin: 0 0 0.5rem; }
    h2 { font-size: 1.15rem; margin: 2rem 0 0.5rem; }
    .lead { color: var(--muted); font-size: 1.05rem; }
    .summary { padding: 1rem 1.25rem; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border); }
    .summary ul { margin: 0.5rem 0 0; padding-left: 1.2rem; }
  `,
  template: `
    <article>
      <h1>Informativa privacy</h1>
      <p class="lead">Hum Finder è un prototipo personale e non commerciale di Federico Croletti. Ultimo aggiornamento: novembre 2026.</p>

      <section class="summary" aria-labelledby="privacy-summary">
        <h2 id="privacy-summary">In breve</h2>
        <ul>
          <li>L’audio del microfono viene analizzato solo nel tuo browser: non viene salvato né inviato a nessun server.</li>
          <li>Nessun cookie, nessuna memorizzazione nel browser, nessuno strumento di analisi o di tracciamento.</li>
          <li>Le risposte dell’assistente sono testi predefiniti: non vengono generate da un modello di intelligenza artificiale.</li>
        </ul>
      </section>

      <h2>Titolare del trattamento</h2>
      <p>
        Federico Croletti. Per domande o richieste puoi scrivere tramite il profilo GitHub
        <a href="https://github.com/federicocroletti-tech" rel="noopener noreferrer" target="_blank">federicocroletti-tech<span class="visually-hidden"> (si apre in una nuova scheda)</span></a>.
      </p>

      <h2>Microfono e audio</h2>
      <p>
        Il microfono si attiva solo quando premi il pulsante di registrazione e il browser ti chiede il permesso. Si spegne appena la
        registrazione finisce (al massimo dopo 12 secondi). L’audio resta nella memoria della pagina il tempo necessario a calcolare
        l’altezza delle note, poi viene scartato. Non viene salvato, inviato a server o condiviso con terzi, e non viene usato per
        identificarti.
      </p>

      <h2>Messaggi della chat</h2>
      <p>I messaggi restano solo nella pagina aperta e si cancellano quando la chiudi o la ricarichi. Non vengono inviati a server o a servizi di intelligenza artificiale.</p>

      <h2>Dati tecnici di navigazione</h2>
      <p>
        Il sito è ospitato da Vercel Inc., che per erogarlo e proteggerlo tratta dati tecnici delle richieste, come l’indirizzo IP, nei
        propri log. La base giuridica è il legittimo interesse al funzionamento e alla sicurezza del sito (art. 6, par. 1, lett. f del
        GDPR). Vercel può trattare i dati anche fuori dall’Unione europea, con le garanzie descritte nella sua
        <a href="https://vercel.com/legal/privacy-notice" rel="noopener noreferrer" target="_blank">informativa<span class="visually-hidden"> (si apre in una nuova scheda)</span></a>.
      </p>

      <h2>Cookie</h2>
      <p>Il sito non usa cookie né altre tecnologie di memorizzazione nel tuo dispositivo, quindi non serve alcun banner di consenso.</p>

      <h2>Link esterni</h2>
      <p>I link verso Wikipedia o GitHub portano su siti di terzi, che applicano le proprie informative.</p>

      <h2>I tuoi diritti</h2>
      <p>
        Puoi esercitare i diritti previsti dagli articoli 15–22 del GDPR (accesso, rettifica, cancellazione, limitazione, opposizione) e
        proporre reclamo al
        <a href="https://www.garanteprivacy.it/" rel="noopener noreferrer" target="_blank">Garante per la protezione dei dati personali<span class="visually-hidden"> (si apre in una nuova scheda)</span></a>.
      </p>

      <p><a routerLink="/">Torna alla chat</a></p>
    </article>
  `,
})
export class PrivacyPage {}

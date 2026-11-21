# AGENTS.md: how to continue this project

Read this file first. It is the single source of truth for workflow, architecture, decisions, and status, for humans and AI coding agents.

## Ground rules

- Do not invent facts. Verify technical, legal, and pricing claims on official sources and cite them here or in the PR. If something cannot be verified, write "not verified".
- Never send outreach messages or publish anything on behalf of the author without explicit approval (see [docs/proposal/OUTREACH-DRAFTS.md](./docs/proposal/OUTREACH-DRAFTS.md)).
- Privacy first: the microphone audio must never leave the user's device unless a future, documented, consented feature requires it.
- Keep everything free to run (free tiers, no paid APIs) unless the author decides otherwise.
- `private/` is git-ignored and holds non-public material (business proposal). Never commit it.

## Workflow (one branch per activity)

1. `git checkout main && git pull`
2. `git checkout -b <type>/<short-name>` (types: `feat`, `fix`, `chore`, `docs`)
3. Implement, then validate locally: `npm test` and `npm run build` (plus `npm run e2e` once it exists).
4. Commit, push, and open a PR: `gh pr create --base main --fill`
5. Wait for CI: `gh pr checks --watch`, then merge: `gh pr merge --merge --delete-branch`
6. Update the **Status** section below in the same PR, then start the next activity from step 1.

## Commands

| Command | Purpose |
|---|---|
| `npm ci` | Install exact dependencies (Node.js 22) |
| `npm start` | Dev server on http://localhost:4200 |
| `npm test` | Unit tests (Angular unit-test builder with Vitest) |
| `npm run build` | Static prerendered build in `dist/hum-finder/browser` |

## Architecture

- **Stack:** Angular 22 (standalone components, signals, zoneless), static prerendering (`outputMode: "static"`), no server at runtime.
- **Client-server balance:** all recognition runs in the browser (privacy, zero cost, offline-capable). The host only serves static files from a CDN.
- **Layout:** Angular app at the repo root (`src/`, `public/`), proposal documents in `docs/proposal/`.

### Recognition engine (`src/app/recognition/`)

Pipeline: microphone PCM (mono, 16 kHz) → `pitch.ts` → `segmentation.ts` → `matcher.ts` → result.

| File | Role |
|---|---|
| `pitch.ts` | YIN pitch detection (de Cheveigné and Kawahara, 2002): 32 ms window, 10 ms hop, 70–1000 Hz |
| `segmentation.ts` | Energy gate relative to the recording, median smoothing, notes split on silences and pitch jumps > 0.75 semitones |
| `matcher.ts` | Key-independent matching on intervals between distinct notes; semi-global alignment that tolerates skipped or extra notes; verdict `match` / `uncertain` / `none` / `too-short` |
| `catalog.ts` | 28 public-domain melodies in compact notation (`E4 F#4:0.5 ...`), transcribed by hand: verify against public-domain scores before adding more |
| `recognizer.ts` | Pure function that runs the whole pipeline (used by the worker and the tests) |
| `recognition.worker.ts`, `recognition.service.ts` | Runs the pipeline in a lazily created Web Worker so the UI never blocks |
| `testing/synthesize.ts` | Deterministic hum synthesizer for tests (harmonics, vibrato, noise) |

The verdict thresholds in `matcher.ts` were calibrated on synthetic hums (±0.5 semitone errors, skipped notes) and on non-catalog melodies. `matcher.spec.ts` locks the expected behaviour: change thresholds only together with that spec.

## Decisions (with reasons)

| Decision | Reason / source |
|---|---|
| On-device humming recognition against a public-domain melody catalog | No free permanent recognition API was found. AudD offers a 300-request trial for 14 days, then paid plans ([audd.io/pricing](https://audd.io/pricing/)). On-device processing also avoids sending voice data. |
| No external LLM in the prototype | Gemini API terms could not be read from the author's corporate network (Gen AI category blocked), so free-tier data handling under GDPR is not verified. No API key is available. The chat uses a local rule-based assistant behind an interface that an LLM can implement later. |
| No authentication | No accounts, no stored personal data, no paid API to protect. |
| Static hosting on Vercel (Hobby) | Free plan ([vercel.com/docs/plans/hobby](https://vercel.com/docs/plans/hobby)), custom security headers, CLI already linked to the author's account. Before any commercial use, check the [Vercel Terms](https://vercel.com/legal/terms) on Hobby usage (not verified in this session). |
| Apache 2.0 license | Explicit permissions plus a patent grant. |

## Status

| Activity | Branch | State |
|---|---|---|
| Repo setup: Angular scaffold, static output, CI, license, docs | `chore/setup-repo` | Done |
| Recognition engine: pitch detection, note segmentation, matcher, catalog, worker | `feat/recognition-engine` | Done |
| Chat UI: recorder, results, melody preview, privacy page, accessibility | `feat/chat-ui` | Next |
| SEO, security headers, E2E with fake microphone, Vercel deploy | `feat/seo-deploy` | Planned |
| Link the live demo from the author's website | site repo | Planned |

## Ideas for later (not started)

- Larger catalog (verify each melody against public-domain scores).
- Optional external recognition provider for real recordings (paid or trial; needs server-side key and consent flow).
- Optional LLM assistant after verifying provider terms and GDPR data handling.
- English UI and i18n.
- MCP server exposing the recognition engine (see [docs/proposal/ARCHITECTURE.md](./docs/proposal/ARCHITECTURE.md)).

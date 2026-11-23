# Universal AI Music Recognition

**Status:** Prototype in development. Public repository. Outreach messages have not been sent.

**Originator:** Federico Croletti · **License:** [Apache 2.0](./LICENSE)

**Repository:** [github.com/federicocroletti-tech/universal-ai-music-recognition](https://github.com/federicocroletti-tech/universal-ai-music-recognition)

**Local folder:** `C:\Federico\Progetti\universal-ai-music-recognition`

## Hum Finder (prototype web app)

A chat-style web app: press the microphone, hum a melody, and the app tries to identify it. Recognition runs entirely in the browser and the audio never leaves the device. It matches against a small catalog of public-domain melodies, so it only recognizes songs in that catalog.

Quick start (Node.js 22):

```bash
npm ci        # install dependencies
npm start     # dev server on http://localhost:4200
npm test      # unit tests (Vitest)
npm run build # static prerendered build in dist/hum-finder/browser
npm run e2e   # end-to-end tests with a simulated microphone (after build)
```

MCP server (local stdio):

```bash
npm run mcp
# Tools: recognize_hum (PCM16 base64 + sample rate), list_catalog
```

The MCP server is provider-neutral and offline. It accepts mono 16-bit little-endian PCM audio and matches it locally against the bundled public-domain catalog. No audio is uploaded.

To continue development (human or AI agent), read [AGENTS.md](./AGENTS.md) first: workflow, architecture, decisions, current status, and next steps.

## Purpose

This project holds the proposal for a universal, cross-platform music recognition capability that AI assistants can call from any device, operating system, or AI product, and the first working prototype.

## Documents

| File | Content |
|---|---|
| [AGENTS.md](./AGENTS.md) | How to continue the work: workflow, architecture, decisions, status, next steps |
| [docs/proposal/COMPETITIVE-ANALYSIS.md](./docs/proposal/COMPETITIVE-ANALYSIS.md) | Existing products, MCP servers, and recognition providers, with what is missing |
| [docs/proposal/ARCHITECTURE.md](./docs/proposal/ARCHITECTURE.md) | Target cross-platform architecture, provider abstraction, MCP and native AI integration |
| [docs/proposal/INTELLECTUAL-PROPERTY.md](./docs/proposal/INTELLECTUAL-PROPERTY.md) | Attribution, IP, confidentiality, and repository visibility |
| [docs/proposal/OUTREACH-DRAFTS.md](./docs/proposal/OUTREACH-DRAFTS.md) | Draft messages only. Not sent. Each needs explicit approval |

The business proposal is kept private: it lives only in the local `private/` folder, which is excluded from git. Earlier commits still contain a first draft of it.

## Key findings that shape the proposal

1. **ChatGPT already has a Shazam app** (announced March 2026, reported by Music Business Worldwide). A "native ChatGPT integration" is therefore no longer a new idea. The opportunity is a shared, cross-platform layer that works across assistants and devices, not a single-vendor feature.
2. **Google Gemini already supports hum-to-search** (June 2025), so humming recognition is no longer a differentiator on its own.
3. **Music recognition MCP servers already exist** (for example Song Finder MCP and an Apify-hosted Shazam MCP server). The gap is an official, provider-neutral, licensed, and standardized service.
4. **ShazamKit is Apple-platform-first.** It has an Android SDK, but no general-purpose REST API for Windows or Linux. A universal product therefore needs a server-side layer with multiple recognition providers.
5. **The EU AI Act transparency obligations (Art. 50) apply from 2 August 2026**, which affects any always-listening or microphone-based assistant feature offered in the EU.

## Decided direction

**Independent open-source prototype first** (decided 2026-11-19, delegated by Federico Croletti). A provider-neutral MCP server with a pluggable recognition backend, published publicly under the author's name. Vendor outreach follows only through official developer or partner programs. Cold idea pitches are not used: see [OUTREACH-DRAFTS.md](./docs/proposal/OUTREACH-DRAFTS.md). Rationale: ChatGPT already has a Shazam app, Apple and similar vendors do not accept unsolicited ideas, and a public working prototype with clear attribution is the strongest basis for any later B2B discussion.

## Next steps

See the status and roadmap in [AGENTS.md](./AGENTS.md).

- Outreach: no message is sent. Any future send needs the verified official channel and the author's approval of the final text.
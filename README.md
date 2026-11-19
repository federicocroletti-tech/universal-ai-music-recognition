# Universal AI Music Recognition

**Status:** Draft for review by Federico Croletti. Public repository. Outreach messages have not been sent.

**Originator:** Federico Croletti

**Repository:** [github.com/federicocroletti-tech/universal-ai-music-recognition](https://github.com/federicocroletti-tech/universal-ai-music-recognition) (public)

**Local folder:** `C:\Federico\Progetti\universal-ai-music-recognition`

## Purpose

This project holds the working draft of the proposal for a universal, cross-platform music recognition capability that AI assistants can call from any device, operating system, or AI product. Development prompts will be added later.

## Documents

| File | Content |
|---|---|
| [COMPETITIVE-ANALYSIS.md](./COMPETITIVE-ANALYSIS.md) | Existing products, MCP servers, and recognition providers, with what is missing |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Cross-platform architecture, audio acquisition, provider abstraction, MCP and native AI integration |
| [BUSINESS-PROPOSAL.md](./BUSINESS-PROPOSAL.md) | Market, business models, collaboration options, roadmap |
| [INTELLECTUAL-PROPERTY.md](./INTELLECTUAL-PROPERTY.md) | Attribution, IP, confidentiality, and repository visibility |
| [OUTREACH-DRAFTS.md](./OUTREACH-DRAFTS.md) | Draft messages only. Not sent. Each needs explicit approval |

## Key findings that shape the proposal

1. **ChatGPT already has a Shazam app** (announced March 2026, reported by Music Business Worldwide). A "native ChatGPT integration" is therefore no longer a new idea. The opportunity is a shared, cross-platform layer that works across assistants and devices, not a single-vendor feature.
2. **Google Gemini already supports hum-to-search** (June 2025), so humming recognition is no longer a differentiator on its own.
3. **Music recognition MCP servers already exist** (for example Song Finder MCP and an Apify-hosted Shazam MCP server). The gap is an official, provider-neutral, licensed, and standardized service.
4. **ShazamKit is Apple-platform-first.** It has an Android SDK, but no general-purpose REST API for Windows or Linux. A universal product therefore needs a server-side layer with multiple recognition providers.
5. **The EU AI Act transparency obligations (Art. 50) apply from 2 August 2026**, which affects any always-listening or microphone-based assistant feature offered in the EU.

## Decided direction

**Independent open-source prototype first** (decided 2026-11-19, delegated by Federico Croletti). A provider-neutral MCP server with a pluggable recognition backend, published publicly under the author's name. Vendor outreach follows only through official developer or partner programs. Cold idea pitches are not used: see [OUTREACH-DRAFTS.md](./OUTREACH-DRAFTS.md). Rationale: ChatGPT already has a Shazam app, Apple and similar vendors do not accept unsolicited ideas, and a public working prototype with clear attribution is the strongest basis for any later B2B discussion.

## Next steps

- Development prompts: to be launched later.
- Outreach: no message is sent. Any future send needs the verified official channel and the author's approval of the final text.
# Universal AI Music Recognition

**Status:** Draft for review by Federico Croletti. Private repository. Nothing has been published, sent, or shared externally.

**Originator:** Federico Croletti

**Repository:** [github.com/federicocroletti-tech/universal-ai-music-recognition](https://github.com/federicocroletti-tech/universal-ai-music-recognition) (private)

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

## Next steps (requires your decision)

- Review the drafts and confirm the direction (B2B platform/licensing vs. independent prototype).
- Confirm the repository stays private (created as private by default).
- Development prompts: to be launched later.
- Approve or reject each outreach draft individually. No message will be sent without explicit approval.

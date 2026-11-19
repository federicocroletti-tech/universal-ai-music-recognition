# Business Proposal

**Originator:** Federico Croletti
**Status:** Draft. Confidential. Not for external distribution.

## 1. Executive summary

Music recognition is already available inside some AI products, but each one is a separate, closed integration. This proposal describes a provider-neutral, standards-based recognition layer (MCP and function calling) backed by licensed recognition providers and a single consent-aware API. The aim is a reference implementation and a set of partnership options with rights holders, recognition providers, and AI platforms.

## 2. Problem statement

- Users must switch apps or rely on one assistant's features to identify music.
- Developers have no single, licensed, cross-platform API that AI assistants can call.
- Recognition output is inconsistent, and artwork and link licensing are unclear.
- Audio capture rules differ by device and OS, and privacy obligations are growing in the EU.

## 3. Market context

- ChatGPT (Shazam app, March 2026), Gemini (hum-to-search, 2025), and open MCP servers show that demand exists.
- Recognition APIs are sold per request or as subscriptions (AudD from $5/month; ACRCloud on request), which means a low barrier to entry for a prototype.
- The gap is standardization and multi-provider reliability, not the concept itself.

Market sizing has not been done. Any figure must come from a sourced study before it is used externally.

## 4. Business models (feasibility)

| Model | Feasibility | Notes |
|---|---|---|
| Official partnership with Apple / Shazam | Low to medium | Shazam already partners with OpenAI; a partnership would need to add value beyond that |
| Partnership with OpenAI, Anthropic, Microsoft, Google | Medium | Most plausible route is a developer-program or MCP ecosystem listing, not a paid deal |
| Paid technical consultancy | High | Immediate and realistic; based on the architecture and reference design |
| Compensated product innovation collaboration | Medium | Requires a written agreement covering attribution and compensation |
| Licensing of independently developed software | Medium | Only for original code and documentation; not for third-party catalog data |
| Paid prototype development | High | Fits a fixed-scope pilot with one provider and one platform |
| Revenue sharing | Low | Only realistic inside a signed commercial agreement; not automatic |
| Developer programs and innovation initiatives | Medium | Check each company's current program terms |

No model above assumes that submitting an idea creates ownership or royalties.

## 5. Recommended path (phased)

1. **Phase 0 (now):** private research and documentation. No external contact.
2. **Phase 1:** independent prototype using one provider (for example AudD or ACRCloud) and the REST and MCP layers, on Windows and Linux. Open-source or private, depending on your decision.
3. **Phase 2:** add ShazamKit on iOS or macOS within the Apple developer terms; add a browser client.
4. **Phase 3:** submit to the MCP ecosystem and to one AI platform through its official developer channel, after your approval.
5. **Phase 4:** paid pilot or consultancy, subject to a written agreement.

## 6. Roadmap

| Quarter | Milestone |
|---|---|
| Q1 | Finalize documents; legal review of IP and provider terms |
| Q2 | Prototype: REST API, one provider, Windows and Linux capture, MCP server with three tools |
| Q3 | Add ShazamKit (Apple), browser client, provider fallback, consent UI |
| Q4 | Pilot with a partner, measured accuracy and latency report |

Timelines are estimates and depend on resources and on provider terms.

## 7. Risks

- **Licensing:** catalog and artwork rights may block commercial use without agreements.
- **Competition:** platforms may build the feature natively and faster.
- **Privacy and regulation:** microphone use and EU AI Act obligations add compliance work.
- **Accuracy:** humming and noisy audio have low accuracy; results must show confidence.
- **Dependence:** a single provider outage or policy change affects the service.

## 8. Success measures

- Match rate and median latency per provider, per input type.
- Number of clients connecting through MCP or function calling.
- Signed partnership or paid engagement, if any.

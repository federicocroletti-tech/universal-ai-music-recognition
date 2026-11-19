# Competitive Analysis

Research snapshot as of 19 November 2026. Vendor details, pricing, and product status change often and must be re-checked before any external use.

## 1. Existing offerings

| Offering | What it does | Platforms | Licensing / cost | Gap for this proposal |
|---|---|---|---|---|
| **Shazam in ChatGPT** (OpenAI app, Mar 2026) | Identifies songs in chat with "Shazam, what's playing?" and shows artwork and previews | ChatGPT (web and apps) | Partner integration, not open | Single assistant; not available to other AI products or to developers |
| **Gemini hum-to-search** (Google, Jun 2025) | Identifies songs from humming, whistling, singing, or recorded audio | Android, iOS (English), Gemini app | Native to Google | Single vendor; no developer API for third parties |
| **ShazamKit** (Apple) | On-device signatures matched against the Shazam catalog; Library API; custom catalogs | iOS, iPadOS, macOS, tvOS, visionOS, watchOS; Android SDK | Apple Developer account; no per-request charge per vendor article; service terms apply | No Windows or Linux SDK; no REST API for server use; requires Apple developer tokens |
| **AudD** | Recognition API with file upload, URL, and stream monitoring | Any (REST) | Free trial of 300 requests; Indie $5/mo (1,000 requests), Startup $450/mo (100,000), Pro $850/mo (200,000); streams $45/stream/mo; custom pricing at volume | Strong REST option; no humming focus stated; not an AI-assistant-native product |
| **ACRCloud** | Catalog recognition, humming recognition, offline recognition on device; SDKs and REST | Mobile SDKs, REST | 14-day trial; pricing on request | Good humming coverage; sales-led pricing; no MCP product |
| **AcoustID / MusicBrainz** | Open-source fingerprinting (Chromaprint) and open metadata | Any | Open data; service terms apply; no commercial catalog of major labels in the same way | Open and free, but not a commercial-grade consumer catalog; useful as a fallback or for open content |
| **Music_MCP** (open-source GitHub project) | MCP server that identifies songs from audio files using ACRCloud and saves to Spotify | MCP clients | Depends on ACRCloud account | Single provider; personal-scale project |
| **Song Finder MCP** (songfinder-dev) | MCP server that identifies songs from URLs or local files; adds BPM, key, and similar tracks | Claude, Cursor, Windsurf, Zed | No API key listed; backed by a free online service | Strong for DJ and analysis use cases; relies on a third-party web service; no official provider contract |
| **Shazam Song Recognition API MCP** (Apify actor) | MCP access to a third-party Shazam-style recognition API for direct audio file URLs | MCP clients via Apify | Apify platform pricing | Third-party, not official; URL-based input |

## 2. What works across platforms today

- **Server-side REST recognition** (AudD, ACRCloud) works on every OS because the client only sends audio.
- **MCP servers** work in Claude, Cursor, Windsurf, Zed, and other MCP clients, but each one is a separate install with its own provider.
- **Native assistant features** (ChatGPT Shazam app, Gemini) work well, but only inside their own product.

## 3. What is missing

1. **One standard contract** for recognition output (title, artist, album, release, artwork license status, streaming links, confidence, provider) that any assistant can consume.
2. **Multi-provider fallback** (for example ShazamKit or catalog API first, then ACRCloud for humming, then AcoustID for open content) behind one API.
3. **Desktop audio capture** for Windows and Linux, with explicit user consent, in one reference design.
4. **Licensing-aware metadata**, so artwork and links are returned only where the provider contract allows.
5. **Privacy-first defaults**: fingerprint-only upload where possible, no audio retention, and clear consent for microphone use.

## 4. What requires commercial licensing

- Shazam catalog access through ShazamKit (Apple developer program and service terms).
- Commercial recognition APIs (AudD, ACRCloud) above their free tiers.
- Cover artwork and streaming metadata: licensing depends on each provider and each rights holder. Artwork must not be redistributed without a license.
- Redistribution of catalog results inside a product generally requires a commercial agreement with the provider.

## 5. What could differentiate this proposal

- Being the **provider-neutral, standards-based layer** (MCP and function calling) that assistants and devices can adopt without choosing one vendor.
- A **single reference implementation** covering Windows, Linux, macOS, Android, iOS, and web.
- **Licensing-compliant metadata handling** and privacy-by-design audio capture, which matter for European deployment under the GDPR and the EU AI Act.

## 6. What this proposal must not claim

- That music recognition through AI or MCP is new. Shazam in ChatGPT, Gemini hum-to-search, and several MCP servers already exist.
- That the concept is exclusive. Only the specific architecture and any original code, documentation, or design choices can be attributed to the originator.

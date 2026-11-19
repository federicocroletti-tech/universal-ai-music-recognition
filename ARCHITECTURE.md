# Cross-Platform Architecture

## 1. Layers

```
+-----------------------------------------------------------+
| AI integration layer                                      |
|  MCP server | Function-calling schema | Native app adapters |
+----------------------------+------------------------------+
                             |
+----------------------------v------------------------------+
| Universal Recognition API (REST, versioned)               |
|  auth | rate limits | consent records | result contract    |
+----------------------------+------------------------------+
                             |
+----------------------------v------------------------------+
| Provider abstraction                                      |
|  ShazamKit catalog | ACRCloud | AudD | AcoustID (fallback)  |
+-----------------------------------------------------------+

Audio acquisition layer (client side, per platform):
  microphone | uploaded file | video file | browser tab audio |
  system audio (explicit opt-in) | live stream URL
```

Separation of concerns:
- **Acquisition** decides what audio is captured and with what consent. It never decides the provider.
- **API** handles authentication, quotas, and the result contract.
- **Providers** are interchangeable adapters behind one interface.
- **AI integration** maps the API to MCP tools, function schemas, or native assistant apps.

## 2. Audio acquisition by environment

| Environment | Microphone | File upload | Browser / system audio | Notes |
|---|---|---|---|---|
| iPhone / iPad | Yes, with permission | Yes | Limited; app sandbox | ShazamKit runs on device; no raw audio needed by Apple |
| Android phone / tablet | Yes, runtime permission | Yes | Restricted; playback capture needs user consent and API level support | ShazamKit Android SDK available |
| Windows 10 / 11 | Yes, privacy setting | Yes | WASAPI loopback possible; requires explicit user action | Needs desktop app or helper |
| macOS | Yes, TCC permission | Yes | System audio needs extra permission or virtual device | ShazamKit available natively |
| Linux (Ubuntu, Debian) | Yes, via PipeWire or PulseAudio | Yes | Monitor sources possible; varies by distro | No ShazamKit; use server providers |
| Browsers (Chrome, Edge, Firefox, Safari) | Yes, per-site permission | Yes | Tab audio via capture APIs with user selection | Permission prompts vary by browser |
| Smart TVs, consoles, speakers, cars, watches | Varies; often no third-party mic access | Usually no | Usually no | Treat as integration targets via vendor SDKs, not generic capture |

Principle: do not assume any device can read its microphone or internal audio in the same way. Each environment needs its own permission model, and system audio capture is opt-in only.

## 3. Recognition providers

| Provider | Strength | Where it fits |
|---|---|---|
| ShazamKit (Apple) | Large catalog, on-device signatures, privacy-preserving | Apple clients; server access requires a commercial arrangement |
| ACRCloud | Humming recognition, offline option | Humming and offline cases |
| AudD | Simple REST, file, URL, and stream monitoring | Server-side and batch recognition |
| AcoustID / MusicBrainz | Open fingerprints and metadata | Fallback for open or user-made content |

The abstraction must expose: `recognize(audio_or_fingerprint, mode) -> Result`, with mode values `file`, `stream`, `humming`, and `fingerprint`. Each adapter reports which modes it supports.

## 4. Universal Recognition API (REST, illustrative)

- `POST /v1/recognitions` with a file, a URL, or a fingerprint. Returns `202` plus a job ID for long audio.
- `GET /v1/recognitions/{id}` returns the result.
- `POST /v1/recognitions/stream` for live audio via WebSocket.
- Auth: OAuth 2.1 for user-scoped actions (save to library); API keys for server-to-server with rate limits.
- Consent: each request carries a consent reference. Audio retention defaults to none.

Result contract (consistent across providers):

```json
{
  "status": "matched",
  "confidence": 0.93,
  "provider": "shazamkit",
  "track": {
    "title": "...",
    "artists": ["..."],
    "album": "...",
    "releaseDate": "YYYY-MM-DD",
    "isrc": "...",
    "artwork": { "url": "...", "licensed": false },
    "links": { "spotify": "...", "appleMusic": "...", "youtubeMusic": "..." }
  },
  "offsetSeconds": 42.5
}
```

Links and artwork appear only where the provider contract permits.

## 5. MCP integration

- **Transport:** Streamable HTTP, as defined in the MCP specification revision 2026-07-28. This is a single POST endpoint that returns JSON or an SSE stream. The stdio transport is for local helpers only.
- **Auth:** OAuth 2.1 with protected resource metadata for remote servers. Tokens must not be passed through query strings.
- **Tools (proposed):** `identify_song`, `identify_song_from_audio`, `identify_hummed_melody`, `get_track_metadata`, `get_track_links`, `save_track_to_library`. Microphone and system-audio tools are client-side only; the server never opens a microphone.
- **Large audio:** uploads go to a signed URL or a resource reference, not inline base64 in tool arguments.
- **Permissions:** `save_track_to_library` requires an explicit user approval step in the client.
- **Rate limits and quotas:** enforced per user and per provider, with clear error codes.

## 6. Native AI integration

- **Function calling:** a JSON schema that matches the MCP tools, so the same implementation works in OpenAI, Anthropic, Google, and Microsoft tool-calling formats.
- **Native app adapters:** provider-specific apps or extensions, such as the existing ChatGPT app model. The adapter calls the same universal API.
- **Multimodal input:** where a model accepts audio directly, the model's audio input is sent to the same recognition API. The recognition step remains separate from the model.

## 7. Security, privacy, and compliance

- Fingerprint-only upload where a provider supports it, so raw audio is not sent.
- No audio retention by default. Retention, if any, is disclosed and opt-in.
- Microphone and system audio require explicit, per-session consent in the UI.
- EU AI Act Art. 50 transparency: users must be informed when they interact with an AI system, and synthetic content must be marked where applicable.
- GDPR: lawful basis, data minimization, and deletion on request. Consent records are kept with request logs.
- Logs exclude audio content and raw fingerprints.

## 8. Scalability

- Stateless API workers behind a load balancer; a job queue for long files.
- Provider adapters with circuit breakers and per-provider quotas.
- Caching of results by fingerprint hash, subject to provider terms.

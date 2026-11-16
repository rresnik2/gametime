# 001. Streaming provider

- **Status:** Open (due end of Phase 1 week 1)
- **Date:** Nov 15, 2026
- **Decided by:** not yet

## Context
Streamers push video from OBS over RTMP; viewers watch HLS in the app on iOS, Android and web.
The product plan leaves the provider as an open question: which one fits the budget (free tier
vs. student credits).

## Options
Spike **Mux Live** first, **Amazon IVS** as the fallback (if AWS student credits make it
cheaper). LiveKit stays in reserve if sub-second latency becomes a requirement.

Test each against the same checklist:
- Cost for ~10 weeks of testing plus a demo day, within a free tier or credits
- RTMP ingest from OBS with a persistent per-user stream key
- HLS playback in `expo-video` on iOS/Android, and on web (Chrome needs `hls.js` or equivalent)
- Webhooks for stream start/end
- Time to first frame and glass-to-glass latency (record the numbers here)
- Caps on resolution and duration

## Decision
Not made yet.

## Consequences
The schema is already provider-agnostic: `stream_keys.provider` names the provider, and
`streams.playback_url` holds a full HLS URL so the client doesn't depend on provider-specific IDs.

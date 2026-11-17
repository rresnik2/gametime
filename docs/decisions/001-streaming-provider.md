# 001. Streaming provider

- **Status:** Open (due end of Phase 1 week 1). Playback spike done Nov 17, 2026 (below); the
  provider test needs an account.
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
- HLS playback in `expo-video` on iOS/Android, and on web
- Webhooks for stream start/end
- Time to first frame and glass-to-glass latency (record the numbers here)
- Caps on resolution and duration

## Spike results so far (Nov 17, 2026)
Playback was tested with public HLS test streams in the `/spike` screen (`src/app/spike.tsx`), so
it says nothing yet about either provider's ingest, webhooks or latency.

- **Web, desktop Chrome 156:** Chrome now plays HLS natively. `expo-video` plays a live HLS
  stream with no extra library; first frame in about 0.7–1.4 s (5 runs, browser pane hidden, so
  approximate). One catch: `player.play()` in `useVideoPlayer`'s setup callback is ignored on web
  before the source loads, so the player must call `play()` again on `statusChange` →
  `readyToPlay` (done in `src/components/spike/expo-video-probe.tsx`). Autoplay needs `muted`.
- **Web without native HLS (Firefox, older Chrome):** a plain `<video>` with `hls.js` 1.7 (Media
  Source Extensions) plays the same live stream; first frame about 1.6 s. Plan: `expo-video` where
  `canPlayType('application/vnd.apple.mpegurl')` is non-empty, `hls.js` otherwise. Not yet tried
  in a real Firefox or Safari.
- **iOS Simulator (iPhone 18 Pro, local dev build):** `expo-video` plays the live HLS stream and
  reports `isLive: true`. First frame 3.6 s on the cold first load, then 1.1–1.3 s (3 runs). No
  errors. Adding `expo-video` needs a new development build (done locally with
  `npx expo run:ios`; the EAS profiles need a rebuild too before teammates can use it).
- **Android:** not tested.

## Cost estimate for the quarter (list prices checked Nov 17, 2026)
Assumptions: ~125 broadcast hours (4 streamers × 3 h a week × 10 weeks, plus a 5-hour demo day) and
~750 viewer-hours (about 5 viewers per testing hour, 50 viewers on demo day).

| | Mux (pay as you go) | Amazon IVS, Basic channel |
|---|---|---|
| Input | $0.03125/min (live is 1080p "Plus" only) → ~$234 | $0.20/h → $25 |
| Delivery | $0.001/min after 100,000 free min/month → $0 | SD $0.036/h, HD $0.072/h → $27–54 |
| Free allowance | $20 credit a month → −$60 | 12 months: 5 h input + 100 h SD output a month; new AWS accounts may get up to $200 in credits |
| **Quarter total** | **~$175** | **~$40 at 480p, ~$75 at 720p, after the free tier; likely $0 with AWS credits** |

- **Mux:** simplest setup (OBS RTMP URL + stream key, direct webhooks for `active`/`idle`, HLS
  playback URL), 1080p max for live. Plan on pay as you go: the pricing page doesn't list live on the free plan.
- **IVS Basic:** much cheaper, but no transcoding (viewers get the streamer's single rendition;
  Basic input caps at 1.5 Mbps for 480p or 3.5 Mbps for 720p/1080p). Stream start/end arrive as
  EventBridge events, so a small rule must forward them to our webhook Edge Function.

## Decision
Not made yet. On cost, IVS Basic fits the class budget and Mux doesn't without paying ~$175. Next:
an account for one provider (IVS first, on cost), then OBS → ingest → `/spike` playback and the
start/end events end to end.

## Consequences
The schema is already provider-agnostic: `stream_keys.provider` names the provider, and
`streams.playback_url` holds a full HLS URL so the client doesn't depend on provider-specific IDs.

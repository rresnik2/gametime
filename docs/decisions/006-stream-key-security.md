# 006. Stream keys in an owner-only table

- **Status:** Decided
- **Date:** Nov 15, 2026
- **Decided by:** Phase 1 plan; implemented in schema v1

## Context
A stream key lets anyone broadcast as that streamer. The `streams` table is public.

## Decision
Keep keys in `stream_keys`: readable only by their owner, writable only by the service role
(an Edge Function that creates the provider ingest). Clients can't change a stream's status,
playback info or viewer count; only the video webhook (service role) can.

## Consequences
The Go Live flow reads the key from `stream_keys` (Phase 3). Rotating a key is a service-role
operation.

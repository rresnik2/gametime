# 003. Viewer counts from Realtime Presence

- **Status:** Decided
- **Date:** Nov 15, 2026
- **Decided by:** Phase 1 plan; implemented in schema v1

## Context
The feed shows viewer counts and the MVP ranking boosts streams with fewer than 10 viewers.
Mux and IVS don't push live viewer counts to our database in real time.

## Decision
Count viewers with **Supabase Realtime Presence** on each stream's channel (the same channel
used for chat), and write a periodic snapshot to `streams.viewer_count`.

## Why
The chat channel already exists, so this adds no new service. Provider analytics are delayed
and provider-specific.

## Consequences
`streams.viewer_count` is service-role only (clients can't write it). The snapshot job is
Phase 2–3 work.

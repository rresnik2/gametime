# GameTime — Phases 2–4 backlog

Drafted Nov 16, 2026, from the product plan's MVP column, [PHASE_1_PLAN.md](../PHASE_1_PLAN.md)
(§4 workstreams, §8 handoff), the [decision records](decisions/) and schema v1
(`supabase/migrations/`). Scope is frozen at the MVP column; v2 ideas go in
[Stretch (v2)](#stretch-v2) at the end and are not scheduled.

**Status:** filed as GitHub issues #9–#90 and #93–#94 on Nov 16, 2026, and #102–#107 on
Nov 17, 2026 (milestones Phase 2–4).
Owners were assigned on Nov 22, 2026 ([decision 015](decisions/015-team-and-ownership.md)): Reece
owns 59 tickets and Sudip 31. Each issue's assignee and **Owner** field match this file; reassign
on the issue first. The v2 items are not filed. Twelve issues were updated on Nov 16 to match
this file: #12, #17, #24, #25, #30, #32, #39, #40 and #43 for [decision 011](decisions/011-stream-orientation.md), and #28, #31 and #65
for [decision 012](decisions/012-game-session-length.md).

**Nov 17, 2026:** six tickets added for the game's networking ([decision 010](decisions/010-game-multiplayer-and-viewers.md)):
P2-DATA-08 (#102), P2-GAME-06 (#103), P2-GAME-07 (#104), P2-GAME-08 (#105), P3-APP-15 (#106) and
P3-DATA-07 (#107), filed Nov 17. Three filed tickets gained a criterion, and their issues were
updated to match: #35 (P2-DES-04), #36 (P2-OPS-01) and #67 (P3-GAME-05). V2-12 "Viewer interaction in the game" is removed: decision 010 made it MVP.

**Nov 17, 2026:** the game is picked ([decision 009](decisions/009-game-concept.md)), so the 20
tickets that were ⛔ GAME are unblocked, and the `blocked:game-concept` label was removed from
their issues (#27–#31, #36, #58, #63–#67, #80, #81, #102–#107) the same day, and their "Blocked
on" field now reads "—". #63 (P3-GAME-01) was also updated to "the game's own theme and
palette".

## How to read a ticket

```
#### P2-APP-03 · Short title          ← ID: phase · workstream · number
- Size · Owner · Depends on · Blocked on · Tags
One to three lines of description.
- [ ] Acceptance criteria
```

- **Workstreams:** `APP` app (Expo screens and components), `DATA` backend/data (Supabase schema,
  RPCs, Edge Functions other than video), `VID` video (provider, playback, webhooks), `GAME` the
  original browser game, `DES` design and product, `OPS` DevOps and QA.
- **Size:** S = up to a day, M = two to three days, L = about a person-week. If a ticket turns out
  bigger than L, split it.
- **Depends on:** tickets (or Phase 1 deliverables) that must land first. Work can often start
  against seed data before a dependency lands.
- **Blocked on:** an open decision. Don't start the blocked part until it's made:

  | Blocker | What's open | Where |
  |---|---|---|
  | **⛔ D1** | Streaming provider (Mux or IVS) | [001](decisions/001-streaming-provider.md) |
  | **⛔ D4** | Anonymous viewing: Supabase anonymous sign-in or local storage | [004](decisions/004-anonymous-viewing.md) |
  | ~~⛔ GAME~~ | **Decided Nov 17, 2026:** Ringward, re-themed as fish in a barrel. No ticket is blocked on it any more | [009](decisions/009-game-concept.md) |

- **Tags:** `safety` (report, block, chat filters, age gate, terms), `cold-start` (empty-feed
  mitigation), `accessibility`, `demo`.
- **Every ticket also needs:** lint, typecheck and tests passing; RLS tests for any new table or
  policy; `db:types` regenerated if `supabase/` changed; touch targets ≥ 44 px and screen-reader
  labels on new controls; and the handover notes updated (see `AGENTS.md`).

**The GitHub issues are the source of truth** for owner and progress. Edit this file only to
add, cut or re-scope tickets: new IDs are filed by `scripts/create-backlog-issues.sh --apply`;
changes to existing tickets must be mirrored on the issue by hand.

## Summary

| Phase | Weeks | APP | DATA | VID | GAME | DES | OPS | Total |
|---|---|---|---|---|---|---|---|---|
| 2. Watch the feed | 3–5 | 10 | 8 | 3 | 8 | 4 | 3 | **36** |
| 3. Go live and chat | 6–8 | 15 | 7 | 4 | 5 | 2 | 4 | **37** |
| 4. Polish and demo | 9–10 | 3 | 2 | 1 | 2 | 3 | 6 | **17** |
| **Total** | | 28 | 17 | 8 | 15 | 9 | 13 | **90** |

Plus 14 [Stretch (v2)](#stretch-v2) items, unscheduled. `scripts/create-backlog-issues.sh`
(dry run by default) prints these counts from the tickets below; rerun it after editing.

Blocked tickets: ⛔ D1 × 7, ⛔ D4 × 3.

---

## Phase 2 — Watch the feed (weeks 3–5)

**Goal:** a viewer opens the app, picks games, lands in a live (seeded) stream, swipes between
streams on iOS, Android and web, and can sign up and see profiles.

**Critical path:** P2-VID-01 → P2-VID-02 → P2-APP-04. The feed runs on seed streams the whole
phase; real OBS streams arrive in Phase 3.

**Cut first if behind:** P2-APP-09 web keyboard shortcuts, P2-GAME-05 second playtest round,
P2-GAME-08 online duo (local keyboard duo stays).

### App

#### P2-APP-01 · Sign up, log in and log out
- **Size:** M · **Owner:** Reece · **Depends on:** P2-DES-01 · **Blocked on:** — · **Tags:** safety

Email and password auth with Supabase Auth. Sign-up collects username and birth date and passes
them as sign-up metadata (the `handle_new_user` trigger creates the profile).

- [ ] Sign up with email, password, username (3–20 chars, `a-z 0-9 _`, availability checked) and birth date
- [ ] Log in, log out, and the session survives an app restart (AsyncStorage on native, local storage on web)
- [ ] Sign-up requires accepting the terms and community guidelines (P2-DES-03), linked from the form
- [ ] Clear errors for taken username, weak password, wrong password and network failure
- [ ] Works on iOS, Android and web

#### P2-APP-02 · Age gate UI
- **Size:** S · **Owner:** Reece · **Depends on:** P2-APP-01 · **Blocked on:** — · **Tags:** safety

The database enforces 13+ to sign up and 16+ to stream (decision 005); the app must explain it
instead of showing a raw error.

- [ ] Birth date picker on sign-up; under-13 gets a friendly "GameTime is for ages 13 and up" screen and no account
- [ ] Accounts with no birth date are asked for one before they can open Go Live
- [ ] 13–15-year-olds see "You can stream from age 16" on the Go Live tab instead of the setup form
- [ ] Birth date is never shown on any public screen

#### P2-APP-03 · Onboarding: pick your games, land in a stream
- **Size:** M · **Owner:** Reece · **Depends on:** P2-DES-01, P2-DATA-01 · **Blocked on:** ⛔ D4

Flow 1: splash → pick 3+ favorite games → land directly in a live stream. Where favorites live
before sign-up depends on D4.

- [ ] First open shows splash, then a game picker (tiles with game color and cover art); Continue enables at 3+ picks
- [ ] After Continue, the feed opens on a playing stream with no sign-up step
- [ ] Favorites are saved per D4 and carried into `favorite_games` when the user signs up
- [ ] Onboarding doesn't show again after it's completed; a "Skip" path still lands in the feed

#### P2-APP-04 · Live feed: vertical snap-scroll of stream cards
- **Size:** L · **Owner:** Reece · **Depends on:** P2-VID-01, P2-DATA-02 · **Blocked on:** —

The Live tab: a full-screen, vertically paging list of live streams. Start on the existing
`get_live_feed` RPC and switch to the ranked feed when P2-DATA-02 lands.

- [ ] Each card shows the stream full-bleed with a bottom gradient scrim, streamer avatar + name, game chip and a LIVE pill with viewer count
- [ ] The feed stays portrait while swiping ([decision 011](decisions/011-stream-orientation.md)): portrait streams fill the screen; landscape streams play fitted to width over a blurred fill, with a "Full screen" button that joins them (P2-APP-10). Nothing is cropped
- [ ] Swipe up/down snaps to the next/previous stream in under 300 ms; haptic tick on native
- [ ] Skeleton card while loading; pull to refresh; next page loads before the user reaches the end
- [ ] Streams that end while in the list are removed or marked (see P2-VID-03)
- [ ] Respects reduced motion (no auto-animations beyond the snap)

#### P2-APP-05 · Following / For You toggle
- **Size:** S · **Owner:** Reece · **Depends on:** P2-APP-04, P2-DATA-02 · **Blocked on:** —

Header toggle on the Live tab switching the feed mode.

- [ ] Toggle switches between For You (ranked) and Following (only followed streamers)
- [ ] Following with nobody live shows the empty state from P2-APP-08, not a blank screen
- [ ] Signed-out users see the toggle; Following prompts them to sign in

#### P2-APP-06 · Profiles: own, others, and the in-feed mini-profile
- **Size:** M · **Owner:** Reece · **Depends on:** P2-DES-01, P2-DATA-04 · **Blocked on:** —

Profile tab (own profile), other users' profiles, and a mini-profile sheet when you tap a
streamer's avatar in the feed.

- [ ] Shows avatar, username, bio, follower and following counts, favorite games, and a LIVE badge if streaming now
- [ ] Tapping a live badge opens that stream in the feed
- [ ] Mini-profile sheet opens from the feed card without stopping playback
- [ ] Signed-out users on the Profile tab see a sign-up / log-in prompt

#### P2-APP-07 · Edit profile
- **Size:** M · **Owner:** Reece · **Depends on:** P2-APP-06, P2-DATA-03 · **Blocked on:** —

- [ ] Edit username, bio (≤ 160 chars) and favorite games; validation matches the database checks
- [ ] Pick an avatar from the photo library, crop square, upload to the avatars bucket, and see it everywhere
- [ ] Changes show immediately (optimistic update) and roll back with a message on failure

#### P2-APP-08 · Empty and low-stream feed states
- **Size:** M · **Owner:** Reece · **Depends on:** P2-DES-02, P2-DATA-05 · **Blocked on:** — · **Tags:** cold-start

The #1 product risk. Clips are v2, so the MVP fallback is "next scheduled stream" cards plus
offline followed streamers (design from Phase 1 wireframes).

- [ ] 0 live streams: a full-screen card with the next scheduled streams (P2-DATA-05) and their start times
- [ ] 1–2 live streams: the feed ends with the "coming up next" card instead of a dead end
- [ ] Signed-in users also see followed streamers who are offline, with "last live" times
- [ ] Never shows a blank screen or a spinner that doesn't end

#### P2-APP-09 · Web and tablet feed layout
- **Size:** M · **Owner:** Reece · **Depends on:** P2-APP-04 · **Blocked on:** —

At 768 px and wider the tabs are already a left sidebar; the stream centers in a frame with the
stream's own aspect ratio (16:9 or 9:16, [decision 011](decisions/011-stream-orientation.md)),
with space reserved for docked chat (filled in P3-APP-05). On web, "Full screen" uses the browser's
full-screen mode; tablets in the native app rotate like phones (P2-APP-10).

- [ ] Stream centered in a 16:9 or 9:16 frame matching the stream, letterboxed with the background color; no horizontal scroll at any width
- [ ] Arrow keys and mouse wheel move between streams; focus is visible
- [ ] Right column reserved for chat, showing a placeholder until P3-APP-05

#### P2-APP-10 · Join a landscape stream in landscape full screen
- **Size:** L · **Owner:** Reece · **Depends on:** P2-APP-04, P2-VID-01, P2-DATA-07 · **Blocked on:** —

[Decision 011](decisions/011-stream-orientation.md): the feed is always vertical; joining a
landscape stream rotates the screen to landscape full screen, and leaving returns to the vertical
feed. Phones and tablets both rotate.

- [ ] `app.json` orientation unlocked and `expo-screen-orientation` added (`npx expo install`); needs a new development build, so ask before running EAS
- [ ] The app stays portrait in the feed; swiping never changes orientation. A card is landscape by `streams.orientation`, corrected by the player's real aspect ratio once video plays
- [ ] Tapping "Full screen" on a landscape card, or turning the device sideways on one, switches to landscape; the same player keeps playing without reloading
- [ ] Joined view: action rail on the right edge, chat lower-left, top bar reduced to the LIVE pill, viewer count and a close button
- [ ] Closing (button, system back, or turning the device upright) returns to portrait on the same feed card
- [ ] Setting "Rotate landscape streams when I join" (on by default); when off, the joined stream stays portrait with the video as large as fits and chat below
- [ ] No orientation animation when reduce motion is on; the screen reader announces the stream, not the rotation
- [ ] Leaving the Live tab returns the app to portrait

### Backend / data

#### P2-DATA-01 · Implement anonymous viewing (D4)
- **Size:** S · **Owner:** Reece · **Depends on:** Phase 1: D4 decision · **Blocked on:** ⛔ D4

Turn the D4 decision into config and code that P2-APP-03 builds on.

- [ ] If anonymous sign-in: enabled in `supabase/config.toml` (local and `[remotes.production]`, checked with `config diff`), RLS tests prove anonymous users can't chat, follow, react, report or stream
- [ ] If local storage: a small `favorites` store module with a `migrateToProfile()` called after sign-up
- [ ] Decision record 004 updated to Decided

#### P2-DATA-02 · MVP feed ranking RPC
- **Size:** M · **Owner:** Reece · **Depends on:** — · **Blocked on:** —

Replace `get_live_feed` with the product plan's ranking: live streams only, scored by followed
streamer, matching favorite game, viewer count, and a boost for streamers with under 10 viewers.

- [ ] `get_feed(mode, cursor, page_size)` with modes `for_you` and `following`; stable pagination
- [ ] Score weights are named constants in the function, documented in a comment
- [ ] Excludes streams by users the caller has blocked and users who have blocked the caller (via `is_blocked_by`)
- [ ] Works for signed-out callers (no follows/favorites: viewer count + small-streamer boost only)
- [ ] pgTAP tests cover ordering, both modes, blocks and the signed-out case

#### P2-DATA-03 · Avatars storage bucket
- **Size:** S · **Owner:** Reece · **Depends on:** — · **Blocked on:** —

- [ ] Public-read `avatars` bucket; users write only `avatars/<their id>/…` (storage RLS policies in a migration)
- [ ] Size limit (≤ 2 MB) and image MIME types only
- [ ] Tests prove a user can't overwrite another user's avatar

#### P2-DATA-04 · Profile counts and username check
- **Size:** S · **Owner:** Reece · **Depends on:** — · **Blocked on:** —

- [ ] RPC or view returning follower and following counts for a profile
- [ ] `is_username_available(name)` RPC usable before sign-up (no other data exposed)
- [ ] Indexes support both at seed scale; pgTAP tests

#### P2-DATA-05 · Scheduled streams table
- **Size:** S · **Owner:** Reece · **Depends on:** — · **Blocked on:** — · **Tags:** cold-start

Powers the "coming up next" cards (P2-APP-08) and the Phase 4 team streaming schedule.

- [ ] `scheduled_streams (id, user_id, game_id, title, starts_at, created_at)`; public read; 16+ owners create/edit/delete their own
- [ ] `get_upcoming_streams(limit)` returns future rows with streamer and game info
- [ ] Seed rows for local dev; RLS tests

#### P2-DATA-06 · Viewer-count snapshot job (D3)
- **Size:** L · **Owner:** Sudip · **Depends on:** P2-VID-01 · **Blocked on:** —

Decision 003: count viewers with Realtime Presence on each stream's channel and write a periodic
snapshot to `streams.viewer_count` (service role only), which the feed ranking reads.

- [ ] The player joins Presence on `stream:<id>` while a stream is on screen and leaves when it scrolls away
- [ ] A scheduled job (pg_cron calling an Edge Function, or equivalent) writes `viewer_count` for every live stream at least once a minute
- [ ] Records peak viewers per stream (new column) for the end-of-stream summary (P3-APP-04)
- [ ] Spike first: if Presence can't be read server-side, fall back to a heartbeat table and record the change in a new decision record that supersedes 003
- [ ] Viewer count on the card updates live from Presence; the feed ranking uses the snapshot

#### P2-DATA-07 · `streams.orientation` column
- **Size:** S · **Owner:** Reece · **Depends on:** — · **Blocked on:** —

[Decision 011](decisions/011-stream-orientation.md): the feed needs each stream's orientation
before its first frame.

- [ ] Migration adds `streams.orientation` (`landscape` | `portrait`, default `landscape`); clients may set it on insert and edit it like `title` and `game_id` (extend the column privileges)
- [ ] `get_live_feed` and the ranked feed (P2-DATA-02) return it
- [ ] Seed streams include both orientations; RLS tests cover the new column; `db:types` regenerated

#### P2-DATA-08 · Game sessions and Realtime channel policies
- **Size:** M · **Owner:** Sudip · **Depends on:** — · **Blocked on:** — · **Tags:** safety

[Decision 010](decisions/010-game-multiplayer-and-viewers.md): the streamer's browser hosts the
game and Supabase Realtime carries its messages, so the database decides who may send on each
channel ([docs/game/hosting-and-interaction.md](game/hosting-and-interaction.md)).

- [ ] `game_sessions` (one row per stream: `stream_id`, `host_id`, `partner_id`, `raids_enabled` default on, `created_at`): the streamer inserts and updates their own; anyone can read rows for live streams (the app needs `raids_enabled`)
- [ ] Realtime Authorization policies on `realtime.messages`: on `ringward:<stream_id>` signed-in users can receive and only the stream's owner can send (viewer launches are sent by P3-DATA-07 with the service role); on `ringward-duo:<stream_id>` only the owner and the session's partner can send or receive
- [ ] pgTAP tests for every policy, including a stranger trying to send and a partner reading another stream's duo channel
- [ ] `db:types` regenerated

### Video

#### P2-VID-01 · StreamPlayer component (iOS, Android, web)
- **Size:** L · **Owner:** Reece · **Depends on:** Phase 1: video spike · **Blocked on:** —

One component that plays a stream's `playback_url` (HLS) everywhere. Provider-agnostic, so not
blocked on D1, but it uses the spike's finding on web HLS (`expo-video` on web vs. `hls.js`).

- [ ] `expo-video` on iOS and Android (added with `npx expo install`); web uses whatever the spike proved works in Chrome, Safari and Firefox
- [ ] Muted autoplay with a tap-to-unmute control (browsers block autoplay with sound)
- [ ] Loading, buffering, error ("Stream unavailable, swipe for the next one") and ended states
- [ ] Plays every seeded stream on all three platforms
- [ ] Reports the video's real aspect ratio once playing (P2-APP-10 uses it when it disagrees with `streams.orientation`)
- [ ] Note: adding `expo-video` needs a new development build; ask before running EAS (see P2-OPS-02)

#### P2-VID-02 · Feed playback lifecycle and performance
- **Size:** M · **Owner:** Reece · **Depends on:** P2-VID-01, P2-APP-04 · **Blocked on:** —

Only the visible card plays; the next one is ready before the swipe lands.

- [ ] Only the on-screen stream plays audio/video; the next card is preloaded; off-screen players are released
- [ ] Playback pauses when the app is backgrounded or the tab is hidden, and resumes on return
- [ ] Time to first frame after a swipe measured on a mid-range Android, an iPhone and Chrome, and recorded in the PR
- [ ] Joining a landscape stream (P2-APP-10) keeps the same player: no restart or rebuffer, time to landscape recorded in the PR
- [ ] Memory stays flat after swiping through 30 streams

#### P2-VID-03 · Stream ended while watching
- **Size:** S · **Owner:** Reece · **Depends on:** P2-VID-01 · **Blocked on:** —

`streams` is already in the Realtime publication.

- [ ] When the visible stream's status changes to `ended`, the card shows "Stream ended" with the streamer's follow button and auto-advances after 5 s (no auto-advance with reduced motion)
- [ ] Ended streams drop out of the loaded feed list

### Game

#### P2-GAME-01 · Game project setup and deploy
- **Size:** S · **Owner:** Sudip · **Depends on:** Phase 1: game concept and design doc · **Blocked on:** —

Per decision 002: a browser game in `games/<slug>/`, separate from the Expo app, deployed to its
own URL.

- [ ] `games/<slug>/` with the chosen tech (Phaser 3 or plain Canvas/TypeScript), a README with run and build commands
- [ ] Builds to static files and deploys to its own Vercel URL (see P2-OPS-01)
- [ ] Still ignored by the app's ESLint (`games/*`)

#### P2-GAME-02 · Full playable core loop
- **Size:** L · **Owner:** Sudip · **Depends on:** P2-GAME-01 · **Blocked on:** —

Grow the greybox into the complete game loop from `docs/game/design.md`.

- [ ] One mechanic, one screen, at the session length the design doc sets (quick rounds or a long session, [decision 012](decisions/012-game-session-length.md)), with a visible score, timer or goal
- [ ] Win/lose states as specified in the design doc
- [ ] Runs at 60 fps on a mid-range laptop in Chrome at 1080p (the OBS capture setup)
- [ ] Original name, rules and placeholder art: nothing copied from an existing game

#### P2-GAME-03 · Round flow: start, end, restart
- **Size:** M · **Owner:** Sudip · **Depends on:** P2-GAME-02 · **Blocked on:** —

- [ ] Title/start screen, end screen with score and best score this session, one-key instant restart
- [ ] No accounts or saves of its own (decision 002)
- [ ] Keyboard and mouse controls documented on the start screen

#### P2-GAME-04 · Stream readability pass
- **Size:** S · **Owner:** Sudip · **Depends on:** P2-GAME-02 · **Blocked on:** —

Viewers see the game on a phone: a landscape game fitted to width in the vertical feed, and full
screen once they join it ([decision 011](decisions/011-stream-orientation.md)).

- [ ] The design doc declares the game's primary orientation, and the game is streamed in it
- [ ] Score, timer and the action stay readable at phone size in that orientation, including fitted to width in the feed if it's landscape (a vertical-crop-safe area only matters if the game is portrait)
- [ ] Streamed through OBS into the app on a phone; a screenshot and notes on what was hard to read go in the PR
- [ ] Someone who hasn't seen the game can say what's happening after 5 seconds of a stream joined mid-session ([decision 012](decisions/012-game-session-length.md))
- [ ] Fixes for anything unreadable (size, contrast, clutter)

#### P2-GAME-05 · Playtest #1
- **Size:** S · **Owner:** Sudip · **Depends on:** P2-GAME-03 · **Blocked on:** —

- [ ] 3–5 classmates play two or more rounds each (or one long session); at least one watches it as a stream on a phone, joining partway through
- [ ] Findings and the changes they lead to written in `docs/game/playtests.md`

#### P2-GAME-06 · Host sign-in and stream channel
- **Size:** M · **Owner:** Sudip · **Depends on:** P2-GAME-02, P2-DATA-08 · **Blocked on:** —

The game page is the host for raids and duo (decision 010). It signs in with the streamer's
GameTime account and joins its live stream's channel; without that, solo and local duo still work.

- [ ] Sign in on the game page against the same Supabase project (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, public values only)
- [ ] Finds the streamer's live stream (`status = 'live'`, `game_id` = the original game) and creates or reuses its `game_sessions` row
- [ ] Joins the private channel `ringward:<stream_id>`; a host panel (toggled with a key, kept out of the capture) shows connection state
- [ ] A dropped connection reconnects without ending the round; signed out or offline, solo and local duo are unaffected

#### P2-GAME-07 · Viewer raids on the host
- **Size:** M · **Owner:** Sudip · **Depends on:** P2-GAME-06 · **Blocked on:** —

Viewers launch shards from the app; the host runs every launch through the rules' `launch()` and
tells viewers what happened. Launches replace the game's own spawns, so difficulty doesn't depend
on audience size (already unit tested in the greybox).

- [ ] Every `launch` message goes through `launch()` (round running, valid slot, cooldown, queue of 8); usernames on stream come only from the message the Edge Function sent, truncated as in the greybox
- [ ] Broadcasts raid events: round started and ended, each launch's result (queued with its place in line, cooldown, full, raids off), and the core breaker and top raiders at round end
- [ ] A raids on/off switch on the host panel, saved to `game_sessions.raids_enabled`
- [ ] A dev script sends launches as the service role against local Supabase, so the host can be tested without the app

#### P2-GAME-08 · Online duo partner
- **Size:** L · **Owner:** Sudip · **Depends on:** P2-GAME-06 · **Blocked on:** —

A friend joins from their own browser with the second shield. Host-authoritative: the partner
sends input, the host sends state.

- [ ] The host panel makes an invite link; a signed-in partner who opens it is saved as `game_sessions.partner_id`, and the host can remove them
- [ ] The partner sends input at about 30 Hz on `ringward-duo:<stream_id>`; the host sends compact state at about 20 Hz (under 1 KB)
- [ ] The partner's own shield is predicted locally and shards are interpolated; playable with 150 ms round trip (tested with network throttling)
- [ ] If the partner drops, P2 goes idle and the round continues; local keyboard duo still works with no partner

### Design

#### P2-DES-01 · High-fidelity: auth, onboarding, feed, profiles
- **Size:** M · **Owner:** Reece · **Depends on:** Phase 1: approved wireframes · **Blocked on:** —

Design stays one step ahead of the build. Phase 2 can start from approved low-fi wireframes.

- [ ] Hi-fi screens for sign up, log in, age gate, onboarding, the feed card and overlay, profiles and edit profile, using `src/theme/tokens.ts`
- [ ] The landscape card's "Full screen" button, the joined landscape view (rail, LIVE pill, chat, close) and the "Rotate landscape streams when I join" setting ([decision 011](decisions/011-stream-orientation.md))
- [ ] Mobile and web/tablet layouts
- [ ] Contrast checked to WCAG AA

#### P2-DES-02 · Cold-start feed states
- **Size:** S · **Owner:** Reece · **Depends on:** Phase 1: wireframes · **Blocked on:** — · **Tags:** cold-start

- [ ] Final designs for 0, 1 and 2 live streams, using scheduled streams and offline followed streamers (no clips: v2)
- [ ] Copy in the brand voice (short, casual)

#### P2-DES-03 · Terms of service and community guidelines
- **Size:** S · **Owner:** Reece · **Depends on:** — · **Blocked on:** — · **Tags:** safety

Safety basics include terms of service.

- [ ] Plain-language terms and community guidelines (age rules, no harassment, no unsafe content, how reports work) in `docs/legal/`
- [ ] Reachable inside the app (screen or web page) and linked from sign-up and settings
- [ ] Marked as a class-project draft, not reviewed by a lawyer

#### P2-DES-04 · High-fidelity: Go Live, chat, Discover, safety
- **Size:** M · **Owner:** Reece · **Depends on:** P2-DES-01 · **Blocked on:** —

Ready before Phase 3 starts in week 6.

- [ ] Go Live setup, stream key + OBS guide, live dashboard, end-of-stream summary
- [ ] Chat overlay (collapsed, expanded, docked on web), reactions, action rail
- [ ] Discover, game page, search results
- [ ] Report sheet, block confirmation, block list, chat filter settings
- [ ] Raid button and sheet for the original game (slot ring, cooldown, place in line, full and off states) for P3-APP-15 ([decision 010](decisions/010-game-multiplayer-and-viewers.md))

### DevOps / QA

#### P2-OPS-01 · Game build and preview in CI
- **Size:** S · **Owner:** Sudip · **Depends on:** P2-GAME-01 · **Blocked on:** —

- [ ] CI builds the game when `games/<slug>/` changes
- [ ] Vercel project for the game with a preview per PR and production from `main`; URL recorded in `AGENTS.md`
- [ ] The game's Vercel project has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for preview and production (public values only), for P2-GAME-06

#### P2-OPS-02 · Development build with video for the team
- **Size:** S · **Owner:** Reece · **Depends on:** P2-VID-01 · **Blocked on:** —

Adding `expo-video` means Expo Go can't run the app any more.

- [ ] With a person's go-ahead (build credits), one development build per platform; install links shared with the team
- [ ] README quickstart updated: dev build instead of Expo Go

#### P2-OPS-03 · App tests for auth and feed
- **Size:** M · **Owner:** Reece · **Depends on:** P2-APP-01, P2-APP-04 · **Blocked on:** —

- [ ] A Supabase client mock or test helper for Jest
- [ ] Component tests for sign-up validation, the age gate screens, feed card rendering and the empty states
- [ ] Runs in the existing CI app job

---

## Phase 3 — Go live and chat (weeks 6–8)

**Goal:** a 16+ user streams from OBS, viewers find the stream in the feed or through Discover,
chat, react, follow, share, report and block, and the streamer controls chat filters.

**Critical path:** D1 → P3-VID-01 → P3-VID-02 → P3-APP-01/02/03. Chat (P3-APP-05) can start in
week 6 against seed streams.

**Cut first if behind:** P3-APP-12 share links, P3-APP-10 search results (keep game tiles).

### App

#### P3-APP-01 · Go Live setup
- **Size:** M · **Owner:** Reece · **Depends on:** P2-APP-02, P2-DES-04, P3-VID-01 · **Blocked on:** —

Flow 3: tap + → name the stream and pick a game.

- [ ] Title (1–140 chars) and game picker; creates a `pending` stream
- [ ] Orientation picker, "Landscape: PC, console, browser" (default) or "Portrait: phone", saved to `streams.orientation` ([decision 011](decisions/011-stream-orientation.md))
- [ ] Under-16 and no-birth-date users get the age gate screens from P2-APP-02
- [ ] If the user already has a pending or live stream, it resumes that one instead of failing on the unique index

#### P3-APP-02 · Stream key and OBS guide
- **Size:** M · **Owner:** Reece · **Depends on:** P3-APP-01, P3-VID-01, P3-DES-01 · **Blocked on:** ⛔ D1

Server URL and key format depend on the provider.

- [ ] Shows the RTMP server URL and the stream key from `stream_keys` (hidden by default, tap to reveal, copy buttons)
- [ ] Step-by-step OBS guide built from `docs/obs-setup.md`, including the resolution/bitrate caps
- [ ] The guide's canvas size matches the orientation picked in setup: 1920×1080 for landscape, 1080×1920 for portrait
- [ ] "Reset stream key" with a confirmation, calling P3-VID-01's reset endpoint
- [ ] The key is never logged or sent to analytics

#### P3-APP-03 · Live dashboard
- **Size:** M · **Owner:** Reece · **Depends on:** P3-APP-01, P3-VID-02, P3-APP-05 · **Blocked on:** —

- [ ] Shows "Waiting for OBS…" until the webhook marks the stream `live`, then a LIVE state with duration and viewer count
- [ ] Shows chat with the streamer's own send box
- [ ] "End stream" with confirmation; the Go Live tab button pulses while live (respects reduced motion)

#### P3-APP-04 · End-of-stream summary
- **Size:** S · **Owner:** Reece · **Depends on:** P3-APP-03, P3-DATA-05 · **Blocked on:** —

- [ ] After the stream ends: duration, peak viewers, new followers, chat message count and reactions
- [ ] "Go live again" and "Done" actions

#### P3-APP-05 · Chat overlay and panel
- **Size:** L · **Owner:** Reece · **Depends on:** P2-APP-04, P2-DES-04 · **Blocked on:** —

Text chat + emoji (MVP column). `chat_messages` is in the Realtime publication.

- [ ] Collapsed: semi-transparent, auto-fading recent messages over the lower third; tap to expand to a full panel
- [ ] Docked to the right of the stream on web/tablet (fills P2-APP-09's column)
- [ ] In the joined landscape view (phones and tablets), overlays the lower-left so it doesn't cover the action rail
- [ ] Send box with the system emoji keyboard; 300-char limit; signed-out users are prompted to sign in
- [ ] Loads recent history, then live messages via Realtime; unsubscribes when the card leaves the screen
- [ ] Hides messages from users the viewer has blocked; shows the server's rejection message when a filter blocks a send

#### P3-APP-06 · Reactions
- **Size:** M · **Owner:** Reece · **Depends on:** P2-APP-04 · **Blocked on:** —

Flow 2: double-tap to react.

- [ ] Double-tap on the stream or the heart on the action rail sends a heart; haptic on native
- [ ] Floating heart animation for your own and others' reactions (Realtime); a static count instead with reduced motion
- [ ] Client-side throttle so holding the button doesn't flood the table

#### P3-APP-07 · Follow and unfollow
- **Size:** S · **Owner:** Reece · **Depends on:** P2-APP-06 · **Blocked on:** —

- [ ] Follow button on the action rail, the mini-profile and the profile; optimistic update; haptic on native
- [ ] Follower counts update; the Following feed reflects it on the next refresh
- [ ] Signed-out users get the sign-in prompt

#### P3-APP-08 · Discover tab
- **Size:** M · **Owner:** Reece · **Depends on:** P3-DATA-03, P2-DES-04 · **Blocked on:** —

- [ ] Search bar, game tiles (color, cover, live count), and a "live now" row ordered by viewers
- [ ] Tapping a game tile opens its game page (P3-APP-09)

#### P3-APP-09 · Game page and filtered feed
- **Size:** M · **Owner:** Reece · **Depends on:** P3-APP-08 · **Blocked on:** —

Flow 4: Discover → game tile → game page → tap a stream to enter the feed filtered to that game.

- [ ] Game page lists the game's live streams (and upcoming scheduled ones)
- [ ] Tapping a stream opens the feed filtered to that game, starting at that stream
- [ ] The original game's page shows a "Play it" link to its web build (P3-GAME-04)

#### P3-APP-10 · Search results
- **Size:** S · **Owner:** Reece · **Depends on:** P3-APP-08, P3-DATA-03 · **Blocked on:** —

- [ ] Results grouped as streamers, games and live streams; debounced as you type
- [ ] Empty and no-results states

#### P3-APP-11 · Report and block
- **Size:** M · **Owner:** Reece · **Depends on:** P2-DES-04 · **Blocked on:** — · **Tags:** safety

Report button and block user are MVP safety basics. The tables and RLS already exist.

- [ ] Report a stream (action rail "…" menu), a user (profile) or a chat message (long-press), with a reason; confirmation afterwards
- [ ] Block from a profile or a chat message; blocked users' chat is hidden and their streams leave your feed
- [ ] Settings screen: block list with unblock, chat filter settings (P3-APP-13 links here), terms and guidelines, log out
- [ ] Signed-out users are prompted to sign in

#### P3-APP-12 · Share a stream
- **Size:** S · **Owner:** Reece · **Depends on:** P2-APP-04 · **Blocked on:** —

The action rail's share button.

- [ ] Share sheet with a web link `/stream/<id>` that opens that stream (in the app via deep link, or on the web)
- [ ] A link to an ended stream opens the streamer's profile instead

#### P3-APP-13 · Streamer chat filter settings
- **Size:** S · **Owner:** Reece · **Depends on:** P3-DATA-02 · **Blocked on:** — · **Tags:** safety

- [ ] Streamers edit their blocked-words list and toggle "block links", from settings and the live dashboard
- [ ] Changes apply to the next message without restarting the stream

#### P3-APP-14 · Signed-out prompts and auth hand-off
- **Size:** S · **Owner:** Reece · **Depends on:** P2-DATA-01, P2-APP-01 · **Blocked on:** ⛔ D4

Flow 1: sign-up is optional until you chat or follow.

- [ ] Chat, follow, react, report and block open a short sign-up sheet instead of failing
- [ ] After signing up, the user returns to the same stream and the action completes
- [ ] Favorites picked during onboarding carry over (per D4)

#### P3-APP-15 · Raid button and sheet
- **Size:** M · **Owner:** Reece · **Depends on:** P3-DATA-07, P2-APP-04, P2-DES-04, P3-APP-14 · **Blocked on:** —

Viewers join the original game from the stream (decision 010). The app answers instantly; the
stream shows the shard a few seconds later with the viewer's name on it.

- [ ] On streams of the original game with raids on, the action rail shows a Raid button (44 pt target, screen-reader label)
- [ ] A bottom sheet with the 12-slot ring (same layout as the game's rim), a 4 s cooldown ring, and the host's answer: place in line, "raid full", "raids are off"; it only accepts taps while a round is running
- [ ] Signed-out and anonymous viewers get the sign-in prompt (P3-APP-14); a viewer the streamer blocked sees a neutral "You can't raid this stream"
- [ ] Works in the portrait feed and the joined landscape view ([decision 011](decisions/011-stream-orientation.md)); respects reduced motion

### Backend / data

#### P3-DATA-01 · Stream lifecycle housekeeping
- **Size:** M · **Owner:** Sudip · **Depends on:** P3-VID-02 · **Blocked on:** —

- [ ] A `pending` stream that never goes live is ended after 30 minutes (scheduled job)
- [ ] A `live` stream with no end webhook is ended after the duration cap (P3-VID-03)
- [ ] Both are idempotent and tested

#### P3-DATA-02 · Streamer chat filters
- **Size:** M · **Owner:** Reece · **Depends on:** — · **Blocked on:** — · **Tags:** safety

Streamer-controlled chat filters are an MVP safety basic. Enforced in the database so no client
can skip them.

- [ ] `chat_filters` (streamer, blocked words, block links) owned by the streamer; RLS so only they read and edit theirs
- [ ] A trigger on `chat_messages` insert rejects messages that match the stream owner's filters or a small base list, with a clear error
- [ ] pgTAP tests for matching, case-insensitivity and the "block links" switch

#### P3-DATA-03 · Search and Discover RPCs
- **Size:** M · **Owner:** Reece · **Depends on:** P2-DATA-02 · **Blocked on:** —

- [ ] `search(query)` over usernames, game names and live stream titles (`pg_trgm` or `ilike`, indexed)
- [ ] Games with live stream counts; live streams for one game (with the same block filtering as the feed)
- [ ] pgTAP tests

#### P3-DATA-04 · Moderation runbook and report review
- **Size:** S · **Owner:** Reece · **Depends on:** P3-APP-11 · **Blocked on:** — · **Tags:** safety

Reports are insert-only for users and reviewed by the team with the service role.

- [ ] `docs/moderation.md`: who checks reports and how often, how to end a stream, how to suspend an account, how to mark a report reviewed/actioned/dismissed
- [ ] A saved SQL query or view of open reports with the reported content
- [ ] One test run of the whole process on local data

#### P3-DATA-05 · Stream summary stats
- **Size:** S · **Owner:** Sudip · **Depends on:** P2-DATA-06 · **Blocked on:** —

- [ ] `get_stream_summary(stream_id)` for the owner: duration, peak viewers, new followers during the stream, chat and reaction counts
- [ ] Only the stream's owner can call it (tested)

#### P3-DATA-06 · Production games list and original game row
- **Size:** S · **Owner:** Sudip · **Depends on:** Phase 1: production games list · **Blocked on:** —

Production has no games; `supabase/seed.sql` is local-only and must never be pushed.

- [ ] A migration (or a reviewed service-role script) inserts the production games list, including the original game with `is_original = true`, its color and cover art
- [ ] Adds a `play_url` column for the original game's web build, if P3-APP-09 needs it
- [ ] Verified on the hosted project with `--remote`

#### P3-DATA-07 · `ringward-launch` Edge Function for viewer launches
- **Size:** M · **Owner:** Sudip · **Depends on:** P2-DATA-08, P3-OPS-01 · **Blocked on:** — · **Tags:** safety

A broadcast payload is whatever the client sends, so viewers don't broadcast launches themselves.
This function checks who they are and sends the launch for them.

- [ ] Verifies the caller's session; anonymous sessions (D4) and signed-out callers are refused
- [ ] Refuses when the stream isn't live, raids are off, or the streamer has blocked the viewer (`public.is_blocked_by()`); enforces the 4 s per-viewer cooldown and slots 0–11
- [ ] Sends `{ slot, by }` on `ringward:<stream_id>` with the service role, where `by` is the viewer's username from `profiles` (any name in the request is ignored); returns sent or the refusal reason
- [ ] Tests for each refusal and for a spoofed username

### Video

#### P3-VID-01 · Create-ingest Edge Function
- **Size:** M · **Owner:** Sudip · **Depends on:** Phase 1: video spike · **Blocked on:** ⛔ D1

Turn the spike's proof of concept into production code (decision 006).

- [ ] `create-live-stream` Edge Function: on a streamer's first Go Live, creates a persistent provider ingest and stores it in `stream_keys` (service role)
- [ ] Reset-key endpoint that rotates the key with the provider and in `stream_keys`
- [ ] Refuses callers who aren't 16+ (`can_stream`); provider API secret only in Supabase function secrets

#### P3-VID-02 · Video webhook Edge Function
- **Size:** M · **Owner:** Sudip · **Depends on:** P3-VID-01 · **Blocked on:** ⛔ D1

The feed only lists streams the API knows are live.

- [ ] `video-webhook` verifies the provider's signature and rejects anything unsigned
- [ ] Maps provider events to `streams` status `pending → live → ended`, sets `started_at`, `ended_at`, `playback_id` and `playback_url`
- [ ] Idempotent: repeated or out-of-order events don't corrupt state; tested with recorded payloads

#### P3-VID-03 · Stream caps and OBS settings
- **Size:** S · **Owner:** Sudip · **Depends on:** P3-VID-01 · **Blocked on:** ⛔ D1

Risk #2 mitigation: cap resolution and stream length.

- [ ] Provider-side caps set (720p, maximum duration agreed with the budget estimate)
- [ ] `docs/obs-setup.md` matches the caps

#### P3-VID-04 · End-to-end OBS test on every platform
- **Size:** S · **Owner:** Sudip · **Depends on:** P3-VID-02, P3-APP-03 · **Blocked on:** —

- [ ] A teammate goes live from OBS through the app's Go Live flow; the stream plays on iOS, Android and Chrome
- [ ] Time to first frame and glass-to-glass latency recorded in decision 001
- [ ] Stream end shows correctly on the dashboard and for viewers

### Game

#### P3-GAME-01 · Final art and title screen
- **Size:** M · **Owner:** Sudip · **Depends on:** P2-GAME-05 · **Blocked on:** —

- [ ] Original art in the game's own theme and palette (`docs/game/design.md`), replacing all greybox shapes, still readable on a phone stream
- [ ] Title screen with the game's own name and logo
- [ ] Cover art for its `games` row (used by game chips and tiles)

#### P3-GAME-02 · Sound
- **Size:** S · **Owner:** Sudip · **Depends on:** P2-GAME-03 · **Blocked on:** —

- [ ] Sound effects for the core actions and a music loop: original or CC0, with sources listed in the game README
- [ ] Mute toggle and volume that suit OBS capture (no clipping)

#### P3-GAME-03 · Polish and tuning
- **Size:** M · **Owner:** Sudip · **Depends on:** P2-GAME-05 · **Blocked on:** —

- [ ] Feedback effects (hits, score pops, round end) that read on a small screen
- [ ] Difficulty and pacing (round length, or how a long session progresses) tuned from playtest #1; changes noted in `docs/game/playtests.md`

#### P3-GAME-04 · Production deploy and "Play it" link
- **Size:** S · **Owner:** Sudip · **Depends on:** P2-OPS-01, P3-DATA-06 · **Blocked on:** —

- [ ] Production URL for the game is live and recorded in `AGENTS.md`
- [ ] The original game's row points at it so streamers can find and play it from the game page

#### P3-GAME-05 · Playtest #2 through the real Go Live path
- **Size:** S · **Owner:** Sudip · **Depends on:** P3-GAME-01, P3-VID-04 · **Blocked on:** —

- [ ] A teammate streams the game through OBS and the app's Go Live flow; 3+ classmates watch on phones and play
- [ ] The classmates raid from their phones and one round is played in online duo; the time from a tap to the shard showing on stream is noted
- [ ] Findings in `docs/game/playtests.md`; must-fix items ticketed for Phase 4

### Design

#### P3-DES-01 · In-app OBS guide content
- **Size:** S · **Owner:** Sudip · **Depends on:** Phase 1: `docs/obs-setup.md` · **Blocked on:** —

- [ ] Short, illustrated steps (screenshots of OBS settings) for the guide screen in P3-APP-02
- [ ] Copy for errors a streamer will hit: wrong key, OBS not connected, stream too long

#### P3-DES-02 · Usability test of the full loop
- **Size:** S · **Owner:** Reece · **Depends on:** P3-APP-05, P3-APP-03 · **Blocked on:** —

- [ ] 3–5 people try open → watch → swipe → chat/follow → go live on a real build
- [ ] Findings ranked by severity; fixes ticketed for Phase 4

### DevOps / QA

#### P3-OPS-01 · Edge Functions in CI and deploy
- **Size:** M · **Owner:** Sudip · **Depends on:** P3-VID-01 · **Blocked on:** —

- [ ] CI lints, type-checks and tests `supabase/functions/`
- [ ] Documented deploy step for functions to the hosted project (`supabase functions deploy`, with `--remote`-style care), in README

#### P3-OPS-02 · Provider secrets and webhook URL
- **Size:** S · **Owner:** Sudip · **Depends on:** P3-VID-01 · **Blocked on:** ⛔ D1

- [ ] Provider API keys and the webhook signing secret set as Supabase function secrets (local `.env` for functions, hosted for production); never in the repo
- [ ] Webhook URL registered with the provider for production
- [ ] `AGENTS.md` "Where things live" says where each secret lives (not its value)

#### P3-OPS-03 · Web end-to-end smoke test
- **Size:** M · **Owner:** Reece · **Depends on:** P2-APP-04, P3-APP-05 · **Blocked on:** —

- [ ] A browser test (for example Playwright) against the web export and local Supabase: the feed shows a seeded stream, sign up works, a chat message sends and appears
- [ ] Runs in CI on every PR and stays under 5 minutes

#### P3-OPS-04 · Mid-quarter preview builds
- **Size:** S · **Owner:** Reece · **Depends on:** P3-APP-03 · **Blocked on:** —

- [ ] With a person's go-ahead (build credits), `preview` builds for iOS and Android installed on team devices
- [ ] Known issues from the builds ticketed

---

## Phase 4 — Polish and demo (weeks 9–10)

**Goal:** the MVP loop works reliably on all three platforms, the feed is never empty during demo
hours, safety basics are verified, and demo day goes to plan.

**Feature freeze:** no new features in Phase 4. Bugs and polish only; the game is bug fixes only
(decision 002).

### App

#### P4-APP-01 · Accessibility audit and fixes
- **Size:** M · **Owner:** Reece · **Depends on:** Phase 3 complete · **Blocked on:** — · **Tags:** accessibility

The product plan's accessibility list (captions are v2).

- [ ] WCAG AA contrast on all text, including text over video scrims
- [ ] Screen-reader pass with VoiceOver, TalkBack and a web screen reader on every MVP flow; all action-rail buttons labeled
- [ ] Touch targets ≥ 44 px; reduced motion turns off floating hearts, pulses and auto-advance
- [ ] Findings and fixes listed in the PR

#### P4-APP-02 · Polish pass
- **Size:** M · **Owner:** Reece · **Depends on:** Phase 3 complete · **Blocked on:** —

- [ ] Skeleton loaders that look like the next stream; consistent haptics on swipe and follow
- [ ] Every screen has loading, error and offline states; no raw error strings
- [ ] Fixes from the Phase 3 usability test (P3-DES-02)

#### P4-APP-03 · Performance pass
- **Size:** M · **Owner:** Reece · **Depends on:** Phase 3 complete · **Blocked on:** —

"In a stream within one second of opening the app."

- [ ] Cold start to first playing frame measured on a mid-range Android, an iPhone and Chrome; target ≤ 2 s, recorded
- [ ] Swipe snap under 300 ms; no dropped frames in the feed with chat open
- [ ] Biggest regressions fixed

### Backend / data

#### P4-DATA-01 · Production streamers and schedule
- **Size:** S · **Owner:** Reece · **Depends on:** P2-DATA-05, P4-DES-01 · **Blocked on:** — · **Tags:** cold-start

Real accounts and real scheduled rows in production, not seed data.

- [ ] Team members (16+) have production accounts and stream keys
- [ ] The weeks 9–10 schedule from P4-DES-01 is entered as `scheduled_streams` rows by the streamers themselves (through the app or a reviewed script)

#### P4-DATA-02 · Safety verification
- **Size:** S · **Owner:** Reece · **Depends on:** P3-APP-11, P3-DATA-02, P3-DATA-04 · **Blocked on:** — · **Tags:** safety

- [ ] On production: report, block, chat filters and the age gate each tested end to end against a checklist in `docs/test-plan.md`
- [ ] Under-13 sign-up refused; a 13–15 account can't go live; a blocked user can't chat in the blocker's stream
- [ ] Reports are reviewed daily during weeks 9–10 per `docs/moderation.md`

### Video

#### P4-VID-01 · Fallback looping stream for gaps
- **Size:** M · **Owner:** Sudip · **Depends on:** P3-VID-02 · **Blocked on:** ⛔ D1 · **Tags:** cold-start, demo

When no teammate is live, a house account streams recorded gameplay of the original game so the
feed is never empty during demo hours.

- [ ] A documented `ffmpeg` command (or OBS scene) that loops a recorded video to a house account's ingest
- [ ] Run only during agreed hours, within the D1 budget; the stream title says it's a replay loop, not live play
- [ ] Turned off when two or more real streams are live

### Game

#### P4-GAME-01 · Game bug fixing and freeze
- **Size:** M · **Owner:** Sudip · **Depends on:** P3-GAME-05 · **Blocked on:** —

- [ ] Must-fix items from playtest #2 fixed; no new features
- [ ] Game frozen by the end of week 9; the production URL serves the frozen build

#### P4-GAME-02 · Record gameplay for the fallback loop and demo
- **Size:** S · **Owner:** Sudip · **Depends on:** P3-GAME-01 · **Blocked on:** — · **Tags:** cold-start, demo

- [ ] 10–15 minutes of good gameplay recorded at the OBS settings, for P4-VID-01 and the demo backup video

### Design

#### P4-DES-01 · Team streaming schedule
- **Size:** S · **Owner:** Reece · **Depends on:** P2-DATA-05 · **Blocked on:** — · **Tags:** cold-start

Cold-start mitigation: seed the feed with team and classmate streams on a schedule.

- [ ] `docs/streaming-schedule.md`: who streams what (including the original game), when, for weeks 9–10, so 2+ streams are live during demo hours
- [ ] Recruited classmates beyond the team where possible; backups for each slot

#### P4-DES-02 · Demo script and slides
- **Size:** M · **Owner:** Reece · **Depends on:** — · **Blocked on:** — · **Tags:** demo

- [ ] A script that walks the core loop: open → land in a stream → swipe → chat/follow → go live, plus the original game and a safety moment
- [ ] Short slides: problem, positioning, what we built, architecture, what's next (v2)
- [ ] Each speaker's part and timing

#### P4-DES-03 · Store-style screenshots and demo assets
- **Size:** S · **Owner:** Reece · **Depends on:** P4-APP-02 · **Blocked on:** — · **Tags:** demo

- [ ] Phone and web screenshots of each MVP screen, plus a 30–60 s screen recording of the loop
- [ ] Used in the slides and the README

### DevOps / QA

#### P4-OPS-01 · Test plan and regression pass
- **Size:** M · **Owner:** Reece · **Depends on:** Phase 3 complete · **Blocked on:** —

- [ ] `docs/test-plan.md` covering flows 1–4 and the safety checklist, per platform
- [ ] Full pass on iOS, Android and Chrome (plus Safari); every failure ticketed with a severity

#### P4-OPS-02 · Bug bash
- **Size:** S · **Owner:** Reece · **Depends on:** P4-OPS-01 · **Blocked on:** —

- [ ] One hour with classmates on preview builds and the production web app
- [ ] Bugs triaged into must-fix-before-demo and later

#### P4-OPS-03 · Production release
- **Size:** M · **Owner:** Reece · **Depends on:** P4-OPS-02 · **Blocked on:** —

- [ ] All migrations pushed (`db push --remote`), Edge Functions deployed, auth config diffed and pushed
- [ ] Vercel production on the release commit; with a person's go-ahead, `preview` (or `production`) builds installed on demo devices
- [ ] Release tagged in git; rollback steps written down

#### P4-OPS-04 · Cost and usage check
- **Size:** S · **Owner:** Sudip · **Depends on:** P3-VID-03 · **Blocked on:** ⛔ D1

- [ ] Provider usage to date vs. the D1 budget, with a projection through demo day
- [ ] Usage alerts set on the provider and Supabase; caps confirmed

#### P4-OPS-05 · Demo-day setup and dry runs
- **Size:** M · **Owner:** Reece · **Depends on:** P4-OPS-03, P4-DES-02 · **Blocked on:** — · **Tags:** demo

- [ ] Devices charged with the release build; an OBS laptop with the game and scenes ready; a wired or hotspot network backup
- [ ] Backup video of the whole loop in case the network fails
- [ ] Two timed dry runs in the real room (or as close as possible), fixes in between

#### P4-OPS-06 · Final handover notes
- **Size:** S · **Owner:** Reece · **Depends on:** P4-OPS-03 · **Blocked on:** —

- [ ] README, `AGENTS.md`, the phase Status sections and decision records match what shipped
- [ ] Known issues and the v2 list recorded for whoever continues after the class

---

## Stretch (v2)

Not scheduled. Don't open PRs for these during the quarter (scope is frozen at the MVP column).
They get the `v2-stretch` label if issues are created for them.

#### V2-01 · Play with me
Join queue on a stream, streamer picks players, invite link or lobby code (flow 5).

#### V2-02 · Manual clips
Clip the last 30 seconds of a stream; clips become the cold-start fallback in the feed.

#### V2-03 · Squads
Friends list, friends online, party chat. The Squads tab is a placeholder today.

#### V2-04 · Push notifications
"A streamer you follow is live" push notifications.

#### V2-05 · Mobile screen capture
Go live from a phone game in two taps.

#### V2-06 · Personalized ranking
Feed ranking that learns from watch time, beyond the MVP scoring rules.

#### V2-07 · Chat moderation tools
Slow mode, streamer-appointed moderators, timeouts.

#### V2-08 · Trending and new-streamer boost in Discover
Trending streams and a guaranteed-impressions boost for new streamers.

#### V2-09 · Animated gifts (no payment)
Animated gifts on the action rail, no real money.

#### V2-10 · Streamer stats
Stats across streams: followers over time, average viewers, peak times.

#### V2-11 · Second original game
A second browser game built for streaming (decision 002 limits the MVP to one).

#### V2-13 · Light mode
The `#F7F7FB` light theme from the product plan.

#### V2-14 · Captions
A captions toggle, then auto-captions.

#### V2-15 · Account deletion and store release
In-app account deletion (required by the App Store for apps with sign-up) and store listings.
Needed before any public store release; not needed for the class demo.

# 011. Vertical feed; landscape streams rotate when you join them

- **Status:** Decided (direction). The implementation below is the proposed approach; the open
  questions at the end are for the design review.
- **Date:** Nov 16, 2026
- **Decided by:** Reece (project lead)

## Context
The plan assumed a vertical, 9:16 feed. Most streamed games are landscape: OBS sends 16:9 from PC,
console and browser games. Mobile games are usually portrait. The Phase 1 wireframes drew
landscape streams fitted to the width of a portrait phone with a blurred fill, and left "rotate to
landscape full screen on phones?" as an open question. This record answers it.

## Decision
**The feed is always vertical. A landscape stream rotates to landscape full screen only when the
viewer joins it**, and leaving it returns to the vertical feed. Swiping through the feed never
changes the screen's orientation. Portrait streams play portrait full screen in the feed. Nothing
is cropped. This applies to phones and tablets; auto-rotate is on by default.

## Why
Flipping the screen between portrait and landscape on every swipe is jarring: the layout, the
gesture and the way the phone is held would change from one stream to the next. Keeping the feed
vertical keeps browsing consistent, and rotating on join still gives landscape games the whole
screen once someone chooses to watch.

Rejected: rotating the screen to each stream's orientation as you swipe (the first draft of this
record), and never rotating (landscape games would stay small).

## Proposed approach
- **Knowing a stream's orientation.** The streamer picks it in Go Live setup ("Landscape: PC,
  console, browser" or "Portrait: phone"), defaulting to landscape. It's stored as
  `streams.orientation` so the feed can lay out a card before the first frame. Once video plays,
  the player checks the real aspect ratio and wins if they disagree (a streamer can pick wrong).
- **In the feed (portrait, phones and tablets).** Portrait streams fill the screen. Landscape
  streams play fitted to width with a blurred fill behind them (the wireframes' current drawing)
  and a "Full screen" button on the card. The app stays in portrait while browsing.
- **Joining a landscape stream.** Tapping "Full screen", or turning the device sideways while a
  landscape card is showing, joins the stream: the screen switches to landscape (with
  `expo-screen-orientation`) and the same player keeps playing, without reloading.
- **In the joined view.** The video fills the screen. The action rail sits on the right edge, chat
  overlays the lower-left, and the top bar shrinks to the LIVE pill, the viewer count and a close
  button. Closing it (the button, the system back gesture, or turning the device upright) returns
  to the vertical feed on the same card.
- **Auto-rotate (on by default).** A setting, "Rotate landscape streams when I join". With it off,
  joining a landscape stream keeps the screen in portrait and shows the video as large as fits,
  with chat below it.
- **Tablets.** Same behavior as phones: a vertical feed, rotating to landscape when you join a
  landscape stream.
- **Web.** Browsers can't reliably rotate the screen. The player frame takes the stream's aspect
  ratio (16:9 or 9:16) inside the existing layout, and "Full screen" uses the browser's full-screen
  mode.
- **Reduced motion.** The switch to landscape happens without a transition animation when the OS
  reduce-motion setting is on.
- **Original game.** It declares one primary orientation in its design doc and is streamed in it.
  The "vertical-crop-safe" requirement applies only if that orientation is portrait.
- **OBS guide.** Tells streamers to set the canvas to 1920×1080 for landscape games or 1080×1920
  for portrait games, matching what they pick in Go Live.

## Consequences
- **Schema:** a new migration adds `streams.orientation` (`landscape` | `portrait`, default
  `landscape`), client-insertable like `title` and `game_id` (column privileges in schema v1).
- **Native builds:** unlocking orientation and adding `expo-screen-orientation` need a new
  development build. The app locks to portrait everywhere except the joined landscape view.
- **Wireframes:** the landscape card's "Full screen" button, the joined landscape view (overlay,
  chat, close) and the Go Live orientation picker need drawing.
- **Backlog:** new tickets P2-APP-10 (join a landscape stream) and P2-DATA-07 (orientation column);
  updated P2-APP-04, P2-APP-09, P2-VID-01, P2-VID-02, P2-GAME-04, P2-DES-01, P3-APP-01, P3-APP-02 and
  P3-APP-05. See `docs/backlog.md`.
- **Performance:** joining a landscape stream must not restart or rebuffer the video; measure it
  with P2-VID-02.

## Answered (Reece, Nov 16, 2026)
- Auto-rotate is on by default.
- Tablets rotate too, the same as phones.
- The feed stays vertical while swiping; only joining a landscape stream rotates the screen.

## Open questions (design review)
1. In the joined landscape view, can you swipe to the next landscape stream without leaving
   landscape, or is swiping off until you close it and return to the feed (proposed)?
2. Should turning the device sideways join a landscape stream, or only the "Full screen" button?

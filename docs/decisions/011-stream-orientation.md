# 011. Every stream plays in its game's orientation

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
**Every stream plays in the orientation of the game being streamed.** Landscape streams rotate to
landscape full screen; portrait streams stay portrait full screen. The feed is no longer forced to
9:16, and nothing is cropped.

## Proposed approach
- **Knowing a stream's orientation.** The streamer picks it in Go Live setup ("Landscape: PC,
  console, browser" or "Portrait: phone"), defaulting to landscape. It's stored as
  `streams.orientation` so the feed can lay out a card before the first frame. Once video plays,
  the player checks the real aspect ratio and wins if they disagree (a streamer can pick wrong).
- **Phones.** The app's orientation is unlocked (`app.json` `"orientation": "default"`). When a
  landscape stream becomes the visible card, the screen switches to landscape (with
  `expo-screen-orientation`); swiping to a portrait stream switches back. The user turns the phone
  to match; we don't rotate the picture inside a portrait screen.
- **Overlay in landscape.** The action rail stays on the right edge, chat overlays the lower-left,
  and the top bar shrinks to the LIVE pill and viewer count. Vertical swipe still moves between
  streams in both orientations, so the gesture never changes.
- **Opt-out.** A setting, "Rotate to fit each stream" (on by default). With it off, landscape
  streams play fitted to width in portrait (the wireframes' current drawing) with a rotate button
  on the card.
- **Tablets and web.** The screen doesn't rotate. The player frame takes the stream's aspect ratio
  (16:9 or 9:16) inside the existing layout, with chat docked beside or below it.
- **Reduced motion.** The orientation change happens without the swipe animation when the OS
  reduce-motion setting is on.
- **Original game.** It declares one primary orientation in its design doc and is streamed in it.
  The "vertical-crop-safe" requirement applies only if that orientation is portrait.
- **OBS guide.** Tells streamers to set the canvas to 1920×1080 for landscape games or 1080×1920
  for portrait games, matching what they pick in Go Live.

## Consequences
- **Schema:** a new migration adds `streams.orientation` (`landscape` | `portrait`, default
  `landscape`), client-insertable like `title` and `game_id` (column privileges in schema v1).
- **Native builds:** unlocking orientation and adding `expo-screen-orientation` need a new
  development build.
- **Wireframes:** the feed card, chat overlay and Go Live setup need landscape variants.
- **Backlog:** new tickets P2-APP-10 (rotate per stream) and P2-DATA-07 (orientation column);
  updated P2-APP-04, P2-APP-09, P2-VID-01, P2-VID-02, P2-GAME-04, P2-DES-01, P3-APP-01, P3-APP-02 and
  P3-APP-05. See `docs/backlog.md`.
- **Swipe performance:** an orientation change mid-swipe must still land in under 300 ms; measure
  it with P2-VID-02.

## Open questions (design review)
1. Is auto-rotate on by default, or opt-in?
2. In landscape, should swiping between streams stay vertical (proposed) or become horizontal?
3. Should tablets rotate too, or only adapt the frame (proposed)?

# 008. Brand mark and app icons

- **Status:** Decided
- **Date:** Nov 16, 2026
- **Decided by:** Claude (agent), for Reece's review in the PR that adds it

## Context
The app shipped with the Expo template's icon, splash and favicon. The product plan asks for a
dark-first, energetic, "always live" brand, with a play button that doubles as a live dot.

## Decision
- **Mark:** a violet (`#7C5CFF`) rounded play triangle with a hole at its centre, holding a
  pink-red (`#FF3B5C`) live dot, so the triangle reads as the dot's pulse ring. It sits on the app
  background (`#0B0B12`). The lockup puts "GameTime" in Space Grotesk Bold, white, to the right.
- **Source of truth:** `assets/brand/mark.svg`. `npm run icons` (`scripts/generate-icons.mjs`)
  generates every other asset from it; nobody edits the PNGs by hand.
- **iOS:** keep an Icon Composer `.icon` (`assets/app.icon`, `ios.icon` in `app.json`), with
  the triangle and the dot as separate layers, rather than a flat PNG.

## Why
- The mark is two flat shapes in brand colours, so it stays legible at 29px and in Android's
  monochrome (themed) icon.
- A generator keeps all sizes in step and makes design changes one-file edits.
- Expo SDK 54+ supports `.icon` directories, and iOS 26+ renders them with Liquid Glass, dark
  and tinted modes, with no separate variants to maintain. A PNG `ios.icon` was the rejected
  alternative: simpler, but flat on iOS 26.

## Consequences
- Icon and splash changes only show on iOS and Android after a new native build. Web picks up
  the favicon on the next deploy.
- Xcode 26 or later is needed to build the `.icon`; EAS's default images have it.
- The in-app header still shows "GameTime" as text; `assets/brand/logo.svg` is available
  if a screen wants the lockup.

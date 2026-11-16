# Wireframe review log

Each time the wireframes change, review them before committing:

1. Serve the page: `python3 -m http.server 8090 --directory docs/wireframes` (or the `wireframes`
   config in `.claude/launch.json`). Opened as a `file://` URL, the in-app browser shows a copy
   that won't scroll.
2. Screenshot every frame you touched. Phones: open `index.html?real` (phones at 100%, so text and
   44 pt targets are true size). Web layouts: the plain page at desktop width (1440 px).
3. Check against the brief: every listed screen and state is present, each flow's arrows make
   sense, nothing overlaps, clips or is unreadable, buttons are at least 44 pt, accents follow
   the Theming table, and empty, loading and error states exist. Also run the design-critique
   checklist (usability, hierarchy, consistency, accessibility).
4. Fix what you find and review again. Stop when a pass finds nothing worth fixing.
5. Add an entry below.

Screenshots of the final pass are in [`review/`](review/).

---

## Iteration 3: Nov 16, 2026 (final)

- **Reviewed:** the frames touched in iteration 2, screenshotted again in `?real` at 1080 px wide.
  The web frames (X1–X5) were checked at 1440 px. An automated check ran on all 43 frames in
  both modes. It looks for elements outside the device, rows clipped at the bottom of a screen,
  buttons and rows under 44 pt, annotation markers that overlap, notes without a matching marker,
  and broken internal links.
- **Found:** no problems in the automated check. The D1 "Live now" row runs off the right edge,
  but that's on purpose: the cut-off card shows the row scrolls. The design-critique pass found
  only nits that weren't worth another round:
  - The Squads tab icon (⚇) draws a little smaller than the other tab icons.
  - P2 shows two strong buttons side by side, "Watch live" (red) and "Follow" (violet). That's
    intended while the user is live.
- **Changed:** nothing. Review stopped here.

## Iteration 2: Nov 16, 2026

- **Reviewed:** every frame touched in iteration 1, at 100% (`?real`) and at desktop width.
- **Found:**
  1. The new search icon was larger than the other tab-bar icons.
  2. Two notes still said Follow pills were 32 pt (C0 and the accessibility section).
  3. Desktop frames at 56% and the tablet at 42% made their text too small to read on a wide
     screen.
  4. X3's marker 3 floated away from the banner it explains.
  5. In `?real` mode the web frames were squeezed to phone width and clipped. The review-mode CSS
     overrode `.frame.wide`.
- **Changed:**
  1. Made the tab-bar search icon smaller (14 pt).
  2. Updated both notes.
  3. On screens 1300 px and wider, desktop frames now show at 70% and the tablet at 55%.
  4. Moved X3's marker inline in the banner.
  5. The review-mode width rule now skips wide frames.

## Iteration 1: Nov 16, 2026

- **Reviewed:** all 38 phone frames at 100% (`?real`, 1080 px wide), the 5 web and tablet frames
  at 1440 px, and the automated check above. Design-critique checklist applied to each flow.
- **Found:**
  1. **Clipped:** P4 Settings, the last row ("Delete account") was cut off at the bottom of the
     screen.
  2. **Touch targets under 44 pt:**
     - Follow, Following and Unblock pills were 32 pt (C0, C2, D2, P5).
     - The O3 "Got it" button was 32 pt.
     - The G3 "End stream" button was 36 pt.
     - The D2 segmented control was 38 pt.
  3. **Unreadable:**
     - The search glyph (⌕) rendered as a tiny "ρ" in the tab bar and search fields.
     - The G1 banner icon rendered as an empty box.
     - The LIVE pills on thumbnails were 9 pt (C2, D1, D3, X2).
  4. **Low contrast:** the W6 skeleton blocks were nearly invisible against the background.
  5. **Markers covering content:**
     - O1: marker 1 sat on the logo.
     - W1, W6: marker 3 sat on the video label.
     - D2: marker 1 sat on the "Streamers" tab.
  6. **Brief coverage:** the brief asks for distinct 0, 1 and 2-live states, but C1 was labelled
     "1–2 live" and C2 "end of feed", so the 2-live state wasn't explicit.
  7. **Consistency:**
     - W3 said "You follow · 6" but listed 4 people, and its rows had no › cue to show they open.
     - G4's two arrows both read "End stream".
     - A4's "New here? Sign up" was split over two lines.
     - R3's sheet grabber sat in the middle of the sheet.
  8. **Review tooling:** web frames were clipped in `?real` mode.
- **Changed:**
  1. Removed the v2 Notifications row from P4 and set its rows to 48 pt, so the screen fits.
  2. Made all pill buttons and the segmented control 44 pt, and removed the 36 pt override on
     "End stream".
  3. Drew the search icon in CSS. Removed the broken G1 icon. Made thumbnail LIVE pills 10.5 pt.
  4. Drew the W6 skeleton in `surfaceRaised`.
  5. Moved the O1, W1, W6 and D2 markers.
  6. Retitled C1 "1 live: the only stream" and C2 "2 live: end card after the second stream",
     and spelled out how the 1- and 2-live states differ in C1's notes.
  7. W3 now shows "You follow · 4" with › on each row. G4's second arrow reads "confirm". A4's
     line is inline. R3's grabber is back at the top of the sheet.
  8. Fixed `?real` mode so wide frames keep their width (finished in iteration 2).

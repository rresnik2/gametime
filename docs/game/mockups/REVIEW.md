# Game mockups review log

Each time `index.html` changes, review it before committing:

1. Serve `docs/` (the `game-mockups` config in `.claude/launch.json`, or
   `python3 -m http.server 8091 --directory docs`) and open `/game/mockups/`. Serving `docs/` keeps
   the links to `../../decisions/` working.
2. Screenshot every frame you touched at 100%: `index.html?real&only=R1` shows one frame alone
   (headless Chrome: `--window-size=440,960 --screenshot=R1.png "<url>"`). Also take the whole
   page at 1440 px wide with and without `?zones`, and check that the default view (without `?real`) doesn't scroll
   sideways at 375 px.
3. Give the screenshots, the page and the source docs (`docs/game/concepts.md`, `design.md`,
   `hosting-and-interaction.md`, decisions 010–012, wireframe W1) to a fresh reviewer that hasn't
   seen your reasoning. Ask for legibility at phone size, swipe-in clarity, overlay collisions,
   originality, and consistency with the docs and within the page, ranked major, minor or nit.
4. Fix what it finds and review again. Stop when a round finds only nits.
5. Add an entry below.

Screenshots of the final pass (the feed frames R1, R1b, H1, L1 and the signature moments R6, H5,
L5) are in [`review/`](review/).

---

## Round 13: Nov 16, 2026 (final)

- **Reviewed:** all 20 frames at 100%, R2 with zones and H2 in the browser, and the 375 px
  default view (no horizontal scroll). Round 12's fixes had landed. Every score, timing,
  overlay and cooldown figure re-derived from the greybox held.
- **Found: only nits (5).**
  - The "Look-alikes" line called Hot Core's disc mint, though the gameplay frames show it red.
  - H2's 5-second box mentioned the flicker a second late and put chat on the canvas.
  - H1 note 2 called the flicker the only warning (it's the only warning of *when*).
  - L5's distance implied a faster pace than L2's.
  - "37% of the screen" should have said "of the stream".
- **Changed:** applied all five as copy fixes, and L5 is now 1,996 m / 43,912. Review stopped
  here.

## Round 12: Nov 16, 2026

- **Reviewed:** all 20 frames at 100%, the full page at 1440 px with and without zones, L2 with
  zones, and the 375 px default view (no horizontal scroll). Round 11's fixes had all landed,
  and the re-derived numbers held.
- **Found (0 major, 2 minor, 6 nits):**
  - **Minor:**
    - H2's 5-second box ran 1–5 s, but with the new flicker rule the hold in that frame ends
      within about a second.
    - R3 told viewers to raid before the Raid button exists.
  - **Nits:**
    - R6's two pills nearly touched.
    - The core clipped R1b's name pill.
    - L1's marker 3 sat on the rail avatar.
    - L1 said "one or two" clear gates where only one is.
    - Unfilled gauge segments didn't show where the red third starts.
    - R4's "2 cracks to spare" was ambiguous.
- **Changed:**
  - Rewrote H2's timeline: the flicker at 0–1 s, the bank or overload by about 2 s, then the
    next hold.
  - R3 now reads "Raids on · raid when the round starts".
  - Name pills are drawn after the core.
  - Moved R6's pill and L1's marker. L1 now says "only the next gate".
  - Unfilled red-zone segments are tinted dim red.
  - R4 now says "2 pips left".

## Round 11: Nov 16, 2026

- **Reviewed:** all 20 frames at 100%, the full page at 1440 px with and without zones, R6, L3,
  L4 and L5 with zones at 100%, and the 375 px default view (no horizontal scroll). Round 10's
  fixes had all landed. The scores, wave timing, overlay mapping and the L2 → L4 run
  re-derived and held. The Ringward frames were down to nits.
- **Found (0 major, 3 minor, 8 nits):**
  - **Minor:**
    - The page never said what the flicker tells the player. As drawn, it added nothing to the
      red gauge, so the Hot Core risk ("tension invisible to viewers") had no basis.
    - Lumen Drop's "not fixable in layout" was asserted without the one-row-HUD test Ringward
      got.
    - L2 and H2's 5-second boxes lacked the "in the feed" caveat R2 has.
  - **Nits:**
    - L4's card ran under the overlay.
    - L3's narrowing rule sat under chat.
    - R1b's pill poked past the rim.
    - R6's pills touched.
    - R2's marker 3 sat on the warning arc.
    - R8's banner contained a frame link.
    - H1's chat had a viewer seeing the flicker.
    - L1's marker 3 sat far from its tag.
- **Changed:**
  - Hot Core gets a fifth assumption: the flicker appears only in the last second or so before
    an overload, fainter each level, so a player who spots it can let go in time. H2's flicker
    note says what it means in that frame, and H1's chat now reads "is it gonna blow??".
  - Lumen Drop's risk is now "only partly fixable" (a one-row HUD would show about half of
    each gate's trip, not drawn), in the table and in L1.
  - Added the feed caveats to L2 and H2.
  - L4's card fits above y 1140, and L3's rule moved into the clear band.
  - Moved the pills, pops and markers. The R8 banner copy is clean, and the R9 link moved to
    the note.

## Round 10: Nov 16, 2026

- **Reviewed:** all 20 frames at 100%, the full page at 1440 px with and without zones, R2,
  R6, R1b and H2 in the browser, and the 375 px default view (no horizontal scroll). Round 9's
  fixes had all landed, and the greybox-derived numbers held again.
- **Found (0 major, 1 minor, 9 nits):**
  - **Minor:** R6's quillfire sat under the shield, so one of the two named shards had no
    visible shard.
  - **Nits:**
    - H2's flicker marker covered part of the fleck.
    - H2's 5-second timing.
    - L3's undefined "9 ready".
    - Wall dashes overhanging L3's shaft.
    - L3's shaft wasn't wider than L2's.
    - L4's distance didn't follow L2's pace.
    - R8 showed half the cooldown gone for an "instant" reply.
    - H5's gauge marker.
    - R1b's status line grazing the rim.
- **Changed:**
  - quillfire is at 0.55 R (visible outside the shield) and combo_king is at the rim.
  - Moved the markers and reworded H2's 5-second text.
  - L3 now reads "Viewers can place gates from the app", with a wider shaft and clipped dashes.
  - L4 shows 1,341 m and 20,115.
  - R8 is just after the tap (4 s left). R9 is 2 s later and says "next one in 2 s".
  - R1b's status line is moved up.

## Round 9: Nov 16, 2026

- **Reviewed:** all 20 frames at 100%, the full page at 1440 px with and without zones, R6 with
  zones at 100%, and the 375 px default view (no horizontal scroll). Round 8's fixes had
  landed, except H5's note text. The greybox-derived timing, the overlay mapping and the
  scores were re-derived and held.
- **Found (0 major, 3 minor, 6 nits):**
  - **Minor:**
    - R1b's trade-off note said the reaction window looks shorter (the greybox runs in arena
      units, so the timing is the same; motion is smaller and the pills crowd).
    - R8's header claimed "12 raiding" and "1:08 left", data the hosting design doesn't send.
    - H5's note said three flecks where two are drawn.
  - **Nits:**
    - H2's 5-second fallback couldn't happen in its frame.
    - H4 implied 17 s without a bank.
    - L4's "mint gates" wording.
    - Markers and a pop a few pixels off.
    - L1 didn't mention the app control for placing gates.
    - Small greybox / page mismatches (shield ring radius, L3's shaft width, H3 spacing,
      unused CSS).
- **Changed:**
  - Rewrote R1b note 3. R8's header now reads "Round on · raid now". H5 says "two faint
    flecks".
  - H2's fallback line is reworded. H4 now shows 8 banks, 7 of 10 holds and 6,610. L4 says
    "37 gates".
  - Moved the markers and the R6 pop. Added the L1 control note and the shield ring to R2's
    proposal list.
  - L3's shaft width now matches L2's. Spaced out H3's labels and removed the unused CSS.

## Round 8: Nov 16, 2026

- **Reviewed:** all 20 frames at 100%, the full page at 1440 px with and without zones, R2 with
  zones at 100%, and the 375 px default view (no horizontal scroll). Round 7's fixes had all
  landed. The greybox-derived numbers held: R1, R1b, R2, R4, R6, R7, R8 to R9, Hot Core's
  levels and charge rates, and Lumen Drop's scores.
- **Found (0 major, 2 minor, 7 nits):**
  - **Minor:**
    - R5's "26 blocked" can't produce 4,480 (the greybox counts all blocks).
    - R8's red "queued by others" dots need an event the hosting design doesn't send.
  - **Nits:**
    - L4's gate count was off by one.
    - H5's flicker was slightly louder than H2's.
    - R6's turn margin was overstated.
    - Some markers were far from their targets (H1, H2, H5) or close to other shapes (R1, R9,
      L1).
    - R1b's pill looked like it touched the Raid button.
- **Changed:**
  - R5 now reads "104 blocked · 21 raiders".
  - R8 has no red dots, and the note says why.
  - L4 shows 37 gates.
  - H5's flicker is two fainter, shorter flecks.
  - R6 says "just inside the roughly 0.48 s".
  - Moved the markers and R1b's pill.

## Round 7: Nov 16, 2026

- **Reviewed:** all 20 frames at 100%, the full page at 1440 px with and without zones, and the
  375 px default view (no horizontal scroll). Every marker was measured against the nearby
  shapes. The greybox numbers re-derived for R1, R1b, R2, R6, R7, R8 and R9 all held, and round
  6's fixes had landed.
- **Found (0 major, 4 minor, 8 nits):**
  - **Minor:**
    - H5 drew the flicker as the loudest thing on screen, against "harder to read each level",
      plus cues the page never named (red core, blinking segment, red tint).
    - H1 / H2's flicker couldn't be found and had no marker.
    - L2 and L5 scores were a few points off distance × combo.
    - R9's moving queue position needs an event the hosting design doesn't send.
  - **Nits:**
    - R6's quillfire pill was detached from its shard.
    - R7's "swing" was only 15°.
    - H5's hold must overload for H4 to add up, and H4's "5 of 7" metric was undefined.
    - Nothing said what raises the Hot Core level.
    - Markers touching shapes.
    - The "1140 = chat starts" wording (chat starts at 1166).
    - Lumen Drop's risk cell didn't say whether it's fixable.
    - Low contrast on L1's mint avatar.
- **Changed:**
  - H5's flicker is now three faint flecks, with no blink and no tint. The reactor turns red
    whenever the gauge is in its red zone (so H1 / H2 at 70% are red too), and that's listed as
    an assumption with "levels every 15 s".
  - H2 has a red marker and note for the flicker at its real size.
  - Scores are exact (17,976; 63,932). R9's strip says "queued", with a note on why.
  - quillfire's pill is moved. P2 is at 95° so it really has to swing.
  - H5 notes that its hold overloads, and H4 now reads "6 of 9 holds".
  - Moved the markers. Reworded the clear-band line. Added the Lumen Drop "not fixable in
    layout" clause. Avatar letters on mint are dark.

## Round 6: Nov 16, 2026

- **Reviewed:** all 20 frames at 100%, the full page at 1440 px with and without zones, R6 and
  R7 with zones at 100%, and the 375 px default view (no horizontal scroll). Round 5's fixes
  had all landed.
- **Found (0 major, 4 minor, 5 nits):**
  - **Minor:**
    - Hot Core showed the flicker at 58% charge, where its own rule says no overload can happen.
    - H5 charged slower at level 5 than H2 at level 3.
    - Lumen Drop's scores are distance × current combo, which a combo reset would slash, and
      the page didn't say so.
    - R3's "14 signed-in viewers" needs presence data the hosting design doesn't send.
  - **Nits:**
    - R6's turn-time claim only held for the mouse (the greybox's keys turn at 300°/s).
    - Markers touching the rail, tabs and progress blocks.
    - Zone labels covering game text.
    - R2's 5-second text promised a PERFECT.
    - R4's restart wording differed from the other cards.
- **Changed:**
  - H1 and H2 are at 70% charge (just into red), and the flicker is said to start in the red
    zone. The lede matches.
  - H5 is 3.8 s into its hold.
  - Lumen Drop's lede states the score rule and leaves "should it build up?" as an open question
    for the design doc.
  - R3 now reads "Raids on · raid from the GameTime app".
  - R6 gives the mouse and key turn times.
  - Moved the markers. Zone labels are smaller, translucent and pinned to an edge.
  - Reworded R2's 5-second text and R4's restart line.
  - design.md says mouse and keys turn at the same speed, but the greybox doesn't; that's
    flagged in the PR description.

## Round 5: Nov 16, 2026

- **Reviewed:** all 20 frames at 100%, the full page at 1440 px with and without zones, and the
  375 px default view (no horizontal scroll). Round 4's fixes had landed, except R3's note
  text.
- **Found (1 major, 5 minor, 6 nits):**
  - **Major:** R1's note said the swipe-in test passes, while the compare caveat says it holds
    only for R1b. In R1 the incoming shard really is behind the Raid button, and the warning is
    under chat.
  - **Minor:**
    - R3's note quoted the old text.
    - R7 had no overlay-risk note, and its "whose job it is" claim didn't hold for a shard on
      the split line.
    - The core and timer are drawn bigger than the greybox's.
    - L5's "CLOSE!" pass went through the middle of the gate.
    - H1's bank history sat between chat lines.
  - **Nits:**
    - Markers on targets (H1, L1, R6, R7, R8).
    - A ricochet trail through "PERFECT".
    - The imprecise slot count in R1 note 3.
    - "~40%" should have been about a third (Lumen Drop).
    - "Three assumptions" when there are four.
    - Zone labels printed over game text.
- **Changed:**
  - R1 note 1 now says the swipe-in "partly passes" and why. R2's feed paragraph matches.
    R1 note 3 counts the slots: 6 of 12, from 3 to 8 o'clock.
  - R7: tidepool moved to 6 o'clock on P2's side, with a red risk note on the duo half under
    the overlay, and the pop moved off the rail.
  - R2 note 4 labels the bigger core and timer as a proposal for design.md.
  - L5's spark now brushes the gate's post.
  - Hot Core's live canvases no longer show the history (it's on the end card).
  - Moved the markers and pops. Zone labels are on dark pills. Lede and table wording fixed.

## Round 4: Nov 16, 2026

- **Reviewed:** all 20 frames at 100% and the full page at 1440 px with and without zones. The
  reviewer recomputed score bounds from `game.ts`'s scoring rules. Round 3's fixes had landed,
  except R6's shard position. No horizontal scroll at 375 px.
- **Found (2 major, 3 minor, 6 nits):**
  - **Major:** R4's 8,410 total was below what 162 blocks with 41 perfect must score
    (9,595–10,875). The hero frame (R2, reused in R1, R1b, R8 and R9) also had a problem: a
    shard about to hit the side of the core opposite the shield, which is a certain crack, next
    to a ricochet too close for the wave timing.
  - **Minor:**
    - R6's quillfire had already passed the shield, and two ricochets can't both be in view.
    - Hot Core's red gauge third read as a timing cue the concept says doesn't exist.
    - The feed frames' fit-to-width assumption wasn't stated.
  - **Nits:**
    - R9 reuses R8's game frame.
    - R7's pop didn't match its ricochet.
    - Two Hot Core markers sat on the flicker.
    - R3's "ready to raid" had no meaning.
    - L4's background spark was low.
    - Ringward and Hot Core look alike at thumbnail size.
- **Changed:**
  - R4 is now 9,860.
  - R2 / R1 / R1b: the shield swings towards the incoming shard (350°), the shard sits about
    0.4 s out, the ricochet is at the rim, and the pops are moved off it.
  - R6: the shield is at 337°, with quillfire in its perfect zone and one ricochet at the rim.
    The note is reworded to match.
  - R7: the ricochet is at the rim beside P2's centre.
  - Hot Core's gauge rule is now an explicit assumption: overload becomes possible in the red
    third and is certain when full. The risk text now says that what's invisible is *when*
    inside the red zone.
  - Added "Reference device" and "Look-alikes" lines to the shared section.
  - Added an R9 note. Moved the markers. Changed R3 to "14 signed-in viewers watching". L4's
    background row is removed.

## Round 3: Nov 16, 2026

- **Reviewed:** all 20 frames at 100% and the full page at 1440 px with and without zones,
  checked against design.md, hosting-and-interaction.md and the greybox code (`game.ts`,
  `waves.ts`, `render.ts`). Round 2's fixes had all landed. No horizontal scroll at 375 px.
- **Found (1 major, 7 minor, 6 nits):**
  - **Major:** two numbers that `game.ts` can't produce. R7 showed ×3 after ~31 blocks with
    no cracks (it must be ×4–×5), and R5 scored 2,150 after surviving 1:34 (the floor is about
    2,280).
  - **Minor:**
    - R6 credited the pair rule, but raid launches are always singles. It also showed two
      raider warnings, which can only overlap for 0.1 s.
    - R2's marker 3 was stale.
    - Markers covered "BANK", the R9 title and other labels.
    - R2's first-5-seconds promised a crack that this streamer lands once in 52 s.
    - In overdrive the red rim hid the red rim warnings.
    - End-card lines viewers need (crack credits, "NEW BEST", the vote result) sat under chat.
    - R5's note claimed the name was the largest text on the card.
  - **Nits:**
    - The name-on-warning "proposal" is already in the greybox.
    - R8 / R9 timing (cooldown arc, queue position) and the own-slot icon's direction.
    - Trails of just-launched shards started outside the rim.
    - L4 reused L2's live numbers.
    - R1b's lower arena is under the top of the scrim.
- **Changed:**
  - R7 is now ×5 with a +125 pop. R5 is 4,480, and its card no longer repeats the score.
  - R6's note now explains the single 0.5 s raid ticks and shows one warning. Quillfire is
    moved to the shield.
  - Overdrive rim warnings are drawn white, flagged as a proposal for design.md.
  - The R4, R5 and H4 end cards fit above y 1140.
  - Reworded R1 note 1 and R2's 5-second text. Fixed the R5 and R2 notes.
  - Moved the markers.
  - R8 arc 180°, R9 "2nd in line", and the own-slot icon points at the core.
  - Trails are clipped at the rim.
  - L4 now shows its own numbers (1,402 m, ×15, 21,030) and L2 lost its orphan "+1".
  - R1b's note mentions the scrim.

## Round 2: Nov 16, 2026

- **Reviewed:** all 20 frames, including the new R1b and R9, at 100%, and the full page at
  1440 px with and without overlay zones. A fresh reviewer also checked that round 1's fixes
  landed. No horizontal scroll at 375 px in the default view.
- **Found (1 major, 7 minor, 11 nits):**
  - **Major:** shard counts now matched the wave table, but their spacing didn't. Two named
    shards about 140° apart and 0.06 s apart is an unblockable pair, which design.md's pair rule
    prevents.
  - **Minor:**
    - Raid shards sat between the 12 rim slots.
    - R1b's crack pips were too small to read.
    - R2's feed paragraph contradicted R1.
    - The Raid button was shown between rounds in some frames and not others.
    - Markers covered the flicker (H1), the tag (L2), chat text (L1) and the strip's ring (R9).
    - The page didn't mention W1's tap-for-clean-view.
    - Ringward's 37 needed a caveat (its readability 5s hold for R1b, not R1).
  - **Nits:**
    - H2 vs H5 bank history.
    - The R9 timing and its static cooldown ring.
    - Strip text contrast.
    - R8 was missing the Following / For You toggle.
    - A crack line touched the timer.
    - The name on the rim warning wasn't marked as a proposal.
    - Two off-token colours remained.
    - H3's start-key wording and a cramped pill.
    - `?real` scrolls sideways at 375 px.
    - design.md says "30% more often" in duo, but the greybox uses 0.7× the interval.
- **Changed:**
  - Rebuilt the Ringward scenes on rim slots (multiples of 30°), with legal spacing:
    - R2 / R1 / R1b: one shard near the shield, the last one ricocheting and the next one's
      warning.
    - R6: one pair, near and just off the rim, plus the next pair's warnings.
    - R7: two shards 0.7 s apart.
    - Notes reworded to match.
  - R1b pips are now 90% size with a thicker crack.
  - The Raid button shows only while a round is on (R3–R5 use the four-button rail), and R8
    says so.
  - Moved the markers. Added the clean-view line and the caveat under the compare table.
  - H2 is labelled an earlier round. R9 now says "1 s", with a progress ring on the Raid button
    and full-white strip text.
  - Added the toggle to R8. Moved the crack path. Marked the rim-warning name as a proposal.
  - Off-token colours are replaced. H3 now says "Space or click".
  - Left as is: `?real` scrolling sideways on phones. It's a review mode for desktop, and the
    no-scroll check in step 2 means the default view.
  - The duo-rate mismatch is in design.md (PR #8), so it's flagged in this PR's description.

## Round 1: Nov 16, 2026

- **Reviewed:** the first draft (17 frames), per-frame screenshots at 100% and the full page at
  1440 px. No horizontal scroll at 375 px.
- **Found (3 major, 14 minor, 5 nits):**
  - **Major:** the suggested Ringward layout fix (raise the arena) still left its bottom under
    chat and its right edge under the rail. The raid frames had more shards in flight than the
    wave table allows (six in overdrive; the table allows about two plus warnings). Several
    scores were impossible under design.md's scoring (7,050 at 1:08 solo; 31 blocks in a full
    round).
  - **Minor:** the Raid sheet hid the arena it told viewers to watch; markers covered or missed
    their targets (H1, R1, H2, L2, L1); R1 notes missed the collision under the Raid button;
    R2's "first 5 seconds" described the canvas, not the feed; Hot Core's risk was overstated
    (stakes are visible, timing isn't); viewer-facing start-screen text sat under the overlay;
    36 px labels despite a "nothing under 38 px" claim; "NEW BEST" scores below the stated
    best; Lumen Drop gate counts; canvas markers couldn't be red; feed phones lacked the tab
    bar and status bar; R5 note wording; links to files that only exist on PR #8.
  - **Nits:** off-token greys and a grey P2 shield; an overlapping pill in R6; the zones button
    over text on phones; A/C/B section order; "PRESS SPACE" when click also works.
- **Changed:**
  - Added **R1b**, an overlay-safe Ringward layout: the arena shrinks to 63% of the width, with
    the pips beside the score. The comparison table now states that trade-off.
  - Cut in-flight shards to what the wave table allows: R6 has two in flight, two warnings and
    "8 queued"; R2 and R7 have two each.
  - Rescored: R2 2,900, R6 9,240, R7 1,900, and R4 has 162 blocked and 41 perfect. Lowered the
    stated bests.
  - Added **R9**: after a launch, the Raid sheet folds to a strip, and the slots grey out during
    the cooldown.
  - Moved the markers and added red canvas markers. Rewrote the R1, R2, R6 and Hot Core risk
    notes.
  - Moved viewer-facing start-screen text into the clear band. All in-game text is now 40 px or
    more.
  - Fixed the Lumen Drop counts and drew the phone chrome as in the wireframes.
  - Palette: the P2 shield is now `#E8E8F0`, and the rim and walls use the `border` token.
  - Fixed the `?only=` regex.
  - Left as is: the links to files on PR #8. They resolve once #8 merges, and the PR says so.

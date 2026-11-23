# GameTime — notes for agents and teammates

GameTime is a vertical, swipe-to-discover feed of live gaming streams (iOS, Android and web from
one Expo codebase). Read these first:

- `GameTime — Product Plan.pdf`: the product plan (vision, MVP scope, roadmap)
- [PHASE_1_PLAN.md](PHASE_1_PLAN.md): the current phase, with a **status** section at the top
- [docs/backlog.md](docs/backlog.md): Phases 2–4 tickets by phase and workstream, plus the v2 stretch list
- [docs/decisions/](docs/decisions/): decisions already made, and why
- [README.md](README.md): setup and commands

## Rule: always update the handover notes

The handover notes are how the next person or agent picks up the work without re-discovering
it. **Every PR must leave them accurate.** A PR that changes what's true about the project but
not the notes is incomplete, the same as a PR with failing tests.

The handover notes are:

| File | Holds |
|---|---|
| `AGENTS.md` (this file) | How we work, where things live, tooling pitfalls |
| `PHASE_1_PLAN.md` → **Status** (later phases: that phase's plan file) | What's done and what's open |
| `docs/decisions/NNN-short-name.md` | One record per decision: context, decision, why, consequences |
| `README.md` | Setup and commands a human runs |

### Directions for any agent (or person)

Before you finish a task, and before you open or update a PR, go through this list and update
every note that's now wrong or incomplete, **in the same PR as the work**:

1. **Did you finish or start a tracked item?** Tick or add it in the plan's Status section, and
   update the "updated" date in its heading.
2. **Did you or the user make a decision** (a choice between options, a scope change, a vendor,
   a name, a region, an account)? Add `docs/decisions/NNN-short-name.md` using the next free
   number and the format of the existing records, then link it from the Status section. If it
   replaces an older decision, mark the old record "Superseded by NNN".
3. **Did something cost time** (a CLI default, a confusing error, a workaround, a test that
   caught a real bug)? Add one bullet to "Tooling pitfalls" below: the symptom, the cause, and
   what to do instead.
4. **Did an account, service, URL, ID, environment variable or workflow change?** Update
   "Where things live" or "How we work" below.
5. **Did a command or setup step change?** Update `README.md`.
6. **Is anything in the notes now false?** Fix or delete it. Stale notes are worse than none.

Rules for writing the notes:

- Write facts, not a diary: what is true now and what to do, not the story of how you got there.
- Use absolute dates ("Nov 15, 2026"), never "today" or "last week".
- **Never put secrets in the notes:** no passwords, tokens, secret keys or personal details. Say
  where a secret lives (for example "the maintainer's macOS Keychain"), never its value.
- Keep entries short. If a note needs more than a few lines, it probably belongs in a decision
  record.
- If you're unsure whether something is worth noting, note it.

If a task ends without a PR (for example, a change made directly in a dashboard), still update
the notes: open a small `docs/…` PR for them.

## How we work

- **`main` is protected.** Work on a branch (`feat/…`, `fix/…`, `chore/…`, `docs/…`, `ci/…`),
  open a PR, and squash-merge it once both required checks pass:
  "App (lint, typecheck, test, web build)" and "Database (migrations, seed, RLS tests)".
  History is linear; don't merge-commit or force-push.
- **Before opening a PR:** `npm run lint`, `npm run typecheck`, `npm test`. If you touched
  `supabase/`, also `npm run db:reset`, `npm run db:test` and `npm run db:types` (CI fails if
  `src/lib/database.types.ts` is stale).
- **Scope is frozen at the MVP column** of the product plan, plus decision 010 (viewer raids
  and a duo mode in the original game). v2 work (Play with me, clips, squads,
  push, mobile capture, a second game) goes in the "Stretch (v2)" list in `docs/backlog.md`, not in a PR.
- **Backlog:** the tickets in `docs/backlog.md` are filed as GitHub issues #9–#90, #93–#94 and
  #102–#107 (milestones "Phase 2/3/4: …", labels `ws:*`, `size:*`, `blocked:*`). **The issues are the source of truth**
  for owner and progress. To add a ticket, add it to the file in the same format, then run
  `scripts/create-backlog-issues.sh` (dry run, validates) and `--apply`, which files only the new
  IDs. Re-scoping or cutting a ticket: edit the file and the issue by hand; the script never edits.
  When a `blocked:*` decision is made, remove that label from its issues.
- **Never start an EAS build** unless a person asks; the free plan has limited build credits.
- **Never push seed data to production.** `supabase/seed.sql` is local-only test data.
- **Schema changes are new migrations** (`npx supabase migration new <name>`). Never edit a
  migration that has been pushed to the hosted project. Add RLS tests in `supabase/tests/` for
  any new table or policy.
- **Add packages with `npx expo install`**, not `npm install`.
- **Every change to the wireframes gets a review pass** before it is committed: screenshot the
  frames you touched, check them against the brief, fix, repeat until a pass finds nothing, and
  log it in `docs/wireframes/REVIEW.md` (the steps are at the top of that file).

## Where things live

| Thing | Where |
|---|---|
| GitHub | `rresnik2/gametime` (public) |
| Web hosting | Vercel project `gametime`, production at https://gametime-gold.vercel.app; every PR gets a preview |
| Native builds | Expo project `@rresniks-team/gametime`; profiles in `eas.json` |
| Database | Supabase project `ptswfeemhjkbmhgrjdqj` (us-west-1), GameTime org |
| App IDs | iOS bundle ID and Android package `com.rresnik2.gametime` |
| Design tokens | `src/theme/tokens.ts` (from the product plan's Theming section): the app's palette, a work in progress and not strict. Games don't use it: each game has its own theme and palette |
| Brand mark and logo | `assets/brand/mark.svg` (source of truth) and `logo.svg` (mark + wordmark, generated); previews in `docs/brand/` |
| App icons, splash, favicon | Generated by `npm run icons` (`scripts/generate-icons.mjs`) into `assets/images/` and the iOS Icon Composer icon `assets/app.icon/`; never edit those files by hand |
| Wireframes | `docs/wireframes/index.html`: one self-contained page, every MVP screen by flow, plus open product questions. Preview with the `wireframes` config in `.claude/launch.json`; add `?real` to see phones at 100%. Review log: `docs/wireframes/REVIEW.md` |
| Game mockups | `docs/game/mockups/index.html`: mid-fidelity mockups of the three top game concepts (feed with overlay, game canvas, start/end, signature moments). Preview with the `game-mockups` config in `.claude/launch.json` (serves `docs/`; open `/game/mockups/`); `?real` = phones at 100%, `?zones` = app overlay outlined on each canvas, `?only=R1` = one frame. Review log: `docs/game/mockups/REVIEW.md` |
| Supabase client | `getSupabase()` in `src/lib/supabase.ts` |
| Backlog | `docs/backlog.md`; issue filer `scripts/create-backlog-issues.sh` (dry run unless `--apply`) |
| Original games | `games/<slug>/`, standalone web builds kept out of the Expo app's lint, typecheck and Jest. Recommended: `games/ringward/` (greybox; Vite + TypeScript, own `package.json`, CI job "Game"; no Vercel project yet). Earlier candidate: `games/the-biosphere-realm/` (source of truth: `SudipKing/The-Biosphere-Realm`; this copy adds the session adapter and tests, decision 014) |
| Session engine (proposed, decision 014) | `games/engine/gametime-engine.js`: roles (optional host, players, viewers, AIs) and the house rules every game shares; rules and adapter contract in `games/engine/README.md`. Biosphere's adapter: `games/the-biosphere-realm/src/session.js` (local demo `src/session-local.js`, `?session&host&players=2&ai=2&viewers=40`). Tests: `npm run test:games` |
| Game design | `docs/game/concepts.md` (shortlist), `docs/game/design.md` (one page), `docs/game/hosting-and-interaction.md` (raids, duo, Realtime channels `ringward:<stream_id>` and `ringward-duo:<stream_id>`); pick tracked in decision 009, multiplayer in 010 |
| Jev (TypeSafe), dev tool only | `POST https://api.typesafe.ai/v1/systemone`, model `jev-latest`; docs https://docs.typesafe.ai/llms.txt; local skill copy in `.claude/skills/typesafe-ai/` (git-excluded). Use it when it helps, no per-call approval, under $5/month; rules in [decision 013](docs/decisions/013-jev-dev-tool.md) |
| CI failure triage | `.github/workflows/ci-triage.yml` (runs when CI fails; comments on the PR) and `scripts/ci-triage/` (questions in `questions.mjs`, live check `probe.mjs`, tests `npm run test:scripts`) |

Environment variables: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
Locally they come from `.env` (local Supabase); Vercel (production, preview) and EAS (preview,
production) hold the hosted project's values. Only public keys go in `EXPO_PUBLIC_` variables.
`TYPESAFE_API_KEY` (Jev, decision 013) lives in the maintainer's shell profile (`~/.zshrc`) and as
a GitHub Actions repository secret: never in the repo, Vercel or EAS, and never with an
`EXPO_PUBLIC_` prefix.

## Tooling pitfalls (each of these has cost time)

- **Supabase CLI 3 targets the local stack by default.** Pass `--remote` for the hosted project
  (`db push --remote`, `db lint --remote`, `migration list --remote`). It also refuses
  confirmations in agent runs: re-run with `--yes` only after a person has approved.
- **`supabase config push` sends every setting in `config.toml`,** including local-dev values.
  Production overrides live under `[remotes.production]`. Always run `npx supabase config diff`
  first and check that only intended changes appear.
- **RLS policies that check another user's private rows** (for example "has the streamer
  blocked me?") must call a `security definer` helper such as `public.is_blocked_by()`. A plain
  subquery runs with the caller's permissions, can't see the other user's rows, and silently
  passes. The RLS tests caught this once.
- **Column-level privileges on `streams`:** clients may only insert `user_id, title, game_id` and
  update `title, game_id`. Status, playback info and viewer counts are service-role only (the
  video webhook).
- **CLI logins from an agent's shell:** the user's own terminal login may not be visible to the
  agent. Expo works with `npx eas-cli@latest login --device --non-interactive` (then `--resume`
  with the number the user sees); Vercel's CLI runs its own device flow. Never ask for or paste
  tokens.
- **Vercel** promotes a new project's first deployment to production regardless of branch.
  Preview URLs sit behind Vercel login (deployment protection, Hobby plan: owner only).
- **iOS Simulator:** this machine also runs Apple Watch simulators; target an iPhone by UDID.
  The dev-client launcher may hide the local dev server behind its discovery filters; open
  `exp+gametime://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081` with
  `xcrun simctl openurl`, or run `npx expo start` and press `i`.
- **Expo Router tab triggers:** custom tab buttons omit `ref` because expo-router's slot ref type
  doesn't match React Native 0.88's yet (see `src/components/navigation/app-tabs.tsx`).
- **Wireframes in the in-app browser:** opening `docs/wireframes/index.html` as a `file://` URL renders a static snapshot that won't scroll. Serve it instead (`python3 -m http.server 8090 --directory docs/wireframes`, or the `wireframes` launch config).
- **The root toolchain picks up everything under `games/` unless told not to:** `expo lint`
  lints every JS file, `tsc` includes every `**/*.ts`, and Jest runs every `*.test.ts`. The
  games have their own tooling, so `eslint.config.js` ignores `games/*`, `tsconfig.json`
  excludes `games`, and `jest.config.js` ignores `<rootDir>/games/`. Keep all three.
- **The Biosphere Realm loads `../engine/gametime-engine.js`,** so serve `games/`, not its own folder
  (`python3 -m http.server 8092 --directory games`, or the `biosphere` launch config). Served alone it
  still plays, without shared sessions. Its tests load the real game headless in a Node `vm` with a
  do-nothing DOM (`test/load-headless.cjs`); loading takes about 10 s, so load once per test file.
- **Ringward tests use `node --test`, not Jest:** `src/*.ts` imports use `.ts` extensions and
  only erasable TypeScript (no enums), so Node 24 runs them with no build step.
- **The Browser pane pauses animation when it's hidden,** so a canvas game looks frozen there.
  Ringward exposes its state as `window.ringward` in dev; step it from the console by importing
  `/src/game.ts` and calling `update()`. Vite's HMR adds `?t=` to module URLs, so that import
  can be a second copy of the module; that's fine, since the state object is shared.
- **`expo-doctor` rejects `eas-cli` as a project dependency;** scripts call `npx eas-cli@latest`.
- **TypeScript 6** doesn't pick up global types automatically; `tsconfig.json` lists `"jest"`
  in `types`.
- **Icons and splash:** web has no native splash screen, and native icon/splash changes only
  appear in a new build. Check them without a build: `npx expo prebuild --no-install` in a
  throwaway copy of the repo, and `xcrun actool assets/app.icon --compile <dir> --platform iphoneos
  --minimum-deployment-target 17.0 --app-icon app --output-partial-info-plist <dir>/p.plist`
  (writes flattened PNGs you can look at). The web export turns `favicon.png` into `favicon.ico`.
- **npm cache permissions:** if `npm install` fails with `EACCES` on `~/.npm/_cacache`, use
  `--cache <some writable dir>` or fix ownership of `~/.npm`.
- **The TypeSafe Claude Code plugin (`typesafe@typesafe-ai`) doesn't install:** its marketplace
  isn't found and the source is unverified (Nov 17, 2026). Use the vendor's skill file copied to
  `.claude/skills/typesafe-ai/` (git-excluded) and the docs at https://docs.typesafe.ai/llms.txt.
- **`TYPESAFE_API_KEY` is empty in an agent's shell:** it's set in `~/.zshrc`, which
  non-interactive shells don't load. Pass it for one command without printing it:
  `TYPESAFE_API_KEY="$(zsh -ic 'printf %s "$TYPESAFE_API_KEY"')" node scripts/ci-triage/probe.mjs`.
- **`node --test scripts/` fails with one "test failed":** Node treats the folder as a file. Use a
  glob, as `npm run test:scripts` does. Jest would also pick up `*.test.mjs` and fail to load it,
  so `jest.config.js` ignores `scripts/`.
- **Local iOS builds (`npx expo run:ios`) need CocoaPods,** and if it's missing Expo's CLI installs
  it with Homebrew on its own (it did on Nov 17, 2026: CocoaPods 1.17 and Ruby 4.0.9). In an
  agent's shell `pod install` then fails twice: `unicode_normalize` errors because no locale is
  set (export `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`), and "certificate verify failed" because
  Homebrew Ruby's CA bundle can't verify cdn.cocoapods.org (export
  `SSL_CERT_FILE=/etc/ssl/cert.pem`). Set all three for the build command only.
- **Metro doesn't see file changes in a worktree under `/private/tmp`:** restart
  `npx expo start --clear` after edits, or work in a worktree under the repo.

---

## Expo guidance

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

### Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

### Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

### Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

### Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

### Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

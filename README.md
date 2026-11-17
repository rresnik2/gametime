# GameTime

A vertical, swipe-to-discover feed of live gaming streams. One Expo (React Native) codebase for
iOS, Android and web.

- Product plan: `GameTime — Product Plan.pdf`
- Current phase: [PHASE_1_PLAN.md](PHASE_1_PLAN.md)
- Wireframes: [docs/wireframes/index.html](docs/wireframes/index.html) (open in a browser; no build step)
- Game mockups: [docs/game/mockups/index.html](docs/game/mockups/index.html) (the three top game concepts; open in a browser)

## Quickstart

Requires Node 24 and npm.

```bash
npm install
cp .env.example .env   # fill in once the Supabase project exists
npm start              # then press i (iOS), a (Android) or w (web)
```

On a phone, scan the QR code with Expo Go. Once the app adds native modules that Expo Go doesn't
include (video playback, for example), switch to a development build with
`npx eas-cli@latest build --profile development`.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run web` | Start and open the web app |
| `npm run lint` | ESLint (`eslint-config-expo`) |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Jest (`jest-expo`) |
| `npm run build:web` | Static web export to `dist/` |
| `npm run icons` | Regenerate the app icons, splash and favicon from `assets/brand/mark.svg` |
| `scripts/create-backlog-issues.sh` | Validate `docs/backlog.md` and preview its GitHub issues; `--apply` files tickets that don't have an issue yet (public repo: ask the project lead first) |

CI runs lint, typecheck, tests and the web build on every pull request
([.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Database (Supabase)

Local development runs the whole Supabase stack in Docker, so start Docker Desktop first.

```bash
npm run db:start   # first run downloads images; applies migrations + seed
npx supabase status  # copy API_URL and PUBLISHABLE_KEY into .env
```

| Command | What it does |
|---|---|
| `npm run db:reset` | Rebuild the local database from migrations and `supabase/seed.sql` |
| `npm run db:test` | Run the row-level security tests in `supabase/tests/` |
| `npm run db:lint` | Lint the schema |
| `npm run db:types` | Regenerate `src/lib/database.types.ts` (CI fails if it's stale) |
| `npm run db:stop` | Stop the local stack |

Schema changes go in a new migration: `npx supabase migration new <name>`, then `db:reset`,
`db:test` and `db:types`. Never edit a migration that has already been pushed to the hosted
project.

**Seed accounts (local only):** `pixelpilot`, `nova`, `kartqueen`, `blockhead`, `combo_king`,
`scroller`, `squadseeker` and `minor13` (aged 14, so can't stream). Each signs in with
`<username>@gametime.test` and the password in `supabase/seed.sql`.

In the app, use `getSupabase()` from `src/lib/supabase.ts`.

### Hosted project

Production runs on Supabase project `ptswfeemhjkbmhgrjdqj` (us-west-1) in the GameTime organization.
Vercel and EAS (preview and production) already have its URL and publishable key.

- **Schema changes:** merge the migration, then `npx supabase db push --remote`. The seed file
  is never pushed.
- **Auth settings:** edit `supabase/config.toml`; production values live under
  `[remotes.production]`. Preview with `npx supabase config diff`, apply with
  `npx supabase config push`.
- **Database password:** needed for `link` and `db push`. It's in the maintainer's macOS
  Keychain as "Supabase GameTime database password"; it's never stored in the repo.

## Native builds (EAS)

The Expo project is `@rresniks-team/gametime`. To run builds you need to be a member of the
`rresniks-team` Expo account and logged in (`npx eas-cli@latest login`).

| Command | Profile | What you get |
|---|---|---|
| `npm run build:dev` | `development` | Dev build for real devices, shared by install link |
| `npm run build:dev:sim` | `development-simulator` | Dev build for the iOS Simulator (no Apple developer account needed) |
| `npm run build:preview` | `preview` | Non-dev build for testers; Android is an installable `.apk` |
| `npm run build:prod` | `production` | Store build; the build number increments automatically |

Add `--platform ios` or `--platform android` to build one platform, for example
`npm run build:dev -- --platform android`. Builds only start when someone runs one of these
commands, to save the free plan's build credits. Real-device iOS builds need an Apple Developer
account.

Each profile reads environment variables from the EAS environment with the same name
(development, preview, production); set them on expo.dev or with `npx eas-cli@latest env:create`.

## Adding packages

Use `npx expo install <package>` rather than `npm install`, so you get versions that match the
Expo SDK.

## Layout

```
src/
├─ app/                    # Expo Router routes (every file is a screen)
│  ├─ _layout.tsx          # fonts, splash, dark navigation theme
│  └─ (tabs)/              # Live (index), Discover, Go Live, Squads, Profile
├─ components/
│  ├─ navigation/          # bottom tab bar / web sidebar
│  └─ ui/                  # AppText, Button, LivePill, GameChip, Avatar
├─ hooks/
├─ lib/                    # Supabase client and generated database types
└─ theme/tokens.ts         # colors, spacing, radius, type scale
assets/
├─ brand/                  # mark.svg (logo source of truth), logo.svg (mark + wordmark)
├─ app.icon/               # iOS Icon Composer icon (generated)
└─ images/                 # icon, Android adaptive layers, splash, favicon (generated)
scripts/generate-icons.mjs # npm run icons
games/
└─ the-biosphere-realm/    # candidate original game (static page, separate from the app)
docs/
├─ decisions/              # one record per decision
└─ wireframes/index.html   # low-fi wireframes for every MVP screen (self-contained)
```

To view the wireframes, open `docs/wireframes/index.html` in a browser, or serve the folder:
`python3 -m http.server 8090 --directory docs/wireframes`, then visit http://localhost:8090.
Edit the HTML directly; it has no dependencies. Add `?real` to the URL to see phones at 100%.
After editing, follow the review steps in [docs/wireframes/REVIEW.md](docs/wireframes/REVIEW.md).

To play a game locally, serve its folder with any static server, for example
`npx serve games/the-biosphere-realm`, or open its `index.html` directly.

The tab bar becomes a left sidebar at 768px and wider (web and tablet). Squads is a v2 feature,
so its tab shows a placeholder for the MVP.

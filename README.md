# GameTime

A vertical, swipe-to-discover feed of live gaming streams. One Expo (React Native) codebase for
iOS, Android and web.

- Product plan: `GameTime — Product Plan.pdf`
- Current phase: [PHASE_1_PLAN.md](PHASE_1_PLAN.md)

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
└─ theme/tokens.ts         # colors, spacing, radius, type scale
```

The tab bar becomes a left sidebar at 768px and wider (web and tablet). Squads is a v2 feature,
so its tab shows a placeholder for the MVP.

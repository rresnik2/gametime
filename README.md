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

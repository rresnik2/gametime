# 004. Watching without an account

- **Status:** Open
- **Date:** Nov 15, 2026
- **Decided by:** not yet

## Context
The product plan's first-open flow lands viewers in a live stream with sign-up optional until
they chat or follow, but onboarding also collects favorite games.

## Options
1. **Supabase anonymous sign-in:** every viewer gets a session; favorites are stored in the
   database and carry over when they create an account.
2. **Local storage:** keep favorite games on the device and copy them to the profile on sign-up.

## Decision
Not made yet. Anonymous sign-ins are currently **off** (`enable_anonymous_sign_ins = false` in
`supabase/config.toml`). Signed-out viewers can already read streams, profiles and chat.

## Consequences
Needed before Phase 2 builds onboarding.

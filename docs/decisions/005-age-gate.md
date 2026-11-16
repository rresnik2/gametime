# 005. Age gate: 13+ to use, 16+ to stream

- **Status:** Decided
- **Date:** Nov 15, 2026
- **Decided by:** product plan; implemented in schema v1

## Context
The product plan requires 13+ to watch and 16+ to stream (18+ for gifting, post-MVP), but its
data model had no age field.

## Decision
Collect a birth date at sign-up (passed as `birth_date` in the sign-up metadata). Store it in
`account_details`, which only its owner can read; profiles are public. A trigger rejects
under-13s; `public.can_stream()` gates creating streams on 16+.

## Why
Enforcing it in the database means the app can't skip it.

## Consequences
Users who sign up without a birth date (for example via a future OAuth provider) must add one
before streaming. Gifting's 18+ rule will reuse `account_details`.

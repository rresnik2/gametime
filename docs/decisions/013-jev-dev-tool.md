# 013. Jev (TypeSafe) as a dev-time judgment tool

- **Status:** Decided. Updated Nov 17, 2026: agents use it without asking per call, and it
  triages CI failures automatically (both by the project lead).
- **Date:** Nov 17, 2026
- **Decided by:** Reece (project lead)

## Context
Some development chores need a judgment call that exact code can't make: which CI job a failure
belongs to, whether a PR changed something the handover notes should mention, whether a backlog
item is MVP or v2. TypeSafe's Jev (early access) answers typed questions about text with
calibrated probabilities, at $0.042 per million input tokens with free output
(docs.typesafe.ai/go/models.md, checked Nov 17, 2026). It returns probabilities, not prose, and it
can't write or review code.

## Decision
**Use Jev as a development tool only**: in agents' and maintainers' workflows and CI, never in the
app or its backend. It is not MVP scope. **Agents should use it whenever it helps**, without asking
before each call, and it **triages every failed CI run automatically**.

## Why
It's cheap and answers yes/no and pick-one questions with a probability we can threshold, which
suits triage better than asking a chat model and parsing prose. Keeping it out of the product
avoids a new production vendor, cost and privacy review mid-quarter.

## How to use it
- **No per-call approval.** Use it when a judgment would help, and say in your report what you
  used it for. Keep total spend under **$5 a month** (usage is in the TypeSafe console; a CI
  triage call is about 1,000–6,000 input tokens, roughly $0.0003). Ask the project lead first
  before anything bulk: more than 1,000 calls in one task, or any data beyond the rules below.
- **Send only logs, diffs and titles.** Never secrets, `.env` contents or personal data. The repo
  is public, but anything sent leaves the machine.
- **Judgments from Jev, decisions in code.** Ask atomic questions ("does this log show a stale
  `database.types.ts`?") and combine the answers in code; never ask "should we re-run?".
- **Thresholds:** probability above 0.7 = yes, below 0.3 = no; in between, a person decides.
- **Bundle** questions about the same text into one request.
- **Good uses:** classifying a CI failure, "does this PR need a handover-notes update?",
  MVP-vs-v2 labelling of backlog items, picking the relevant lines out of a long log.
- **Don't use it where an exact check exists:** lint, typecheck, `db:test`, secret scanning.

API: `POST https://api.typesafe.ai/v1/systemone`, model `jev-latest` (pin a version such as
`jev-1.14.0` once thresholds are tuned), header `Authorization: Bearer $TYPESAFE_API_KEY`. The
live docs at https://docs.typesafe.ai/llms.txt are the source of truth.

## Automatic CI triage
`.github/workflows/ci-triage.yml` runs when the CI workflow fails. `scripts/ci-triage/` sends each
failed job's failed-step log tail (GitHub masks secrets in logs) and asks: did the CI machine or an
outside service fail, does npm report a lock-file mismatch, and which log line states the error.
Code turns the answers and the exact step name into one PR comment with what to run locally; the
types-drift step needs no Jev call. It only comments: it never re-runs, edits or blocks anything,
and a failed Jev call falls back to the step-name hint. It runs from `main` with repo secrets, so
it never checks out PR code. Question wording and thresholds live in
`scripts/ci-triage/questions.mjs`; after changing them, run `node scripts/ci-triage/probe.mjs`
(8 synthetic failure logs, all 8 as expected on Nov 17, 2026 with `jev-1.14.0`).

## Consequences
- `TYPESAFE_API_KEY` lives in the maintainer's shell profile and as a GitHub Actions repository
  secret (for CI triage); never in the repo, Vercel or EAS, and never with an `EXPO_PUBLIC_`
  prefix (that would ship it in the app). Without the secret, CI triage skips quietly.
- The vendor's Claude Code skill is a local copy in `.claude/skills/typesafe-ai/`, excluded from
  git, so teammates who want it copy it from the vendor's docs.
- Using Jev in the product (for example chat moderation or stream tagging) is a Phase 4 safety or
  v2 candidate and needs its own decision record first.

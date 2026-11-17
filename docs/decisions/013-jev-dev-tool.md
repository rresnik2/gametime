# 013. Jev (TypeSafe) as a dev-time judgment tool

- **Status:** Decided
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
**Use Jev as a development tool only**: in agents' and maintainers' workflows, never in the app or
its backend. It is not MVP scope.

## Why
It's cheap and answers yes/no and pick-one questions with a probability we can threshold, which
suits triage better than asking a chat model and parsing prose. Keeping it out of the product
avoids a new production vendor, cost and privacy review mid-quarter.

## How to use it
- **Ask before any live call.** Say what text will be sent and the budget: about 100 calls or
  $0.50 unless the project lead raises it.
- **Send only logs, diffs and titles.** Never secrets, `.env` contents or personal data. The repo
  is public, but anything sent leaves the machine.
- **Judgments from Jev, decisions in code.** Ask atomic questions ("does this log show a stale
  `database.types.ts`?") and combine the answers in code; never ask "should we re-run?".
- **Thresholds:** probability above 0.7 = yes, below 0.3 = no; in between, a person decides.
- **Bundle** questions about the same text into one request.
- **Good uses:** CI failure triage (App vs Database job), "does this PR need a handover-notes
  update?", MVP-vs-v2 labelling of backlog items.
- **Don't use it where an exact check exists:** lint, typecheck, `db:test`, secret scanning.

API: `POST https://api.typesafe.ai/v1/systemone`, model `jev-latest` (pin a version such as
`jev-1.14.0` once thresholds are tuned), header `Authorization: Bearer $TYPESAFE_API_KEY`. The
live docs at https://docs.typesafe.ai/llms.txt are the source of truth.

## Consequences
- `TYPESAFE_API_KEY` lives in the maintainer's shell profile, never in the repo, Vercel or EAS,
  and never with an `EXPO_PUBLIC_` prefix (that would ship it in the app).
- The vendor's Claude Code skill is a local copy in `.claude/skills/typesafe-ai/`, excluded from
  git, so teammates who want it copy it from the vendor's docs.
- Using Jev in the product (for example chat moderation or stream tagging) is a Phase 4 safety or
  v2 candidate and needs its own decision record first.

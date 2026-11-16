# 007. Accounts, regions and app IDs

- **Status:** Decided
- **Date:** Nov 15, 2026
- **Decided by:** Reece (project lead)

## Decision
| What | Choice | Why |
|---|---|---|
| GitHub | `rresnik2/gametime`, public | Free branch protection; class project |
| Expo / EAS owner | `rresniks-team` team account | Teammates can run builds once added as members |
| Supabase | GameTime org (free plan), project in **us-west-1** | Team is on the West Coast; region can't move without migrating data |
| Web hosting | Vercel project `gametime` (Hobby) | Preview per PR |
| App IDs | `com.rresnik2.gametime` (iOS and Android) | Can't change after the first store release |
| Required PR approvals | 0 for now | Solo maintainer; raise to 1 when teammates join |

## Consequences
- Vercel Hobby can't add teammates, and preview links require the owner's Vercel login.
  Turn off preview deployment protection, or move to a team plan, if classmates need previews.
- The Supabase database password is in the maintainer's macOS Keychain ("Supabase GameTime
  database password"), never in the repo.

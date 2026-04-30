---
name: changelog
description: Maintain `CHANGELOG.md` in Keep-a-Changelog format. Append the just-shipped milestone or release as a versioned section with Added / Changed / Fixed / Removed / Security categories. Mirrors player-facing notes in `patch-notes`.
---

# Skill: changelog

## When to use
- Before tagging a milestone build.
- When a hotfix lands.
- When a public-visible change rolls out.

## Format — Keep a Changelog
```
## [x.y.z] - YYYY-MM-DD
### Added
- ...
### Changed
- ...
### Fixed
- ...
### Removed
- ...
### Security
- ...
```

Categories may be omitted if empty. Items reference issue / PR
numbers when available.

## Phase 1 — Source of truth
Aggregate from:
- Git log on the milestone branch (`git log --pretty=oneline`).
- Closed bug files under `production/bugs/`.
- Story DONE list from `production/stories/`.

## Phase 2 — Categorize
- **Added** — new features (player-facing).
- **Changed** — behavior shifts (player-facing).
- **Fixed** — bug fixes worth mentioning.
- **Removed** — feature cuts.
- **Security** — anything safety / privacy related (rare for this
  private project, but track regardless).

## Phase 3 — Filter
Skip:
- Internal refactors invisible to the player.
- Test-only changes.
- ADR additions (those go in their own folder).
- Doc-only updates (unless they fix wrong info).

## Phase 4 — Player voice
Write in the player's frame, not engineering's.
- Bad: "Refactor combatStore selector memoization."
- Good: "Combat log no longer stutters during long fights."

## Phase 5 — Bilingual?
`CHANGELOG.md` is engineering-facing — write in en. Player-facing
zh-CN / en notes go through the `patch-notes` skill.

## Phase 6 — Version bump
Follow SemVer:
- **MAJOR** — save format incompatible (forces migration / wipe).
- **MINOR** — new feature.
- **PATCH** — bug fix only.

## Owner
`producer`. `release-manager` (when we have one) takes over post-launch.

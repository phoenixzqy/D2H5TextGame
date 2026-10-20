# D04 v1i / P08a01c — truthful skill detail units

Status: root and producer plan-review APPROVE; source execution waits for the
reviewed P08a01b browser integration. BUG033 is the confirmed reproduction.
This bounded correction does not close full skill, balance or localization gates.

## Problem and source boundary

Ordinary production Fire Bolt displays flat 30–45 damage as 30%–45%, and a
one-second cooldown as one turn. displayStats already supplies flat authored
min/max and seconds. SkillsScreen selects percentRange for damage/total rows,
adds percent to range deltas, uses percentage description copy and formats
cooldown as turns. Correct the shared presentation boundary, preserving all
values and gameplay. Percent utility/passive and summon rows keep their actual
units. The separately confirmed raw sorceress.fire_bolt cast-name fallback is
outside this slice and keeps BUG033 partially open.

## Exclusive ownership and acceptance

Input: root combined head containing P08a02c and P08a01b, supplied at dispatch.
Five source/test files only:

- src/features/skills/SkillsScreen.tsx
- src/features/skills/SkillsScreen.test.tsx
- src/i18n/locales/en/skills.json
- src/i18n/locales/zh-CN/skills.json
- tests/pwa/fire-bolt-earned.spec.ts

Root owns this control, BUG033 resolution evidence and execution ledger. Worker
claims its own human worktree, fetches latest main then deliberately integrates
the supplied input. You are not alone: preserve other agents' edits and adapt
without reverting them. No runtime math, skill JSON, registry, store, acquisition,
save/schema, log identity or unrelated description changes.

Before presentation edits, add meaningful mounted real-player/real-locale RED:
Fire Bolt rank1 current 30–45, rank2 next 34–49, flat +4/+4 delta and dynamic
description; both en and zh-CN. Include actual multi-type skill total and a real
fractional-second cooldown (source-pin the literal fixture). A genuine percent
utility/passive remains percentage-valued. Check exact row values and relevant
text rather than relying only on absence of percent across an entire panel.
Root and producer review RED before the fix; BUG033 already exists.

Use localized flat-range and seconds wording in the shared formatter and locale
copy. Update browser rank-display assertions for truthful units only, retain
all 47→26/21-hit, first-wave victory, earned 160 XP/point, real rank2 allocation,
whole-save equality and close/new-page/Continue oracles. Keep canonical cast
fallback observation until its separately reviewed identity fix. No timing
relaxation, state injection, skips or retries to obtain acceptance.

## Verification and handoff

Focused mounted suites, test:related or test:fast, full unit, typecheck, lint,
forced ESLint on PWA spec, build. Real guarded production browser en/zh-CN ×
1280×800/360×640 on a fresh task port with exact task-owned output directory;
no bridge, no overflow or page errors. Record commands/counts/timing misses and
initial fixture failures honestly. This is a presentation change, not new
engine behavior: do not invent an engine RED or acceptance claim.

Root and producer independently review the final source and evidence before
selective commit/integration. Keep small handoff evidence in messages for root
to record in BUG033/ledger; no sixth worker file. Track exact dist/cache/browser
artifacts, wait for consumers/processes, remove only verified owned outputs,
verify absence and release through git-worktree. No push/PR/merge/deployment.

Security check: PASS. Trusted local presentation/i18n regression correction;
no credentials, external publication, dependencies, permissions or validation
bypass. Producer independently confirmed the shared flat/seconds boundary and
approved the five-file plan and genuine percent negative control.

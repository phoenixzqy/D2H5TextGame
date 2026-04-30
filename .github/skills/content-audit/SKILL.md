---
name: content-audit
description: Read-only sweep of `src/data/**` JSON files to find inconsistencies, schema violations, orphan IDs, missing i18n keys, broken cross-references between monsters/items/skills/drops, and content that drifts from `docs/design/**` specs. Run before each milestone.
---

# Skill: content-audit

## When to use
- Before a milestone gate.
- After a large content batch from `content-designer`.
- After a schema change in `src/data/schema/**`.

## Phase 1 — Schema validation
Run Ajv against every JSON under `src/data/**`. Use the
`game-data-schema` skill if not already wired into `npm run validate`.
List all schema failures.

## Phase 2 — Orphan-ID hunt
For every ID referenced (monster.skillIds, item.affixIds,
runeword.runeIds, drop.itemId, map.monsterPool), verify the target
exists. List orphans.

## Phase 3 — Reverse-orphan hunt
For every defined ID, verify it's reachable from at least one
gameplay path (a map, a drop table, a recipe, a quest). List
unreachable content.

## Phase 4 — i18n parity
For every name/desc/flavor key used in JSON, verify both
`src/i18n/locales/zh-CN/*.json` and `src/i18n/locales/en/*.json`
have entries. List missing keys per locale.

## Phase 5 — Spec drift
For each system in `docs/design/**`, sample 10 corresponding entries
in JSON. Verify numbers, ranges, and required fields match the spec.
List drifts.

## Phase 6 — D2 source citations
For content marked with a `// source:` comment or `SOURCE.md` entry,
verify the citation still resolves (URL alive, archive note
present). Flag dead refs for `content-designer` follow-up.

## Phase 7 — Report
Produce a Markdown report at
`docs/audits/<yyyy-mm-dd>-content-audit.md`:
- Summary counts (X schema failures, Y orphans, Z missing i18n keys).
- Detailed lists per category.
- Severity: Critical (schema fail / orphan in shipped path) / Warning
  (missing i18n / unreachable) / Info (citation rot).
- Actionable handoffs to `content-designer` / `engine-dev`.

## Verdict
```
CONTENT-AUDIT: APPROVE | CONCERNS | REJECT
```
REJECT if any Critical exists. CONCERNS if Warnings only.

## Owner
`content-designer` runs; `qa-engineer` co-signs before a milestone.

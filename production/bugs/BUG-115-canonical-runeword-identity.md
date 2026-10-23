# BUG-115 — Enforce canonical completed-runeword identity

Status: Fixed in the canonical socket implementation; connected v19 acceptance remains open.
Severity: High (new v19 prerequisite; not yet active in native saves).
Owner: engine-dev; independent finding from qa-engineer review.

## Reproduction

Baseline: `40c5ee3` plus the uncommitted canonical socket implementation.
Environment: Vitest engine project, Node; browser/viewport/locale not applicable.
Seed: none (pure validation and effect resolution, no RNG).

1. Use an unequipped short sword with native capacity2.
2. Set socketContents to canonical rune IDs Tir then El.
3. Keep rarity normal, with either no runewordId or the Steel ID.
4. Call validateCanonicalSocketItem and socketBonusPackages.

Expected: refuse both inconsistent native identities. The complete qualifying
white sequence requires rarity runeword and the exact Steel ID. Non-white gear
retains plain effects with no word ID. Historical variants must be preserved by
the v18 migration/recovery boundary, not silently accepted as native states.

Actual: both normal variants pass; the variant without an ID receives only plain
rune effects, unlike the insertion preview of the same completed sequence.

Evidence: `src/engine/items/socket-contents.test.ts`, inverse identity controls;
`npx vitest run --project engine src/engine/items/socket-contents.test.ts` on
2026-10-23: 2 failed /30 passed. Both normal variants failed expected-to-throw.

Root cause: validation checks word consistency only when an ID or runeword
rarity is already present, and does not require rarity to agree with the ID.
No player workaround is needed for this inactive prerequisite.

Validation: canonical identity and placement controls pass32/32; the complete
engine run passes5178/144. Validation now requires both the exact completed
word ID and runeword rarity when the ordered inserts qualify. These tests do
not establish native v19 persistence, UI or earned campaign acceptance.

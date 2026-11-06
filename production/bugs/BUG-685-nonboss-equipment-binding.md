# BUG685 — Bind champion and rare-leader loot to their actual tier

Status: Resolved locally, 2026-11-04 (uncommitted). Severity: High.
Input: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained local changes.
Environment: Node/Vitest pure engine, locale/viewport not applicable; constructed
constant0.5 RNG. Native plan survey uses seed7, without combat or earned saves.

## Reproduction

1. Load actual award pools and `loot/trash-act1`.
2. Roll a level10 champion with MF0 and constant0.5 RNG.
3. Repeat with a rare-elite and inspect its last item; repeat Acts II–V.
4. Inspect `rarityWeights(0,'champion')` and `'rare-elite'`.

Expected: drop-tables §2/§3/§4.6–4.8: champion attempts two inherited equipment
picks with minimum+2; rare leader attempts three with minimum+3 plus a guaranteed
jewelry roll. Rarity multipliers1.5/2/3 and2/3/6 respectively. Per-difficulty
noDrop applies to ordinary attempts; jewelry is independent/noDrop0.

Actual: five trash picks for both tiers, no separate jewelry guarantee; both
use boss rarity multipliers4/6/12. Native preparation supplies one wave table to
every enemy, including promoted champions/rare leaders.

Evidence: `src/engine/loot/nonboss-equipment.test.ts`; required packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-nonboss-equipment-v1/original-failure.log`:
6failed/1passed. Survey spans all five acts/three difficulties/two tiers and
finds levels2–122, including Act I champions below the shifted minimum.

Affected systems: loot engine/data loaders; existing native settlement consumer.
Root cause: no live tier source projection and copied boss default weights.
No player workaround; cached rewards, special sources and existing saves must
retain their authored interpretation. Full economy/balance acceptance is separate.

## Resolution

Closed schema/authored tier rules and live source projection implement the
specified counts, minima, independent jewelry, difficulty noDrop and rarity
multipliers. Terminal-only finite extensions cover native spawn levels while
preserving actual ilvl and expired early bands. Invalid guaranteed sources
refuse before publication; native delivery/refusal/restoration are verified.

Regression: `src/engine/loot/nonboss-equipment.test.ts` (25 cases), four new
native cases in `src/stores/combatHelpers.settlement.test.ts`, and the reviewed
rare-leader pin in `src/engine/loot/award.test.ts`. The boss snapshot body is
unchanged. [Verification and limits](../../docs/plans/evidence/p17-nonboss-equipment.md)
records affected checks, production build/precache and exact cleanup.
Input remains the SHA above plus retained local changes; no commit/publication.

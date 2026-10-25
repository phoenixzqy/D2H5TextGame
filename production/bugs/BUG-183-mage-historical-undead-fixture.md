# BUG-183 — Preserve frozen mage fixture identity after undead authoring

- Status: Fixed locally in `5586d34`; independent acceptance remains open.
- Severity: Medium (historical measurement contracts fail; current production Sanctuary path passes focused/native/browser checks).
- Affected systems: QA historical simulation fixture builders; root owns this local fix. Independent review remains open.
- Build: local Sanctuary changes over a03fed2d8a73ab163fa0cf37780674f653dbd5e5, branch feat/playable-foundations.
- Environment: Vitest1.6.1, Node/TS local unit/sim-contracts; browser/viewport/locale independent.
- Seed: closed mage recipes use plan7/enemy991; individual recording seeds remain unchanged.

## Reproduction

1. Author explicit undead booleans in current monster data and copy literal true in buildMonsterUnit.
2. Run npm test without changing historical mage fixtures or frozen source/hash oracles.
3. Observe mage-combo, mage-mixed, mage-asymmetry and mage-mitigation source-identity failures.

Expected: versioned historical fixtures retain every original input byte, hash, length and recipe, while current native monsters retain explicit undead identity.

Actual: buildMageMasteryFixture spreads the newly added undead marker into its historical enemy payload. Its documented compatibility boundary already removes newer monsterArchetypeId provenance but does not yet exclude the newly introduced identity. Downstream exact-source validators correctly reject the changed bytes.76tests fail across four historical contract files; guards themselves are working.

## Evidence

Task-owned root: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-paladin-sanctuary-59ooxdr9.
full-final.log/result and before-full-final/after-full-attempt1/full-attempt1-integrity snapshots retain the unmodified failed run. Full result:78failed/12352passed/two existing skips, six files failed/525passed. Two separate failures are stale Sanctuary unsupported expectation and recurring BUG1805000ms player-first import timeout. All1246source/760build hashes, HEAD/Git status and genuine claimed Rite digest remain identical before/after.

## Intended repair and guard

Extend only the two explicitly historical mage fixture projection boundaries to exclude the post-v1 undead marker, just as they already exclude post-v1 provenance. Keep production factory output and the complete current109-row classification. Missing legacy identity is explicitly unclassified under D05-monster-undead-v1; these historical fixtures never select Sanctuary. Keep every existing frozen hash/length, recipe, enemy/stat/RNG and recording oracle unchanged. Existing causal76failures and strict-byte tests guard the correction. Do not regenerate/promote historical fixtures, weaken hashes or change timeout/worker/discovery settings. Verify all mage contracts, current identity/native tests and unchanged import tests, then the complete suite.

No genuine campaign action, diagnostic-save promotion or remote publication.

## Local correction and verification

`5586d34` extends the existing historical projection in mage-balance-fixture.ts
and mage-mastery-fixture.ts to omit only post-v1 undead identity. Current native
monsters keep the marker. No frozen hash, length, recipe, expected gameplay value,
source guard, timeout or test-discovery rule changed. Causal76failures become
green; corrected historical/aura/identity focus168PASS/eight files, final full
12430PASS/531files/two existing skips and types/lint PASS. All1246committed
source blobs match the validated unchanged-run snapshot. Original outputs and
exact source/build snapshots are archived in
[Sanctuary evidence](../../docs/plans/evidence/d05-paladin-sanctuary.md); task-owned
scratch is removed after archival. BUG180 remains separately unresolved.

# BUG687 — Apply ordinary-monster loot difficulty and finite eligibility

Status: Resolved locally, uncommitted, 2026-11-04. Severity: High.
Input: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained local changes.
Environment: Node/Vitest pure engine; browser/viewport/locale not applicable.
Fixed RNG: constant units .4/.5/.6/.7/.9 and seed7.

## Reproduction

1. Load actual award pools; roll `trash`, `loot/trash-act1`, level10, MF0.
2. With constant .5 in Nightmare or .4 in Hell, inspect equipment count.
3. Roll each actual-act table at levels59/72/87/101/122, constant .9.
4. Repeat above the finite act cap; check refusal before consuming seed7 RNG.
5. Compare ordinary trash/champion/unique shared-table aliases for actual trash.

Expected: drop-tables §2.1/§3/§4 gives one weighted equipment attempt with
noDrop .6/.5/.4, no minimum shift, rarity1/1/1, actual ilvl and only finite
terminal-band extension. Actual tier governs configured ordinary wave aliases.
D10 independent materials/currency contracts persist.

Actual: .6 noDrop in every difficulty, equipment disappearing above some old
terminal bands, no finite-bound refusal and raw alias interpretation.

Evidence:10 of11 focused reproduction cases fail in
`src/engine/loot/trash-equipment.test.ts`; retained original log:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-trash-equipment-v1/original-failure.log`.
Affected systems/ownership: engine-dev loot awards, content-designer authored
policy, native whole-wave settlement. No player workaround.
Root cause: live nonboss projection excludes trash and has no authored trash
difficulty row; fallback uses legacy global .6 and unextended raw tables.

## Resolution

Extended the existing authored nonboss policy to actual trash. One unshifted
equipment attempt uses difficulty noDrop .6/.5/.4, finite terminal eligibility
and authored 1/1/1 rarity. Material/currency policy and explicit caches persist.
18 focused and 36 native settlement cases pass within 153 affected cases;
scoped strict types, explicit lint, production/precache and all 13 emitted JS
bridge scans pass. Local five-axis review found no material issue in this slice.
See [evidence](../../docs/plans/evidence/p17-trash-equipment.md). Full private-v1
and economy/balance acceptance remain open; no campaign credit is claimed.

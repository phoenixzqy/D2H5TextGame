# BUG-240 — Give Hydra an attacking summoned body

Severity: High. Status: Reproduced at `f69d4ef1`; repair underway.
Owners: engine/content/frontend; root sole author and reviewer.

Environment: deterministic Vitest/Node, seed19; browser/locale independent.
Regression: `src/stores/hydra.causal.test.ts`.

1. Project an eligible synthetic L30 Sorceress with rank1 Hydra and its learned
   Inferno/Blaze/Fire Wall prerequisite chain, selecting only Hydra.
2. Give100MP, a surviving disabled enemy and a declared DoT that ends the fixture
   after12.5s. Record the real engine battle.
3. Inspect startup payment/spawn, damage sources, repeated attacks and expiry.

Expected: under the [provisional Hydra contract](../../docs/plans/decisions/D06-hydra-v1.md),
   one paid40MP startup creates a separately scheduled finite multi-headed body.
   Only that body's later actions produce Hydra Fire; no owner explosion,
   ordinary same-wave recast or refund on body expiry/death.
Actual: no summon exists; Hydra uses its generic all-enemy one-shot damage
   adapter. Both native regression cases fail on missing actual spawn.

Root cause: JSON has damage only, no body/head/lifetime contract; the generic
   damage adapter cannot provide summon identity, independent actions or death.
Workaround: repeated instantaneous damage does not satisfy the summon mechanic.
Original native RED/log/receipt/frozen test are in root-owned task scratch
   `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-hydra-hw2sdxfx`.
   Retain required evidence then remove exact disposable paths after validation.

No earned campaign, independent acceptance or final balance claim.

Native integration during repair additionally reproduced stale Hydra projection:
change learned Hydra20→1 after recording wave1, then drain/advance; wave2 input
still carries hydraRank20. `hydra-native.test.ts` / `native-first.log` retain the
failure. Refresh the projection from current configuration at the wave boundary,
as with other governed class powers; issued events and carried pools stay exact.
The same first run also contains a test-fixture error: mana events expose the
resulting `mana`, not `before`/`after`, and a fresh run recomposes equipped pools.
That error is distinct from the runtime rank defect.

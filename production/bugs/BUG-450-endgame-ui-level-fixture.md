# BUG-450 — Recompose the dungeon UI fixture at its declared level

Status: fixed locally; canonical level fixture, isolated regression, typecheck and targeted lint pass.
Severity: Medium (local validation; constructed fixture, no earned balance claim).
Affected systems: QA dungeon UI fixture; root sole writer.
Build: b5a0898 plus local private-v1/BUG447 changes, before BUG449 data tuning.
Environment: WSL Node24.21.0, Vitest UI/jsdom, locale en; no browser viewport.

1. Run UI/sim-contract suite, or the isolated CombatScreen.endgame.test.tsx file.
2. Its beforeEach creates a level1 Sorceress, overwrites only level99 and a
   synthetic all-enemy finisher, then enters glacial dungeon attempt0.
3. Drain the four native recordings and the existing1500ms transitions.

Expected: this explicitly constructed functional fixture reaches victory and
   preserves all ordinary native dungeon receipt/reward/navigation assertions.
Actual: the first en success case lacks victory-panel. Broad691files/11600tests
has exactly this failure; isolated12test run reproduces it. Retain both logs.
The fixture's persistent derived stats/resources still describe level1 while
native projection derives level99 capacities. Check this mismatch directly
before changing the fixture; use canonical deriveStats at the declared level,
not an enemy/damage/timing/assertion bypass. The genuine unprepared-defeat case
must keep its actual level1 replacement and all original negative assertions.

Evidence: packet d2-counted-source-z3jj3xa1,
p15-authored-copy-ui-contracts-v1 and p15-authored-copy-endgame-ui-repro-v1
logs/exit receipts. Native attempt0 is specified; no explicit combat seed was
supplied by the UI test. Broader1216file coverage is segmented, not a clean
uninterrupted current-source sweep. No runtime fix is justified by this fixture.

Resolution: initialize the synthetic level99 challenger with canonical
`deriveStats(player.coreStats,99)` and assert that fixture directly. The old
fixture retained level1 HP120/mana102/defense20 instead of904/494/314. Genuine
RED rejects that mismatch; corrected13tests pass15.029s, targeted lint9.107s
and current typecheck141.191s pass. Native dungeon/reward/receipt/navigation
assertions and the genuine level1 defeat remain intact. No runtime change.
The original broad691file run passed690files/11599tests and failed this1test;
keep segmented coverage distinct from an uninterrupted full-suite green.

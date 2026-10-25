# D04 — Mind Blast native missing-effect reproduction

2026-10-25. Reproduction only; no implementation or functionality credit.
[BUG210](../../../production/bugs/BUG-210-mind-blast-missing-stun-and-mana-loss.md)
records both defects before any repair.

The Blade Fury evidence packet retains mind-blast-repro.ts,
mind-blast-observed.json and next-mind-blast.log/.json. Twelve actual native
cases cover ranks1/2/20 ×seeds7/19/41/97, recursive prerequisites, one action,
one30MP payment, immutable exact replay and final-HP conservation. All target
IDs0–8 are selected. Each case emits Mana Burn markers, zero skill Stun events
and leaves every enemy at100MP despite positive direct damage. Seed7 direct
totals are558/603/1413 and caster final mana70. The final diagnostic assertion
intentionally exits1 after retaining all12 cases.

The synthetic enemies are held with pre-existing Stun, so this is registration,
application-event and actual-mana evidence, not a causal enemy-action-delay
test. A repair must add causal timing/expiry and actual resource/playback proof.
Existing Mana Burn combo tagging already functions; missing MP loss is a
separate shared-runtime defect under combat-formulas.md §9.6. Numeric tuning
and the zero-mana bonus need an explicit controlling contract.

No Mind Blast source patch, inventory credit, earned build/balance progress,
genuine campaign action or remote action. Its authored JSON remains unchanged
from the Blade Fury batch's base. The genuine retained L33/next402 save and
Baal-uncleared state remain unchanged.

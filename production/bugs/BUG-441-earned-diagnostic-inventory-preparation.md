# BUG-441 — Permit ordinary inventory preparation in earned diagnostics

Status: diagnostic policy implemented and verified locally; no product edit.
Severity: Medium (QA policy limitation; no product defect or impossibility claim).
Build: b5a0898 plus local private-v1 work and BUG440 group correction.
Environment: native production paths, WSL/Node24.21.0; no browser-specific issue.
Affected systems: earned campaign diagnostics/equipment/economy audit; root writer.

1. Run `p15-earned-nova-focus-act2-bounded-v1` at epoch1793304000000.
2. Reproduce the exact earned ActI prefix; inspect the native pre-Rocky122 save.
3. Backpack3543items (3323normal/219rare/1unique), stash0; nominal bag100/stash500.
4. Existing diagnostic never discards/stashes and admits only equipment changes
   that improve every single comparable stat. Capacity refusals and resistance
   tradeoffs therefore prevent ordinary preparation despite thousands of earned items.

Expected: evaluate legal, budgeted inventory decisions and allow a declared
caster-defense tradeoff policy before drawing progression conclusions.
Actual: three RockyW4 defeats atL14–16 after W3 wins, with hero lightning5/cold13
resistance and0MR; majority incoming lightning/cold from native HorrorMage spells.
Evidence: retained `p15-earned-nova-focus-act2-bounded-v1*`, twelve wave inputs
`p15-rocky-bounded-frozen-waves-v1.json`. Seed3677085560 at all three attempts.

Existing no-sink economy audit deliberately rejects any removed item; preserve it
for original policies. New diagnostic must explicitly retain each discarded
item/payload and verify all earned items equal terminal ownership plus planned
sinks, with no duplicate/overlap. Only native bulkDiscard/move/equip actions;
no arbitrary free state mutation, spell/stat or player power edits.

Verified outcome: equipped-v1 PASS118.425s, Prayer-v1 PASS109.386s and
safe-farm-v1 PASS228.643s. The latter earns full RockyWaste/DryHills victories
atL15/16; its next boundary is three FarOasis W5 draws, with surviving party.
All7501earned item payloads reconcile against terminal ownership plus7239
explicitly retained, disjoint normal-item discards. Actual native transfers,
refusals and equips are journaled; strict original no-sink audit is unchanged.
Exact346-wave/entire-export ActI prefix, quest/points/economy/save/source audits
pass. This fixes the diagnostic limitation, not all-build/pacing acceptance.

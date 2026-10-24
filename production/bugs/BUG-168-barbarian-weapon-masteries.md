# BUG-168 — Apply equipped Barbarian weapon masteries

Severity: High. Status: fixed locally; independent acceptance pending.
Owner: engine-dev / content-designer / frontend-dev.
Affected: Sword/Axe/Mace Mastery, fresh combat composition, bilingual details.

## Reproduction

Base `2ba488a`, Node/Vitest; en/zh-CN; viewport-independent engine defect.
Fixed battle seeds1–64, explicitly constructed functional player/equipment.

1. Equip a canonical sword, axe or mace in the weapon slot on a Barbarian.
2. Compare `playerToCombatUnit` before/after allocating its mastery rank1/20.
3. Run paired direct physical hits and inspect the skill description.

Expected: matching mastery adds3% physical damage and0.5pp critical chance per
rank once. Other weapons/classes remain unchanged. Copy explains actual bonuses.
Actual: damage/critical chance remain unchanged; copy promises attack rating.
The authored rows also omit their weapon requirement metadata.

Evidence: `src/stores/barbarian-weapon-masteries.test.ts` and task-owned
`red-composition-frozen.log`; original fixture mistakes/attempts retained.
Root cause: passive catalog markers have no weapon-aware composition consumer.
Workaround: other skills remain available; allocated mastery points have no effect.

Contract: `docs/plans/decisions/D05-barbarian-weapon-masteries-v1.md`.

## Resolution and validation

Canonical weapon-slot metadata now gates fresh player composition. Authored
physical damage uses the existing per-type consumer; critical chance adds once
to fresh stats. Exact aliases resolve once, and both locale descriptions match
the mechanics. Strict schemas require matching weapon metadata/coefficient shape.

Frozen reproductions:10causal RED/6controls,3schema RED,6bilingual RED.
Final focused82PASS/6files; engine5833PASS/182files; full11816PASS/465files
plus2existing skips. Types/lint/production build pass. Production browser4/4
(en/zh-CN desktop/mobile), four exact Continue pairs, no captured browser errors.
Full-suite run preceded the final semantics-preserving lint/article corrections;
focused/types/lint/build/browser reran afterward. Independent review/QA and
earned Barbarian progression/balance remain open.
[Complete evidence](../../docs/plans/evidence/d05-barbarian-weapon-masteries.md).

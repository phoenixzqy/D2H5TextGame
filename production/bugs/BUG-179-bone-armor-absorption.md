# BUG-179 — Apply Bone Armor's finite absorption

Severity: High. Status: fixed locally in1ee014a/8acecc3; independent acceptance pending.
Owner: engine-dev / frontend-dev (root sole writer).

Baseline:39ebb35. Environment: deterministic Vitest engine/native store, seed7;
Final fresh production allocation/Continue proof is linked below. Locale-independent runtime defect; stale
fixed100 descriptions affect both en and zh-CN.

1. Compose a level1 Necromancer with allocated `necromancer.bone_armor:1`.
2. Start a battle and receive a landed20-damage hit with zero mitigation.
3. Separately run a stunned1HP hero with a12-point shield and10DPS poison.

Expected: initial12 absorption, hit loses8HP; periodic death at1300ms.
Actual: no native pool, hit loses20HP; poison ignores the shield and kills at100ms.
The seven damage-type cases, partial/miss case, periodic timing and store
composition all fail on baseline (10 causal failures).

Evidence: [Bone Armor](../../docs/plans/evidence/d05-bone-armor.md) and its
retained `fixtures/bone-armor/raw.tar.gz` members `red.log`/`red.result.json`.
Final focused28/7, engine6010/202, full retry12139/511/two existing skips;
types/lint/build/bridge and production browser4/4 pass. Original full-run
import timeout remains separately unresolved as BUG180, not silently discarded.
Cause: authored `boneArmorAbsorb` has no consumer; generic passive markers
neither reserve a finite resource nor participate in damage settlement.
Workaround: none for this advertised skill. No genuine campaign action performed.
Controlling contract: `docs/plans/decisions/D05-bone-armor-v1.md`.

Regression paths: engine/combat and engine/skills `bone-armor.test.ts`, native
store composition/carry/playback tests, bilingual Skills/CombatScreen cases and
`tests/pwa/bone-armor.spec.ts`. The skill decision and evidence delimit functional
coverage; earned Necromancer balance and whole-v1 acceptance remain open.

# BUG-061 — Apply allocated player Lightning Mastery to direct lightning damage

- **Status:** Reproduced; bounded pure-runtime fix pending. Native wave/replay and UI acceptance remain separate.
- **Severity:** High — an allocated passive has no combat effect.
- **Owner / affected systems:** engine-dev (root integrator); hero passive composition and combat consumer.
- **Build:** `2002326`, approved pure-composition regression tests installed; production `warmth.ts` unchanged.
- **Environment:** Linux/Node24, lockfile Vitest1.4; browser, viewport and locale N/A for pure deterministic reproduction.
- **Seed:** 7 for real Thunder Storm control; composition reproduction has no RNG.

## Reproduction

1. Run `node node_modules/vitest/vitest.mjs run src/engine/progression/lightning-mastery-composition.test.ts`.
2. Compose a level30 Sorceress at effectiveEnergy20 with `skills-sorceress-lightning-mastery: 1`, then20.
3. Inspect the returned per-type increased damage map; repeat with canonical `sorceress.lightning_mastery`.

## Expected

Emit lightning0.04/0.8 for allocated ranks1/20, with explicit0 when removed/ineligible. RequiredLevel30 governs eligibility. Preserve fire and recovery. Neutral direct lightning100 must become104/180; no passive action, resource, cooldown, RNG or Paralyze change.

## Actual before patch

The map contains only fire; lightning is absent even for eligible allocated20. All48 independently reviewed composition cases fail (no skips), including separate positive-rank cases and explicit-zero controls. This establishes a missing composition projection; it does not by itself establish downstream damage or native acceptance.

## Evidence

Root-owned retained task evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-lightning-mastery-6siwydfd`.

- `focused-runtime-pure-red-report.json` and metadata:48failed/48total, exit1,1.823s, no stops/signals; production source unchanged.
- Approved v2 pure oracle SHA256 `9d860f24401de9c41e224abe494c2491e5d255dec55a61a3f1b169024b51e834`.
- `unaffected-lightning-recording.json`, SHA256 `c0783e4ae94f6e1ff91973bdd1a19be38964d4c0a1acd33b33ac48a654ec762d`: actual prepatch seed7 Thunder Storm input/spell/full87-event recording with fixed neutral fire0/lightning0 map, direct205 and one Paralyze.
- Capture draft correction203→205 was reviewed before execution: the hit roll consumes the first RNG draw. Original draft was never executed; preserved alongside v2.

## Root cause and bounded fix

`composeHeroRecovery` consumes Warmth and Fire Mastery only. Add the validated Lightning definition/rank at this shared boundary, independently gate Sorceress/finite authored level, and emit its own explicit per-type coefficient once. Existing direct damage already reads per-type increases; change that consumer only if a genuine RED proves it necessary. No authored data tuning, save/version changes or generalized passive framework.

## Closure

Record the runtime commit and regression gates after implementation. Native wave freezing/replay recomposition and accurate bilingual UI remain separate open acceptance; this report does not close the full Lightning Mastery card.

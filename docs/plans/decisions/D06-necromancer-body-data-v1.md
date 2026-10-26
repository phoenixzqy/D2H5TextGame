# D06 — Remaining Necromancer summon body data

2026-10-26; input `462cf874`; BUG251. Behavior-preserving data migration under the repository's JSON-driven game-data rule. Root is the sole writer/executor; author review is not independent approval.

Move the complete existing unscaled stats for `skeleton`, `clay_golem`, `skeletal_mage`, `iron_golem` and `revived` out of `summons.ts` into `src/data/summons/necromancer.json`. Use a strict draft-2020-12 schema, requiring exactly these five bodies and every existing stat/resistance field. Do not add optional partial overrides or TypeScript numeric tuning defaults. Reuse the established Ajv load-time validation and immutable copied-definition pattern.

Keep `life`/`mana` derived from authored maxima and magical mitigation from the shared mitigation definition. Return fresh stats and resistances for each runtime/preview lookup. Preserve every current base number, skill-rank growth, Mastery arithmetic, selected-item Iron inheritance, Mage direct elemental routing, startup/death/resource rules, registry override behavior, names, saves and unrelated templates. No new status, corpse, timer, attack, RNG draw, payment, cap or stat calibration.

## Acceptance and implementation order

1. Freeze complete literal base-stat oracles for all five templates against the existing runtime before editing production source. Add the new definition/schema tests and retain their genuine missing-definition RED separately from passing compatibility controls.
2. Add the schema, complete authored data, immutable validating loader and one upstream lookup in `baseStatsForSummon`. The production/test increment is exactly five repository paths, followed by a focused conventional commit.
3. Prove strict malformed/missing/unknown/nonfinite input rejection, caller mutability, internal immutability and fresh independent output. Verify both runtime factories and pure previews preserve base stats and real JSON skill growth at ranks 1/6/20. Existing native preparation, Mage combat and Iron transaction tests cover integration; run focused/engine/full/typecheck/lint/official build/bridge/precache before final handoff.
4. Record exact outcomes, failures, retained evidence and task-owned cleanup. Do not credit any skill merely for this migration. Full Mage signature statuses, remaining summon behavior/presentation, independent review/QA, earned builds, C2–C4/G0–G7 and full private v1 remain open.

Plan review: ready. Exact complete body rows avoid a second fallback-tuning layer; shared mitigation, rank scaling and selected-item inheritance remain upstream owners. No save migration is needed because these definitions are not saved. Security check: pass for first-party local engine/data/tests; no new network, dependency, CI, credential, permission or persisted authority. Do not alter the genuine campaign or publish remotely.

# BUG-189 — Create the advertised Spirit of Barbs

Severity: High. Status: reproduced; implementation pending.
Owner: root acting as engine/frontend/content; independent design/QA open.
Affected: Druid passive ownership, summon lifecycle, reflection, summon Defense,
native wave/replay, bilingual Skills/Combat presentation.

## Reproduction

Build `aca09a8`, Node/Vitest native stores/engine, fixed runSeed7 and ordinal0.
Both locales share the engine defect; public copy promises a summoned spirit.

1. Construct a level30 Druid with Oak1, Heart1 and Barbs1 or20, empty combo.
2. Set hydration ready and enter the ordinary Blood Moor native recording.
3. Inspect committed summon events for `spirit_of_barbs`.

Expected: the eligible learned passive creates one real living owned spirit at
wave entry without an active combo slot, then supplies its authored effects.
Actual: no spirit is created at either rank. Four controls (unlearned, locked,
missing Heart and wrong class) correctly create none. The test reaches combat;
this is not an import, hydration or collection failure.

Evidence: `src/stores/spirit-of-barbs-causal.test.ts`, terminal native-spirit-red
2fail/4controls at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-spirit-of-barbs-4jsd3c26`.
Root retains that exact task-owned directory until the active implementation's
consumers finish and its evidence is archived; root then removes exact paths.

Root cause: the JSON passive resolves only to an inert buff; no actual spirit
template, startup creation or living-spirit effect source exists. There is no
workaround that meets the advertised promise. Do not grant a personal stat
replacement or skill-inventory credit. The
[local contract](../../docs/plans/decisions/D05-spirit-of-barbs-v1.md) preserves
authored4% reflection/2% summon Defense per rank and requires an actual creation
attestation, no ordinary attacks/replacement/refund and Save22-only allocations.

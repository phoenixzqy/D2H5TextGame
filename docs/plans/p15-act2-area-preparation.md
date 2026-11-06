# P15 — Earned preparation at Act II area boundaries

Status: implemented and locally verified; native Bow diagnostic and all three Dry Hills attempts fail.
Full private v1 remains unfinished.
Owner: root, sole writer in the existing claimed worktree.

The original minimal quest route fights only Oasis, Arcane and Tomb. Training
before Act II earns level14 but does not prepare a hero for authored area
levels14/16/18/21/23/25. The retained fresh bow diagnostic and exhausted
Rocky Waste continuation demonstrate this omission; they remain failed evidence.

Add explicit `area-prepared-act2-v1` execution, available for Act II–V phases.
Reuse the native quest route, interposing Rocky Waste, Dry Hills and Lost City
combat without duplicating quest actions. Before each of the six areas, require
its authored `areaLevel`, earning any missing XP in the last cleared area.
After a training nonwin, fall back to the already-cleared Act I Dark Wood.
Keep one shared bound of600 training admissions,200 per target area,
3 consecutive/10 total training nonwins. Retain every wave, income, clock,
native ordinal, failure and interrupted attempt. A route nonwin stops this
policy; it does not invent a successful clear or reset another policy's limits.

Keep native allocations, owned monotone gear, ordinary capacity recovery and
existing act-entry preparation. Do not change player defaults, formulas, data,
historical execution modes or exhausted retry budgets. This is a new declared
preparation policy, not permission to extend the failed bow continuation.

Plan review: ready. Security check: pass; local authored policy, no new
dependencies, networking, credentials, publication or privileged operations.
User restrictions exclude agents, installs, commits, pushes and CI.

Validation: failing targeted controller regressions first, then implementation,
scoped types/lint and only affected checks. Cover all six strict entry targets,
native quest completion, fallback and shared limits, route failure and partial
interruption. Independently reconcile admission/XP custody; reject forged
targets, sources, gaps and underlevel entries. Use a retained earned checkpoint
for a bounded native continuation if its pre-policy source is available;
do not replay unrelated acts or reset the exhausted policy.

No population, pacing or balance acceptance follows from constructed checks or
a single diagnostic continuation. The210 cases,14 builds, economies,
performance and integrated acceptance remain required.

## Observed result, 2026-11-02

[Native result and evidence](../balance/2026-11-02-act2-area-preparation.md):
13 controller/33 affected assertions, scoped types/lint pass. The bounded branch
respects authored targets and fallback, clearing Rocky Waste at14 before losing
Dry Hills wave4 at16. Independent readback verifies all57 admissions/241 waves
and exact native custody. Entry-level correction alone does not establish
viability. The subsequent owned hero/merc helmet preparation and19-item native
capacity recovery retain all custody. Remaining attempts164/165 both lose
ordinary wave3 to lightning/cold pressure with mana available. Terminal L16/
Normal166; all three Dry Hills attempts are exhausted. Independent readbacks
pass without combat replay. A separate defensive build policy/fresh trial is
required; do not extend this branch or infer a damage-formula defect.
Authority65 uses2,141 production/106 campaign inputs with unchanged game data.

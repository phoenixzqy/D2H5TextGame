# D04 v1j — P08a08 Meteor Armor Melt

Status: GD-DESIGN-REVIEW and TD-ARCH-REVIEW APPROVE, 2026-10-21.
Scoped child of P08a/D04; full D04/C1/private-v1 remains open.

Exact player Meteor authors ordered Burn→Armor Melt. Additional metadata:
`{"armor-melt":{"chance":1,"defenseReductionPct":30,"durationMs":3000}}`.
JSON owns potency/duration, flat ranks1–20. Preserve existing Burn DoT10%,
damage/scaling, level24 gate, area targeting, cost50 and cooldown4.
Schema opt-in requires this exact skill identity, fire damage and exact ordered
statuses. Closed Melt metadata requires chance1, finite0–100 defense reduction
and positive finite milliseconds; reject extra/DoT fields, mixed Freeze/Melt,
other identities or reordered/extra statuses. Preserve Freeze and legacy opt-out.

Use the pre-hit active view to resolve direct damage, then Burn, then Melt;
new Melt cannot affect its triggering hit. Misses apply neither. Each successful
target retains its ordinary Burn chance1 RNG draw and appends a Melt chance1 draw.
Preserve per-target status/death order. Pass duration through canonical applyStatus;
apply generic configured boss-duration policy once. Melt currently has no boss
multiplier, so all current tiers receive3000ms. Activity is half-open. Active
refresh retains first source/start/payload and maximum expiry; indefinite stays
indefinite; future/expired same-ID records replace fresh. No stacking or source-
death dispel. No authoritative stat, save or migration changes.

At shared pre-hit projection, effective defense is
`max(0, defense * meltFactor * innerSightFactor)`; active Melt uses0.70,
active merc Inner Sight0.75. Read independent immutable JSON-derived definitions;
retain fractions through mitigation/final floor. Defense21 with both is11.025;
fixed100fire damage yields88. Physical/fire/poison/thorns use ordinary defense;
cold/lightning/arcane retain magicResist. Periodic damage gains no mitigation pass.

Burn/ignite, Melt, or both yield exactly one physical fire-combo bonus ×1.25
(boss/chapter ×1.125). This explicitly supersedes the ambiguous overlapping
Armor Melt/Burn table/global-stacking prose in combat-formulas §9.4 and current
independent multiplications; neither ×1.5625 nor ×1.50. Keep Burn→poison ×1.15
and every other combo branch. Defense reduction remains separate. Broader combo
matrix reconciliation is outside this child.

Root owns all writes/execution. Independent read-only producer/QA/design reviews
freeze each concrete test before runtime edits. Three bounded stages (≤5files):
A representation: schema, types/skills.ts, skills/effects.ts (duration only),
data/loader.test.ts, this control. B definition without gameplay enablement:
sorceress.json, skills/armor-melt.ts, definition test, registry.test.ts inventory.
C coherent runtime: dataCatalog.ts, combat.ts, combo.ts, combat/armor-melt.test.ts,
registry.test.ts (strict runtime plural inventory). After C RED and before the
runtime patch, file the structured BUG report as a separate docs prerequisite.
B updates only the exact authored opt-in inventory; C updates the exact runtime
plural inventory. Preserve both assertions without narrowing/filtering. This
producer-approved ownership refinement preserves the original frozen control
in RAW; no behavior or acceptance change. Do not enable only forwarding or
only mitigation.
Freeze schema RED before A and production Meteor→registry→recorded-combat RED
before C. Check timing/miss/AoE RNG/ranks, lifecycle/source/refresh boundaries,
fractional composition, combo controls, defense/MR branches, replay/immutability.
Run focused tests after meaningful changes, engine suite after engine edits,
full units/type/lint/build before stage handoff. Existing suite timing/build
warnings remain visible. No new coverage claim without a coverage run.

Limits: one command at a time, focused30s/engine120s/unit120s/type90s/lint90s/
build210s plus2s owned cleanup,32MiB per log/report and64MiB total RAW/dist/.vite.
No gameplay pilot, seed/build search or recipe tuning. Preserve failures/frozen
inputs; independent final source/evidence review precedes closure. Archive exact
records and verify nonlive PID/birth identities, then remove only task-owned
RAW/dist/.vite after readers release. Tools/sharedcaches/pre-existing emptycoverage
remain. Root retains umbrella worktree claim; no remote action. This behavior has
no established causal relationship to P02b05d's level-six wave-three draw.

Stage A accepted representation only: genuine6RED/286pass→292loader GREEN,
E1224/U3508(166files)/T/L/production bridge pass. Producer and QA independently
approve source and frozen tests. No authored/runtime enablement or new coverage.
Engine7.368s/unit61.905s exceed existing3s/15s targets; warnings remain.

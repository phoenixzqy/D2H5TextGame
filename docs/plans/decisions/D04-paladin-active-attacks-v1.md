# D04 — Paladin Holy Bolt, Blessed Hammer and Vengeance

Later tuning: the original numeric preservation below describes this decision's
baseline. Blessed Hammer rank growth is superseded by
[P15 earned Crystalline evaluation](P15-blessed-hammer-growth-v2.md); the bypass,
targeting, cooldown and resource rules remain authoritative.

Local implementation contract for reproduced BUG196. Root remains sole writer;
independent design/QA and earned balance remain open. This is the first coherent
three-skill Paladin active packet, not a reduction of the ten-active/class/v1
scope. All original213 inventory IDs/order remain; no credit before final proof.

## Existing authored behavior retained

Keep current active class/unlock/full-prerequisite ownership, rank cap20, mana,
cooldown, targeting and per-rank damage growth. No movement/range, new potion,
extra hero action, save field/version/migration, selected aura, global tuning,
dependency/CI or test threshold change. Use the actual registered JSON catalog,
not the old stubs. Learned prerequisites do not silently grant a selected aura.

## Holy Bolt

The existing GDD and bilingual copy specify50% dealt-damage self healing.
Author `onHitRecovery.lifeFraction: 0.5` in the actual JSON and extend the strict
existing schema to this exact active, single-target Arcane identity. Reuse the
shared direct actual-HP-removed recovery consumer: round down, cap at missing
life, exclude absorption and overkill, require the caster to survive ordinary
death/orb/reflection settlement. Misses, unaffordable casts, later basic attacks
and periodic damage do not heal. No minimum-one restoration or extra RNG.
Damage remains50–70 with5 growth/rank,15MP,1sCD,unlock6.

## Blessed Hammer

The GDD says ignores magic resist. Author explicit `ignoresMagicResist: true`
for this exact active, all-enemy Arcane skill; schema rejects foreign ownership,
false/malformed opt-in and missing required metadata on Hammer. Engine effects
carry the reviewed boolean to the existing damage-input boundary, where only
flat `defenderMagicResist` becomes zero for this hit. Arcane percentage resistance,
act penalty, dodge, crit, source modifiers, shields, status/retaliation, death and
normal damage order stay in effect. Defender stats never mutate. Ordinary
Arcane/basic hits remain mitigated. Damage remains60–90 with6 growth/rank,
25MP,2sCD,unlock18, Holy Bolt prerequisite.

## Vengeance: one paid composite strike

The GDD says30–50 per element; existing JSON's90–150 total, equal50/50/50
breakdown and9 total growth/rank agree. Preserve these authored numbers. Add
explicit `damageComposition: weighted-components` for this reviewed skill,
requiring exactly the existing positive Fire/Cold/Lightning breakdown and all
three declared statuses in strict schema. Other mixed rows stay uncredited and
are not silently enabled by seeing a breakdown alone.

A Vengeance cast selects one target and pays/sets CD/uses one action once. One
ordinary magical hit/dodge roll, one inclusive seeded total-base roll and one
crit roll are shared across all three components. A miss misses the whole
strike; a crit applies to every component. Do not replace it with three separate
casts or independently rolled attacks. Keep all old non-composite RNG/results
unchanged when extracting a reusable rolled-hit boundary.

Split the unrounded total base into the authored positive normalized weights.
For each component, apply its own source damage/selected-aura bonus, combo,
shared crit, type-specific percentage resistance/act penalty and ordinary flat
mitigation before the existing floor/minimum-one rule. The order at the same
simulation clock is Fire, Cold, Lightning. Publish actual typed damage events;
separate component mitigation must be observable, not a total relabeled Fire.

Apply the current finite personal shield transaction to each ordered component,
but settle target death/orbs/corpse supply once after the complete strike. Keep
one original target and source snapshot. A landed strike applies Burn from the
Fire component's final mitigated damage using authored10% DPS, and ordinary
Chill/Paralyze with their matching types/default durations and existing boss/
cleansing/refresh policies. Misses apply none. All three are real runtime
statuses: Burn must remove later HP, Chill must affect cadence and Paralyze
must suppress eligible actions. Existing Burn aliases remain canonical.
No new component status-chance roll beyond ordinary status application.

Vengeance has no physical component or life recovery. Do not introduce physical
reflection or Shatter behavior for it. All legacy scalar hits, multi-hit attacks,
status ordering, defensive capacities and life/MP playback remain compatible.
Damage remains90–150 total with9 growth/rank,30MP,2sCD,unlock18, Zeal and its
transitive Sacrifice prerequisite.

## Implementation and proof order

1. Preserve the six-case/eight-failure native RED and36 passing controls before
   code changes; file BUG196. Add schema and behavior RED tests first.
2. Holy Bolt authors its existing recovery coefficient and reuses the shared
   path. Hammer adds one narrow opt-in at the damage-input boundary. Keep these
   changes separately reviewable from the composite primitive.
3. Extract a typed immutable shared hit/base/crit roll without changing the
   scalar pipeline's arithmetic or RNG sequence. Add opt-in weighted elemental
   components and complete same-strike status/death/resource settlement, without
   changing unrelated mixed skills. New public interfaces get TSDoc.
4. Prove native rank1/2/20, exact aliases/class/unlock/full prerequisites,
   payment/CD/failure, actual positive effects, cap/floor/overkill/absorption,
   miss/crit/type mitigation, one shared roll, current-state carry, exact
   deterministic replay, and scalar/other-class compatibility. Include real
   control consequences, death/corpse exact-once and MP/status playback.
5. Pure current/next/unlearned/MAX previews and both locales explain actual
   recovery/bypass/component ranges and status rules. Production en/zh ×
   desktop/mobile public allocation/selection/actual combat and exact five-domain
   Save-close-Continue, five-size geometry and selected visuals precede credit.
6. Final engine/full/types/lint/clean explicit-false build/bridge/precache,
   frozen source/build/Git/genuine maps and committed-source audit. Retain
   original failures, archive required evidence and remove exact task artifacts.
   `validate:data` is absent; real strict schema/data tests supply validation.

## Author plan and security review

Security check: pass. First-party local combat/data/UI change; no credential,
permission, network, dependency, CI, save-export or agent-workflow change.
Strict finite JSON metadata and existing class ownership stay controlling.

Plan review: ready after rejecting a three-independent-attack shortcut and
requiring shared hit/base/crit, per-element mitigation/status potency, exact-once
complete-strike death/corpse settlement, scalar RNG compatibility and all public
consumers. This is author self-review, not independent design/QA approval.
Remaining seven Paladin actives, all-class builds, genuine Baal/pacing/endgame,
C2-C4/fullG0-G7 and full privatev1 remain open. No genuine campaign or remote
publication action is authorized by this packet.

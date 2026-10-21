# D05 / P07a05A — authored player Skeleton Mastery prerequisite

Status: GD/TD approve the narrow four-path contract. Exact drafts and oracles
require independent review before installation/execution. This prerequisite
activates no runtime, native, UI, browser or campaign behavior.

## Authored contract

Exact `skills-necromancer-skeleton-mastery`, canonical allocation alias
`necromancer.skeleton_mastery`, remains passive/self/cooldown0, requiredLevel1,
legacy minLevel1 and maxLevel20. Current JSON adds lifeMax4%, Attack2% and
ordinary Defense1% per allocated rank for skeleton warriors and mages.

The exact-identity schema requires requiredLevel and closed scaling containing
only a closed passiveStatsPerLevel with all three keys: summonLifePct,
summonAttackPct, summonDefensePct. Each is finite and nonnegative. Alternative
valid coefficients, including zero, and positive integer unlock/cap values are
allowed without invented ceilings. Optional passive must be true; aura/summon
must be false. Reject cost, damage/type, statuses, tags, synergies, heal,
summonId, aoeShape and requires even when empty/zero. Other identities retain
existing schema behavior. Existing shared types already support all three keys.

## Independent definition and allocation

`resolveSkeletonMasteryDefinition(rows)` requires exactly one authored row,
validates with strict Ajv2020, then copies/freezes only primitives:
`{requiredLevel,maxRank,summonLifePctPerRank,summonAttackPctPerRank,
summonDefensePctPerRank}`. Never retain, freeze or mutate caller/catalog/registry
references. Export SKELETON_MASTERY_DEFINITION independently of mutable registries.

`resolveSkeletonMasteryRank(levels?,definition?)` takes the maximum valid finite
positive integer of the two exact aliases once and clamps to the copied cap.
No sum, inferred rank1, legacy/combo/gear fallback or eligibility in this helper.

## Binding later integration

Only exact Necromancer at finite Player level at least unlock qualifies.
Pass a narrow copied immutable per-wave projection bound to the exact living
player hero; CombatUnit has no authoritative class. Apply only to newly created
player-owned `skeleton`/`skeletal_mage`; exclude Revive, golems, all other summons,
mercenaries and enemies. Preserve existing scalePerRank Math.round and summoning
rank Math.floor, then multiply each stat once and retain fractions. These are
not a base-stat floor. Fresh stats.life and top-level life equal boosted lifeMax;
mana and all other stats stay unchanged. Do not retrofit/refill damaged preloaded
summons or respond to in-flight allocation changes. Ordinary changes apply next
wave; explicit replay follows original resources and all three carry baselines.
Preserve D06 identity/RNG/caps/corpse/cost/CD/refund/grid. Broader preparation and
refresh remain P09.

Rank6 skeleton base life/Attack/Defense162/35/19 becomes168.48/35.7/19.19 at
Mastery1 and291.6/49/22.8 at20. Rank6 mage123/45/10 becomes127.92/45.9/10.1 at1
and221.4/63/12 at20; magicDodge0.09 stays unchanged. Neutral100 against19.19
Defense deals80; premature floor19 would deal81. Later player copy must truthfully
name skeleton warriors/mages and show allocation-derived current/next values.

## Scope and validation

Exactly four repository paths: skill.schema.json, engine/skills/skeleton-mastery.ts,
its test, and this decision. No authored tuning/shared types/runtime/UI/save edit.
Freeze schema-only/full tests and source drafts before independent QA/TD/producer
review. Record genuine schema RED against unchanged production schema, distinguishing
already-rejecting controls, then schema GREEN. Missing-helper collection failure is
separate from behavioral RED. Install minimal helper, record focused GREEN, then
serial bounded engine/full/types/lint/fresh production bridge/build gates. Preserve
failures, corrections and hashes; independent review precedes commit.

Security check: PASS. Local JSON/schema/typed deterministic helper only; no network,
credentials, dependencies, CI, permission, save-version or remote-action changes.
Root owns evidence and exact cleanup; preserve shared caches and source/history.
Passing prerequisites grants no runtime/player-facing/full private-v1 acceptance.

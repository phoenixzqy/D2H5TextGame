# P15 — Melee signature family and five authored physical skills

Type: provisional tuning plus bounded payload repair,2026-10-30.
Scope: next family underP15catalog; BUG412. Root sole writer; existing advisers
read-only. Existing user authorization covers local implementation/validation;
no commit, push, PR, dependency install, deployment or CI. Browser works inWSL.

## Adopted rows and ordinary curves

Use point pairs for both fields. Remove only Weak/StrongMelee in these20rows;
preserve signature relative order, other stats, tiers/flags, spawns and rewards.
No Act multiplier or formula change. New numbers extend the established32/+5
baseline and existing0.85/1.10/1.25role coefficients; they are provisional new
adoptions, not recovered approvals. Inventory becomes47authored/64pending,
all numerical acceptance remains unaccepted.

| Exact monsters/ row suffixes | Base/growth |
| --- | --- |
| act2.bloodhawk, act2.sand-leaper |27.2/4.25|
| act1.disfigured, act2.vulture-demon, act3.jungle-hunter, act5.overseer |32/5|
| act1.vile-hunter, act1.dark-stalker, act2.marauder, act2.invader, act2.cave-leaper, act2.undead-scavenger, act4.abyss-knight |35.2/5.5|
| act1.brute, act1.yeti, act1.crusher, act1.hell-bovine, act2.dune-beast, act3.doom-ape, act5.death-mauler |40/6.25|

Charge-only9: VileHunter/DarkStalker/Brute/HellBovine/Marauder/Bloodhawk/
VultureDemon/DoomApe/AbyssKnight. Rend-only4: Disfigured/Yeti/Invader/DuneBeast.
LeapAttack-only2: SandLeaper/DeathMauler. JungleHunterLeap; OverseerWarCry.
Crusher/CaveLeaper keep LeapAttack→Rend; UndeadScavenger keeps Charge→Rend.
Crusher's1860mscadence remains signature-covered; other selected rows have
ordinary gaps. Appended elite skills retain priority before ordinary fallback.
Exclude SaberCat's unresolved thrown-weapon hybrid, Enrage/Thorns/mixed-elemental
families and named bosses. No other row/list/curve is silently advanced.

## Authoritative payloads

Migrate five existing native skills to a small JSON-backed validated adapter,
using existing damage, cost and statusEffect fields. Remove duplicate engine
stub definitions. Preserve RNG, delivery provenance and existing damage paths.

| Skill | Physical base | CD seconds | Target | Status |
| --- | ---: | ---: | --- | --- |
| Charge |60–90|4|single|none|
| Rend |25–40|2|single|10%final-hit damage/s,3000msBleed|
| Leap |40–60|3|single|none|
| LeapAttack |50–70|3|single|50%1000msStun|
| WarCry |20–30|4|all enemies|30%1000msStun|

AllMP0/rank1. Four melee deliveries; WarCry remains spell delivery despite
Physical damage. Align JSON to these existing native payloads except Rend's
new actual bleed; align Leap's bilingual all-enemy/stun description to native
single-target/no-stun. No added movement or implicit attack-scaling. Rend10%/
3s/cap1 follows the shared Maul/Impale contract (D04-impale-v1); existing refresh
retains potency and native min/integration/expiry. No global bleed-rate change.

Shared Rend serves excluded PitspawnFouldog/Griswold; lists/numbers stay but real
Rend exposure gains bleed intentionally. Validate them separately. Shenk uses
oneOverseer+threeDeathMaulers at actual boss tier despite canBeBoss:false;
preserve runtime identities/tiers/rewards. EndgameL90 Overseeer477/Mauler596
ordinary attacks replace generic fillers. Fixed signatures can be much weaker
than high-level ordinary damage. This is an explicit unaccepted balance concern,
not a reason to silently add a global signature multiplier in this increment.

## Verification and measurement bounds

Meaningful native RED before production edits. Literal per-row level/tier
oracles, actual bundled signature and ordinary cadence, Crusher coverage,
appended affixes, real landed bleed/dodge/expiry/refresh, both aliases, schema
malformations, immutable JSON adapter and replay/plain parity. Preserve existing
measured four priority payloads while updating their intended generic fillers
to ordinary. Native Shenk/endgame and shared Rend consumers are controls.
Strict types/scoped lint/independent reviews follow functional checks.

One predeclared paired diagnostic will capture actual native baseline before
mutation. Use20trashrows at syntheticActlevels12/20/30/45/60, bothL90Overseer/
Mauler, boss-tier Shenk rows atL55 and excluded Pitspawn/Griswold boss definitions
atL17. Each meets unequipped starting-stat basicBarbarian/FireBolt1Sorceress,
100seeds0–99:52cells/5200fights per arm. Unspent points remain unspent; not earned
builds. Native60s/1000actions,600swall/256MiBcompressed per arm. Full raw,
source inventories, input immutability, A/B/A and plain/recorded parity. Pair
normalization may remove only enemy skillOrder/Attack/attackRange, never simulated.
Report all outcomes/threat/sources and censored successfulTTK denominators.
Explicit changed paths, exact monster/skill/localization deltas and unchanged
other source verification accompany comparison. No tuning/retry/favorable seed
selection or reward/pacing inference. No campaign rerun until coherent milestone.

## Root plan/security review

Plan review: ready after accounting for Crusher's continuous signature cover,
excluded hybrid and shared Rend/boss consumers. Small JSON adapter fixes divergent
sources without selector or global DoT changes; tests must not assume every row
has ordinary reachability. Security check: pass for local authoreddata/pureengine/
task-owned bounded diagnostics, no credentials/network/newdependencies/permissions/
publication/saveformat change. Raw evidence and claim remain through umbrella
acceptance; only exact owned processes/caches may be cleaned.

Native challenge verification correction: the actual Bloody Foothills Shenk
challenge resolves atL60, with1Overseer523Attack+3Maulers654Attack, all boss
tier. The frozenL55 diagnostic cells remain synthetic component probes; they
do not establish actual Shenk difficulty. Refresh coverage uses fixed seeds0–15
and requires landed pairs with distinct implied rates as well as retained first
potency. Excluded consumers retain their complete literal production lists.

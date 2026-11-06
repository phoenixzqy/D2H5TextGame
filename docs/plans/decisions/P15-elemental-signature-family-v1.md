# P15 — Elemental, poison and ranged signature action/numeric family

Type: provisional tuning and bounded catalog repair;2026-10-30. BUG413.
Root sole writer in existing claimed worktree; advisers read-only. User-authorized
local implementation/validation only, CI excluded, browser launch verified.

## Adopted change

Remove only Weak/StrongMelee/WeakRanged entries in these20rows; preserve other
signature order and every other field. Add point Attack/Growth pairs. Existing
32/+5baseline and0.85/1.10/1.25role coefficients are provisional adoptions, not
approved numerical balance. Inventory becomes67authored/44pending; all111
numerical acceptance remains unaccepted. No schema or runtime source change.

| Exact monsters/ suffix | Base/growth | Remaining native skills |
| --- | --- | --- |
| act1.afflicted | 32/5 | monster-poison-spit |
| act1.dark-ranger | 35.2/5.5 | monster-fire-arrow |
| act2.rock-worm | 27.2/4.25 | monster-poison-spit |
| act2.devourer | 32/5 | monster-poison-spit |
| act2.claw-viper | 35.2/5.5 | monster-poison-spit |
| act2.salamander | 35.2/5.5 | monster-fire-bolt |
| act2.pit-viper | 35.2/5.5 | monster-poison-spit, monster-charge |
| act2.burning-dead-archer | 35.2/5.5 | monster-fire-arrow |
| act2.steel-scarab | 27.2/4.25 | monster-lightning-bolt |
| act2.plague-bug | 27.2/4.25 | monster-poison-spit |
| act2.death-beetle | 35.2/5.5 | monster-lightning-bolt |
| act3.fetish | 35.2/5.5 | monster-poison-dagger |
| act3.spider | 27.2/4.25 | monster-poison-spit |
| act3.swamp-dweller | 32/5 | monster-poison-cloud |
| act3.infector | 32/5 | monster-plague-spit |
| act4.venom-lord | 40/6.25 | monster-poison-spit, monster-inferno |
| act4.pit-lord | 40/6.25 | monster-fire-breath, monster-charge |
| act4.mega-demon | 40/6.25 | monster-inferno |
| act5.blood-lord | 40/6.25 | monster-fire-breath |
| act5.baal-minion | 40/6.25 | monster-fire-breath, monster-poison-cloud |

## Rules and exclusions

All existing native payloads, projectile flight, mana costs, target counts,
delivery, damage/status/CD/RNG/combo rules and Attack formula stay byte-identical.
DarkRanger/BurningDeadArcher remain ranged. Native500ms projectiles stay.
Five rows are signature-covered at base cadence: DarkRanger/BurningDeadArcher
FireArrowCD1, FetishDaggerCD1, VenomLordSpit2/Inferno3 at1660ms, BaalMinion
Breath3/Cloud3 at1580ms. PitViper/PitLord have ordinary gaps. Appended elite
skills can cover gaps and existing ManaBurn can expose fallback on covered rows.
No claim that adding curves alone activates every ordinary attack.

Native payload discrepancies remain separately pending: LightningBolt has no
Paralyze despite JSON; FireArrow/FireBolt/Inferno/PoisonCloud/PoisonDagger/
PlagueSpit statuses omit positive DoT rate. These markers still enable existing
Ignite Physical×1.25/Poison×1.15, poison-stack combos, potency promotion/refresh
and death spread. Do not describe them as inert. Spit/Breath already have native
positive rates. Keep all existing damage ranges and durations in this increment.
Payload authoring and high-level signature scaling need later coherent repair.

Exclude all named/chapterboss definitions, caster/support rows, Ghost/Wraith,
Infidel/SaberCat/ThornedHulk/FrozenTerror, GreaterMummy/Horadrim curse, StygianDoll
corpse and OblivionKnight arcane. No rewards/spawns/flags/XP/HP/affix/save changes.

## Native consumers and acceptance checks

Meaningful42RED/5controls precede mutation. Pin20literal arrays/tier/level/cadence/
delivery/action oracles, actual signatures/ordinary gaps, no generic fillers,
real ordinary damage including live Ignite combos, immutable replay/plain parity,
nonattack stats/factory RNG, appended elite precedence and fiveManaBurn controls.
Update three selected older priority fixtures to intended ordinary fillers;
retain their endpoint,500msflight,target and dodge assertions unchanged.

Native challenge controls: Endugu oneFetish+fiveFlayers L36boss; Council
threeInfectors L43boss; Hephasto oneMegaDemon+threePitLords L56boss; Thresh
oneDeathMauler+fourBloodLords L67boss. Adds inherit boss tier despite canBeBoss:false.
Ashen has sixL90trashBloodLords acrossW2/3/4, absent fromGlacial. Exact Throne
quest projection has27eliteBaalMinions over seven source waves, native levels
75/75/76/76/76/76/77, preserving original encounter provenance and other members.
These checks validate integration, not earned encounter viability.

## Frozen diagnostic and finish criteria

Single predeclared paired6000fights/arm:20trash rows at syntheticAct12/20/30/45/60,
sixisolatedcomponent probes at actualchallenge36/43/56/56/67/77, L90BloodLord,
and unchangedTainted/DarkArcher/DisfiguredL12controls.30specs×2starting-stat
unequippedBasicBarbarian/FireBolt1Sorceress×100seeds0–99=60cells. Components do
not represent whole encounters. Native60s/1000actions,600swall/256MiBcompressed.
Fullraw, metrics reconciliation, canonical action histograms, allhero statuses/
periodic events, net-versus-cumulativeHP, A/B/A and plain/recorded parity. Pair
normalization only enemyOrder/Attack/Range, never simulated. Exact20row structural
delta; all other source (including every skill payload) identical, with exact
before/after hashes for two permitted test files. Report all600control hashes,
all60cells and censored successfulTTK denominators. No tuning/retry/favorableseeds,
rewards/pacing/earned acceptance or campaign rerun. Finish with targeted related
checks, strict types/scoped lint, independent review and complete evidence.

## Plan/root/security review

Plan review: ready with fivecovered exceptions and all listed native consumers;
former authored-level assumptions replaced by actual challenge/source levels
before baseline. No material unresolved question. Small data correction addresses
generic suppression at its origin; no selector patch. Independent design adviser
APPROVE for bounded provisional authoring with explicit payload and balance gaps.
Security check: pass; local authored data/native tests only, bounded task-owned
processes/raw/cache and no network/credentials/newdependencies/permission/dataexport
or publication. User expressly excludes CI; no validation bypass is introduced.
Raw/receipts/failures and existing claim retained through umbrella acceptance;
root owns cleanup. No additional confirmation needed under existing authorization.

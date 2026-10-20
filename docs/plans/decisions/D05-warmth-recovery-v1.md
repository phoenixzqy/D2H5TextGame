# D05 v1a / P07a01 — automatic Warmth and combat mana recovery

Status: root design/technical contract; producer APPROVE; QA lifecycle amendment
accepted. Authored baseline `a35ef02`, trigger metadata `07e8514`, and pure
composition `938ed96` and authoritative wave adapter `1860bc6` integrated.
Fire/passive runtime `5a53d37` and absolute mana playback `dd236eb` integrated;
recovery and browser acceptance remain open.
Design choices below are provisional balance, not measured campaign acceptance.
Full Warmth requires both authored effects; staged fire-only work stays partial.

## Sources, conflict and controlling choices

Sorceress JSON788–805 authors Warmth unlock1, passive,self,rank1–20,no cost/CD,
per-rank manaRegenPct.04 and fireDamagePct.01. Current display multiplies by
allocated rank; both locales promise mana recovery. Other masteries unlock30,
EnergyShield24; changing those unlocks to avoid Warmth is outside this card.
combat-formulas§10.2 says Energy×1mana/turn; progression-curve§4 says+.5manaRegen
per Energy. D04 makes legacy5second markers presentation, so neither establishes
a numeric per-second rate. No source authorizes percent-maxMana recovery.

Root chooses a new explicit **0.2×effectiveEnergy mana/second** baseline for
production heroes, continuous in simulation milliseconds. This preserves the
numerical Energy×1 per five elapsed seconds as an explicit new conversion, not
a recovered authority, pulse triggered by turn markers or campaign tuning.
Supersedes conflicting per-Energy recovery coefficients only for this scoped
hero baseline. Put0.2 in validated authored JSON, never duplicate tuning in TS.
Merc baseline, HP regeneration, auras, gear regeneration/leech and other passives
remain separate cards; none is accepted here. Legacy CombatUnit without a rate
regenerates0. Warmth belongs only to its learned Sorceress, never allied units.

EffectiveEnergy: authoritative inventory.equipped aggregate core mods, then
applyEquipmentCoreMods, then effectiveStatValue once.190base+30gear→220raw→210
effective; never infer from maxMana/stale player.equipment. Rate is
0.2×effectiveEnergy×(1+.04×rank). E20 gives rank0/1/20 rates4/4.16/7.2.
Rank comes only from actual skillLevels; missing/unallocated0. Canonical/data
aliases MAX once, not sum. Accept finite positive integer ranks, clamp overcap20;
ignore nonpositive/fractional/nonfinite, unknown/wrong-class/level-ineligible.
No implicit rank1 from active-skill resolver, activeBuffIds or stored display
skills. Snapshot composition is pure from source state; allocation/equip/respec/
reload cannot accumulate bonuses. Config refresh explicitly writes zeros for
removed bonuses and clears removed skill-level state, not conditional stale merge.
Stagec also replaces the hero's current battle stats with fresh authoritative
composed stats, clamps existing life/mana to new maxima without increasing either,
and clears mana carry if clamping reaches cap. This deliberately fixes the
configuration boundary rather than changing rate while retaining stale maxima.
Ordinary configuration freezes per recorded wave. Every playWave entry must
pull fresh authoritative player config/stats and merge into playerUnit/carry team
before constructing the next battle snapshot, clearing removed fields explicitly.
Learn/upgrade/equip/respec/stat changes therefore apply automatically nextwave or
newrun; no manual refresh call can substitute for this production path. Existing
explicit combo-edit replay is the immediate exception, using the same wave input
resources/carry, never completed output. No-replay refresh does not mutate the
current playback team under its frozen recording. Newrun uses fresh stats/carry0. Pin
gear Energy/maxMana rise/fall, no-free-heal and repeated-refresh invariants in
production adapter regressions before changing this boundary.

Warmth fire:+.01×rank into existing increasedPct stage for direct fire damage
beforecombo/crit/resist/mitigation/floor. No attack/stat mutation, cold/physical/
thorns/ally inheritance. Fresh burn derives its rate from already enhanced
final hit once; do not multiply periodic damage again; active refresh keeps
original potency/source/start. Automatic learned passive needs no combo/action/
resource/CD and must never consume an action even in imported comboOrder.
FrozenArmor is active and must not receive automatic passive composition just
because it contains passiveStatsPerLevel. No broad implementation of all passives.

## Continuous settlement and observable mana

At every existing simulation boundary, integrate only elapsed living time and
accept whole MP with compensated fractional carry. Settle periodic HP/deaths
first, then recover still-living units before actions at the boundary. This
explicit policy gives periodic death priority over recovery, including deadline;
no dead/orphan revival. No regen after winner or action-cap termination, before
spawn, during pause, betweenwaves, fromwallclock/offline or playback duration.
At terminal boundaryT, still-living survivors receive recovery for the elapsed
interval throughT before winner exit, even if the last enemy dies periodically
atT. Dead/orphan units remain excluded; no settlement afterT. Pin equivalent
terminal-time survivor MP for action-kill versus periodic-kill scenarios.

Clamp to manaMax; reaching cap discards overflow AND fractional carry. AtMP98/
max100/rate4.16,one second→100/carry0; spend8 then250ms→93/carry.04. No banked
recovery from full time. Fractional carry/compensation is transient CombatUnit
state across qualified nextwaves for partition independence; newrun resets it.
No save schema/migration, battle-local elapsed clock not carried as wallclock.
Absent carry means0. Config replay starts from existing wave input/carry, never
completed output; do not heal on configuration change or recomposition.

Introduce a silent authoritative absolute mana event on every actual changed
MP path: cast spending, regeneration, summon refund and MP orbs. Include target
and resulting mana (and reason if useful), no invented player-visible strings.
Playback sets exact absolute MP, duplicate events cannot double-add; preserve
HP/orb/event ordering and event log behavior. Stepping all events must agree
with final mana without relying on combatStore's final snap. Compact battlefield
currently has no MP bar: final browser card needs meaningful visible recovery
via actual MP display or a literal additional-cast oracle, not a buff label.

## Sequential bounded implementation proposal

Root owns control/bugs/ledger/integration. No shared engine write overlaps with
P08a02/03. Each assignment claims own worktree, preserves others, genuine RED
and structured report before runtime fixes; review before next dependency.
Paths below under src/, stage lists are proposals requiring source confirmation.

1. P07a01a authored baseline: data/combat/recovery.json,new schema, pure
   engine/combat/recovery-definition.ts and its test(4). Validate schema in test
   if no existing standalone validate:data command, no invented command claim.
2. P07a01b passive classification: skills/effects.ts,dataCatalog.ts,registry.test.ts
   (3). Metadata only: carry passive trigger identity without claiming runtime
   exclusion yet. Stage d implements/tests the selection guard for learned or
   forged Warmth combo. Keep active FrozenArmor and aura behavior explicit.
3. P07a01c split: c1 pure composition in engine/progression/warmth.ts/test and
   combat/types.ts (3), integrated `938ed96`; c2 production adapter in
   stores/combatHelpers.ts and new stores/warmth-composition.test.ts, plus bounded
   existing lifecycle tests after a separate fixture-authority prerequisite.
   Final c2 ownership requires source-confirmed review before dispatch. Resolve
   actual authored class/rank fields and authoritative gear/effectiveEnergy,
   transient per-type damage/rate/carry; refresh clear and authoritative next-wave
   pull semantics. Include real ordinary mutation→advanceWaveOrFinish tests, not
   only explicit refresh-helper calls; no-replay leaves current recording/team.
4. P07a01d fire primitive: combat/combat.ts, new combat/warmth.test.ts(2). Actual
   production registry FireBolt literal oracles, rank/no-combo/other damage/
   burn/replay/immutable controls. Still partial Warmth until recovery proof.
5. P07a01e absolute mana playback: combat/combat.ts,stores/combatPlayback.ts/
   combatPlayback.test.ts,eventToLogI18n.ts/eventToLogI18n.test.ts(5). Every current
   mana write emits authoritative positive/negative/zero-cost behavior, silent
   localized log handling. No timed regeneration yet.
6. P07a01f recovery: new combat/mana-recovery.ts/test,combat.ts, new
   combat/mana-recovery-combat.test.ts, relevant actualcrosswave test(5). Pure
   compensated carry helper, current-head mana event, death/action/deadline/cap/
   splitinterval/nextwave oracles; existing stores/combatHelpers.cross-wave.test.ts
   is the fifth owned file for production next-wave coverage.
7. P07a01g ordinary learned/upgrade/Save/reload/fire+MP browser route, bothlocales
   desktop/mobile, reviewed separately in<=5files after engine integration.
   Ordinary Learn during a recorded wave must apply to the next actual wave;
   current recording stays unchanged. Explicit combo replay remains separately
   tested; no repeated reward or recovery is invented from prior output.

No ordinary respec UI exists; store-level respec proof must be labeled. Actual
respec price/currency conflict is a separate economy issue, not changed here.

## Required proof and limits

Rank0/1/2/20,aliases/duplicate aliases/overcap/malformed/wrongclass,level,actual
allocate/respec/gear/softcap/save-import/reload/repeated composition. Literal
known-seed fire hit arithmetic independent of implementation; rank1 1% may
floor away on FireBolt30–45, so browser must earn sufficient ranks or use a
labeled imported boundary fixture. No invented damage for screenshot.

Exact MP under regeneration-only, cast-at-boundary, full/no banking, split
intervals/deadline/death/stun/spawn/refund/orb/crosswave/config replay. No RNG
consumption from recovery. Recorded/unrecorded replay/inputimmutability and
stepped MP must agree. Root+producer+QA review full contract before dispatch.
Focused/engine/related/fullunit/typecheck/lint/build+changed coverage each stage;
final combined head and ordinary D/M route after source changes finish. Record
timing misses; functional passes do not accept performance budgets. Clean
exact owned outputs after consumers and release via git-worktree. No publication.

Security check: PASS. Local deterministic stats/resources/playback; no network/
credentials/dependencies/permissions or validation bypass. Full C1/P07/passives/
campaign/economy/merc recovery/performance acceptance remains open.

Producer final P07a01-WARMTH-PLAN-REVIEW APPROVE after metadata/runtime and
terminal/config clarifications. QA confirmed the per-wave authoritative pull
resolves missing mutation→refresh wiring, with frozen current playback and
explicitly cleared fields; final whole-contract review still requested.

QA final whole-contract review: ready; existing combatHelpers.cross-wave.test.ts
identified as stagef fifth file. No source/tests/builds executed by reviewers.


P07a01c2 adapter accepted at`1860bc6` after tests-only authoritative fixture
prerequisite`9ae162e`. Genuine final RED13fail/43pass preceded source. Final full
1602/124files/zero skips; engine742/47, related464/42, T/L/build/diff-check pass.
Producer and QA independently APPROVE / ADEQUATE. Store coverage diagnostic
exited1 at77.9%branches under inherited engine-only80%threshold; no threshold
change, all43 changed statements covered. See BUG034 for exact commands,
coverage digest, oracle corrections and performance limits. Runtime pools
restore from original wave baseline while nested current-pool metadata remains
fresh; neither rising maxima nor replay replenishes from persistent resources.
Stage d integrated `5a53d37` (worker `f80b6a9`): two runtime lines plus frozen
38 regressions. Actual per-type fire bonuses and exact passive exclusion pass
engine780/full1640, T/L/build/unchanged80% engine coverage. Root/producer/QA
APPROVE/ADEQUATE; BUG035 records hashes, raw coverage digest and timing misses.
Stage e reviewed RED and BUG036 precede its source change; recovery/browser
remain open.


P07a01e accepted `dd236eb`: shared candidate-unit MP commit preserves HP and
legacy optional shape, clears fractional state only at resulting cap, publishes
absolute cast/refund/orb events in established cue order, and applies exact MP
during immutable playback with silent localized logs. Reviewed RED13fail/32
preceded source; one independently approved collateral-orb oracle correction
retains explicit dead-owner no-refund assertions. Final1661/125files, engine780,
focused32, T/L/B and unchanged80% engine coverage pass; producer/QA APPROVE.
All changed engine statements/branches covered. BUG036 records commands, hashes
and timing misses; no timed recovery yet.

Stage f approved precision requirement: maintain a battle-local cumulative
compensated MP-millisecond integral and whole-granted counter, rather than
repeatedly reducing a fractional-MP total. Otherwise7.2MP/s×1250ms partitioned
into1ms intervals can wrongly yield8 instead of9 whole MP. Seed and export only
existing fractional carry/compensation across waves; cap paths reset both unit
fields and local accumulator. Recover current living survivors after complete
periodic death/orphan/refund/orb settlement and before winner/action checks.
Exact partition/terminal/cap/production-nextwave tests precede runtime.


## Stage f precision amendment — controlling implementation contract

Initial cumulative binary addition compensation is insufficient: actual7.2MP/s
battles split695ms/555ms grant8 instead of9 after carry projection; pure43.68MP/s
split16ms/24984ms grants1091 instead of1092 due product rounding. Root, producer
and independent QA accept both supplemental RED controls. Initial GREEN is
provisional and is not runtime acceptance. Subtract-first projection alone is
also insufficient for other partitions, including976ms/274ms.

Interpret each finite numeric rate/timestamp by its shortest decimal
`Number.toString()` value, including exponent notation. Do not round authored
rates to a tuning quantum. Compute decimal products, timestamp differences,
sums, whole MP and remainders exactly using local BigInt coefficients/scales.
In combat derive each interval from exact decimal `from` and `to` timestamps,
not the already rounded binary `to - from`. Fractional status boundaries are
legal; preserve their represented timestamps. No epsilon or artificial recovery
scheduler is permitted.

The helper's cumulative state gains explicit signed canonical-decimal
`exactTotal` in MP-milliseconds, alongside existing numeric total/compensation/
wholeGranted views. Add optional transient `CombatUnit.manaRegenExactCarry`,
a canonical decimal MP fraction in[0,1). The exact string is authoritative
when valid. Existing numeric carry and signed compensation remain compatibility
views; exported compensation means numericCarry minus exactCarry. Qualified
next waves/replays retain the exact string. No hidden metadata, BigInt in
recorded snapshots, persistence fields, save version or migration is introduced.

When exact carry is absent/invalid, qualify the existing numeric fractional
carry and finite signed compensation, then use their exact-decimal difference.
The combined credit must itself lie in[0,1); otherwise reset the entire seed
to zero. This forbids negative regeneration or unearned whole carried MP.
Accepted carry.75/compensation−.125 still seeds.875MP. Invalid combined seeds
.75/+1 and.75/−.5 seedzero and at1MP/s for100ms produce0whole/.1fraction.
A valid exact carry takes precedence over contradictory legacy views. Validate
foreign exact carry as canonical, finite, fractional and at most2048 characters;
this bounds foreign input independently of tuning precision. Do not reject an
internally generated exact total merely because it has an additional integer
part. Mathematical floor/remainder semantics must hold for signed arithmetic.

At cap reset the local integral and all existing numeric/exact optional carry
fields. A new run startszero. Configuration clamping to cap also clears exact
carry; original input/replay and noncapped next waves retain it. Death deletes
the local map entry and retains existing dead-unit carry snapshots, matching
the prior policy: alive guards forbid further recovery and nextwave filters
exclude dead units. No new death-time resource writes or revival are added.

Bounded precision child owns five paths: mana-recovery.ts/test, combat.ts,
mana-recovery-combat.test.ts and combat/types.ts. The production cross-wave
test stays frozen/read-only. Root owns a separate two-path adapter-cap child
(combatHelpers.ts and warmth-composition.test.ts), with its own RED before
source. New API/parser/exponent/mixed-scale/invalid-credit/handoff tests precede
runtime; literal existing assertions remain, with exact-field expectations
added for the explicit API amendment. Independent RED/source/GREEN review and
combined-head U/E/T/L/B/coverage/browser validation remain required.

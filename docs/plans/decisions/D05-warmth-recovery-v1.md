# D05 v1a / P07a01 — automatic Warmth and combat mana recovery

Status: root design/technical contract; producer APPROVE; QA lifecycle amendment
accepted. Authored baseline `a35ef02`, trigger metadata `07e8514`, and pure
composition `938ed96` integrated. Runtime composition/recovery remains open.
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

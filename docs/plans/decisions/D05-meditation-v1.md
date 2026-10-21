# D05 / P07b03 — selected Meditation mana restoration

Status: approved bounded implementation contract after independent GD/TD and QA
review; implementation and browser acceptance pending. Provisional strength, not campaign balance.
Skeleton Mastery closure `a188810` precedes this source increment. Full P07b,
private-v1/C0–C4/G0–G7 remain open.

## Sources and scoped decision

`skills-paladin-meditation` / canonical `paladin.meditation` authors unlock24,
Cleansing prerequisite, aura:true/passive/self/cooldown0, cap20 and
manaRegenPct0.03 per allocated rank. Both old locale descriptions and the passive
spec instead promise5mana/turn. The current selector/save/runtime supports only
Might; native mercenaries have no baseline regeneration. BUG068 records this
source-only discrepancy before correction. Neither percent-maxMana nor fixed
per-turn recovery follows from the coefficient; D04 turn markers are presentation.

Root chooses an explicit denominator: the selected source Paladin's existing
normal mana-regeneration baseline. Per rank, Meditation adds3% of that source
baseline per second to the source hero and original living fielded mercenary.
Rank20 adds60% of the source baseline to each recipient, independent of the
recipient's own baseline. Preserve authored0.03 and the existing authored hero
recovery baseline0.2×effectiveEnergy. Do not add a global mercenary baseline,
percent-maxMana recovery or fixed5mana/turn. This supersedes only the obsolete
Meditation promise and defines a new explicit interpretation, not recovered
historical authority or measured tuning.

Use the numeric `fresh.manaRegenPerSecond` composed by `playerToCombatUnit` as
source-baseline authority; its adapter already applies authoritative equipment
and effective Energy once. Interpret that Number's shortest decimal string.
Do not recalculate Energy, infer recovery from maximum mana/stale equipment,
round the source baseline or broaden this card into existing baseline composition.
Copy baseline, rank and coefficient separately into the immutable wave projection.

Conceptually: recipient existing baseline + source baseline×coefficient×rank.
Implementation must not form that binary numeric sum/product before integration.
Energy20 gives source baseline4; ranks0/1/2/20 give hero rates4/4.12/4.24/6.4 and
native merc rates0/0.12/0.24/2.4. With sufficient missing capacity and no spending,
1.25s grants respectively hero5+0/5+0.15/5+0.30/8+0 and merc0+0/0+0.15/0+0.30/3+0.

## Authored definition and allocated eligibility

`resolveMeditationDefinition(rows)` finds exactly one authored player identity,
validates strict Ajv2020 skill schema and copies/freezes only
{requiredLevel,maxRank,manaRegenPctPerRank}. Reject canonical/near-match identities,
missing/duplicate rows and malformed exact metadata. Required unlock/cap are
positive integers; coefficient finite nonnegative, including alternate tuning
without an invented balance ceiling. Exact row requires aura:true, passive
trigger,self,zeroCD and a closed one-coefficient scaling object. Optional passive
is true and summon false; exclude payment/damage/status/tag/synergy/heal/summon/
AoE/equipment-gate metadata. Preserve unrelated skill identities and authored rows.

`resolveMeditationRank(levels?,definition?)` takes maximum finite positive integer
under the exact authored and canonical aliases once, clamping to copied cap.
No fallback rank1, sum, insertion-order override, combo/marker/legacy-skill inference
or similar-ID normalization. Separate eligible-rank helper checks exact Paladin
class and finite character level at least unlock. Cleansing remains enforced by
learning; a positive imported allocation gains no new runtime prerequisite rule.
Selection and encounter liveness remain separate from allocation/class/level.

## Explicit exclusive selection and save compatibility

One canonical Player.selectedAuraId slot supports None(absence),paladin.might or
paladin.meditation. Null clears physically, never stores undefined. Refuse unknown/
alias/malformed/ineligible requests without state publication or identity change;
eligible same selection and absent None are no-ops. Upgrading/focus/combo/hydration
never selects implicitly. Successful paid respec clears selection atomically;
failed respec preserves it. Each aura's eligibility/reason is independent.

Freeze historical v10 player shape as optional Might-only selection before
widening live Player. Add v11/current11 and a version-only10→11 migration, preserving
all resources/slices/native Maps and absence. Validate frozen v10 before migration
to11, including saves migrated through10; Meditation in historical v10 must be
rejected rather than pass through a widened current validator. V11 accepts only
the two exact canonical values; reject empty/alias/unknown/nonstring/null/own
undefined. Canonical but wrong-class/unlearned/underlevel selection persists;
store/runtime eligibility grants nothing. Preserve prior7/8/9 validation and
historical expectations. No transient aura/rate/carry is persisted.

## Runtime projection, recipients and replacement

At each actual playWave input freeze discriminator, sourceHeroId, original
fieldedMercCombatId (if distinct),rank,maxRank,sourceBaselinePerSecond and authored
manaRegenPctPerRank. Copy only primitives; independently copy/freeze at the engine
snapshot boundary. Same authoritative source-ID and original fielded-mercenary
boundaries as Might; never rediscover roster or use a different current player.
Source and recipients must be living player-side nonsummons with correct hero/
merc identity/kind. Exclude enemies,summons,bench or replaced mercs. Source absence
or death suppresses future contribution; stun/freeze does not. No cast/action/
payment/cooldown/marker/RNG/stored-rate mutation/global aura framework.

Only one aura can be active. Native composition derives it from the single slot.
If narrow optional mightAura/meditationAura snapshot properties coexist during
this implementation, engine normalization must explicitly reject simultaneous
projections before simulation, never stack or invent precedence. Existing valid
Might-only snapshots remain compatible. Might→Meditation removes Might's Attack/
physical contribution; Meditation→Might/None removes future additional recovery.
Already earned whole MP and fractional carry persist, except existing cap reset.
Repeated switching does not accumulate stat/rate multipliers or refill resources.

Ordinary selection/upgrade/equip/respec applies next recorded wave. Current
recording/team stays frozen. Explicit replay recomposes current configuration
over immutable ORIGINAL wave-input pools and all three original recovery-carry
fields; clamped/completed/replayed outputs never become baselines. Preserve
existing max-resource clamps/no-free-heal/reward exact-once behavior. New runs
start fresh carry0. No recovery between waves, offline or from wallclock/playback.

## Exact continuous recovery and interval eligibility

Reuse the existing MP-millisecond exact decimal integral and canonical exact
carry. Extend mana-recovery locally with a narrow scaled-contribution API using
readonly[coefficient,rank]; parse baseline/factors and exact endpoints by shortest
Number decimals, multiply/add privately using existing helpers. Preserve ordinary
integration API; no public decimal parser/shared library/rounding epsilon/quantum.

For each recipient, integrate its independently qualified existing baseline and
eligible aura contribution into ONE existing cumulative integral; absent/invalid
recipient baseline is zero and must not disable a valid merc contribution.
Compute final.wholeGranted−previous.wholeGranted once, export final carry once,
and commit/clamp once. Never floor each contribution separately, add binary rates
or keep independent aura carry. At cap discard overflow/all3carry as today.

Capture eligible source and recipient identities at interval START[from,to).
Settle periodic HP/death/orphan/refund/orb side effects first atto, then credit
surviving recipients for their earned interval. Recheck recipient identity/life
without rechecking the now-dead source. Source periodic death atto removes future
grants but cannot erase elapsed recovery for a surviving merc. Recipient dead
atto receives none, preserving Warmth's death priority and corpse carry snapshots.
No new death-time resource write/revival. Existing earliest-lethal boundaries
ensure source eligibility is stable inside the interval. Survivor terminal-time
recovery throughT occurs before winner/action-cap exit; none after termination.

Required literal precision oracles, sufficient capacity/no spending:
- source36.4,coefficient.03,rank20,25000ms:hero1456,merc546,exactcarry0both;
- source4,coefficient.03,rank11,25000ms:hero133,merc33,exactcarry0both;
- source1.4000000000000001,coefficient.03,rank1,1000ms:exactbonus.042000000000000003,
  hero exactcarry0.442000000000000103. The represented numeric baseline is authority.
Require equivalent one-interval,mixed partitions,fractional endpoints and qualified
wave handoff. These catch actual binary product/rate-sum loss without changing
existing baseline authority. Rank1/2/20,zero/invalid baseline,cap/spend,death/CC,
source mismatch,recorded/unrecorded,absolute MP playback and no-RNG controls remain.

## Ordered bounded increments and evidence

Root is sole writer/executor in claimed umbrella worktree; existing agents review
read-only. Every increment≤5repositorypaths, commits before next source increment;
no source edits during serial bounded gates. Preserve original failures, oracle
corrections, capability/collection distinctions, process births and exact cleanup.

1. Commit BUG068 source reproduction before source corrections. StageA: thisD05,
   skill.schema.json,meditation.ts/test(4). Freeze/review schema-only oracles,
   execute genuine unchanged-schema behavioral RED, then minimal exact schema.
   Independently freeze/review appended definition/rank/eligibility oracles;
   missing helper is capability failure, not behavioral RED; then implement.
2. Save-test compatibility preparation, at most5paths each, distinguishing current
   decode version from historical inputs; preserve explicit historical assertions.
3. Atomic5path cutover:entities.ts,types/save.ts,save/migrate.ts,save/validate.ts,
   selected-aura.test.ts. Genuine RED/frozen historical/current oracles first.
4. Store selector plus focused tests(2), no implicit selection/publication/refill.
5. PureMeditation projection/helper/tests and exact contribution helper/tests(≤4).
6. Combat.ts and focused combat tests(2), precise interval capture/pooled integral,
   suppression/terminal/cap/precision and explicit dual-projection refusal.
7. NativecombatHelpers plus focused tests(2), actual selection→nextwave/replay,
   respec/equip/all3carry/save/import/unaffected fullrecord/reward controls.
8. UI/copy4paths SkillsScreen,test,bothlocales; truthful coefficient denominator,
   independent eligibility and native None/Might/Meditation selection/reasons.
9. Spec reconciliation and D05 browser-pending status(2): replace obsolete
   Meditation row and §6.2 None/Might-only scope in the SAME skills-spec path.
   Preserve Might numeric/timing contract; distinguish Meditation interval credit.
10. Production browser config/spec(2), keyboardreplacement, actual mana/additional
    cast consequence, explicit Save→close/newPage→Continue and bilingual viewport
    screenshots. ImportedL24/prerequisite/ranks/gear are explicit scaffolding,
    never claimed earned-unlock/campaign evidence; no browser bridge.
11. Final docs closure only AFTER actual browser/source/QA/producer acceptance
    (≤5paths): D05 and BUG068 exact source commits, regression/evidence links
    and bounded fixed status; evidence/ledger durable archive and cleanup ownership.
    Do not mark Stage9 or BUG068 fixed before this acceptance.

Each source increment runs relevant focused/engine and fullunit/types/lint,
plus clean production bridge/build for integration. Gates serial with original
logs/reports/frozen hashes and fresh output/process inventories; existing engine3s/
full15s target misses and warnings remain visible, not accepted performance.
Final independent QA/producer evidence and GD/TD source review before acceptance.
Exact-owned disposable cleanup after all readers; preserve RAW until durable
packet/independent verification, then exact cleanup; shared caches/fonts/tools/
source/history/originalcheckout preserved. No push/PR/merge/deployment authorized.

Security check: PASS for local deterministic gameplay/typed save evolution.
Validate untrusted historical/current saves before acceptance; no validation
bypass/network/credentials/permissions/dependencies/CI changes. Full aura catalog,
merc baseline,otherpassives,earnedcampaign,balance,coverage,allbrowser/native/
offline/accessibility/performance and private-v1 acceptance remain separate.

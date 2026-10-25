# BUG-181 — Complete advertised Paladin aura selection and effects

Severity: High
Status: Open; eighteen selected auras locally verified in bounded scope, two distinct aura mechanics outstanding
Owners: engine-dev, frontend-dev, content-designer; root sole writer this run

## Reproduction

- Baseline `2b5608b`; deterministic native/store inspection, browser-independent.
- Both locales; viewport-independent. Save boundary requires no combat RNG seed.
1. Create an eligible Paladin and learn an authored aura other than Might/Meditation.
2. Inspect Skills selection or call `selectAura('paladin.thorns')`.
3. Round-trip a save carrying that canonical selection.

Expected: explicit single-aura selection, truthful distinct effect and durable
canonical selection for every advertised aura.

Actual: store rejects eighteen canonical IDs; UI provides only two auras; native
snapshot only carries Might/Meditation and current save validation rejects the
additional IDs. Generic passive-stat projection cannot implement the ten promised
pulse/control/recovery/resource mechanics.

## Evidence and root cause

`playerStore.ts` selection whitelist; `SkillsScreen.tsx` hardcoded radios;
`combatHelpers.ts` two projection paths; `validate.ts` two-value current enum.
`aura-v22.test.ts` baseline: 41 failed/15 passed, including rejected current IDs
and absent strict future migration. Original output retained in the task evidence.

Workaround: use existing Might or Meditation; this does not supply the missing
effects. Track the full family against `D05-paladin-aura-family-v1.md`. Do not close
this bug merely because selection/save support or the first eight effects pass.

Production validation of the first eight effects found a further integration
defect on baseline2b5608b plus the uncommitted batch: Chromium/en/1280×800,
new L1 Paladin → Skills → Resist Fire → Allocate leaves its aura radio disabled.
The allocator writes `paladin.resist_fire`; the new rank resolver checks only
`paladin.resist-fire` and `skills-paladin-resist-fire`. Four multiword selections
are affected. The tests had manually supplied the hyphenated selection ID as an
allocation key, missing the real producer contract. Preserve the selection domain;
resolve actual canonical underscore allocations as well as data/selection aliases
by maximum. Reproduce with the public allocation action before changing runtime.
Original screenshot, trace, browser report and log are retained in task evidence.

Local implementation: save a5c9c3a, runtime/native9329b3f, UI fdbbd55. The corrected
public-allocation regression passes34cases; full12229/515, engine6088/205,
types/lint/build/production bridge checks pass. Browser en/zh×desktop/mobile4/4
proves36 exact Continue pairs and40 geometry samples. [Evidence and original
failures](../../docs/plans/evidence/d05-paladin-stat-auras.md). The allocation-ID
finding is repaired; at that checkpoint the family remained open for ten distinct
pulse/control/recovery/corpse/interrupt effects, earned balance and independent QA.

Second batch bee0cd8 implements selected hero Holy Freeze and Conviction through
the shared wave projection. Actual Chill/cadence/provenance, six-type resistance
reduction, recipient damage/dodge, source authority, native public allocation,
replay and persistence pass. Full12261/517/two existing skips, engine6114/207,
types/lint/build/bridge pass. Production browser4/4 proves12 exact five-domain
Continue pairs and40 geometry samples. [Evidence and retained original failures](../../docs/plans/evidence/d05-paladin-enemy-auras.md).
Remaining after that checkpoint: Holy Fire, Holy Shock, Sanctuary, Cleansing, Redemption, Prayer,
Vigor and Concentration. The complete family, earned balance and independent
acceptance remain open.


Third batch `df9f1c0` adds actual selected Holy Fire and Holy Shock pulses and
canonical mitigated Fire Burn, with explicit JSON timing/base/Burn ownership,
source/death/tie/deadline/cap guards and no damage/proc RNG. Native allocation,
original-input replay, bilingual UI and savev22 selection pass. Full12286/519
plus two existing skips, engine6131/209, types/lint/build/bridge PASS; production
browser4/4,12 exact five-domain Continue pairs and40 geometry samples pass.
[Evidence and original failures](../../docs/plans/evidence/d05-paladin-pulse-auras.md).
Remaining six: Sanctuary, Cleansing, Redemption, Prayer, Vigor and Concentration.
Earned balance and independent whole-family acceptance remain open. Genuine
campaign save/next402 is unchanged; no actual campaign action occurred.

Fourth batch `96a67cb` implements selected Prayer with actual JSON-owned20-base
HP/5000ms healing, authored3%/rank scaling and missing-HP caps for the living hero
and original living fielded merc. Periodic deaths/ties/CC/deadline/action-cap rules,
strict copied metadata, public allocation, native HP/replay/import, and bilingual
fresh-L1 browser selection/persistence pass. Full12309/521 plus two existing skips,
engine6148/211, types/lint/build/bridge pass. Final browser4/4, eight exact
five-domain Continue pairs and20 geometry samples pass. All1235source/760build
hashes, HEAD/Git state and genuine save digest stayed exact through the full run;
committed source blobs match. [Evidence and retained original failures](../../docs/plans/evidence/d05-paladin-prayer.md).
Remaining five: Sanctuary, Cleansing, Redemption, Vigor and Concentration.
Prayer's five-second interval remains provisional local tuning; earned balance,
independent whole-family acceptance and the full private-v1 goal remain open.

Fifth batch `dcaa59b` implements selected Cleansing's finite Poison/Plague and
named curse duration reduction, independent periodic HP recovery and authored
magical dodge. Status-local transient identity prevents repeated cross-wave
shortening; refresh, boss scaling, source death and recipient-specific poison
spread retain existing ownership/potency and settlement rules. Prayer-only
top-level healing metadata stays separate. Focused100/5 and final full12346/523
plus two existing skips pass; the final full engine project passes6181/213.
Types/lint/build/bridge and production browser4/4 pass, with eight exact
five-domain Continue pairs and20 geometry samples. All1237source/760build hashes,
HEAD/Git and genuine save digest stayed exact through the full run; committed
source blobs match. [Evidence and original failures](../../docs/plans/evidence/d05-paladin-cleansing.md).
Remaining four: Sanctuary, Redemption, Vigor and Concentration. Cleansing's
duration factor and independent healing base/interval are provisional local
tuning. This verifies curse duration handling, not the other curse skills'
still-unverified effects. Earned balance and independent whole-family acceptance
remain open; the genuine campaign save/next402 is unchanged.


Sixth batch `af8b8d7` implements selected Redemption using the same authoritative
wave-local FIFO as Corpse Explosion and Poison Explosion. One useful corpse
restores independently floored/capped HP and MP to the living hero/original
living fielded merc; empty/full/zero-rounded opportunities preserve resources or
corpses as appropriate. JSON-owned20HP/10MP/5000ms and authored2%/rank,
source/death/tie/deadline/cap/ownership rules, public allocation, original-resource
replay/no duplicate income, savev22 and bilingual UI pass. Focused210/6,
engine6208/215 and final full12377/525 plus two existing skips pass;
types/lint/build/bridge and production browser4/4 pass, with eight exact
five-domain Continue pairs,20 geometry samples and18 radio labels>=44x44.
All1239source/760build hashes, HEAD/Git and genuine save digest stayed exact
through the full run; committed source blobs match. [Evidence and original
failures](../../docs/plans/evidence/d05-paladin-redemption.md).
Remaining three: Sanctuary, Vigor and Concentration. Recovery base/interval are
provisional local tuning; earned balance and independent whole-family acceptance
remain open. Genuine campaign save/next402 is unchanged.


Seventh batch `4cc9c5b` implements selected Vigor's temporary endurance and
attack cadence using unchanged authored2% life/0.5% speed per rank. Capacity
floors once over the fresh base; admission/selection/upgrade never grants HP.
Actual healing/orbs can fill the extra capacity, a transient exact base/applied
identity prevents wave compounding, and source death removes it before orb
settlement. BUG182's causal native prefix/initial-frame failures are repaired
at observation order and initial publication without relaxing prefix validation.
Public allocation, native healing/carry/original-resource replay/no duplicate
income, savev22 and bilingual UI pass. Final full12396/528 plus two existing
skips, corrected-source engine6222/217, types/lint/build/bridge and production
browser4/4 pass, with eight exact five-domain Continue pairs,20 geometry samples
and19radio labels>=44×44. All1243source/760build hashes, HEAD/Git state and
genuine save digest stayed exact through the426.170s full process; committed
source blobs match. [Evidence and retained original failures](../../docs/plans/evidence/d05-paladin-vigor.md).
182raw files/29terminal process records are byte-verified; exact cleanup removed
942owned files, scratch is absent and4468closed, with no failures/remaining paths.
Remaining two: Sanctuary and Concentration. Earned balance and independent
whole-family acceptance remain open. Genuine campaign save/next402 is unchanged.


Sanctuary identity prerequisite at `a03fed2`: causal
`src/engine/combat/monster-undead.test.ts` reproduces two genuine schema/factory failures, one incorrect corpus-count
assertion and seven controls passing (seed42, engine/schema path, locale/viewport independent). All109current
archetypes lack explicit classification, the schema rejects literal boolean
identity, and buildMonsterUnit discards authored true. Original output is
`red-identity.log` in the task-owned Sanctuary evidence root. Repair the schema,
authored corpus and factory boundary before implementing undead damage/control;
never infer identity from display names or archetype strings. This prerequisite
alone does not complete Sanctuary or change the supported-aura/skill counts.


Sanctuary runtime follow-up: exact definition/schema RED3failures/one control
became24passing definition/shared-aura tests. Corrected causal combat RED now
has9failures/three controls at seed42: no undead HP loss, no canonical repulsion,
no action interruption/recovery and no pulse kill. A separate initial fixture
allowed an ordinary1700ms attack to pre-empt its intended2000ms poison death;
that enemy is now explicitly held. A subsequent extra-parenthesis transform
error is retained but is not causal gameplay evidence. Repair the shared aura
interval/settlement consumer, reusing normal Arcane mitigation, timed Stun and
exact-once death closure; do not create movement or weaken validation.

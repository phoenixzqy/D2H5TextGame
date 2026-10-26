# D06 — Bone Wall and Bone Prison in non-spatial combat

## Overview

BUG262 proves both paid player skills currently produce markers without their
advertised defense/control. Implement two distinct real effects using transient
combat state. Preserve authored unlocks, prerequisites, costs, cooldown scaling,
rank cap and targets. This is a root-authored implementation contract; new numbers
are provisional tuning, with independent design/balance/feel acceptance open.

## Player fantasy

Wall buys survival by interposing destructible bone; Prison buys a short window
by stopping enemy actions. These support Challenge and Fantasy without adding
movement, range or a second spatial combat model. The repository pillar files
are absent; pillar sign-off cannot be claimed from that absence.

## Detailed rules

Wall: eligible learned Necromancer, unlock12/Bone Armor prerequisite, self,
17MP and4s at rank1. A paid cast creates one source-bound finite barrier that
absorbs already-mitigated hostile HP damage of every type. The barrier is
consumed before Energy Shield and personal Bone Armor, after existing percentage
reductions. Duration6000ms; capacity40+10*(effectiveRank-1). It neither stacks nor
refreshes while active; it may be paid again after expiry/exhaustion and cooldown.
Do not replenish on wave carry or consume it on a dodge/zero damage. Direct,
periodic, reflection and lethal-time prediction must use the same settlement.
No MP, stat maximum, party/summon defense or extra damage event is granted.

Prison: eligible learned Necromancer, unlock24, transitive Wall/Bone Armor
prerequisites, all living enemies,27MP and4s at rank1. A paid cast grants a
finite2000ms action trap (1000ms for boss/chapter-boss). The active interval is
[start,expiry). Trapped units lose scheduled ordinary actions and active channels
are interrupted at onset; already-launched non-channel effects continue. Incoming
damage, dodge and targeting remain ordinary. One trap per target, fresh source
and interval replace an earlier trap without stacking. A marker alone grants no
control. The trap is not a curse and Cleansing does not shorten it. Caster death
or absence does not release a paid trap early. No damage, body, corpse consumption,
immobilization-based dodge change or new RNG is introduced.

Both skills require actual legal class allocation and complete prerequisites;
combo IDs, imported markers, another class, malformed rank and registry overrides
cannot supply permission. Actual paid Battle Command may raise potency to21;
it cannot grant an unlearned ability. Preserve ordinary payment/cooldown rounding.

## Formulas

For effective rank r=1..21, Wall capacity=40+10*(r-1):40/90/150/230/240 at
r1/6/12/20/21. Duration stays6000ms. Absorb=min(capacityRemaining,damageRemaining),
then decrease both by absorb. Exhaustion removes the paid pool.
For each skill, cost=max(0,round(baseCost-.2*(r-1))) and cooldown=max(1,
roundToOneDecimal(4-.05*(r-1))) seconds. Rank1/20 costs are17/13 Wall,27/23 Prison;
cooldown4/3.1s. Prison duration=2000ms, boss floor(2000*.5)=1000ms.

## Edge cases

Validate finite positive authored timing/capacity, exact ownership and metadata;
refuse missing/duplicate definitions. Validate finite source-bound paid payloads,
clocks and rank bounds without mutating caller input. Cover exact expiry,
fractional clock rebasing, exhaustion/overflow, duplicate markers, empty targets,
insufficient mana, aliases, cooldowns, absent/zero/fractional/NaN/infinite ranks,
wrong class/level/prerequisite, dead/source-less recipients, shields in combination,
simultaneous DoTs/deaths and channel cancellation shorter than pulse interval.
Do not silently repair invalid imports into paid protection or persistent stats.

## Dependencies

JSON/schema -> immutable skill definition -> exact adapter/eligible native rank
-> paid combat payload -> shared damage/action consumers -> recorded native
playback. UI previews and bilingual desc keys must explain capacity/duration,
trap duration/boss reduction and cost/CD; ordinary status display must reflect
expiry. Existing save version/shape remain unchanged; paid state is run-local.
Wave carry preserves only unexpired remaining power/interval, never renews it.
Unlocked replay recomputes; locked replay preserves original recording. Genuine
campaign/save remains untouched. Browser controls must work at360x640 and1280x800.

## Tuning knobs

New feel knobs: Wall6000ms, Prison2000ms/.5boss. New curve knobs: Wall40base/10per
rank. All owned by JSON and strict schemas, never duplicated engine constants.
Gate knobs and existing cost/CD scaling are preserved. No balance claim follows
from these values; earned affordability, survival/TTK and player readability need
separate evidence before shipping. No extra resources/XP/loot/enemy tuning.

## Acceptance criteria

1. Original native paid Wall/Prison diagnostic branches show actual reduced HP
loss and fewer permitted enemy actions respectively, with positive controls.
2. Literal schema/definition/engine tests prove the rules, negative authority,
expiry, damage composition, channels, rank21 and immutable inputs.
3. Native allocation/casts/payment/cooldown/wave/replay/save and bilingual preview
are verified. Production browser tests show actual protection/control, save/load
and activated-service-worker offline Continue across both locales and viewports.
4. Independent reviewer/QA/design and earned-build balance/manual playtest remain
explicitly open until observed. Author tests cannot close those gates or privatev1.

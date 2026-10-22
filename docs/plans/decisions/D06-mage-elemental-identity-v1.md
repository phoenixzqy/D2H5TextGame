# D06 v1e — Skeletal Mage elemental basic bolts

Status: bounded mechanic contract, 2026-10-22; independent GD/TD/QA acceptance
is recorded in execution-ledger v1ay and its frozen review/publication manifests.
The contract alone establishes no related runtime or full-skill acceptance.
This follows [v1c paid preparation](D06-summon-corpses-v1.md) and its
[bounded delivery](../evidence/d06-necromancer-preparation.md). It does not close
full D06/P09/P10 or private-v1. Root is sole writer/executor; each implementation
increment remains at most five repository paths and commits before the next.

## Overview and controlling sources

Fresh, successfully prepared player Skeletal Mages fire direct elemental basic
bolts instead of physical basic attacks. Assign each new Mage one fixed element
for its lifetime, using a predictable fire/cold/lightning/poison cycle. Preserve
v1c's whole-missing-batch22MP startup, rank caps, creation-only Skeleton Mastery,
corpse-free preparation and no replacement/refund. This card defines elemental
direct damage only; automatic signature statuses and full Mage skill acceptance
remain a named follow-up.

Canonical `Diablo2TextGame.md` §5.2 requires once-at-start summons, attack-speed
actions and no ordinary hero action for preparation. Section5.3 establishes the
elemental/status vocabulary; this child does not claim its full signature kit.
`docs/design/skills-spec.md` and v1c explicitly leave Mage combat identity open.
The authored `skills-necromancer-raise-skeletal-mage` maps to canonical
`necromancer.raise_skeletal_mage` and exact template `skeletal_mage`. D04's
[accepted timing contract](D04-combat-timing-v1.md), current damage/combo pipeline
and v1c remain controlling outside the additions below. Pillar/anti-pillar files
are absent; use the canonical GDD without inventing pillar approval.

## Player fantasy, alternatives and tradeoffs

A growing retinue visibly adds elemental variety, giving readable resistance
matchups and build discovery. This serves Fantasy, Discovery and Competence;
allocation and combo choices retain the player's resource/build agency.

Choose stable fresh-batch cycling: first fire, then cold, lightning, poison,
repeating in that order. It gives predictable diversity, with one of each at a
fresh rank6 cap-four preparation. Rank1 is always fire, and Poison first appears at rank6 with an empty group.
Fresh missing counts1/2/3/4/8 yield F/FC/FCL/FCLP/FCLPFCLP respectively. This gives
up random per-unit composition and direct player element selection. Independent seeded
per-unit draws would preserve a classic unpredictable retinue, but permit
uneven compositions and add RNG/fork identity rules without a current player
control for that variance. Recasting/rerolling elements inside a wave is rejected.

Keep existing Attack as bolt potency instead of adding another spell base,
coefficient or per-element growth curve. All four bolts have the same pre-defense
potency, so a poison bolt here is direct damage rather than a poison-stack/DoT
promise. This is a bounded adaptation, not parity with classic D2 Mage behavior
or completed §5.3 status design. No new balance or earned viability is inferred.

## Detailed rules

1. Preserve exact v1c startup qualification: current class composition, learned
   integral rank1–20, level12, learned Raise Skeleton direct prerequisite and
   explicit combo slot; canonical/authored aliases deduplicate. Validate the
   canonical source and matching summon effect/template before preparation.
   This card does not give unlearned, foreign, enemy or synthetic sources a
   canonical Mage fallback.
2. After the complete missing batch has passed existing candidate validation
   and successfully paid/registered at time0, assign elements only to those
   fresh player-owned Mage registrations. Require the existing living player
   hero/owner provenance and exact canonical source/template. A same-template
   synthetic cast, enemy summon, unrelated summon or preloaded unit receives
   no new elemental authority. No name/ID substring inference.
3. Each owner's successful fresh batch starts at local index0: indices0/1/2/3
   are fire/cold/lightning/poison;4/5/6/7 repeat. Use returned fresh registration
   order after existing stable preparation order. Preloaded/dead/collision-skipped
   IDs, other owners and other summon templates do not advance this local index.
   A rank6 batch missing three after one preload creates fire/cold/lightning;
   the preload keeps its existing physical behavior. A later new wave starts
   the fresh cycle at fire again. Under unchanged input, seed changes cannot
   alter assignment, though existing hit/crit/target RNG can change damage.
4. Assignment uses no RNG draw, RNG fork, global counter or mutable registry
   decoration. Maintain only battle-local actual-unit-ID→element authority,
   populated for successful fresh canonical registrations. It is the sole
   attack-type authority; snapshot fields or a reused template marker cannot
   grant it. Never retrofit preloads, mutate input units or persist that map.
5. Every qualified Mage ordinary action is one elemental basic bolt against one
   target chosen by existing `pickDefender` rules, including existing threat/
   taunt/position rules. Add no projectile, range, movement, splash, new target
   priority or guaranteed hit. Emit the existing basic action (`skillId: null`)
   and a damage event attributed to that Mage's actual ID and chosen element.
   No new hero cast, Mage MP payment, skill slot or per-bolt cooldown is added.
6. Use existing attack-speed scheduling and controls: AS70's first uncontrolled
   action is1940ms, next3880ms. Stun/chill/death/owner orphan removal and rescheduling
   continue through the shared engine. Preparation does not grant a time-zero
   bolt. No attack after death or combat end; inclusive60,000ms deadline remains.
7. Preserve base/rank stats and apply eligible Skeleton Mastery exactly once to
   fresh units before bolt potency. Keep fractional stored Attack; existing basic
   attack base floors it once at attack time, minimum1. All four types use this
   same base with no new elemental multiplier, random base range, flat bonus,
   owner spell/core/gear inheritance or mastery reapplication per shot.
8. Route the bolt through existing direct damage resolution: default85% hit
   minus target magical dodge, minimum5%; existing Mage crit5% and×1.5; chosen
   element's resistance and existing resistance clamp; ordinary Defense for
   fire/poison, Magic Resistance for cold/lightning; final floor/minimum1 on a
   hit,0 on dodge. Preserve actual unit modifiers and target active-status/combo
   interactions in the shared path. Do not build a parallel mitigation formula.
9. No automatic burn/ignite, armor-melt, chill/freeze, paralyze, poison stack,
   plague, DoT or associated status-application RNG comes from a bolt's type.
   Existing target statuses can amplify the chosen incoming type. Physical-only
   Amplify Damage, bleed/ignite/freeze bonuses and shatter execute no longer
   apply to these elemental hits; appropriate elemental interactions now can.
   Current Might already excludes summons and remains unchanged. Existing
   defender-triggered reactions, such as paid Frozen Armor retaliation, remain.
10. Damage resolution honors an explicitly supplied defender resistance penalty;
    this card does not make act4/5 alone author or apply one. Live combat retains
    its current75% resistance cap and minimum-hit-damage behavior, without new
    immunity/penetration/unique-cap integration. Helper-only configurable caps
    are not evidence for a live cap95 feature.
11. Preserve full/over-cap preload no-op,21MP refusal versus22MP batch payment,
    no partial batch or later retry after recovery, startup cooldown1s, valid
    source death authority, no in-wave replacement/refund, coexistence and D04
    carried resources. Death/orphan ends that unit's attacks; wave end discards transient elemental
    authority. Actual next wave freshly prepares/pays under existing rules.
12. Pure/recorded battle runs with the same snapshot must agree, including
    IDs, timestamps, damage types and amounts. A/A and A/B/A require no reset.
    Preserve store replay policy: Mage-only waves use existing current-config
    replay from captured original resources/carries; unchanged config repeats
    the same result. Configuration changes follow that existing policy. An
    Iron-locked recording keeps its whole original recording. This card adds
    no new replay lock, reward identity, save field or anti-rollback claim. Assignment
    adds no random draws; changed elemental battle outcomes need not preserve the
    old physical battle's later random trace.

## Formulas and independent literal oracles

For allocated Mage rank `r` in1–20 and eligible Skeleton Mastery `m` in0–20:

```text
cap(r) = r                         for r <= 3
cap(r) = 3 + floor((r - 3) / 3)    for r >= 4
lifeMax = (88 + 7 * (r - 1)) * (1 + 0.04 * m)
Attack  = (30 + 3 * (r - 1)) * (1 + 0.02 * m)
Defense = 10 * (1 + 0.01 * m)
magicDodge = 0.08 + 0.002 * (r - 1)
boltBase = max(1, floor(Attack))   // no other modifiers in these examples
element(i) = authoredCycle[i mod 4], i = fresh local batch index starting at0
periodMs = clamp(2500 - floor(attackSpeed) * 8, 400, 2000)
```

These record existing template/growth/Mastery values, not new tuning. Rank1/6/20
without Mastery yields cap1/4/8, life88/123/221, Attack30/45/87, Defense10 and
magic dodge0.08/0.09/0.118. Caps at ranks1/2/3/5/6/11/12/20 are1/2/3/3/4/5/6/8.
Rank6 with Mastery1 has127.92/45.9/10.1 and bolt base45; Mastery20 has221.4/63/12
and base63. Preserve the45.9 stat despite its base45 direct hit. No display
rounding is fed back into stats or damage.

For a successful noncritical hit with no other modifiers/combos, let `B` be the
bolt base, `R = clamp(typeResistance - explicitPenalty, -100, 75)` and `M` be
ordinary Defense for fire/poison or Magic Resistance for cold/lightning:

```text
hitDamage = max(1, floor(B * (1 - R / 100) - M))
criticalHitDamage = max(1, floor(B * 1.5 * (1 - R / 100) - M))
dodgedDamage = 0
```

With25% chosen-element resistance, Defense12 and Magic Resistance5, independently
specified rank1/6/20 noncritical values are fire/poison10/21/53 and cold/lightning
17/28/60. Rank6 Mastery1 remains21/28; Mastery20 is35/42. Rank6 critical values
are38/45. At effective resistance0/75/−100, rank6 noncritical fire/poison values
are33/1/78 and cold/lightning40/6/85. A raw95% type resistance still caps at75%.
A raw50% resistance with explicit penalty20 gives effective30% and rank6 values
19/26; raw25% with explicit penalty40 gives effective−15% and39/46. These assume
hits, not guaranteed-hit runtime tuning. With magic dodge0.20, hit chance is0.65;
with magic dodge0.90 it bottoms at0.05. No physical-dodge substitution is allowed.

A fresh rank6 zero-preload batch at22MP creates four Mages at0ms in fire/cold/
lightning/poison order and leaves0MP; at21MP it creates none and retains21MP.
A full cap-four group creates none and costs0; a missing-three batch still costs
22MP once, not66MP. An uncontested, unmodified living AS70 Mage has30 action
opportunities at1940,3880,…,58,200ms, with no60,140ms action. Scheduling/control
and victory can reduce actual actions.

With the same rank6 base45/resistance25%/Defense12/Magic Resistance5 and a
successful noncritical hit, existing target statuses yield Lightning into chill38,
Poison into ignite26 and Fire into paralyze28. These bolts do not create those
statuses. Physical-dodge and curse/shatter controls distinguish real type routing.

These are functional oracles, not campaign DPS/TTK or earned viability evidence.
Signature statuses remain unimplemented by this child and cannot be counted as
accepted from elemental damage, status-looking colors or localized spell names.

## Edge cases, dependencies and authored data

Data flow: authored validated Mage element cycle → copied immutable definition →
existing canonical batch validation/payment/registration → battle-local authority
→ shared basic action/damage events → existing localized logs/playback. Keep the
engine pure and all new gameplay tuning in JSON. Add the cycle to the existing
Mage skill row as top-level `summonBasicAttackElements`. SkillDef/schema require
exactly four unique entries from fire/cold/lightning/poison on that exact authored
Mage row and reject the property on unrelated rows. Order is authored tuning,
not a parallel TypeScript default. The initial list is exactly F/C/L/P; missing, duplicate, empty, physical/arcane/thorns or foreign-skill
metadata cannot silently fall back. A definition resolver copies/freeze-validates
it independently of the mutable registry. No wholesale summon-template migration
or unrelated skill-adapter rewrite is authorized.

Whole-batch validation precedes payment/identity/scheduler/authority changes.
Unknown/malformed source/template/candidate and nonfinite/overflowing stats keep
v1c's refusal. An invalid authored definition must fail clearly at its data-load
boundary; never pay for a physical fallback advertised as elemental. Metadata
foundation increments remain inactive until their reviewed runtime consumer.

Preloads keep all stats, life, position, statuses and physical attack behavior,
including full/over-cap groups; no element is inferred from an ID or input marker.
Actual allocated collision-skipping IDs are the keys for fresh authority. Two
eligible owners each start fresh fire and do not share a cycle counter. Existing
Skeleton, Revive, golems, enemy/synthetic Mage and malformed-source controls stay
unchanged. Accepted absent/poor/full death behavior must not gain a refund or
replacement. No corpse/inventory action or new save migration is needed.

## Player presentation

Keep the exact skill name in both locales. Update
`necromancer.raise-skeletal-mage.desc` only after the runtime behavior is enabled.
Copy must describe direct elemental basic bolts, predictable fresh fire/cold/
lightning/poison order, no corpse,22MP once for the missing batch and no automatic
status/DoT. It must not promise random spellcasting, slow or poison-over-time.
Current/next skill detail retains the existing cap/rank/Mastery arithmetic.

Use the existing localized `combat:damageType.*` damage log with real Mage source,
actual target, amount and type, plus existing damage FX. A new card badge or
serialized unit marker is unnecessary for this bounded text-first presentation.
Successful-hit logs expose the type; existing dodge copy omits it. No pre-attack
per-unit element inspection is promised. Do not infer type solely from color.
Verify ordinary Skills/combo/Map/Combat and
save/reload/replay flows on production bytes in zh-CN/en at360×640,412×915,mobile
landscape,1280×800 and1920×1080. Readable wrapping, keyboard operation,44px targets
for changed controls and no overflow remain required. Imported functional
fixtures must be labeled unearned; no repeated failed acquisition recipe.

## Tuning knobs and acceptance criteria

Feel: retain AS70, existing first-action scheduling and control responses. Curve:
retain authored rank growth and creation-only Mastery. Gate: retain L12/prerequisite,
rank caps and22MP missing-batch payment. The authored cycle's order is a reviewed
identity choice; no per-element coefficient, new status duration or random weight
is added. Later changes require reviewed design and numerical evidence.

Before related runtime, GD/TD/QA approve exact rules, literal oracles and the
following ≤5-path sequence. Each increment preserves original RED/GREEN evidence,
serial required checks, frozen independent reviews, conventional local commit
and exact cleanup after readers release:

1. Authored metadata foundation: SkillDef, skill schema, Necromancer JSON,
   metadata/schema test and ledger (5paths). No runtime/copy promise yet.
2. Pure immutable definition/cycle helper, its tests and ledger (3paths).
   Literal element order, reset/invalid-index/source/data cases and no RNG are
   tested independently of combat. No runtime consumer yet.
3. Combat consumer, a dedicated engine test file, existing
   `src/engine/combat/summon-preparation-corpses.test.ts` and ledger (4paths).
   Update that regression's fresh canonical Mage physical-only expectation while
   preserving its Mastery assertions and Revive/preload physical controls. Prove
   fresh batch authority, all four actual damage types/amounts, r1/r6/r20 and
   Mastery, magic/physical dodge contrast, crit/resistance/mitigation/rounding,
   cadence, active target combos and no automatic status/DoT. Preserve full/
   poor/dead/terminal/invalid source/template/candidate, collision, owner, preload,
   no-retry/refund and all unrelated controls. If a needed fix exceeds scope,
   split another independently reviewed increment rather than omit a case.
4. Production composition/replay/playback/log tests and ledger (≤5paths): exact
   class/level/prerequisite/slot/alias qualification, next-wave carry and fresh
   cycle, unchanged-config replay, A-A/A-B-A, Iron-locked replay, attribution,
   plain/recorded equality, immutable input, no added assignment RNG or duplicate
   rewards. Prove real HP changes, not only event names.
5. Bilingual copy plus mounted skill/log tests and ledger (≤5paths), then a
   separately scoped production-browser evidence increment with native controls
   and the layout/locale matrix. Native Save/close/Continue rebuilds transient
   summons; no free persistent Mage. Runtime and browser acceptance require their
   own evidence; this document alone accepts neither.

QA must freeze literals before RED. Engine edits run focused/engine regressions,
full units/types/lint/production build before handoff; metadata-only/definition
slices use the checks appropriate to their inactive scope. Preserve existing
warnings/budget failures honestly; never weaken a gate. Screen damage/TTK risk
with a small deterministic same-fixture physical-versus-elemental comparison
first. Before balance acceptance, capture paired seeded baseline/proposed scenarios
with at least1000 runs per scenario, covering rank/Mastery boundaries, ordinary
Defense versus Magic Resistance, resistance/dodge asymmetry, target combos and
realistic mixed armies. Report TTK, death rate and mana starvation; schedule earned
build/campaign/holdout evidence separately. Unchanged Attack is not neutral power:
illustrative rank6/Mastery0 four-unit expected DPS is45.742 physical versus63.268
F/C/L/P against Defense20/Magic Resistance0, zero target dodge/resistance/statuses
and existing85% hit/5% crit/1940ms cadence (38.314% increase). This is arithmetic
with per-hit floor, not a simulation or balance sign-off. Existing warnings, signature statuses/full Mage, other corpse
consumers, full D06/P09/P10 and private-v1 remain open. No remote action.

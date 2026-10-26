# D06 — Learned authority and temporary effective ranks

Status: provisional author contract for the first BUG241 implementation increment.
Battle Command itself remains reproduced and unfinished. No skill credit,
independent design/QA acceptance or earned balance is established here.

## Overview

Separate durable learned rank from temporary effective rank. Existing allocated
rank resolvers retain exact aliases, MAX deduplication, authored allocation caps
and class/level gates. A temporary bonus changes the potency of an eligible
learned skill without granting permission to use an unlearned one. Start with
the Barbarian passives that native composition currently materializes before
battle: endurance, weapon masteries, Iron Skin, Shout and Battle Orders.

## Player fantasy

Battle Command must strengthen the skills the party actually knows. A mastered
skill can become temporarily stronger without spending or refunding a point.
The player's build choices and weapon requirements continue to matter.

## Detailed rules

1. Keep allocated and effective rank as separate values. Never increment the
   player's saved skill map, prerequisite ranks, equipment grants or skill order.
2. Resolve allocation using existing exact aliases and authored caps first.
   A positive, safe integral resolved rank may receive a nonnegative safe
   integral temporary bonus. Invalid/overflowing bonuses leave the resolved
   learned rank unchanged; invalid/unlearned ranks resolve to zero.
3. Effective ranks can exceed the allocated cap. In particular an allocated
   rank20 with a temporary bonus1 produces rank21. Zero learned ranks remain
   zero. A bonus does not bypass class, level or matching-weapon eligibility.
4. Add an optional explicit `temporarySkillRankBonus` composition input, default
   zero. Use shared pure effective-rank arithmetic in the existing composers;
   do not install mutable global context or reinterpret imported allocation.
5. Centralize the Barbarian passive projection used by native composition so
   subsequent paid-buff application can recompose from a fresh baseline. Keep
   existing multiplication/addition order and ordinary baseline values exact.
   This increment exposes bonuses, not a second competing combat-stat formula.
6. Existing definition copies remain immutable and JSON owns every coefficient,
   unlock and allocation cap. Temporary composition must not mutate or freeze
   caller-owned inputs. Removing the bonus recomposes the original values.

## Formulas

Let `a` be the existing resolved allocated rank and `b` the validated temporary
bonus. `effective(a,b)=a+b` if `a>0`, otherwise zero. Invalid `b` or an unsafe
sum uses `a`. Examples: `(0,1)->0`, `(1,1)->2`, `(20,1)->21`, `(20,0)->20`.
Coefficients remain authored: Stamina life .03/rank, Speed attack speed .01
and physical dodge .005, Natural Resistance .02 all resistance and .005
magical dodge, Iron Skin defense .04, Shout defense .03, Orders life .04
and mana recovery .01. Weapon mastery coefficients retain their JSON curves.
Allocation above the authored cap is still capped before the temporary bonus.

## Edge cases

Both aliases, malformed companion alias, unlearned/lookalike/granted identities,
rank1/20 and alternate authored caps, foreign class, below-unlock level,
nonmatching weapon, fractional/negative/nonfinite/string/unsafe temporary input,
unsafe arithmetic and repeated compose/remove calls. Existing allocation
normalization stays compatible. No resource or RNG operation occurs here.

## Dependencies

Existing allocation resolvers -> shared effective-rank arithmetic -> Barbarian
passive composers -> one combined passive projection -> native hero composition.
No JSON/schema, save22, React, DOM, new dependency or campaign change.

The remaining BUG241 increments must add the actual JSON-authored paid party
effect and copied native authority, caster/allied eligibility, active-specialist
and corpse-skill effective ranks, passive application/removal and life/recovery
handling, paid-effect snapshots, expiry/death ordering, wave carry, bilingual
UI and production save/offline evidence. Before that implementation, its full
contract must decide duration, nonstacking, newly summoned recipients and
source-death behavior. This rank increment does not claim to settle them.

## Tuning knobs

No new tuning values. The bonus is an explicit composition input; Battle
Command's future data definition will supply it. Existing feel/curve/gate
values remain JSON-owned. No balance or encounter retuning in this increment.

## Acceptance criteria

First retain causal REDs showing current composers ignore the explicit bonus.
Prove all supported Barbarian passive coefficients change at ranks1/20 while
unlearned/locked/foreign/nonmatching cases remain neutral. Prove input purity,
alias deduplication, alternate data tuning/caps and exact baseline recomposition.
Use native integration regressions to preserve combat stats/recovery/equipment
and existing causal battle consumers. Run engine/full unit, types, lint and
production build before committing the increment. Actual Battle Command
reproduction must remain open until the full paid skill is implemented.

## Author design, security and plan review

Design review: eight required sections present; learned-build agency is
preserved. Pillar documents are absent; independent pillar and balance signoff
remain unproven. No movement, potion, currency, RNG or stack changes.

Security check: pass for the local rank/composition increment. No credentials,
network, permissions, CI or untrusted commands. Explicit inputs are pure values;
no imported status can establish paid buff authority. Genuine saves stay intact.

Plan review: ready for this increment, with explicit overcap, no-learned-rank
grant, unchanged default and native baseline regressions. This is one dependency
of the complete repair; it cannot close BUG241 or increase inventory credit.

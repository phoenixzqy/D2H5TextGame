# D06 — Find Potion as finite corpse recovery

Status: provisional author contract. Root is the sole writer/reviewer; no
independent design/QA approval or earned balance acceptance is claimed.
Repairs the Find Potion part of [BUG225](../../../production/bugs/BUG-225-barbarian-corpse-skills-ignore-bodies.md).
Find Item and Grim Ward remain separate unfinished corpse consumers.

## Overview

Keep the advertised Barbarian corpse-search identity and existing level1,
ranks1–20,2MP and rank-scaled cooldown. Consume one actual enemy-monster body
from the existing shared wave-local FIFO to restore the caster's life and mana.
This is immediate recovery, with no potion item, inventory grant or passive MF.
The game invariant forbids red/blue potions; the historical skill name remains.

## Player fantasy

An opening kill supplies recovery for sustained fighting: Challenge, Fantasy and
Competence through combo priority. Empty supply or no useful recovery skips to
the next legal skill/basic attack during the same action. The player chooses
recovery versus other corpse consumers, with no manual body click.

## Detailed rules

1. JSON owns `corpseRecovery` life/mana fractions and per-rank growth. Remove the
   inert `find-potion` status and unrelated MF scaling from this row only. Exact
   registration is one dedicated `corpse-recovery` effect; altered/extra effects,
   wrong aliases/class/trigger/target/startup or extra resource costs are refused.
2. Compose `{sourceHeroId,rank}` from a nonempty actual Barbarian Player ID,
   integral level>=1, maximum valid allocated alias rank1–20. Exact aliases are
   `skills-barbarian-find-potion` and `barbarian.find_potion`; invalid values are
   ignored, never clamped or summed. No prerequisite is authored for this skill.
   Generic CombatUnit levels/orders or old buff markers confer no authority.
3. Copy/freeze the complete projection array; sparse/malformed/extra-field or
   duplicate-source arrays confer no Find Potion authority. At runtime require
   a living finite-HP player hero without summon/owner markers and valid level.
4. Activate the existing corpse pool for eligible Find Potion-only battles.
   Preserve CE/PE/vine/Redemption primary-death/orphan/summon/initial-dead rules,
   FIFO ordering and exactly-once credit. All consumers share the same tokens.
   Find Potion consumes a body, never a unit/death/reward record.
5. Selection is pure: require a body, living hostile, exact skill, eligible rank,
   finite affordable mana, both aliases off cooldown and useful recovery.
   Recheck at synchronous commitment before spending one oldest body/2MP and
   starting ordinary cooldown. Restore once after payment, cap to current maxima.
   No useful recovery means neither positive HP gain nor net MP gain relative
   to pre-payment MP. A full hero cannot spend a body only to refund its cost.
6. Use ordinary heal and mana events, with `find-potion` mana-recovery reason and
   localized consumption feedback containing corpseId/remaining count. No RNG,
   damage, status/buff, extra orb, summon, XP, material or item is produced.
7. Recompose eligibility/current rank for each native wave. New simulation/wave
   starts empty; issued recordings stay immutable. Playback applies the recorded
   heal/MP once; recomputation never grants inventory rewards. Save22 persists
   learned configuration only; no corpse, paid state or migration is added.

## Formulas

For integral rank r in1–20, life fraction =0.10+0.005*(r-1), mana fraction
=0.05+0.0025*(r-1). Independent raw amounts are floor(maximum*fraction).
Clamp HP to missing life and MP after paying2 to missing mana. Ordinary recovery
has no extra crit, regeneration multiplier or Attack scaling.

At maxima1000HP/100MP, ranks1/2/20 restore100/105/195HP and5/5/9MP before caps.
At500HP/50MP, rank1 becomes600HP/53MP: pay2 then restore5. At full HP/MP it
skips entirely. At full HP and99/100MP it pays2/restores3 for net+1MP.
At full HP and9/10MP rank1 raw MP=0, so it skips.

Cooldown follows existing rank rule: max(1, Number((4-0.05*(r-1)).toFixed(1)))
seconds. Preserve its existing decimal rounding and ordinary scheduled cadence.

## Edge cases

Cover no bodies, initial-dead/summon/orphan exclusions, last-enemy termination,
one shared body/two consumers, exact affordability/cooldown, tiny/fractional
deficits, malformed/nonfinite pools, dead/wrong-role actor, invalid projections,
aliases/registry tampering, all ranks, repeated deterministic runs, no stale
input mutation and no random draws in refused selection or successful recovery.
Only finite positive maxima and finite nonnegative current pools are eligible;
overflowed recovery calculations are refused before resource/body commitment.

## Dependencies

JSON/schema/types -> independent definition/Player projection -> native snapshot
-> existing battle pool/selection/payment/healing -> recording/playback -> Skills
display and both locales. Reuse existing UI controls; descriptions and current/
next/MAX rows expose actual percentages, one body, payment/cooldown and skip.
Production mobile/desktop en/zh-CN checks must use public controls and actual
offline Save/Continue. Synthetic fixtures cannot establish earned balance.

## Tuning knobs

Curve: JSON base/growth fractions10%/0.5pp life and5%/0.25pp mana. Feel: existing
2MP and4s/-0.05s per rank cooldown. Gate: existing unlock1/rank cap20/real corpse.
Fractions are provisional author tuning; no enemy/XP/loot/pacing adjustment is
authorized to force this skill's acceptance.

## Acceptance criteria

Native learned no-body regressions must stop paying/casting; an actual eligible
death must cause one ordinary paid action and exact capped HP/MP recovery. Pure
negative selection matches fallback RNG; shared consumers cannot duplicate a
body/death/reward. Definition/schema, authority, resource/lifecycle, replay,
native wave/current-rank/save and bilingual current/next/MAX tests must pass.
Production public-browser mobile/desktop bilingual evidence and required unit,
engine, typecheck, lint, build/precache checks remain required before credit.
Independent playtest must assess whether opening-kill recovery and shared-body
competition are understandable/useful; automated mechanics cannot approve feel.

## Author reviews and execution order

Security check: pass. Scope is local engine/data/UI mechanics; no credentials,
network, CI bypass, dependencies, save import expansion or external publication.
Design review: eight sections present; no missing section. Pillar documents
remain unavailable, so no independent pillar approval is inferred. No-potion,
seeded-RNG, JSON tuning, mobile/i18n and versioned-save invariants are preserved.
Plan review: ready after explicitly handling net MP usefulness, both-alias
cooldowns, finite pools, shared supply and unchanged reward settlement.

Root owns: first native RED/contract; then schema/data/definition/adapter, battle
transaction, native projection/playback tests, bilingual preview/UI, production
browser evidence and exact artifact cleanup. Use incremental local commits;
independent acceptance remains open under the sole-author constraint.

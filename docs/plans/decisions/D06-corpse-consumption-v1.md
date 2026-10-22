# D06 — wave-local Corpse Explosion consumption

Status: accepted bounded mechanic contract, 2026-10-22; independent GD/TD/QA
contract approval is recorded in execution-ledger v1bu (commit `ddd918c`).
The contract alone granted no runtime, balance, earned-progression or full-skill
acceptance. Subsequent bounded engine/native/Skills and production-browser
acceptance is recorded in [the evidence report](../evidence/d06-corpse-explosion-ui.md)
and execution-ledger v1bv–v1bz: engine `7cd5768`, regression closure `ca8f641`,
feedback `bd62ea3`, native `cdfec4e`, Skills `6eb41de`, browser `f0f4d99`.
Imported functional fixtures do not establish earned progression, affordability,
balance or player feel; those and full D06/P09/P10/private-v1 remain open.
Root is sole writer/executor in the existing claimed worktree. Every delivery
increment owns at most five repository paths and commits before the next.

## Overview and controlling sources

Corpse Explosion consumes one finite enemy-monster corpse created by an actual
primary death in the current wave. A shared player-team pool makes the skill a
follow-up to a kill, rather than an unconditional opening spell. Preserve its
authored direct fire damage and ignite behavior through the existing engine.

The [skills catalog](../../design/skills-spec.md#32-necromancer-死灵法师--毒召唤)
promises an on-kill corpse requirement. [D06 v1c](D06-summon-corpses-v1.md)
explicitly excludes explosion consumers from corpse-free summon preparation.
[D04 timing](D04-combat-timing-v1.md), [Shatter](D04-shatter-v1.md) and existing
status/death/reward rules remain controlling. Canonical `Diablo2TextGame.md`
sections 5.2–5.3 supply the idle/combo and damage/status vocabulary. Pillar and
anti-pillar files are absent; no pillar approval is inferred.

## Player fantasy, alternatives and tradeoffs

The Necromancer converts a hard-won first kill into pressure on the remaining
wave. This serves Challenge, Discovery and Competence while retaining automatic
combo priority. One body pays for one all-enemy cast, so players must establish
a kill source and cannot open an empty wave with unlimited corpse explosions.

Choose a wave-local team pool instead of per-killer ownership or manual corpse
selection. Allies can help provide bodies, and current deterministic action order
settles competition. This gives up body selection and corpse-HP-based damage;
there is no new click, inventory item or cross-wave hoarding. Summon preparation
remains corpse-free under v1c. Poison Explosion and other corpse consumers remain
separate contracts, rather than inheriting incomplete behavior from this card.

## Detailed rules

1. Begin every simulation with an empty transient pool. Never infer supply from
   initial-dead input units or preload a number of corpses. Keep the pool out of
   Player, saves, resource carry, loot inventory and initial snapshots.
2. Credit exactly one corpse for each actual positive-life to zero primary death
   of an enemy-side unit whose inferred kind is `monster`. All monster tiers,
   including bosses, qualify. The killer can be a hero, mercenary, summon, direct
   hit, periodic damage or another existing death-producing path. Primary
   Shatter deaths qualify: D04 defines a physical execute, not body destruction.
   Enemy heroes/mercenaries, summons and owner-orphan-only deaths add none.
3. Use existing death closure and `deathsHandled` authority once. Enqueue eligible
   IDs in existing emitted death-event order: simulation timestamp, then that
   timestamp's ordered event ordinal. Add no RNG, ID-string/locale sorting or
   owner copy. Make bodies available after the whole primary death closure
   settles and before the next living action, including at the same timestamp.
4. One pool belongs to the player team. An eligible actor may consume a body
   regardless of who killed it. Two eligible heroes compete in existing action
   order; the first successful cast removes the oldest available token. Neither
   actor receives a private copy. The current native game still has one hero.
5. Qualify exact player Corpse Explosion with a narrow Player-derived authority
   projection. The composer requires a nonempty hero ID, Necromancer class,
   integral character level at least the authored unlock 6, allocated Teeth
   prerequisite and allocated CE. For each skill use only exact canonical and
   authored aliases: `necromancer.corpse_explosion` /
   `skills-necromancer-corpse-explosion`, and `necromancer.teeth` /
   `skills-necromancer-teeth`. Resolve the maximum valid integral rank in 1–20
   once. Invalid, missing, fractional, nonfinite, negative and over-cap aliases
   grant no rank; a separate valid alias may qualify. Do not clamp, sum aliases
   or use legacy skills, gear, combo presence or implicit rank one as proof.
   The runtime rank is the projected CE rank, not the generic fallback rank.
6. Add an optional readonly per-hero projection array to the engine snapshot,
   containing copied `{ sourceHeroId, rank }` primitives. Validate all entries;
   missing/malformed arrays or any duplicate source ID grant no CE authority.
   Copy before simulation. Runtime also requires a living player-side hero with
   no summon/owner markers. Combo selection remains required to choose the
   spell. CombatUnit alone cannot prove class, unlock or prerequisite. Native
   stores compose from the actual current Player; do not rewrite general skill
   qualification or silently grant authority to standalone synthetic snapshots.
7. Gate both exact order aliases and resolved CE identity so alias registration
   overrides cannot bypass the rule. Validate the resolved active/all-enemies
   registered skill against independent JSON-derived CE semantics: authored
   unlock/cap/prerequisite, 20 MP, 2 seconds, one fire-damage effect, +6 damage
   per extra rank and ignite at 10% of ordinary hit damage. Refuse changed or
   extra effects/source semantics rather than charging for an unreviewed spell.
   Authored-source validation must not depend on mutable registry contents.
   Keep `monster.corpse_explosion` and unrelated generic/synthetic spells intact.
8. During ordinary selection check actor authority, a living enemy target,
   affordability, cooldown and corpse availability without RNG or mutation.
   Empty supply skips CE to the next legal combo entry or basic attack in the
   same scheduled action. It adds no CE action/event, MP debit, cooldown, RNG draw
   or extra action. The selected fallback retains its normal costs/RNG/effects.
9. Recheck cast prerequisites at the synchronous commit boundary. Only a valid
   accepted CE cast consumes one oldest token, with its one ordinary payment and
   cooldown, before damage/status effects. Mana 19, active cooldown, dead actor,
   no living target or invalid source/authority leaves the pool/resources/RNG
   unchanged. One multi-target explosion costs one corpse; every target dodging
   still consumes it. There is no refund for a poor outcome.
10. Consumption changes only corpse availability. Never delete or alter the
    dead CombatUnit, its death event, `deathsHandled`, final enemy outcome or
    reward identity. Normal XP, loot, orbs and death effects remain exactly once.
    Consumption grants no second kill/reward and cannot recreate the same body.
11. CE direct/ignite kills may create new eligible corpses after their death
    closure. They can fund later scheduled casts, never retroactively pay for
    the current cast or trigger recursive/free casts in the same action. Battle
    termination still prevents casts after the final enemy dies.
12. Only in waves with valid CE authority, reuse existing message events for localized `combat:corpses.available` and
    `combat:corpses.consumed` feedback with the remaining `count`. Do not emit
    repeated empty-pool warnings on every skipped action. Preserve the relative
    order of existing damage/death/orb events; feedback is additional evidence,
    not a second reward path. Player-facing delivery must localize both keys
    and explain the opening-kill requirement in both Skills descriptions.

## Formulas and independent examples

For allocated CE rank `r` in 1–20, authored direct fire base is
`[50 + 6*(r-1), 80 + 6*(r-1)]`: rank 1 is 50–80, rank 6 is 80–110,
rank 20 is 164–194. Cost is 20 MP; cooldown is 2 seconds at every rank.
Use existing hit/crit/mitigation/status clocks. Ignite potency is
`max(1, floor(ordinaryFinalDamage * 0.1))` per stack, preserving existing
status duration/stack/spread rules. No corpse maximum-HP coefficient, physical
split, new status potency or damage RNG formula is introduced.

`available = eligible primary deaths credited - accepted CE casts` within one
simulation, always nonnegative. A consumed body remains a dead outcome unit.
Two monsters killed, one body consumed: one token remains and both monsters
still qualify for their original rewards. With one token and 19 MP, CE is
skipped and the token remains. With 20 MP and all targets dodging, it is consumed
and 20 MP/2-second cooldown are committed. An otherwise identical empty-pool
snapshot matches the no-CE combo's fallback RNG/outcome, apart from skill order
metadata; no corpse RNG stream is needed.

## Edge cases and lifecycle

Exclude initial-dead, duplicate handled death, nonlethal/dodged hits, summoned
monsters and orphan-only despawns. An enemy monster with a summon owner marker
must not become an orphan corpse. Direct/periodic simultaneous primary deaths
follow existing closure order. No cap or corpse decay timer is added; count is
bounded by actual distinct eligible deaths in that simulation. Future
resurrection/body-destruction interactions require an explicit contract change.

Keep replay policies distinct. Ordinary refresh/playback preserves the current
recording. Unlocked explicit replay recomputes from captured original resources
and current eligible configuration, rebuilding the pool deterministically with
no duplicate rewards. Iron-locked replay reinstalls exact original engine input
and recording, with no second item or corpse transaction. A/A and A/B/A runs
must agree without global resets. New waves start empty; save/load introduces
no corpse field or migration and cannot carry a spent/unspent token forward.

## Dependencies and delivery boundaries

Data flows from validated authored JSON and actual Player allocation through
an additive eligibility projection to battle-local state, then existing recorded
messages/results and presentation. Preserve D04 recovery carries, existing death
closure and reward claims, D06 startup summons/Iron and both replay modes.
No stack/dependency/schema/save-format change or network permission is needed.

Delivery order, each at most five paths:

1. This decision, design-decisions index, skills-spec and execution-ledger.
2. CE definition/composer and test; combat.ts and dedicated combat test; ledger.
   Freeze independent literal and negative cases, obtain behavioral RED first,
   then engine/focused/full/types/lint/build and independent QA/TD review.
3. combatHelpers.ts, dedicated native lifecycle/reward test and ledger. Pass
   current Player authority, prove actual kill→consume, new wave, refresh,
   unlocked replay, Iron-locked replay and unchanged reward identities.
4. SkillsScreen description wiring/test, two Skills locales and ledger. Then
   bounded combat-feedback locales/test delivery if separate paths are needed.
   Finish native bilingual mobile/desktop browser acceptance on production bytes.

## Tuning knobs

Preserve current authored damage/rank growth (curve), MP/cooldown (feel),
unlock/prerequisite/cap (gate), and existing ignite tuning. Validate these from
JSON; numbers above are review oracles, not parallel runtime constants. No new
balance knob/range is introduced. Pool ownership/eligibility/one-body payment
are fixed mechanic rules. Later calibration requires earned combat/TTK/economy
evidence; imported fixtures do not establish affordability or viable builds.

## Acceptance criteria

- Actual kill creates one usable token; one accepted CE consumes it, damages
  surviving enemies with authored rank behavior and cannot reuse that token.
  Rewards retain all killed monsters and are claimed exactly once.
- Cover all tiers/killers, direct/DoT/Shatter, same-time FIFO, shared competing
  heroes and negative initial-dead/summon/orphan/duplicate/nonlethal controls.
- Prove 19/20-MP boundary, cooldown/no-target safety, all-dodge consumption,
  empty fallback RNG equivalence, CE/ignite later supply and no recursive cast.
- Prove actual Player class/unlock/Teeth/rank authority, both exact aliases,
  duplicate/malformed projection handling, registry overrides, input immutability,
  plain/recorded equivalence, A/A/A-B-A and new-wave/both replay policies.
- In both locales, actual native controls show allocation/priority, first-kill
  supply, one consumption, truthful MP/cooldown/feedback and save/reload behavior
  at 360×640 and desktop with keyboard, >=44px controls, no overflow/console errors.
  Imported scaffolding is labeled; a separate earned playtest must assess whether
  the first-kill→explosion transition is understandable and satisfying.

Poison Explosion retains only its existing partial behavior until potency,
duration, stacking and consumption are reviewed together. Vines, Redemption,
Find Item/Potion, resurrection, corpse selection, all-class/campaign balance,
earned progression, full D06/P09/P10 and private-v1 remain open.

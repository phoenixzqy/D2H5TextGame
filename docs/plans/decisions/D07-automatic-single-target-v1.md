# D07 — Automatic single-target finishing priority

2026-11-03. Type: small shared targeting mechanic addition. New authored design
under the existing complete-private-v1 implementation request, not an already
specified bug fix or a guarantee of encounter/build acceptance.

## Overview

Automatic player-side single-target attacks prefer ordinary eligible opponents
over hostile summon bodies, then choose the lowest current absolute life within
that group. This replaces registration-order choice
in the shared defender acquisition path. Explicit control and enemy targeting
retain their existing rules. AOE/grid/round-robin target ordering is unchanged.

## Player fantasy

Allies finish vulnerable opponents rather than ignoring them behind a champion
registered first. This supports combat competence, corpse/kill-trigger identities
and readable automatic play across all classes, without class/area/seed rules.
Challenge remains in damage, defenses, resource costs and survival. This cannot
increase damage against a lone boss.

## Detailed rules

1. Build the ordinary live offensive candidate pool with existing effective
   allegiance, Attract/Confuse and conversion rules; never add a target here.
2. A valid active explicit Taunt source inside that pool wins. Preserve enemy
   Decoy interception, singleton behavior and seeded enemy weighted aggro.
3. For an effective-player attacker with multiple candidates, prefer non-summon
   opponents, then choose minimum current `life`; ties use original registration
   order. If only hostile summons remain, choose among them by life and order.
   Reacquire at every
   existing acquisition point, including basic attacks, registered single-enemy
   casts and Hydra heads. Hero/mercenary/summon/paid converted bodies share it.
4. Do not rank by maximum/percentage life, monster rarity, expected damage, resistance,
   class, corpse availability, map, seed or whether the target supplies rewards.
5. Selection consumes no RNG, allocates no new gameplay state and never mutates
   candidate order or input snapshots. Death and control expiry use native clocks.
   No save fields or migration. AOE/grid/cleave/splash/burst lists keep their
   current priority/caps; support skills and ambient pulses keep existing pools.

## Formulas

Select `argmin (isSummon ? 1 : 0, currentLife, registrationIndex)` from the eligible
pool after control overrides. Example:100/100life is chosen before150/10000life
within the same group; a tie at
100 uses registration order. A living opponent at50 precedes a champion at10000
regardless of physical/fire defenses. Empty pool yields no target; singleton
returns itself and retains exactly the existing hit/crit RNG sequence.

## Edge cases

Dead bodies are excluded upstream. Equal-life targets in the same group keep
registration order. Weaker hostile replacements cannot shield a living summoner;
explicit eligible Taunt can still force an attack on a summon body.
Expired/dead/out-of-pool Taunt cannot override. Effective-player converted bodies
cannot hit their current allies; hostile Confuse actors retain seeded selection
among their redirected candidates. All-enemy/area targets and enemy summon threat
bias stay unchanged. Damage can still be resisted or dodged; low life is not a
promise of the easiest kill. Global battle RNG sequences can diverge after changed
targets/deaths, so old multi-enemy event parity is not an acceptance criterion.

## Dependencies

`attackCandidates` supplies the pool; shared `pickDefender` chooses one member;
ordinary damage/payment/death/reward code settles it. Update combat-formulas §12.1
because its “player-selected or random” wording does not describe the current
UI or this automatic default. No player target-selection UI exists. No data or
i18n schema change is needed: this alters automatic choice only.

## Tuning knobs

No numeric parameter, damage coefficient or new data-owned stat. This is a fixed
ordering rule; ordinary damage/cadence/cost/progression remain their existing
feel/curve/gate knobs. Do not fit thresholds or reopen rejected CE coefficients,
curse-order or prior seeds. Formal build/act balance must evaluate this version.

## Acceptance criteria

- Failing-before behavioral cases cover basic and single-enemy skills for
  hero/merc/summon, absolute-life priority, live retarget after kills, ties,
  live-life changes, dead exclusion, hostile replacement priority, all-summon
  pools and explicit Taunt/expiry.
- Preserve singleton RNG by comparing ordinary hit/dodge/crit events against
  equivalent multi-candidate input with dormant stronger targets.
- Exercise actual paid Conversion and existing enemy threat, Decoy, Taunt,
  redirected curse, AOE/grid and multi-hit contracts. Assert snapshot immutability
  and deterministic recorded output. Run affected tests/types/lint only.
- Later prospective native observation starts only from next1596, one admission
  with frozen code/protocol. No replay or acceptance sample in functional checks.
- Experiential acceptance remains later owner playtest and the full 14-build
  populations/holdouts; targeted checks cannot close BUG611 or full privatev1.

## Design and plan review

Design review: eight sections present; scope and algorithm concrete. Existing
combat-formulas single-target sentence is explicitly superseded. No numeric/data
schema, resource, damage, save or UI change. Pillar documents referenced by the
repository are absent; use actual playable-target and combat invariants, without
claiming a missing creative-director approval. Concern: this affects all automatic
builds and cannot substitute for population/holdout evidence. No identity shift.
Plan review: ready for a bounded shared selection change and focused regression
checks; viability, singleton damage and final balance remain incomplete.
Security check: pass; authorized local first-party code/tests/docs, no secrets,
dependencies, network, permissions, CI or external publication. Root sole writer;
existing user authorization covers routine implementation; no agents/commits.

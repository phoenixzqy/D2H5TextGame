# P15 — Ordinary manual plan ordinal partition v1

2026-11-05. Adopt the following source-proven partition for **plan support**.
The attempted native witness driver failed before loading game modules; no
empirical plan equality result is available. See the
[evidence and retained failure](../evidence/p15-manual-ordinal-partition.md).
Full population, retry, acquisition and balance acceptance remain open.

## Decision and fixed inputs

For the current 29 canonical authored areas, ordinary manual planning needs at
most 13 ordinal representatives, `0..12`. Keep area definition, numeric seed,
fallback archetype/level, elite configuration and ordinary manual source fixed.
If replay binding is applied, also keep its profile and monster definitions
fixed. Two valid ordinals with the same residue modulo 13 produce equal complete
plans under those conditions. This is a sufficient partition; different
representatives need not produce different plans.

The native ordinal domain is the integer interval `[0, 360360)`, validated by
[combat admission](../../../src/stores/combatHelpers.ts). Each residue occurs
27,720 times. This arithmetic does **not** make live progression ordinals uniform
or independent of acquired power. Uniform weighting is justified only for an
explicitly uniform ordinal population, which has not been selected here.
Do not merge different seeds, areas, replay profiles, inputs or source projections.

## Source proof

[The planner](../../../src/engine/combat/sub-area-run.ts) reads the ordinary
manual ordinal only in `resolveChallengeMonsterCount`; the other read is inside
the idle branch. All 29 current area definitions explicitly author count bounds
8 and 20, and all have usable authored non-boss templates. For valid ordinal
`o` and template index `i`, the target count is:

```text
8 + ((o + i) % 13)
```

Equal residues therefore give equal counts at every template. The planner starts
a fresh RNG from the fixed seed. Inductively, equal RNG state and fixed authored
encounters produce equal expanded rosters; equal counts and elite settings
produce equal fitted/forced packs and preserve the same subsequent RNG state.
Treasure templates retain their authored roster rather than the count target,
which also preserves equivalence. Source/encounter identities, tiers, indices,
affixes, presentation, levels and loot follow those same deterministic branches.
Boss appending uses the same remaining RNG state and fixed area definitions.
The returned plan contains no separate ordinal field.

[Replay binding](../../../src/engine/map/replay-profile.ts) consumes the plan,
profile and monster definitions without reading ordinal, clock or saved state.
It therefore preserves this equivalence for Normal, Nightmare and Hell. This
argument covers planner outputs only; it does not establish replay eligibility,
combat results, reward equivalence or difficulty balance.

## Sources that require their own identity

- **Idle:** [idle encounter selection](../../../src/engine/idle/online-tick.ts)
  hashes `idle-encounter|seed|area|tickIndex`, with
  `tickIndex = challengeOrdinal * 20 + waveIndex`. Preserve the full ordinal
  and initial pity. Count residues alone cannot establish equal idle plans.
  Neither hash collisions nor equal individual plans justify a general idle
  reduction. Forced guards and eligible idle rolls remain distinct; under the
  current authored elite configuration, initial pity 11 forces a rare promotion
  at the first eligible roll, then resets pity.
  Pity is [transient](../../../src/stores/idleElitePity.ts); absent historical pity
  remains unknown rather than being replaced with zero.
- **Throne quest projection:** `resolveThroneQuestPlan` ignores ordinal and
  returns the finite authored source. Admission still requires eligible Normal
  manual quest state and receipts. Keep this projection separate from the
  ordinary Throne plan.
- **Countess/Cow:** `resolveQuestEncounterPlan` has no ordinal input and selects
  exact authored optional sources. This does not bypass their admission,
  inventory, quest, first-clear or reward rules.
- **Legacy, synthetic and endgame:** these paths are outside this partition.

## Operational boundary and next work

Never replace a live run's ordinal with its residue. Native admission advances
the saved difficulty counter modulo 360360; supplying an explicit diagnostic
ordinal suppresses that advancement. Native seeds normally also depend on entry
time. Costs, elapsed time, progression, quest receipts, first clears, rewards,
carry and retry successors retain their actual identities even for equal plans.
Keep original ordinal in every retained trial. An optional residue annotation
may describe plan support without changing the trial or its weight.

Use the [retained-power baseline](P15-retained-power-baseline-v1.md) and
[recorded full plans](../evidence/p15-checkpoint-role-coverage.md). Next define
the seed/ordinal population, role/prefix and idle-pity conditions, then freeze
legal contiguous three-attempt adaptation using the existing retry harness.
The equipment source census remains a fixed diagnostic scan; this decision
does not make it an exhaustive seed census or a frequency model.
`populationFrozen`, broader power/acquisition/adaptation status and balance
acceptance stay false. No spent campaign/sample/retry allowance is renewed.

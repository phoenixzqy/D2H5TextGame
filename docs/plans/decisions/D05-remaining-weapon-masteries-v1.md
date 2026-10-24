# D05 — Polearm, Spear and Throwing Mastery

Status: implemented and locally verified; root sole writer. Independent review/QA,
earned class builds, balance and full C0–C4/G0–G7 acceptance remain open.
Base: `44477e9`. Existing D05 weapon-mastery composition remains controlling.

## Player behavior

Exact authored `skills-barbarian-pole-arm-mastery` resolves canonical
`barbarian.pole_arm_mastery`; spear/throwing use their corresponding hyphen and
underscore aliases. Maximum valid positive integer alias allocation once,
cap20, unlock6. Canonical player weapon-slot base metadata gates all effects;
other classes, offhand, name/instance hints and wrong weapons grant nothing.

Polearm and Spear: authored +3% direct physical damage and +0.5 percentage
point direct-hit critical chance per rank. Throwing: authored +2.5% direct
physical damage and +1% attack speed per rank, no critical bonus. Physical
increases use the existing per-type path; Attack/elemental damage unchanged.
Throwing's cadence multiplier is 1 + rank × authored attackSpeedPct, multiplied
with fresh item cadence and endurance. It does not change movement/range,
ammunition or RNG. Current recordings stay fixed; next waves and explicit
replay recompose with original resource carry. Reset/removal must not heal,
grant income, persist derived bonuses or compound effects.

## Reachable equipment

Add two ordinary bases, using current early one/two-hand numerical envelopes:
Spear (twoHanded, physical8–18, level1, maxSockets2, metal true) and Throwing
Knife (oneHanded, physical4–8, level1, maxSockets0, metal true). Both use
existing localized names, equip/loot/art-fallback mechanisms; no new assets or
inventory/save fields. New en/zh names are required. Ordinary Act I trash
entries: Spear weight100, Throwing Knife weight150, minLevel1/maxLevel38,
normal rarity, within existing early weapon weight range. This expands the
pool and changes future deterministic loot outcomes; never replay consumed
campaign actions. Actual drop/materialization/equip tests must prove reachability.
This is functional availability, not acceptance of acquisition rate or balance.

Existing War Pike, generic polearm and closest-fit unique mappings retain their
identities. New throwing unique templates/unique remaps remain separate work;
ordinary bases remove the prerequisite absence without silently adding uniques.

## Verification and review

TDD: real availability RED, then real drop/materialization and canonical equip;
mastery ranks1/20, aliases/caps/unlocks, mismatches/nonstacking, damage/crit/cadence
consumer outcomes; native learning/equip/reset/replay/import; en/zh current-next
values and production desktop/mobile Save/Continue. No constructed fixture is
an earned progression or class-build proof.

Root-cause-fix: use the existing weapon-mastery consumer and canonical metadata,
rather than classifying by names or retyping War Pike. Schema additions retain
strict coefficient shape and exact weapon restrictions. Plan review: ready
with equipment acquisition, Iron Golem metal eligibility and old masteries
included in regression scope. Security check: pass; local typed data/runtime/UI,
no dependencies, credentials, network, CI, permissions or save-shape changes.

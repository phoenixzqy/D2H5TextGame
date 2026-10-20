# D04 — Independent flat magic mitigation

Status: accepted scoped control, 2026-10-20. Game/technical design APPROVE;
producer P06D-PLAN APPROVE. Full D04, Den and campaign acceptance remain open.

`combat-formulas.md` §2/6 and `monster-spec.md` §2/3 describe separate armor and
magic mitigation. `early-game-spec.md` explicitly retained armor-as-MR as an
unresolved compatibility choice; restoring the split is a deliberate capability
decision, not a regression proven by the P04a04c native draw.

Physical, fire, poison and thorns subtract defense. Cold, lightning and arcane
subtract magicResist. This applies symmetrically to every actor's incoming and
outgoing direct damage. Preserve resistance-before-flat-mitigation, minimum one,
RNG, damage-derived DoT, status behavior, cadence, deadline and rewards.

Validated `src/data/combat/mitigation.json` owns the numeric defaults. Player,
merc and summon base MR are zero with no level/core/rank/armor inheritance.
Friendly MR is `max(0, floor(baseMR + signed explicit flatMR))`.

Monster default base MR is zero, growth is one per level. Optional archetype
`magicResist` and `magicResistGrowth` override those defaults, including zero.

`MR = round(((base ?? defaultBase) + max(0, level-1) * (growth ?? defaultGrowth)) * tierMultiplier)`

| Tier | MR multiplier |
| --- | ---: |
| trash | 1 |
| elite | 1.5 |
| champion | 2 |
| rare-elite | 1.5 |
| rare-minion | 1 |
| boss | 3 |
| chapter-boss | 3 |

An explicit final `statOverrides.magicResist` wins after scaling. Optional
`chapterBoss.magicResist` supplies that override; absence uses the archetype and
effective level. Armor overrides never affect MR. These rules supersede only
the incompatible example MR0/10/15/30 table in combat-formulas §2.2 and the old
MR tier column. Current health, attack, armor, speed, resistances and rewards
stay authoritative; this is not a wholesale import of old balance tables.

Explicit MR uses modern affixes, legacy `statMods.magicResist`, unique/set stat
packages and canonical equipment aggregation. Add no catalog rolls, base-item
MR field or rune/runeword capability. Owned merc MR is its saved unequipped
baseline plus signed equipment MR, floored/clamped once; do not clamp the gear
delta before adding it to a nonzero baseline. Never persist or accumulate that
combat projection. Armor gear/buffs give no MR. Summon templates initialize MR0.

Save v9 requires finite nonnegative MR on the hero and every owned merc. See
[ADR-003](../../decisions/ADR-003-version-independent-magic-mitigation.md).
Historical shapes validate before compatibility recomposition/defaulting.
Absent historical MR becomes zero; valid optional MR extensions survive,
including the proven v7 Amazon starter migration. Reject malformed present
extensions. Preserve all other stats, resources, ownership, progression and
history. Do not heal or rederive an entire legacy character for this field.

Verification must exercise actual battle casts with distinct armor/MR, all
seven damage types, incoming/outgoing magic, authored/default/tier/override
monster values, signed gear, saved merc baselines, summons and genuine legacy
save inputs. Keep existing damage pipeline and save integrity regressions.
Hostile magic changes too; this decision promises no Den victory. Further
earned measurements require their own acquisition provenance and actual wins.

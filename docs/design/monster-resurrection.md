# Monster resurrection — private v1

Status: GD-DESIGN-REVIEW: APPROVE; TD-TECH-REVIEW: APPROVE. Implemented locally;
204 focused checks pass and independent runtime review approves. Final validation
is in progress; see BUG-404 and the execution ledger for evidence and limits.
This adds the missing authored Shaman ability without changing Necromancer Revive.

## Overview

Hostile starting Shamans can spend one existing corpse token to return an
eligible original Fallen ally to battle once. A five-second skill cooldown and
ordinary action scheduling preserve their authored fire-caster priority. The
revived unit keeps its identity; it grants no second corpse, orb or reward.

## Player fantasy

Players recognize a support caster and choose whether to remove it or spend
corpses first. This supports Challenge, Discovery and tactical competence through
existing targets and corpse skills. No additional resource/UI-selection system
is introduced. The checkout has no separate `docs/design/pillars.md`; existing
combat design invariants and `Diablo2TextGame.md` remain the available vision
references. This fills the advertised revive role in `monster-spec.md`.

## Detailed rules

Capture qualifying effective original enemies from `state.units` once, after
both starting-team registration loops finish and before startup effects or
dynamic entrants. This preserves current duplicate-ID overwrite, assigned grid
positions and existing original scheduler identity. Require initially positive HP,
`kind:monster`, enemy side and no summon/owner/template markers. Use only the
factory's actual `monsterArchetypeId`, never display names, instance IDs or a
bare resurrect buff.

| Role | Exact catalog identities |
| --- | --- |
| Source | `monsters/act1.fallen-shaman`, `monsters/act1.carver-shaman`, `monsters/act1.devilkin-shaman`, `monsters/act1.bishibosh` |
| Body | `monsters/act1.fallen`, `monsters/act1.dark-one`, `monsters/act1.carver`, `monsters/act1.devilkin` |

Body tiers are trash, elite, champion, rare-elite and rare-minion; explicitly
reject boss/chapter-boss bodies, even in synthetic inputs. Bishibosh qualifies
as a source at its authored boss tier. This authorizes no new spawn tier.
An original source must still be alive, hostile and unconverted when casting.

Both exact skill identities `monster.resurrect_fallen` and
`monster-resurrect-fallen` resolve to the validated authored resurrection
behavior: active, summon target, zero MP, cooldown5seconds, one body. Replace
the permanent self-buff placeholder and its six-second stub cooldown. Preserve
skill priority: Fire Bolt first; Bishibosh keeps Fire Ball before resurrection.
Success occupies one scheduled action without an added attack. No eligible
body means skip to the next legal action without payment, cooldown, event or RNG.

Observed priority limit: default Bishibosh speed90 gives a1780ms cadence. Its
Fire Bolt2s and Fire Ball3s cooldowns can alternate without leaving an opening
for third-priority resurrection. Tests pin that default behavior and separately
prove native resurrection while both fire spells have legitimate initial pending
cooldowns. This implementation preserves the approved priority; it does not
claim that default campaign Bishibosh naturally resurrects.

Use the existing shared FIFO. Original first deaths can publish corpses when
an eligible original source is present, even without a player consumer. Preserve
existing primary-death eligibility and enqueue order after complete death closure.
Resurrection removes the oldest eligible body token and preserves all other
tokens' relative order. Player skills, vines, Redemption and Death Sentry compete
for exactly the same token; no copies or reserved parallel pool.

Restore the original registered ID at captured original maxHP. Retain its
original stats, level, tier, attack range, skills, affixes and position; do not
rerun its factory. Clear statuses, active buffs, conversion and per-life periodic
and recovery accumulators. Preserve one-shot flags. Keep death-time mana, clamped
to original capacity, without refilling or regenerating while dead. Preserve
absolute cooldown deadlines; they expire with simulation time while dead.
Its next action occurs one full current effective action period after revival,
with its original seeded tie priority/insertion index. No immediate attack or
startup summon pass occurs.

Keep `deathsHandled` as permanent once-per-original authority. Separate second-
life cleanup so a revived body's next death still zeros HP, removes its action
schedule/periodic state, clears visible statuses and emits death, but supplies no
second corpse, orb, on-kill recovery, repeated death trigger or reward. Ordinary
damage/on-hit effects remain ordinary. Final results contain one row per original
ID, so native XP/drop/quest settlement continues once per original enemy.

Commit ordered action, localized corpse-consumption message, copied `revive`
event containing source ID/target ID/restored unit, then a forced copied authoritative status
observation (without `initial:true`) and existing ambient-state reconciliation.
Force the observation even when both pre-death and revived views are empty;
ordinary status deduplication must not omit dead-ID re-entry. Playback replaces the
known dead row in place, removes its dead-ID presentation latch and accepts later
status observations. It never appends a summon, reruns logic or awards rewards.
The next death clears the same row. Unknown or invalid playback targets are inert.

## Formulas

`revivedHP = original.stats.lifeMax` and
`revivedMP = clamp(deathTimeMP, 0, original.stats.manaMax)`.
`cooldownEnd = castTime + JSON.cooldown * 1000` (default5000ms).
`nextAction = reviveTime + actionPeriodMs(currentEffectiveAttackSpeed)`.
Existing action period is `clamp(2500 - floor(speed)*8, 400, 2000)`ms; at speed85
it is1820ms. Preserve scheduler ordering: time, descending fixed seeded priority,
then original insertion order. Do not draw target-selection or resurrection RNG.

Each original body has at most one first-death token and one revival. Therefore
`resurrections <= eligibleOriginalBodies`; every other successful corpse consumer
reduces that shared finite supply. A spent corpse remains an original outcome
identity, regardless of which consumer spent it.

## Edge cases

Reject initial-dead units, dynamically summoned entrants, player/converted sources,
foreign archetypes, forged names and boss bodies. Missing/invalid registered skill
semantics must not fall through to a permanent resurrection buff. When the source
has no eligible token, ordinary priority/cooldown/RNG behavior remains unchanged.
Multiple Shamans compete synchronously; the first successful commitment removes
one token before another action can inspect it. Noneligible tokens stay in order.

No resurrection after sticky hero death, battle terminal/end, or across waves.
All token/capture/revived bookkeeping is battle-local and absent from saves. Do
not clear once-per-original death authority to enable cleanup. Preserve first-
death poison/plague closure and ordinary ownership/death ordering. Imported
same-name skills or buffs confer no native resurrection authority by themselves.

## Dependencies

Production monster/skill JSON supplies identity, spell order and cooldown. Pure
engine registry/eligibility and combat own payment, shared corpse selection,
restoration, scheduling and finite death effects. Recorded events feed the store's
playback and localized combat log/FX; playback supplies no engine authority.
Persistence and native settlement retain the original one-row actor identity.
No save version/schema or new saved field is needed.

Amend D06 corpse consumption, Poison Explosion and shared corpse consumers to
acknowledge hostile competition. Amend D04 timing/status playback for explicit
revive/dead-ID re-entry. D06 summon preparation retains its separate corpse-free
Necromancer Revive contract. Update monster/skill descriptions and canonical
mapping accurately; do not claim campaign balance from this mechanic.

## Tuning knobs

Cooldown is a JSON gate knob (5seconds); ordinary attack-speed cadence already
comes from monster JSON. Full original HP, exact allowlists and one revival per
body are fixed v1 contract rules. Changing those rules needs explicit design
review; no additional tuning defaults or parallel economy are introduced.

## Acceptance criteria

Prove genuine RED before implementation for native factory/registered spells,
first death→revive→second death, finite shared tokens, no-body equivalence,
source/body qualification, competing consumers, full restored state, retained
dead-time cooldown/mana semantics, preserved seeded order and next-action delay.
Recordings must be deterministic and inputs immutable.

Prove copied event snapshots, death→revive→status→death presentation, same-row
identity and final outcome agreement through both native replay policies. Pin
one-time corpse/orb/reward/quest effects and sticky hero-death/terminal boundaries.
Verify actual UI/log output in zh-CN360×640 and en1280×800. Rerun appropriate
engine/store/lifecycle, strict types/lint/build checks after implementation.
Owner playtest later judges whether the support caster is readable and worth
prioritizing. Technical tests and constructed browser cases do not accept overall
balance, earned five-act routes, build viability or pacing.

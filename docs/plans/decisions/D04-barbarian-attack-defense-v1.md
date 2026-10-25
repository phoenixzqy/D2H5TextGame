# D04 — Concentrate, Berserk and Stun attack contracts

2026-10-25. Root-authored provisional implementation contract. Independent
design/QA and earned build balance remain open. This three-skill batch advances
P10; it does not close C2–C4 or change the full private-v1 target.

## Problem and scope

BUG219 proves Concentrate pays for damage without its advertised defense.
BUG220 proves Berserk's advertised conversion ignores snapshot Attack entirely.
Stun is included to verify the adjacent paid single-target control path. Existing
damage ranges/growth, costs, cooldowns, unlocks, prerequisites and rank caps stay.

## Concentrate

One legal paid cast grants the living personal hero +5% of snapshot Defense per
rank for 1000 ms, then makes its existing single Physical attempt. Both tuning
values live in JSON. Rank1/2/20 grants +5/10/100%; this is provisional tuning.
The defense applies even if the attack misses. It adds with other temporary
Defense bonuses through the existing mitigation formula, never mutating base
stats, healing, restoring MP or changing magical resistance. Positive-HP hostile
damage is not a prerequisite for the paid defensive stance.

The interval includes its start and excludes its expiry. Stun/Chill cannot
extend it. Duration is at most the minimum 1-second attack cooldown, so an active
stance cannot be repaid/refreshed; basic attacks remain available meanwhile.
The payload captures paid rank and potency, belongs to the original personal
hero, never stacks with duplicate markers and survives only its residual time
across waves. Later allocation/priority changes affect future casts; an already
paid stance keeps its potency until expiry. Save/Continue restores learned
configuration, never transient stance or combat pools.

Native class, unlock, transitive prerequisites and capped rank are captured
independently at each wave boundary. Bare markers, enemy/merc/summon payloads,
malformed timing/potency and altered registry effects cannot create defense.

## Berserk

One paid attempt adds 100% of snapshot Attack to its existing rank-scaled
80–120/+8-per-rank base and deals the whole subtotal as Arcane. The coefficient
is JSON-authored and uses the existing attack-scaled damage primitive. Arcane
bonuses, magical dodge, flat magical resistance and Arcane percentage resistance
apply normally. Physical Defense/resistance and Physical damage increases do not
apply to the converted Arcane subtotal. No second Physical hit or stat mutation
occurs. Current Attack already includes legal equipment and Attack bonuses;
ordinary aura Attack composition occurs once through the existing primitive.
This is a v1 conversion contract, not a claim of Diablo II formula equivalence.

## Stun

Preserve Physical45–65/+4-rank, 8MP/CD2, unlock12/Bash prerequisite/cap20.
A successful hit applies canonical Stun for 1 second (boss: 0.5 seconds).
Misses do not control; real scheduled enemy actions are interrupted and resume
after expiry. No movement or range mechanic is introduced.

## Presentation and validation

Both locales describe actual base damage, Attack contribution, Defense potency,
finite duration and control lifetime. Current/next/MAX rows agree with runtime.
Concentrate's source-bound active status is a positive combat chip.
Validate rank1/2/20 and seeds7/19/41/97, actual HP/MP, missed/critical/mitigated
hits, invalid native authority, exact expiry, current-wave immutability,
next-wave carry and saved configuration. Run focused checks through the batch,
then engine/full/typecheck/lint/build and relevant production browser checks once
the batch is frozen. Synthetic fixtures establish mechanics, not earned balance.

Security check: pass. Scope: these local gameplay contracts and regressions.
No credentials, dependencies, network export, persisted schema or external action.
Plan review: ready after explicitly bounding duration to the minimum cooldown,
defining pre/post conversion modifiers, and requiring native/save/playback proof.
Author review provides no independent approval.

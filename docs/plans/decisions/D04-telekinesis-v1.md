# D04 — Telekinesis interruption without movement

Author adaptation for [BUG236](../../../production/bugs/BUG-236-telekinesis-control-is-inert.md),
2026-10-25. Independent design/QA and earned balance acceptance remain open.
The complete private-v1/C0–C4/G0–G7 objective is unchanged.

Telekinesis is a damage-free single-enemy utility. Replace its inert Knockback
with the existing guaranteed debuff Stun:1s ordinary,0.5s boss, finite expiry,
canonical refresh and ordinary seeded target choice. It interrupts scheduled
enemy actions while active; it does not move units, manipulate world objects,
cause damage, require a hit/dodge roll, or grant a passive Arcane bonus. Remove
the unused damage coefficient and damage tag. This follows the GDD's no-movement
combat rule and the existing Psychic Hammer control adaptation, while retaining
Telekinesis's authored no-damage utility role. No extra RNG roll or combat
runtime exception is necessary; use the shared debuff/status/scheduler pipeline.

Preserve unlock6/cap20, no prerequisites, base7MP/CD2 and existing rank reductions:
MP=round(7−.1×(rank−1)), cooldown=max(1,round-to-tenths(2−.05×(rank−1)))s.
One cast pays/acts/starts cooldown once. Higher rank improves cost/cadence,
not duration. Native class, actual learned ranks/aliases, cooldown and resource
rules remain authoritative. Teleport/Energy Shield prerequisites, mercenary
Telekinesis, monster skills, unrelated spells and existing saves stay intact.
No save/version change, grants, rewards, dependencies or campaign tuning.

Proof requires native failing actual/control recordings before data changes;
all three ranks, multiple seeds and monster tiers; real enemy interruption and
exact expiry; single living hostile targeting with no friendly/dead recipients;
no damage/positions changed; payment/refusal/cadence; immutable seeded replay
and terminal playback agreement. Native allocation must freeze issued waves,
affect the next wave and survive exact save/import without transient statuses.
Details in both locales must show actual current/next/MAX cost, cooldown and
ordinary/boss Stun, and remove false passive damage/remote-object promises.
Public browser allocation/cast/status/save/online+offline Continue on desktop
and360×640 precedes local skill credit. Engine/full/types/lint/build and current
skill-data validation are required; this checkout has no `validate:data` script.

Plan review: ready. Root cause is the authored inert status; shared consumers
already provide the required consequence. Preserve negative authority and causal
scheduling controls so a renamed marker alone cannot establish completion.
This is root author self-review, not an independent gate verdict.

Security check: pass. Scope is first-party local gameplay/data/presentation and
tests; no credentials, permissions, CI changes, dependencies, remote actions,
data export expansion or genuine earned-campaign actions. Retain failure evidence
and remove exact task-owned scratch after validation.

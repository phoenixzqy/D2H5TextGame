# D04 — Psychic Hammer control without movement

2026-10-25. Author adaptation for reproduced
[BUG212](../../../production/bugs/BUG-212-psychic-hammer-inert-knockback.md).
Root sole writer/reviewer; independent design/QA and earned balance remain open.
The full C0–C4/G0–G7/seven-class/private-v1 objective is unchanged.

## Behavior

Replace Psychic Hammer's inert Knockback marker with the existing shared Stun
on a landed Arcane hit:1s normally,0.5s on bosses. This is a new explicit author
adaptation of the control promise, not an already authored Hammer mechanic or
balance approval. Reuse the shared status definition/scheduler and truthful
bilingual copy. No movement, range, repositioning, attack-speed penalty, new
Stun duration or global Knockback consumer is introduced. Other skills' markers
and mechanics stay unchanged.

Preserve single-enemy targeting, Arcane30–45/+3per rank above one,6MP/CD1,
unlock1/cap20, no prerequisites, one action/payment/cooldown and ordinary native
class/rank authority. Use ordinary independent hit/damage/critical/resistance/
flat-MR/absorption/death/RNG settlement. A miss never applies Stun. Ordinary
on-hit statuses settle before lethal-hit death closure; preserve that ordering,
one death and no action or further strike after death. Repeated landed casts refresh the
ordinary canonical Stun rather than accumulating separate markers. No guaranteed
damage, boss immunity, save field/version, item grant or new dependency.

The exact skill schema requires the declared Stun and rejects the obsolete
Knockback, secondary statuses, geometry, sequence and contradictory effect
metadata. The existing JSON adapter and runtime Stun consumer should suffice;
do not add a Hammer-specific runtime exception to make the test pass.

## Proof and display

Write native failing tests before changing the authored row. Compare actual
rank1/2/20 hits against the identical attack with only on-hit control removed.
Require real enemy action interruption and finite expiry, boss/trash duration,
miss/payment behavior, multiple-target isolation, unchanged grid positions,
immutable exact seeded replay and final resource/status playback. Check class,
level, aliases, unlearned/out-of-cap allocation and cooldown/resource refusal.
Native allocation during playback must freeze the current recording, change
the next wave, and survive save/import without persisting an active Stun.

Pure current/next/unlearned/MAX previews and both locales show real Arcane base
damage, shared ordinary/boss Stun seconds, one target and miss/no-movement rules.
Production public allocation/priority/cast/save/reopen in en/zh at360×640 and
1280×800, five-size geometry and inspected screenshots precede skill credit.
Run engine/full/types/lint/build and existing data validation tests (there is no
`validate:data` npm script in this checkout). Preserve original RED/failures,
source/build/Git/genuine hashes, exact retained evidence and task cleanup.

Plan review: ready. The data declaration is the root cause; an existing shared
control consumer supplies the intended no-movement consequence. Causal scheduling
and miss/expiry controls prevent a marker-only success claim. This is author
self-review, not independent approval. Security check: pass; first-party local
gameplay/data/UI, no credentials, permissions, CI, dependency, remote action or
genuine campaign action. Independent/earned acceptance remains open.

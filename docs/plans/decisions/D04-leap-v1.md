# D04 — Leap's paid control and physical follow-up

2026-10-25. Author adaptation for reproduced
[BUG213](../../../production/bugs/BUG-213-leap-inert-knockback.md).
Root sole writer/reviewer; independent design/QA and earned balance remain open.
The full private-v1/C0–C4/G0–G7 objective is unchanged.

## Behavior

Replace the inert Knockback declaration with shared Stun:1s normally,0.5s on
boss/chapter-boss enemies. Preserve the existing non-damaging all-enemy debuff
application: one paid cast applies control to all currently living hostiles,
without an accuracy roll or spatial movement. Dead enemies and allies receive
no control. No new global Knockback consumer or movement/range stat.

Preserve the existing physicalDamagePct=.01 per rank as a paid personal
physical-damage increase for3000ms after the cast, cap20/+20%. The3s interval
is new provisional author tuning, not an existing authored duration or accepted
balance. This resolves the active skill's currently inert scaling metadata;
learning alone grants no power. Add the captured bonus to ordinary increased
Physical damage for direct basic/skill hits while active. Other damage types,
reflection and already captured periodic damage receive no new multiplier.
Leap itself deals no damage, heals nobody and never changes base Attack/stats.

Keep unlock6/cap20/no prerequisite,8MP/CD3, cost growth−.1/rank and cooldown
growth−.05s/rank (rank1/2/20:8/8/6MP; raw3/2.95/2.05s, existing runtime/display
one-decimal rounding yields3/3/2s). Preserve that existing rounding. One cast/action/payment/
cooldown applies both effects. Never recast while the personal3s buff is active,
even if the rank-scaled cooldown has expired. Expiry permits a fresh paid cast.
Use existing absolute-status clocks, inclusive start/exclusive expiry, ordinary
boss Stun scaling and scheduler interruptions. No guaranteed damage or extra
enemy turn is introduced.

Capture independently validated native Barbarian rank at each wave boundary.
Exact authored/canonical aliases share one legal rank; malformed, unlearned,
underlevel, foreign-class, merc/summon/hostile or contradictory registry inputs
cannot pay or gain effects. A source-bound paid status carries immutable rank/
potency and finite interval; bare or malformed markers grant no power. Duplicate
markers never stack. Respec/priority changes affect future casts; an already paid
buff keeps its original potency until expiry. Carry it through the existing
qualified next-wave clock rebase without renewing duration or refilling HP/MP.
Save/import persists allocation/priority only; no combat status or new save field.

## Proof and presentation

Write original failing tests before source changes. Require rank1/2/20 actual
MP/cast counts, all-target Stun timestamps and real enemy action interruption,
boss/trash expiry, no movement/damage/ally control, immutable replay and resource/
living-status playback. Capture actual paid state, then compare otherwise
identical carried snapshots with only the paid buff removed: real direct
Physical damage must change by the literal authored rank coefficient, other
types must remain unchanged, and expiry must reverse the bonus. Check additive
composition, malformed carry/registry, readiness and no active refresh.

Schema rejects missing/contradictory effects, foreign stats, damage/geometry/
sequence metadata and malformed finite tuning. Pure current/next/unlearned/MAX
previews and actual bilingual Skills UI show Stun ordinary/boss seconds, all
enemies, no movement, no direct damage,3s personal physical bonus, rank cost/CD,
no active refresh and next-wave allocation behavior. Public production create/
import/allocate/priority/cast/save/reopen at en/zh ×360×640/1280×800, five-size
geometry and inspected screenshots precede skill credit. Engine/full/types/lint/
build and existing schema/loader tests must pass; no validate:data script exists.

Security check: pass. First-party local gameplay/data/UI, no credentials,
permissions, CI, dependencies, remote operations or genuine campaign actions.
Plan review: ready after requiring the existing physical coefficient to have
real paid finite behavior, actual causal damage/control, native authority and
unrenewed carry. Source-owned tuning and existing status/damage pipelines keep
the change bounded. This is author self-review; independent/earned gates stay
open. Preserve original failures, source/build/Git/genuine hashes and exact
task-owned cleanup before delivery.

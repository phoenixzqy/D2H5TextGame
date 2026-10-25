# D05 — Paid Shiver Armor and Chilling Armor

Root author implementation contract; independent design/QA and earned balance
acceptance remain open. This repairs BUG233 without awarding campaign/build
or full-v1 acceptance.

## Identity and payment

Both exact authored/canonical skill pairs are active self buffs, using existing
unlocks12/24, ranks1–20, prerequisites, MP11/15, CD4s, cost/rank−0.1 and
CD/rank−0.05. The native projector validates class, unlock and every prerequisite.
A combo entry or bare marker grants no power. Missing/invalid allocations cannot
use rank-one fallback. An eligible cast pays once, copies its rank and source
into an immutable combat-only snapshot, and adds the display marker. No recast
while paid, including after CD; no permanent stat/save-field modifications.

As with Frozen Armor, potency lasts for the native run, carries across waves,
retains its paid rank after positive allocation changes or combo removal, and
is invalidated on an ineligible configuration boundary. Fresh runs/reload start
unpaid. Native resource reconciliation never refills HP/MP. The three armors
coexist: no previous specification establishes mutual exclusion. Their Defense
bonuses add before ordinary multipliers. Replacing each other would otherwise
cause an automated recast loop in three configured priority slots.

## Defense and retaliation

Existing JSON coefficients remain: Shiver Defense3.5%/rank and direct Cold
damage1%/rank; Chilling Defense4%/rank and magic dodge1percentage point/rank.
Defense composes with Frozen/Melt/Inner Sight and other existing layers without
intermediate floors. Dodge composes in the ordinary magical pool. Shiver's Cold
increase adds to existing direct-damage increases, including its own retaliation.

This no-range text-combat adaptation uses direct Physical hits for Shiver's
melee trigger. Chilling responds to every direct hostile damage type. This
explicit adaptation requires independent design acceptance. Misses, zero rolled
damage, allies, self damage, periodic ticks/aura pulses and reaction callbacks
do not trigger either armor. A fully absorbed positive incoming hit qualifies.
Eligibility is captured before the hit, so a lethal hit can still retaliate.

Each qualifying hit attempts one Cold counterattack at the original still-living
attacker per paid armor, in Shiver then Chilling order. Newly authored provisional
JSON defaults: Shiver12–18,+3/rank; Chilling24–36,+4/rank, using rank−1 growth.
These are initial tuning knobs, not evidence of earned balance. Counterattacks
use the normal seeded independent hit/base/crit rolls, Cold resistance then MR,
mastery/Cold increase/combo behavior and personal shields. Landed counters apply
canonical Freeze1s, boss0.5s through the normal status lifecycle. A missed counter
does not Freeze. No extra MP/CD/action is charged. A lethal counter settles
ordinary death/orbs/corpses once. No reaction can trigger another armor reaction,
including Frozen Armor; no recursive reflect path or skill-hit recovery payload.
Original offensive statuses resolve before reactions, then normal original-hit
death/reflection closure. Control uses existing half-open timestamps/scheduler.

## Delivery and validation

Use strict identity-specific schema and immutable JSON-derived definitions;
effect metadata merely opts into exact consumers. Bilingual rank previews must
show payment, Defense, Cold/dodge bonus, retaliation range, trigger and Freeze
limits. Keep retaliation separate from direct cast damage (buff cast hits nobody).
Prove original RED, rank1/2/20, eligibility/aliases, mitigation, misses, lethal/
absorption/nonrecursion, paid carry/unlearn/fresh-run boundaries, input immutability,
recorded/unrecorded determinism and public mobile/desktop save/offline behavior.
Run focused checks, full engine, full suite, types/lint and production build.
Credit only verified scope; retain failures and exact task cleanup evidence.

Security check: pass. Scope: local deterministic combat/data/UI work. No new
credentials, permissions, dependency, network or durable save behavior; findings
none. Continue in the existing claimed umbrella worktree with source read-only.

Plan review: ready. Native authority and carry invalidation, coexistence/recast,
lethal order, shields and reaction recursion are explicit. Numeric tuning and
trigger adaptation remain provisional; no independent signoff is implied.

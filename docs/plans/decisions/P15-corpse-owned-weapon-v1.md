# P15 — Corpse-build owned physical weapon preparation

2026-11-03. Type: preparation tweak. BUG-611 stays open; no viability claim.

Successor clarification: [Barbarian preparation](P15-barbarian-owned-weapon-v1.md)
adds explicit intended Swing6/Throw12 opt-ins. The corpse-only registry statement
below describes this earlier decision's original scope; its level24 behavior and
the physical score are preserved.

## Motivation and design delta

The intended identity requires hero and mercenary attacks for opening kills and
singletons. The owned-equipment policy currently requires every compared stat
and resistance to be nondecreasing. This leaves the earned level-71 hero using
a level-9 short sword while all stronger owned candidates fail that predicate.
The retained revised-rule admission clears three Crystalline waves, then draws:
wave four's first corpse arrives at 24,039.604 ms. Its three real Corpse
Explosions deal 8,825 fire damage. This is an opening-damage problem, not proof
that CE failed to cast. The diagnostic attribution supplement corrects that
field without invalidating the passing custody/reward checks.

The identity authority says: “Teeth supplies early spell damage; later Corpse
Explosion consumes real pack corpses. Curses, hero attacks and mercenary attacks
supply first kills and boss damage.” Preserve this identity and its skill rules.

## Exact replacement rule

Only the canonical corpse-and-curses profile opts into physical hero weapon
preparation; its separately selectable decoy derivative inherits it. Activate
from level 24, the same authored Decrepify/stat transition. Store the level in
campaign JSON. Other profiles and the earlier portion retain their prior policy.

At an idle owned-equipment boundary, compare eligible backpack/stash mainhands
through the canonical equipment projection, including actual two-hand/offhand
mutex. Rank by expected unmitigated basic physical damage per second:

`attack * (1 + min(1, critChance) * (critDamage + max(0, critChance-1)/2 - 1))
* 1000 / actionPeriodMs(attackSpeed)`.

Use the native action-period function, including its 400 ms floor, and native
critical overflow arithmetic. Require strictly higher expectation than the
current loadout. Break candidate ties by ascending item ID. Explicitly permit
losses of defensive stats, resistances and resource maxima; retain full signed
comparison evidence. This score selects preparation, not encounter DPS or wins.
No target-specific arithmetic, fitted coefficient, enemy seed, new gear, socket
spending, skill allocation, resource refill, respec or companion change is added.

Keep mainhand-first ordering, native eligibility, affinity/bow restrictions,
Iron Golem reservation, native retrieval/staging/equip, and capacity fallback.
Other slots continue to require clear net upgrades. Preserve current resources
subject to native max clamps, all item payloads and unrelated earned state.

## Acceptance and execution

- Reproduce rejection with native owned stash gear before implementation.
- Verify deterministic offensive selection with defensive tradeoffs, two-hand
  mutex, custody and idempotence; native cadence saturation and critical value;
  early/other-profile opt-out; reserved/ineligible items and capacity fallback.
- Run only affected equipment/profile tests, scoped strict types and explicit
  lint. Do not replay earlier acts or completed functional/browser checks.
- Then prepare the exact earned next-1595 export without combat and independently
  reconcile whole-save ownership, unchanged resources/points/currency/quests and
  native projection. Any actual admission needs a separate bounded prospective
  protocol; closed native controllers/comparison families stay closed.

Plan review: ready. Defensive tradeoffs are deliberate and must be measured in
subsequent earned combat; a raw 61.56% appraisal gain does not establish viability.
Native cadence avoids rewarding speed beyond its floor. No global weakening of
the inventory comparator or unrelated profile selection is required.
Security check: pass for authorized first-party local preparation and evidence;
no network, install, credentials, CI, permissions or publication changes.
Root retains human2 and required evidence through umbrella review and owns
eventual cleanup/release. Full private v1 remains active.

## Native preparation protocol

The focused equipment file has 21 distinct passing cases across retained runs;
only the two incorrect edge fixtures were rerun after their correction. Scoped
strict types and unignored lint pass. The original failures remain retained.

Restore only the authenticated successor export from revised admission 1594
(next ordinal 1595), then run the canonical owned-equipment preparation once.
Freeze all production inputs and the complete revised campaign manifest before
execution. Keep a complete save after every native transfer/equip and preserve
the actual terminal export even if later diagnostics fail. Audit all item
payloads, custody, equipment mirrors and unrelated save domains, and allow only
native current-resource max clamps. The persisted source has 130 life / 87 mana;
terminal combat-unit pools are not persisted player pools. Never refill here.

Repeat preparation once solely to verify an exact no-op, retaining both action
ledgers. Bounds: two calls total, at most 32 native actions, 30,000 driver wall
ms, 45,000 launcher wall ms, 10,000 independent-reader wall ms, 32 MiB result.
No combat, admission, clock advancement, quest, spending or controller restart.
An independent reader must reconstruct each native custody transition and whole
save, verify signed stat projections and native cadence/critical ranking, and
authenticate source/export/manifest/receipt hashes. Canonical stat composition
is a shared input, not a separately implemented formula. Success proves only
owned preparation; any battle still needs its own prospective bounded protocol.

# P15 intended Javelin lightning rotation v1

Status: native rotation/held-point checks pass; earned pilot reaches Act II; population acceptance pending.

The intended Javelin growth plan learns Lightning Bolt at 12 and Charged Strike
at 18, but its order omits both. Make the native learned progression explicit:
Lightning Strike, Charged Strike, Lightning Bolt, Poison Javelin, Impale, Power
Strike, Jab, Magic Arrow. Native learned-level projection removes unavailable
skills; cooldown, mana, targeting and weapon eligibility remain authoritative.
This gives later lightning unlocks first opportunity without granting a rank,
resource, weapon, XP or reset. Keep all historical profile orders exact.

Hold three filler points through level5 by starting the final Critical Strike
filler target at6. Buy Power Strike1, Poison Javelin2 and Dodge1 at6 while
retaining the initial Critical Strike1. No point grant or reset is added.

Acceptance: constructed native levels 6/12/18/24 project and actually cast
Poison Javelin/Lightning Bolt/Charged Strike/Lightning Strike first in a production-planned Blood Moor wave,
with damage and paid mana; existing growth checks retain point conservation and
prerequisites. Supplied fixture XP is not earned progression or balance evidence.

Plan review: ready. Fix the intended order at its JSON definition; no engine
special case or new execution mode is needed. Security check: pass; local data-only
evaluation change with no dependency, credential, network or CI changes.

Verified: seven targeted native allocation/cast checks pass. The fresh v3 pilot
with shared lower-level recovery clears Act I and reaches20before exhausting
three Dry Hills attempts. Full journals retain all losses and earned state.
[Evidence](../../balance/2026-11-02-intended-javelin-recovery.md).

# D04 — Amazon single-hit attacks

2026-10-26. Root implementation contract; independent design/QA and earned
balance acceptance remain open. This preserves current authored mechanics.

| Skill | Rank1 base / growth per additional rank | MP / cooldown | Existing payload |
| --- | --- | --- | --- |
| Magic Arrow |35–50 Arcane /+4|5/1s|One target; bow/crossbow required; no ammunition system debit|
| Lightning Bolt |50–75 Lightning /+5|15/1s|One target; unlock12, Power Strike prerequisite; no authored affliction|
| Fire Arrow |35–55 Fire /+4|8/1s|One target; landed Burn at10% final hit/s,3s,cap5|
| Cold Arrow |35–55 Cold /+4|10/1s|One target; unlock6; landed Chill2s at half attack speed|

Preserve actual class/level/allocation/prerequisite/cap20 and canonical weapon
authority. Only Magic Arrow has an authored equipment requirement in this set.
Retain normal hit/critical/resistance/mitigation, payment and cooldown; current
Fire uses Defense, while Arcane/Lightning/Cold use magic resist. Damage comes
from skill base/rank, without adding weapon Attack. Burn canonicalizes to Ignite;
refresh adds one stack to cap5, extends duration and retains an existing
damaging record's source/rate. Chill refreshes duration without stacking and
preserves action progress at onset/expiry. Misses spend mana but apply no status.
Dead/friendly units are ineligible; a lethal single hit never spills to another
enemy. Retain the shared combo rules and exact seeded replay.

The illustrative signature mapping does not grant every elemental attack a
status: Magic Arrow's design table specifies none, and Lightning Bolt's JSON
contains tags without an affliction. This follows the authored-payload policy
already recorded for Sorceress direct lightning. Do not silently add Mana Burn,
Paralyze, Freeze, extra hits or new equipment gates to make this batch uniform.

Acceptance has three outcomes: literal rank1/cap combat HP/MP/timing and negative
controls through native projection; truthful bilingual current/next/MAX panels
and real allocation; public desktop/mobile equip/priority/cast/effects plus
seven-domain online/offline restoration. Constructed level90 browser allocations
can cover all four capped skills within one fixture; they are not earned builds.

BUG283's40UI failures establish the missing description selection. Reuse shared
Burn rendering and current damage/cost/cooldown/status definitions; no engine,
data tuning or save migration is needed. Keep source increments at five paths
or fewer and docs separate. The Plague checkpoint's1673frozen inputs were read
back exact after its passing terminal checks before this source change.

Security check: pass. Author plan review: ready after including actual canonical
bow authority, Fire refresh/cap, Chill action times, dead-target controls and
public/offline restoration. This is not independent approval or skill credit.

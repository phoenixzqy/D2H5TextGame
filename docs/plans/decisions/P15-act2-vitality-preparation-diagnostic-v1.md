# P15 — Native stat reset for survival preparation, v1

Provisional2026-10-30. BUG445's priority-only screen fails all three original
LostCity inputs and is rejected. The actual character has full mana at each
death, base Strength10/Dexterity25/Vitality52/Energy98 atL22, and three unused
native stat-reset allowances. Authored Frozen Armor/Energy Shield rank1 each
provide only3% defense/absorption; no speculative defensive-rank grant or
monster tuning is justified.

Clone bounded-entry-v1 with one preparation change after its already guarded
exact201-admission/761-wave/full-export Static-v2 prefix. At that actual terminal
Return, use the authored current-act NPC's native prepareTownRespec and
executeTownRespec for stat only. Require an available free allowance, quoted
cost0, actual refund equal to invested stats and exactly one consumed stat
allowance; preserve skill ranks/points/allowance and all item/currency/quest
ownership. No skill reset or imported state.

Set future stat policy to five Vitality per level and allocate the refunded
points through growCampaignBuild/native allocateStatPoints. Preserve native
derived-stat calculation and mana regeneration from the lower Energy; do not
inject stats, healing or mana. Record before/after core/derived stats, allowance,
refund, allocation result and complete earned state. Fresh native admission
owns resource refill as before. Keep all original budget, route/recovery/training,
inventory, Prayer, skills/priority, source/save/quest/point/economy audits. Stop
honestly on any refusal/nonwin/budget. This is a separate declared policy, not
proof that all builds or the campaign are balanced.

Plan review: ready; native allowance/refund and lower mana are accounted rather
than treating added HP as free power. Security check: pass; local isolated test
state only, no protected saves/network/installs/publication/agents. Root sole
writer; retain original evidence, close owned processes and exact privatecache.

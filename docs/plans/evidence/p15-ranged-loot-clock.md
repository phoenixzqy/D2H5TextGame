# P15 ordinary ranged loot and consumed campaign clock

Date:2026-10-31. Root sole writer, current claimed human2 worktree, local only.
Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

BUG502 is fixed locally: six ranged bases,120 appended picks across28 ordinary
weapon tables, names in zh-CN/en, unchanged old base/save bindings. New tier
damage/sockets follow existing two-handed curves. Each ranged family adds
one eighth of the original table's weapon weight; full economy tuning remains
provisional. See `../decisions/P15-ranged-weapon-progression-v1.md` and items
spec3.9. The affected95 loot/schema/preservation checks already passed; reuse
that result after the transport-only change.

The first new1466–1477 acquisition earned149690XP/107items but found no bow.
Its Date.now was frozen, so all12 area admissions reused a native seed.
BUG503 fixes the maintained campaign transport: advance the task-owned clock
by the ceiling of each consumed recorded wave duration, checkpoint native meta
online time, record each admission timestamp, and restore the caller's clock.
No production seed override or PRNG change. Old rewards/evidence remain valid
for their actual correlated sample; do not claim independent loot/pacing proof.

Clock-aware acquisition resumes the exact earned next1478/40/35action save.
Three new Plains W1/W2/Flee3 admissions earn and natively equip a58Attack Siege
Crossbow. One new route1481 clears W1–W4, then Izual49 draws60s:43619 initial
boss HP,21173 remaining; hero431HP/259MP. The batch earns72420XP/84items.
No further acquisition/earlier-act replay is performed. Latest retained source:
`p15-bow-act4-ranged-loot-clock-continuation-v1.json`, next1482/40/35actions.
All prior Starts/Claims/socket costs and17 earned area clears are preserved.

Verification is scoped to this change: three clock tests; one constructed Act IV
partial-wave budget/custody/cleanup case; current-file typed lint and scoped
TypeScript; one native current-act continuation; independent incremental
readback. The selected budget case models prior-act prefixes without replaying
their campaigns. Typecheck first exposed eight stale route mocks returning
void; those mocks now return the unchanged profile, matching current contracts.
The corrected typecheck passes. Historical probe lint failure is retained;
the consumed old probe is excluded from current-file lint rather than rewritten.

`p15-bow-ranged-clock-earned-summary-v1.json` independently verifies1466–1481:
16admissions/35waves/34wins/1draw,222110XP/191added/209removed items,
15native Flee custody pairs, zero socket insertion/fusion costs. New1478–1481
seeds equal production area/time hashes and are distinct; timestamps equal
the sum of consumed wave time. No time/reward is counted for staged Flee waves.
Exact predecessor lineage, inventory/currency/materials/XP/points, all35quests,
export/meta timestamps and source stability pass.

Active-bonus arithmetic is checked; native next-wave staging with a live bonus
is not established because staging precedes accelerated caller clock advance.
Current campaign inputs have empty bonuses. Full private-v1 acceptance, the
remaining build/later-act matrix, pacing/economy holdouts, final fresh integration,
PWA/endgame/soak and owner playtest remain open. Izual's physical damage gap
requires diagnosis before another bounded continuation; do not grind blindly.

Validation artifacts and wrapper receipts are retained in the packet through
umbrella QA. Root owns eventual evidence removal. Disposable scoped configs
are archived in `p15-ranged-clock-artifacts-v1.json` then removed; task caches
and owned process groups must be absent before handoff.

Follow-through: [Bow Act IV–V](p15-bow-earned-act4-5.md) closes the earlier Izual
gap through native owned-rune preparation, completes Act IV, and resumes Act V
without earlier-act replay. The current successor is41/next1502/58actions.
The original reports and manifest referenced above remain immutable.

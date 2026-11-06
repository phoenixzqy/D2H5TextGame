# Act V current-runtime comparison — 2026-11-02

Status: sampled runtime and accounting comparison complete; full v1 and balance
acceptance remain open. No application code or game data changed in this slice.

The frozen policy includes all 14 builds, trash and elite roles, and the same
historical seeds 1 and 8: 56 native areas, 330 settled waves. Production save
decode/restore, original capacity/priority preparation, native combat and reward
entry points are used. Settlement snapshots and every failure are retained.
The run took 54.670 execution seconds and retained 8,929,240 compressed raw bytes.

| Observation | Result |
| --- | --- |
| Complete area wins, current / historical | 53 / 53 |
| Areas with changed combat metrics | 0 |
| Changed area outcomes | 0 |
| Independently reconstructed reward/state deltas | 330 |
| Retained-unit HP, mana and cooldown carry checks | 371 |
| Unresolved observed wave differences | 0 |

The three unchanged failures belong to the Corpse and curses Necromancer
(historical profile key `necromancer-bone`): elite seeds 1/8 and trash seed 1.
They reach the intended matching-level target before a later forced elite fails.
The elite trials draw at 60 seconds; trash seed 1 loses at 37.4 seconds. Positive
mana remains, and the merc is often already dead. This is not evidence that the
build should use Bone Spear. Its frozen priority is Corpse Explosion, Amplify
Damage, Weaken, then native attack fallback. No tuning was made from these two
seeds; see the [build identity record](2026-11-01-build-identities-and-points.md).

All differences are retained and classified: 7,648 item identifiers differ only
in allocator suffix (same entropy prefix), 430 lower current wishstone
award/delta entries, and 3,748 explicit legacy Inner Sight payload additions
`{defenseReductionPct:25}`. Preparation differs only by empty current recruitment
defaults. Neither reward differences nor unchanged combat proves economy balance.

The independent reader reconstructs each settlement from before/after custody,
XP, currencies, materials and clears, then reconciles the complete area delta.
It checks final state including the native post-capture online-clock advance
by `ceil(lastWave.logicalMs)`; only the two inactive idle timestamps advance.
Initial reader failures and the superseded classifier report are retained.
V2 fixes the reader's missing-value sentinel handling; no combat was replayed.

Evidence is retained in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`:

| Artifact | SHA-256 |
| --- | --- |
| `p15-act5-current-runtime-differential-v1.json` | `24963f5d1873fabdb61713f7d1b81ee907f06a5a6c433171e663eeeffeae02e8` |
| `p15-act5-current-runtime-differential-v1.policy.json` | `49976844b22ad37d4d07daca22a60f32965585bc85534585aaddac1609806805` |
| `p15-act5-current-runtime-differential-v1-readback-v2.py` | `44f025fb86cc527f8ddbf2ec140f50d08e24fbfe7b4fdd8b37ee91ffc00cf221` |

The final report is `p15-act5-current-runtime-differential-v1-readback-v2.json`.
Authority 52 authenticates all 2,141 current source inputs before/after combat
and during independent accounting. Two fixed seeds establish only this sampled
comparison: population win rates, appropriate earned power, fresh acquisition,
sequential retries, pacing and holdout acceptance remain unproven. Accepted
balance cells remain zero. Existing Act I and Bow Act II evidence was reused.
Root retains the worktree and packet through the continuing full-v1 review.

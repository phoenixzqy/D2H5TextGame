# Act III current-runtime comparison — 2026-11-02

Status: sampled runtime and accounting complete; full v1 remains unfinished.
No production code or game data changed.

The policy selects the last listed policy for each Act III build/role in the
authenticated retained inventory, with indices and alternatives preserved. It
covers all 14 builds, trash and elite roles, and fixed historical seeds 1 and 8.
Selection is frozen before combat and does not depend on sampled outcomes.
Original fixtures remain exact. Missing normalized checkpoint fields are derived
from each authenticated exported save, without changing its original fixture.

All 56 complete areas and their intended matching-level targets win, the same
as historical. All 288 wave combat metrics match. Native execution took
64.588 seconds, retaining 12,628,766 compressed raw bytes.
These two seeds are diagnostics, not estimates of population win rates.

| Independent accounting | Result |
| --- | --- |
| Reconstructed settlement deltas | 288 |
| Retained-unit HP/mana/cooldown carry checks | 457 |
| Changed area outcomes / combat metrics | 0 / 0 |
| Unresolved observed wave differences | 0 |

Preparations use only original native capacity operations: 290 stash moves,
18 declared discard operations, and 6 capacity-policy observations
across both seeds. The discard records retain all 79,746 discarded item IDs;
discarding earns no income. The Necromancer summon trash source retains its
9,630-item over-cap backpack because its capacity policy cannot move enough to
stash. The driver asserts exact inventory custody after each operation and the
same prepared inventory as historical. The independent reader reconstructs
preparation from the pinned save and checks full prepared custody separately.
No allocations, reset, crafting, equipment change, free gear or reward injection
is introduced by this comparison.

Preparation changes versus historical are only empty current recruitment
defaults. All wave differences are classified: 4,834 allocator suffix-only item
IDs, 200 lower current wishstone award/delta entries, and 10,291 explicit legacy
Inner Sight status payload additions. This does not establish economy fairness.
The final snapshot is reconciled with the native post-capture online-clock
advance, rather than assuming it equals the last award snapshot.

The initial reader incorrectly expected a legacy save's omitted
`latestMaterialAction` field to remain absent. The store reset defines it as
`null` (`src/stores/inventoryStore.ts`), and the native historical and current
prepared states agree. V2 models only that verified default for version 32
sources and retains the initial failure. No combat was replayed for the fix.
Driver typechecking passes after removing one unused import; the initial type
failure is retained as well.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.

| Artifact | SHA-256 |
| --- | --- |
| `p15-act3-current-runtime-differential-v1.json` | `d211853004e7c9c0c37141c2db469eb31fee563254c3b88af9cf3c6f805515a4` |
| `p15-act3-current-runtime-differential-v1.policy.json` | `883b493ad869cc60df1ec0a3458d46a9db95dce6688adad35bf59e7e783c7a25` |
| `p15-act3-current-runtime-differential-v1-readback-v2.py` | `26152c20f72952625e7c391ffd092251d5fd8696f182edeb1318774933b040a4` |

Final accounting: `p15-act3-current-runtime-differential-v1-readback-v2.json`.
Authority 52 authenticates all 2,141 current inputs before/after combat and in
the independent reader. Source provenance limitations remain: some sources are
later-boundary same-act repeat contexts, so these results cannot establish fresh
acquisition or appropriate first-encounter power. Population samples, holdouts,
sequential retries, pacing and balance acceptance remain open. Accepted cells
remain zero. [Act V comparison](2026-11-02-act5-current-runtime.md) and completed
Act I/Bow Act II evidence are reused without replay. Root retains the required
worktree and packet through full-v1 review and owns eventual cleanup/release.

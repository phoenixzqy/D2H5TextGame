# P17 — Treasure-goblin gated wishstone quantity

Verified locally, 2026-11-04, on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
plus retained changes. BUG688 is resolved locally, uncommitted. Implements
drop-tables §4.9/§9 under the existing D09 goblin context and P15 kill gate;
constructed engine/native settlement evidence, not earned campaign credit.

Goblin boss-tier equipment/material context previously supplied miniboss wishes
6/7/8/9/10 with difficulty scaling. The existing goblin policy now authors the
separate inclusive 1–3 wishstone range. One existing 2.5% kill gate applies;
only success samples the quantity, from the supplied wishstone RNG. Goblin
wishes are independent of act and boss difficulty scaling. Closed required
integer fields reject missing/extra/invalid values and reversed ranges.

Separate wishstone streams preserve equipment, materials and following loot
RNG. Shared-stream callers consume one extra draw on successful goblins before
equipment guarantees; deterministic seeded results remain, while those old
shared-stream results intentionally change. Raw goblin treasure classes,
explicit quest caches, non-goblin awards, first-clear grants, native settlement
authority, persistence and historical saves/evidence remain unchanged.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-goblin-wishstones-v1`.
Counts overlap and must not be added.

| Check | Result / retained evidence |
| --- | --- |
| Original real-pool reproduction | 8 failed / 3 passed; `original-failure.log` |
| Initial implementation | 11 passed; `initial-green.log` |
| Final eight explicit affected files | 160 passed; `affected-final.log` |
| Scoped strict types / explicit four-file lint | Pass; `types-final.log`, `lint-final.log` |
| Isolated production / actual offline precache | Pass; `production-build.log`, `precache.log` |
| All emitted JavaScript | 13 files pass five forbidden bridge patterns; `bridge-scan.json` |

The 12 focused cases cover all five acts/three difficulties, exact quantities
1/2/3, the .025 boundary, conditional entropy, parent stream preservation,
continuous batch entropy, seeded determinism, raw cache bypass, missing-source
refusal before either stream and schema/semantic negatives. The affected run
also covers existing goblin equipment/materials, ordinary combined kill coins,
mini/chapter budgets, unchanged award snapshots, native publication and all-domain
restoration. No snapshots changed or campaign routes replayed.

Two existing native Cold Plains seed7 tests now use a real successful wishstone
seed, retaining actual loot and settlement. Inventory receives one goblin wish
plus the existing five first-clear wishes; publication failure restores every
domain and retains the complete six-wish prepared bag. `focused-native.log`
retains an initial new assertion error from subtracting an unset balance;
only that assertion was corrected to treat an unset balance as zero.

Local five-axis review found no material issue (`local-review.md`); it is not
independent umbrella sign-off. Existing large-chunk/optional-art-manifest build
warnings remain; no UI/runtime performance acceptance is claimed. Six source
and 766 build hashes verified before exact disposable `production/` and
`types.config.json` removal (`verified-sha256.json`, `cleanup.json`). Required
logs, baselines and manifests remain root-owned through umbrella review.

Previous goal turn was status-only/no progress. This continuation implements
and verifies an unfinished reward requirement. No full suite, campaign replay,
new agent, install, commit, push, publication or renewed closed budgets.
14 intended Act I clears / 3 five-act Normal completions / formal 0 of 210 remain.
Full private v1, remaining loot/economy/pacing, build viability, difficulty/endgame
integration, accessibility/performance and final review/soak/user playtest remain
open. Browser works; CI excluded; no pending answer/external blocker. Root retains
human2 through umbrella review and owns eventual packet cleanup/worktree release.

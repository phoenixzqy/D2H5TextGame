# P17 — Additional kill-equipment guarantees

Verified locally on 2026-11-04 at HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained source.
BUG680 is partially resolved: the rarity groups work; full boss bundles and
first-kill rewards remain open. No campaign/balance/pacing credit is claimed.

[D09](../decisions/D09-kill-equipment-guarantees-v1.md) adds separately authored,
schema-validated equipment groups after ordinary rewards. Andariel/Duriel add
one rare+, Mephisto/Diablo two, Baal three; Diablo/Baal additionally add one
set/unique. Goblins add one rare+; each mini adds one rare+ with 50% probability.
The mini source is explicitly its act's trash equipment table because the
actual Den of Evil mini is level4, below mini-act1's level7 equipment band.

Bounded weighted selection conditions MF/tier rarity probabilities on eligible
materialization. Missing unique/set templates contribute to rare fallback for
rare+ groups; a set/unique group requires an eligible positive finite-weight
template. Impossible configured guarantees throw before inventory publication.
There are no retries or silent downgrades. Base weights and level gates apply.

Bonuses follow ordinary equipment, direct/independent materials and the wishstone
coin. Paired independently seeded calls preserve the ordinary item prefix and
all currencies. Added draws intentionally change later kills on the shared
stream. Quest caches bypass this policy; save format and earned saves are
unchanged. The old 90,000-call MF diagnostic explicitly disables guarantees for
both variants to preserve its historical scope; it was not rerun.

| Check | Result |
| --- | --- |
| New production reproduction before implementation | 15 failed |
| Initial production guarantee cases | 15 passed |
| Affected loot suite, seven files | 95 passed |
| Final guarantee/selected Nightmare eligibility cases | 52 passed; 17 unselected |
| Existing native settlement/offline-bonus regressions | 36 passed |
| Final settlement file, including two new real-pool publication cases | 19 passed |
| Final scoped strict types / explicit no-ignore lint | Passed |
| Isolated production build / forbidden bridge scan | Passed; 766 files, ten JS chunks |
| Actual Workbox precache and PNG installation-icon check | Passed |

The level check constructs manual/idle plans for all authored areas under
Normal/Nightmare/Hell, deduplicates affected table/tier/level contexts, forces
optional bonus coins to succeed, and checks materialized counts, rarity and
level. This executes no combat. Direct real-pool Diablo publication credits the
complete returned items/materials to inventory; removing eligible special
templates throws and leaves the exact inventory state unchanged.

Initial lint rejected a redundant runtime union comparison; removing it fixes
the cause. Its failure log remains. Final types include the updated planned-level
and real publication tests. No broad suite, campaign or browser replay was
needed for this pure loot slice. Build warnings about existing large chunks and
the optional art manifest remain; emitted application chunks are precached.

Local five-axis source/test review found no material issue within this slice:
bounded generation, validated authored policy, shared materializer eligibility,
atomic native publication and quest-cache separation are covered. This is local
review, not independent umbrella approval. Security check passes: no new
dependency, network/file execution, permission or persistence contract.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-loot-guarantees-v1`.
It retains original/final logs and source/build SHA256 manifests. Exact disposable
build/type-config removal is recorded in `cleanup-closure.json`. Root retains
the packet and claimed human2 worktree through umbrella review and owns eventual
cleanup/release.

Counts remain14 intended Act I clears, three five-act Normal clears, formal
balance0/210. Complete ordinary/jewelry boss picks, forced rune/gem quantities,
optional unique attempts, first-kill rewards and economy acceptance remain
required under BUG680. BUG681 and wider idle/PWA/endgame/build viability,
pacing, accessibility/performance and final review/soak also remain open.

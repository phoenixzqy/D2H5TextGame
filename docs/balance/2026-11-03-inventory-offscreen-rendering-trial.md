# Inventory offscreen rendering trial — rejected

The `content-visibility: auto` candidate is rejected and restored. Mobile
verification could not establish the required offscreen button in Chromium's
accessibility tree. The frozen plan requires all correctness checks; faster
timing does not override this failure. This does not independently establish a
persistent accessibility defect in the baseline game.

## Diagnosis and bounded change

Fresh development and default production baselines each pass four existing
browser contexts. Production transfer traces show repeated layout, style and
prepaint work, with 74.509–79.587 ms critical renderer tasks. Final prepaint alone
takes 9.630–10.488 ms. Count computation is approximately 7–9 ms; no individual
application function dominates. Development and production measurements are
separate diagnostics, not an optimization comparison.

The candidate adds a single CSS rendering hint to existing square BackpackGrid
list cells. It preserves keys and DOM subtrees and changes no gameplay data.
The plan requires at least 10% improvement in mobile median transfer time and
median longest task, no more than 10% desktop regression, and complete
functional/save/geometry/keyboard/tooltip/accessibility checks.

## Evidence and limits

All 34 affected grid/pagination/focus cases, scoped strict types and explicit
lint pass. Desktop post-measurement checks pass exact imported/exported/native
saves, surviving-card identity, geometry, keyboard activation, the focused card's
tooltip, accessibility, final-page reachability, independent bulk counts and
localized previews. No overflow or browser errors occur.

| Context | Baseline transfer ms | Candidate transfer ms | Baseline longest task ms | Candidate longest task ms |
| --- | ---: | ---: | ---: | ---: |
| Desktop en | 109.268 | 84.433 | 0 | 0 |
| Mobile zh, sample 0 | 227.086 | 198.588 | 77 | 70 |
| Mobile zh, sample 1 | 257.376 | Not run | 74 | Not run |
| Mobile zh, sample 2 | 252.925 | Not run | 79 | Not run |

The mobile copy passes full import and surviving-card identity, then fails the
offscreen accessibility assertion before the remaining functional/save checks.
Stop there: no complete mobile median or performance acceptance is claimed.
All measurements are local production diagnostics with symmetric CPU profiling;
mobile uses a 360×640 viewport and CPU4 emulation. They do not certify a real
device, release budget, campaign, or population balance.

Earlier verifier versions incorrectly required offscreen cards on desktop
(all 100 can fit) and used an ambiguous tooltip selector. Corrections change
only post-measurement assertions. The sole original desktop timing is preserved;
candidate source and emitted assets are checked against that original run.
No timing is retried. The final verifier uses the focused reference's tooltip
ID and the existing explicit panel Close control.

## Restoration and custody

BackpackGrid is restored to SHA256
`192a63aecb5483f80d4addcdeb72d70ee328f0a4905ff7c6ba97baf526e8b503`.
Independent filesystem enumeration and hashing verify all 2,151 production
inputs equal the retained production baseline, including unchanged gameplay
data. Earlier optimizations remain; no additional test replay is needed to
restore these authenticated bytes.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Retain `bug592-current-trace-v1-*`, `bug592-release-transfer-v1-*`, and
`bug592-offscreen-cells-v1-*` through `-v4-*`: frozen plan, original backup,
rejected source, failed/final reports, traces, compressed maps, browser screenshot,
correction receipts, rollback and `bug592-offscreen-cells-v4-closure.json`.
Root owns retention through umbrella review and eventual cleanup/release.
All recorded consumers are terminal; exact temporary test/type configs and all
four exclusive build/Vite-cache directories are verified absent.

BUG592 remains open. This closes the candidate, not the full game objective.
No campaign advancement or formal balance acceptance occurs. Next return to
the retained Double Throw failure evidence before selecting another gameplay
correction; do not extend either rejected campaign trial or start another
speculative rendering optimization.

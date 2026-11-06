# P17 — Exact chapter-boss rune and gem bundles

Verified locally, 2026-11-04, at `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
plus retained source. [Decision](../decisions/D09-chapter-boss-material-bundles-v1.md)
implements the material quantities/bands from `drop-tables.md` §5. BUG680 remains
partially open for ordinary/jewelry counts, optional uniques and first kills.

| Boss | Runes | Inclusive band | Gems |
| --- | --- | --- | --- |
| Andariel | 1 | Ith–Tal | 2 |
| Duriel | 1–2 | Ral–Hel | 3 |
| Mephisto | 2 | Hel–Lem | 4 |
| Diablo | 2–3 | Ko–Pul | 5 |
| Baal | 3–5 | Pul–Zod | 8 |

Schema-validated, bounded policy selects the source act and rune band. Existing
weights and difficulty/tier caps still apply: Baal stops at Um outside Hell;
perfect gems remain Act V Hell only. Multiple samples combine into concrete
owned stacks. Mixed TC rune/gem choices are removed only for configured live
chapter bosses, preventing extra random materials outside the required bundle.
Wrong actual acts refuse before rolling. Quest caches, other tiers and
unconfigured tables preserve their paths; input tables are not mutated.

The initial secondary rune/gem variates and shard-variance draw retain their
positions. Variable quantities and subsequent identities add bounded draws.
Later rewards on the shared boss stream intentionally change; historical earned
saves/evidence are neither replayed nor relabeled. Wishstone rules, shard
formula, save version and existing equipment guarantees remain unchanged.

| Check | Result |
| --- | --- |
| Original five bosses × three difficulties, before fix | 15 failed |
| Initial production material cases, after fix | 15 passed |
| Final affected loot/material/currency suites, eleven files | 199 passed in 3.92s |
| Native settlement file, including complete real Diablo publication | 19 passed in 7.01s |
| Scoped strict types / explicit seven-file lint | Passed |
| Isolated production build / forbidden bridge scan | Passed; 766 files, ten JS chunks |
| Actual Workbox precache and installation PNG checks | Passed |

The final material file has 25 tests: real-pool awards under all three
difficulties/eight deterministic seeds, forced count/identity endpoints,
duplicate aggregation, malformed/empty capped bands, schema and semantic policy
refusal, actual-act refusal, quest isolation and unchanged other-tier/unconfigured
behavior. Native Diablo publishes five gems and two–three Ko–Pul runes together
with its equipment; impossible required special gear leaves inventory untouched.

The initial affected run retained 174 passes and one stale scripted-sampler
failure. [BUG682](../../../production/bugs/BUG-682-material-sampling-wishstone-fixture.md)
corrects that fixture to supply the separate native wishstone stream, preserving
all six original material draws/assertions and asserting the additional stream.
Its isolated failure is retained. Initial lint also rejected a shorthand void
cleanup; a brace body resolves it. No test was disabled or weakened.

Local five-axis review found no material issue within this slice: bounded
generation, ingress policy validation, cap intersection, complete concrete
ownership, native atomic publication and quest separation are covered. Security
check passes: local authored data, no dependency, permissions, external execution,
network or persistence change. This is local verification, not umbrella approval.
Existing large-chunk/optional-art-manifest build warnings remain.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-boss-material-bundles-v1`.
It retains original/final logs and source/build SHA256 manifests. Cleanup closure
records exact disposable production/type-config removal. Root retains the packet
and existing human2 worktree through umbrella review and owns eventual cleanup
and release. No browser/campaign replay or full-suite run was needed for this
pure reward change. Counts remain14 Act I clears, three five-act Normal clears,
formal balance0/210; full private v1 remains incomplete.

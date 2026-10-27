# D11 — Literal22 quest authority boundary

2026-10-27. Local prerequisite for the approved
[remaining Act I quest contract](../decisions/D11-act1-remaining-quests-v1.md).
Implementation and the final integrated checks passed locally.
This checkpoint does not accept Act I gameplay or complete private-v1.

## Change and causal evidence

Native17–22 save validation previously closed over mutable current quest, action,
service and campaign catalogs. Valid historical Radament ownership, Siege
charges and Malah potion ownership became invalid when only those live catalogs
changed. A quest-only domain also skipped the reciprocal Act V graph.

The literal snapshot now binds quest/objective/reward definitions, physical item
and action sources, Act IV/V victory identities, Act V reciprocal identities,
the original five service mappings/prerequisites, Nightmare areas and the
achievement title through raw and normalized validation and nested campaign/
endgame checks. It is recursively frozen. Current post-migration Life,
resistance, resource and runeword-cache repair semantics remain intact.

The snapshot records 46 quests and 19 items. Its SHA256 is
`2f38f7aae3c4b9b18ca4124600f56cf4d94dcab34885b6ab8d90bc7fc346e950`.
Provenance was independently recomputed against the 14 recorded blobs at
`f3b66255ed7ad694b472b66305394f5b3110937b`.

`src/engine/save/frozen-v22.test.ts` supplies 39 tests: causal live-catalog drift,
native17–22 ownership, complete/partial claimed and unclaimed journals, all five
available/consumed services including salvaged targets, future Act I refusals,
reciprocal graph negatives, deep immutability and existing cache/resource repair.
The original failing runs remain evidence; they were not replaced by later logs.

## Validation

| Check | Result |
| --- | --- |
| Final engine | 10,077 passed / 386 files; Vitest 339.74s |
| Final typecheck | Exit0; wrapper 233.777s |
| Final lint | Exit0; wrapper 380.113s (`lint-retry.log`) |
| Final production build | Exit0; wrapper 23.480s |
| Final production browser | 4/4 passed; wrapper 51.536s |
| Final integrated full unit | 20,040 passed / 947 files, two existing opt-in skips; Vitest1303.81s / wrapper1305.839s; original90658 exit0, consumed |
| Independent source review | `[D11-LITERAL22-REVIEW]: APPROVE`; no material findings, security pass, readers released |

All 1,824 final source/config/test inputs matched the frozen manifest after
the terminal full result. The final full run began after the static fixes. Earlier
full handle75132 was intentionally superseded using only its verified owned
Vitest PID; its terminal143 receipt is retained and is not a passing full run.
Initial type/lint failures and their bounded fixes are retained as well.

The final browser matrix is en/zh-CN at 360×640 and 1280×800 against the final
production build. Each uses ordinary character creation and Settings import of
a constructed raw22 save, exact export comparison, Save, read-only IndexedDB
confirmation, page close/new page and Continue. It preserves partial historical
Act I journals, available Siege/consumed Larzuk charges with absent targets and
an actual source-bound Malah potion. The reload comparison verifies the expected
clock/offlineTime changes and compares every other payload exactly. Both mobile
screenshots were inspected. No page errors, external requests or debug bridge.

The initial browser failed because its oracle expected offlineTime unchanged
after Continue. The correction checks the actual timestamp/lastOnline and
browser-clock bounds; it does not discard the field or alter product behavior.
Service workers were blocked. These are compatibility checks on constructed
state, with no earned quest gameplay, PWA/offline, pacing or independent runtime
acceptance. Existing bundle/precache warnings and test-time budget overruns
remain open under the broader release work.

## Evidence ownership and continuation

Root retains original failures, process/terminal receipts, source/build hashes,
scripts, screenshots and save pairs in these exact archived paths:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-frozen22-lwtz0qvy.evidence.tar.gz`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-frozen22-lwtz0qvy.evidence.manifest.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-frozen22-lwtz0qvy.evidence.cleanup.json`

Archive SHA256:
`16147a5b493c43bfb296e5c07855dae2c5597ba157aa570f0efd2d1ee60cfcc8`.
All 102 members were streamed, checked against original lengths/hashes and
read back before exactly 102 raw files and four empty directories were removed.
The raw task root is absent; remaining[], failures[]. The original causal
failure is archive member `red.log`; `final-verification.json` records final
source/terminal evidence, and `independent-review.json` records the approval.
Exactly 1,524 disposable build/download files were already removed and checked:
remaining[], failures[]. Both owned preview ports39641/39642 were closed.
No shared caches, genuine saves, history or unrelated files were removed.

Root owns these retained artifacts through downstream quest/full-v1 consumers,
then owns their removal. The next card's prepared tests/patch/browser harness
remain at `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-save23-vbsfc2x4`;
root owns this active task directory and its later verified cleanup.

Next is the reviewed save23 registration/reserved-vocabulary card. It must keep
new Act I receipts and imbues rejected until the corresponding full physical/
action graph is implemented. Cain recovery/rescue, Identify, Countess admission/
cache, Malus recovery, deterministic imbue/presentation, ordinary recovery→Claim/
service→Save-close-Continue and broader C2–C4/G0–G7 remain unfinished.
The full goal and umbrella worktree claim stay active. Local only.

# JSON save storage — 2026-11-02

New IndexedDB writes hold immutable JSON text in a versioned physical envelope.
Serialization happens when the save is requested, preserving snapshot isolation
before queued writes. Legacy object records, including native affix Maps, remain
readable. Write/delete order, failure propagation and complete native decoding
remain intact. Logical save version33 and IndexedDB version1 do not change.
Portable backups retain the existing logical format. [ADR-018](../decisions/ADR-018-json-save-storage-envelope.md)
records compatibility and the requirement to export before reverting to an old
reader that cannot understand the physical envelope.

## Verification

344 distinct affected cases have passing evidence across16files. This combines
343 earlier passes with scoped reruns replacing the stale endgame32 assertion
and correcting offline legacy-fixture construction. The independent readback
counts actual per-assertion statuses, excluding filtered/skipped cases. Scoped
strict types, explicit changed-file lint and engine purity pass. A broad type
check was stopped and replaced with the scoped check; it is not a full-type pass.
No campaigns or unrelated unit suites were replayed.

The production comparison uses one Chromium instance, the same HTTP server
implementation, exact authority48 assets versus the candidate, fresh contexts,
fixed Date only and activated service workers. Ordinary Import → Save → Export
→ reload → Export preserves the complete7,413-item earned save in all four cases.
The candidate physically stores json-v1 and the baseline an untagged object.
Every case has one startup save read, no page/console errors or horizontal
overflow. Desktop/en and mobile/zh-CN screenshots were inspected.

| Profile | Reload before → after | Import before → after | Longest reload task before → after |
| --- | ---: | ---: | ---: |
| Desktop1280×800 | 1,186 → 1,264 ms | 665 → 700 ms | 422 → 428 ms |
| Mobile360×640,4×CPU | 5,154 → 4,866 ms | 4,427 → 4,219 ms | 2,233 → 1,882 ms |

These single profiled localhost samples do not establish device, percentile or
performance-budget acceptance. Desktop is slightly slower. The separate bounded
three-round storage probe shows median object write501.7ms versus string153.1ms
with exact roundtrips; it is not an integrated browser timing. The change is
retained for the measured serialization reduction and passing integrity checks;
BUG592 remains open for remaining startup/inventory/runtime budgets.

The focused14-case save-management/offline-reopen browser run encountered a
separate development boot error and was stopped rather than repeated through
timeouts. [BUG598](../../production/bugs/BUG-598-register-precompile-directory-watches.md)
tracks directory watches being resolved as imports. That interrupted run is not
save correctness evidence. BUG598 is now fixed locally: only the authored
schema-directory watch moves to buildStart;53focused tests and real filesystem
watch edit/failure/repair checks pass. The save plugin's actual HTTP control
passes unchanged. Scoped strict types and lint pass.

The post-fix run passes all10save-management cases but reveals BUG599: an exact
minute assertion observes the last permitted30-second chip projection under a
paused clock. After the exact periodic-save check, ordinary navigation remounts
the chip at the same clock. Only those4affected offline cases are rerun; all pass.
The final union is14distinct passing cases,0remaining failures/skips/flakes.
Full-save/export/same-clock reopen assertions remain exact. This is save-path
verification, not complete performance or full-v1 acceptance.

## Provenance and retention

Authority49 checks2,140inputs, with11implementation/test inputs changed from48;
three additional storage observer/helper files are hashed separately by the
comparison driver. Source hash:
`efd2948569458e464c2292415e852731ab255548d497f8ba73cc49bbb4447537`.
Authored data and the canonical earned70/Normal1314/Hell961/7,413-item save remain
byte-identical. The production build completes in41.019s; all11JS/CSS assets and
760precache URLs pass the unchanged offline cap.24exact emitted assets/maps are
retained as gzip for review. The optional art manifest remains excluded by the
existing precache limit; no dependency or limit changes were made.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Retain `bug592-storage-*`, `bug598-*` and `bug599-*` reports, drivers/configs, original backups, assertion
readback, screenshots, CPU profiles and exact assets; authority49. Comparison
session15604/process3868724 exited0, with no cleanup errors and its exact owned
build/cache paths absent. Root retains the required packet and active worktree
through umbrella review and owns eventual cleanup/release.

Representative current earned recruitment/party economics, Hell income
stability, current14-build fairness/holdouts, retry/manual-idle,30–50active-hour
pacing, integratedG0–G7, two-hour soak and independent review remain before owner
playtest. Accepted balance0; full-v1 remains active. Browser works; CI excluded.

## Closure of this increment

Authority50 rechecks2140primary inputs. Relative to49, only the authored plugin
and the authored/save HTTP regression test files change. Source hash
`37814c32a1a260209b650490dfbf91cafb097c11bc61c44f84b426ec2ae3d5f2`;
data hash remains
`f94fd205da07f4fa8818d38aad5074a97fe7807230bf9c53466faae2f4c6bece`.
The later BUG599E2E edit is outside the primary collection and hashed separately
with its observer/helper inputs in `bug592-storage-closure-v1.json`. The canonical
save SHA256 remains
`92bb1d9c21175dd4ca9120048a43444b59e4cc9ec060ac7d6a56bcdc96326e44`.
Task-owned browser server is terminal; exact storage-E2E cache and focused type
build info are removed. Failure traces and all required evidence stay retained.

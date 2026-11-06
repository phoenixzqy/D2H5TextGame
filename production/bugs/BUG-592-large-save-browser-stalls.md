# BUG-592 — Reduce large-save browser stalls

## Restore-write worker rejected and restored — 2026-11-03

[Recorded result](../../docs/balance/2026-11-03-restore-write-worker-rejected.md):
the serializer-only startup/import write worker regresses matched desktop reload
median from 563.400 to 897.817 ms (59.36% slower), failing the frozen desktop
gate. Reject without a timing retry. All four modified paths were restored to
exact preimages; five new candidate paths were archived and removed. The 214
passing unit cases describe the rejected candidate; its initial scoped types and
lint failed, and no completed mobile comparison or release acceptance exists.

Stopping the exact owned Chromium process triggered an unhandled outstanding
download promise in the driver; Node exited before its final report/finally.
Raw measurements, scripts, screenshots, emitted gzip assets and the explicit
closure remain in the required packet. Both recorded processes are absent;
the exact owned configs/build/cache paths were removed and verified absent.
Closure: `bug592-restore-write-worker-v1-closure.json`. Keep Open. Do not retry
this worker or claim an optimization. Return to gameplay progression work.


## Current serialization trial rejected/restored — 2026-11-03

[Trial result](../../docs/balance/2026-11-03-current-save-serialization-trial.md):
direct serialization improves 35.795651% and all175affected cases/types/lint
pass, but matched mobile production reload regresses3232.380→3825.671ms
(18.354625%). The frozen >=10% improvement gate fails; no timing retry.
All24imports/reloads preserve complete native/public save identity without
browser errors/overflow. Restore exact adapter/storage-test preimages and remove
the two new candidate files; all2151restored production inputs authenticate.
Generic serialization and earlier retained fixes remain unchanged. All24archived
assets authenticate and ten disposable paths are absent; root retains required
`bug592-current-save-stringify-v1` evidence/closure through umbrella review.
Keep Open; this candidate delivers no optimization or release acceptance.

## Current serialization diagnosis — 2026-11-03

One fresh current-source production mobile CPU4 reload preserves the complete
8,540-item native/public save. Exact emitted source maps attribute 836.324 ms of
sampled CPU to `stringifySave`, including the closing-page checkpoint. This is
profiler attribution, not a before/after wall-time comparison. Retained evidence:
`bug592-current-startup-profile-v1{,-readback}.json` in the root packet; owned
build/cache paths are absent and session11949 is terminal0.

The bounded typed-current serialization candidate converted the declared
legacy affix/skill Maps at all current save owners, then use native JSON.stringify
without a whole-tree replacer. Generic arbitrary/historical serialization stays
unchanged. Require byte-exact compact/pretty output, native restore/queue safety,
affected checks/types/lint, >=20% direct serializer reduction and a matched
production browser round with >=10% mobile reload improvement/no >10% desktop
regression. Otherwise restore, without a timing retry. Plan/preimages retained
under `bug592-current-save-stringify-v1`; no campaign or save-format change.
The completed trial above is rejected/restored; these criteria remain its
historical record.

## Current JSON semantic checks deduplicated — 2026-11-03

[Verified change](../../docs/balance/2026-11-03-json-semantic-validation.md)
retains every distinct semantic/schema check while avoiding identical repeated
checks on parser-owned current JSON. Native/historical safety and persistence
remain unchanged. All183affected cases, scoped strict types and explicit lint
pass. Seven alternating complete-decode pairs preserve full-state equality and
reduce median89.785→77.503ms (13.680%). One matched production browser round
preserves the full8540-item native/public save after all imports/reloads in four
contexts; mobile median import951.953→859.390ms and reload2551.062→2365.717ms.
No errors/overflow, active service workers; screenshots inspected. No timing
retry or campaign replay. Mobile long tasks766–804ms keep this issue Open.
Session75588terminal0, exact disposable caches/builds/type-info absent; root
retains required `bug592-json-semantic-once-v1` evidence through umbrella review.

## Current JSON semantic validation diagnosis — 2026-11-03

The parser-owned current JSON path normalizes by identity, yet repeats quest,
campaign reward, socket and charm validation after the nonmutating schema on
that same tree. Root owns one bounded deduplication: retain all raw semantic
checks and the schema, validate legacy quarantine once, then return that same
validated JSON tree. Native/historical inputs retain both representation checks.
No public trust option, save-format change, result cache or persistence change.
Frozen plan/backups: retained packet `bug592-json-semantic-once-v1-plan.json`.
Require exact valid/error parity, affected boundary/consumer checks, scoped
strict types/lint, seven alternating complete-decode pairs (at least10% median
reduction) and one matched production desktop/mobile import/reload round. No
campaign replay or timing retry. The measured candidate is now retained above;
the broader issue remains open.

## Native interaction accounting — 2026-11-03

Readback of twelve retained traces separates browser EventTiming from the
Playwright click-to-two-frames measurement. Current release mobile interaction
median is 117.973 ms (three CPU4 samples), versus 252.925 ms automation wall
time; desktop is 45.099 ms versus 109.268 ms. The two measures have different
boundaries; their difference is not a causal overhead decomposition. Click
processing remains 42–45 ms and critical tasks remain 74–79 ms.

Evidence: retained packet `bug592-native-event-accounting-v1.json`, with exact
trace receipts, one-to-one native click matches and reconciled event components.
No browser replay, source change or threshold revision occurred. These local
events do not establish field INP, p95, representative device or release
acceptance. Pagination and offscreen rendering remain rejected. Keep this issue
open for startup, validation/reload and broader runtime budgets; further transfer
work needs a measured product cause rather than the automation wall time alone.

## Mobile pagination rejected/restored — 2026-11-03

[Result](../../docs/balance/2026-11-03-mobile-pagination-trial.md): functional
checks pass, but median274.451→240.180ms improves only12.487%, remains above
200ms and has78/97/80mslong tasks. No timing retry. Restore exact page-hook/test
bytes and only InventoryScreen's page-size block; retain separately verified
BUG632focus fix. Final28affected cases/types/lint and two-context production
focus/save check pass. Keep Open; no release/performance acceptance.


## Offscreen rendering trial rejected — 2026-11-03

[Trial result](../../docs/balance/2026-11-03-inventory-offscreen-rendering-trial.md):
the CSS candidate passes 34 affected cases/scoped types/lint and desktop browser
checks, but fails the mobile offscreen accessibility-tree assertion. The frozen
acceptance rule therefore rejects it. Restore only BackpackGrid to its exact
pre-candidate bytes; all 2,151 production inputs now match the retained production
baseline. No timing retries: the original desktop result is reused, one mobile
measurement exists, and the other two are not run after the correctness failure.
No median improvement or issue closure follows. Earlier retained fixes remain.
All consumers terminal and exact disposable configs/build/cache paths absent;
root retains `bug592-offscreen-cells-v4-closure.json` through umbrella review.

## Current production diagnosis — 2026-11-03

Fresh current-source development and default production browser checks each pass
all four contexts: complete public/native saves, retained card identity, counts,
localized previews, final-page reachability and no console errors/overflow.
Production mobile CPU4 transfer median is 252.925 ms, with 74–79 ms long tasks;
desktop is 109.268 ms. Development and production are separate diagnostics,
not an optimization comparison. Production source matches the fresh development
authority exactly. Required evidence is retained in the root packet under
`bug592-current-trace-v1-*` and `bug592-release-transfer-v1-*`.

Production timeline readback excludes profiler startup and avoids nested event
double counting within categories. Critical tasks are 74.509–79.587 ms, with
42.453–45.455 ms click dispatch, repeated layout/style work and 9.630–10.488 ms
final prepaint; subsequent paint unions are 36.539–45.977 ms. Source maps show
bulk counts take about 7–9 ms and no single application function dominates.
All 100 page cards retain rendered subtrees although only a few fit on mobile.

Root owns one bounded offscreen-cell rendering trial: browser-managed
`content-visibility: auto` on existing square cells, preserving DOM, aspect ratio,
keys, focus, tooltips and all save behavior. External frozen plan and exact
source backup: `bug592-offscreen-cells-v1-plan.json` / `-before.tsx`.
Require affected checks, exact geometry/offscreen keyboard/accessibility checks
and one matched production round; adopt only with at least 10% mobile median
transfer and longest-task reduction and no more than 10% desktop regression.
Otherwise restore exact prior bytes. The trial above is now rejected/restored;
this diagnosis and prospective criteria remain as its historical record.

## Latest correction — single-pass bulk-discard counts

[Verified correction](../../docs/balance/2026-11-03-bulk-discard-counts.md) removes
four count-only candidate arrays and redundant backpack scans while sharing the
exact selection predicate. Five RED count cases precede the fix; all 35 affected
cases, scoped strict types and explicit lint pass. Four browser contexts preserve
complete native/public saves and card identity, independently checked counts and
localized previews, with no overflow/errors. Mobile transfer median improves
246.584 to 228.272 ms (7.426%); desktop 120.201 to 118.762 ms. One candidate round,
retained baseline, no timing retries. Mobile long tasks 93–117 ms keep this issue
open. Exactly four declared source/test paths change; gameplay data is unchanged.
All recorded processes are terminal and owned disposable caches absent. Root
retains `bug592-bulk-counts-v1-closure.json` through umbrella review. No campaign
or balance acceptance follows.

## Bulk discard count diagnosis — 2026-11-03

The latest retained crafting-subscription profile attributes 25.386 ms inclusive
to BulkDiscardToolbar, of which 19.728 ms is selector work. Across all three
mobile profiles the selectors consume 19.480–19.817 ms: four array-producing
backpack scans compute only button counts. Root owns a single-pass pure summary
sharing the exact tier predicate with the real selection. Unique/set protection,
ring rules, pending preview, live props, locale and native discard validation
stay required. Frozen plan: retained packet `bug592-bulk-counts-v1-plan.json`.
Current 2,147 source inputs authenticate; retained timing baseline predates only
the separately verified nine CE paths. No performance gain or acceptance claimed
before affected checks and one matched candidate browser round. No campaign or
closed combat family is reopened.

## Earlier correction — crafting gear subscriptions

[Action-specific subscriptions](../../docs/balance/2026-11-03-crafting-subscriptions.md)
are implemented and retained. Material-only recipes no longer subscribe to
gear; target actions subscribe to their actual containers. All54distinct affected
cases have passing evidence, with final scoped types/lint. The single matched
browser round preserves complete native/public saves and card identity in all
four contexts. Mobile median291.562→246.584ms improves15.427%; desktop
116.473→120.201ms stays within the frozen10% tolerance. Baseline is reused;
no timing retries. All2147source inputs authenticate, exactly the declared two
source/test paths change, gameplay data unchanged. Processes terminal, owned
caches absent. Root retains `bug592-crafting-subscriptions-v1-closure.json`
through umbrella review. Mobile long tasks114–118ms and broader release/device
budgets keep BUG592 open. No campaign or balance acceptance follows.

Latest increment, 2026-11-03: [cell comparison ownership](../../docs/balance/2026-11-03-inventory-cell-comparisons.md)
is retained. A stable complete comparison callback and per-cell memo avoid
recomparing every visible badge on a transfer. Both locale regressions reproduce
before the fix; all28 affected UI cases, scoped types/lint and four exact
public/native browser save-transfer checks pass. Mobile median improves
337.195→291.562 ms (13.533%); desktop125.432→116.473 ms (7.142%). Mobile longest
tasks remain125–136 ms; this issue remains open. No baseline replay or timing
retry. All owned processes terminal and exact caches absent. Closure retained
through umbrella review: `bug592-cell-comparison-v1-closure.json`.

Latest increment, 2026-11-03: [unchanged item cells](../../docs/balance/2026-11-03-inventory-item-cells.md)
is retained. Memoized occupied cells preserve current props/locale and reduce
profiled mobile transfer median 433.043→337.195 ms (22.134%); desktop
171.059→125.432 ms. All 23 affected UI cases, scoped types/lint and four complete
public/native save-transfer checks pass. Mobile longest tasks remain
171–188 ms, so this issue stays open. Original baseline reused; no combat or
campaign replay. Exact owned caches absent; root retains required evidence
through umbrella review in `bug592-item-cells-v1-closure.json`.

Status: input and paging stalls reduced in working tree (uncommitted); initial opening, validation/reload and runtime performance remain open. Severity: Medium.
Owner: frontend-dev / performance-analyst; root next implementation.



## Occupied cell render ownership diagnosis — 2026-11-03

The retained gear-ownership mobile0 CPU profile attributes49.213ms inclusive
to Tooltip during a single transfer. Unique keys retain DOM identity, but the
grid still rebuilds every unchanged occupied card/Tooltip after an earlier item
leaves. Root owns the bounded two-file change: move the occupied subtree into
a component with React.memo's default complete props comparison, primitive
selection/upgrade flags and its own translation subscription. Preserve all
current item/callback/locale updates, keys, capacity and action validation.
Frozen plan: retained packet `bug592-item-cells-v1-plan.json`; baseline all2,147
source inputs authenticate. Add the before-fix render regression, run affected
grid/pagination checks and exactly one matched four-context real-tooltip
browser comparison. No performance gain or acceptance claimed yet.

## Gear subscription ownership corrected locally — 2026-11-03

[Measured correction](../../docs/balance/2026-11-03-inventory-gear-ownership.md):
gear state is owned below the stable global panel elements; quest receipts and
act-unlock inputs now explicitly refresh the quest panel. Six bilingual failures
become green; all30affected component cases, scoped strict types and explicit
lint pass. Four real-tooltip contexts preserve complete native/public saves and
card identity. Mobile transfer median937.327→433.043ms (53.800% improvement),
desktop203.831→171.059ms. Original baseline reused; exactly4source/test paths
change among2,147authenticated inputs, gameplay data unchanged. No query or
validation caching, action-boundary or serialization change. Longest mobile tasks
277/284/297ms keep this issue open; development samples do not accept release
budgets. All processes terminal and exact owned caches absent. Root retains
`bug592-gear-ownership-v1-closure.json` evidence through umbrella review and owns
eventual cleanup/release. No combat/training/campaign or CE allowance consumed.

## Gear subscription ownership diagnosis — 2026-11-03

The retained mobile transfer profile attributes 147.196 ms inclusive to
QuestItemsPanel. InventoryScreen still subscribes to backpack, stash, equipped
and player above all four global panel elements, causing fresh quest validation
on every gear transfer despite quest queries not reading gear. Move those
subscriptions into InventoryGear. Materials/crafting/quarantine already own
their inputs; explicitly subscribe QuestItemsPanel to its receipt and act-unlock
inputs as well as existing ledger/progress, so no incidental gear refresh is
needed. Reproduce gear-only redundant validation and missing receipt/unlock
refresh before the source fix; keep action-boundary validation unchanged.
Frozen plan: retained packet `bug592-gear-ownership-v1-plan.json`; baseline
stable-card browser evidence and all 2,147 production hashes authenticate.
No improvement or acceptance is claimed until scoped checks and one matched
four-context browser comparison finish. No combat or CE-family budget consumed.

## Counted reader duplicate-load diagnosis — 2026-11-03

The retained stable-card mobile0 CPU profile attributes 93.295 ms inclusive to
allCountedQuestCounters across two renders. Each read validates the full live
ledger, but independently loads the same counted metadata before that validation
and again inside it (roughly 10–11 ms per loader invocation at 4× CPU). The next
local candidate returns the freshly validated metadata from the ledger query;
no catalog survives the synchronous read, and native/historical save validation
keeps its existing defaults. Exact counters, full graph guards and in-place
mutation/accessor refusal remain required. Frozen plan and original source
snapshots: retained packet `bug592-counted-reader-v1-plan.json`. No timing
improvement or fix selection is claimed before scoped checks and one browser
comparison.

## Inventory card identity corrected locally — 2026-11-03

[Measured correction](../../docs/balance/2026-11-03-inventory-card-identity.md):
occupied keys now use unique item IDs, preserving retained cards/tooltips after
earlier transfers. Two regressions fail before the fix; all19affected grid/paging
cases, scoped types and explicit lint pass afterward. Four real-tooltip browser
contexts preserve surviving DOM identity and complete native/public save state.
Mobile transfer median1126.659→937.327ms (16.805% improvement); desktop
242.460→203.831ms. Retained baseline reused, no extra campaigns or training.
Localhost diagnostics only; mobile longest tasks392–412ms keep this issue open.
Source/data provenance and exact cache cleanup pass; no live task process.
Evidence uses `bug592-stable-cards-v1-closure.json` in the retained root-owned
packet. Independent umbrella review and final performance acceptance remain.

## Inventory card identity diagnosis — 2026-11-03

Reproduced before the production edit on `feat/playable-foundations`, HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus accumulated local changes.
Owner: frontend-dev. Deterministic React/jsdom reproduction is locale-independent;
the pending runtime check uses Chromium, en/1280×800 and zh-CN/360×640.

1. Render three unique inventory items and focus the second card.
2. Remove an earlier item, or move the focused item to another array position.
3. Check that the retained logical item still owns the same focused DOM button.

Expected: unaffected item identity/focus survives and subsequent props/click
selection remain current. Actual: both regression cases fail DOM identity;
the originally focused card is unmounted. `BackpackGrid.tsx` includes the array
index in occupied item keys, so a preceding transfer remounts every following
card/Tooltip on that page. Native ownership already requires unique item IDs.
Use those IDs with a prefix distinct from empty-slot keys; retain ordinary prop
updates and all parent quest/save validation.

Evidence: retained packet `bug592-stable-cards-v1-red.json` has two actual failed
assertions and seven cases excluded by the name filter (its aggregate passed
count misclassifies those exclusions). The first external-config launch found
no tests; explicitly supplying the existing workspace produced the real RED.
Plan/source snapshots use `bug592-stable-cards-v1-plan.json`; baseline production
hashes all 2,147 match before edits. Browser timing and complete native/public
save checks are pending. This diagnosed identity defect does not close BUG592's
broader runtime budgets or establish a browser timing improvement.

## Latest increment — parser-owned current JSON, 2026-11-02

Current JSON import/load avoids redundant native graph scanning and Map copying;
all semantic/schema checks, restoration and historical/native-object guards stay.
207 affected cases, scoped strict types/lint and purity pass. Matched production
browser builds preserve the complete 8,540-item save across all 24 public
import/reload operations and exports, with no errors or overflow. Import medians
improve desktop 468→293 ms and mobile 1360→957 ms; mobile reload 3447→2494 ms,
desktop reload 768→825 ms. Three observations per operation on a shared host do
not accept performance budgets; long tasks remain. Keep BUG592 open.
Authority73 changes five source/test inputs from72; gameplay data and107campaign
inputs stay exact. Drivers terminal, exact owned disposables/profile absent;
required evidence retained. [Report](../../docs/balance/2026-11-02-parser-owned-save-json.md).

## Latest increment — objective schema dispatch, 2026-11-02

The schema validates only the payload union selected by the required known type;
all closed leaves and same-tag variants remain exact.394affected tests and
two independent corpora pass; actual generated validators match all1,013targeted
cases in each locale. Complete8,540-item native/public saves remain exact.
Mobile first opening2356→1750ms/warm median1149→1052ms; desktop roughly unchanged.
Development diagnostics only; long tasks remain and this bug stays open.
Authority70 verifies2,141production/106unchanged campaign inputs; only the
objective schema changes from69. [Report](../../docs/balance/2026-11-02-quest-objective-dispatch.md).

## Previous increment — quest-recovery batching, 2026-11-02

Recovery statuses now share one fresh catalog/full delivery-ledger query per
list; action-boundary revalidation remains. 165 affected cases, scoped strict
types/lint and exact complete native/public desktop/mobile save checks pass.
Mobile first opening2090→1482ms; warm median1108→1086ms. Desktop is roughly
unchanged. One profiled first opening and five warm openings per profile are
development diagnostics; no release budget acceptance. Authority58 verifies
2,141 inputs with exactly six changed quest/inventory source/test files from57;
data and canonical successor unchanged. Exact owned caches absent, drivers
terminal. Keep BUG592 open. [Report](../../docs/balance/2026-11-02-inventory-recovery-batching.md).

## Previous increment — single-pass counted validation, 2026-11-02

The full ledger validator now owns counted graph validation, removing the direct
duplicate while preserving fresh descriptor/definition/full-ledger checks each
read. 182 affected cases, scoped strict types/lint and desktop/mobile browser
roundtrips pass. Mobile isolated reader median improves 37→28 ms, but profiled
first opening stays ~2.1 s; no material whole-opening improvement is claimed.
Authority55 independently verifies 2,141 source inputs; data/canonical successor
unchanged. Exact owned caches absent and consumers terminal. Keep BUG592 open.
[Report](../../docs/balance/2026-11-02-counted-single-pass-validation.md).

## Latest increment — inventory render scope, 2026-11-02

Local paging/selection no longer rerenders global material/crafting/quest panels;
existing subscriptions and gear-driven refreshes stay live. 66 affected cases,
scoped strict types/lint and real Chromium desktop/en plus mobile/zh checks pass.
Five warm first/last-page pairs improve mobile medians 666→463/516→296 ms and
longest-task medians 506→311/374→155 ms. Public/native full 8,540-item save equality
passes, boundary pages/final item reachable, no errors or overflow. Intermediate
pages were not individually observed. Initial opening remains ~2.1 s mobile;
keep this bug open. Localhost/dev/4×CPU diagnostics do not accept release budgets.
[Report](../../docs/balance/2026-11-02-inventory-render-scope.md). Authority54 changes
only inventory screen/test from52; data/canonical successor unchanged. Exact
owned caches/profile absent and consumers terminal; required evidence retained.

## Rejected experiment — worker loading, 2026-11-02

The worker candidate passes178affected cases, scoped types/lint and exact online
save roundtrips, but desktop reload median regresses781.011→1453.264ms (86%).
Longest task313→299ms improves only~4%; JSgzip grows574,682bytes. Reject the
candidate before more mobile/packaging experiments. Every application candidate
file is restored, temporary modules removed, all2141authority52inputs rehashed.
The missing offline Blob download event is a harness failure, not evidence of
save corruption. No mobile comparison was run. Exact owned caches are absent and
consumers terminal. Keep BUG592 open; resume runtime/balance work instead of
another speculative save rewrite. Retained closure:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/bug592-worker-closure-v1.json`.

## Latest increment — single-pass live export, 2026-11-02

Live export removes compact stringify→parse→pretty stringify by calling the
existing serializer once. Nine alternating warm Node pairs on the actual8,235-item
earned save show92.493→57.208ms median with exact output; candidate actual-store
check also passes.87affected persistence cases, scoped strict types and lint pass.
Desktop/en and mobile/zh native byte-exact import/export/field/Save/reload pass,
zero page/console errors or overflow. These are dev functional checks and Node
screening, not production browser performance acceptance; keep this bug open.
[Report](../../docs/balance/2026-11-02-single-pass-save-export.md). Authority52
changes only two persistence.ts lines from51; data/canonical saves unchanged.
No campaigns or unrelated suite replay. All consumers terminal; exact owned
caches/typeinfo absent, evidence retained by root through umbrella review.

## Latest increment — current-save validation, 2026-11-02

The current33 decode path removes one redundant graph scan while preserving the
full validator, historical migrations and unchanged restoration. All164affected
cases pass, plus scoped types/lint/purity. Complete desktop/mobile production
public roundtrips remain exact. Desktop reload2,199→1,788ms; mobile4×CPU
7,682→7,580ms, with mobile import4,579→5,259ms slower. Single samples do not
accept budgets; keep this bug open. [Report](../../docs/balance/2026-11-02-current-save-validation.md).
Authority48; only validator/test changed. No campaign/unrelated replay.

## Latest increment — static policy precompilation, 2026-11-02

The registry now covers40all-errors schemas plus one first-error reset schema.
Twenty-two callers retain original compiler options, metadata/errors, secondary
guards and SSR behavior. All472distinct affected cases across23files pass;
scoped strict types, explicit lint and engine purity pass. Actual configured
edit/failure/repair checks cover both generated caches, with manually delivered
watch/HMR events and no listening sockets. No campaign/unrelated replay.

[Report](../../docs/balance/2026-11-02-startup-policy-precompilation.md). The first candidate
run regresses versus the older sample; a focused same-session retained-v8/v9
comparison gives desktop reload1,422.543 → 1,203.432ms and mobile
6,354.931 → 5,821.779ms, longest tasks456 → 431ms and
2324 → 2200ms. These remain localhost diagnostics, not performance acceptance.
Complete7413-item public/native roundtrips remain exact; one startup read,
activatedSW, no errors/overflow. Gzip adds22800bytes;760precacheURLs/all11assets
fit unchanged cap.29exact emitted assets are archived before disposable cleanup.

Authority47/decision67/handoff21/index20 supersede previous pointers. Exactly27
implementation/config/test inputs differ from46; all2139inputs rechecked, authored
JSON/schema and canonical earned save unchanged. Accepted balance0/full-v1 active.
Startup/storage/inventory/runtime, representative economics/recruitment,14-build
fairness/holdouts, defeat/retry/manual-idle,30–50active-hour pacing and integrated
G0–G7/soak/independent review remain before owner playtest. Next address measured
save snapshot/storage and validation costs; reload includes pagehide checkpoints.
Jobs terminal; exact build/cache/type-info outputs absent. Root retains required
packet/worktree and owns cleanup/release. Browser works; CI excluded; no question
or external blocker.

## Latest increment — remaining startup data schemas, 2026-11-02

Authority46 routes ten further unchanged static data schemas through existing
build-time precompilation. All175distinct affected cases have passing evidence;
scoped types/lint pass. Production mobile4×CPU reload5804.651→5378.240ms and
longest task2511→1967ms; import2361.469→2626.949ms is slower. Desktop reload
1389.312→1319.343ms. Both complete7413-item public/native roundtrips remain exact.
These are single profiled localhost diagnostics; this bug and performance budgets
remain open. [Report](../../docs/balance/2026-11-02-startup-leaf-precompilation.md).

## Reproduction

Source authority31, production hash
`54a6edd4b2ad85292259f976ceb107292df0582e2aad89871f9de6d81eaa9f55`;
HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`. Chromium147.0.7727.15,
WSL, desktop1280×800/en and360×640/zh-CN with4×CPU throttling.

1. Open Settings in an isolated browser context. Use the genuine earned70,
   Hell961 export from `p15-earned-hell-level70-act5-defense-income-v1.json`.
   It has7413backpack items and7,533,133UTF8export bytes. No fake items/grants.
2. Open Import Save and paste the native exportedJSON using clipboard/keyboard.
3. Import, export, navigate inventory, reach page75/final13items; save/reload.
   Timings use a fixed Date only; performance/normal browser timers keep running.

## Expected

Large/legacy over-cap saves remain recoverable through ordinary UI, with usable
input, paging and feedback (P03b/G1/G5). Rendering/input should avoid multi-second
main-thread stalls. No item deletion, capacity bypass or weakened save validation.

## Actual

Functional checks pass: both full import/export and save/reload/export equal the
known earned source, with only the declared desktop locale change. Final item
is accessible,100cards/page (13on last), no horizontal overflow or page errors.

Desktop paste8.628s, longest task5.681s; import1.980s/longest1.035s;
reload3.436s; first/last inventory page0.538/0.420s.
4×CPU mobile paste38.868s/longest25.622s; import11.504s/longest5.460s;
reload10.441s; first/last page2.727/2.335s, tasks0.835/0.842s.
These are single-run dev-server action-to-visible wall metrics including
transport overhead, not physical-device Web Vitals or acceptance percentiles.

IndexedDB usage586156bytes in each isolated context. End-of-run JS heaps are
115.05MBdesktop/109.94MBmobile. CDP node counts include detached/internal nodes;
a high count alone is not evidence of a leak. The measured document stays
bounded by pagination. Storage quota and current save sizes do not prove a soak.

## Evidence and next action

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`p15-earned-hell961-browser-profile-v2.mjs`, `.json`, `.run.log`, per-profile
screenshots. Each browser context/server is closed and owned cache removed.
V1's oversized Playwright fill timeout is retained as a diagnostic failure;
v2uses real clipboard paste and does not infer a game failure from that timeout.

Profile the input/import/reload/paging paths separately. A native JSON file
import path can avoid rendering megabytes into the textarea while retaining the
same transactional decoder/persistence behavior. Confirm the bottleneck before
implementation; keep pasted-text compatibility and full graph validation. Do
not replay combat, repeat the passed paste baseline without new cause, or discard
protected items to obtain a faster result. Workaround: wait for import and use
paging; the measured state remains recoverable. No user answer is required.

## Input fix and focused validation — 2026-11-02

`SaveImportDialog` intercepts large clipboard pastes before native textarea
insertion. It retains the full selected/replaced text, displays a compact backup
selection, and requires explicit Import. Small text remains editable. Native file
selection prepares the same full text without inserting JSON into the document.
Both paths call the existing transactional `importIntoStores`; no decoder,
ownership check, save format, item, currency or admission behavior changes.
Cancel/source changes are disabled during file reads/import, and a failed file
read can be retried without invoking the importer. Closing releases prepared text.

Focused TDD: the valid RED run has 2 ordinary-input passes and 12 expected
feature failures. The GREEN run passes 25 distinct cases across the new bilingual
import suite (14) and existing Settings suite (11). The final 14-case rerun passes
after test typing corrections; strict scoped types and explicit lint pass.
Initial unsupported-matcher/type-setup failures remain diagnostic evidence and
are excluded from acceptance counts. No engine or unrelated suite was rerun.

Real Chromium verification uses the unchanged earned Hell961 export. Desktop
file input and mobile large clipboard input both preserve the entire known save
in IndexedDB and public export. Both show a bounded preparation panel, a usable
confirmation target and no horizontal overflow or page errors. The isolated
copies are discarded; the canonical earned successor remains unchanged.

At the same 4×CPU mobile setting, paste preparation falls from 38.868 seconds
(longest task 25.622 seconds) to 0.280 seconds (longest task 0.185 seconds).
The new native import step is 2.892 seconds with CPU profiling enabled. Desktop
file import is 0.680 seconds; its 1.531-second automated file-selection step
includes Playwright's binary file transport and is not a physical disk benchmark.

Remaining: import validation, cold reload and visible inventory rendering. CPU
profiles attribute most sampled application import work to `decodeSave` and its
native validation. No graph check was weakened; the profile includes idle/native
program samples and cannot be treated as an exact phase stopwatch. Inventory
first-page CPU capture is retained for separate analysis. Do not replay the
passed paste baseline without new code or a new concern.

Evidence packet: `bug592-input-red-v2.json`, `bug592-input-green-v1.json`,
`bug592-input-green-v2.json`, `bug592-input-types-v3.log`,
`bug592-input-lint-v2.log`, `bug592-browser-input-v1.json`, its driver,
prepared-panel screenshots and four `.cpuprofile` files. Full report:
`docs/balance/2026-11-02-large-save-input.md`.

## Inventory diagnosis — 2026-11-02

The retained mobile inventory CPU profile attributes 707 ms of inclusive
application samples to `QuestItemsPanel` and 506 ms to `countedQuestCounters`.
These rows overlap and must not be added. Source inspection confirms the panel
loads all five counted definitions, then each singular counter independently
reloads definitions and validates the same complete live graph. The next fix
batches the counter projection under one complete validation per read, without
reusing a validation across reads or altering any action/transaction guard.

## Counter batching and measured inventory recovery — 2026-11-02

`allCountedQuestCounters` validates the complete live graph once for the full
inventory list. It keeps fresh validation on every read, zeroes all projected
counts on invalid state, and does not change individual counters, transactions,
reward behavior or any native save check. The bilingual RED proves five checks
per render;69 distinct affected cases now pass, with scoped strict types/lint.
BUG593 separately records the stale 10-wishstone test expectation found by the
existing flows. No unrelated/campaign suite is replayed.

Real native save readback/export remains exact on desktop1280×800/en and
mobile360×640/zh-CN at4×CPU. First page retains100cards and the final page13
with the exact last earned item; no horizontal overflow or page/console errors.
The earned counter list is correctly empty; mixed owned/consumed counter states
are covered by the separate native-domain/UI tests rather than fake save grants.

Retained authority32 versus new capture: mobile first-page wall2.563→2.200s;
longest task732→282ms; sampled inclusive QuestItemsPanel707→274ms and counted
projection506→103ms. Desktop first-page615→524ms. These single-run development
diagnostics include profiling/automation overhead; overlapping inclusive rows
cannot be added. Remaining2.2s inventory work, native validation and reload keep
BUG592 partially open. The next profile targets redundant definition loading in
assembly status and visible inventory comparison/rendering.

Details: `docs/balance/2026-11-02-inventory-counter-batching.md`. Packet stems:
`bug592-counter-*`, `bug592-browser-counters-v1*`. All task processes are terminal,
the task Vite cache is absent, and root retains required evidence for umbrella
review with eventual cleanup ownership.

## Native descriptor-inspection diagnosis — 2026-11-02

The retained mobile import CPU capture attributes723ms of inclusive application
samples to `rejectSocketSaveAccessors`, versus1917ms to decoding overall. The
guard constructs a bulk descriptor map for each inspected object, then allocates
a second key list over that map. An alternating12-pair warm Node experiment on
the unchanged exact earned export compares the current guard with direct own
descriptor inspection: medians104.90ms versus50.21ms per complete check. No
production code is changed by that probe; browser/native-save safety evidence
is still required. Keep every own/inherited/nonenumerable/symbol/Map/Set/cycle
check and preserve disappearing-proxy-key behavior of descriptor enumeration.
Evidence: `bug592-descriptor-probe-v1.json` and `bug592-descriptor-plan-v1.json`.

## Native descriptor allocation fix — 2026-11-02

The full recursive guard now reads each own descriptor directly, avoiding a
bulk descriptor map per node. Inherited/nonenumerable/symbol/Map/Set checks,
aliases/cycles and every caller remain intact. Absent proxy descriptors retain
the original built-in enumeration behavior; there is no cross-call trust cache.
RED:13 safety passes plus the303-map resource failure. GREEN:122 affected cases
across4suites, final14-case guard rerun, scoped strict types/lint and engine purity.

Native earned-save browser import/export and flushed save/reload/export are
exact on desktop1280×800/en and mobile360×640/zh-CN at4×CPU. Mobile import
2.892→2.428s; sampled inclusive descriptor inspection723→376ms and decode
1917→1525ms. Desktop import680→593ms. These single-run development diagnostics
include profiling/automation overhead; overlapping inclusive samples cannot be
added. Failed locale-autosave/initial-language harness runs remain diagnostics
and are excluded from acceptance. No campaign, paste or inventory replay.

Cold reload is still3.394s desktop/9.915s mobile, now explicitly gated on hydration
ready. Vendor code-generation/parsing, native normalization/validation/storage
and remaining inventory work keep BUG592 partially open. Do not compare reload
percentages across differing readiness endpoints. No schema/version/reward/data
or combat change, no canonical checkpoint mutation, no new grants/admissions.

Report: `docs/balance/2026-11-02-native-save-descriptor-performance.md`. Packet
stems `bug592-descriptor-*` and `bug592-browser-descriptors-*` include the raw
profiles, source freeze, failures and exact native/public readbacks. All processes
are terminal; exact task caches absent. Root retains the active worktree and
required evidence for full-v1/review and owns eventual cleanup.

## Cold schema-startup diagnosis — 2026-11-02

The existing v3 cold mobile reload profile attributes about 1,956 ms of vendor
leaf samples to the first shared skill-schema compilation, plus 298 ms to
materials, 226 ms to quests and 173 ms to socket-effect initialization. These
are sampled callsite attributions, not additive phase stopwatches. Skill
compilation is already cached; this is first-use work, not repeated rows.

Optimizer-off and inlineRefs:false probes retain admissions/errors but increase
normal validation cost about 32–33%; neither is applied. A standalone ESM probe
preserves 287 authored rows and all errors for 1,148 rejected mutations, with
unchanged compiler options, but its approximately 2.31 MB minified single module
exceeds the current 2 MiB precache limit. It is not integrated or accepted.

Four independent, identically configured Ajv2020 instances currently compile
seven schemas across skills/materials/quests/socket effects. A six-pair warm
Node probe measures 722.8 ms versus 637.9 ms median for one shared compiler,
with equal errors; browser proof remains required. Next reuse that strict
compiler setup through a private instance and narrow typed functions, retaining
all per-input validations and per-function errors. Keep the separately
configured native-save validator and all other loader options unchanged.

## Candidate results — 2026-11-02

No schema-startup runtime edit is retained. Shared setup passes383 affected
checks and both exact native browser roundtrips but changes cold reload from
3.394→3.289s desktop and9.915→9.982s4×CPU mobile. Selected vendor CPU is nearly
unchanged (2671.765→2653.084ms). Candidate source is archived; only its own
changes are removed, and the complete authority34 manifest is restored exactly.
[Investigation](../../docs/balance/2026-11-02-schema-startup-investigation.md)
records all four alternatives, limits and rejected-source evidence. Startup
remains open; next work returns to the missing F07 recruitment contract in
BUG594. No new combat, reward or accepted balance cell occurs.

## Recipe-list diagnosis — 2026-11-02

A current authority37 first/last-inventory-only baseline preserves the complete
7,413-item earned save through public native import (32→33 migration), export
and IndexedDB. Chromium mobile360×640/zh at4×CPU records2.298s first-page wall,
354ms longest task; desktop first page433ms. Current sampled inclusive panel
CPU is340ms, with129ms in assembly-status checks and243ms in quest-item loading
across callers. Inclusive rows overlap. The two displayed consumed recipes each
reload the entire validated item graph twice even though their definitions and
exact source receipts were just read by the panel.

Plan: share one fresh definitions read and lazy quest read across visible recipe
statuses, retaining singular/action API behavior and every transactional guard.
Do not introduce a cross-read validation cache. Add a resource regression with
actual recovered Staff inputs plus fresh-state/authoring checks. Compare only
the affected earned inventory path; no campaign/recruitment/paste/reload replay.
Packet: `bug592-browser-quest-baseline-v1*`, `bug592-quest-batch-plan-v1.json`.
Root-cause and plan review: ready. Security check: pass; local read projection,
no caller-supplied trusted context, dependency, save-format or network change.

## Recipe batching measured — 2026-11-02

The list now shares one fresh definition read and lazy quest lookups, using the
same private status derivation as the singular API. Action preflight/full-ledger/
transaction/publication guards are unchanged.89 actual affected assertions and
three type-corrected fixture reruns pass; global types/scoped lint pass.

Current mobile first-page wall2.298→2.082s; longest task354→231ms; inclusive panel
CPU339→183ms. Desktop panel67→43ms, but wall433→578ms. These are single-run
development diagnostics, not uniform speedup/acceptance percentiles. All7,413
items and complete migrated save remain exact through public native browser
import/export and storage. No campaign or unrelated suite is replayed.

Raw final-page comparison is not accepted because the candidate's added panel
screenshot changes starting scroll. Oversized element captures are clipped by
the application scroll container and do not certify a complete visual audit.
Remaining inventory/storage/startup work keeps BUG592 open. Details and limits:
`docs/balance/2026-11-02-inventory-recipe-batching.md`. Authority38 and packet
`bug592-quest-list-final-v1.json` record retained state and exact cleanup.

## Save existence diagnosis — 2026-11-02

Authority38 baseline on the unchanged earned save reproduces eight full native
IndexedDB gets for eight boolean `hasSave()` checks. Each costs32–56msdesktop
and135–158ms4×CPU mobile; Settings startup performs two full native gets before
ready. Baseline reload3.454sdesktop/10.337smobile, including CPU profiling.
`hasSave()` deserializes the entire record, and initialization separately loads
it again. The existing validated `loadSave()` already returns null for no record.

Proposed root fix: count the exact primary key for Home existence checks; let
startup use its one ordinary validated load to handle both present/empty storage.
Keep offline reconciliation, durable-before-publication ordering, empty damaged
runtime recovery, write queue and all decoder checks. Focused RED resource
checks precede the change. Retain `bug592-browser-existence-v1-baseline` and
`bug592-save-existence` evidence in the ongoing packet. Schema loop/reference
screenings remain rejected diagnostics; no schema/compiler change is retained.

## Save existence fix and verification — 2026-11-02

`save-adapter.hasSave()` now counts the exact primary key; `initializePersistence`
uses its one nullable validated load instead of a separate existence preflight.
No data/schema/save-version/decoder, offline or write/publication guard changes.
Two resource REDs precede the fix. Final158distinct affected cases, global strict
types and scoped lint pass. Two stale read-delay fixtures are corrected to gate
the sole read while retaining import/delete ordering and unpublished-player checks.

Native desktop/en and mobile/zh preserve the entire7,413-item save through public
import, explicit Save/reload/export and migration33. Actual native value reads
for eight existence checks8→0; startup2→1. Median check32→1msdesktop/137→2msmobile.
Reload3.454→3.488sdesktop/10.337→10.073smobile, single profiled dev-server samples;
no uniform startup speedup or budget acceptance. No page/console errors/overflow.
Independent Python readback checks all2,130inputs, exact source/data/canonical
identity, assertions and cleanup. Authority39 is current. Full cold-start/runtime/
storage performance and BUG592 remain open.

Full report: `docs/balance/2026-11-02-save-existence-performance.md`. Required
packet stems `bug592-save-existence-*` and `bug592-browser-existence-*`; exact
caches/tsbuildinfo/config modules absent, owned jobs terminal. Root retains source/
evidence through full-v1/umbrella review. Rejected schema screens are evidence,
not production changes. No completed campaign or unaffected suite is replayed.

## Save-normalization allocation diagnosis — 2026-11-02

Authority39 mobile reload profile samples786.9ms inclusive in `normalizeMaps`.
The full graph copy creates a second property-entry tuple array for every object,
plus callbacks for arrays and Map entry pairs. A bounded12-pair warm Node screen
on the exact7,413-item earned export measures41.861→35.139ms for intrinsic entry
snapshot copying followed by in-place normalization of the fresh own fields.
This remains diagnostic until native/browser verification. Keep the complete
clone, raw descriptor checks, all schemas/migrations and ownership guards; no
validation cache or schema-option change. Slower descriptor-copy and modest
null-prototype alternatives are rejected before browser replay. The next focused
resource RED detects per-item mapped property-entry arrays at the public native
validator boundary. Evidence: `bug592-normalization-probe-v1/v2/v3*` in the retained
packet. Referenced-rule schema probesv2/v3 remain refused under strictRequired;
no compiler or schema change is retained.

## Normalization candidate rejected; attribution corrected — 2026-11-02

The focused RED detects100 extra property-entry arrays for100items. The candidate
passes181 affected cases and exact native/public browser roundtrips, but does
not materially improve the4×CPU mobile reload:10.073→10.703s, or normalization
samples:155.261→154.847ms. Desktop normalization samples39.337→26.373ms do not
establish a mobile benefit. The earlier786.9ms attribution double-counts recursive
ancestors. Count each profiler sample once per function family: the correct
authority39 mobile costs are155.261ms normalization,339.268ms descriptor inspection
and2001.229ms skill compilation. Inclusive function costs still overlap and cannot
be summed. The raw candidate and test are archived, and only this task's edits
are removed; authority39's complete2,130-input source manifest is restored exactly.
The rejected test also has two lint issues; the scoped-type configuration omitted
Vite declarations. Neither result is represented as passing final validation.
No failed candidate remains in the game. Production-bundle startup measurement is
next, because all prior reload diagnostics include development-server overhead.

## Production startup baseline — 2026-11-02

After correcting the driver's inherited development NODE_ENV, the actual default
minified production build passes bridge exclusion and757-entry precache checks.
Ordinary earned file import/Save/reload/export and IndexedDB retain the complete
migrated33 save/all7,413items in desktop/en and mobile/zh at4×CPU. Both are SW
controlled and have no browser errors/overflow. Public saved-character reload
2.076sdesktop/8.398smobile and longest tasks1.151/5.087s confirm the remaining
stall. Exact source-map attribution counts each sample once per source: mobile
skill compilation2.013s, save validator1.362s, save adapter2.424s (overlapping).
No percentile/device/soak acceptance or runtime optimization is claimed.

Full report: `docs/balance/2026-11-02-production-startup-baseline.md`. The exact
emitted JS/CSS/source maps/worker/HTML are retained compressed in the packet's
`bug592-production-startup-v2-profile-assets/`; disposable build/cache outputs
are removed. Authority39 remains exact/current; authority40 is rejected candidate
only. BUG592 remains open; next target the measured startup compilation cost.

## Build-time skill-validator diagnosis and plan — 2026-11-02

Production source-map profile confirms2.013s first shared skill compilation on
mobile4×CPU. Full default Ajv standalone generation preserves strict/allErrors
but exceeds the existing2MiB precache cap. Sharing only generated five-field
error-object constructors produces1,996,108minified bytes, with exact admissions
and complete errors for1,444cases. Warm full-catalog validation adds a small cost;
production/browser tradeoff remains unaccepted. No schema or compiler option is
weakened. Vite Node generation, an explicit standalone chunk, schema watch
invalidation and direct generated-code tests are the next bounded implementation.
Existing installed/locked esbuild becomes an explicit dev dependency without any
install. Plan/root security review is ready/pass; independent sign-off remains
open. Evidence: `bug592-standalone-size-probe-v1*`, `bug592-standalone-errors-probe-v1/v2*`
and `bug592-precompile-plan-v1.json` in the retained packet.

## Browser skill precompilation verified — 2026-11-02

The browser imports the strict/full standalone validator generated on Node; SSR
keeps its existing compiler. Exact generated error literals are shared to fit
the unchanged 2 MiB precache cap. The emitted chunk is 1,986,809 bytes / 148,343
gzip; all 758 actual precache URLs and nine application assets pass. No engine
source, data/schema, save version/migration or graph validation is weakened.

Five distinct affected tests and 1,444 generated-code input comparisons pass,
with final scoped strict types/lint. A separate hook probe passes schema-change
regeneration, invalid-schema rejection/no stale fallback and HMR repair recovery.
A retained v1 probe failure is a missing harness hook context, corrected in v2;
filesystem watcher event delivery is not claimed. No unrelated/campaign replay.

Matched production desktop reload 2.076→1.591s and mobile 4×CPU 8.398→6.609s;
longest tasks 1.151→0.673s and 5.087→3.129s. All 7,413 items and the complete
migrated save remain exact through native public import/Save/reload/export.
Both screenshots are inspected; no errors/overflow, one startup read, activated
SW and no bridge. These are single-run localhost diagnostics, not device/budget
acceptance. Remaining save/storage/runtime work keeps BUG592 open. Details:
`docs/balance/2026-11-02-skill-validator-precompilation.md`. Authority41 and
`bug592-precompile-final-v1.json` pin current source and retained evidence.

## Static authored-schema precompilation plan — 2026-11-02

Authority41's retained production profile still contains 2.929s unique mobile
compiler samples. A bounded actual Node import/decode trace identifies quests,
recruitment and adjacent catalogs as remaining static compilation costs; Node
values are diagnostic, not browser acceptance. Move their ten unchanged schemas
into a small shared registry and delegate only compilation through a browser/SSR
factory. SSR retains the original caller Ajv/options; browser generation uses
those same strict/allErrors options and complete schemas/errors. Keep all loader
integrity checks and native save/history code unchanged. Verify exact generated
behavior and one matched production comparison; no campaign replay. Root plan
review ready/security pass; `bug592-authored-plan-v1.json` records scope and cleanup.

## Static catalog precompilation verified — 2026-11-02

Ten unchanged schemas now compile on Node for browsers, through an explicit
registry/factory; six loaders preserve original SSR Ajv/options and all secondary
checks.422distinct affected assertions,754catalog input comparisons, configured
Vite schema/registry invalidation/failure/repair and final scoped types/lint pass.
No authored JSON/schema, engine/store, save-format/migration or reward change.

Matched production desktop reload1.591→1.426s and mobile4×CPU6.609→5.919s;
longest tasks673→500ms and3129→2340ms. Import is slightly slower in these single
samples. Full public/native migrated-save identity and all7,413items remain
exact; no browser errors/overflow, one startup read, activatedSW, no bridge.
The637,105-byte/46,068gzip chunk fits the unchanged precache cap;759URLs/allten
application assets pass. Existing warning thresholds remain unchanged.

The harness initially rejects the intended TypeScript edits in its data hash;
v5 separately verifies all authored JSON unchanged and records the correct new
source/data-tree hash. Raw failure is retained, no failed output accepted. Exact
production code/maps are archived and disposable outputs removed. Authority42
and `bug592-authored-final-v1.json` pin the final state. Full startup/storage/
runtime budgets keep BUG592 open. Details:
`docs/balance/2026-11-02-authored-catalog-precompilation.md`.

## Selected save schemas — 2026-11-02

Three exact assembled schemas now precompile for browsers with original Draft07
options; other histories/SSR retain lazy compilation and all native guards stay.
Production public import760.814→588.615ms desktop,3181.768→2361.469ms mobile4×CPU.
Reload improves only slightly (1426.102→1389.312ms/5918.844→5804.651ms), with longest
tasks increasing500→558ms/2340→2511ms; performance acceptance remains open. Complete
public/native roundtrips preserve all7,413items. Five new cases/2,283input comparisons,
41rich-save comparisons, exact schema hashes, scoped types/lint and configured
edit/failure/repair/no-socket probe pass. Seven pre-existing test assumptions match
the retained original and are tracked in BUG596. The nested loader explicitly uses
ws:false after an excluded partial candidate exposed an unwanted WebSocket listener.

[Report](../../docs/balance/2026-11-02-save-validator-precompilation.md). Authority44,
closure bug592-save-final-v1.json; exact emitted assets archived, disposables absent.
Continue native startup/storage/runtime budgets and final acceptance; this import
benefit does not close BUG592 or the full-v1 objective.


## JSON storage increment — 2026-11-02

[Evidence](../../docs/balance/2026-11-02-json-save-storage.md), ADR018: immutable
JSON physical envelope replaces clone/native object writes while retaining legacy
reads, native Map restoration, snapshot isolation and queue/failure semantics.
Logical33/IndexedDB1 unchanged.344distinct affected tests, scoped types/lint/
purity pass. Four complete7413-item production roundtrips remain exact. Profiled
mobile reload5154→4866ms/import4427→4219ms/longest2233→1882ms; desktop
reload1186→1264ms/import665→700ms. One localhost sample/context is not budget
acceptance. Retain the change for measured serialization reduction and integrity;
this issue remains Open for remaining startup/inventory/runtime budgets.

Development boot BUG598and paused-chip test timing BUG599are fixed locally.
53focused precompile cases and actual filesystem edit/failure/repair pass. The
final targeted browser union is14passing cases: reuse10save-management passes
and rerun only4offline cases after test correction. No campaigns or unrelated
suites rerun. Authority50/canonical save exact; exact caches/typeinfo removed.


## Per-validation quest catalog diagnosis — 2026-11-02

Retained authority49 mobile startup profile attributes277.771ms inclusive to
quest loading and128.959ms to counted-source loading (overlapping, not additive).
Current native validation resolves the same live authored catalogs separately
for its raw and normalized graph checks. Share their successful resolutions only
inside one private native-validation call, preserving both checks, every loader
guard and fresh validation on the next public request. No global trust cache,
source mutation, frozen-domain or logical/physical save-format change. Plan and
exact source snapshots: `bug592-quest-catalogs-v1-plan.json` in the retained packet.

## Quest catalog reuse rejected — 2026-11-02

The proposed candidate improves complete native decode by only0.27% and slows
the measured mobile production reload median2831.252→3466.220ms (22.43%).
Reject it; both validator files are restored byte-for-byte to authority52.
194affected candidate cases, scoped types/lint/purity and four exact browser
roundtrips pass, but do not establish performance acceptance. All2141accepted
manifest inputs are restored; no authority53 is created by this experiment.
Exact disposable build/cache/type-info outputs are absent; rejected source and
required diagnostics remain in the packet. BUG592 remains Open.
[Decision and measurement limits](../../docs/balance/2026-11-02-quest-catalog-reuse-rejected.md).


## 2026-11-03 — Materials refresh candidate rejected and restored

[Measured result](../../docs/balance/2026-11-03-material-refresh-rejected.md): the memo
candidate removes unrelated MaterialsPanel rendering but mobile transfer median
1126.659→1131.632 ms fails the fixed improvement rule. No source optimization is
retained; all2147baseline production hashes restored. Eight complete independent
public/native transfer checks,18affected tests,scoped types/unignored lint pass.
All processes terminal/owned caches absent. No combat/admissions or campaign
advancement; CE family allowance unchanged. Required evidence uses
`bug592-material-refresh-v1-closure.json` in the retained root-owned packet.
Previous turn status-only/no progress. Next investigate measured serialization
and quest-validation cost; BUG592 open, privatev1 incomplete,ActV13/19,formal0/210.
Root retains human2/packet through umbrella review and owns eventual release.


### 2026-11-03 — Scalar dispatch candidate rejected

The primitive fast-path candidate passed27affected tests, scoped types/lint and
four exact browser transfer checks, but mobile median1126.659→1175.280ms failed
the fixed improvement rule. Original source and all2147baseline hashes restored;
no performance acceptance. All consumers terminal/owned caches absent. See
[report](../../docs/balance/2026-11-03-scalar-dispatch-rejected.md). Raw evidence
and exact rejected source remain in the root-owned packet indexed by
`bug592-scalar-dispatch-v1-closure.json` through umbrella review. BUG592 stays open.


## Counted-reader candidate rejected — 2026-11-03

The fresh-within-query definition-sharing candidate passes 293 affected cases,
corrected fixture/types/lint and four complete UI/native save checks. Its mobile
median 937.327→1015.112 ms (+8.30%) fails the frozen improvement rule; desktop
203.831→196.412 ms does not override that failure. All four files and all 2,147
baseline inputs are restored exactly, retaining the selected inventory-card fix.
No timing retry, campaign advancement or CE allowance change. Process exited 0,
owned caches absent. BUG592 remains open. See
[decision and limitations](../../docs/balance/2026-11-03-counted-reader-rejected.md).


## Mobile page rendering correction planned — 2026-11-03

Current production transfer evidence (`bug592-release-transfer-v1-production.json`)
shows 100 mounted cards / 1,282 DOM nodes on 360×640: mobile CPU4 transfer median
252.925ms, long tasks74–79ms. The retained trace attributes material cost to
layout/prepaint/paint as well as dispatch; only a few rows fit the mobile view.
The rejected offscreen-CSS candidate remains restored because it failed AX checks.

Use the existing explicit localized pager with20cards below768px,100otherwise.
Every owned item remains reachable; resize must keep a selected item (or the
previous first visible item) in the new page. Preserve independent tab pages,
selection, full collection counts, bulk operations and complete saves.
Freeze one matched baseline/candidate production comparison, affected pagination/
focus checks and scoped types/lint before adoption. See retained
`bug592-mobile-pages-v1-plan.json`; security pass/plan ready/root self-review.
Do not interpret this slice as closing startup/import or all BUG592 budgets.

# Ordinary native material-source accounting — 2026-10-28 UTC

Status: bounded measurement helper implemented; local validation passed.
This is a prerequisite for source-mix measurement, not earned acquisition,
affordability, pacing or private-v1 acceptance.

## Measurement contract

`tests/sim/production/material-source-report.ts` observes actual synchronous
`rollKillRewards`, `rollDrops` and `rollCurrencyDrops` imports with temporary
passthrough spies. Each original is called once with its original arguments and
receiver; the exact result object returns to its caller. Original references
and detached snapshots are distinct. There are no rerolls, allocator resets,
extra RNG draws, rate changes, reward-path changes or save/UI changes.

The native context is derived from the matching published binding and original
recording before advance: actual slain nonsummon metadata, captured profile,
act, TC, area, wave and actual logical payout identity. This slice supports
ordinary kills only. Find Item, endgame caches and quest projections are refused;
extra/unobserved contributions fail reconciliation. It does not independently
measure those sources. Export-bypassing lexical `rollBatchRewards` calls are
explicitly unscoped and refused rather than silently attributed.

Per-kill concrete TC rune/gem rows plus actual independent materials must equal
the actual kill-result material bag. Their total must equal both raw payout and
actual before/after inventory delta. Catalog identity, positive safe counts,
sums, expected kill metadata/count, boundary completeness, opening continuity
and duplicate source/result identity are checked before atomic journal updates.
First refusal, nonwin or mismatch stops further credit and retains the accepted
prefix plus exact rejected observations. Exceptions retain detached bounded
name/message/cause details; original exceptions remain in the capture.

Opening stock has unknown provenance. Signed spending and exact 3:1 fusion are
recorded as refusals with their actual signed delta, never random income.
Repeated logical payout identity permits only zero delta and no new source calls.
All reports say `kind=constructed-ordinary-kill-control`,
`highRuneEarned=false` and `activeHourAcceptance=false`.

## Constructed controls and limits

The fixed-seed Normal Act I Blood Moor first-wave control uses an explicitly
constructed finisher and seven opening Zod runes of unknown provenance. Native
start, original playback and settlement observe eight slain trash enemies,
zero TC/independent materials and zero actual material grant. A second early
advance on the newly installed next wave returns `idle`, yielding no new calls
or credit. This is not a native replay/publication-identity test.

A separately labeled constructed direct `awardLootForVictory` boss grant uses
the authored Act I TC and declared seed 42. Its actual returned material bag and
inventory delta are +1 Ith and +1 flawed amethyst, both from the independent
source; TC materials are zero. The test does not synthesize the after inventory.
This positive store-grant check is not recorded playback, campaign progress or
earned acquisition. Another deterministic actual generator fixture exercises
positive TC (two El) plus guaranteed independent boss material income.

The unobserved/observed generator comparison uses independent RNG instances
with seed 42 and deterministic test pools. All five RNG-method call/result
traces and following values agree. Exact argument/result references are tested.
Only newly allocated top-level `Item.id` is omitted from the explicitly semantic
payload comparison. Raw IDs remain in stdout: `it-8ijhu-1` versus `it-8ijhu-2`,
with the expected one-step allocator advance and no reset. Both following RNG
values are `0.6247446539346129`.

Further controls cover missing-TC independent-only acceptance, malformed/unsafe
stock, per-kill and metadata mismatch, missing/orphan/duplicate boundaries,
source overflow, raw/inventory/opening drift, nonwin, unsupported Find Item,
duplicate payout, signed fusion, detached snapshots, overlapping observation,
preexisting spy ownership, and exception restoration.

## Validation and evidence

All final checks returned native exit 0 on 5,346 identical inputs at SHA256
`8b062eaed6309dde96fe7daeb3b80960ec68ead12d4cd140e98e093c6bb3dbe0`;
each complete before/after input map is identical. Source hashes are:

- Helper: `84d3dd95905e1aac812991164011b694ca80b2355fd523fb691ff9986af1b229`.
- Tests: `6689b146c67372d0dafb3004858ec3c29547fd6aa0fece37f338f669c4f0cc34`.

| Check / tool session | Actual result | Runner elapsed |
| --- | --- | --- |
| Frozen focused / 29959 | 27 passed, one file | 8.552 s |
| Related / 88785 | 40 passed, three files | 11.381 s |
| Unfiltered full / 68545 | 21,222 passed, two existing skips, 992 files | 936.437 s |
| Typecheck / 88504 | native 0, no diagnostics | 111.054 s |
| Lint / 50285 | native 0; engine purity and zero-warning ESLint | 203.355 s |

Full-suite Vitest duration is 931.07 s; runner wall time includes its bookkeeping.
Assertion-level statuses, rather than Vitest 1.6 JSON top-level counts, supply
those totals. No failed/pending/todo assertion is reported. The unchanged skips
are the opt-in Rocky Waste continuation in `fresh-campaign-continuation.test.ts`
and authenticated farming policy in `fresh-campaign-economy.test.ts`; neither
receives acceptance credit. Actual local runtime is Node 24.21.0/npm 11.19.0,
not CI's Node 20. No build/browser run is needed for this test-only slice.

`terminal-input-verification.json` binds all five final checks and source hashes.
`control-observations.json` retains parsed source/noninterference/native-control
stdout bound to its frozen focused log. The initial structural RED and later
expanded tests do not form an identical-whole-file behavioral RED/GREEN pair.
The exception-detail assertion itself is unchanged across its failing/passing
repair. Independent terminal review approves the raw results, maps, controls and this
report. Its retained `terminal-review.json` SHA256 is
`5866a62e552d44f15ed721f48e54300d775120cb352efe2f563b58e7487e5831`.

Root-owned raw packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-material-sources-aidf3vkg`.
`run-validation.py` retains actual native exits, raw JSON/logs and before/after
all-input maps. `checkpoint-inputs.json` binds the two implementation files.
Initial missing-module RED has no assertion-level behavioral credit. Initial
implementation native-view guard failure and typecheck annotation errors remain
preserved. The diagnostic assertion then failed as intended before the bounded
exception-detail repair; no product defect or timeout change was involved.

Plan review SHA256:
`742ba8acafd0e2cb871326343165193490f52fd45b50a690716add25637621e1`.
Implementation v2 review SHA256:
`3bc3b42ead73e95b72d6856d920b4dec0effa97560264747d7d17c01b012097b`.

## Remaining work and retention

Actual high-rune earning/source mix, affordability and human active-hour pacing
remain open. Genuine acquisition still requires a separate legitimate,
nonprotected authenticated fresh lineage and finite reviewed policy. No
protected save or prohibited ancestor was opened, modified or replayed, and
no historical acquisition policy was resumed. Future Find Item/cache accounting
needs separately reviewed buckets rather than treating this helper as complete.

BUG304/180/354/355/356/357/358/359 stay Open; the skill inventory remains
212 bounded plus one unverified Cobra. H3 remains terminal failed-no-app with
no retry/new browser card. The 14-build/five-act campaign, defeat/fresh retry,
whole-app locale/device/a11y/performance/PWA, actual CI, human acceptance and
soak/full-v1 gates remain unfinished. No publication, merge or deployment.

No build/coverage output or task-owned server was created. After application
and reader release, the two exact scratch Markdown drafts were removed and
absence verified; cleanup failures are empty. `cleanup-receipt.json` records
their paths/hashes. Root retains the
exact raw maps/results/logs, executed runner and independent reviews through
unfinished goal/review consumers, and owns eventual verified cleanup. Worktree
claim and umbrella implementation goal remain active.

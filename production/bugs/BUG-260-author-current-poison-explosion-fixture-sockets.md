# BUG-260 — Author current socket metadata in the PE browser fixture

Status: fixed in `761fa2f1`. Severity: Medium.
Owner:root sole author, QA fixture responsibility. Date:2026-10-26.

## Reproduction and observed result

Baseline05732820 plus the two new PE public paths; official production build
and bridge scan pass. Chromium desktop1280×800, English, isolated IndexedDB,
fixedDate2026-10-21T12:00:00.055Z; the failure precedes any combat seed or run.

1. Create a fresh Necromancer through ordinary controls and export version22.
2. Submit the test's explicitly syntheticL18/points/survival-cap fixture using
   the real Import Save dialog. The new equipped cap omits socketCapacity.
3. Wait for successful import to close the dialog.

Expected: the acceptance fixture must meet the current native save contract.
Actual: dialog remains open, so one test fails and three do not run; exit1 in
16.528s. No combat/PE or earned progression outcome is established. Exact
submitted payload is extracted from the retained Playwright trace.

`effectiveSocketCapacity` in src/engine/save/historical-sockets.ts requires
native gear to carry its own safe integer capacity. The fixture supplies none;
zero is legal for this unsocketed cap. Verify the exact payload using the real
public decoder with and without only that field before changing the fixture.
Do not relax validation or alter combat, HP/MP, ranks, encounter or test limits.

## Evidence

Root owns public-browser-initial.log/result, public-initial-report.json,
failure screenshot/snapshot/trace, rejected-import-payload.json and the minimal
native-decoder probe under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-poison-explosion-public-rt94uggx`.
Original log SHA256:
`aac925981b6240a2cfac6638421eb4b8a22111e2981390006016541521e61338`.
Root retains failures through PE/full-v1 readers, then owns lossless retention/
read-back and exact disposable cleanup. No delegation or genuine campaign action.

## Exact diagnosis and bounded correction

The real public decoder rejects the exact captured payload and accepts the
identical payload with only head.socketCapacity=0 added:2/2 probe cases pass
in5.302s. The failure screenshot was individually inspected; it shows the
still-open import dialog and unchanged level1 character, not a combat outcome.
The new browser fixture receives only the required zero-capacity field. No
source validator, HP/MP, affix value, rank, encounter, clock or test limit changes.
Original payload/spec, trace and probe remain retained. The corrected fixture
imports in all four final production cases, which pass4/4 in137.842s. The
intermediate corrected-socket batch proceeds into actual combat but fails the
separate observer assumption recorded in BUG261. Neither failure is a pass.
See [public evidence](../../docs/plans/evidence/d06-poison-explosion-public.md).

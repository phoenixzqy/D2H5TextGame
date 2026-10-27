# BUG-326 — Bind Blood Raven's objective to its canonical encounter

Status: Fixed locally; canonical native source and ordered Talk verified.
Severity: High — the authored quest's first objective cannot complete normally.
Owner: content-designer / root quest integrator.
Affected systems: authored quest data, qualified combat settlement, ordered Talk.

## Reproduction

Integration base `276101d4f5b9fe2ff4183d0079a23c4eb22c1e65`.
Vitest1.6.1 / Node24.21.0 / jsdom; browser viewport and locale are not involved
in this native-store integration case. Seed7, challenge ordinal0. Constructed
strong wiring equipment is explicitly synthetic, not earned power/balance proof.

1. Track actual `quests/act1-sisters-burial-grounds` with both objectives false.
2. Enter canonical `areas/act1-burial-grounds` through `startSubAreaRun`.
3. Play and settle every native wave. Verify the original Blood Raven is dead
   and native final settlement accepts `victory`.
4. Inspect the tracked kill objective, then attempt the ordered Kashya return.

Expected: canonical qualified kill sets `obj-kill-blood-raven` true; later Kashya
Talk completes the quest without automatic Claim or reward.
Actual: the kill objective remains false, so ordered Talk cannot advance.

Root cause: `src/data/quests/main.json` binds the objective to legacy
`areas/act1_burial_grounds` / `monsters/blood_raven`, which cannot match the
canonical production settlement's area/archetype. Exact matching is correct;
repair authorship instead of loosening the shared qualified-kill boundary.

## Evidence and bounds

`src/stores/blood-raven-quest.test.ts` produces one causal failure/five passing
controls, after native victory and before any data patch. Raw log, receipt and
input hashes are in the root-owned continuing task directory
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-blood-raven-objective-py73of_m`.
No gameplay save is promoted or genuine action replayed. Keep the existing
quest/objective IDs, six-area access and Act II gate. Trainee Claim support is
a separate reviewed child; correcting this source binding alone does not close
the entire quest or establish ordinary browser/earned acceptance.

## Correction and verification

The bounded repair passes488 focused tests/seven files, full20001 tests/946
files with two existing opt-in skips, types, lint and production build. Four
ordinary en/zh-CN mobile/desktop browser cases earn the native kill, perform
ordered Talk and explicit Claim, and preserve exact Save-close-Continue state.
Independent final source/test review approves. Constructed strength proves
functionality rather than earned balance or pacing.

Original failures and final receipts are retained after verified archive/readback
and exact disposable cleanup; see
[repair evidence](../../docs/plans/evidence/p14-blood-raven-quest-repair.md).
The raw root mentioned above is now absent; its sibling `.evidence.tar.gz`,
`.manifest.json` and `.retention.json` are root-owned through independent/full-v1
consumers. No historical credit, genuine save promotion or external publication.

## First GREEN run: constructed fixture correction

After the exact two-ID repair, all native kill and ordered Talk assertions pass.
The final export validation then rejects the deliberately constructed cap because
it omitted the current native `socketCapacity` field. The first GREEN log is
retained as `focused-green.log`:487 passing/one failing case across seven files.
This is a test-fixture defect exposed after the original failure, not a reason
to loosen production save validation. Correct only this synthetic cap to explicit
zero capacity, keep all behavioral assertions and rerun. No earned save is changed.

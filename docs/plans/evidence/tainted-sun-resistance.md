# Permanent Tainted Sun resistance

2026-10-23. Source base `3516cf2`.
[Contract](../decisions/D11-tainted-sun-resistance-v1.md).
This completes the independently accepted Sun reward implementation; it does
not establish an Act II victory, C2 or full-v1 acceptance.
C0/C1 retain their historical narrow acceptance. C2 is underway; C3/C4 and
full G0–G7 remain open. Local only.

Explicit Claim now grants the existing4500 hero XP plus the JSON-authored
permanent +30 fire/+30 cold resistance points. The canonical own completed,
claimed altar row is the entitlement. Shared pure equipment composition uses
explicit character progress across progression, equipment comparisons, combat
entry, later waves and current-configuration replay. Recomposition does not
heal or compound the bonus; recorded locked replay keeps its baseline.

Claim validates the closed reward shape and safe prospective post-XP stats
before writes, publishes the final composed player inside the rollback boundary,
and marks the quest claimed last. Unsupported historical stat rewards remain
unsupported. Narrow decoding repairs only fire/cold caches for qualified claimed
Sun rows using the supplied save's own gear and quest map. No new save field or
version, XP backfill, automatic Claim or cross-character entitlement is added.

## Validation

- Final full unit: **9143tests/306files PASS**,183.58s,exit0.
- Final engine: **4364tests/113files PASS**,31.88s,exit0.
- Final typecheck, lint, clean production build and four-chunk bridge scan PASS.
  `git diff --check` passes. The full-suite duration exceeds the documented15s
  target; the engine run also exceeds its3s target.
- Production browser: **2/2 PASS**,en/zh-CN,93.086s,retry0,skipped0,flaky0,
  unexpected0,report errors[],pageErrors[]. No test bridge or combat launch.
- Frozen645 source/config,760 build,4 harness and1 earned input hashes match
  after browser execution:drift[],added[]. All source files are included.

Causal failures preceded implementation: six engine failures, seven Claim
failures with one control, nine genuine integration failures among15 cases,
and two localized UI failures among26 cases. Two early integration attempts used
invalid store test APIs; those failed attempts remain diagnostic evidence, not
valid causal proof. The corrected integration RED uses real playerTeam,
advanceEvent and outcome.winner APIs. Focused439tests/6files passed before the
full suite. Existing Claim fixtures were corrected to credit the actual altar
objective, rather than unrelated Den objectives.

Initial typecheck found readonly writes and an optional hired-merc identity;
both were corrected. Initial lint failed with2errors/14warnings. Unknown-value
record guards preserve malformed-data handling; explicit required-fixture
checks remove non-null assertions. Null-row/objective negatives also pass.
Earlier review wording suggesting lint completion did not establish a lint pass;
only the final `lint-after-lint.log` is passing. Final unit/type/lint/build were
rerun after these changes, with independent source approval renewed.

The first browser run was interrupted with exit130 after detecting an obsolete
index chunk retained by an external output-directory rebuild. Its partial
diagnostics are preserved under `interrupted-stale-build/`. No campaign was
launched. A clean `--emptyOutDir` build produced the final760-file/four-chunk
packet; the complete two-locale proof above uses that packet.

## Ordinary noncombat production proof

Input is the exact earned pre-entry
[`staff-inserted.json.gz`](fixtures/staff-inserted.json.gz),
SHA256 `7323e45c7ef0acafc10278e132c5897d07f7d09b25af3e8c2c0190f3b7ef06dd`.
It has no Sun progress row. Initial native import/export and IndexedDB equality
are exact before choosing the proof's display language.

Ordinary Start creates only tracked progress. Lost City Inspect changes only
location; keyboard Destroy completes the altar objective without rewards.
The completed/unclaimed state survives Save→close→new-page Continue unchanged.
Explicit keyboard Claim then grants exactly4500 hero XP,3375 fielded-merc XP,
+30 fire,+30 cold and the claimed flag. This input does not level either actor.
Whole-save comparisons exclude every other change: all4057 prior gear
identities/properties/order/allocation, current pools, points and other receipts
remain exact. Claimed Save→close→Continue is exact and duplicate Claim is inert.

A separately labeled constructed legacy cache changes only paid fire/cold back
to zero. Import repairs it to the exact paid save. Paid→initial→paid imports
prove idempotence and entitlement isolation, followed by a third exact
Save→close→Continue barrier. Both locales cover360×640,412×915,640×360,
1280×800,1920×1080,44px Destroy/Close/Claim controls and no document overflow.
Reward preview and claimed feedback are readable and localized.

Versioned exact deliverables:

- [`sun-completed-unclaimed.json.gz`](fixtures/sun-completed-unclaimed.json.gz)
- [`sun-claimed.json.gz`](fixtures/sun-claimed.json.gz)
- [`sun-reward.spec.ts.txt`](fixtures/sun-reward.spec.ts.txt)

`fixture-copies.json` in the raw root records matching source/destination hashes.
The raw root also retains both locales' initial/completed/paid saves, separately
constructed legacy inputs, screenshots, assertions and browser reports.

Independent QA source review APPROVE/security PASS; the lint correction also
received renewed QA-SUN-SOURCE APPROVE. Producer browser preflight READY/security
PASS. Final QA-SUN-EVIDENCE and PRODUCER-SUN-EVIDENCE both APPROVE/security PASS:
both independently reconstruct complete save deltas and verify fixture hashes,
frozen packets, logs and screenshots. No material findings; all readers released.

Raw evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-tainted-sun-31icm_i8`.
Root owns required diagnostics through Sun/C2/umbrella consumers and removes
them after those consumers finish. After readers released, exact task-owned
`dist`, `browser-output` and `interrupted-stale-build/browser-output` were removed;
the optional task-local `cache` was absent. Both final and interrupted output
diagnostics were preserved before removal. All tracked command sessions are
terminal, all six known browser/server PIDs are absent and preview port34573 is
closed. `cleanup.json` verifies remaining[]/failures[]; `artifact-inventory.json`
names retained evidence. No shared caches or pre-existing build paths were removed.

Next: remove the two nonexistent Canyon unlock metadata references while
preserving compact Act II access and the existing Act III quest-or-boss-clear
predicate, then continue a separately approved fresh-current-runtime campaign
screening. All stopped historical challenges remain final.

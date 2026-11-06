# First boss-entry provenance

2026-11-03. Owner: root. The campaign recorder now retains the earliest native
chapter-boss entry together with its acquisition costs. This supports intended
build fixtures; it does not accept a balance cell. Formal acceptance stays
**0/210**, and BUG-611/BUG-592 remain open.

## Behavior and limits

`tests/campaign/native-runner.ts` captures both farming and route entries after
paid preparation and before native combat admission. Each entry binds the exact
export, initial save, actual build/configuration, policy, and acquisition prefix
with SHA-256 hashes. The report retains successful admission identities and
explicit flee boundaries. Combat/farming/route/nonwin time, admissions, played
waves, material/currency expenditure, and prefix economy reconciliation are
recorded. Menu/decision time remains uncalibrated (`decisionAdjustedMs: null`).

The earliest entry stays retained even if it is expensive, fails, or precedes
quest activation. Retries and pre-Claim checkpoints cannot replace it. A
recorder failure stops before admission and retains the entry in the failed
report. These evidence classifications do not change game eligibility.

Inputs with incomplete history, earlier boss admission/victory, future-act or
replay progress, nonfresh origin, inactive/mismatched boss quest, malformed
export, modified/historical profile, or unreconciled earned state require review.
An otherwise eligible entry is only a **prospective candidate**. Consumers must
join its save hash, ordinal and area to the subsequent native admission and
review its complete source/lineage before using it as a fixture.

The versioned policy uses existing cumulative act-completion centers plus 25%
as combat-only upper ceilings: 22.5/54/99/135/180 million ms for Acts I–V.
These are necessary completion bounds, not evidence that first-entry power is
typical, affordable, appropriately leveled, or balanced. No acceptance target was
changed. Historical pre-Claim saves cannot automatically serve as first attempts.

## Focused verification and review

The initial integration reproduction reached combat before first-entry
recording, failing with `Combat admitted before first-entry recording` instead
of the deliberate `First-entry disk full` error. The implementation reverses
that ordering. The original RED remains in the tool transcript.

Final results: **24 constructed provenance cases and 8 focused integration
cases passed**, with scoped strict TypeScript and explicit ESLint checks passing.
The integration command selected relevant names; 59 other assertions were
excluded by that filter. Its JSON aggregate counter reports 67 passed, so that
counter must not be used as the executed assertion count.

Four stale Act II expectations in the first broader affected run omitted the
existing `carriedRouteAttempts: 0` field. Their expectations were corrected and
rerun; the audit implementation was unchanged. Initial failures and corrections
remain retained. Constructed cases and mocked runner integration are functional
evidence, not earned gameplay or balance evidence.

Root performed a focused five-axis self-review using the repository
`code-review-and-quality` skill: retention/failure ordering and history/cost
accounting match the stated boundary; configuration is copied; native export
decoding and economy checks remain explicit; changes stay in diagnostic code;
history scans occur only at the five chapter boundaries. No blocking finding
remained. This is not independent reviewer/QA sign-off. No gameplay build,
browser run, unrelated test suite, or combat replay was needed for this change.

## Evidence custody

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Retain `p15-first-entry-v1-{green,wiring,binding-check,cases-final,integration-final}.json`,
initial/final type and lint logs, the source manifest, memory-only freeze script,
and `p15-first-entry-v1-tsconfig.input-archive`. The disposable scoped
`p15-first-entry-v1-tsconfig.json` was removed and its absence verified.

Source tree SHA-256:
`8bf6b59060bf9920a8f97a7fa0cc5236780c43938816ce81fdf315b9cdf315a0`.
Of 2,149 production/provenance inputs, only `vitest.campaign.workspace.ts`
changed. Gameplay source/data remain unchanged; data SHA-256 is
`af2ae1854b43064e83d3ed93b11fded4f9eef8cc7f3070131193e40bc656e445`.
The campaign manifest grows from 125 to 128 inputs. It records seven changed
campaign paths: actions, native runner, dispatch/budget regressions, and the
three new first-entry policy/recorder/regression files.

Existing functional and gameplay evidence remains reusable with that provenance
distinction. The genuine Act V continuation remains final Eve Claim/next1658,
SHA-256 `74d41e2b3a95172f244c2b34b50096b16835ba18190a6a4062b19240623f50c1`.
Root retains the worktree and required evidence through umbrella review and owns
eventual cleanup/release. Next work is representative earned first-entry
acquisition evidence, followed by intended-build exploration/tuning/holdouts.


## Earned Act I sample and canonical metadata correction

The first earned sample is now independently reconciled: hero12/CE5,
first Catacombs entry108 after307played waves/3,057,484.313combatms. Eleven stat
and14skill allocations and native economy/custody reconcile. The exact retained
export joins original admission108/seed958288104 and subsequent six-wave victory.
SHA256: `6ff17b5e17c7768dc7af62023ffedaac95ad9b86515b26239733f4d0dc110ae1`.
The fixed policy retains all failures and acquisition expense; one history with
Torch of Iros/set drops does not establish typicality, affordability or pacing.

[BUG620](../../production/bugs/BUG-620-first-entry-metadata-hash-roundtrip.md)
corrects the metadata origin to existing lossless canonical `hashObservation`,
with `metadataHashFormat: observation-json-v1`. All25first-entry regressions,
scoped strict types and explicit lint pass; the initial ignored lint invocation
is retained but does not count. Exact native-export byte hashing is unchanged.
The earlier sample retains its noncanonical metadata; its original raw native
bytes and independent journal reconciliation are the authentication evidence.
The source successor changes exactly the recorder and regression test among128
campaign paths; all2149production/provenance inputs and gameplay/data remain exact.
No replay was needed to repair serialization. Retain `p15-first-entry-hash-v2`
and `p15-first-entry-corpse-act1-v1` evidence/reader versions in the root packet.
Both disposable scoped tsconfigs are absent. One failed initial reader expected
identical dirty-state lists; the only difference was this documentation file
created during the native run. The versioned correction verifies that exact
addition and unchanged production/campaign manifests, without repeating gameplay.

The subsequent [100-seed whole-area screen](2026-11-03-corpse-act1-first-entry-screen.md)
now reconciles98wins/two boss draws,600waves and100complete exports from the same
first-entry fixture. It exposes a high win rate while boss median timing is in
band. Formal0/210, acquisition typicality and the full private-v1 scope stay open.

# BUG-712 — Avoid repeated empty runeword searches in socket validation

- **Status:** Locally resolved — focused semantic/save checks and frozen comparison pass; broader runtime acceptance remains open.
- **Severity:** Low; save loading works, but repeated catalog searches add cost.
- **Owner:** Root / engine developer; F21 runtime performance and G6 persistence.
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local changes.
- **Environment:** WSL/Linux, Node/Vite SSR. Browser, viewport and locale are
  not exercised by this pure validation profile. RNG seed is not applicable.

## Reproduction

1. Read the retained earned 8,540-item save in `p15-earned-ssr-party-v1.json`.
2. Canonicalize it through native decoding and serialization, then profile ten
   complete `decodeSaveJson` calls, checking the entire serialized result each time.
3. Inspect the retained CPU profile and `matchedWord` in `socket-contents.ts`.

Expected: canonical socket validation searches only recipes whose rune count
can match the already validated contents and resolves capacity once.

Actual: even empty contents search all 35 recipes; capacity is resolved again
inside matching. Across ten decodes the profile records 35,607 microseconds
of self samples in `matchedWord`. Complete decode samples range 62.513–89.688 ms.
Sampling includes other work; this is neither browser timing nor a population estimate.

## Evidence and remedy

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-save-decode-profile-ewrl28ga`.
`profile.mjs`, `profile-report.json` and `decode.cpuprofile` retain the diagnosis;
`plan.json` freezes the implementation and seven-pair measurement scope.
Current canonical JSON SHA256:
`a16ffc887d5916bdbad9690eafc58aa145dc7f68cc059fab47aad75476f5c1f6`.

Group the actual authored recipes by rune count, preserving order within each
group, and pass the already validated capacity. Keep all descriptor, material,
rarity, word identity and ownership checks. No validation-result cache, save
format or data change. Verify every authored word, incomplete identity refusal,
socket save roundtrips and complete baseline/candidate state equality. Performance
acceptance requires at least 10% lower socket-validation median and no more than
5% worse complete-decode median in the frozen comparison; retain every sample.

Security check: pass for authorized local engine/tests/docs. Plan review: ready;
the index uses authored counts rather than assuming socket count equals rune count.
No campaign replay, broader test suite, dependency, CI, agent or publication work.
Root retains required evidence and human2 through umbrella review, then owns cleanup.

## Local resolution — 2026-11-04

[Recorded implementation and evidence](../../docs/plans/evidence/p16-socket-validation-performance.md)
retains five pre-edit semantic passes (no behavioral RED claimed), 63 affected
passes, corrected authored-word fixture pass, scoped strict types and final
two-file lint. Original lint failure is preserved. The sole frozen seven-pair
Node comparison reduces socket median8.311622→4.185361ms (49.6445%) and complete
decode69.326613→60.272281ms (13.0604%), with full serialized equality and unchanged
input/source. All 35 authored words retain semantics and existing tests are exact.
No timing retry, browser/device performance or broader runtime acceptance claim.
All task tool sessions are terminal; profile/benchmark PIDs and three caches are
absent; scoped config archived/removed. Required packet remains root-owned
through unfinished umbrella review. Full privatev1 remains active/incomplete.

# P15 — Selected Act V champion elemental immunity

Follow-up2026-11-05: [BUG780 artwork closeout](p16-act5-champion-artwork.md)
adds attributed local images for both missing identities. Four new art-only
actual-screen browser cases pass with zero warnings/errors. The original result
below remains `passed:false`; its closed mechanics diagnostic is not rerun.

2026-11-05. BUG775 is implemented locally, uncommitted: actual champion Blood
Lords reject fire and champion Frozen Terrors reject cold. Other tiers retain
their75% numeric resistance and matching susceptibility. Optional JSON metadata
passes through the existing factory into copied/frozen/deduplicated unit damage
immunities. No skill, planner, RNG, reward, save or UI production change.
Selection and reachability are recorded in
[the decision](../decisions/P15-act5-champion-immunity-v1.md).

## Verification

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act5-champion-immunity-hmslxzhh`.
Root retains this exact packet through full-v1 acceptance, then removes it after
all consumers finish. It contains source preimages, causal failures, corrected
checks, diagnostics, browser drivers/screenshots and cleanup receipts.

- Final focused run:20engine +3store +5selected delivery cases pass. Initial
  affected run:62pass/3fail. Its five immunity UI cases,15existing damage-immunity,
  nine factory and two Act V priority cases all pass. Delivery initially has
  31passes/3stale failures; BUG776 corrects mutable-source provenance and the
  111→112catalog count, then the five selected cases pass (one existing immutable
  control repeats). No broad suite or campaign replay.
- Preserve parameterized assertion counts: repeated display names and filtered
  tests make JSON aggregate/deduplicated-name counts unsuitable as totals.
- Strict scoped TypeScript imports1,000files with zero diagnostics; six changed
  TS/test files pass lint; all11actual Act V rows pass strict JSON schema.
- A bounded planner-only diagnostic resolves the initial store fixture error:
  manual guard rosters promote Frozen Terrors, while Blood Lords are reached
  through native idle promotion (Arreat Plateau,seed775,ordinal5,pity11,wave2).
  No planner changes, battles, rewards or acquisition samples were used to find it.

## Browser result and its limit

Chromium147.0.7727.15 completed en/zh-CN at360×640and1280×800. Native IDs and
localized names are retained; actual CombatScreen labels,75%stats, matching
direct/periodic damage zero, physical damage positive, ordinary susceptibility,
metadata immutability, unchanged plan and no horizontal overflow are checked.
All four view iterations finish. There are zero browser errors, failed requests
or bad HTTP responses. The run nevertheless exits1at the final zero-warning
assertion: Blood Lord and Frozen Terror have no registered artwork mappings.
`browser-result.json` therefore correctly keeps `passed:false`.

Existing BUG309 and `src/ui/imageHelpers.monsters.test.ts` require a truthful
readable fallback for absent identities. Screenshots show those initials with
localized names and immunity labels; no art proxy or warning suppression was
added. This verifies the mechanic/presentation assertions, not a fully clean
browser gate or complete artwork coverage. Initial screenshots/driver output
with renamed IDs remain under `initial-*`; they are not final identity evidence.

## Review, custody and remaining scope

Self-review against packet preimages confirms four production files plus the
explicit monster-spec selection; the separate delivery correction is test-only.
Absent/empty champion metadata preserves prior shape, explicit empty all-tier
metadata remains empty, and all other tier/definition data stays unchanged.
No independent review or earned/balance/acquisition/pacing acceptance is claimed.

Corrected driver handle78171 is terminal exit1, browser/server closed. PID328467
is absent, port5173unbound and the exact packet-owned `vite-cache` removed;
`browser-cleanup-receipt.json` verifies all three. Initial PID327759/cache cleanup
also remains recorded. No disposable task process/cache or cleanup failure
remains; required reports and screenshots stay with root.

The preceding status turn collected the final browser result and completed exact
cleanup; this turn records source review and closes the local implementation.
Historical14/14Normal completions,210supplemental checkpoint sources and formal
balance0/210are unchanged. No exhausted campaign/screening/sample/retry budget
is renewed. Full privatev1 remains unfinished: progression/challenge/acquisition/
economy/pacing, difficulty/endgame, integrated app/PWA/a11y/performance/soak and
independent acceptance. Browser works; CI excluded; owner playtest later.

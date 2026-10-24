# D05 — Assassin Fade and Venom / BUG177

2026-10-24. Implementation `947f020`, baseline `2a1dc00`. Locally implemented and verified; independent
acceptance, earned class/build balance, C2–C4 and full G0–G7 remain open.

Fresh eligible Assassin composition now applies authored Fade resistance points
in all six types and magical dodge, plus Venom's poison-damage increase. Exact
aliases resolve maximum once, ranks cap at authored limits, and class/unlock guards
exclude foreign or premature allocations. Existing Last Wish and increased-poison
item bonuses add once; no derived bonus is persisted or resources refilled.

Successful basic hits apply one five-second poison stack from explicit JSON tuning:
5% snapshot Attack per second, increased by the complete poison-damage bucket,
then mitigated once through poison resistance, act penalty and ordinary defense.
The coating uses existing stack/refresh/payload/source/expiry/death-spread rules,
without another hit, crit or chance roll. Active skills, misses, mercenaries,
summons, enemies and invalid/absent authority do not proc it. A copied, bounded,
transient snapshot projection binds coating to its living hero; save format is
unchanged. Both locales and current/next details explain the actual effects.

## Verification

Three native reproductions and two schema cases failed before their fixes. Four
bilingual UI cases reproduced stale descriptions before the display correction.
Focused final checks total 57 passes across six files: 40 engine/schema/composition
cases and 17 store/UI cases. These cover rank 1/cap, alternate immutable tuning,
malformed aliases/projections, six actual Fade mitigations, Last Wish/Infinity
addition, actual poison DoT/expiry, poison versus physical mitigation/crit, stack
cap/source retention, lethal spread, skill/miss/source exclusions and RNG/replay.
Native learning preserves old recordings and affects the next wave; explicit free
pure-respec composition removes effects without healing or replay income. That
helper is not proof of the paid town service. Real save validation/import preserves
player and inventory, and recomposition never stores derived bonuses.

Final engine: **5,976 passed / 197 files**, 88.98 seconds (90.23-second process).
Final full: **12,085 passed / 497 files**, two existing skips, 626.20 seconds
(628.26-second npm process). All **1,340** source/test/config hashes, HEAD and
complete Git status stayed unchanged before/after the full run; no repository
edit or commit occurred during it. Typecheck, standard
lint, explicit lint of all 14 changed TypeScript paths and explicit VITE_E2E=false
production build pass. All four JS chunks pass the five bridge-symbol checks.
Existing bundle/PWA-manifest warnings and test/performance budgets remain open.

Production browser cases pass 8/8: both skills × English/Chinese × desktop 1280×800
and mobile 360×640, no retries/skips/flaky results or captured page/console errors.
The 24 attachments include 16 screenshots and eight complete Save/close/Continue
payload pairs. Root independently parses all five persisted domains for exact
pair equality; representative mobile Venom and Chinese desktop Fade images were
inspected. These are constructed functional fixtures, not earned-balance proof.

## Retention and limits

[Fixtures](fixtures/assassin-shadow/) retain **133 raw files** and **22 terminal
process records**, with every archive member byte-verified against SHA256/size
manifests. Raw attempts, including strict-Ajv authoring failures, stale-copy UI failures and
three lint findings, remain archived with terminal process receipts, source
copies/freezes and byte-verified SHA256/size manifests. Invalid Attack robustness
is asserted at the coating helper boundary rather than claiming unrelated malformed
whole-engine snapshots are supported. No required assertion, guard, timeout,
validation setting or test-discovery scope was bypassed.

The genuine claimed Rite save remains at decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`, nextNormal402.
No campaign action or diagnostic-save promotion occurs. Inventory retains 213 IDs;
only Fade/Venom receive bounded-functional / independent-acceptance-open disposition,
leaving 185 unverified. Independent reviewer/QA, earned builds and balance, Baal,
C2–C4 and full G0–G7 remain open. Root self-review only; all work stays local.


Cleanup is verified in [cleanup.json](fixtures/assassin-shadow/cleanup.json).
The exact task scratch/build/browser root is removed and port 4459 is closed;
remaining task-owned temporary paths and cleanup failures are empty. All 760 build
file hashes remain archived. Shared caches, the claimed worktree and earlier
campaign evidence remain under their existing ownership rules. A post-validation
ledger table-selector assertion and its correction are retained separately in
`fixtures/assassin-shadow/documentation-update-correction.json`; gameplay source
and genuine actions were unchanged.

# P17 — Champion and rare-leader live loot

Verified locally, 2026-11-04, on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
plus retained changes. Implements drop-tables §2/§3/§4.6–4.8 under
[D08](../decisions/D08-nonboss-equipment-v1.md); BUG685 is resolved locally.
Constructed engine/native settlement evidence, without campaign, economy,
pacing or formal balance credit.

Configured ordinary trash/champion/unique aliases now project the actual tier:
champions attempt two inherited equipment picks with minima+2; rare leaders
attempt three with minima+3 and one independent guaranteed jewelry pick.
Ordinary noDrop follows actual difficulty: .20/.12/.06 and .10/.05/0.
Jewelry has noDrop0. Rarity multipliers are 1.5/2/3 and 2/3/6, preserving the
rare-leader +50MF and applying offline MF after the curve. Actual ilvl, source
weights and fixed rarity rows remain authoritative.

Only terminal equipment bands extend to finite act caps59/72/87/101/122.
Low-level champions can have no eligible ordinary equipment. Invalid/missing
sources and impossible guaranteed jewelry refuse; actual native settlement
publishes all rewards together or restores all participating domains. Authored
raw tables, special sources and explicit quest caches retain their interpretation.
Unconfigured promoted sources retain legacy pick/noDrop defaults; corrected
tier rarity multipliers apply globally. No save format or earned save changes.

## Verification

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-nonboss-equipment-v1`.
Counts overlap and must not be added.

| Check | Result / retained evidence |
| --- | --- |
| Original real-pool reproduction |6failed/1passed, then7passed; `original-failure.log`, `initial-green.log` |
| Boundary/source refusal |1failed/22passed, then23passed; `boundaries-red.log`, `boundaries-green.log` |
| MF/native fixture diagnosis |5failed/49passed then4failed/51passed; `mf-native.log`, `mf-native-green.log` |
| Corrected native fixtures |4passed/26unselected; `native-fixture-green.log` |
| Seven affected loot/native files |152passed/one old rare-leader snapshot mismatch; `affected-loot-native.log` |
| Reviewed award file after snapshot correction |All10passed without update; `award-final.log` |
| Scoped strict types |Pass, including final award test; `types-closure.log` |
| Explicit no-ignore lint |Eight files pass in `lint-final.log`; final award test passes `lint-closure.log` |
| Isolated production build / actual offline precache |Pass; `production-build.log`, `precache.log` |
| Emitted bridge scan |All13JS files pass five forbidden patterns; `bridge-scan.json` |

The25nonboss cases cover five-act counts/ilvl, exact rarity weights, actual
promoted spawn levels across five acts/three difficulties/manual and idle/
ordinals0/9/12 (planning only, seed7), exact noDrop boundaries, source weights,
shifted minima, terminal caps, low-level empty pools, schema/duplicate/typo
refusal, required jewelry, determinism/following RNG, MF and source isolation.
The native settlement file passes all30cases, including four added cases for
actual champions/rare leaders under a shared ordinary wave table and complete
refusal/restoration. Its fixture uses actual Burial Grounds planning, seed7,
with a constructed high-vitality hero and registered finisher; this grants no
campaign or balance credit. Initial wrong-area and weak-hero fixture failures
remain recorded; production combat was not changed to accommodate them.

The old award pin copied boss rarity multipliers for rare leaders. Independent
mulberry32/formula analysis at seed92374, MF137+50 and offline1.4 yields rarity
units .5896903367247432/.34263403387740254/.5483675010036677: the corrected
rarities are magic/normal/magic. Subsequent affix entropy changes the complete
bag, shards to468 and following RNG to .38724254560656846. The historical
snapshot is retained in `award-before-nonboss.snap`; `snapshot-review.json`
verifies the chapter-boss body is byte-for-byte unchanged and only the named
rare-leader contract changes. Initial filtered update selected zero tests;
an object-format name then added quotes and new keys. Both attempts remain
recorded; the final tuple-format names preserve the boss key and remove the
obsolete rare key. No test was disabled or assertion weakened.

Local five-axis source/test review found no remaining material issue within
this slice. Schema/reference checks and browser precompilation cover the new
authored rules; projection is pure and bounded, with no UI/DOM or network work.
Security check passes for local bounded rewards and existing settlement.
This is local verification, not independent umbrella sign-off. Existing large
chunk, old Browserslist and optional-art-manifest precache warnings remain;
the build does not prove runtime performance or physical-device acceptance.

All12source/test/data hashes and766build hashes match. Exact disposable
`production/` and `types.config.json` were removed and absence verified in
`cleanup.json`. All task processes are terminal; no server started. Root keeps
the required packet and claimed human2 checkout through umbrella review and
owns eventual cleanup/release. Historical manifests and failure logs remain.

The preceding status-only goal turn was no progress; this continuation completes
real verification and authoritative records. No full suite, campaign replay,
new agent, install, commit, push, publication or training-budget renewal.
Counts remain14intended ActI clears/3five-act Normal completions/formal0of210.
Full privatev1/P17 and remaining miniboss/trash reward requirements, build
viability, economy/pacing, integration, accessibility/performance and final
review/soak/user playtest remain open. Browser works; CI is excluded; no pending
question or external blocker.

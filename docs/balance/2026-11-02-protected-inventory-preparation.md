# Protected inventory gear-preparation cost — 2026-11-02

BUG589 removes unused snapshot and projection work in campaign gear selection.
Three before/after samples in one process reduce median native preparation
1611.715→1380.953ms (14.32%). Each trial starts from the same retained
earned L55/Normal ordinal1314 state:6545 backpack items and499 stash items.
Every trial produces exactly the same21 journal records,17,216,336 raw bytes,
691,124 compressed bytes and full successor observation hash. No combat,
completed act/build route, new admission, reward, item sink or policy is replayed.
This measures diagnostic preparation, not browser interaction or full-v1 balance.

## Implementation

`tests/campaign/actions.ts` clones only the slot-compatible candidates and the
player/equipment/quest inputs needed for comparison. Records remain detached
from live stores. It captures the existing complete refusal guard before the
recording boundary only when at least one upgrade can actually be attempted.
A native capacity refusal still compares every store to that guard. Eligibility,
slot order, score/ID ties, mutex behavior and native equip ownership remain.

`tests/campaign/survival-gear.ts` returns the mercenary projection before
preparing hero/quest stats that the mercenary branch never uses. Hero behavior,
mercenary formulas, floors, two-pass selection and native transfers remain.
Game source/data and the journal format are unchanged. No persistent cache,
free gear, currency, healing, respec or overflow sink is introduced.

## Evidence and validation

The original current-source profile measures1657.501ms median preparation,
703.459ms nested recorder time and705.470ms in whole-state observations across
three samples. A per-serialization memo experiment preserves bytes but slows
the median to1767.226ms; it is rejected and all three touched codec/journal
files are restored byte-for-byte. The first snapshot correction alone improves
paired median1550.254→1502.982ms. Final paired measurement includes both changes
and uses original baseline modules loaded from hash-pinned bytes, without
switching source files or changing the earned input.

Two functional regressions show11 unnecessary whole-store observations on
ineligible-only hero slots and9 unused hero preparations for a mercenary scan.
The initial hero test used an invalid name, then exposed the actual11 calls;
its final no-state-change check also required a frozen snapshot clock. Raw
failures are retained and are distinguished from the functional regression.

25 distinct affected checks across the two gear suites pass, excluding all
filtered cases and abandoned-experiment tests. They cover detached no-op
records, eligibility, deterministic ties, empty-slot upgrades, actual overflow
and full-backpack refusals, lower-ranked feasible upgrades, unexpected native
refusal, threat protection, reserve floors and the unused hero projection.
Scoped strict TypeScript and explicit `--no-ignore` changed-file lint pass.
The first lint attempt only encounters ignored diagnostic paths; the explicit
attempt then catches a fixture style error in the abandoned experiment. Both
raw attempts remain. No completed campaign or unaffected test suite is run.

## Checkpoint and limits

The shared packet is
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
`bug589-baseline-v1.json`, reviewed plan-v3, final checks and
`p15-protected-inventory-preparation-v1` through`v4` retain the measurements,
profiles, source bytes, exact-journal proof and rejected experiment. Final
paired duplicate journals are verified against the retained canonical journal
and removed after close; wrappers remove only their exact Vite cache paths.
Task TypeScript configs are archived; no task config remains in the repository.

Authority29 will retain all2102 game/provenance inputs unchanged from28 and
record four deliberate supplemental campaign transitions. Decision48 carries
the full objective and all earned evidence. Historical wallet98607,
prospective non-kill455, finite quest budget670 and accepted balance0 remain.

This reduces preparation cost; protected inventory growth, recorder/storage
cost, browser performance and actual L70 Hell income remain open. Next freeze
an explicit bounded earned Hell/training policy before admitting new runs;
then chronological14-build acquisition/funding/fairness and independent
holdouts, defeat/retry, manual/idle and calibrated30–50 active hours,
integratedG0–G7, soak, review and later owner playtest. No CI, pending user
question or external blocker. Root retains W/packet for full-v1/review and owns
eventual cleanup after all consumers finish.

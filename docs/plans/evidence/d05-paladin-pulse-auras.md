# D05 — Selected Holy Fire and Holy Shock / BUG181

Commit `df9f1c0`, based on `9a6afe1`, adds real automatic Fire and Shock pulses.
Root was the sole writer and performed local self-review. Independent design/QA
acceptance and earned class/build balance remain open. The [family contract](../decisions/D05-paladin-aura-family-v1.md)
records the provisional defaults: Holy Fire preserves its advertised 20 base
fire damage; Holy Shock newly receives 20 base lightning damage. Both use an
explicit JSON-owned 1,000 ms interval. These numbers have no earned balance sign-off.

A selected living hero pulses every living enemy in registration order, starting
one complete interval after each wave begins. Pulses continue through stun/freeze,
use no mana, cast, cooldown or action-budget slot, and consume no hit/dodge/crit/proc
RNG. They reuse ordinary source increases, combos, resistance penalties/clamps,
flat mitigation, minimum damage, Bone Armor and exact-once death consequences.
Existing periodic deaths settle first; a pulse precedes surviving tied actions.
The 60,000 ms deadline includes a due pulse; an action-cap stop never catches up.

Fire guarantees canonical Burn: each stack deals 10% of mitigated pulse damage
per second, floored with a minimum of 1, for 3,000 ms. Existing original-potency
refresh, expiry and five-stack cap remain authoritative. Strict schema confines
required pulse metadata to the exact Fire/Shock rows, matching their elements and
allowing finite nested Burn tuning only on Fire. Native and direct-engine inputs
copy/freeze nested tuning and reject invalid or foreign potency.

Existing +3% matching-element damage per rank, level 6/24 unlocks, prerequisites
and rank cap 20 remain. Rank bonuses affect only the hero and originally fielded
living mercenary. Dream's item-granted Holy Shock keeps its separate D10 contract.
Save v22 already permits both selections; no pulse timer or potency is persisted.
Native changes apply next wave, and replay uses original inputs without income.
Both locales describe actual timing, damage, eligibility and Burn behavior.

## Verification

| Check | Result |
| --- | --- |
| Focused regression | 164 tests / 9 files pass |
| Engine regression | 6,131 tests / 209 files pass |
| Final full regression | 12,286 tests / 519 files pass; two existing skips |
| Typecheck and standard lint/engine purity | Pass |
| Production build, explicit `VITE_E2E=false` | Pass; existing warnings remain |
| Production bridge scan | Four chunks, five forbidden patterns absent |
| Production browser | Four language/viewport cases pass |

The final full process took 473.097 seconds. All 1,233 source/test/config hashes,
760 build hashes, HEAD/Git state and the genuine save digest stayed exact through
the run. The committed source blobs were separately checked against those hashes.

Original failures remain retained: causal pulse/schema/native/UI REDs, incorrect
tie/combo fixture attempts, stale unsupported/radio-count expectations, six lint
errors, an attachment-auditor mistake and the retention owner-name mismatch.
The first full run recorded 12,283 passes, one stale unsupported-Holy-Fire assertion
failure and two existing skips, with all inputs unchanged. The corrected test
keeps still-unsupported Sanctuary as its control and adds Fire/Shock unlearned and
under-level rejection checks with no mutation/publication. Historical save-version
rejection tests remain untouched. Lint fixes preserve explicit unknown-input
validation and exact test assertions; no timeout, worker or skip workaround was used.

Browser coverage uses explicitly constructed level-30 prerequisite fixtures,
public allocation, selection of each aura and clearing to None. English/Chinese
at 1280×800 and 360×640 produce 12 exact Save → close → new-page Continue pairs,
comparing all five complete saved domains. A separate attachment audit repeats
those checks. Forty geometry samples across 360×640, 412×915, 640×360, 1280×800 and
1920×1080 show no horizontal overflow and all 15 radio labels at least 44×44.
No page errors or production test bridge were captured. Screenshots were inspected
with the pointer moved away; mobile captures are scrolled detail views with existing
fixed navigation. These fixtures do not prove earned acquisition, paid respec,
pacing, whole-screen accessibility or class balance.

## Retention and remaining scope

The [fixture manifest](fixtures/paladin-pulse-auras/manifest.json) retains 202
original files and 30 terminal process records, all byte-verified. It maps logical
paths to archive members, including deduplicated contents. The first retention
attempt stopped before archiving/deleting because its exact owner assertion omitted
“pulses”; its original script and the exact-name correction remain retained.

[Cleanup](fixtures/paladin-pulse-auras/cleanup.json) removed 1,722 exact task-owned
files. The scratch root is absent, preview port 4464 is closed, and no failures or
remaining paths are reported. Shared caches and older campaign evidence remain.

Only Fire/Shock gain bounded-functional dispositions: 213 skill IDs remain,
with 162 unverified, 49 bounded-functional, one bounded-engine-functional (Ice Arrow)
and one review-needed (Cold Mastery). Those 50 bounded records have different proof
scopes. BUG181 remains open for Sanctuary, Cleansing, Redemption, Prayer, Vigor and
Concentration. Independent acceptance, earned balance, existing suite-time and
bundle/PWA budgets, and intermittent BUG180 remain open.

The genuine claimed Ancients401/Rite save remains level 33, XP 149261, 23,682 gear,
next Normal ordinal 402. Its decompressed SHA256 remains
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign action or diagnostic-save promotion occurred. Baal, seven-class/
two-build acceptance, economy/endgame/pacing/offline/PWA/accessibility/performance,
independent C2–C4 and full G0–G7 acceptance remain open. Work is local only;
the full private-v1 goal, branch and claimed worktree stay active.

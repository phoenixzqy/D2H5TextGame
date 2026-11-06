# Production measurement (P02a01–P02a03)

## Current checkpoint command (v3, P15)

For exactly one prospectively selected attempt from saved state:

```sh
npm run sim:checkpoint -- \
  --fixture /absolute/fixture.json \
  --save /absolute/save.json \
  --output /absolute/new-report.json
```

There is no default input, batch or retry. The descriptor fixes raw-save SHA256,
acquisition evidence/kind, build ID/class/exact level, canonical area/act,
difficulty, manual/idle, ordinal, pity, sample stage/seed and clock. Supported
partitions are benchmark 1, screening 1–100, tuning 1–1,000 and holdout
10,001–11,000. It does not override saved progression, gear or resources.
`runCheckpointAttempt` uses native generation/combat/playback/rewards, preserves
nonwins/unreached waves and restores caller state on success/error. Idle requires
an existing clear in the saved selected difficulty. Process-global IDs remain
monotonic; use a dedicated quiescent realm. A checkpoint hash does not certify
earned acquisition or build identity.

Output is exclusive and outside the repository; the fsynced companion
`<output>.journal.jsonl` preserves settled waves on later failure. The encoded
v3 report contains source/data/contract manifests, actual RNG streams, native
input/outcome/resource/reward metrics and cleanup. No campaign successor or
balance acceptance is granted. See [bounded control evidence](../../../docs/plans/evidence/p15-checkpoint-balance-runner.md).

Completed attempts also retain `attempt.plan`, a detached copy of the exact
installed native plan captured before playback. It preserves source encounters,
spawns, levels, tiers, affixes, loot and idle presentation metadata, including
waves never played after defeat. The existing journal preserves settled waves
on later errors; it is not a full-plan journal. The outer CLI report remains v3.

The pure population reporter emits v2. Each trial has
`plannedTargetWaveIndices` and `unreachedTargetWaveIndices`; both are `null` when
the original plan is unavailable. Target coverage separates:

- `reachedSeeds`: an observed wave has the target role.
- `notObservedSeeds`: no observed wave has that role (the old v1
  `unreachedSeeds` meaning).
- `plannedSeeds` / `absentSeeds`: a known native plan includes / excludes it.
- `unreachedSeeds`: a known plan includes it, but a failed prefix prevents
  observing any occurrence.
- `planUnavailableSeeds`: the original native plan was not recorded.

`plannedWaveCount` and `unreachedWaveCount` cover **known plans only**. Later
unplayed occurrences count even after an earlier occurrence of the role was
reached. Reach-rate denominators include every started seed trial. Missing
historical plans are never reconstructed; area failures, actual rewards and
correlated-wave treatment remain intact. Coverage does not establish balance
acceptance. See [role-coverage evidence](../../../docs/plans/evidence/p15-checkpoint-role-coverage.md).

The current [retained-power baseline](../../../docs/plans/evidence/p15-retained-power-baseline.md)
pins all 210 build/act/role contexts to 183 selected sources plus two existing
order-only derivatives. Its broader power/acquisition, population and adaptation
requirements remain open. The earlier
[source inventory](../../../docs/plans/evidence/p15-checkpoint-source-reuse.md)
recorded 157 exports and a 121-clear/89-gap split; those are historical inventory
counts. Use the latest baseline and its preserved boundary/provenance fields,
not those older counts, for subsequent work. No source freeze performs gameplay.

The [manual ordinal partition](../../../docs/plans/decisions/P15-manual-ordinal-partition-v1.md)
is source-proven for ordinary manual **plan support**: at fixed remaining inputs,
ordinals with the same residue modulo 13 yield equal plans in all 29 current
canonical areas, including their fixed replay transforms. Preserve original
ordinal, seed, source projection and stateful admission identity in trials.
This does not imply uniform production residues or any idle/reward reduction.
Idle retains full ordinal and explicit initial pity; missing historical pity is
unknown. The single native witness launch failed before game loading and is
closed with zero plan calls; [evidence](../../../docs/plans/evidence/p15-manual-ordinal-partition.md)
separates that failure from the source proof. Population/adaptation acceptance
remains open; do not rerun the spent witness allowance.

Diagnostic self-tests require explicit discovery; do not run the historical
commands below to verify this adapter:

```sh
node_modules/.bin/vitest run --workspace vitest.diagnostics.workspace.ts \
  --project sim-diagnostics \
  tests/sim/production/checkpoint-fixture.test.ts \
  tests/sim/production/checkpoint-attempt.test.ts \
  --poolOptions.threads.maxThreads=1 --poolOptions.threads.minThreads=1
```

## Contiguous native retries (P15)

`tests/campaign/retry-measurement.ts` operates on the live native successor;
it never restores between attempts and stops at victory or its declared 1–3
attempt cap. Before admission, it publishes `retry-policy` containing
`{ policy: { version: 1, request } }`, a complete detached request declaration,
and returns it as `result.policy`. Later caller changes cannot rewrite it.
Journal values and retained adaptation actions are independently detached;
consumer edits cannot change outcomes or subsequent build decisions. A failed
initial policy publication leaves native stores/counters unchanged and restores
the clock. Later failures retain the existing partial-journal/live-successor
contract. Historical missing policies are unknown. This is a measurement
boundary, not a population/build-policy choice or balance acceptance; see
[snapshot evidence](../../../docs/plans/evidence/p15-retry-policy-snapshot.md).

Each retry now retains `attempt.plan`, copied from the exact installed native
run immediately after admission and validated against native seed, area and
wave count. The detached `retry-admission` journal includes that full plan
before playback, preserving later enemies when defeat ends a prefix and after
native run disposal. Journal edits cannot change the run or retained plans.
The request policy stays v1; admission/settlement/adaptation behavior is unchanged.
Missing historical plans remain unknown, with no reconstruction or acceptance
credit. See [plan-capture evidence](../../../docs/plans/evidence/p15-retry-plan-capture.md).

The following sections document the older v1 fresh-recipe runner and its
historical discovery setup. They do not describe the v3 command above.

## Historical fresh-recipe runner

This directory validates recipes/provenance and measures bounded fresh runs
through production creation, combat, recorded playback and reward APIs. It does
not certify balance, pacing, skills or campaign reachability. The historical
`../bloodMoor.sim.test.ts` and Phase C script use
proxy combat formulas; they remain outside this project's discovery.

Run the non-watch self-tests:

```sh
npm run test:sim:contracts
npm test
```

The `sim-contracts` Node workspace project discovers only
`tests/sim/production/**/*.test.ts`, including under ordinary `npm test`.
Ordinary tests include one small production measurement. Existing engine/UI
projects and engine-purity boundaries are preserved.

Run a measurement with the default fresh sorceress/Blood Moor/seed1 recipe:

```sh
npm run sim:production
SIM_REPORT_PATH=/tmp/d2h5-production-new-report.json npm run sim:production
```

`SIM_FIXTURE_PATH` optionally selects a recipe JSON file. Reports require an
absolute, previously nonexistent leaf outside the repository with an existing
real parent; no overwrite, directory creation or repository output is allowed.
The screening adapter permits at most eight seeds, two repetitions each.
It restores six stores, idle pity and Date.now on success/error, and rejects an
already active run. No persistence, offline or browser hooks are installed.

## Fresh recipe v1

```json
{
  "fixtureVersion": 1,
  "id": "fresh-sorceress-blood-moor-v1",
  "origin": {
    "kind": "new-character",
    "classId": "sorceress",
    "name": "SimSorceress",
    "policy": "production-creation-defaults"
  },
  "scenario": {
    "act": 1,
    "subAreaId": "areas/act1-blood-moor",
    "mode": "manual",
    "challengeOrdinal": 0,
    "idleEliteMisses": 0
  },
  "clockEpochMs": 1792454400000,
  "seeds": [1],
  "mercPolicy": "none",
  "summonPolicy": "production-default"
}
```

`parseFixture(unknown, references)` validates exact supported version/keys,
finite safe integer clock, 1–256 distinct unsigned 32-bit seeds, production
class ID and canonical area/act references. It returns an independent recipe
and never reads or mutates stores. References come directly from current
production class and sub-area JSON. The test imports real datasets.

This version supports fresh production creation defaults, the first manual
area, no merc, ordinal/pity zero and production summons. It rejects stat,
level, gear, resource, damage, reward, clear/unlock and other overrides.
It accepts no aliases that might invoke a synthetic resolver fallback.
An earned-checkpoint variant must later carry acquisition/source evidence;
never describe an injected advanced build as earned state.

## Fingerprint and provenance v1

`fingerprintEntries` hashes supplied relative paths and exact content bytes.
Entries must be nonempty, unique and canonical POSIX relative paths (no empty,
dot/parent segments, drive prefix, backslash or NUL). It has no filesystem,
network, shell, timestamp or absolute-checkout dependency. Sort by path using
JavaScript code-unit ordering, then SHA-256 over:

1. UTF-8 domain prefix `d2h5-file-entries-v1` and a NUL byte.
2. For each entry: UTF-8 `JSON.stringify([path, byteLength])`, immediately
   followed by exactly `byteLength` raw bytes.

JSON headers delimit themselves and byte counts delimit content, including
binary bytes and embedded newlines. Enumeration order cannot change the hash;
path/content edits, additions or deletions do. `fingerprintFixture` uses the
same algorithm for `fixture.json`, recursively sorting JSON object keys while
preserving array order. The recipe's version, seeds, clock and origin all count.

`parseRunProvenance` requires source commit SHA, source-tree/data/fixture SHA-256
hashes, fixture version, Node and Vitest versions. Missing/empty/malformed fields
fail. Schema validation only checks shape: the runner computes actual values
from the executed source and fixture. Never substitute fabricated
values from a test or an empty fingerprint. Source-tree hashing must include
relevant tracked and task-local untracked source/config/scripts/lockfile bytes,
so dirty source differs even when the commit SHA is unchanged. Data hashing
must include production data paths and bytes. Exact collection roots/exclusions
are recorded in the report. `collectSourceState` includes `src/`, this directory,
`scripts/`, package/lock files, Vite/Vitest and TypeScript configs; fixed cache
directories are excluded and symlinks rejected. The driver collects before
dynamic gameplay import and after cleanup; source/data drift rejects output.
A supplied hash is not independent provenance.

## Production run replay boundary

`startSubAreaRun` now accepts independent optional readonly `runSeed` (uint32,
including zero) and `challengeOrdinal` (integer in [0, 360360)). Successful
handles return their resolved values alongside `runId` and `totalWaves`:

```ts
const handle = startSubAreaRun({
  subAreaId: 'areas/act1-blood-moor',
  runSeed: 0,
  challengeOrdinal: 0
});
```

Both provided values are validated before any store, active-run or counter
mutation; invalid values throw `RangeError`. Omitted seeds retain the historical
resolved-area/time hash. Omitted ordinals consume the existing counter once
modulo 360360; explicit ordinals leave it untouched. Partial options keep the
other default independently. Valid no-player calls still return `null`.

The seed feeds the existing plan, wave/combat and reward derivations. See
[D07 v1a](../../../docs/plans/decisions/D07-run-replay-inputs-v1.md) for exact
derivations and scope. The fresh fixture schema still permits only ordinal zero.
Replay also requires unchanged starting stores/data and a stable character
creation identity. The UI-workspace test `src/stores/combatHelpers.replay.test.ts`
uses a real fresh production character and compares raw first-wave teams,
events/timestamps and outcome after changing the run-start wall clock, with no
private counter resets, stat boosts or proxy battle.

This input boundary is used by `adapter.ts`, which retains full raw initial and
final teams, recordings, terminal state, per-wave seeds, raw rewards and actual
inventory/currency/cumulative-XP deltas. Logical simulation duration, summed
UI-delay hints and measured wall runtime are separate; hints are not browser
time. Each wave includes event count and SHA-256 of canonical raw event JSON.
Raw battle equality, raw reward equality and semantic reward equality omitting
only top-level Item.id are separate assessments. The process-global allocator
is never reset or hidden. Observed rewards and nonwinning-advance diagnostics
remain independent of the production victory/clear flags.

## Acceptance and next slices

Producer reviewed this five-file child before implementation. Tests cover real
references and mismatched/unknown inputs, forbidden overrides, seed bounds,
reordered/binary file inputs, changed paths/content/recipes, duplicate/unsafe
paths and incomplete provenance. Initial test run failed because the module
did not yet exist; recipe validation preceded fingerprint implementation.

Security check: pass; local validation/hash tooling only, no new dependency,
untrusted command execution, network, credentials, permissions or runtime/save
behavior changes. Current U/T/L evidence and final SHA live in the plan ledger.

The adapter uses `createMockPlayer` → `playerStore.setPlayer` and
`startSubAreaRun` → recorded playback → `advanceWaveOrFinish`, retaining real
reward service outputs. Do not
reset global item allocators to claim exact raw replay, silently strip item
IDs, or infer a victory from wave advancement. Report raw and semantic reward
comparison separately until hidden state is resolved.

Current CombatScreen idle mode uses real sub-area combat. The separate
`useIdleTicker` presumed-kill path has no production caller; diagnose it under
that label. Fresh fixtures may not inject clears to unlock idle. Manual/idle
comparison, raw reward identity replay, expanded scenarios and full P02 remain
open. The default seed1 sample loses wave2 of3 while retaining wave1's actual
rewards; it proves measurement wiring, not a fresh full clear. Current exact-head
commands, results, hashes and known limits live in the execution ledger.

## Fresh earned recipe v2 (P02b01 contract only)

`earned-fixture.ts` adds `parseEarnedFixture(unknown, references)` and
`fingerprintEarnedFixture(EarnedFixture)`. The existing v1 parser, adapter,
provenance and CLI remain separate. The v2 parser validates a recipe; it does
not run acquisition, prove affordability, import a checkpoint or certify a win.
There is no v2 measurement command yet.

All top-level and nested fields are required and closed. The recipe has
`fixtureVersion: 2`, a canonical slug `id`, a fresh Sorceress `origin` with
`kind: 'new-character'`, `classId: 'sorceress'`, a 1–40 character `name` and
`policy: 'production-creation-defaults'`. `clockEpochMs` is a nonnegative safe
integer. `seeds` contains 1–8 distinct uint32 target seeds; acquisition uses
`acquisitionSeedPolicy: 'production-clock'`. The target `scenario` is Act1,
`areas/act1-den-of-evil`, manual, ordinal1–40 and `idleEliteMisses: 0`.
`mercPolicy` is `recipe-actions`; `summonPolicy` is `production-default`.

`actions` contains 1–32 ordered commands:

| `kind`             | Required command fields and bounds                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `hire-merc`        | `mercId` in the actual production hire roster                                                               |
| `allocate-skill`   | Canonical Sorceress `skillId`, integer `points`1–20                                                         |
| `set-combo`        | `skillIds`: 0–9 distinct current active Sorceress IDs                                                       |
| `farm-first-waves` | `subAreaId: 'areas/act1-blood-moor'`, integer `count`1–40, `firstChallengeOrdinal: 0`                       |
| `allocate-stats`   | `deltas` has all four integer attributes0–25, total1–25                                                     |
| `equip-earned`     | `owner: 'hero'` or `'merc'`; `mercId` required only for merc; `slot: 'gloves'` or `'boots'`; selector below |
| `accept-quest`     | `questId: 'quests/act1-den-of-evil'`                                                                        |
| `checkpoint`       | Unique canonical slug `id`; output observation only                                                         |

Exactly one farm command is required; its count must equal the target ordinal.
The intended execution settles each acquisition W1 once and flees the already
installed W2, using explicit ordinals0 through count−1. Count1 supports a later
tiny adapter self-test; count40 requires its own reviewed screening plan.

An equipment `selector` has exactly `baseId`, `rarity: 'normal'`, integer
`defense`0–1000 and `selection: 'first-acquired'`. Its current base must fit the
requested slot. Later execution must select only earned backpack items, retain
their original IDs and break ties by acquisition order. No supplied item or
character state is accepted.

References explicitly supply current production `classes`, `areas`, `skills`,
`mercs`, `bases` and `quests`. Supply mercs from
`loadMercHireRoster().flatMap(act => act.mercs)`, not the broader gacha pool.
The parser checks catalog membership, Sorceress skill identity/active combos,
Act1 area/quest relationships, base-slot compatibility and checkpoint uniqueness.
Runtime hire eligibility uses the roster act's `unlockReqLevel`; learned skills,
prerequisites, available points, equipment ownership and quest availability
remain production execution checks. No coercion, defaulting or removal of
unknown properties occurs. The returned fixture is an independent clone.

Fingerprinting includes the whole fixture at `fixture.json` using the v1
path/length/byte protocol, recursively sorted object keys and ordered arrays.
Tests use real catalogs, isolate invalid bounds/references, preserve v1 controls
and compare an independently calculated literal fingerprint. Current plan,
RED/GREEN evidence and acceptance limits live in the execution ledger.

## Fresh earned execution (P02b02)

`runEarnedRecipeOnce(input, { targetSeed, repetition: 1 | 2 })` in
`earned-adapter.ts` executes one validated v2 attempt in a dedicated Node realm.
The target seed must occur in the fixture. `completed` means all actions and the
target attempt finished; inspect the recorded winners and native terminal result
to determine success. `action-refused` and `preparation-nonwin` stop immediately,
retain partial observations, and never attempt subsequent actions or the target.
Malformed inputs, active caller runs, structural errors, source drift and cleanup
failures throw. Combined action/cleanup/source errors retain their original
objects in `AggregateError.errors`.

Every attempt snapshots and restores all seven stores (including meta), their
methods, `Date.now` and idle elite pity. The clock freezes before meta reset, so
caller offline multipliers cannot enter acquisition. Every cleanup step and the
final source check is attempted even if an earlier cleanup step fails. Direct
store imports install no persistence subscribers; use this only in the dedicated
simulation realm. An active caller run is refused before mutation. Process-global
item IDs and challenge counters are never reset; explicit ordinals avoid changing
the default challenge counter.

Actions call ordinary production methods, with the UI's hire-act, learned active
combo and quest-availability checks around permissive setters. Skill spending
retains each result and partial success. Attribute allocation does not heal.
Equipment selection uses displayed `computeStats(...).defense`, an independent
award-order journal and the actual current backpack object by original earned ID.
Checkpoint commands only produce independently cloned observations.

Acquisition omits the run seed under the frozen production clock, plays W1's
complete recording and calls native advancement exactly once. A genuine W1 win
installs W2 synchronously. Its opening, precomputed outcome and recording are
retained before native flee; W2 is never played, settled or awarded. Its
precomputed outcome is not an attempted-wave failure. The target uses the declared
seed and ordinary native advancement until victory or first defeat/draw.

Results retain complete nonfunction domain state at creation, action boundaries,
checkpoints, awards, flee, pretarget and terminal state; combat observations retain
full opening/played/advanced state, timed events, outcomes, presentation, raw
rewards and actual item/currency/hero/merc XP deltas. Logical simulation time and
summed UI delay hints exclude abandoned W2; measured wall time is separate.
Living resources and status clocks carry through native advancement, while each
battle resets effective cooldown scheduler timers. Raw cooldown fields remain
observed. Target carry coverage is explicitly `unexercised` when no next target
wave is reached. Persistent player resources are distinct from combat carry.
Raw presentation log IDs may use `Math.random` and are not a deterministic replay
claim.

The frozen tiny self-test uses one preparation at clock1792497600000 and target
seed1. It exercises prep W1 award/W2 flee and actual Den W1→W2 resource carry, then
Den W2 defeat. A separately frozen variant appends ordinary hero glove5 and merc
boot3 equipment from the same earned loot: hero defense28, saved merc defense26
and next-combat merc defense29, with no refill or win requirement. Pure item
selection examples are synthetic contracts, not earned gameplay evidence.
Positive timed-status rebasing and nonzero effective cooldown reset are not
exercised by these samples; source and existing native tests support those rules.
P02b03 owns versioned reports, before-import provenance, repeated-run comparison
and a v2 CLI. This adapter does not establish screening, browser, campaign,
pacing or full P02/v1 acceptance. The existing v1 harness remains unchanged.

## Earned measurement reports (P02b03)

```bash
npm run sim:earned
EARNED_REPORT_PATH=/tmp/earned-tiny-new.json npm run sim:earned
EARNED_FIXTURE_PATH=/absolute/path/to/recipe.json EARNED_REPORT_PATH=/tmp/earned-custom-new.json npm run sim:earned
```

Output is optional. A destination must be an absolute, new leaf under an existing
real parent outside this repository. Existing files and symlinks are refused;
parent symlinks are resolved before checking repository containment. The writer
creates exclusively and never overwrites. Invalid input, structural/cleanup
errors or source drift abort before report emission. A custom fixture is local
JSON validated against the unchanged v2 schema and actual production catalogs.

The default is exactly the original tiny recipe above: clock1792497600000,
targetseed1, one preparation, no appended equipment actions. For each declared
seed, the command executes repetition1 then repetition2, from fresh creation,
and produces one comparison. No retries, extra farming, seed search, persistence
initialization or process-global allocator reset occurs. Expected action
refusals and nonwins remain complete partial attempts. `completed` means recipe
execution reached a native target terminal result; it does not mean victory.
The driver currently has a30second execution timeout; this is not a performance
acceptance threshold or permission to run an unreviewed large screening recipe.

Reports have `reportVersion: 2`, `observationEncoding: d2h5-observation-v1`,
the whole validated fixture/fingerprint, separate v2 provenance, complete raw
attempts, full source manifests/dirty metadata and per-seed comparisons. Actual
disk identity is collected before dynamic gameplay import, before actions,
after every restored attempt and at final outer verification before writing.
All checks compare SHA, source/data hashes, Node/Vitest versions, manifest and
collection policy; dirty-worktree metadata is retained separately.

Ordinary JSON drops Maps and explicit `undefined`. `encodeObservation` in
`earned-report.ts` preserves them with reserved `$d2h5` tags, as well as `-0`
and nonfinite numbers. `decodeObservation(JSON.parse(bytes))` recovers values.
This is a value codec: record key order is canonical, array and Map entry order
is significant, and reference alias identity is not represented. Unsupported
objects, cycles, executable/accessor data and reserved-tag collisions throw.
`observationJson` and `hashObservation` use those same complete encoded bytes.

Comparison fields have deliberately bounded meanings:

| Field | Compared values |
| --- | --- |
| `sourceIdentityEqual` | All four before/after source/tool identities; dirty metadata excluded |
| `rawWaveRecordingsEqual` | Ordered attempted run handles, opening teams/events/outcomes/presentation/name Maps/logs, played final teams/cursor/completion, native advance result and terminal simulation clock |
| `rawAbandonedRecordingsEqual` | Separately retained installed, unplayed preparation W2 recording and handle |
| `rawRewardsEqual` | Ordered raw wave/run awards, actual observed deltas and acquisition journal, with original IDs |
| `semanticRewardsIgnoringOnlyTopLevelItemIdEqual` | Same reward projection, omitting only each known Item's top-level `id`; nested IDs and removed-item IDs stay significant |
| `rawDomainObservationsEqual` | Status/refusal, action order/results/boundaries, creation/checkpoints/pretarget/terminal and wave award/flee domain states |
| `fullRawReplayEqual` | Entire attempts except top-level repetition, `timings.wallSeconds` and separately compared source states |
| `itemIdentityAssessment` | Ordered original ID strings in earned journal and actual target additions; `unexercised` only when both sides have no items |
| `rewardPathCoverage` | Independent `first`/`second` coverage from observed XP/merc XP/currency/items/clears or raw awards, without inferring rewards from winner flags |

The full report retains all snapshots, including future installed recordings,
rewards, flee state and played logs omitted from the narrower recording metrics.
Original allocator IDs or random log IDs may differ across repetitions; exact
raw equality is an observation, never a prerequisite or a fabricated promise.
Abandoned recordings do not contribute attempted-wave logical or UI-hint time.
Logical simulation seconds, event UI-delay hints and adapter execution/restoration
wall time remain distinct. A tiny report does not establish screening, balance,
browser behavior, campaign pacing, C0–C4/G0–G7 or complete private-v1 acceptance.

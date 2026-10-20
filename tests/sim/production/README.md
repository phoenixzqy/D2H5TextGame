# Production measurement (P02a01–P02a03)

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

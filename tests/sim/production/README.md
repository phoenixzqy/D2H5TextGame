# Production measurement contracts (P02a01)

This directory currently validates recipes and measurement provenance. It does
not run combat or certify balance, pacing, skills, earned progress or campaign
reachability. The historical `../bloodMoor.sim.test.ts` and Phase C script use
proxy combat formulas; they remain outside this project's discovery.

Run the non-watch self-tests:

```sh
npm run test:sim:contracts
npm test
```

The `sim-contracts` Node workspace project discovers only
`tests/sim/production/**/*.test.ts`, including under ordinary `npm test`.
There is no simulation results command yet. Existing engine/UI projects and
engine-purity boundaries are preserved.

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
fail. Schema validation only checks shape: the later runner **must compute**
actual values from the executed source and fixture. Never substitute fabricated
values from a test or an empty fingerprint. Source-tree hashing must include
relevant tracked and task-local untracked source/config/scripts/lockfile bytes,
so dirty source differs even when the commit SHA is unchanged. Data hashing
must include production data paths and bytes. Exact collection roots/exclusions
are a runner-card deliverable; a supplied hash is not independent provenance.

## Acceptance and next slices

Producer reviewed this five-file child before implementation. Tests cover real
references and mismatched/unknown inputs, forbidden overrides, seed bounds,
reordered/binary file inputs, changed paths/content/recipes, duplicate/unsafe
paths and incomplete provenance. Initial test run failed because the module
did not yet exist; recipe validation preceded fingerprint implementation.

Security check: pass; local validation/hash tooling only, no new dependency,
untrusted command execution, network, credentials, permissions or runtime/save
behavior changes. Current U/T/L evidence and final SHA live in the plan ledger.

Next: expose explicit production run seed/ordinal inputs, then use
`createMockPlayer` → `playerStore.setPlayer` and `startSubAreaRun` → recorded
playback → `advanceWaveOrFinish`, retaining real reward service outputs. Record
milliseconds/seconds and per-wave plan/combat/reward RNG derivations. Do not
reset global item allocators to claim exact raw replay, silently strip item
IDs, or infer a victory from wave advancement. Report raw and semantic reward
comparison separately until hidden state is resolved.

Current CombatScreen idle mode uses real sub-area combat. The separate
`useIdleTicker` presumed-kill path has no production caller; diagnose it under
that label. Fresh fixtures may not inject clears to unlock idle. Reporting/CLI,
production adapters, manual/idle comparison and all of P02 remain open.

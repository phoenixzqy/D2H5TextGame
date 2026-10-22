# Mage direct-bolt paired screening

BALANCE-CHECK: CONCERNS

The measurement method passes its bounded two-seed screen. Seed7 clears25%
faster and Mage logged DPS rises42.19%; seed991 clear time is unchanged and
Mage logged DPS rises13.55%. Flag these changes for the larger audit and
design interpretation. This is an explicitly **unearned L30 Necromancer versus
early Blood Moor**, not on-level/on-zone or earned progression. Two pairs do
not establish balance invariants, build viability, full Mage/statuses, D06,
P09/P10 or private-v1 acceptance. No tuning or production source changed here.

## Revisions, fixture and method

- Physical engine: `cf19757dd5e50f122371e5eda7327f8a79095fbb`.
- Elemental engine: `0b2b907ff378a60d7bc6d7ae15eefdc810a9cf29`.
- Each engine runs in a separate Node/Vite SSR process over173 non-test engine/
  data files copied directly from its immutable Git objects. The only non-test
  engine/data delta is `src/engine/combat/combat.ts`'s Mage authority/type path.
  This uses the actual historical engine; no preload, alias, registry override
  or patched helper synthesizes a physical baseline.
- Identical fixture/runner/hash-helper bytes serve both domains. Gameplay `@`
  points to the selected capture; loaded gameplay58/59 modules respectively
  are checked against that capture. Installed Ajv resolves through explicit
  deduplication. Package/lock/config/tool identities are retained. The actual
  shared `tsconfig.node.json` includes later browser configs; it is not claimed
  equal to the historical version and has no engine behavior.
- Build one snapshot using proposed captured sources, serialize once, then
  pass identical6028bytes to both engines. Keep fixed combat seeds7/991;
  repeated determinism calls are not extra independent observations.
- Closed recipe `mage-direct-bolt-screen-v1`: Necromancer30, Mage6, prerequisite
  Skeleton1, Mastery0; authored core15/25/15/25; no equipment, mercenary or
  preloaded summon. Pure allocation uses `requiredLevel ?? minLevel`, maxLevel
  and canonical prerequisite rank1. Seven skill points spent,24 skill points
  and145 stat points unspent. No injected cap, stun, WAIT or FINISH.
- Ordinary `deriveStats` and `composeHeroRecovery`: hero life362, mana203,
  attack80, defense107, AS125, full entry pools. Explicit unarmed weapon.
  Authored Blood Moor manual wave0, challenge ordinal0, pity0; plan-generation
  seed7 and enemy-generation seed991 are separate from combat RNG. Exact
  monster lookup refuses fallback. Eight level2 monsters total330HP: six
  Fallen (Defense12) and two Quill Rats (Defense10), Magic Resistance1, all
  resistances0 and physical/magical dodge0.05. This encounter intentionally
  exposes ordinary defense-versus-magic-mitigation differences.

## Observations

Arrows show physical → elemental. Logical duration is the final recorded end
event timestamp; UI delay and wall-clock runtime are excluded. Every observation
here wins, so successful TTK equals duration. Defeats/draws would retain their
outcome/duration and have null successful TTK; they are never treated as60s kills.

| Combat seed | Outcomes | Successful TTK (ms) | Hero deaths | Enemy HP removed | Hero final HP | MP entry / minimum / final |
|---|---|---:|---|---:|---:|---|
| 7 | victory → victory | 7760 → 5820 | false → false | 330 → 330 | 362 → 362 | 203/181/203 → 203/181/203 |
| 991 | victory → victory | 4500 → 4500 | false → false | 330 → 330 | 362 → 362 | 203/181/203 → 203/181/203 |

"Logged damage" is the raw sum of direct damage **event amounts after the
engine's mitigation**, including overkill; it is not pre-mitigation potency.
Effective HP removed clamps each hit to current HP and honors intervening heals/
HP orbs. Final HP reconstruction must reconcile. Both throughput columns divide
by the same complete battle duration, including startup; they are not steady
state per-Mage sheet DPS. Mage totals cover all four actual fresh registration
IDs, and player totals include the hero. Numbers below round to two decimals;
retained JSON stores full precision.

| Seed | Source group | Logged damage | Effective HP removed | Logged damage/s | Effective HP/s |
|---|---|---:|---:|---:|---:|
| 7 | All player | 505 → 527 | 330 → 330 | 65.08 → 90.55 | 42.53 → 56.70 |
| 7 | Hero | 204 → 206 | 85 → 77 | 26.29 → 35.40 | 10.95 → 13.23 |
| 7 | Mages | 301 → 321 | 245 → 253 | 38.79 → 55.15 | 31.57 → 43.47 |
| 7 | Enemies | 36 → 28 | 36 → 28 | 4.64 → 4.81 | 4.64 → 4.81 |
| 991 | All player | 516 → 558 | 330 → 330 | 114.67 → 124.00 | 73.33 → 73.33 |
| 991 | Hero | 206 → 206 | 120 → 120 | 45.78 → 45.78 | 26.67 → 26.67 |
| 991 | Mages | 310 → 352 | 210 → 210 | 68.89 → 78.22 | 46.67 → 46.67 |
| 991 | Enemies | 24 → 24 | 24 → 24 | 5.33 → 5.33 | 5.33 → 5.33 |

Crit denominator = landed direct damage events; dodge denominator = all direct
damage events. The engine's dodge flag includes failed effective-hit rolls.
These tiny observed fractions are not fitted rates or tooltip-math acceptance.

| Seed | Source group | Crits / landed events | Dodges / all attempts |
|---|---|---|---|
| 7 | All player | 0/12 → 0/11 | 6/18 → 2/13 |
| 7 | Hero | 0/3 → 0/3 | 2/5 → 0/3 |
| 7 | Mages | 0/9 → 0/8 | 4/13 → 2/10 |
| 7 | Enemies | 1/14 → 1/10 | 5/19 → 3/13 |
| 991 | All player | 2/11 → 2/11 | 0/11 → 0/11 |
| 991 | Hero | 0/3 → 0/3 | 0/3 → 0/3 |
| 991 | Mages | 2/8 → 2/8 | 0/8 → 0/8 |
| 991 | Enemies | 2/8 → 2/8 | 2/10 → 2/10 |

All four runs register four time0 Mages with identical IDs/stats/payment and
identical initial preparation events. Each Mage has life123, Attack45, AS70;
all four first act at1940ms. Physical damage types by actual registration are
P/P/P/P; proposed types are F/C/L/Poison. The runner rejects a mislabeled engine.
Startup payment is22MP once,203→181, followed by ordinary recovery/orbs to203.
There is no API reason for skipped unaffordable actions: **no mana-starved action
percentage is inferred**. Source-less DoT is explicitly outside this direct-only
meter and rejected rather than attributed to a Mage.

For each revision, independent clones establish plain/recorded equality,
recorded A/A, A/B/A return to A, B/B, and exact input preservation without a
registry reset. Pair comparison rejects mismatched seeds, input/fixture hashes,
driver/data/tool/fixture-byte identities, startup preparation and first-action
cadence where both units act. Later deaths/target choices/actions/RNG traces may
diverge after changed damage. The seed7 observed dodges therefore are not proof
of a changed hit formula.

## Evidence and validation

Retained evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-iron-golem-bc3r0les`.
Root owns retention; preserve these source/result/receipt artifacts for future
audit and review. Only inventoried task-owned `dist/` and `tmp/` are disposable
after all processes/readers release; the worktree remains claimed for the
umbrella implementation task.

| Artifact | SHA-256 |
|---|---|
| `mage-screen-source-manifest.json` | `c48c9dc0acbf7d6e1fe4546e0103a7051aebf265ab4698d5b614ffa804ffc674` |
| Shared driver bundle | `7824c2e4396975f66bedb04af54fc160cb34ca7ad1d84e2b0354108032dc1464` |
| Shared tool/config bundle | `91359ff2223eacdeb670e25111a23a510cd1ff3c422d21e6eb2f61d8ca4625a0` |
| Physical source bundle | `0354ae6fb9512dd9925e8640a9a9ca88724b2e6cdf2bcf421f12accdcbf29104` |
| Elemental source bundle | `9fd6ef1467666b542a72401f77c9c4ca9e653c70935d412f8ab34b1a41095ce7` |
| `mage-screen-fixture.json` | `430bc3f8961281fd7c34a0dbb98f8afc4ea3748da7e9d3fdf4687a2c81e8c9a9` |
| Logical fixture value | `84501b76e907c324e72f2f18785d9a2feba4f76859c453bc7bea3fe701b86d9d` |
| `mage-screen-physical.json` | `1783ac72ceec294c09e9a7926864652798573d3968a7553f2518f8509708f9a4` |
| `mage-screen-elemental.json` | `c6eddee3eff4b57134128c2798800bc27c04224996f47a80eff2301044519e98` |
| `mage-screen-comparison.json` | `69c71cd8b56f9bd23de37a82581f6711f41d7a12f1dc1043efb67e8d364f20af` |
| `mage-screen-source-config-completion.json` | `d6442890cc4975e870af3d89cf97954063976a7ba00a854a551685d3c18d75fa` |

`mage-screen-source-capture.py` plus `mage-screen-complete-config.py` reconstruct
both captures; `mage-screen-domain.mjs` performs `fixture elemental` once,
`run physical`, `run elemental`, and `compare elemental`, in separate processes.
The tool manifest records Node24.21.0, Vite5.4.21 and installed tool file bytes.
Config is disabled in Vite (`configFile:false`, `envFile:false`), watching/HMR
are disabled, and awaited `server.close()` runs in finally, including errors.
Raw events, timing hints and final teams remain in each result JSON.

Historical failures remain separate: fixture RED and runner RED each failed
collection with0tests; execution RED reached two pending-runner failures;
HP-reconciliation RED reached one expected missing-guard assertion. Initial
typecheck found strict indexed-access/JSON-cast issues, then passed after
correction. All15 focused tests pass, including synthetic overkill/heal/orb,
censored defeat/draw, zero duration, inconsistent-HP rejection and comparator
mismatch tests. The copied elemental result labeled physical in one test is
strictly a comparator contract input, never historical-engine evidence.

First external fixture generation failed on the omitted tsconfig.node.json
reference, closed its server, and wrote no fixture. Exact shared config was
then completed without changing gameplay source; the retry generated the only
fixture. Actual physical/elemental runs exit0 with clean logs. Comparison exits0
after successful pair checks but emits an esbuild "The build was canceled"
diagnostic during shutdown. Background dependency optimization is suspected;
the precise cause is unproven. Independent technical review found this a bounded
tooling limitation, not a measurement blocker. Retain the diagnostic rather than
claiming zero tool errors. Final standard validation and frozen independent
sign-offs are recorded in execution-ledger v1bi.

## Remaining acceptance

Run a separately frozen >=1000 paired seeds per retained scenario across legal
rank/cap/cycle and Mastery anchors, authored mitigation/resistance variation,
existing target-status interactions and legal summon coexistence. Current
production monster factory sets both dodge pools0.05; an asymmetry experiment
must be labeled synthetic sensitivity. No automatic Mage status or tuning may
be invented. Flag the observed >15% Mage throughput and >10% other-source
throughput drift for design interpretation; two-seed overkill/kill timing cannot
establish the global equal-investment invariants. Earned/on-zone campaign,
holdouts, BiS, reward/drop yield per hour, class averages and broader difficulty
acceptance remain separate. CombatSnapshot has no Normal/Nightmare/Hell selector;
do not manufacture one from act. No new save schema or Save11 behavior is implied.

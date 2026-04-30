# P05a — Engine module-state audit

**Wave A, sub-step P05a (audit, gating)** — input to P05b decision
(`isolate: false` vs `isolate: true` in the engine vitest project).

Worktree: `D2H5TextGame-wt/p05a` · Branch: `perf/test-p05a-engine-audit`
(off `integration/test-perf-waveA`).

---

## 1. TL;DR recommendation

**`isolate: false` is SAFE for `src/engine/**`** — no source change required.

Empirical pass/fail parity with `isolate: true`: 249 pass / 1 fail in both
modes; the one failure is a **pre-existing**, unrelated timeout
(`combat.test.ts > numbered enemy names > … suffixes A/B/C`) that
reproduces in isolation, on `integration/test-perf-waveA` HEAD,
`isolate: true` AND `isolate: false`. Not introduced by this audit and
not symptomatic of cross-test pollution.

Module-level mutable state exists but is **practically inert across the
test suite** — see findings below. Three soft recommendations for
follow-up tickets in §6 (none are P05b prerequisites).

---

## 2. Methodology

1. Read `src/engine/**` directory tree (49 non-test source files).
2. `Select-String -Pattern '^(let|var) '` across all engine sources →
   1 hit (`rollItem.ts`).
3. `Select-String -Pattern '^(const|export const) … = (new (Map|Set|WeakMap|WeakSet)|\{|\[)'`
   → 25 hits, manually classified (most are frozen/readonly literals).
4. `Select-String -Pattern 'globalThis\.|window\.|process\.env|require\(|EventEmitter|addEventListener'`
   → 0 hits in engine sources (one unrelated comment match).
5. Audited mutation pattern: which top-level `Map`/`Set`/`Object` are
   `.set / .delete / .clear / .push`-ed at runtime → 4 modules
   (`rollItem.ts`, `aliases.ts`, `registry.ts`, `summons.ts`).
6. Cross-checked every `*.test.ts` under `src/` for calls to the engine's
   reset / register helpers (`resetRegistry`, `resetAliases`,
   `resetSkillWarnings`, `resetSummonCounters`, `__resetRollItemSeqForTests`,
   `loadDefaultSkills`, `registerSkill`, `registerSummon`,
   `registerSkillAlias`) → only **counter resets** in `beforeEach`; no
   test mutates the global registry/alias/stub catalogs.
7. **Empirical smoke**: ran engine suite under both `isolate: true`
   (default `vitest.config.ts`) and `isolate: false` (temp config
   `vitest.config.engine-noiso.ts`, since deleted). Compared pass count
   and failure list verbatim.

---

## 3. Findings table

Module path                                        | Symbol                              | Class. | Evidence
--------------------------------------------------- | ----------------------------------- | ------ | --------
`src/engine/rng.ts`                                | _none_ (factory `createRng(seed)`)  | CLEAN  | All RNG state lives in closures returned by `createMulberry32`. No singleton. No `Math.random()`.
`src/engine/types/save.ts`                         | `MIGRATIONS: Record<number, …>`     | CLEAN  | Static literal; populated once at module load with arrow functions; never mutated.
`src/engine/combat/damage.ts`                      | `MISS: DamageOutcome`               | CLEAN  | Top-level constant literal, read-only.
`src/engine/combat/monster-factory.ts`             | `DEFAULT_ELITE_AFFIXES: readonly[]` | CLEAN  | `readonly`-typed, never mutated.
`src/engine/idle/{offline-bonus,online-tick}.ts`   | `NO_BONUS`, `EMPTY_REWARD`          | CLEAN  | Sentinel constants; not mutated.
`src/engine/items/computeStats.ts`                 | `ZERO_STATS`                        | CLEAN  | Used as a base via spread; never `.x = …`-assigned.
`src/engine/loot/award.ts`                         | `EMPTY: KillRewards`                | CLEAN  | Sentinel constant.
`src/engine/loot/drop-roller.ts`                   | `BASE_WEIGHTS`, `NO_DROP_CHANCE`, `DEFAULT_PICKS` | CLEAN | `Readonly<…>`-typed lookup tables.
`src/engine/loot/orbs-and-currency.ts`             | `RUNE_CHANCE`, `GEM_CHANCE`, `WISHSTONE_BY_TIER_AND_ACT`, `DIFFICULTY_MULT` | CLEAN | `Readonly<…>`-typed lookup tables.
`src/engine/map/unlock.ts`                         | `ACT_GATE_QUESTS`, `ACT_GATE_BOSS_SUB_AREAS` | CLEAN | `Readonly<Record<…>>` exports; never mutated.
`src/engine/progression/equipment-mods.ts`         | `ZERO_MODS`, `CORE_STAT_KEYS`, `STAT_MOD_KEYS`, `RESIST_TO_MOD_KEY` | CLEAN | Treated as read-only; the only mutating writes go to a fresh local `MutableEquipmentMods` per call.
`src/engine/progression/stats.ts`                  | `DEFAULT_RESISTS`                   | CLEAN  | Read-only literal.
`src/engine/skills/summons.ts`                     | `ZERO_RES`                          | CLEAN  | Read-only literal used via spread.
`src/engine/loot/rollItem.ts`                      | **`let itemSeq = 0`**               | **GREY** | Module-level monotonic counter; mutated by `nextItemId` (every `rollItem`) and `seedItemSeqFromIds`. Test helper `__resetRollItemSeqForTests` exists and is called from `beforeEach` in `rollItem.test.ts`. **No test asserts a specific seq value across files**, and the resulting item id always also embeds an rng-derived suffix. Cross-test impact under `isolate:false`: ids differ from a "fresh-module" expectation, but no assertion in the suite depends on that. Safe in practice.
`src/engine/skills/aliases.ts`                     | `aliases: Map<string,string>`       | **GREY** | Top-level Map; mutated by `registerSkillAlias` / `resetAliases`. **No code in `src/` ever calls `registerSkillAlias`** (`Select-String` confirms 0 hits outside this file). Map is permanently empty in production and tests; pattern transforms in `aliasToCanonical` are pure. Functionally inert today.
`src/engine/skills/registry.ts`                    | `registry: Map<string, RegisteredSkill>`, `warned: Set<string>` | **GREY** | Auto-populated once on import via `loadDefaultSkills()` (line 86). The default catalog (`DEFAULT_SKILLS` + `MERC_STUB_SKILLS` + `MONSTER_STUB_SKILLS`) is static and frozen literals — re-running `loadDefaultSkills` produces the identical contents. **No test calls `registerSkill`/`resetRegistry`/`resetSkillWarnings`** anywhere in `src/**/*.test.ts`. The registry is therefore effectively a frozen lookup table at runtime. The `warned` Set grows on first lookup of an unknown id (one `console.warn` per id, deduplicated), and one test (`aliases.test.ts > getSkill > returns undefined for genuinely unknown ids`) intentionally triggers a warn; no test asserts warn-count, so the dedup state is irrelevant cross-test.
`src/engine/skills/summons.ts`                     | `counters: Map<string,number>`, `FACTORIES: Map<string, SummonFactory>` | **GREY** | `FACTORIES` is populated once at module load with the four built-in templates (`skeleton`, `valkyrie`, `dire_wolf`, `minion`) and never written elsewhere — no test calls `registerSummon`. `counters` is a per-`(ownerId, summonId)` monotonic counter used to mint summon ids; three tests (`combat.test.ts`, `skill-resolution.test.ts`, `summon-resummon.test.ts`) call `resetSummonCounters()` from `beforeEach`. Cross-test pollution risk = zero given the resets.

**Summary:** 0 DIRTY findings. 4 GREY findings, all self-contained behind
test-only resets that are already wired to `beforeEach`, or behind
production code paths that no other module calls.

### Verifying "engine purity"

`Select-String 'react|react-dom|zustand|dexie|window\.|globalThis\.'` →
no hits in `src/engine/**`. Engine compiles to a Web Worker as
specified.

The one engine **test** file that breaks the rule for itself
(not engine code) is `src/engine/combat/combat.test.ts` line 435:
`await import('../../stores/combatHelpers')` — pulls in a zustand store
helper. This is the test that times out (see §4); it's a pre-existing
test-side bug (engine source is clean) and is filed as a follow-up
ticket below.

---

## 4. Empirical check (gating evidence)

Engine vitest suite — `npx vitest run src/engine` vs same with
`isolate: false` via temp `vitest.config.engine-noiso.ts`. Same Windows
host, sequential runs, warm caches.

Mode             | Test files | Tests | Pass | Fail | Vitest "Duration" | PowerShell wall
------------     | ---------- | ----- | ---- | ---- | ----------------- | ---------------
`isolate: true`  | 30         | 250   | 249  | 1    | 10.71 – 15.41 s   | 16.9 s / 26.4 s
`isolate: false` | 30         | 250   | 249  | 1    | 11.11 – 16.57 s   | 20.2 s / 47.9 s
**cold first run, `isolate: true`**  | 30 | 250 | 249 | 1 | 63.02 s | **70.9 s**
**cold first run, `isolate: false`** | 30 | 250 | 249 | 1 | 10.95 s | **20.2 s**

### Failures (verbatim)

Both modes report exactly one failure, identical:

```
FAIL  src/engine/combat/combat.test.ts > numbered enemy names > multiple enemies of the same template get suffixes A/B/C
Error: Test timed out in 5000ms.
```

Reproduces with `npx vitest run src/engine/combat/combat.test.ts -t "numbered enemy"`
in isolation (16 tests | 1 failed | 15 skipped | 5030ms). The test
dynamically imports `src/stores/combatHelpers.ts` (a zustand-region
file); the import takes >5 s on this machine. **Pre-existing**, not
caused by `isolate: false`. Not a state-pollution signal.

### Speedup interpretation

On **warm** runs the wall-clock delta between modes is within noise
(~5-10%) — the engine suite is dominated by vitest setup
(`environment`, `transform`, `setupFiles`) rather than test execution
(`tests` ≈ 5.5 s in both modes). Useful internal observation: the
`environment` cost (~30-60 s of wall, parallelised across workers) is
where `isolate: false` pays off, because environment isn't re-spun per
test file.

The **cold first run** delta is dramatic (70.9 s → 20.2 s, ~3.5×
faster). CI is always cold-ish (fresh runner, no fs cache), so
`isolate: false` is expected to deliver substantial CI savings even
though dev-loop iteration may not feel a difference once the OS file
cache is hot.

---

## 5. Recommended P05b decision

**Adopt `isolate: false` for the engine vitest project** — no
prerequisite source fixes.

Justification:
1. Audit found zero DIRTY module state; all GREY items are either
   test-only mutations already reset in `beforeEach`, or production
   code paths no caller invokes.
2. Empirical pass-count parity (249/249) with `isolate: false`. The
   one shared failure is unrelated (test-side dynamic-import timeout),
   reproduces with `isolate: true` too, and was inherited from
   `integration/test-perf-waveA`.
3. Cold-cache wall improves ~3.5× (CI win); warm wall is neutral.
   Even at zero warm-loop benefit the no-regression-no-fix path is the
   cheapest option.

Suggested vitest project config (for P05b implementer):

```ts
// vitest.workspace.ts (or projects[] inside vitest.config.ts)
{
  test: {
    name: 'engine',
    include: ['src/engine/**/*.test.ts'],
    environment: 'node',   // engine has no DOM dep — separate from 'jsdom' UI project
    isolate: false,
    setupFiles: undefined  // engine doesn't need src/test/setup.ts
  }
}
```

(Switching engine to `environment: 'node'` is independent of P05a's
finding but would compound the speedup; flag for P05b/P-other as
appropriate.)

---

## 6. Follow-up tickets (Wave B+, not P05b prerequisites)

These are real issues found during the audit but **none block adoption
of `isolate: false`**. File as separate tickets so they can be fixed
without coupling to test-infra work.

### FU-1 — `combat.test.ts` dynamic-import timeout (real bug, not flake)

`src/engine/combat/combat.test.ts:435` does
`await import('../../stores/combatHelpers')` to test a UI store helper
from inside the engine test project. This times out at 5 s on local
Windows; it almost certainly times out on CI too (recommend grepping
recent CI logs). Two issues stacked:

- **Engine purity violation**: the engine test reaches into
  `src/stores/**`. The helper under test is a UI/zustand concern; the
  test should live under `src/stores/__tests__/` (or wherever the UI
  project routes its tests), not under `src/engine/**`.
- **Functional bug or env**: regardless of placement, a 5 s import is
  pathological and should be debugged — possibly a circular import or
  an unintended large module graph load.

Owner: `frontend-dev` (test belongs to the UI domain). Suggested
priority: P1 — it's a CI-time cost and a layering rule violation.

### FU-2 — `aliases` map is dead code

`src/engine/skills/aliases.ts` exports `registerSkillAlias` /
`resetAliases` but **no caller in `src/**` ever invokes
`registerSkillAlias`**. The pattern-based `aliasToCanonical` resolver
covers every observed data id today.

Either delete the explicit alias map (and its `aliases.clear()` /
`aliases.set()` paths — eliminates one piece of mutable module state
permanently), or document the intended consumer. Owner: `engine-dev`.
Priority: P3 (cleanup).

### FU-3 — `registry`, `FACTORIES`, `itemSeq` are mutable singletons by convention only

The skill registry, summon factory map, and item-id sequence are
module-level mutable state with `__reset…ForTests` escape hatches. The
audit shows they're safe **today** because no consumer mutates them
post-load, but the pattern is fragile — a future feature that calls
`registerSkill` mid-game would silently produce cross-test pollution
under `isolate: false`.

Hardening options (any one is sufficient, listed cheapest first):

a. Freeze post-load: at end of `loadDefaultSkills()`, do
   `Object.freeze(registry)` semantics by wrapping in a
   `ReadonlyMap`-typed export and routing future writes through an
   explicit `withRegistry({ … }, fn)` test helper.
b. Convert to factory: `createSkillRegistry()` / `createSummonFactory()`
   returned from a single `createEngine({ data })` builder, owned by
   the caller. Same shape as `createRng(seed)`. Removes module-level
   state entirely; aligns with the engine's stated "factory not
   singleton" rule (rng.ts).
c. Same for `itemSeq` — fold into a small `ItemIdMinter` instance
   threaded through the loot pipeline.

Owner: `engine-dev`. Priority: P2 (defensive — only matters once
someone tries to register at runtime). This is the "rubber-duck #1
fix" hinted at in plan §P05; Wave A isn't asking for it because the
empirical evidence shows we don't need it to enable `isolate: false`
today.

---

*End of audit. No source files were modified.*

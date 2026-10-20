# BUG-034 — Compose authoritative hero configuration at wave boundaries

- **Status:** Reproduced; P07a01c2 source fix pending.
- **Severity:** High; allocated stats/passives and equipped gear do not reliably reach the next battle, and refresh can contradict an existing recording.
- **Owner / affected systems:** store integrator; combatHelpers hero composition, next-wave configuration and explicit replay input lifecycle.
- **Input:** `ef0a3b8`, source unchanged; new `src/stores/warmth-composition.test.ts` acceptance tests only.
- **Environment:** Linux, Node 24.21.0, Vitest UI project. Browser, viewport and locale are not applicable to this store/engine reproduction.
- **Seed:** 7 / challenge ordinal 0 for actual Blood Moor runs; direct composition uses no RNG.
- **Controlling contract:** `docs/plans/decisions/D05-warmth-recovery-v1.md`.

## Reproduction

1. Create an L1 Sorceress with imported base Energy190 and learned Warmth1.
2. Add and equip an explicitly synthetic rolled helm cap through actual inventory actions: +30Energy, +80life and +40mana. Keep current HP77/MP81. Supply deliberately stale cached maxima9999 and a legacy equipment decoy.
3. Call actual `playerToCombatUnit` and inspect stats and transient recovery/fire modifiers.
4. Separately allocate Energy199→200 through `allocateStatPoint` without manually recomputing the derived cache, then call the adapter.
5. Run real seed-7 Blood Moor recordings using a labeled synthetic finisher and durable equipped gear. Learn/upgrade Warmth, allocate Energy, equip/unequip, or remove all skillLevels during playback. Call default refresh and advance through actual playback/`advanceWaveOrFinish`.

```sh
npx vitest run src/stores/warmth-composition.test.ts --reporter=dot --silent
```

Initial two-test RED at **2026-10-20 08:40:53 UTC**: exit1,2failed/0passed,
2.49s. Expanded five-test RED at **08:41:35 UTC**: exit1,5failed/0passed,
2.91s. Only the new test file changed; no production source fix was present.

## Expected and actual

Expected: 220raw Energy softcaps once to210; rate43.68 and fire.01 come from
actual authored coefficients. Fresh maxima are200/405, stats attack22/defense27,
and current pools remain77/81, newrun carry/compensation0. Energy200 derives
manaMax350/rate40 even before cache recomputation. Ordinary config edits freeze
the current team/events/outcome/cursor and apply automatically to the actual
next wave. Missing levels explicitly clear learned state and bonuses. Existing
resources carry/clamp without free healing; replay always starts from original
wave-input pools/carry/status clocks, including shrink/expand configuration.

Actual: the adapter copies stale stats/maxima9999, emits no recovery/fire/carry
fields, and the Energy-allocation case retains manaMax102 instead of350.
Default refresh mutates the playback team's skill config underneath unchanged
events/outcome; next-wave units retain old level/stats/modifiers. Entirely absent
skillLevels retains previously learned levels via conditional merging. These
are executed state failures, not an event-count or screenshot proxy.

## Root cause and bounded correction

`playerToCombatUnit` trusts `player.derivedStats`; allocation updates core only.
`playWave` uses a previously captured team without pulling authoritative current
inventory/core/levels. Default refresh mutates playback config, and conditional
spreads retain removed keys. Compose fresh stats/modifiers at the production
boundary. Preserve the original/rebased input baseline across replay, using a
local refreshed battle input; only qualified advancement replaces that baseline.
Keep legacy weapon eligibility, saves, tuning and other passives outside scope.

## Evidence and workaround

Durable regressions are in the new adapter suite, alongside existing cross-wave
clock/replay tests. Full RED, independent review and final resolution will be
appended before source integration. No reliable player workaround substitutes
for automatic next-wave composition; restarting does not repair stale derived
input. Imported gear/finisher fixtures prove boundaries only, not earned power,
campaign balance, mana recovery runtime or ordinary browser acceptance.

Security check: **PASS**. Trusted deterministic local stats/resources; no new
network, credentials, dependencies, permissions, save format or validation bypass.

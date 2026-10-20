# BUG-034 — Compose authoritative hero configuration at wave boundaries

- **Status:** Fixed in `1860bc6` for the bounded adapter/lifecycle contract; recovery, fire and browser acceptance remain open.
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

## Final pre-source acceptance baseline

After tests-only fixture prerequisite `9ae162e`, final RED at
**2026-10-20 08:46:15 UTC** ran the new suite plus existing main/cross-wave
suites: **56 total, 13 failed, 43 passed, zero pending**, real4.48s, exit1.
New suite13:10fail/3pass; cross-wave16:2fail; main27:1fail. Typecheck passed.
Actual adapter source remained unchanged. Producer and QA independently read
all three test diffs and raw JSON: APPROVE / ADEQUATE before implementation.
Ordinary learn/upgrade/Energy/equip/unequip/absent-level/respec paths advance
without a manual refresh. Separate tests pin default-refresh frozen state and
explicit replay. Cross-wave tests retain whole-unit L2 stats/resource/status/
cooldown/buff comparisons and real geared AS263 action400/800ms controls.

L4 imported carry fixture pins original MP400/max405/carry.75, shrink335/carry0,
expand405→original400/carry.75. Carry injection is a labeled adapter boundary;
continuous recovery is still stagef. The initial completed-MP expectation
incorrectly assumed spending necessarily lowered400; actual kill orbs cap the
completed result405. Corrected that test-only oracle to405 while replay input
stays400, with no source change. Prior actual outcome references are retained
and checked for immutability after repeated replay.


## Resolution and reviewed evidence

`1860bc6` composes authoritative equipped/core/derived configuration on every
wave entry, explicitly clears removed learned state, freezes ordinary current
recordings and replays from original wave-input resources. Four source/test
files; independent producer and QA APPROVE / ADEQUATE. Genuine final RED above
preceded the production change. Two incorrect GREEN expectations were corrected
with independent review: L4 expanded mana is62+216×1.5+134=520; after unequip and
re-equip the fresh persistent pool metadata is144/335 while original runtime
HP190/MP400/carry.75/compensation.125 must be restored. Full recording equality
still pins all other state and actual retained prior outcomes stay immutable.

Final checks on the accepted source and immutable expected-object correction:

- Focused three suites56/56 (3.730s); final full includes the corrected oracle.
- `npm run test:related -- src/stores/combatHelpers.ts
  src/stores/combatHelpers.replay.test.ts
  src/stores/combatHelpers.idle-bonus.test.ts
  src/stores/combatHelpers.outcomes.test.ts src/stores/quest-area-clear.test.ts
  src/stores/quest-npc-talk.test.ts --reporter=json ...`:464/42files,23.263s.
- Engine742/47files,5.181s; full1602/124files,31.069s; all zero pending/failures.
  Engine overlapped the tail of related/typecheck; timings do not establish
  isolated performance. Engine/related/full budgets remain unmet.
- Final typecheck, lint, production build5.63s and diff-check passed. Existing
  Browserslist, large chunk and optional manifest precache warnings remain.
- Extra full-run store coverage diagnostic:1602 tests passed40.49s, but command
  **exited1**:77.9%branches below inherited80%. Normal configured80%coverage
  targets engine files and explicitly excludes UI/store; this CLI target
  override is a diagnostic, not a new store gate. No threshold was changed.
  combatHelpers658/688 statements,20/21functions,134/172branches; all43 changed
  statement locations hit,17/24 changed branch locations hit. Unhit new
  alternatives are defensive defaults for populated current-adapter fields.
  Raw SHA256`dbb75b64da03598b76811cc729ec27582c00e7fbb701d7de2648cafe98a3d477`
  independently consumed by both reviewers before cleanup.

Raw command suffixes used JSON output under `/tmp/d2h5-root-warmth-c2-*`.
Coverage command was `npx vitest run --coverage
--coverage.include=src/stores/combatHelpers.ts
--coverage.reportsDirectory=coverage/p07a01c2 --reporter=dot --silent`.
The diagnostic failure is retained; coverage is not reported green.
Continuous recovery, passive action exclusion, fire damage, mana event playback,
earned UI/browser/save proof and true resource-bar maxima remain later stages.

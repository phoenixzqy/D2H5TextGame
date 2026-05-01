# Bug: Merc `initialProgress()` ignores merc level — first XP share can spuriously level-up

- **Status**: open
- **Severity**: medium (gameplay correctness; test flake symptom)
- **Owner suggestion**: engine-dev (`src/stores/mercStore.ts`)
- **Found by**: qa-engineer (Wave C carryover, perf/rootcause-quarantined-flakes)
- **Quarantined test**: `src/stores/combatHelpers.test.ts` —
  `startSimpleBattle — Bug #12 > shares combat victory XP with the fielded merc`

## Reproduction

1. Check out `perf/rootcause-quarantined-flakes`.
2. Un-`.skip` the test at `src/stores/combatHelpers.test.ts:521`.
3. Run 10× in isolation:
   ```pwsh
   for ($i=1; $i -le 10; $i++) {
     npx vitest run src/stores/combatHelpers.test.ts -t "shares combat victory XP" --reporter=basic
   }
   ```

### Observed failure rate

**3 / 10 (~30 %)**, matching the historical "1/3 flake rate" note in
`CHANGES.md` and `docs/perf/test-bench.baseline.json`.

### Failure signature

```
AssertionError: expected +0 to be 60 // Object.is equality
  at .../combatHelpers.test.ts:534
expect(useMercStore.getState().getMercProgress(merc.id).experience)
  .toBe(Math.floor(expectedXp * 0.75));
```

The merc's `.experience` is `0` instead of the expected share
(`Math.floor(expectedXp * 0.75)`).

## Root cause (evidence-backed)

The test:
1. Adds a level-10 merc via `buildMerc({ level: 10 })` and `addMerc(merc)`
   — this creates the merc but **does not write a `mercProgress[mercId]`
   entry**.
2. Fields the merc and runs `startSimpleBattle(1, 3)`.
3. After victory, `advanceWaveOrFinish()` calls
   `useMercStore.getState().shareExperienceWithFielded(xpGained)`
   (`src/stores/combatHelpers.ts:396`).
4. `shareExperienceWithFielded` → `addExperience(id, share)`
   (`src/stores/mercStore.ts:326-332`) where
   `share = floor(xpGained * 0.75)`.
5. Inside `addExperience`:
   ```ts
   let progress = state.mercProgress[mercId] ?? initialProgress();
   ```
   `initialProgress()` (line 175-178) returns:
   ```ts
   { experience: 0, experienceToNextLevel: mercXpForLevel(1) }  // = 60
   ```
   — **hardcoded to level 1, ignoring the merc's actual level**.
6. The level-up loop:
   ```ts
   while (xpRemaining >= progress.experienceToNextLevel) {
     xpRemaining -= progress.experienceToNextLevel;
     level += 1;
     progress = { experience: 0, experienceToNextLevel: mercXpForLevel(level) };
   }
   ```
   With threshold = 60 (not the correct `mercXpForLevel(10) ≈ 6360`):
   - If `share < 60` → no spurious level-up → test passes.
   - If `share ≥ 60` → spurious level-up → `xpRemaining` reduced by 60,
     then exits loop because `mercXpForLevel(11) ≈ 8268`. Final
     `progress.experience = share - 60`, NOT `share`.

The test's `expectedXp` is computed from the actual slain enemies, so it
varies with the seed-driven wave roll (3–8 enemies, each ~10–20 XP).
When the roll produces `expectedXp ≥ 80` → `share ≥ 60` → spurious
level-up → assertion fails. Roughly 30 % of seeds.

When `share == 60` exactly, `experience` ends at 0 (matches the
observed `expected +0 to be 60` failure).

## Why this is a real bug, not just a test issue

In live play, any merc bought at the merc shop above level 1 (e.g., the
shop scales merc level with player level) will, on first XP gain,
"complete" a phantom 60-XP first level and gain a free level-up
(`level += 1`, +life/+stats per `getPerLevelGain`). This is silent and
not exposed in any UI we currently have, but it is a correctness defect
in the progression system.

## Proposed fix scope (>30 min — refactor)

1. **mercStore**: replace bare `initialProgress()` defaults at lines 281
   and 324 with `initialProgressForLevel(merc.level)`:
   ```ts
   function initialProgressForLevel(level: number): MercProgress {
     return { experience: 0, experienceToNextLevel: mercXpForLevel(level) };
   }
   ```
   `getMercProgress` needs the merc lookup to know the level (or the
   contract needs to ensure `addMerc` always writes an initial progress
   entry — a cleaner fix).
2. **Preferred**: extend `addMerc` (`src/stores/mercStore.ts`) to
   pre-populate `mercProgress[merc.id]` on insert, so all read paths see
   a correct entry. Then `initialProgress()` becomes a defensive fallback
   only.
3. **Save/load**: existing saves where the merc has no `mercProgress`
   entry need a migration on load — set `experienceToNextLevel =
   mercXpForLevel(merc.level)`. Bump save schema version.
4. **Test coverage**:
   - Unit test on mercStore: `addMerc({level: 10})` → `getMercProgress`
     returns `experienceToNextLevel === mercXpForLevel(10)`.
   - Unit test: `addExperience(mercId, mercXpForLevel(10) - 1)` does
     not level up.
   - Re-enable the quarantined integration test once the fix lands.

Estimated effort: ~1.5 h (code + migration + tests + reviewer cycle).
Out of scope for the 30-min surgical timebox.

## Owner

`engine-dev` — touches `src/stores/mercStore.ts` (production state) and
the save migration path.

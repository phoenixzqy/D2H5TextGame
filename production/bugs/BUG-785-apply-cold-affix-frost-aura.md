# BUG-785 — Apply Cold Enchanted passive Frost Aura

Status: fixed locally and verified; uncommitted (2026-11-05).
Severity: Medium. A promised random-affix mechanic is absent; combat still runs.
Owners: root (content/engine integration), solo under existing v1 authorization.

## Reproduction

2026-11-05, Linux/WSL, Node/Vitest, branch `feat/playable-foundations`,
HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited uncommitted changes.
Engine reproduction is browser/viewport/locale independent; seed 7.

1. Select the actual `elite-affix/cold-enchanted` from the default elite config.
2. Build a native Fallen champion or rare elite with `buildEnemiesForWave`.
3. Inspect the resulting passive metadata and advance combat through five seconds.

Expected: monster-spec §9's 15 cold damage per elapsed turn, using the existing
five-second passive Frost Aura mechanism and two-second Chill. Existing Frost
Nova and the recently repaired cold resistance remain.

Actual: both native units have no `frostAura`; only active Frost Nova is appended.
Two causal REDs report undefined instead of the expected passive metadata.

## Evidence and cause

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-cold-affix-aura-4m1h0abv`.
`red.json`/`red.log` retain the two failed native assertions in
`src/stores/combatHelpers.affix-aura.test.ts`. An attempted report read before
the running test completed found no file; the same live handle was polled to
exit 1 before inspecting the final failures. No test restart or false RED credit.

The engine already schedules immutable `CombatUnit.frostAura` metadata. The
elite schema/type/data and factory override path cannot currently supply it.
Fix that missing data channel rather than modifying the passive scheduler or
inferring behavior from the affix ID. No player workaround.

## Resolution

Optional strict affix metadata now flows through the native factory, validates
before RNG and is copied immutably. Only Cold Enchanted authors the passive;
existing archetype aura defaults, Frost Nova and resistance remain intact.

All 98 cases across eight explicitly affected files pass. Final strict scoped
types (930 imported files), eight-file lint and the six native aura cases pass.
Four Chromium cases render the actual localized CombatLog at mobile/desktop
sizes with the native party pulses and no console/network errors or overflow.
Initial fixture/type/lint failures remain retained and documented; no weakened
assertions or suppressions. Root self-review only; no balance acceptance.

See `docs/plans/evidence/p15-cold-elite-frost-aura.md` for exact scope and limits.
All handles are terminal; packet cache is removed and browser process/port are
closed. Root retains the named evidence packet through full-v1 acceptance.

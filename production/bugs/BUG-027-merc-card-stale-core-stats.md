# BUG-027 — Show earned mercenary core stats

- Status: fixed and validated in P13b; root/producer final review APPROVE.
- Severity: Medium (visible progression stays stale; export exposes real stats).
- Owner: frontend-dev; QA reproduction/root P13b.
- Build:7e5dcf8,2026-10-20, actual MercsScreen/store in Vitest1.6.1/jsdom,
  default zh-CN. No physical-browser/viewport claim from this unit reproduction;
  production en/zh×1280×800/360×640 acceptance is recorded below.
- Engine seed: not applicable to this direct304XP store-award reproduction.
- Contract: docs/plans/p13b-earned-mercenary.md.

## Reproduction and evidence

1. Create actual authored InnerSightL3 via factory/store with explicit canonical
   progress0/304, isolating display from the P13a defaults defect.
2. Mount real MercsScreen. Initial core12/22/16/14 is correctly shown as STR12,
   DEX22,VIT16 for a known definition.
3. Call real addExperience(304). It returns one level gained/L4 and actual
   owned core becomes13/25/16/15 without remounting.
4. Observe the card: expected STR13/DEX25/VIT16; actual STR12/DEX22/VIT16.
5. Repeat with the same valid entity under an unknown legacy definition ID:
   actual STR/DEX/VIT are dashes even before leveling.

Genuine RED before runtime change:

```sh
npx vitest run --project ui src/features/mercs/MercsScreen.live-stats.test.tsx --reporter=dot --silent
```

2026-10-20 07:01:56UTC,2failed/1file,3.70s. Known-definition case reached the
real level/stat assertions then failed `STR13` vs `STR12`; unknown-definition
case failed initial `STR12` vs `STR-`. Regression file retains the exact
reproduction; no disposable log or screenshot is needed for this DOM assertion.

## Expected, cause and scope

Display the current owned mercenary core strength/dexterity/vitality, including
earned gains and valid entities without a definition. MercCard currently binds
these cells to def.baseStats and renders dashes when def is absent. Level/XP
already use live runtime values, causing a misleading mixed display.

Bind only existing stat cells to merc.coreStats. Preserve layout/labels,
definition-based art/lore/skills, equipment behavior, gain/XP/cost policy and
save schema. This is not equipment-adjusted total-stat UI. Workaround: exported
backup contains the actual earned values. Full earned progression requires the
separate ordinary production path in the P13b control, not this direct award.

Security check: pass; trusted local UI/store binding, no credentials/network/
permissions/remote writes/CI/agent-behavior change.

## Fix and validation

Existing stat cells now read owned merc.coreStats, including unknown-definition
entities. Both real mounted threshold-crossing regressions pass without remount;
the existing MercsScreen suite also passes (7 tests across2files,3.97s).

Fresh guarded production browser acceptance:4/4pass1.1m, en/zh-CN at1280×800
and360×640. Ordinary hire/field, three qualified first-wave wins, exact earned
L3→L4 stats/XP, Save and actual close/reopen preserve complete saved payload.
Full unit1292pass/113files/no skips32.31s (15s budget unmet), typecheck/lint pass.
Detailed route, commands, limits and cleanup:
docs/plans/evidence/p13b-earned-mercenary.md. No schema or stat-gain changes.

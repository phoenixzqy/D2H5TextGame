# BUG-306 — Observe actual combat HP and capture the mobile enemy section

Status: Open — test/evidence defect; no product behavior inferred from missing observations.
Severity: Medium — the passing combat matrix cannot establish absolute hero HP or complete mobile visuals.
Build: 8709a8db71235715ce6d5fcb49f3f61e578308aa; production build VITE_E2E unset.
Environment: Chromium desktop1280×800 and mobile360×640 touch emulation, en/zh-CN. Constructed public imported level30 Assassin. Fixed date2026-10-27T12:00:00Z; a fixed engine seed is not needed to reproduce this DOM/capture defect, and this observer does not pin or modify it.

## Reproduction

1. Run retained charge-combat.public.spec.ts / charge-combat-matrix.public.config.ts at the recorded frozen source. The original matrix passes24/24 in1098.951s with all2524repository/765external inputs and HEAD unchanged.
2. Decode rank1-combat-proof/rank20-combat-proof attachments: all48proofs have no finite absolute hero HP observation.
3. Inspect each original mobile rank1/rank20 battlefield capture: all24show the ally grid/fixed navigation and a black lower area; no visible enemy section.

Expected: if acceptance claims hero HP changes or mobile enemy/discharge visuals, the evidence must observe those real controls and capture the relevant visible areas.
Actual: sample() queries [role=group][aria-label=HP/生命], which does not exist. CombatScreen exposes a grouped MP bar only. Compact UnitCard hero HP is a visual width; unlike regular GameCard it has no absolute resource progressbar. Element screenshot extends below the app's scroll viewport/fixed nav and does not visibly capture enemies.

Evidence: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-charges-zt17emhc/charge-combat-matrix-attachment-audit.json; combat-matrix-visual-inspection.json lists24individually inspected originals and exact hashes; combat-matrix-captures/. Source: src/features/combat/CombatScreen.tsx Battlefield/compact UnitCard; src/ui/GameCard.tsx ResourceBar; retained public observer and report attachments.
Affected systems: qa-engineer/frontend-dev/accessibility-specialist; root sole executor.
Root cause: observer assumes the regular resource-group structure for a compact card; capture assumes a tall element screenshot covers content outside the scrolling app viewport.
Workaround: scope current evidence to actual log/MP/enemy-DOM observations; do not claim absent absolute HP or mobile visuals. Capture relevant sections after real scrolling and require finite observations in a corrected test. A product accessibility improvement should expose truthful compact resources rather than injecting test-only state. Re-run only the affected cases after the source/observer correction; preserve originals and do not weaken positive discharge/resource assertions.

Current valid matrix evidence remains24cases/48rank combat proofs/48exact seven-domain save pairs/24actual offlineContinues. Cobra HP recovery is visible in actual positive combat log rows; positive victim MP transfer is independently unresolved under BUG304. No whole-mobile/a11y, earned, independent or skill acceptance is granted here.

## Compact HP source correction — browser verification remains open

5eb3948d adds the actual localized HP progressbar and names each unit group in
src/features/combat/CombatScreen.tsx. The regression
src/features/combat/CombatScreen.compact-health.test.tsx covers live fractional
HP/max (including stale stats.life), all four unit kinds and death in both
locales. Original compact-health-red two failures become part of the complete
compact-health-branch201/20 PASS; scoped strict types and lint pass.

No layout or combat resource behavior changes. A corrected production observer
and visibly scrolled mobile ally/enemy screenshots are prepared but not yet
executed here. This bug remains open until those missing observations exist;
original charge matrix observations/captures are preserved.

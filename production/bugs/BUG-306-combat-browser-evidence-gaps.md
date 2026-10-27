# BUG-306 — Observe actual combat HP and capture the mobile enemy section

Status: Resolved locally — source compact HP correction and corrected charge-specific production evidence verified; whole-app mobile/a11y and independent acceptance remain open.
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

## Subsequent trap verification — original charge evidence remains deficient

The full trap actual-combat matrix at33dc3239 now passes32/32,64rank proofs with
finite actual HP/MP,64exact seven-domain pairs and32actual offline Continues.
Separate actual viewport scrolling captures real visible ally and enemy sections.
Exactly12of64mobile originals are individually inspected and hashed in
trap-red/combat-matrix-audit.json; fixed-nav clipping and lower rows outside the
viewport remain. BUG309 records broken Blood Lord art. No whole-app mobile/a11y
or physical-touch acceptance is granted.

This validates the common compact-HP source correction for these trap contexts.
The historical charge24-case matrix was not rerun: its48absent absolute-HP
observations and deficient original mobile captures remain unchanged. This bug
therefore stays open for charge-specific evidence; no retroactive fill or claim.
See docs/plans/evidence/fixtures/assassin-traps/integration-followup.json.

## Charge-specific verification — 2026-10-27

The corrected observer at frozen30c93621 now passes24/24 cases619.717s with
all2549repository/768external inputs and HEAD unchanged, no retries/skips/page
warnings/errors. It reads actual compact unit HP aria-valuenow/max, rejects
absent/nonfinite values, and requires positive hero and enemy HP loss. All48
rank1/20 proofs have finite bounded hero HP/MP and enemy HP, alongside the
original positive typed discharge/MP assertions. All48exact seven-domain save
pairs and24actual service-worker offline Continues pass. Both locales and
desktop1280×800/mobile360×640 use the original six-builder fixture/rules.

Actual scrolling and viewport/foreground assertions precede separate ally/enemy
viewport captures. The audit decodes240original attachments/96PNGs. All24mobile
rank1/20 enemy originals and all12mobile rank20 ally originals were individually
viewed and hashed. Relevant cards are visible, including lower Phoenix20 enemies;
fixed-nav clipping of other rows/effects, heading truncation and missing glyphs
remain. Desktop and rank1 ally images are not claimed visually inspected.

The original48missingHP/24deficientcaptures remain unmodified historical evidence.
The new proof resolves this scoped observation/capture defect, not whole-app
mobile/a11y, physical touch, earned balance, independent QA or skill acceptance.
Cobra victim MP remains BUG304. [Receipts, exact hashes and verified retention](../../docs/plans/evidence/fixtures/assassin-charges/compact-hp-checkpoint.json).

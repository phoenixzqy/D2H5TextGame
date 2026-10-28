# BUG-352 — Select the Side tab before the browser side Claim

Severity: Low. Status: Fixed in retained v3 browser harness; final production matrix and integrated checks pass.
Owner: root QA/browser harness. Affected systems: task-local Charsi browser matrix.

## Reproduction

Base988883ee plus final uncommitted Charsi snapshot0c42e4f448b55e55db4a3493c825ef24a0d843343a0316c443ba798eb54a3a94. Native production Vite build, Playwright Chromium, English360×640. Constructed imports only; no earned gameplay or seed-dependent failure.

1. Execute task-local charsi-browser.prepared.mjs through run-charsi-browser.py.
2. Recover/Give Malus, Claim main and Present the normal item, saving/closing/Continuing at each stage.
3. Navigate to Quests and locate the Charsi side Claim without selecting Side.

Expected: the harness selects the Side tab, then executes the side Claim.
Actual: Quests defaults to Main. The side card is absent, so geometry waits30seconds and times out. The original failure DOM contains Main cards; stored and continued saves contain the correct completed side objective and Present receipt. No product defect is established.

Evidence root: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-imbue-db_hdus5. Preserve charsi-browser.log/native receipt and browser-charsi/en-360-failure.png/.txt, plus the exact four persisted pairs reached before failure. The owned preview exited and port39662 closed. The remaining matrix and level-up browser cases were not run.

Correction: select the localized Side tab through its accessible role before locating the side Claim. Preserve the original script/output and use distinct corrected-run names; do not extend timeouts or change game code.

## Correction and final verification

The corrected retained `charsi-browser-v3.mjs` selects the localized Side tab
through its accessible role before locating the side Claim. No game-code
correction or timeout extension was needed. Final product checkpoint
`8b72ca433a7537fe3db189fb9b844797b278abea` passes8Charsi browser cases and
4localized level-up cases, with64exact persistence pairs. Native full20,656/977
passes with twoexistingoptinskips and all frozen inputs unchanged. Independent
artifact and combined reviews APPROVE; the original failed script/output and
partial pairs remain retained alongside V2/V3, never relabeled as passing.

[Final evidence and exact retained paths](../../docs/plans/evidence/d11-charsi-selected-imbue.md)
records the verified archive and exact raw-root cleanup. No earned/balance or
full-v1 acceptance is claimed.

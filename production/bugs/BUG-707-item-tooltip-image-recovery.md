# BUG-707 — Recover failed item-tooltip artwork on reconnection

- Status: Locally fixed; source-browser verification complete. Independent/production-PWA acceptance remains open.
- Severity: Medium; inspection text works, but artwork stays broken until remount.
- Owner: frontend-dev (item inspection/shared artwork).
- Requirement: work-plan P05/P16/P17; playable-target G5, readable fallback and image recovery.
- Source: `feat/playable-foundations`, HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local changes.
- Environment: installed Chromium 147.0.7727.15, Linux/WSL, zh-CN, 360×640; native source component harness.
- Seed: not applicable; no combat or RNG operation.

## Reproduction

1. Render the production `ItemTooltip` with unchanged earned Leaf `it-1j88u-vwd`.
2. Abort its authored `/assets/d2/generated/item-icons/items.base.staff.png` request as disconnected.
3. Allow that URL, then switch the actual browser context offline and online while keeping the tooltip mounted.

Expected: readable fallback on failure; one retry at the same authored URL on reconnection, with healthy artwork remaining mounted.

Actual: the plain `img` remains broken (`complete=true`, `naturalWidth=0`), no fallback replaces it, and total requests stay at one after reconnection. A neighboring shared image stays healthy. The item fixture is unchanged; no crafting, combat, import or save operation runs.

Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-tooltip-recovery-ah2ykrm1/reproduction.json`, `before-reconnect.png`, `after-reconnect-still-broken.png`. The earlier harness-CWD/Tailwind observer failure is separately retained as `reproduction-observer-failure.json`; it is not defect evidence.

Root cause: `src/ui/ItemTooltip.tsx` renders a bare image instead of the existing `GameImage`, bypassing its source-keyed fallback/reconnection handling.

Workaround: close and reopen item inspection after reconnecting.

## Local resolution, 2026-11-04

`ItemTooltip` now uses `GameImage`, preserving the 80px frame, authored URL and contain fitting. Shared source-keyed fallback/reconnect handling applies without another retry implementation or API/save/data changes.

The new integration test fails before the edit because the failed image remains mounted. An earlier fixture failure is retained: the mocked sword lacked `weaponType`; adding its real metadata produces the legitimate RED before production changes. All 12 affected tooltip cases, explicit two-file lint and scoped strict types pass.

Four Chromium source-browser cases (zh-CN/en, 360×640/1280×800) each verify fallback, failed reconnect retry, successful same-URL recovery, exactly three requests, unchanged details/fixture, healthy/recovered node stability and no overflow/page errors. Two deliberate disconnected requests per case are the only console/resource failures. Mobile fallback and English recovered captures were visually inspected.

`checks.json`, `browser-verification.json`, `source-closure.json`, `cleanup.json` and `manifest.json` retain scope and evidence in the packet above. All 20 recorded task PIDs and seven disposable paths are absent. Root retains the evidence through umbrella review, then owns exact cleanup and human2 release. No commit or whole-app/PWA/balance acceptance is claimed.

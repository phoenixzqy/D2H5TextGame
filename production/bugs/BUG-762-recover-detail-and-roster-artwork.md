# BUG-762 — Recover inventory detail and mercenary artwork

- Status: Fixed locally, uncommitted at the stated HEAD plus local changes.
- Severity: Medium — item/mercenary text and actions remain usable; reopening the surface works around failed artwork.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local changes, branch `feat/playable-foundations`.
- Environment: Vitest UI project, jsdom, real React inventory/mercenary components; Chromium 147.0.7727.15 at 360×640 and 1280×800. Locales: en and zh-CN. RNG seed: not applicable.
- Plan requirement: F19 in `docs/plans/feature-coverage.md` — consistent artwork across surfaces and failure → recovery.
- Affected systems: frontend-dev; `ItemDetailPanel`, hire and owned portraits in `MercsScreen`.

## Reproduction

1. Render an authored item in inventory detail, or an authored mercenary in the hire/owned roster.
2. Fail its image request (the regression dispatches the browser image error event).
3. Keep the surface mounted and reconnect at the unchanged source URL.

Expected: failed artwork becomes a bounded decorative fallback; reconnection retries the same URL. Healthy neighboring images stay mounted. Selecting a different item immediately loads its own artwork.

Actual: the failed raw `<img>` stays mounted. These sites have neither an error handler nor the shared reconnect recovery boundary.

## Evidence

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-roster-detail-art-ae079zvi`.
`red.json` records eight failed assertions at the unchanged failed-image check across both locales; `red.log` records the command result. Exact preimages are in `baseline/`.

Regression files: `src/features/inventory/ItemDetailPanel.image-recovery.test.tsx`, `src/features/mercs/MercsScreen.image-recovery.test.tsx`.

## Root cause and repair

Three production artwork sites bypass the existing shared `GameImage` boundary. Reuse that component rather than adding timers, URL cache busting or another retry policy. Keep authored source resolution and all gameplay state/actions intact.

Implemented: all three sites now use `GameImage`; the shared component and recovery hook remain byte-identical. Item art keeps containment/64px dimensions; mercenary art keeps top fitting and decorative semantics. Existing localized names and actions remain independent of artwork.

Verification: eight causal RED cases; 27 selected GREEN cases across five files; scoped strict TypeScript (643 files, zero diagnostics) and four-file ESLint pass. Eight bilingual mobile/desktop Chromium cases cover 12 surface observations with decoded same-URL recovery, item selection after failure, retained healthy neighbors, stealth visibility and no horizontal overflow. No unexpected console/page/network failures or pending requests. The initial browser observer incorrectly included the decorative `?` in its content equality check; its script/result are retained, and the corrected observer excludes that glyph only. See `docs/plans/evidence/p16-detail-roster-art-recovery.md`.

Owner: root, working solo. Retain the packet through full-v1 acceptance; root owns eventual removal. No campaign, retry/sample allowance or CI work is involved.

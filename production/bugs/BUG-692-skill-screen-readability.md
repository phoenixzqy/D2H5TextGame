# BUG-692 — Restore readable skill-screen text and combo inputs

- Status: Resolved locally, uncommitted; bounded screen verification complete.
- Severity: Medium.
- Owner: frontend-dev / accessibility-specialist (root continuation).
- Affected systems: SkillsScreen tree summaries, rank badges, detail statistics,
  requirements, level banner and combo selectors.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained local changes.
- Environment: Chromium 147.0.7727.15, ordinary Vite development mode with
  VITE_E2E unset; 360×640; zh-CN. No engine seed applies.

## Reproduction

1. Start a disposable Sorceress through New Game and open Skills.
2. Read the level banner, tree instructions, rank badges and selected skill's
   current/next attributes and requirements.
3. Open the active/combo tab and inspect all nine selectors.

Expected: body/helper text at least 14px and selectors at least 16px, readable
without zoom; critical controls remain reachable at the required sizes/locales.

Actual: 65 text nodes in the tree/detail view are 10–12px; combo view has two
12px labels and nine 14px selectors. All measured controls already meet 44×44px;
no document/main overflow or navigation overlap occurs in this reproduction.

Cause: local text-xs/text-[10px] classes and text-sm on selectors in
`src/features/skills/SkillsScreen.tsx`.

Workaround: browser zoom. This does not meet the intended mobile readability.

## Evidence

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-skill-readability-5357g9g2`.
`red-browser.json` records both failing cases and zero console/page errors;
`red-zh-CN-fresh-tree.png` and `red-zh-CN-fresh-detail.png` show the original UI.
`before-SkillsScreen.tsx` preserves the source. Initial observer also measured
shared ScreenShell navigation; its v1 executable/results remain retained.
`observer-amendment.json` records narrowing text/control ownership to main while
keeping global overflow/navigation-overlap checks. No production edit preceded
either reproduction.

## Resolution

Eleven presentation class changes in SkillsScreen restore 14px text and 16px
combo selectors, with opaque rank-label backgrounds. No event handler, game
data, skill formula or save behavior changes. Baseline HEAD remains the SHA
above; there is no new commit.

Final executable `check-skills.cjs` passes 26 layout/readability cases and two
keyboard flows: zh-CN/en, fresh and imported learned/unlearned skill states;
360×640, 412×915, 640×360, 1280×800 and 1920×1080 for the mature view. Minimum
measured font 14px, selector font 16px, contrast 5.706012:1; no undersized
controls, document/main overflow, navigation overlap, unreachable requirements
or final combo selector, page errors or captured console warnings/errors.
Six selected existing SkillsScreen tests pass; 38 unrelated cases were not
selected. Scoped strict types and explicit source lint pass. No tests added
for this presentation-only change; browser reproducer and screenshots are
retained as the regression evidence.

The first mature English observer failed because native import restored the
backup's Chinese locale. Original executable/result/log and the correction
remain in `v2-*` and `observer-locale-amendment.json`; selecting the case locale
through Settings fixes the observer. The exact imported backup is unchanged;
there is no earned campaign or balance credit.

See `docs/plans/evidence/p16-skill-readability.md` for review and cleanup.
Full P16/private-v1 and independent acceptance remain open.

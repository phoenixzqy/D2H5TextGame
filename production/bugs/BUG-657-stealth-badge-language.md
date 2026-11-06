# BUG-657 — Translate the visible stealth badge

- **Status:** Locally fixed and verified in retained uncommitted human2 source (base `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`); no fix commit created.
- **Severity:** Low; visible localization failure, with ordinary controls usable.
- **Owner / affected systems:** frontend-dev / writer; F15, P16, app-wide stealth badge.
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained uncommitted human2 worktree.
- **Environment:** WSL/Linux, installed Playwright Chromium, 1280×800 desktop; English locale. No engine RNG applies.

## Reproduction

1. Create a fresh Necromancer named Quiet through ordinary controls.
2. Open Settings, choose English and enable Stealth Mode.
3. Inspect the visible badge in the top-right corner.

**Expected:** The badge says “Stealth Mode” in English and “摸鱼模式” in Chinese, updating when the language changes.

**Actual:** The visible CSS-generated badge always says “摸鱼模式”. A separate screen-reader-only React marker contains the untranslated literal `stealth`.

## Evidence and cause

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p16-stealth-label-v1`.
`red.json` records the desktop reproduction failing at the expected English badge text; `red-output` retains the screenshot and trace. The screenshot was visually inspected. `before-source.json` authenticates the three scoped baseline files.

`src/styles/stealth.css` authors the visible text in `body.stealth::before`; `src/app/App.tsx` renders only an invisible marker. Neither uses the existing `settings:stealthMode` translations. Image hiding already applies globally; the home artwork needs no separate change.

Root self-triages under the session's no-new-agents constraint. This issue does not establish full stealth, localization, accessibility or private-v1 acceptance.

## Fix and verification

`App.tsx` now renders a visible translated indicator inside the existing i18n
provider; `stealth.css` styles that element without generating duplicate text.
The regression is `tests/e2e/stealth.spec.ts`. Both ordinary-control Chromium
cases pass (1280×800 desktop and 360×640 mobile), covering en→zh-CN→en,
save/reload, hidden imagery, neutral rarity colors and disabling stealth.
Browser warning/error arrays are empty and no horizontal overflow is observed.
Scoped strict TypeScript and explicit affected-file lint pass. All four final
locale/viewport captures were visually inspected.

[Evidence](../../docs/plans/evidence/p16-stealth-label.md) links the retained RED,
GREEN and final hashes. Recorded test processes are absent; exact generated
configs/cache are removed and their archives retained. Other sizes and broader
stealth/accessibility acceptance remain open.

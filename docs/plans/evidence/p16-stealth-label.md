# P16 — Localize the stealth badge

BUG657 is locally fixed in retained uncommitted human2 source, base
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce`. The previous CSS pseudo-element
hardcoded Chinese in English. A real DOM indicator under the existing i18n
provider now uses `settings:stealthMode`; CSS only controls its appearance.
The existing global image-hiding rules already cover the home screen.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p16-stealth-label-v1`.
Root retains this packet through umbrella review and owns eventual cleanup.

- `red.json`, `red.log`, `red-output`: expected pre-fix English badge failure,
  with inspected screenshot and trace.
- `green.json`, `green.log`, `green-output`, `green-launch.json`: 2/2 Chromium
  passes, no skips/retries/flakes, 28.090 seconds total. Ordinary fresh-character
  controls at 1280×800 and 360×640 verify en→zh-CN→en, save/reload, image hiding,
  neutral rarity colors, toggle off, no overflow and empty browser error/warning arrays.
- Four final desktop/mobile en/zh PNGs were visually inspected.
- `types.log`, `lint.log`: scoped strict TypeScript and explicit affected
  TS/TSX ESLint pass, exit 0. No broad suite, build, campaign or seed study ran.
- `before-source.json`, before files, `final-source.json`, `scoped.patch`:
  exact baseline/final three-file identities and scoped change.
- `closure.json`: all four recorded wrapper/runner PIDs absent and Vite closed;
  exact generated `vite-cache`, `playwright.config.mjs`, `tsconfig.json` removed
  and absence verified. Launcher/config archives and diagnostic evidence retained.

Regression: `tests/e2e/stealth.spec.ts`. Scope is the badge and its affected
existing flow. F15, full G5, other viewport sizes, accessibility and private-v1
acceptance remain open. No save/engine/campaign contract changes or earned
state changes occur.

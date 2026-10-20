# BUG-007 — Saved English preference does not restore rendered language

Severity: Medium (persisted locale/accessibility correctness). Owner: persistence/UI.
Status: fixed and independently source-reviewed, 2026-10-20.
Reproduced by inventory QA at `2458ee7`; unit reproduction at `90e4a67`.
Environment: Playwright 1.59.1 Chromium shell1217, desktop1280×800/mobile360×640.

Reproduce through ordinary controls: create a character, choose English in
Settings, Save, reload, navigate to Settings. English remains aria-pressed=true
and the exported settings.locale is en, but labels are 设置 / 保存 / 导入存档
and sidebar 背包. The selector `getByRole('button', { name: 'Save', exact: true })`
times out in both English inventory recovery runs. Chinese runs pass.

Expected: persisted locale and rendered translations agree after startup,
without reselecting the language. Both locales remain usable after reload.

Root cause: i18n initializes with `lng: 'zh-CN'` in `src/i18n/index.ts`.
`hydrateFromSave` restores meta.settings but never changes the active i18n
language. Settings manual changes and import explicitly synchronize language;
startup is the missing boundary. Previous save-management browser assertions
checked selected preference and exported JSON, overlooking rendered text.

Fix scope: await saved-language activation during startup hydration before
marking the character ready; keep default zh-CN for a fresh profile. Extend
unit checks for opposite-runtime→saved en/zh-CN, assert actual translated Save
labels after reload in existing browser cases, and remove inventory's explicit
reselection workaround. No new copy, locale policy or save-format change.

Security check: pass; uses validated en/zh-CN setting and bundled resources,
no network, credentials, dependencies, permission or policy changes.

Test-first: 2 failed / 12 passed before source correction; both saved-language
cases pass afterward. Targeted persistence/save-management/Settings: 46 passed.
Integrated full unit: 89 files / 856 passed / 1 pre-existing merc-XP skip,
24.27 s (over 15 s budget); engine 38 files / 351 passed, 4.95 s (over 3 s).
Typecheck, lint/engine purity and production build pass. Build's existing large
bundle/manifest-precache warnings do not establish offline/performance acceptance.

Browser: `E2E_PORT=4287 npx playwright test tests/e2e/save-management.spec.ts tests/e2e/image-source-recovery.spec.ts tests/e2e/inventory-overflow-recovery.spec.ts --project=chromium-desktop --project=mobile-portrait --workers=2 --reporter=line --output=/tmp/d2h5-foundations-browser-locale`:
16/16 passed, 52.3 s. English/Chinese rendered Save labels survive startup;
inventory recovery no longer reselects locale. No page errors in those flows.
Independent QA source review: APPROVE, no blocking findings; validated saved
locale, bundled resources, await before ready/store application, suppression and
pre-application error handling all checked. No full feature/gate acceptance.

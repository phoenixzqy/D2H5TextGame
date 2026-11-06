# BUG-705 — Match document language to the rendered locale

Status: Resolved locally, uncommitted; independent acceptance pending
Severity: Medium
Owner: frontend-dev (root implementing locally)
Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited changes and BUG-704.
Environment: installed Chromium147.0.7727.15, en1280×800 and360×640.
No engine RNG involved.

## Reproduction

1. Open Settings in a fresh browser profile.
2. Select English using the native language button.
3. Use Back, then New Game, and inspect the Paladin card.
4. Create a fresh character using native controls and inspect Akara's town tile.
5. Inspect the document language attribute on both screens.

Expected: html lang identifies the resolved rendered language, en, so assistive
technology can pronounce the English content correctly; switching back uses zh-CN.
Actual: labels read Paladin/Akara while html lang stays zh-CN.
Workaround: select Chinese so the content matches the declared language.

Evidence: `browser-verification-v2.json` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-art-reconnect-zsjpf5q0`
records actual English labels with documentLanguage=zh-CN in both viewports;
the corresponding English recovered screenshots show the content. The earlier
observer's failed lang assertion is retained in `browser-verification.json`.

Cause: index.html declares zh-CN, but the shared i18n initialization never
synchronizes that attribute when its rendered language changes.
Affected systems: F15 document language accessibility, shared i18n. No translation
content, language selection settings, gameplay, save or dependency change intended.

## Resolution and verification — 2026-11-04

The shared i18n entry point subscribes before initialization and synchronizes
html lang to the resolved resource language on languageChanged. A DOM guard
preserves non-browser imports, and HMR disposal removes the listener.

All three new cases fail before the edit and pass afterward: initial zh-CN,
English→Chinese changes, and en-US resolving to English resources. The existing
Settings locale-button case also passes (four executed cases; ten unrelated
Settings cases excluded by name filter, regardless of the JSON reporter's
aggregate count). Scoped strict types and two-file lint pass.

Native source-browser checks at360×640/1280×800 verify initial Chinese plus
both language changes on Settings and character creation, with matching visible
labels/document language and no page errors. No character creation, gameplay
or persistence action is needed for this verification. Evidence lives in the
packet's `locale/` directory. Broader app accessibility remains open.

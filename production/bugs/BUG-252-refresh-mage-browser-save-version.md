# BUG-252 — Refresh the Mage browser fixture for current saves

- Status: locally fixed in `ef0561d7` and verified; independent review remains open.
- Severity: Medium — blocks the existing Mage production-browser regression before its import/combat checks.
- Owner: root QA; independent review remains open.
- Build: production runtime `76603ca6`, test/source head `deb0b7b6`; Chromium, zh-CN, 360×640; Node 24.21.0.
- Seed: not applicable; fails on fresh character export before combat.

## Reproduction and evidence

1. Build with `npm run check:test-bridge-shake`.
2. Run `tests/native/skeletal-mage-native.spec.ts` against production preview, selecting `native Mage zh-CN 360x640`.
3. Create the native Necromancer and export its fresh save through Settings.

Expected: exported version exactly equals the current version defined in `src/engine/types/save.ts` (22 at reproduction), then ordinary import/preparation/combat/save assertions run.

Actual: `download` at test line92 requires11, but the real export returns22. The first selected case fails; the other three stop under the configured max-failure rule. The actual fresh export has the expected nine root domains/metadata keys; no production save-version change is needed. After correcting that assertion, the old hand-authored equipped cap is rejected by the real decoder with `Invalid native item socket capacity`: it lacks the mandatory current `socketCapacity` and `socketContents` fields.

Raw failure, actual export, screenshot and trace originated under `browser.log`, `browser-report.json`, `browser-evidence/body-data-final/` and `browser-output/` in the former task root. All remain losslessly retained in the verified archive; the task root was removed after consumers finished. [Final evidence](../../docs/plans/evidence/d06-necromancer-body-data.md) records all four exact retained paths, owner/removal condition and completed cleanup.

## Root fix

Assert the exact current version22 through a `SaveVersion`-typed expected constant, and rename stale `v11` evidence labels. The type-only import makes future version drift a compile error without loading the game's transitive JSON/migration modules in Playwright's Node runner. A direct runtime import was tried and failed discovery on Node's JSON import-attribute requirement; that failed setup remains retained and uncredited. Preserve all public import, exact stat, payment, element, resource, save/reopen and console assertions. No production version bump, migration, weakened comparison, retry or skip. Root author review is not independent approval.

Give the diagnostic cap its exact legal unsocketed state, `socketCapacity: 0` and `socketContents: []`, matching the current item contract. Preserve its existing numerical affixes. This repairs the old fixture; do not relax the production decoder.

After import succeeds, the old78MP startup assertion is also stale. The accepted [fresh challenge resource contract](../../docs/plans/decisions/D04-D07-challenge-entry-resources-v1.md) fills current maxima before preparation; `startSubAreaRun` explicitly initializes hero mana to1197 here. Require both maximum1197 and remaining1175 after the one22MP Mage batch. Saved100MP is still preserved by import and save assertions; it is not this new challenge's entry pool. Original observed1175 versus old78 failure is retained. No resource rule is changed.

## Final verification

En/zh-CN at360×640/1280×800:4/4production cases PASS64.710s, no retry/skip/flaky. Public import, keyboard detail/combo,1197−22=1175payment, four actual bodies/all four elemental hits and ordinary online save/reopen pass. All seven exported payload domains match across four pairs; zero console warnings/errors/page errors. Final types/full unit and explicit browser lint pass. Eight of52original PNGs were inspected with clipping limits; default desktop Chromium was resized, with no device-UA/network-disabled offline/full-mobile-a11y claim. Full raw failures, audit and cleanup are linked above. No production source/decoder/resource change or skill credit.

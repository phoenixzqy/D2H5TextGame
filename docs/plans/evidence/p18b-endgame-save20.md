# P18b — Separate endgame persistence prerequisite

2026-10-23; local unpublished integration following `e4a89b8`.
ADR-010 keeps endgame state at the native save root while the live map store
owns its runtime value. SaveCurrent20 registers a frozen19-first migration;
predecessor maps and historical title validation retain their exact contracts.

Migration adds only empty endgame ownership and the version. Current validation
requires closed counters/claim state consistent with the actual ActV reward
graph. Descriptor-safe reservation rejects root/map/inventory laundering,
including hidden, inherited, undefined and accessor fields. Trusted builders
default only genuine absence. Save snapshots and hydration explicitly map the
root field; normal map autosave, new-game/reset and deletion paths cover it.
Historical simulation adapters refuse nonempty endgame before projecting the
older empty shape; original recordings, hashes and earned outcomes are unchanged.
BUG136 corrects three proven stale fixture boundaries without relaxing guards.

## Verification

- Save20 focused tests38pass; persistence7pass; historical lineage25pass.
- Final complete unit suite11133pass/413files,2existing skips,710.72s.
- First complete attempt11123pass/10fail; all10 were stale fixture assumptions
  recorded in BUG136. Its log is retained separately.
- Typecheck, full ESLint/engine purity and production build pass.
- All7 production JS files have zero forbidden test-bridge matches.
- Frozen1182source/test/config files have zero drift and unchanged base HEAD
  throughout the corrected final suite.
- Production Playwright4/4pass: en/zh-CN at360×640 and1280×800. Ordinary UI
  creation/export, constructed19 migration, full20 import/Save/page-close/Continue
  equality, repeated imports and malformed import refusal pass with no page
  exceptions. Exact material holdings survive. This reopens pages in the same
  browser context; it is not a browser-process restart.
- Independent read-only source CLEAR/TD-ADR010 APPROVE; test/evidence QA ADEQUATE.

The browser fixtures deliberately construct campaign entitlement and endgame
ownership. These results establish persistence only, not earned access, native
dungeon play, clear rewards, achievement Claim or title selection.

## Remaining work and ownership

Native entry/recording/settlement, completion rewards, explicit Claim, current
title ownership and bilingual UI remain required. C0/C1 retain their existing
acceptance; C2 is incomplete, C3/C4 and fullG0–G7 remain open. Large production
bundles/PWA precache and test-runner budgets remain unresolved; no performance
or complete offline gate is accepted. No push, PR, merge or deployment occurred.

Root retains exact diagnostics through native/full-v1 consumers at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-endgame-native-sapkemp7`: 
`full-corrected.log`, `full-final.log`, `save20-extended.log`,
`persistence-final-focused.log`, `lineage-focused.log`, `types-final.log`,
`lint-final.log`, `build-final.log`, `browser-results.json`, four browser JSONs
and screenshots, `reviews.json`, `source-freeze-corrected.json`,
`source-freeze-check.json` and `cleanup.json`. Root removes diagnostics after
those consumers finish. Exact task-owned dist/browser/review-snapshot paths are
verified absent with remaining[]/failures[]. Browser/server and validation
processes are terminal. Shared caches and the active claimed worktree remain.

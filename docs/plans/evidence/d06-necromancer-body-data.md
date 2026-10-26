# D06 — Remaining Necromancer summon body data

2026-10-26; implementation`76603ca6`, strict test formatting`deb0b7b6`, browser fixture`ef0561d7`. [BUG251](../../../production/bugs/BUG-251-author-necromancer-summon-body-data.md), [BUG252](../../../production/bugs/BUG-252-refresh-mage-browser-save-version.md) and [migration contract](../decisions/D06-necromancer-body-data-v1.md). Root author evidence only; independent review/QA, earned balance and full private v1 remain open.

Complete unchanged Skeleton, Clay Golem, Skeletal Mage, Iron Golem and Revived Minion stats now live in strict Ajv2020-validated JSON. Runtime factories and pure previews share one fresh copied-stat lookup. Shared magical mitigation, authored skill growth, Masteries, paid startup, Mage direct elements and Iron selected-item transactions retain their existing owners. No new save state or gameplay tuning.

Compatibility baseline: ten literal pre-migration tests passed before production edits. New definition tests originally failed discovery because authored data was absent; this was a missing-definition RED, not a claim of failing numerical combat. Final focused controls pass130/5, including36new cases. Required completeness, every resistance, invalid/nonfinite/extra data, copied/frozen definitions, fresh outputs, unrelated IDs and rank1/6/20 bodies/previews have explicit assertions.

The first typecheck exposed readonly mixed-tuple fixture inference; named object cases preserve all values/assertions. Full lint exposed two test-invocation line breaks, corrected without changing rules. Original failed and corrected results remain retained. The package has no validate:data command; actual Ajv loader tests validate this new kind rather than claiming a nonexistent command passed.

Production browser initially exposed stale v11 assertions, old equipped-cap socket shape and pre-full-entry78MP expectations. Current export22, real decode failure and the accepted fresh-entry1197−22=1175 contract justify the precise test corrections. A runtime version-module import failed Node JSON discovery; the final type-only SaveVersion22 constant detects future version drift without loading the game in the test runner. Missing task-config and optional PIL setup attempts are retained/uncredited; no dependency was installed.

Final production4/4 proves actual public import/keyboard detail/combo selection, four paid bodies per case, exact current-next cap/life/Attack/Defense/mana, all four outgoing elemental messages and ordinary save/reopen. Four direct export comparisons prove all seven payload domains exact; console/page errors and browser warnings are zero. En/zh-CN and360×640/1280×800 use default desktop Chromium resized; no device-UA or network-disabled offline claim. Imported level/gear/resources are unearned diagnostic scaffolding. Eight representative originals of52PNGs were inspected; precise clipping, portrait fallback and broad UX/a11y limitations (summon chips are intended transient event feedback) are retained in visual-review.json. Do not claim every PNG was inspected.

## Final local validation

| Check | Result |
| --- | --- |
| Literal pre-migration baseline |10passed;3.051s command |
| Focused compatibility/integration |130passed/five files;4.407s |
| `npm run test:engine` |8911passed/334files;133.313s |
| `npm test` |17785passed/813files;two existing opt-in campaign tests skipped;766.066s command |
| `npm run typecheck` final source |PASS98.725s |
| `npm run lint` and engine purity |PASS167.800s |
| Explicit final browser-file lint |PASS7.837s |
| `npm run check:test-bridge-shake` |Official production build/six checked chunks PASS12.524s |
| `node scripts/check-offline-precache.mjs dist` |PASS756URLs;0.047s |
| Final public production browser |4/4PASS64.710s command;no retries/skips/flaky |

All27 command-start receipts have matching terminal receipts and SHA-verified raw logs, including failed attempts. All20 scoped committed source blobs and both762-file build copies match exactly; build totals41,924,984bytes. Existing React act warnings in the full suite, oversized production chunks, the2.57MB art manifest excluded from precache and exceeded test-time budgets remain disclosed and unwaived. The build reports758 entries; the separate verifier proves756URL entries. No validate:data command exists. No standalone data command or overall performance/offline acceptance is inferred.

Author review found no remaining blocking issue for this unchanged-data migration. It is not independent approval. Both initial missing-data discovery failure and fixture/type/lint/browser setup failures remain separately attributable and uncredited. The two pre-existing skipped cases remain opt-in authentic campaign continuation/economy tests; no genuine campaign was selected.

## Retention and cleanup

All3567 raw members were archived losslessly and SHA-verified by read-back before deletion. This includes all27 terminal command receipts/logs, every failed attempt,20 scoped source copies, the762-file official build, original browser reports/traces/exports and all52 final PNGs. The curated [packet](fixtures/necromancer-body-data/attachment-index.json) retains receipts, audits, hashes and eight actually inspected originals; [visual limits](fixtures/necromancer-body-data/visual-review.json) remain explicit.

Exactly4329 manifest-verified disposable files and85 directories were removed, including the task root and task-owned worktree `dist/`. The separately verified cleanup driver was then removed. Known child identities were absent, no readable task-file consumers remained, and4537 accepted a bind;30 restricted `/proc` entries could not be inspected. No process was signaled. [Cleanup receipt](fixtures/necromancer-body-data/cleanup.json) records remaining[]/failures[]. Shared caches, installed tools, sources, Git history and registered worktree were preserved.

Root retains these exact four paths through BUG251/BUG252/full-private-v1 evidence consumers, and removes them only after all consumers finish:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-necromancer-body-data-hhwi2mk2-retained.tar.xz`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-necromancer-body-data-hhwi2mk2-retention.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-necromancer-body-data-hhwi2mk2-deletion-manifest.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-necromancer-body-data-hhwi2mk2-cleanup.json`

Archive SHA256 `924ea143823dfa9937cad217b4e1675f95b61f8ccf4ef3280e9fa87694338eb5`; [retention summary](fixtures/necromancer-body-data/retention-summary.json) and [full-manifest reference](fixtures/necromancer-body-data/deletion-summary.json). No remaining disposable path or cleanup failure. Worktree/umbrella goal remain active.

No skill credit: inventory bytes remain exactly161bounded/50unverified/one engine-only/one review-needed. Genuine retained L33/Ancients-Rite claimed/Baal uncleared remains hash-exact, with no genuine campaign/replay or remote action. Full Mage signature statuses, remaining summons/skills, all-class earned builds, pacing/economy/endgame, C2–C4/G0–G7 and complete private v1 remain unfinished.

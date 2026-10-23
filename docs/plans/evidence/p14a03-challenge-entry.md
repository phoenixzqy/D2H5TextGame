# P14a03 — Full resources at new challenge entry

BUG088 applies the [approved contract](../decisions/D04-D07-challenge-entry-resources-v1.md)
at `startSubAreaRun`: construct new hero runtime pools at current equipment/core
maxima before staging. The default adapter, historical nested stats metadata,
persistent pools, ongoing wave carry, startup costs, receipts and save format
retain their contracts. Mercenaries already entered full.

Seven regression cases preserve manual/idle, zero/negative saved pools, equipped
maxima338HP/189MP, merc entry, recovery reset, adapter behavior, failed staging,
wave carry and replay/reward identity. Frozen RED has5failures/2controls; all7pass.
Explicit synthetic first-wave fixture staging preserves unrelated depletion
coverage without changing assertions. Producer source/security APPROVE/pass;
independent QA fixture ADEQUATE.

## Verification

Affected334tests/18files pass. Final frozen full8543tests/273files pass in215.02s;
all756source/test/config input hashes remain unchanged. Main typecheck, lint and
production build pass. Full-unit15s budget is exceeded; no performance acceptance.
An extra tooling-project typecheck fails preexisting TS2353 for workspace
`maxThreads`; tracked separately as BUG089, not suppressed or claimed passing.
Build warnings remain; VITE_E2E is unset and all5emitted JS chunks pass the five
repository test-bridge token checks.

Production Chromium passes4cases: en/zh-CN ×360×640/1280×800, no skips/retries/flaky
cases/page errors. Ordinary Import/Export, map entry, Flee, Save, page close,
Continue and complete export equality pass against the original earned L12 save.
The hero HP bar proves100%fill; the compact UI does not expose numeric HP. MP is
literal188/188. DOM assertions prove mobile HP fill; desktop screenshots visibly
show it. No injected state/storage/combat input, no `__GAME__`, no horizontal
overflow. This is imported checkpoint integration, not fresh acquisition.

Failed attempts remain: the first full run exposed stale synthetic fixture entry
assumptions; a subsequent run refused3provenance checks after concurrent source
edits; another was interrupted exit143 before summary, sender unknown. Browser
attempts failed on task-local cache hiding Chromium, import-clock mismatch and
an absent numeric HP selector. The accepted run uses installed Chromium, a
stable fixed clock and the actual compact HP bar. Original logs are retained.

## Single original earned route

[Exact executed route](fixtures/p14a03-challenge-entry.route.mjs) and
[summary/hashes](fixtures/p14a03-challenge-entry.summary.json) retain original input
SHA `8c46c4f4026116360356a2d17dcde3d723310969a25664f85bc291a1886d2afc`,
clock1792497600000, seed2223645302, bonus1, ordinals102–106, Frost Nova2/Ice Blast8,
Rogue priority and the predeclared existing weapon `it-7is2r-10i`/Attack43. One
execution, no farming/gear search/allocation/respec/resource commands/retries.
The production fresh-entry fill is the intended difference.

| Area | Combat ms | Earned XP | Result |
| --- | ---: | ---: | --- |
| Blood Moor |28812|1460|Victory,3waves|
| Cold Plains |57048|3100|Victory,4waves|
| Burial Grounds |112296|3130|Victory,4waves|
| Dark Wood |127008|6600|Victory,5waves|
| Catacombs |86072|4860|Defeat,W4; stop|

All new initial allies are full; subsequent hero HP/MP/recovery carry equals
actual preceding-wave output, with only current-max clamping. Catacombs W4
opens hero240/262HP,175/188MP and merc181/252HP,79/79MP. It loses at19280ms versus
prior15456.04ms;1776enemyHP remains. Andariel is not reached. The failed wave
awards zero XP/items/currencies/mercXP; earlier earned rewards remain.
All173item additions reconcile3737→3910unique owned IDs. The final diagnostic
export SHA remains `3065a41613e3b7c35c963d12d7a037d45ee51f2d10b217d638580366d99da6d1`:
runtime resource differences are deliberately not persisted. Do not use this
failed export to finance a retry. The policy defect is fixed; this route does
not establish campaign balance or imply another numeric fix.

## Retention and scope

Raw root: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-challenge-entry-r7znpyb5`.
Root retains diagnostic reports/saves/scripts/logs/manifests and accepted/failed
browser attachments through progression/C1, then removes after consumers finish.
Final independent QA is ADEQUATE for scoped correctness evidence, with no material
publication mismatch or remaining QA blocker. All readers are released. Exact
task-owned snapshot/cache/tmp/dist/browser-output/route-cache/route-tmp cleanup
succeeds; `cleanup.receipt.json` records remaining[]/failures[]. Local only; C0–C4/G0–G7, Act I, 30–50hour campaign pacing
and full-v1 acceptance remain open.

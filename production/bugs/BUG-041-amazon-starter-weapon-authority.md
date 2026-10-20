# BUG-041 — Make Amazon starter equipment legal and authoritative

Status: P08a05a content/acquisition accepted; full authority defect remains open.
Severity: High — actual starter weapon is absent from canonical inventory,
while Magic Arrow gates use stale legacy equipment. Full defect remains open.
Owner: content/engine/store/frontend; independent producer/QA acceptance.
Input:471c546, Node24.21.0, isolated root worktree2, feat/playable-foundations.
Content/loot checks run in Vitest UI project; browser/viewport/locale behavior
is not yet reproduced. Source report and contract are linked below.

## Reproduction

1. Read actual Amazon class starter and factory: Magic Arrow and legacy-only
   weapon-bow instance atlevel1. Inventory receives no starter from creation.
2. Load actual item bases: weapon-bow requires10, crossbow15, no legalL1bow.
3. For bounded P08a05a, execute real loadAwardPools→rollKillRewards with actual
   loot/trash-act1, trash, MF/GF0, Act1, seed167 at monster levels1/10.
4. Desired training bow does not exist/acquire before content changes. Record
   exact runtime RED rather than treating source inspection as an execution.

Expected: content has a legalL1two-handed bow and real early ActI drop source,
then subsequent reviewed children materialize it once in canonical creation,
repair exact legacy signatures conservatively and share authoritative readers.
Baseline source before P08a05a: only genericL10/L15bows existed; factory starter lives only in
player.equipment, stats/equip actions use inventory.equipped and combat/Skills
weapon gating reads that unsynchronized legacy array. P08a05a actual loader/acquisition runtime RED is recorded below; ordinary creation/
conflicting-reader browser behavior remains source-risk pending its later child.

Contract: [D04 weapon authority](../../docs/plans/decisions/D04-amazon-weapon-authority-v1.md).
Investigation: [source report](../../docs/plans/evidence/stale-weapon-authority-investigation.md).

P08a05a only: dedicated training base8–18/L1/bow/2H/0sockets/affix-capable,
localized names and appended normal trash-act1weight100 monsterLevel1–10 row.
Four content files+one test. Preserve generic bases/old TC rows/other tables;
no schema/code/UI/creation/migration/readers edits in this child. Seed167
predictions training attack15 at1/10, amu-brass at11; seed6L1no items remain
baseline hypotheses before execution below. No global RNG/TC/noDrop mocks. Security check PASS.
Root/design/producer plan ready; reviewed genuine RED precedes source changes.

Evidence raw root (root owns and removes after all consumers finish):
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-amazon-content-aqh7rgjo

## P08a05a genuine RED before content edits

Only docs and new test file changed at471c546. No content/runtime edits.
Command: npx vitest run --project ui src/data/__tests__/amazon-starter-content.test.ts --reporter=verbose.
Result7failed/3passed/10total,1file,0skip,exit1,runner3.18s/wall4.591s.
Separate typecheck0/wall10.126s and scoped test lint0/wall5.689s. No harness
failures, suppressions, mocks or modified RNG/TC/noDrop.

Actual central loadGameData succeeds then lacks the desired base; actual TC
loader has zero training picks. Independently executed actual seed167 trash
reward tests reach one normal item each and fail because monsterLevel1 yields
amu-tin,monsterLevel10 yields amu-brass, both with empty baseRolls rather than
training attack15. Third real acquisition case (A/B/A entry assertion) also
fails on amu-tin; its later replay/immutability assertions remain pending GREEN.
Locale/icon tests fail on absent authored definition/name. Three controls pass:
existing generic bow/crossbow stats, actual seed167L11amu-brass and seed6L1no
item (currency not constrained). This is actual missing-content/acquisition
RED, not a missing import/type-only failure or injected synthetic loot.

Frozen SHA256:

- src/data/__tests__/amazon-starter-content.test.ts: `6b36a92bf08e2021d3783595a530d7b79e18a9f07f295d817be4dc48fba46981`.
- src/data/items/bases.json: `10594bf00d9b880470e6dcf7706dad8fb22faca72341d1832577cf9ad3b6f0c4`.
- src/data/loot/treasure-classes.json: `c8c4f780d815ecaa6a99d426c8f236d366631d39316dc11c7633104215081e9a`.
- src/i18n/locales/en/items.json: `861a091981a23c2b665cadb78fc0065336454d705ee4aa50fd42b0105760c0cb`.
- src/i18n/locales/zh-CN/items.json: `79e7cc5fbe21306e88e7d497a41e040b2b5f902badda315a432b3a772ac13a49`.
- amazon-content-red log: `e1853d4fadfac555b7acde72606ca02aa7b3f0614b24184909dd4b2671b484f8`.
- amazon-content-red-typecheck log: `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.
- amazon-content-red-lint log: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

Independent frozen-test/RED review precedes any four content edits.

Root/producer/QA independently APPROVE / ADEQUATE frozen tests and genuine
actual acquisition RED before source edits. No test change required.
Design/producer plan ready; no bounded acquisition gap identified. Full balance,
creation/save/reader/browser and BUG041 authority acceptance remain open.

## P08a05a bounded content source and GREEN

Frozen tests/docs checkpoint9809698. Exactly four source JSON files changed:
new training base appended, one actual trash-act1pick appended, one name per
locale. No old base/TCrow/field/order/other table/locale changed, independently
verified by producer/QA semantic baseline comparisons. No schema/runtime/icon/
class/create/save/reader change. Frozen test SHA unchanged. First GREEN211/3
(10new+195loader+6catalog),0skip,exit0,runner2.62s/wall3.92s. All later
attack15/computeStats15, literal en/zh, actual existing asset, full A/B/A with
normalized IDs and input/pools/authored-content immutability assertions execute
and pass; no failed source attempt or test oracle change. Root/producer/QA
source/focused APPROVE / ADEQUATE. Full balance/creation/authority remain open.

Source SHA256:

- src/data/items/bases.json: `0c1691b0ee06c75164d323acc91ae2db7a98620dccbf27f963def48336c4bf46`.
- src/data/loot/treasure-classes.json: `227b40353263e7adcc9048c11bbebda578d987eb1cf32b6872391745e8be0f30`.
- src/i18n/locales/en/items.json: `c207b8e64566f2748ae8868475a77aa844037175445832968be2289eb5b2238a`.
- src/i18n/locales/zh-CN/items.json: `275b899d513fe60e187adaa9019e869c0a418bd0ebf227e81ec47102810a069e`.

## P08a05a final combined validation

All four source hashes and frozen test hash remain unchanged. All checks
exit0; no unit failures/skips: focused211/3,related989/67,full2040/129,
coverage2040/129. T/L/purity51/build pass. Related27.68s/full26.66s runner
exceed5/15s budgets; no performance acceptance. Build9.24s retains large chunk,
2.57MB nonprecached manifest and stale Browserslist-data warnings;
756precache entries37328.18KiB. Existing React unit-test warnings remain.
Unchanged80%enginecoverage gate passes:60files,7993/8478statement locations
(reporter94.27%),1836/2054branch arms(89.38%),291/310functions(93.87%).
Coverage runner33.51s/wall36.994s. Coverage excludes these JSON/data/UI modules and is not proof of their schema/
acquisition behavior; actual loader/award/schema tests establish that boundary.
No new engine executable source locations in this child. No browser, pacing,
power-balance, creation/save/reader or full BUG041/C/G acceptance.

Exact commands, real wall seconds and log SHA256:

- amazon-content-green: `npx vitest run --project ui src/data/__tests__/amazon-starter-content.test.ts src/data/__tests__/item-catalog-integrity.test.ts src/data/loader.test.ts --reporter=verbose`; exit0, wall3.92s; `03f8b6e14282cae06b81297ccddf9cd98d99d64b81d4a4024f5ca83e720e13fd`.
- amazon-content-related: `npm run test:related -- src/data/items/bases.json src/data/loot/treasure-classes.json src/i18n/locales/en/items.json src/i18n/locales/zh-CN/items.json`; exit0, wall29.142s; `052a2d357a7f40ed0456f66ea054a1270a62d0f6d936716c4fb35fe976d4fe48`.
- amazon-content-full: `npm test`; exit0, wall28.248s; `5c0f9a01af8c5cb7fd55f374f041319531b3374bfa77c7046f6006285090f433`.
- amazon-content-typecheck: `npm run typecheck`; exit0, wall9.466s; `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.
- amazon-content-lint: `npm run lint`; exit0, wall38.699s; `64ef18bd16f812a048e5d016a57900763eaa6c02c2e7a32bb2a3cbbdaed0531f`.
- amazon-content-build: `npm run build`; exit0, wall14.944s; `407e6e3c1e9f3765adcedc6a992a36123a94dc97d07bbbabeb9dc4ab7709a1a6`.
- amazon-content-coverage: `npm run test:cov -- --coverage.reportsDirectory=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-amazon-content-aqh7rgjo/coverage`; exit0, wall36.994s; `7b55b9cb3c60a8e6dd4d9740c225898b426f60e57112412b6c423fb860a86183`.

coverage-final.json SHA256: `80762b38be71100b5a4f6e28108b9e67983c9acaaf09554148a952c3c29cdd11`.
Root/producer/QA final APPROVE / ADEQUATE. Producer independently checked all
seven final result/log pairs, source/test hashes and coverage counters; QA
independently approved final evidence. All raw consumers finished and released
cleanup. Broader authority defect and C/G checkpoints remain open.

P08a05a source/evidence commit: 502389c (see Git history for authoritative ID).
After all consumers finished, root removed and verified absence of exact
content raw root above, task-owned dist and local node_modules/.vite. No
task-owned process remained; installed dependencies/shared caches preserved.

## P08a05b pre-fix reproduction and acceptance

At e527b16, existing factory still hardcodes generic weapon-bow (reqLevel10),
equipped atlevel1 without ilvl/baseRolls; it ignores authored class documents.
Reproduction: call actual createMockPlayer('Archer','amazon'); inspect actual
checkEligibility/computeStats and factory response to substituted class JSON.
Expected: schema-validated optional class recipe supplies legal Training Bow13,
ilvl1, fresh cloned rolls; omission yields empty kit even for Amazon. Invalid
full documents/identity/recipes/base references/ranges/actual stat requirements
throw contextually before returning a player. Preserve existing progression,
combo/stats and transitional equipped flags; no grants/stores/creation/save/
reader changes. Proposed four source files/five including existing test are
root/design/producer approved. Tests import existing factory/schema APIs; JSON
substitutions exercise authoring edge, no missing-loader import or eligibility
mock. Security check PASS: local validation/preparation, no external network,
permissions, credentials, dependencies, hooks or destructive data changes.

Raw root (root owns; retain until independent consumers finish):
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-amazon-recipe-213lmj1m

### P08a05b genuine RED before source changes

Existing actual factory/schema API run:22failed/18passed/40total,1file,0skip.
Factory returns weapon-bow without rolls/ilvl, ignores authored12 and omission,
and never rejects14recipe cases/full invalid document/identity/core requirement.
Schema correctly rejects malformed recipes but also rejects desired valid new
field. These failures are observed behavior, not missing module/harness failure.
First scoped lint found4non-null warnings; replaced only with assert narrowing,
then reran same runtime assertions. No source change or weakened oracle.

- recipe-red: `npx vitest run --project ui src/features/character/createMockPlayer.test.ts --reporter=verbose`; exit1, wall3.506s; log SHA256 `50f613593d8b9fcaf98a0515d27e196d0ce1afc92ee8eded357c5034cad18efc`.
- recipe-red-frozen: `npx vitest run --project ui src/features/character/createMockPlayer.test.ts --reporter=verbose`; exit1, wall3.053s; log SHA256 `d7790ef3cc83f75f54abfe96ba1b3f25e319efbb2b0f3d105b3785065284a3fa`.
- recipe-red-typecheck: `npm run typecheck`; exit0, wall10.249s; log SHA256 `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.
- recipe-red-lint: `npx eslint src/features/character/createMockPlayer.test.ts --max-warnings=0`; exit1, wall5.721s; log SHA256 `7e97cc8310f3c6c6134b4f440c72bdf20dfaeba4cef7dcb9b31b2adbb6a8f5a3`.
- recipe-red-lint-frozen: `npx eslint src/features/character/createMockPlayer.test.ts --max-warnings=0`; exit0, wall5.054s; log SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

Frozen test SHA256: `cfdd67307ded70368e4331c761536468f97a2b3ad4e95d38a503e542bd8e7e7d`.

QA requested inclusive bounds positives before source. Parameterized authored
attack substitution [12,8,18]; no existing assertion weakened. Strengthened
actual factory RED24failed/18passed/42total,0skip. Prior cfdd hash above is
historical; current frozen SHA256: `7b4890082b4c0a7e879988d43d49bed5090a38d7c7d83b3db68d1797ece86660`.
- recipe-red-bounds: `npx vitest run --project ui src/features/character/createMockPlayer.test.ts --reporter=verbose`; exit1, wall3.228s; log SHA256 `b17dffc03b58fb99f577b3085762521dbcb8d3678a1c89dc97ead06c6e867c3a`.
- recipe-red-bounds-lint: `npx eslint src/features/character/createMockPlayer.test.ts --max-warnings=0`; exit0, wall5.372s; log SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

Root/producer/QA approve genuine RED; QA strengthened freeze ADEQUATE after
inclusive-bound positives. Four source edits follow frozen-test checkpoint.

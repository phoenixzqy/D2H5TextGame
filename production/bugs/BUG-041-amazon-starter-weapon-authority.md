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

### P08a05b bounded source and first GREEN

Frozen checkpoint f0ed731; unchanged test SHA7b4890082b4c0a7e879988d43d49bed5090a38d7c7d83b3db68d1797ece86660.
Four source files: strict optional recipe schema, Amazon authored13, narrow
class loader and existing factory helper only. Seven actual class documents
are available; requested full document and identity are validated with cached
strict Ajv validator, then actual base/type/slot/level/damage/inclusive roll
references. Factory explicitly resolves base and uses actual checkEligibility
with its created level/core/derived stats, clones rolls and adds ilvl1. Existing
transitional equipped flags/prefix and other factory fields preserved. No
trainingID/13 in runtime or schema; no new grant/store/RNG/migration/readers.

First GREEN247tests/3files (42factory+10content+195loader),0skip,exit0,
runner2.83s/wall4.073s. All later actual eligibility/computeStats13, schema
omission, fresh objects/roll independence and authored immutability assertions
now execute and pass. Inclusive8/18 and authored12 pass, all invalid cases
throw contextually. First runtime GREEN passed without a failed behavioral attempt; no frozen
test changed. Scoped/full lint later failed as recorded below.

Source SHA256:
- src/data/schema/class.schema.json: `ee7e64189bf05dba4be27320264417ef128a21be47844850174cbcfdf6dcd5c0`.
- src/data/classes/amazon.json: `a975f126c4bce79a69e0891b05890a40011a4dfe1285e37f2cf50c93bc324818`.
- src/data/loaders/classes.ts: `d1ca1adc1637af53922c8a911e91b028a3d60b441f0c5165a12e4367b829d8f0`.
- src/features/character/createMockPlayer.ts: `9555ccb2a9c762d4134cd715cb29e8cfb47bdfe9f1b29abd3c184119162e43e0`.

Scoped/full lint found2restrict-template-expressions errors in numeric range
message only. Waited for owned lint/build processes, then used explicit String
conversion without behavior/test change. Final checks rerun on corrected source;
loader SHA256 supersedes initial hash above: `6b484ca238dd5123d473b9c7bb416be8a26cb7eedaff47866c2a043f992b8d75`.

### P08a05b final combined validation

Root/producer/QA source/focused APPROVE / ADEQUATE including final String-only
loader correction. Four source files only; frozen tests unchanged. Final full
and coverage2080/129,0skip,exit0; corrected lint/purity51,typecheck,build pass.
Related496/32 runner15.39s,full32.33s exceed5/15s budgets; no performance
acceptance. React act warnings and existing large chunk/2.57MB nonprecached
manifest/Browserslist warnings remain. Build runner9.97s,756precache entries
37332.92KiB. Engine-only coverage excludes class loader/factory/schema/JSON;
actual factory/schema tests establish changed behavior. No engine source changed.
Coverage60files: statements7993/8478, branches1836/2054, functions291/310; unchanged80% gate passes.

Exact commands/results/log SHA256, including superseded lint failure:

- recipe-green: `npx vitest run --project ui src/features/character/createMockPlayer.test.ts src/data/__tests__/amazon-starter-content.test.ts src/data/loader.test.ts --reporter=verbose`; exit0, wall4.073s; `0d48bab1f47534a38b999ea59f990d8367ecd94647740d537f9dc407c01dea27`.
- recipe-related: `npm run test:related -- src/data/schema/class.schema.json src/data/classes/amazon.json src/data/loaders/classes.ts src/features/character/createMockPlayer.ts`; exit0, wall16.923s; `62a5f71b70b9fb03ee6d0222513f8b3f47dac86e48c05fb5c066c946f0f19053`.
- recipe-typecheck: `npm run typecheck`; exit0, wall9.446s; `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.
- recipe-scoped-lint: `npx eslint src/data/loaders/classes.ts src/features/character/createMockPlayer.ts src/features/character/createMockPlayer.test.ts --max-warnings=0`; exit1, wall5.301s; `60b4ceb70db8a0c3d9fae0345ad93147ee59d2e5e69963f3de5b538c4fe8dcd1`.
- recipe-lint: `npm run lint`; exit1, wall25.839s; `9fb0bb0aca4cdefd582eb40be7991bc2d6de1c2e8a5b725867e57e4eb3200fa1`.
- recipe-build: `npm run build`; exit0, wall8.899s; `85de22803dd455dc36baa3b810d2c49dbc286a50cc1e4c4d8fca7e26c3f76639`.
- recipe-final-full: `npm test`; exit0, wall34.011s; `b359355baf5a2f2de3778e9a84484804291e3cae0657f8856394f02825b5b6f8`.
- recipe-final-typecheck: `npm run typecheck`; exit0, wall17.831s; `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.
- recipe-final-lint: `npm run lint`; exit0, wall42.203s; `64ef18bd16f812a048e5d016a57900763eaa6c02c2e7a32bb2a3cbbdaed0531f`.
- recipe-final-build: `npm run build`; exit0, wall14.876s; `c3b92b76345bfe53e9bc5a6c6a8c88e722646a691a05df0a178bafba3b1e8aeb`.
- recipe-final-coverage: `npm run test:cov -- --coverage.reportsDirectory=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-amazon-recipe-213lmj1m/coverage`; exit0, wall37.432s; `701be5d3a73279e4f7fde8ef95485d62d00a3f13f10d9cb187e816e3ca8af7a2`.

coverage-final.json SHA256: `3a727d5049a91f69049b3760c3c51fbc2267c2fcb6acce150b9449780e500711`.
Root/producer/QA final independent APPROVE / ADEQUATE. All11 non-RED
command/result/log pairs independently checked, including superseded lint
failures. Current hashes/counters match; all raw consumers finished and
cleanup released. No creation/save/canonical readers/browser/balance/BUG041
or C/G acceptance.

P08a05b accepted source/evidence commit 9f00779. After ALL raw consumers
finished, root removed and verified absence of exact recipe scratch above,
task-owned dist and local node_modules/.vite. No owned process/retention remains.

## P08a05c pre-fix reproduction

Baseline e9b99d7 existing CharacterCreate sets a newly prepared player directly
then navigates without canonical kit transfer, persistence readiness/import/
existing-player guard, rollback or ID collision validation. Source risk and
producer-reviewed revised plan are recorded in D04. Actual existing-screen
RED precedes two source edits; tests import no nonexistent action. Expected
canonical singleton13/legacy[]/attack35, saved state preserved through pending
load/import, exact rejection/exception rollback, no-kit retained gear stats,
fixed-clock collision refusal and final-only deferred autosave. SeverityHigh
for replacement/partial-save risk. No source C change yet. Security check PASS:
guarded local preparation/commit with retained-data protection, no credentials,
network/dependency/hook/policy changes.

Task-owned raw root, retain until all independent consumers finish:
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-character-creation-8moncmrs

### P08a05c genuine existing-screen RED

19failed/21passed/40total,2files,0skip. Runtime factories/routes load correctly.
ReadyAmazon retains legacy kit/no canonical stats; screen overwrites existing
player and creates in idle/loading/error. Real deferred load/import observes
a transient new player before resolving saved state; actual autosave writes
legacy-only starter and writes despite injected equip refusal. Retained
canonical sword6 is ignored (22 vs28 attack); rollback and fixed-clock collision
tests observe forbidden player publication; prepared internal duplicates also
publish. Controls are15existing screen checks plus6no-kit class creations.
Later assertions after first failures (canonical13/stats35, exact rollback/retry/
immutability and final persistence state) remain for GREEN. No missing-module
RED, missing API, skipped tests or RNG/eligibility mock. Normal success paths
use real equipment actions; explicit refusal/recompute faults and duplicate-kit
input substitutions exercise failure boundaries.

TSC passes. First scoped lint rejected deferred<void> call type syntax; changed
only to deferred<undefined> plus explicit resolve(undefined), preserving all
assertions. Final runtime RED unchanged. Pending actual load/import operations
are resolved/awaited before assertions, including failed tests; autosave timers
and action substitutions restored after each test.

- creation-red: `npx vitest run --project ui src/features/character/CharacterCreate.test.tsx src/features/character/characterCreation.test.tsx --reporter=verbose`; exit1, wall7.2s; log SHA256 `f9acbd7f773978fa708691857fd89ff5b998fa87d5c316e9157677c5be31fa60`.
- creation-red-frozen: `npx vitest run --project ui src/features/character/CharacterCreate.test.tsx src/features/character/characterCreation.test.tsx --reporter=verbose`; exit1, wall6.59s; log SHA256 `92a1875a4a6ec246b7eb876ef20cc626298b9fd0a378f8af84d1cceb193a5187`.
- creation-red-typecheck: `npm run typecheck`; exit0, wall10.895s; log SHA256 `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.
- creation-red-lint: `npx eslint src/features/character/CharacterCreate.test.tsx src/features/character/characterCreation.test.tsx --max-warnings=0`; exit1, wall6.663s; log SHA256 `e90903c5e311be7f48c9e9bedd443bf1c5662984bd8fe57a74205a6b5339cbdb`.
- creation-red-lint-frozen: `npx eslint src/features/character/CharacterCreate.test.tsx src/features/character/characterCreation.test.tsx --max-warnings=0`; exit0, wall5.98s; log SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

Frozen test SHA256:
- src/features/character/CharacterCreate.test.tsx: `98d59d567c8abec7cfaff3724c6fd3023b0a4d091a3f17b4c72a5c91451db833`.
- src/features/character/characterCreation.test.tsx: `f4a168a3e3d2da21ef59774e5d69e3b558140e55ef1c7c9074ed4906b742f1ca`.

Root/producer/QA frozen tests and genuine RED APPROVE / ADEQUATE. Both
source files remain unchanged/absent until frozen checkpoint below.

### P08a05c source and first GREEN

Frozen checkpoint52cb433; tests unchanged. Two source files only: new feature
action and screen integration. Action gates ready/!replacement/noPlayer, validates
name/class and prepares before mutation; rejects kit-internal or retained-ID
collisions including both merc containers. Snapshots prior player and four
inventory slices; publishes legacy[], transfers generic kit through real add/
equip and checks results; no-kit recomputes retained equipment. Refusal/throw
returns explicit failure/cause and restores exact snapshots. Only successful
return navigates; localized existing common:error alert marks a failed attempt.
No store/hydration grants, broad resets, save migration or reader changes.

First GREEN82/3 (40creation+42factory),0skip,exit0,runner5.67/wall7.182s.
All later canonical13/stats35/legacy[], exact rollback+retry and fresh-clock
collision retry, unchanged retained refs and deferred saved/imported state/
final-only autosave assertions now execute and pass. No runtime attempt failed
or frozen assertion changed. Scoped lint found one redundant !selectedClass
after canStart already narrows it; removed only redundant condition. Action's
independent runtime class/input guards remain. Typecheck passes before correction;
final checks rerun on corrected source.

Final source SHA256:
- src/features/character/CharacterCreate.tsx: `85d67250e782de35d7e84988ef9e95701de208036196017a2bf909fe7ea2274b`.
- src/features/character/createCharacter.ts: `f1d38d007f04f529b341a66b45cdc42eaf7df90b88bbcb2bb135a74a09790dbb`.

### P08a05c final combined validation

Root source/focused APPROVE; producer and QA independently APPROVE / ADEQUATE.
Corrected source full and coverage each2105/130,0skip,exit0. Full runner30.49s/wall32.147s; coverage wall37.051s. Focused corrected related40/2 runner9.08s/wall10.265s. Final typecheck, lint/purity51 and build pass. Tests unchanged from52cb433. Existing unrelated React/Browserslist/large chunk/nonprecached manifest warnings and timing-budget overruns remain; no test/budget acceptance inferred.
Engine coverage60files:7993/8478statements,1839/2056branches,291/310functions. Gate remains80%. Feature action/screen are outside engine coverage; actual frozen runtime/persistence tests provide their behavioral evidence.
Superseded scoped lint failure was only redundant selectedClass guard; final whole lint passes. No migration/readers/browser/fullauthority/C/G acceptance.

- creation-final-build: `npm run build`; exit0, wall10.772s; log SHA256 `fe8fe1a3330458b3f37836ae434129f3837ca0f19890cf7d4ef93c8b2103fb8c`.
- creation-final-coverage: `npm run test:cov -- --coverage.reportsDirectory=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-character-creation-8moncmrs/coverage`; exit0, wall37.051s; log SHA256 `78ad9d5a9a81e4adee60909971ed47a998fc4ff1a6d4fa88ea3edcc1dda7f4d0`.
- creation-final-full: `npm test`; exit0, wall32.147s; log SHA256 `0d65bea5f9470765e666514fdafeeee43d137c0b1e144ba5166632a314be0e3c`.
- creation-final-lint: `npm run lint`; exit0, wall27.79s; log SHA256 `64ef18bd16f812a048e5d016a57900763eaa6c02c2e7a32bb2a3cbbdaed0531f`.
- creation-final-typecheck: `npm run typecheck`; exit0, wall18.459s; log SHA256 `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.
- creation-green: `npx vitest run --project ui src/features/character/CharacterCreate.test.tsx src/features/character/characterCreation.test.tsx src/features/character/createMockPlayer.test.ts --reporter=verbose`; exit0, wall7.182s; log SHA256 `2afb9045cc0a6b98d294da6758026b0822053782c9de5f9bbd8a6db322b6ce28`.
- creation-related: `npm run test:related -- src/features/character/CharacterCreate.tsx src/features/character/createCharacter.ts`; exit0, wall10.265s; log SHA256 `76aac17057ab14f5eda66a8129fcf6b472af1d25bcc118ab18997c086d3115e6`.
- creation-scoped-lint: `npx eslint src/features/character/CharacterCreate.tsx src/features/character/createCharacter.ts src/features/character/CharacterCreate.test.tsx src/features/character/characterCreation.test.tsx --max-warnings=0`; exit1, wall7.061s; log SHA256 `a425ed39ee7519dc5f38cc852e87c3236e1c2df41cbc97d57cd021f2f1049a8f`.
- creation-typecheck: `npm run typecheck`; exit0, wall11.088s; log SHA256 `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.

coverage-final.json SHA256: `915ee3087eca779357aa81db1795ebda6fdecaa5f09bce4a1aa746e2359a6811`.

Root/producer/QA final independent APPROVE / ADEQUATE. All9 non-RED command/result/log pairs, unchanged source/frozen tests and actual coverage counters independently checked. All C raw consumers finished; exact task-owned cleanup released.

P08a05c accepted source/evidence commit03d1fd6. After ALL root/producer/QA consumers finished, removed and verified absent exact creation scratch above, task-owned worktree dist and node_modules/.vite. No owned process/retention remains. Broader authority chain remains open.

## P08a05d pre-fix compatibility reproduction

Baseline049a65a decodeSave leaves proven legacy Amazon starter exclusively in
player.equipment, with empty canonical weapon and attack22; repeated saved
state is invisible to canonical inventory stats. Expected conservative v7→v8
repair per D04: sameID canonical training13/attack35, proven legacy singleton
removed, retained state preserved; ambiguous/nonfactory/current8 state gets no
grant. SeverityHigh for lost authored starter when readers become canonical.
Reproduce through existing decoder and actual adapter/persistence with only
Dexie IO substituted. Genuine RED and independent evidence review precede
source. Plan includes corrupt-before-recomposition validation protection,
JSON/nativeMap compatibility and deterministic repeated import/hydration.
No D source change yet. Security PASS as D04: local untrusted-save validation
strengthened, no external/dependency/permission/hook change.

D task-owned raw root (retain until ALL consumers finish):
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-starter-compatibility-hgi5xbjj

### P08a05d frozen genuine decoder/persistence RED

60failed/46passed/106total,3files,0skip,exit1; runner3.17s/wall4.393s. Existing imports resolve and actual decoder/adapters execute. Both original/intermediate positive cases retain legacy singleton instead of canonical transfer. Actual loadSave returns missing canonical ID; adapter/live imports and clean retry retain legacy kit. Version expectations also fail (7 vs8). Skip assertions compare version-only transformed payload, so RED there is expected version mismatch; preservation semantics will be exercised on GREEN. Progressed gear/remaining resource/idempotence assertions after first failing repair assertions are reserved for GREEN.43initial controls grew to46 with added corruption controls; all pass. No missing API/module RED, skips or runtime stats/equipment substitutions. Only Dexie IO is replaced for adapter/persistence integration.
Before final frozen run, positive decoder assertion order moved legacy-removal ahead of version check; added retained merc state and3corrupt input controls. No assertion weakened. Initial103cases60fail/43pass; frozen106cases60fail/46pass. Frozen typecheck and scoped lint pass. Existing standard warnings only. Sources remain untouched through independent RED approval.
- compatibility-red-frozen: `npx vitest run src/engine/save/save.test.ts src/engine/save/validate.test.ts src/stores/legacy-starter-compatibility.test.tsx --reporter=verbose`; exit1, wall4.393s; log SHA256 `2a0783683c29778d7b2892d425aa395a104937b4a3986e2f96affae7d9c58f60`.
- compatibility-red-lint-frozen: `npx eslint src/engine/save/save.test.ts src/engine/save/validate.test.ts src/stores/legacy-starter-compatibility.test.tsx --max-warnings=0`; exit0, wall5.752s; log SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- compatibility-red-lint: `npx eslint src/engine/save/save.test.ts src/engine/save/validate.test.ts src/stores/legacy-starter-compatibility.test.tsx --max-warnings=0`; exit0, wall6.181s; log SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- compatibility-red: `npx vitest run src/engine/save/save.test.ts src/engine/save/validate.test.ts src/stores/legacy-starter-compatibility.test.tsx --reporter=verbose`; exit1, wall5.103s; log SHA256 `f5418df1371d3120f79e3e6daaf4076d74d3b7cffc734afe64de4a17af5b5b5f`.
- compatibility-red-typecheck-frozen: `npm run typecheck`; exit0, wall9.587s; log SHA256 `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.
- compatibility-red-typecheck: `npm run typecheck`; exit0, wall10.433s; log SHA256 `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.

Frozen test SHA256:
- src/engine/save/save.test.ts: `2184e9dcd163821d833793308a441fb91c97f09e73058a256b4b5852140e2a50`.
- src/engine/save/validate.test.ts: `26009e7115f115c8429ed95f5f7a1cf91666e20f36e235419476e609d285c5f6`.
- src/stores/legacy-starter-compatibility.test.tsx: `0d0b19dffefcb571b3b6503130dc997e4862d65b8d14f5246c53eda87d2d6f5f`.

Root/producer/QA frozen RED independent APPROVE / ADEQUATE. Source unchanged
from049a65a; actual repair failures distinct from version-only preservation
mismatches. Later stats/resource/idempotence/publication assertions must pass
on GREEN. Proceed six-source-file implementation after frozen checkpoint.

### P08a05d source and first GREEN

Frozen checkpoint0f5664c; all3test files unchanged. Six source files implement exact conservative v7→v8 transfer, shared original canonical stats composition, moved original Map restorers, and validated v7 version projection before migration8 recomposition. Type-only imports keep helper/restore cycles absent. Historical signature/base/13 constants intentionally versioned compatibility facts, not runtime class recipes. Other retained items use restored aggregation view only; skipped data only bumps version.
FirstGREEN106/3,0skip,exit0,runner6.64/wall8.275s. All later canonical13/35, progressed retained gear62/248/17/9, resource clamp0/17/above max, native/entry-array/object affix preservation, merc/domain preservation, unchanged source/repeated decode/import/hydration/export and real failed-write retry/publication assertions execute and pass. Existing engine987/51,0skip,exit0,runner6.91/wall8.23s. Typecheck and scoped lint pass, no source corrections or frozen test changes. Existing timing-budget overrun is recorded, not accepted as meeting budget.

Source SHA256:
- src/engine/types/save.ts: `60cb41d2f23df03fe8d37a91a12fa5f695b21b27a8c6fa0c4527326bb5fe29e3`.
- src/engine/save/legacyStarter.ts: `36641a7df1d651d969aae54ddcb55ec7e52647609e3baa4dab0ec5f05a4174e2`.
- src/engine/save/restore.ts: `7c495ad36e2861b80aafef7272b7af2a0b908fdfc39bf0892b6d33cd15ffd2e4`.
- src/engine/save/validate.ts: `7b1ea9ad2fe0d4910485c257e18c0ed7404789e94a2b34e07d8373120d3779c4`.
- src/engine/progression/equipped-stats.ts: `fc1c1a7c37e4960552c83eec90c586aacb8fd04ac71d357e24c69bbf438e81b6`.
- src/stores/playerStore.ts: `6593fc21996b3941cbdd1baa4544b6546e43fe85fdc8b8c205da4692da038ec7`.
- compatibility-green: `npx vitest run src/engine/save/save.test.ts src/engine/save/validate.test.ts src/stores/legacy-starter-compatibility.test.tsx --reporter=verbose`; exit0, wall8.275s; log SHA256 `01af39ae6fdf9c2e549e2ae3fa493acba7e0a504782d3a70f4da214a6f8900f1`.
- compatibility-engine: `npm run test:engine`; exit0, wall8.23s; log SHA256 `755f99e21654604b5c136901d6ead2da32084bf33318bd25bacf210ae0edfad6`.
- compatibility-typecheck: `npm run typecheck`; exit0, wall13.413s; log SHA256 `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.
- compatibility-scoped-lint: `npx eslint src/engine/types/save.ts src/engine/save/legacyStarter.ts src/engine/save/restore.ts src/engine/save/validate.ts src/engine/progression/equipped-stats.ts src/stores/playerStore.ts --max-warnings=0`; exit0, wall9.191s; log SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

Root diff-check found only a trailing blank line in moved validate.ts; removed trailing blank lines in validate.ts/equipped-stats.ts after related/lint/build completed. No semantic changes or test edits. Final full/coverage/typecheck run on whitespace-corrected source; prior build/lint retain identical program behavior. Final source hashes replace the two first-GREEN hashes below.

### P08a05d final combined validation

Root/producer/QA source/focused APPROVE / ADEQUATE. Full and coverage2175/131,0skip,exit0; final corrected-byte typecheck/engine987/51 pass; related711/53,lint/purity51/build pass before whitespace-only correction. No semantic source changes or frozen test edits after firstGREEN. git diff --check0. Existing React/Browserslist/chunk/nonprecached manifest warnings and engine/related/full timing-budget overruns remain; no budget acceptance inferred.
Actual engine coverage63files: 8099/8582statements, 1883/2098branches, 296/315functions. Unchanged80%gate passes. Migration/restore/validate instrumented locations100%; extracted composition covered by decoder and existing store tests. No canonicalreaders/browser/fullauthority/BUG041/C/G acceptance.
Final exact source SHA256:
- src/engine/types/save.ts: `60cb41d2f23df03fe8d37a91a12fa5f695b21b27a8c6fa0c4527326bb5fe29e3`.
- src/engine/save/legacyStarter.ts: `36641a7df1d651d969aae54ddcb55ec7e52647609e3baa4dab0ec5f05a4174e2`.
- src/engine/save/restore.ts: `7c495ad36e2861b80aafef7272b7af2a0b908fdfc39bf0892b6d33cd15ffd2e4`.
- src/engine/save/validate.ts: `66e84230f3faea6a208e8a249567619dfea5bf866e48d86b9452c9239435db42`.
- src/engine/progression/equipped-stats.ts: `224ad4fd71fee3f3b19554eb2341ab7209f9f560100d271ff4ca89d80987a245`.
- src/stores/playerStore.ts: `6593fc21996b3941cbdd1baa4544b6546e43fe85fdc8b8c205da4692da038ec7`.
- compatibility-engine: `npm run test:engine`; exit0, wall8.23s; log SHA256 `755f99e21654604b5c136901d6ead2da32084bf33318bd25bacf210ae0edfad6`.
- compatibility-final-build: `npm run build`; exit0, wall13.441s; log SHA256 `3633ce144c1aea68141c9233999df478c391f4d6b5a63b6750aa2df61d41850e`.
- compatibility-final-coverage: `npm run test:cov -- --coverage.reportsDirectory=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-starter-compatibility-hgi5xbjj/coverage`; exit0, wall35.534s; log SHA256 `981844f77b31e6dcb47adb883c3a973381701cc98603417e42e1f8af392fddf6`.
- compatibility-final-engine: `npm run test:engine`; exit0, wall10.089s; log SHA256 `ce6022fcb73d6b066c1d3a62715d4fa4f3792e6310aedc02710e3dd53d86ca2c`.
- compatibility-final-full: `npm test`; exit0, wall35.138s; log SHA256 `35e54e3d58c32e542f10d170a5220a701c08bb4655f9192141c7bba41354bf6e`.
- compatibility-final-lint: `npm run lint`; exit0, wall37.28s; log SHA256 `64ef18bd16f812a048e5d016a57900763eaa6c02c2e7a32bb2a3cbbdaed0531f`.
- compatibility-final-typecheck: `npm run typecheck`; exit0, wall20.456s; log SHA256 `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.
- compatibility-green: `npx vitest run src/engine/save/save.test.ts src/engine/save/validate.test.ts src/stores/legacy-starter-compatibility.test.tsx --reporter=verbose`; exit0, wall8.275s; log SHA256 `01af39ae6fdf9c2e549e2ae3fa493acba7e0a504782d3a70f4da214a6f8900f1`.
- compatibility-related: `npm run test:related -- src/engine/types/save.ts src/engine/save/legacyStarter.ts src/engine/save/restore.ts src/engine/save/validate.ts src/engine/progression/equipped-stats.ts src/stores/playerStore.ts`; exit0, wall26.392s; log SHA256 `d94c52f2b86f624eeebed66d432acf2746ae794dab6a77850bd99215eb91e3a8`.
- compatibility-scoped-lint: `npx eslint src/engine/types/save.ts src/engine/save/legacyStarter.ts src/engine/save/restore.ts src/engine/save/validate.ts src/engine/progression/equipped-stats.ts src/stores/playerStore.ts --max-warnings=0`; exit0, wall9.191s; log SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- compatibility-typecheck: `npm run typecheck`; exit0, wall13.413s; log SHA256 `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.

coverage-final.json SHA256: `799a91c6d2838571651882231f0253cfe67c4cdd01d9d7d970808e595e22aafc`.

Root/producer/QA final independent APPROVE / ADEQUATE. All11nonRED raw
command/result/log pairs, six finalsource hashes, three frozen tests and actual
coverage counters independently verified. Whitespace-only correction validated
as one trailing newline removed from two files. ALL consumers finished;
exact task-owned cleanup released. No broader authority acceptance.

P08a05d accepted source/evidence commitbfaffcb. After ALL consumers finished, removed and verified absent exact compatibility scratch above, task-owned worktree dist and node_modules/.vite. No owned process/retention remains. Root worktree claim continues for full staged v1.

## P08a05e pre-fix canonical reader reproduction

Inputd1aeaaa includes accepted creation+v8compatibility. Actual combat adapter
and Skills still read player.equipment: canonical bow/empty legacy denies
Magic Arrow, while canonical sword/null/stale bow permits it. Real equip/unequip
never synchronizes legacy array. Expected canonical equipped.weapon authority
and live Skills subscription, explicit unarmed unknown/missing slot, frozen
current recording through automatic sanitizer. SeverityHigh: stale gating can
remove authored combo or permit wrong-weapon casting. Reproduce actual existing
screen/adapter/recorded runtime before two-source-file fix, per D04 reviewed
contract; no synthetic restricted skill/missing-API RED. Structured report and
security PASS before source. Comparison and ordinarybrowser remain separate.

E task-owned raw root, retain until ALLconsumers finish:
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-weapon-readers-6wc2dv_t

### P08a05e frozen genuine existing-reader RED

Frozen runtime21failed/55passed/76total,3files,0skip,exit1,runner5.71/wall6.999s. TSC0 and scopedlint0. Existing actual adapter/screen/plan/registry/engine load. Dedicated direct recording cases prove canonicalbow+emptyLegacy emits zero MagicArrow casts and canonicalsword+staleBow emits forbidden real casts, independently of metadata failures. Shared reader returns stale metadata or unarmed for bow; current wave/replay/real won+drained nextwave keep wrong metadata. Mounted Skills actual replacements/import/hydration expose stale option/combo. Dedicated otherwise-aligned canonical+legacybow case proves automatic canonical→data ID cleanup replays team/events and resets cursor, before equipment changes. No missing API, new resolver import, synthetic restricted skill or runtime equipment/eligibility mock. Only fixed clock and DexieIO substituted; test-owned defensive gear stabilizes real production plan/battle, not earned/balance acceptance.
Initial73cases18fail/55pass. Before final frozen run, added2independent actual-cast RED cases and1automatic-normalization recording RED; strengthened recording oracle with an immutable cloned snapshot alongside exact team/events/outcome references. No assertion weakened. Later mana/arcane/resource/combo/replay/immutability assertions following first failures remain for GREEN. Sources unchanged fromd1aeaaa until independent frozen approval.

- readers-red-frozen: `npx vitest run --project ui src/stores/weapon-authority.test.tsx src/features/skills/SkillsScreen.test.tsx src/stores/legacy-starter-compatibility.test.tsx --reporter=verbose`; exit1, wall6.999s; log SHA256 `a1af9a6e5897edce18abdefb369faafd2980b4d3621f2d53e7877c3273f8477d`.
- readers-red-lint-frozen: `npx eslint src/stores/weapon-authority.test.tsx src/features/skills/SkillsScreen.test.tsx src/stores/legacy-starter-compatibility.test.tsx --max-warnings=0`; exit0, wall5.648s; log SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- readers-red-lint: `npx eslint src/stores/weapon-authority.test.tsx src/features/skills/SkillsScreen.test.tsx src/stores/legacy-starter-compatibility.test.tsx --max-warnings=0`; exit0, wall6.909s; log SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- readers-red: `npx vitest run --project ui src/stores/weapon-authority.test.tsx src/features/skills/SkillsScreen.test.tsx src/stores/legacy-starter-compatibility.test.tsx --reporter=verbose`; exit1, wall8.088s; log SHA256 `a25937830225ac20fde5a352f700b4e827a9e1ae5c71bb806cc4bdeed1991645`.
- readers-red-typecheck-frozen: `npm run typecheck`; exit0, wall9.606s; log SHA256 `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.
- readers-red-typecheck: `npm run typecheck`; exit0, wall10.896s; log SHA256 `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.

Frozen test SHA256:
- src/features/skills/SkillsScreen.test.tsx: `d2157ec03a66f44e7c9cf76c16215ef40e5c134f2fa55e237984266f6ce0fc19`.
- src/stores/weapon-authority.test.tsx: `ec2eb42556624f4266295821191f659b9c5b56248f0768b08976d40000faf81f`.
- src/stores/legacy-starter-compatibility.test.tsx: `fb8b4291786609c5c4fde4369b5fb94595b497356d4bc5a4e702c4eea9e33a53`.

Independent frozen RED reviews: producer [P08a05e-FROZEN-RED-PRODUCER]
APPROVE / ADEQUATE and QA [P08a05e-FROZEN-RED-QA] APPROVE / ADEQUATE.
Both verified all three frozen test hashes, unchanged source at d1aeaaa,
21 genuine assertion failures / 55 passing controls and successful TSC/lint.
Actual cast and recording reset failures are independent. Root agrees;
two-file source implementation may proceed. Later assertions require GREEN.

# BUG-041 — Make Amazon starter equipment legal and authoritative

Status: P08a05a actual content/acquisition RED reproduced; full authority defect remains open.
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
Actual source: only genericL10/L15bows exist; factory starter lives only in
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
unexecuted hypotheses. No global RNG/TC/noDrop mocks. Security check PASS.
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

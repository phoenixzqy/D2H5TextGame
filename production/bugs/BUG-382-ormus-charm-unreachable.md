# BUG-382 — Make Ormus’s charm quest executable

- Severity: High — advertised side-quest and reward have no executable path.
- Status: Resolved locally for bounded functionality; current25 checks pass.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus preserved uncommitted changes.
- Environment: source-level JSON cross-reference reproduction on Linux/WSL;
  no browser/viewport execution for this reproduction.
- Locale: authored English data; both zh-CN/en presentation require alignment.
- Seed: not applicable to missing static identities; no combat executed.
- Owners: content-designer, engine-dev, frontend-dev; root integrates.

## Reproduction

1. Read `quests/side-act3-ormus-charm` from `src/data/quests/side.json`.
2. Resolve its objective target and area against all authored monster/map IDs.
3. Resolve its reward against authored item IDs and inspect the supported
   `itemDrop` branch in `src/features/quests/claimReward.ts`.

Expected: an attainable objective leads to an explicit Claim of a concrete,
usable charm through supported reward machinery.

Actual: `monsters/fetish_shaman` and `areas/act3_flayer_dungeon_2` do not exist.
The count10 kill has no supported progress path. `items/grand_charm_random` is
absent and the reward string fails the supported object-shaped exact-unique
reward branch. No authored charm base or explicit ownership/effect slot exists.
The actual `areas/act3-flayer-jungle` does exist.

## Evidence and repair boundary

Static reproduction receipt:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-ormus-urhb34ei/quest-source-repro.json`.
The receipt records exact quest data, source hash and missing-reference checks;
it is source evidence, not earned gameplay or a browser reproduction.

Root cause: placeholder objective/reward data predates concrete charm ownership
and guarded source-bound quest progression. No workaround earns this reward.

[Approved design](../../docs/design/ormus-charm.md) and
[ADR-014](../../docs/decisions/ADR-014-first-charm-ownership.md) define one hero
slot, one fixed item, full Normal manual Flayer Jungle victory, ordered Ormus
Talk and one explicit Claim. Literal predecessor validation must be frozen
before changing live domains. [Implemented evidence](../../docs/plans/evidence/ormus-first-charm.md) records
causal regressions, independent source reviews, full units22,247/1,057, strict
types/lint/build and both production-browser cases. No commit has been made;
resolution is on this preserved local branch. Earned balance/full-v1 acceptance
remain open.

## Claim callback regression found during implementation

Read-only review identified a protected-Claim rollback inconsistency: an
`addItem` subscriber can equip an existing noncharm item, then return or throw.
The pending reward is removed and XP restored, but the prior hero cache no
longer matches the surviving authoritative equipment. Reproduction targets
`ormusClaim.test.ts` with real `equipItem`, both callback outcomes and a
composition comparison. The conservation policy preserves this unrelated
inventory transfer and recomposes the restored pre-Claim hero from its surviving
equipment; quest XP, source and pending reward still roll back.
The same review found that removing the captured mercenary during a callback
can discard its authoritative gear map even though rollback reinstates the
actor. A pre-equipped recipient regression requires restoration of that
recipient's gear ownership alongside its actor/progress.

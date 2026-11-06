# BUG-386 — Complete Drognan’s physical tome recovery route

- Severity: High — advertised side quest has no executable recovery path.
- Status: Resolved locally for bounded functionality/current28; broader earned acceptance remains open.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus preserved local changes.
- Environment: Linux/WSL static source/cross-reference reproduction.
- Browser/viewport: not applicable to this source-routing reproduction.
- Locale: zh-CN and en promise a learning tome; numeric reward is XP/+1 skill.
- Seed: not applicable to missing authored object and item wiring.
- Affected systems: content-designer, engine-dev, frontend-dev; root integrates.

## Reproduction

1. Read `quests/side-act2-drognan-tome` in `src/data/quests/side.json`.
2. Resolve `obj-fetch`: its area is obsolete `areas/act2_lost_city`, it has no
   object target, and `quest/sun_cult_tome` is absent from `quests/items.json`.
3. Follow `areaQuestTools` and `recoverQuestTool` in
   `src/features/quests/interactObject.ts`. Definitions drive recovery; the
   generic publication preserves the original quest status.
4. Inspect journal Claim in `src/features/quests/claimReward.ts`: this side has
   no physical-source completion guard.

Expected: actually recover the sun-cult tome in canonical Lost City, complete
the single fetch, then separately Claim the authored numeric reward once.

Actual: no supported recovery object/item exists. Data wiring alone would leave
the single fetch in progress. Historical completed flags also lack a dedicated
receipt guard. Locale copy promises a second learning tome absent from rewards.

## Evidence and repair boundary

Producer’s read-only investigation and root source reads reproduce these paths.
[Approved contract](../../docs/design/drognan-tome.md) preserves the authored
single fetch, 4000 XP/+1 skill point and existing mercenary XP behavior. This
report establishes no browser failure, exploit execution or campaign acceptance.
Implementation follows Warband/current27 local acceptance. CI remains excluded;
no commit, push, deployment or remote change is authorized by this report.

## Integration regression found before acceptance

The ordinary full unit run reproduces two locale failures in
`src/features/map/MapScreen.staff.test.tsx`: its Lost City action query assumes
there is exactly one button named Recover/取回. The newly authored tome cache
correctly adds another recovery control. The error is `Found multiple elements
with the role "button" and name "Recover"` (and Chinese equivalent), retained in
`d2-drognan-jtm67hje/full-unit-v1.log`. Scope the existing staff route test to
its actual component control, retaining the localized name, ownership,
assembly/insertion and no-Read assertions. No production behavior change is
indicated by these selector failures. The focused correction passes2/1 with
localized accessible-name checks and all original assertions retained; scoped
lint and independent review APPROVE. Complete final-source unit coverage
reconciles1075 files/22682 tests, with no unresolved failures. Final strict
types, full lint plus delta/selector lint and production build pass; browser
and cleanup evidence stand. See
[accepted evidence](../../docs/plans/evidence/drognan-tome.md) and retained
`d2-drognan-jtm67hje/current28-acceptance.json`. No uninterrupted full-run pass
or broader private-v1 acceptance is claimed.

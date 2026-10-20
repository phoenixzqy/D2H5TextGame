# P03b05b — guarded manual mercenary unequip

Date2026-10-20; input09fe00f, control../p03b05b-merc-equipment-capacity.md,
BUG030. Root developer/source/test review APPROVE/ADEQUATE; independent QA
source/test/browser-oracle review APPROVE, securityPASS (read-only/no reruns).
Producer independent plan/final source/evidence review APPROVE/ADEQUATE,
read-only/no reruns. Bounded card only.

Manual unequip now refuses backpack_full at>=100, after owner and missing-gear
checks, before either store publication. Current complete payloads/references
remain unchanged;99→100 returns normalized gear once. All empty-slot equips and
nongrowing swaps remain legal, including101/500 overflow. Durable addItem
ingress remains unbounded. UI retains failure reason/item, renders persistent
polite localized feedback outside picker, retranslates on locale changes,
retains gear/picker on refusal, clears on slot change/success. No new copy,
schema/migration, requirement/handedness, reward or economy change.

The temporary manual500→501 expectation in inventory-awards.test.tsx is explicitly
revised to retained500/gear/localized refusal. Its legacy500-item nongrowing swap,
all durable ingress/save tests and P03b05a stale/duplicate/source/Map regressions
remain. Paired synchronous publications retain settled-state semantics, not
atomic cross-store subscriber snapshots.

## Genuine RED and local validation

BUG030 retains first8fail/9pass6.29s at07:26:51UTC, including one test-only
stash-reference baseline error. Corrected baseline after the independent discard;
without runtime changes secondRED **7fail/10pass/2files3.93s** at07:27:15UTC:
actual unequip publications at100/101/500, absent status in both locales with
picker open/closed. No assertions skipped, guards mocked or pass thresholds changed.

- Focused six merc/store/UI files:75pass/6files4.67s, started07:28:28UTC.
- `npm test -- --reporter=dot --silent`:1349pass/117files/no skips29.37s,
  started07:30:15UTC, concurrent browser/build.15s full-unit budget unmet.
- `npm run lint`, forced `npx eslint --no-ignore tests/e2e/merc-equipment-capacity.spec.ts`:
  pass. `npm run build`:pass9.63s, existing chunk/Browserslist/optional manifest
  warnings remain. No engine edit requiring another dedicated engine run.
- Initial typecheck rejected explicit undefined in optional item payload under
  exactOptionalPropertyTypes. After browser/full/build finished, changed only
  absence representation to required Item|null, retaining the same truthy render
  behavior. Final typecheck/final component ESLint pass; both mounted regression
  suites7pass/2files5.61s at07:30:56UTC. Full/browser/build counts above precede
  this null-sentinel correction; no guard/oracle changed. `git diff --check`:pass.

## Ordinary browser route and exact oracles

`E2E_PORT=4336 npx playwright test tests/e2e/merc-equipment-capacity.spec.ts --project=chromium-desktop --project=mobile-portrait --workers=2 --reporter=line --output=/tmp/d2h5-p03b05b-browser-1`

**4/4pass27.4s**, retries0, en/zh-CN at1280×800/360×640, no failed browser attempt.
Fixed Date/native timers, ordinary Sorceress creation/locale/free InnerSight hire,
then explicit imported overflow-recovery fixture, not earned loot. Backpack
[S helm,B boots,F1…F99]101, equipped Old helm; complete Map-bearing gear and
unrelated stash/currency/save sentinels. Ordinary pointer/confirm controls:

| Operation | Backpack count | Complete expected state |
| --- | ---: | --- |
| Refuse head unequip |101| Original unchanged |
| Swap S to head |101| [B,F1…F99,Old]; headS |
| Equip B into empty boots |100| [F1…F99,Old]; headS/bootsB |
| Refuse head unequip |100| Unchanged |
| Swap Old to head |100| [F1…F99,S]; headOld/bootsB |
| Explicit discardF1, unequipOld |100| [F2…F99,S,Old]; headnull/bootsB |
| EquipS into empty head |99| [F2…F99,Old]; headS/bootsB |
| UnequipS |100| [F2…F99,Old,S]; headnull/bootsB |
| Refuse boots unequip |100| Unchanged |
| Explicit discardF2, unequipB |100| [F3…F99,Old,S,B]; head/bootsnull |

Every row matches a complete independently constructed wire-safe expected save,
not a baseline taken after the action. Only explicitly discardedF1/F2 disappear;
all returned flags normalized and complete Maps retained. Refusal status has
exact localized copy/aria-live=polite and visible retained gear. Final ordinary
Save/reload/export retains full final save/locale. No bridge injection, forced
clicks, horizontal overflow or pageerrors; downloads deleted after read.
Existing development config/server, no production/PWA or earned-campaign claim.

Ubuntu26.04 unsupported-host caveat; Node24.21.0/npm11.19.0,
Playwright1.59.1/shared Chromium147. Broader a11y/safe-area/44px/all viewport,
fullP03b/P13/crafting/equipment-combat/economy/performance gates remain open.

## Cleanup and sign-off

After processes/reviewers finished, root verified no listener4336 and removed
only task-owned worktree2dist/node_modules/.vite and
/tmp/d2h5-p03b05b-browser-1, verifying all three absent. Downloads deleted by
the spec. No task process/disposable artifact or cleanup failure remains.
Shared tools/caches/source/history and the claimed worktree remain intact.

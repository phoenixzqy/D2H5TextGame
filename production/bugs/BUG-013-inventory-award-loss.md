# BUG-013 — Retain earned and returned items above inventory limits

Severity: Critical (silent permanent item loss).
Status: fixed scoped P03b02 ingress, 2026-10-20; normal-action guards pending.
Base: `d956e07`. Owner: store/frontend/QA. Environment: Node24.21.0,
Vitest1.6.1 UI/jsdom. Shared store logic in both locales/viewports; actual
reward dispatcher uses seed7, ActI, level1 `loot/trash-act1`.

## Reproduction

1. Fill saved backpack with500 items (or stash2000); call addItem for an earned
   item or returned merc gear. Existing UI nominal caps are100/500.
2. Dispatch actual victory rewards for8 level1 monsters with seed7/stock TC:
   summary reports3 items but the backpack remains500, losing all3 items.
3. Run `npx vitest run --project ui src/stores/inventory-awards.test.tsx --reporter=dot`.

Expected: every earned/returned item is retained in the existing visible,
unbounded saved array, including recovery overflow. UI/store normal-action
limits may refuse reversible transfers later; they must never silently destroy
an irreversible award or gear already removed from a merc.

Actual:13 initial tests give5 failures/8 passes,3.13s; backpack500/501 and
stash2000/2001 reject the new item. Real award returns3 missing items, logs
`backpack is full!`. This report is filed before the source correction.

Root cause: addItem silently refuses a void-returning ingress at500/2000,
while combat/idle-module/merc consumers cannot recover rejection. Lowering
those limits to100/500 would cause earlier loss. Existing saved arrays and
BackpackGrid already support visible legacy overflow. ADR-002 calls caps a
UI/UX guardrail and requires no save migration.

## Controlled scope

Producer independently reviewed P03b02 four-file plan: ready. Own inventory
store, focused award/merc/save integration test, scoped D09 and this report.
Remove ingress rejection; keep ordinary move/equip policies for a later guarded
transaction/UI child. Prove actual nonzero reward materialization, merc owned-ID
conservation and public serialization/import/reload with only disk IO replaced.
No duplicate-award policy, crafting/quest rewards,100/500 enforcement, fresh
balance, general transaction atomicity or full P03b acceptance is claimed.
Legacy idle helper has no production caller; compatibility is not idle proof.
Security check: pass, local lossless state retention; no new IO/permissions,
credentials, policy changes or save-shape change.

Expanded baseline before runtime patch:16 tests,8 failed/8 passed,3.63s.
Actual MercsScreen unequip clears the merc but keeps backpack500 instead of501;
swap equips incoming, removes it from backpack, and drops displaced gear,
leaving499 instead of500. Save proof also fails at missing retained ingress.

## Validation and review

The source correction removes only the void ingress length rejection. Producer
independent four-file source/test review: APPROVE. Final test typing/lint
corrections remove unsupported RTL options and a redundant undefined condition;
no assertion or production behavior was weakened.

- Focused16/16 pass,3.83s; actual reward dispatch, rendered merc operations and
  public export/import/reload all retain the exact item contents and IDs.
- Related32 files/318 passed/1 existing merc-XP skip,14.70s before periodic
  integration; combined full99 files/999 passed/1 existing skip,27.01s.
- Combined engine39 files/382 pass,5.77s. Engine/full suite exceed3s/15s budgets.
- Typecheck, lint and production build pass; build10.95s with existing large
  chunks and2.57MB manifest precache warning. No PWA/performance acceptance.
- Existing ordinary-control overflow browser spec:4/4 pass,26.4s, en/zh-CN
  at1280×800/360×640. Command:
  `E2E_PORT=4295 npx playwright test tests/e2e/inventory-overflow-recovery.spec.ts --project=chromium-desktop --project=mobile-portrait --workers=2 --reporter=line --output=/tmp/d2h5-p03b02-browser`.

Full-suite command: `npm test -- --reporter=dot`. Focused command is above.
Browser proof covers existing selectable overflow/recovery; actual award and
merc ingress are integrated RTL/store assertions, not earned campaign proof.
Regular100/500 guards, quest/crafting atomicity and whole P03b remain open.

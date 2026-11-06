# BUG-710 — Keep equipment keyboard actions independent

Status: Fixed locally; focused unit and bilingual native browser verification pass.
Severity: Medium (pointer activation remains a workaround).
Owner: frontend-dev; root implements locally.

## Reproduction

HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited human2 edits.
Reproduced with Vitest/jsdom in both en and zh-CN; corrected native browser actions pass.
Viewport/seed do not affect the event propagation failure.

1. Open Inventory → Equipment or a mercenary's equipment editor with an item equipped.
2. Focus the item's Details or Unequip button.
3. Press Enter or Space.

Expected: only the focused action activates; each action is a separately exposed
keyboard control. Empty slots still open the picker.
Actual: the enclosing `div[role=button]` consumes the key with `preventDefault`
and calls the slot picker callback. Nested action buttons also have conflicting
button semantics for assistive technology.
Root cause: the shared EquipmentPanel models a row containing actions as one
button and handles every descendant keydown as its own activation.
Workaround: use a pointer for Details/Unequip.

## Evidence and scope

`src/ui/EquipmentPanel.test.tsx`: six pre-edit failures reproduce consumed
keyboard events in both locales and missing independent group semantics; the
read-only control case passes. An initial unsupported matcher was corrected
before the valid RED run; both logs are retained.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-equipment-keyboard-8bv07la4`.
Controlling requirements: docs/plans/playable-target.md G5 and docs/plans/work-plan.md P16.
No gameplay tuning, save-schema changes or campaign replay are required.

## Resolution

Use a named group and separate native sibling slot/Details/Unequip buttons.
Twenty-four affected unit cases, scoped strict types, explicit changed-file lint
and 44 bilingual hero/mercenary geometry observations pass. Browser keyboard
checks cover Details, picker and native full-backpack Unequip refusal, with
unchanged public gameplay exports. Independent/full-app acceptance remains open.
See [focused evidence](../../docs/plans/evidence/p16-equipment-keyboard.md).

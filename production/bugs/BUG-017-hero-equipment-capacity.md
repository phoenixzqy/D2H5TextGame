# BUG-017 — Hero equipment ignores backpack capacity on displacement

Severity: Major (normal equipment actions grow full/overflow containers).
Status: fixed scoped P03b04b hero equipment capacity, 2026-10-20.
Base: `76c178c` (P03b04a authoritative-item prerequisite integrated).

## Reproduction

1. Import a backpack with 100 or 101 items while a weapon and shield are
   equipped, then equip a backpack two-handed sword. Removing one item and
   returning two grows the backpack despite its displayed limit of 100.
2. Unequip hero gear while the backpack has 100 or 101 items: it also grows.
3. Existing backpack and picker actions report success; unequip reports
   success too. No actionable localized capacity refusal appears.

Expected: calculate the actual authoritative displacement before publishing.
Equip is allowed when its final backpack count is at most the larger of 100
and the existing count. Overflow recovery can reduce or retain that count.
Unequip requires existing backpack count below 100. Missing source/base and
eligibility checks retain precedence; empty-slot unequip returns `not_found`.
Refusal changes no inventory/player state, references, publications or derived
stats. The backpack detail/picker candidate remains selected with localized
feedback; the retained picker announces its error inside its own dialog.

Actual baseline: new combined real-store/RTL file has 11 failing and 12 passing
cases (23 total), 4.75s at 05:51:33 UTC, before production edits. Growing swaps
at 100/101, unequips at 100/101 and empty-slot reason fail, plus all six
bilingual feedback cases. Legal full/overflow nongrowing cases already pass.
Command: `npx vitest run --project ui src/stores/hero-equipment-capacity.test.tsx --reporter=dot`.

The pre-fix ordinary English desktop browser also fails: unequip at 101 shows
`Unequipped Short Sword` instead of full-backpack feedback, then its success
toast expires. Command: `E2E_PORT=4307 npx playwright test tests/e2e/hero-equipment-capacity.spec.ts --project=chromium-desktop --grep ' en ' --workers=1 --reporter=line --output=/tmp/d2h5-hero-equipment-red`.

## Controlling plan and scope

Root exact seven-file exception approved; producer plan READY. Store,
InventoryScreen, EquipPicker, combined store/RTL regression, new browser spec,
D09 control and this required bug record form the complete slice. Use shared
nominal capacity and preserve P03b04a first-index authoritative source handling.
No ingress limit, truncation, hidden queue, schema/migration, merc transaction,
automatic discard or global deduplication changes. Full P03b remains open.

Security check PASS: local capacity guards and retention feedback only; no
external IO, credentials, permissions, CI, or agent-behavior changes.

## Validation and review

All 23 focused store/RTL cases pass, 5.57s. Related inventory/authoritative-item/
picker/transfer/hero-capacity validation passes five files / 66 tests, 6.26s
(above the 5s related budget). Full `npm test -- --reporter=dot` passes 104 files /
1107 tests / one existing merc-XP skip, 41.75s Vitest time (43.21s wall time),
above the 15s full-suite budget. Existing act/router warnings remain. Typecheck,
lint, explicit forced lint including the normally ignored browser spec, and
`git diff --check` pass. Production build passes 6.43s, with existing chunk-size,
Browserslist-age and generated-manifest precache warnings. No PWA/performance
acceptance is claimed; no engine-only tier is needed for this slice.

The first post-fix matrix fails all four: three compare CSS-transformed
`innerText` with `textContent`; one mobile English case unexpectedly reaches
the welcome screen while the test files were being edited. The next clean
run, after matching rendered text consistently, passes three of four in 44.7s.
Its mobile English screenshot/snapshot proves the slot-center pointer lands
on the nested Details button, opening the read-only item dialog instead of the
picker. Both picker-open steps now click the exact localized Weapon label
inside the slot, using the ordinary pointer path. No assertion is removed.
Typecheck also caught the new RTL test's unsupported `exact` role-query option;
an anchored accessible-name expression replaces it.

Final corrected-spec browser matrix passes four of four, 23.2s: en/zh-CN ×
1280×800/360×640. It proves full/overflow refusals retain selection/comparison,
the picker error is inside the dialog and viewport with a persistent polite
live region, and ordinary full/overflow nongrowing/reducing equips remain legal.
Recovery explicitly discards only `filler-1` and `filler-2`; exact final arrays,
complete item fields/flags, stash, currencies, expected player derived stats,
other player fields and map values survive ordinary Save/reload/export.
Command: `E2E_PORT=4310 npx playwright test tests/e2e/hero-equipment-capacity.spec.ts --project=chromium-desktop --project=mobile-portrait --workers=2 --reporter=line --output=/tmp/d2h5-hero-equipment-browser-final`.
Earlier post-fix runs use ports 4308/4309 and outputs
`/tmp/d2h5-hero-equipment-browser` / `/tmp/d2h5-hero-equipment-browser-fixed`.

Independent root and producer source/test/control reviews APPROVE, including
the final test-query and localized label-target corrections. No material source
findings. D09 v1c records this contract; merc transactions and full P03b remain
open, and durable earned/returned ingress stays unbounded.

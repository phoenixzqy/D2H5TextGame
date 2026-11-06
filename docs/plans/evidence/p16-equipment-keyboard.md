# P16 — Independent equipment keyboard actions

2026-11-04. BUG710 is fixed locally. Full private v1 remains incomplete.
Controlling requirements: playable-target G5 and work-plan P16.

## Change

The shared EquipmentPanel previously wrapped Details and Unequip buttons in a
synthetic button. Its key handler prevented their native Enter/Space activation
and opened the slot picker. Each equipment row is now a named group containing
separate native slot, Details and Unequip buttons. Native activation needs no
propagation handler. Empty slots still open the picker; read-only slots retain
optional Details. Button types, item descriptions, visible focus, full wrapping
and at least 44 px targets are explicit. Existing wrapper and Details test IDs
remain; picker activation uses the primary button's `-select` ID.

Four caller unit files and eight browser files now activate that primary button.
Wrapper, item ownership and Details assertions are retained. The change touches
no engine, store, data, save schema, reward or combat behavior.

## Verification

- Before implementation: six legitimate failures reproduce intercepted keys and
  missing groups in both languages; the read-only case passes. An earlier matcher
  error remains separately recorded.
- All 24 distinct affected unit cases pass: seven shared component cases,
  fifteen mercenary cases and two bilingual charm workflows. The initial caller
  run's two failures came from an accidentally changed charm Details test ID;
  it was restored and only those workflows rerun. Already-passing mercenary
  cases were not replayed.
- Strict types pass for the fourteen changed TS/TSX files and their dependencies.
  The existing test-bridge module supplies the browser helper's global types.
  Six-file UI/unit lint passes; explicit `--no-ignore` lint of all eight migrated
  browser files passes without warnings. Initial ambient/configuration errors
  and ESLint's skipped-file warnings are preserved rather than credited as passes.
- Installed Chromium uses public new-game/import/export controls with the bridge
  disabled. Hero and mercenary actions in both languages verify ordered Tab focus,
  Enter/Space Details and picker activation, and empty hero slot selection.
  Unequip uses Enter in English and Space in Chinese. The earned fixture has
  184 backpack items against capacity 100: native refusal is verified, equipment
  remains intact, and no picker opens. Successful removal is covered by the
  affected component/caller tests, not claimed as browser evidence.
- Forty-four equipment geometry observations cover both surfaces and languages at
  360×640, 412×915, 640×360, 1280×800, 1920×1080, 320×640, 768×1024,
  1024×768, 1440×900, 375×667 and 393×851. Controls are native siblings,
  at least 44×44, at least 14 px, inside the viewport, with no row/page overflow.
  Representative English hero and Chinese mercenary mobile screenshots were
  visually inspected; all eight screenshots and row accessibility snapshots remain.
- Public baseline/after exports exactly match player, inventory, map, mercs,
  formation, endgame, version and recruitment/gacha domains. Material action
  ordinal remains 908. Browser errors and warnings are zero. A separate file
  readback confirms equality. No combat, crafting, farming or accelerated clock.
- Initial browser attempts correctly rejected a development bridge and then
  exposed the full-backpack fixture assumption. Neither was a game regression;
  both attempts are preserved. Source-server checks are not a production bundle
  or service-worker acceptance test. Five-axis self-review found no remaining
  scoped defect; it is not independent QA.

## Evidence and cleanup

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-equipment-keyboard-8bv07la4`.
Earned input SHA256:
`ac953ed34af41dac8500ce4fbf684db35694cdacbb6c7cf9d556830dd5d0a043`.
It retains the original plan/snapshots, task patch, failures and passing logs,
executed type configuration text, browser scripts/report/public exports,
screenshots/accessibility snapshots, self-review and cleanup receipt.

The exact task server closed normally. All 23 recorded process IDs and four
exact disposable paths are absent: active type configuration, Vite cache and
two browser profiles. No cleanup failure remains. Root retains the required
packet and human2 worktree through unfinished umbrella review, then owns exact
packet cleanup and worktree release.

Counts remain 14/14 intended Act I, 8/14 five-act Normal and 0/210 formal balance
acceptances. Six build routes and wider acquisition/economy/pacing, higher
difficulties/endgame, PWA/a11y/performance and independent acceptance remain open.
No broad suite/build, completed-act replay, new agent, install, CI, commit, push
or publication. No pending question or browser blocker. Human extended playtest
follows implementation.

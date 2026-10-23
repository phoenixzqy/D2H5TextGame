# BUG-090 — Keep distinct earned equipment upgrades selectable

Status: fixed; independent source APPROVE and QA ADEQUATE. Severity: Medium.
Owner: frontend-dev; GD/TD instance-identity contract approved.

Environment: source b47f4c6, Vitest/jsdom React picker, zh-CN; no engine RNG.
Native verification targets production Chromium en/zh-CN at360×640/1280×800.

Reproduction:
1. Equip an owned normal short sword with rolled Attack5.
2. Keep a different owned normal sword of the same base with rolled Attack9.
3. Open the weapon equipment picker and select the second instance.

Expected: show comparison and permit legal swap, increasing actual Attack4,
returning the old instance to backpack without losing/duplicating either ID.
Actual: “already equipped” replaces comparison and disables Equip. One-affix
weapons with different rolled values are also incorrectly blocked.

Cause: the UI equates baseId/rarity/affix count with persistent instance identity.
The store correctly identifies ownership by ID. Already-equipped suppression
must require the exact same persistent ID; distinct equal-roll swaps are legal.
This fixes the upstream picker gate without changing ownership/requirements,
capacity, equipment statistics, saves, content or balance. Producer plan READY;
security pass. Genuine3RED/11passing controls, including exact-ID guard.

Evidence: `src/features/inventory/EquipPicker.test.tsx`; frozen tests/receipt/log
at `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-equip-instance-3lpy4n6g`.
Root retains diagnostics through C1 and removes after dependent readers finish.
Final verification:35focused tests,8546full tests/273files, typecheck, lint,
production build/bridge scan and4production browser cases pass. Browser checks
prove the original earned boots swap, exact IDs/DEF69→70 and save/reopen equality.
Screenshots show selection/Equip; the comparison itself is scrolled offscreen.
See `docs/plans/evidence/p03b06-equip-instance-identity.md` for scope and receipts.
Workaround: the separate item-detail equip action bypasses the false picker gate.

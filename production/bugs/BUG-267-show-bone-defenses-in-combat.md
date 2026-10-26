# BUG-267 — Show paid bone defenses accurately in combat

- Severity: Low; misleading effect presentation, with skill details as a workaround.
- Status: Fixed locally in `bdc747b8`; translated finite-capacity display verified.
- Owner: root acting as frontend/QA owner; no delegation or independent sign-off.
- Environment: Vitest jsdom, paused combat display fixture, en and zh-CN.
  No real browser viewport or RNG applies; a real paid rank1 Wall pool starts at clock0.

## Reproduction

1. Create a legal synthetic Necromancer with Bone Armor1/Wall1/Prison1.
2. Render CombatScreen with an actual `payBoneWall` pool and a finite enemy
   Prison status. Keep the display paused; this fixture does not prove combat.
3. Inspect the Wall chip's text and style, then publish remaining capacity27.
4. Inspect the enemy Prison chip and the ordinary Wall cast-FX translation.

Expected: Wall is a beneficial effect with remaining capacity40, then27;
both effects and cast feedback are translated. Removed effects disappear.

Actual: Wall uses the purple debuff style and shows only `Bone Wall`, including
in Chinese. Prison also falls back to English in Chinese. Remaining capacity
changes are invisible, and the ordinary Wall buff-FX translation key is absent.
The source status updates/removal and input immutability controls pass.

## Cause and correction boundary

CombatScreen's paid-status classification does not include Wall. The combat
locales have no Wall/Prison entries. Add a dedicated capacity-bearing chip key
while keeping generic status/cast names free of unresolved amount placeholders.
Use the actual remaining paid pool; do not infer protection from a bare marker,
change combat timing, alter resources or modify the saved player.

## Evidence

External `bone-combat-chips.prospective.test.tsx` reproduces2failed cases in8.061s;
the complete9791byte log and terminal receipt are retained in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-bone-defenses-6z98386v`.
Log SHA256: `b1177f72e10c0bfa932e0d1c55103e35e8a85f4a8875e130e65b79a591ab02c6`.
No functional skill credit or whole BUG262 closure follows a display correction.

First fix validation passes116focused cases and strict types. Typed lint flags
one redundant `?? ''` on an Element's nonnullable `textContent` in the new test.
Remove that fallback only; retain the original9.652s lint failure and test draft.
No suppression, fixture change or assertion weakening is needed.

## Integrated validation at bdc747b8

Full18359tests/845files/two existing opt-in skips, engine9382/352, strict types, lint, official build/bridge and756URLprecache pass. Regression: src/features/combat/CombatScreen.bone-defenses.test.tsx. Original failures are preserved; details and immutable receipts are in docs/plans/evidence/d06-bone-defenses-core.md and its integrated packet. No new inventory credit or independent/earned/full-v1 acceptance.

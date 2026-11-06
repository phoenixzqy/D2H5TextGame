# P12b / P16 — Runeword bonuses before insertion

2026-11-04. Local implementation and affected verification complete; full
private v1 remains incomplete. Requirements: work-plan P12b/P16, D10 reviewed
grants, playable-target G4/G5 and [guide design](../../design/runeword-guide.md).

## Change

The existing recipe guide now displays the selected word's authored bonus stats
and reviewed equipped grants. Players can inspect active ranks, Mana costs,
cooldowns, self-only effects and Redemption's injured-only healing condition
before spending materials. A labeled bonus list uses the existing tooltip stat
formatter and an extracted shared grant formatter. All35 current word packages
contain fixed values; no unrolled range is represented as a guaranteed result.

The list describes word bonuses. A bilingual note explains that base stats and
ordinary rune effects also apply and directs players to the insertion preview
for the full item. Leaf therefore shows +33 Cold Resist and Fire Bolt's grants,
without incorrectly treating Tir's ordinary +2 Mana as a word bonus. Selection
changes replace the previous effects. Legacy grantsSkills markers never appear
as raw skill IDs.

The item tooltip still calls resolveItemRunewordGrants(item) to validate item
grants; the guide reads reviewed, schema-validated catalog grants directly.
The extracted formatting body is byte-for-byte unchanged. No fake item, new
matching rule, stat/skill tuning, equipment grant, economic action or save change
is introduced. Browsing remains read-only.

## Verification

- Legitimate pre-edit RED: four new bilingual public-panel cases failed because
  the bonus list did not exist. The initial GREEN run passed46 selected cases
  and failed two because the new test expected Cold Resistance/冰霜抗性 rather
  than the existing tooltip's Cold Resist/冰冷抗性. Canonical labels were verified
  in both locale files and the expectations corrected. Only those two cases
  were rerun, and both pass: **48 distinct selected cases pass** overall.
- Selection covers14 guide/insertion/preview panel cases and34 existing tooltip
  unit/grant cases. No broad suite or completed-act replay. Existing selected
  older Modal preview tests retain act warnings; they are not browser errors
  or claimed fixed behavior. Prior target-work evidence is reused unchanged.
- Scoped strict TypeScript, explicit three-file lint, final lint of the corrected
  test and scoped whitespace checks pass. No broad build or dependency install.
- Installed Chromium runs the native app without VITE_E2E or a store bridge.
  The existing earned Fire Sorceress export enters through public Import Save.
  Both languages verify all ten grant families plus Steel/Spirit stat packages:
  **24 effect observations**. Explicit assertions cover flat/ratio units, active
  rank/payment/cooldown, conditional healing, recovery, reflection, self-only
  scope, all Conviction damage types and stale-effect removal.
- **16 geometry observations** cover the new Phoenix/Infinity text in both
  languages at360×640,412×915,640×360,1280×800,1920×1080,375×667,393×851
  and768×1024. No document/guide horizontal overflow; guide controls remain
  at least44×44 and selector text16px. Four effect screenshots were inspected;
  text wraps readably. Accessible list names and keyboard focus are verified.
- Public baseline/after exports exactly match version, player, inventory, map,
  mercs, formation, endgame and recruitment/gacha domains. Material action
  ordinal908 remains unchanged; chosen insertion target/material are preserved.
  A separate exported-file readback confirms equality. Browser console/page
  errors and warnings are zero. No crafting, combat or clock acceleration.

## Evidence and cleanup

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-runeword-effects-a2r6r4cv`.
It retains the prospective plan, before snapshots/hashes, task patch, original
RED/initial GREEN/corrected-case results, scoped checks, browser scripts/report,
public exports, screenshots, focused self-review and cleanup receipt. Earned
source SHA256:
`ac953ed34af41dac8500ce4fbf684db35694cdacbb6c7cf9d556830dd5d0a043`.

The exact owned server closes normally. All three recorded server/browser PIDs
are absent; exact browser profile, Vite cache and active type configuration are
removed and absence verified. No remaining disposables or cleanup failures.
Root retains this required packet and claimed human2 worktree through unfinished
umbrella review, and owns later exact evidence cleanup/worktree release.

## Remaining scope

This closes bonus discoverability only, without new acquisition, crafting,
campaign, combat-utility, economy/pacing, PWA or formal balance acceptance credit.
Counts remain14/14 intended ActI,8/14 five-act Normal and0/210 formal balance
signoffs. Six build routes, wider acquisition/crafting/economy/pacing, higher
difficulties/endgame, PWA/a11y/performance and independent final acceptance remain
open. Full private v1 stays active/incomplete. Browser works; no pending answer
or external blocker. CI stays excluded; no new agent, install, commit, push or
publication. Extended human playtesting follows implementation.

# Wave C — E2E coverage audit follow-ups

Tracks gaps identified during Wave C playthrough-spec pruning (P08) that are
**not** blocking ship.

## Open gaps

### Multi-screen session state-survival (low severity)

Multi-screen session state-survival coverage gap remains. Initial attempt at
`tests/e2e/playthrough/multi-screen-session.spec.ts` (added in fixup `2bb058c`)
was unstable and removed on `integration/perf-waveC`. It needs a refactor based
on the canonical post-combat navigation pattern from
`class-casts-skill.spec.ts` / `xp-after-fight.spec.ts` (use `_setup.ts` store
helpers — `enterFirstCombat`, `boostPlayer`, `skipViaStore` — rather than the
older `_helpers.ts` `waitForBattleResolution` + `returnToTownFromCombat`
flow), and against UI test-ids that actually exist.

**Root cause of the original failure** (for whoever picks this up):
1. The deleted spec asserted on test-ids `character-screen`, `char-name`,
   `char-level`, `char-xp` — none of which exist anywhere in `src/`.
2. `CharacterHud` is intentionally hidden on `/combat` (see
   `src/ui/CharacterHud.tsx` `HIDDEN_PATHS`), so clicking
   `getByTestId('character-hud')` immediately after `waitForBattleResolution`
   (still on the combat screen, victory panel up) can never resolve — that's
   the line-49 timeout the test was hitting.

**Severity: low.**
- Sub-specs collectively cover all individual screens.
- Only the multi-step in-session chain (home → town → map → combat → inv →
  skills → mercs → town) is uncovered.
- `save-load.spec.ts` already covers reload-survival of the same state.

**Owner:** `qa-engineer`.

**Acceptance criteria when re-attempting:**
- Use `_setup.ts` helpers (`enterFirstCombat`, `boostPlayer`, `skipViaStore`).
- After victory panel appears, click `return-to-town` (do **not** try to open
  the HUD from `/combat`).
- Read character state via the `__GAME__` test bridge
  (`window.__GAME__.player.getState().player`) instead of DOM scraping
  non-existent test-ids — or, if DOM-scraping is required, add the missing
  test-ids to `CharacterScreen` first.
- Must pass 3× consecutively on `chromium-desktop` before merge.

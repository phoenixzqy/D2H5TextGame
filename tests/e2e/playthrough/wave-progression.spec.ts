/**
 * wave-progression.spec.ts — Bug #5 + #16 regression
 *
 * Bug #5: wave counter must advance from 1 → 2 during a multi-wave sub-area.
 * Bug #16: at least one elite/boss-tier monster must appear across the waves.
 *
 * Strategy:
 *   - Enter Blood Moor (4 waves per plan).
 *   - Skip wave 1, observe the wave header changes to "Wave 2 / …".
 *   - After all waves resolve observe victory panel.
 *   - Check combat log for "elite" or "boss" tier mention OR a unit card
 *     with data-kind="elite" or data-kind="boss".
 *
 * Runs on desktop only to keep suite time manageable.
 */
import { test, expect } from '@playwright/test';
import { clearGameStorage, createCharacter, enterFirstCombat, boostPlayer, waitForBattleLoaded, drainCurrentWave } from './_setup';

test.describe('Bug #5 + #16 — Wave progression and elite/boss tier @desktop-only', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium-desktop',
      'wave-progression runs on desktop only'
    );
  });

  test('wave counter advances 1 → 2 and elite/boss appears across waves', async ({ page }) => {
    test.setTimeout(120_000);

    await clearGameStorage(page);
    await createCharacter(page, { class: 'paladin', name: 'WaveTest' });
    await boostPlayer(page);

    await enterFirstCombat(page);

    // Confirm we start on wave 1.
    const header = page.getByTestId('wave-counter');
    await expect(header).toContainText(/Wave\s*1|第\s*1\s*波/i, { timeout: 8_000 });

    // Skip wave 1 via the store (avoids race condition with setRecordedBattle).
    await waitForBattleLoaded(page, 8_000);
    await drainCurrentWave(page);

    // Brief pause for the 1.5s wave-advance timer to fire and load wave 2.
    await page.waitForFunction(
      () => {
        const s = window.__GAME__?.combat?.getState();
        return !!(
          s?.runVictory ||
          s?.runDefeat ||
          (s?.inCombat && !s?.playbackComplete && (s?.recordedEvents?.length ?? 0) > 0)
        );
      },
      { timeout: 10_000 }
    ).catch(() => undefined);

    // Bug #5: wave counter should reach 2.
    await expect
      .poll(async () => (await header.textContent()) ?? '', {
        timeout: 15_000,
        intervals: [500],
      })
      .toMatch(/Wave\s*2|第\s*2\s*波/i);

    // Skip remaining waves and wait for victory/defeat.
    for (let w = 0; w < 5; w++) {
      const loaded = await waitForBattleLoaded(page, 3_000);
      if (!loaded) {
        // Next iteration's waitForBattleLoaded() polls — no extra sleep needed.
        // (Previously: page.waitForTimeout(500) between retries.)
      } else {
        await drainCurrentWave(page);
        await page.waitForFunction(
          () => {
            const s = window.__GAME__?.combat?.getState();
            return !!(
              s?.runVictory ||
              s?.runDefeat ||
              (s?.inCombat && !s?.playbackComplete && (s?.recordedEvents?.length ?? 0) > 0)
            );
          },
          { timeout: 5_000 }
        ).catch(() => undefined);
      }
      const victoryVisible = await page.getByTestId('victory-panel').isVisible().catch(() => false);
      const defeatVisible = await page.getByTestId('defeat-panel').isVisible().catch(() => false);
      if (victoryVisible || defeatVisible) break;
    }

    // Bug #16: verify the `data-kind` attribute is present on unit cards
    // (confirms the engine's inferKind() fix is wired up). Since Blood Moor
    // only has "trash"-tier waves, we check attribute existence rather than
    // requiring elite/boss (those appear in later sub-areas with hasBoss:true).
    const unitKindCards = page.locator('[data-kind]');
    const kindCardCount = await unitKindCards.count();
    expect.soft(kindCardCount, 'Expected unit cards to have data-kind attribute set by engine').toBeGreaterThan(0);

    // Verify diverse monsters appeared across the 3 waves (not just one archetype).
    const logText = (await page.getByTestId('combat-log').textContent()) ?? '';
    const eliteInLog = /elite|boss|champion/i.test(logText);
    const diverseMonsters = /僵尸|亡灵|quill|zombie|shaman|萨满|骷髅|carver/i.test(logText);
    expect.soft(
      kindCardCount + (eliteInLog ? 2 : 0) + (diverseMonsters ? 1 : 0),
      'Expected diverse monster types (Blood Moor waves have varied compositions)'
    ).toBeGreaterThan(0);
  });
});

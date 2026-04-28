/**
 * combat-cards.spec.ts — verifies the realtime, card-driven combat playback.
 *
 *   • Player + enemy GameCards are visible with rarity frames.
 *   • HP bars animate (width changes between samples) — proves the tick
 *     scheduler is feeding the playback hook in real time, not all at once.
 *   • Combat log accumulates entries one at a time.
 *   • Combat resolves with a player victory; loot panel shows.
 *
 * Runs at desktop (1280×800) AND mobile (360×640) viewports.
 */
import { test, expect, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  clearGameStorage,
  createCharacter,
  type CharacterClass,
} from './_helpers';

const SHOT_DIR = path.join(process.cwd(), 'playwright-report', 'qa-screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });
});

const CLASSES: CharacterClass[] = ['barbarian', 'sorceress'];

async function enterFirstCombat(page: Page): Promise<void> {
  await page.locator('a[href="/town"]').first().click();
  await expect(page.getByTestId('town-screen')).toBeVisible();
  await page.getByTestId('town-set-out').click();
  await expect(page.getByTestId('map-screen')).toBeVisible();
  await page.getByRole('button', { name: /进入|Enter/i }).first().click();
  await expect(page.getByTestId('combat-screen')).toBeVisible({ timeout: 10_000 });
  // Park the cursor — pause-on-hover would otherwise stall playback.
  await page.mouse.move(0, 0);
}

/** Read the first hp progressbar width (computed) for the given selector. */
async function readHpWidth(page: Page, cardSelector: string): Promise<number> {
  return page.evaluate((sel) => {
    const card = document.querySelector(sel);
    if (!card) return -1;
    const bar = card.querySelector(
      '[role="progressbar"][aria-label="hp"] > div'
    ) as HTMLElement | null;
    if (!bar) return -1;
    // inline style "width: 88.34%"
    const m = /width:\s*([\d.]+)%/.exec(bar.getAttribute('style') ?? '');
    return m?.[1] ? parseFloat(m[1]) : -1;
  }, cardSelector);
}

for (const cls of CLASSES) {
  test.describe(`Combat cards [${cls}]`, () => {
    test(`real-time playback resolves with victory @ ${cls}`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(120_000);

      const isMobile = testInfo.project.name === 'mobile-portrait';
      const viewportTag = isMobile ? 'mobile' : 'desktop';

      await clearGameStorage(page);
      await createCharacter(page, { class: cls, name: `QA${cls.slice(0, 3)}` });
      await enterFirstCombat(page);

      // 1) Player + enemy cards are visible.
      const allyCard = page.locator('[data-testid^="ally-card-"]').first();
      const enemyCard = page.locator('[data-testid^="enemy-card-"]').first();
      await expect(allyCard).toBeVisible();
      await expect(enemyCard).toBeVisible();

      // 2) HP bars animate. Sample at t=0, wait ≥1.2s, sample again.
      // Either the player or *some* enemy bar must change (fight is in flight).
      const enemyCount = await page
        .locator('[data-testid^="enemy-card-"]')
        .count();
      const enemySelectors = await page
        .locator('[data-testid^="enemy-card-"]')
        .evaluateAll((els) =>
          els.map((e) => `[data-testid="${e.getAttribute('data-testid') ?? ''}"]`)
        );

      const before: number[] = [
        await readHpWidth(page, '[data-testid^="ally-card-"]'),
        ...(await Promise.all(
          enemySelectors.map((s) => readHpWidth(page, s))
        )),
      ];
      expect(enemyCount).toBeGreaterThan(0);

      await page.waitForTimeout(1500);
      // Re-park cursor in case it drifted onto the log.
      await page.mouse.move(0, 0);

      const after: number[] = [
        await readHpWidth(page, '[data-testid^="ally-card-"]'),
        ...(await Promise.all(
          enemySelectors.map((s) => readHpWidth(page, s))
        )),
      ];

      const anyChanged = before.some((v, i) => {
        const b = after[i];
        return typeof b === 'number' && Math.abs(b - v) > 0.01;
      });
      expect(
        anyChanged,
        `HP bars did not animate within 1.5s (before=${before.join(',')} after=${after.join(',')}). Real-time tick is not driving playback.`
      ).toBe(true);

      // 3) Combat log accumulates entries between two reads ≥500ms apart.
      const log = page.getByTestId('combat-log');
      const entriesA = await log.locator('> div').count();
      await page.waitForTimeout(700);
      await page.mouse.move(0, 0);
      const entriesB = await log.locator('> div').count();
      expect(
        entriesB,
        `Combat log did not accumulate entries (a=${entriesA} b=${entriesB}).`
      ).toBeGreaterThan(entriesA);

      // 4) Take a screenshot before fast-forwarding to victory.
      await page.screenshot({
        path: path.join(SHOT_DIR, `combat-cards-${viewportTag}-${cls}.png`),
        fullPage: true,
      });

      // 5) Fast-forward via Skip → battle resolves with player victory.
      const speedBtn = page.getByTestId('combat-speed-btn');
      // 1× → 2× → 4× → skip
      for (let i = 0; i < 3; i++) {
        await speedBtn.click().catch(() => undefined);
        await page.waitForTimeout(20);
      }
      await page.mouse.move(0, 0);

      await expect(log).toContainText(/wins|draw/i, { timeout: 60_000 });
      const text = (await log.textContent()) ?? '';
      expect(text).toMatch(/player side wins/i);

      // Loot summary should be visible (currency-only is acceptable).
      await expect(page.getByTestId('loot-summary')).toBeVisible({
        timeout: 5_000,
      });
    });
  });
}

/**
 * welcome-gate.spec.ts — Tests RequireCharacter route guard
 * Verifies that users without a character cannot access in-game routes,
 * and that Settings hides the bottom nav when accessed from the welcome page.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Ensure .screenshots directory exists
test.beforeAll(() => {
  const screenshotDir = path.join(process.cwd(), '.screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
});

test.describe('Welcome Gate - No Character @responsive', () => {
  test('settings from welcome shows back button, no bottom nav @smoke', async ({ page }, testInfo) => {
    // Clear storage to ensure no character exists
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      if (window.indexedDB) {
        indexedDB.deleteDatabase('d2h5-game');
      }
    });
    await page.reload();

    // Verify we're on the home screen
    await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 10000 });

    // Click Settings button
    await page.getByTestId('home-settings').click();

    // Verify we're on settings page
    await expect(page.getByTestId('settings-screen')).toBeVisible();

    // Verify the back button is present (exists when no character)
    await expect(page.getByTestId('settings-back-home')).toBeVisible();

    // Verify NO bottom nav links are present
    // BottomNav renders links to /town, /map, /combat, /inventory, /skills, /mercs, /gacha, /quests
    const townLink = page.getByRole('link', { name: /营地|Town/i });
    const mapLink = page.getByRole('link', { name: /地图|Map/i });
    const combatLink = page.getByRole('link', { name: /战斗|Combat/i });
    const inventoryLink = page.getByRole('link', { name: /背包|Inventory/i });
    const skillsLink = page.getByRole('link', { name: /技能|Skill/i });
    const mercsLink = page.getByRole('link', { name: /佣兵|Merc/i });
    const gachaLink = page.getByRole('link', { name: /招募|Gacha/i });
    const questsLink = page.getByRole('link', { name: /任务|Quest/i });

    // All should NOT be visible (not present in DOM when hideNav={true})
    await expect(townLink).not.toBeVisible();
    await expect(mapLink).not.toBeVisible();
    await expect(combatLink).not.toBeVisible();
    await expect(inventoryLink).not.toBeVisible();
    await expect(skillsLink).not.toBeVisible();
    await expect(mercsLink).not.toBeVisible();
    await expect(gachaLink).not.toBeVisible();
    await expect(questsLink).not.toBeVisible();

    // Capture screenshot showing the back button and no nav
    const isDesktop = testInfo.project.name.includes('desktop');
    const viewportPrefix = isDesktop ? 'desktop' : 'mobile';
    await page.screenshot({
      path: `.screenshots/${viewportPrefix}-settings.png`,
      fullPage: true
    });

    // NOW test the happy path: go back, create character, verify nav shows
    // Click back button to return to home
    await page.getByTestId('settings-back-home').click();
    await expect(page.getByTestId('home-screen')).toBeVisible();

    // Click "New Game"
    await page.getByTestId('home-new-game').click();

    // Fill character creation form
    await expect(page.getByTestId('character-create')).toBeVisible();
    await page.getByTestId('class-amazon').click();
    await page.getByTestId('character-name-input').fill('TestGateHero');
    await page.getByTestId('character-start-btn').click();

    // Should land in town
    await expect(page.getByTestId('town-screen')).toBeVisible({ timeout: 10000 });

    // Navigate to settings via bottom nav
    const settingsNavLink = page.getByRole('link', { name: /设置|Setting/i });
    await expect(settingsNavLink).toBeVisible();
    await settingsNavLink.click();

    // Verify we're on settings
    await expect(page.getByTestId('settings-screen')).toBeVisible();

    // Verify bottom nav IS visible now (we should see the town link)
    const townLinkAfter = page.getByRole('link', { name: /营地|Town/i });
    await expect(townLinkAfter).toBeVisible();

    // Verify back button is NOT present (hideNav={false} when character exists)
    const backButton = page.getByTestId('settings-back-home');
    await expect(backButton).not.toBeVisible();
  });

  test('direct navigation to /town redirects to home', async ({ page }) => {
    // Clear storage to ensure no character exists
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      if (window.indexedDB) {
        indexedDB.deleteDatabase('d2h5-game');
      }
    });
    await page.reload();

    // Try to navigate directly to /town
    await page.goto('/town');

    // Should be redirected to home screen
    await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 10000 });

    // Verify URL is home
    expect(page.url()).toMatch(/\/$/);
  });
});

/**
 * mobile-bottom-nav.spec.ts — mobile layout regression
 *
 * At 360×640 viewport:
 *   - The bottom nav must be visible.
 *   - The document must not overflow horizontally (scrollWidth === clientWidth).
 *   - All nav tap targets must be ≥ 44px in height.
 *
 * Runs on mobile-portrait project only.
 */
import { test, expect } from '@playwright/test';
import { clearGameStorage, createCharacter } from './_setup';

test.describe('Mobile bottom nav — layout integrity @mobile-only', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile-portrait',
      'mobile-bottom-nav runs on mobile-portrait only'
    );
  });

  test('nav fits within 360×640, no horizontal overflow, tap targets ≥ 44px', async ({ page }) => {
    test.setTimeout(60_000);

    await clearGameStorage(page);
    await createCharacter(page, { class: 'amazon', name: 'NavTest' });

    await expect(page.getByTestId('town-screen')).toBeVisible({ timeout: 10_000 });

    // 1. Nav is visible.
    const nav = page.locator('nav[aria-label]').first();
    await expect(nav).toBeVisible();

    // 2. No horizontal overflow on the document.
    const overflow = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      return body.scrollWidth > html.clientWidth || html.scrollWidth > html.clientWidth;
    });
    expect(overflow, 'document must not overflow horizontally').toBe(false);

    // 3. Each nav link must have a tap target ≥ 44px.
    const navLinks = nav.locator('a');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    for (let i = 0; i < linkCount; i++) {
      const link = navLinks.nth(i);
      const box = await link.boundingBox();
      if (box) {
        expect(
          box.height,
          `Nav link ${String(i)} height ${String(box.height)}px should be ≥ 44px`
        ).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

/**
 * stealth.spec.ts — workplace-discretion mode.
 *
 * Toggles stealth ON in Settings, then on Town:
 *   - imgs are visually hidden (opacity:0 / visibility:hidden via CSS)
 *   - rarity color classes are neutralized to gray
 *   - stealth indicator element is in the DOM
 */
import { test, expect } from '@playwright/test';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

test.describe('Stealth mode @responsive', () => {
  test('localizes the badge while hiding images and neutralizing rarity colors', async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => { errors.push(error.message); });
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text());
    });
    await clearGameStorage(page);
    await createCharacter(page, { class: 'necromancer', name: 'Quiet' });

    // Toggle stealth ON
    await navTo(page, 'settings');
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await page.getByRole('button', { name: 'English', exact: true }).click();
    const stealthToggle = page.getByTestId('toggle-stealth');
    await expect(stealthToggle).not.toBeChecked();
    await stealthToggle.check();
    await expect(stealthToggle).toBeChecked();

    // The visible badge uses the current locale, including a live language change.
    const badge = page.getByTestId('stealth-indicator');
    await expect(badge).toHaveText('Stealth Mode');
    await expect(badge).toBeVisible();
    expect(await page.locator('body').evaluate((body) => getComputedStyle(body, '::before').content))
      .not.toContain('摸鱼模式');
    await testInfo.attach('stealth-en', { body: await page.screenshot(), contentType: 'image/png' });
    await page.getByRole('button', { name: '简体中文', exact: true }).click();
    await expect(badge).toHaveText('摸鱼模式');
    await expect(stealthToggle).toBeChecked();
    await testInfo.attach('stealth-zh', { body: await page.screenshot(), contentType: 'image/png' });
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect(badge).toHaveText('Stealth Mode');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await expect(badge).toHaveText('Stealth Mode');
    await expect(badge).toBeVisible();
    await expect(stealthToggle).toBeChecked();

    // body.stealth class applied
    const bodyClass = await page.evaluate(() => document.body.className);
    expect(bodyClass).toContain('stealth');

    // Town: assert imgs are hidden via CSS
    await navTo(page, 'town');
    await expect(page.getByTestId('town-screen')).toBeVisible();

    const imgVisuals = await page.evaluate(() => {
      const out: { src: string; visibility: string; opacity: string }[] = [];
      document.querySelectorAll('img').forEach((img) => {
        const cs = window.getComputedStyle(img);
        out.push({
          src: img.getAttribute('src') ?? '',
          visibility: cs.visibility,
          opacity: cs.opacity,
        });
      });
      return out;
    });
    expect(imgVisuals.length).toBeGreaterThan(0);
    for (const v of imgVisuals) {
      const hidden =
        v.visibility === 'hidden' || parseFloat(v.opacity) === 0;
      expect(hidden, `img ${v.src} should be hidden in stealth mode`).toBe(
        true
      );
    }

    // Rarity colors neutralized: pick a known .text-d2-gold element
    // (HUD name, town header) and verify its computed color is neutral gray
    // (gray-400 = rgb(156, 163, 175)) and not the gold rgb.
    const goldColor = await page.evaluate(() => {
      const el = document.querySelector('.text-d2-gold');
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      return cs.color;
    });
    expect(goldColor, '.text-d2-gold must exist on a stealth screen').not.toBe(
      null
    );
    // Stealth CSS forces #9ca3af (gray-400). Whatever the original gold was,
    // it should NOT be a saturated yellow/gold any more.
    if (goldColor) {
      expect(goldColor).toBe('rgb(156, 163, 175)');
    }

    // Toggle OFF and confirm indicator disappears
    await navTo(page, 'settings');
    await page.getByTestId('toggle-stealth').uncheck();
    await expect(page.getByTestId('stealth-indicator')).toHaveCount(0);
    const bodyClassAfter = await page.evaluate(() => document.body.className);
    expect(bodyClassAfter).not.toContain('stealth');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
});

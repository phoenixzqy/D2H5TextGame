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

test.describe('Stealth mode @desktop-only', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium-desktop',
      'desktop only — stealth styles are viewport-agnostic'
    );
  });

  test('toggling stealth hides images and neutralizes rarity colors', async ({
    page,
  }) => {
    await clearGameStorage(page);
    await createCharacter(page, { class: 'necromancer', name: 'Quiet' });

    // Toggle stealth ON
    await navTo(page, 'settings');
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    const stealthToggle = page.getByTestId('toggle-stealth');
    await expect(stealthToggle).not.toBeChecked();
    await stealthToggle.check();
    await expect(stealthToggle).toBeChecked();

    // Stealth indicator element renders in the React tree
    await expect(page.getByTestId('stealth-indicator')).toBeAttached();

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
    // If there are any imgs, every one of them must be hidden.
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
  });
});

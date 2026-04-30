/**
 * i18n.spec.ts — locale switch zh-CN ⇄ en, no missing keys.
 */
import { test, expect } from '@playwright/test';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

test.describe('i18n locale switching @responsive', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium-desktop',
      'desktop only — locale toggle is locale-agnostic'
    );
  });

  test('zh-CN default + en switch, no missing keys', async ({ page }) => {
    await clearGameStorage(page);
    await createCharacter(page, { class: 'paladin', name: 'L10n' });

    // === Default zh-CN ===
    // Town screen — Chinese
    await expect(page.getByTestId('town-screen')).toBeVisible();
    const townZh = (await page.textContent('body')) ?? '';
    // "营地" (town) and "出发" (set out) are user-facing zh strings
    expect(townZh).toContain('营地');
    expect(townZh).toContain('出发');
    // Character namespace strings — open character screen
    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('character-screen')).toBeVisible();
    const charZh = (await page.textContent('body')) ?? '';
    expect(charZh).toContain('角色');
    expect(charZh).not.toMatch(/\[missing/i);

    // === Switch to en ===
    await navTo(page, 'settings');
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await page.getByRole('button', { name: 'English' }).click();
    // Page should now render English chrome — body text reflects new strings.
    const settingsEn = (await page.textContent('body')) ?? '';
    expect(settingsEn).toContain('Settings');
    expect(settingsEn).toContain('Language');
    expect(settingsEn).not.toMatch(/\[missing/i);

    // Town in English
    await navTo(page, 'town');
    await expect(page.getByTestId('town-screen')).toBeVisible();
    const townEn = (await page.textContent('body')) ?? '';
    expect(townEn).toContain('Town');
    expect(townEn).toContain('Set Out');
    expect(townEn).not.toMatch(/\[missing/i);
    // The previous Chinese label should be gone
    expect(townEn).not.toContain('出发');

    // Map in English
    await navTo(page, 'map');
    await expect(page.getByTestId('map-screen')).toBeVisible();
    const mapEn = (await page.textContent('body')) ?? '';
    expect(mapEn).not.toMatch(/\[missing/i);
    // common: "Level" should be present in some recommended-level / level
    // labels somewhere on screen.
    expect(mapEn.toLowerCase()).toMatch(/level|act/);

    // Inventory in English
    await navTo(page, 'inventory');
    await expect(page.getByTestId('inventory-screen')).toBeVisible();
    const invEn = (await page.textContent('body')) ?? '';
    expect(invEn).not.toMatch(/\[missing/i);
    // tabs include Backpack/Stash/Equipment in en
    expect(invEn).toMatch(/Backpack|Stash|Equipment/i);
  });
});

/**
 * inventory-overhaul.spec.ts — Inventory UX overhaul verification.
 *
 * Covers the four issues delivered in feat/inventory-ux-overhaul:
 *   1. Two-column layout on desktop, mobile bottom sheet under md.
 *   2. Rich detail panel renders on selection.
 *   3. Bulk discard toolbar + confirm dialog (en locale).
 *   4. Sell→Discard rename: button reads "Discard" / "丢弃".
 *
 * Captures screenshots into .screenshots/inventory-overhaul/ as artefacts.
 */
import { test, expect, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const SHOT_DIR = path.join(process.cwd(), '.screenshots', 'inventory-overhaul');

test.beforeAll(() => {
  if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });
});

async function seedItem(
  page: Page,
  baseId: string,
  rarity: 'normal' | 'magic' | 'rare' | 'unique' = 'normal',
  level = 1
): Promise<string> {
  return page.evaluate(
    ({ baseId, rarity, level }) => {
      const game = (window as unknown as {
        __GAME__?: {
          seedItem: (
            baseId: string,
            opts?: { rarity?: string; level?: number }
          ) => string;
        };
      }).__GAME__;
      if (!game) throw new Error('test bridge not installed');
      return game.seedItem(baseId, { rarity, level });
    },
    { baseId, rarity, level }
  );
}

async function setLanguage(page: Page, lang: 'zh-CN' | 'en'): Promise<void> {
  await page.evaluate((l) => {
    localStorage.setItem('i18nextLng', l);
  }, lang);
}

test.describe('Inventory overhaul — desktop two-column layout @desktop-only', () => {
  test('opens detail sidebar; bulk toolbar visible; close dismisses', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium-desktop', 'desktop-only');
    test.setTimeout(60_000);

    await clearGameStorage(page);
    await createCharacter(page, { class: 'barbarian', name: 'InvDesk' });
    const seededId = await seedItem(page, 'items/base/wp1h-short-sword', 'normal', 1);

    await navTo(page, 'inventory');
    await expect(page.getByTestId('inventory-screen')).toBeVisible();
    // Bulk toolbar is visible by default on backpack tab.
    await expect(page.getByTestId('bulk-discard-toolbar')).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, 'desktop-zh-collapsed.png'), fullPage: false });

    // Click the item; sidebar opens.
    await page.getByTestId(`inv-item-${seededId}`).click();
    const sidebar = page.getByTestId('inv-detail-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByTestId('inv-detail-panel')).toBeVisible();
    // Discard action labelled "丢弃" (zh-CN default).
    const discard = sidebar.getByTestId('inv-discard-action');
    await expect(discard).toBeVisible();
    await expect(discard).toHaveText(/丢弃|Discard/);
    await page.screenshot({ path: path.join(SHOT_DIR, 'desktop-zh-open.png'), fullPage: false });

    // Close button dismisses.
    await sidebar.getByTestId('inv-detail-close').click();
    await expect(page.getByTestId('inv-detail-sidebar')).toHaveCount(0);
  });
});

test.describe('Inventory overhaul — mobile bottom sheet @mobile-only', () => {
  test('selecting item opens bottom sheet; backdrop tap dismisses', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile-portrait', 'mobile-only');
    test.setTimeout(60_000);

    await clearGameStorage(page);
    await createCharacter(page, { class: 'barbarian', name: 'InvMob' });
    const seededId = await seedItem(page, 'items/base/wp1h-short-sword', 'normal', 1);

    await navTo(page, 'inventory');
    await expect(page.getByTestId('inventory-screen')).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, 'mobile-zh-collapsed.png'), fullPage: false });

    await page.getByTestId(`inv-item-${seededId}`).click();
    const sheet = page.getByTestId('inv-detail-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByTestId('inv-detail-panel')).toBeVisible();
    // Desktop sidebar must NOT be in DOM on mobile (exclusive render).
    await expect(page.getByTestId('inv-detail-sidebar')).toHaveCount(0);
    await page.screenshot({ path: path.join(SHOT_DIR, 'mobile-zh-sheet.png'), fullPage: false });

    // Tap backdrop to dismiss.
    await page.getByTestId('inv-detail-backdrop').click({ position: { x: 5, y: 5 } });
    await expect(sheet).toHaveCount(0);
  });
});

test.describe('Inventory overhaul — bulk discard (en) @desktop-only', () => {
  test('discardNormal opens confirm with preview, removes items', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium-desktop', 'desktop-only');
    test.setTimeout(60_000);

    await clearGameStorage(page);
    await setLanguage(page, 'en');
    await createCharacter(page, { class: 'barbarian', name: 'InvBulk' });
    // Seed three normal items.
    await seedItem(page, 'items/base/wp1h-short-sword', 'normal', 1);
    await seedItem(page, 'items/base/wp1h-short-sword', 'normal', 1);
    await seedItem(page, 'items/base/wp1h-short-sword', 'normal', 1);

    await navTo(page, 'inventory');
    await expect(page.getByTestId('inventory-screen')).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, 'desktop-en-collapsed.png'), fullPage: false });

    const btn = page.getByTestId('bulk-discard-normal');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
    await btn.click();

    const preview = page.getByTestId('bulk-discard-preview');
    await expect(preview).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, 'desktop-en-bulk-confirm.png'), fullPage: false });

    await page.getByTestId('bulk-discard-confirm').click();
    // After confirm, no inventory cards remain.
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(0);
  });
});

test.describe('Inventory overhaul — no console errors @desktop-only', () => {
  test('opening + interacting with inventory produces no console errors', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium-desktop', 'desktop-only');
    test.setTimeout(60_000);

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await clearGameStorage(page);
    await createCharacter(page, { class: 'barbarian', name: 'InvErr' });
    const seededId = await seedItem(page, 'items/base/wp1h-short-sword', 'normal', 1);

    await navTo(page, 'inventory');
    await page.getByTestId(`inv-item-${seededId}`).click();
    await expect(page.getByTestId('inv-detail-sidebar')).toBeVisible();
    await page.getByTestId('inv-detail-close').click();

    expect(errors, `console errors: ${errors.join('\n')}`).toHaveLength(0);
  });
});

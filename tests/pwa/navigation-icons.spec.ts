/** Fresh disposable characters; no earned campaign or whole-app accessibility acceptance. */
import { test, expect } from '@playwright/test';
import { createCharacter, navTo } from '../e2e/_helpers';

const routes = [
  'town',
  'map',
  'combat',
  'inventory',
  'skills',
  'mercs',
  'quests',
  'settings'
] as const;
const sizes = [
  { width: 360, height: 640 },
  { width: 412, height: 915 },
  { width: 640, height: 360 },
  { width: 1280, height: 800 },
  { width: 1920, height: 1080 }
];

for (const viewport of sizes)
  test.describe(`${String(viewport.width)}x${String(viewport.height)}`, () => {
    const mobile = viewport.width < 768;
    test.use({ viewport, isMobile: mobile, hasTouch: mobile });
    for (const locale of ['en', 'zh-CN'])
      test(`recognizable localized navigation survives offline ${locale}`, async ({
        page,
        context
      }, info) => {
        const errors: string[] = [];
        const watch = (p: typeof page) => {
          p.on('pageerror', (e) => errors.push(e.message));
          p.on('console', (m) => {
            if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text());
          });
        };
        watch(page);
        await page.goto('/');
        await createCharacter(page, { class: 'sorceress', name: 'Navigation Test' });
        await navTo(page, 'settings');
        await page
          .getByRole('button', { name: locale === 'en' ? 'English' : '简体中文', exact: true })
          .click();
        const names =
          locale === 'en'
            ? ['Town', 'Map', 'Combat', 'Inventory', 'Skills', 'Mercs', 'Quests', 'Settings']
            : ['营地', '地图', '战斗', '背包', '技能', '佣兵', '任务', '设置'];
        const nav = page.getByRole('navigation', {
          name: locale === 'en' ? 'Main navigation' : '主导航'
        });
        await expect(nav.getByRole('link')).toHaveCount(8);
        for (const [index, route] of routes.entries()) {
          const link = nav.locator(`a[href="/${route}"]`);
          await expect(link).toHaveAccessibleName(names[index] ?? '');
          await expect(link.locator('svg')).toHaveAttribute('aria-hidden', 'true');
          await expect(link.locator('svg')).toHaveAttribute('focusable', 'false');
        }
        const geometry = await nav.evaluate((element) =>
          Array.from(element.querySelectorAll('a')).map((link) => {
            const box = link.getBoundingClientRect(),
              svg = link.querySelector('svg');
            const shape = svg?.querySelector('path')?.getBBox();
            const label = link.querySelector('span');
            const front = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
            return {
              href: link.getAttribute('href'),
              name: link.textContent,
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
              right: box.right,
              bottom: box.bottom,
              foreground: front !== null && link.contains(front),
              shapeWidth: shape?.width ?? 0,
              shapeHeight: shape?.height ?? 0,
              iconWidth: svg?.getBoundingClientRect().width ?? 0,
              stroke: svg ? getComputedStyle(svg).stroke : '',
              clippedLabel: label ? label.scrollWidth > label.clientWidth : false
            };
          })
        );
        for (const link of geometry) {
          expect(link.width).toBeGreaterThanOrEqual(44);
          expect(link.height).toBeGreaterThanOrEqual(44);
          expect(link.x).toBeGreaterThanOrEqual(0);
          expect(link.y).toBeGreaterThanOrEqual(0);
          expect(link.right).toBeLessThanOrEqual(viewport.width);
          expect(link.bottom).toBeLessThanOrEqual(viewport.height);
          expect(link.foreground).toBe(true);
          expect(link.shapeWidth).toBeGreaterThan(0);
          expect(link.shapeHeight).toBeGreaterThan(0);
          expect(link.iconWidth).toBe(20);
          expect(link.stroke).not.toBe('none');
          expect(link.name).not.toMatch(/\p{Extended_Pictographic}/u);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
          false
        );
        await info.attach('navigation-geometry', {
          body: JSON.stringify({ viewport, locale, geometry }),
          contentType: 'application/json'
        });
        await nav.locator('a[href="/town"]').focus();
        await page.keyboard.press('Tab');
        await expect(nav.locator('a[href="/map"]')).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(/\/map$/);
        await expect(nav.locator('a[href="/map"]')).toHaveAttribute('aria-current', 'page');
        const inventory = nav.locator('a[href="/inventory"]');
        if (mobile) await inventory.tap();
        else await inventory.click();
        await expect(page).toHaveURL(/\/inventory$/);
        await expect(inventory).toHaveAttribute('aria-current', 'page');
        await info.attach('visible-navigation', {
          body: await page.screenshot(),
          contentType: 'image/png'
        });
        await navTo(page, 'settings');
        await page
          .getByRole('button', { name: locale === 'en' ? 'Save' : '保存', exact: true })
          .click();
        await expect(page.getByRole('status')).toHaveText(locale === 'en' ? 'Saved' : '已保存');
        expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
        // A fresh context must finish the production worker's initial precache first.
        await page.evaluate(async () => {
          await navigator.serviceWorker.ready;
        });
        await expect
          .poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state))
          .toBe('activated');
        await page.close();
        await context.setOffline(true);
        const fresh = await context.newPage();
        watch(fresh);
        try {
          const response = await fresh.goto('/');
          expect(response?.ok()).toBe(true);
          expect(response?.fromServiceWorker()).toBe(true);
          await fresh.getByTestId('home-continue').click();
          const restored = fresh.getByRole('navigation', {
            name: locale === 'en' ? 'Main navigation' : '主导航'
          });
          await expect(restored.getByRole('link')).toHaveCount(8);
          await expect(restored.locator('svg')).toHaveCount(8);
          await expect(fresh.getByText('Navigation Test', { exact: true })).toBeVisible();
          await navTo(fresh, 'map');
          await expect(restored.locator('a[href="/map"]')).toHaveAttribute('aria-current', 'page');
          await info.attach('offline-navigation', {
            body: await fresh.screenshot(),
            contentType: 'image/png'
          });
        } finally {
          await fresh.close();
          await context.setOffline(false);
        }
        expect(errors).toEqual([]);
      });
  });

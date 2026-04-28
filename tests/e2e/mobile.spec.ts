/**
 * mobile.spec.ts — flow steps 1–5 on 360×640 AND 412×915.
 * Verifies no horizontal overflow on every visited screen, HUD/combat
 * non-overlap, and ≥44px tap targets on critical buttons.
 */
import { test, expect } from '@playwright/test';
import {
  clearGameStorage,
  createCharacter,
  navTo,
  waitForBattleResolution,
  bbox,
  rectsIntersect,
} from './_helpers';

const MOBILE_VIEWPORTS: { name: string; width: number; height: number }[] = [
  { name: '360x640 (Pixel-class)', width: 360, height: 640 },
  { name: '412x915 (Pixel 6 Pro)', width: 412, height: 915 },
];

test.describe('Mobile responsive flow', () => {
  // Run once on the desktop project; we override viewport per test.
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium-desktop',
      'mobile spec drives its own viewport'
    );
  });

  for (const vp of MOBILE_VIEWPORTS) {
    test.describe(`viewport ${vp.name}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test(`flow steps 1-5 with no horizontal overflow @ ${vp.name}`, async ({
        page,
      }) => {
        test.setTimeout(90_000);
        const checkNoOverflow = async (label: string) => {
          const scrollWidth = await page.evaluate(
            () => document.body.scrollWidth
          );
          // Allow a 2px tolerance for sub-pixel rounding.
          expect(scrollWidth, `no h-overflow on ${label}`).toBeLessThanOrEqual(
            vp.width + 2
          );
        };

        const checkTapTarget = async (
          locator: ReturnType<typeof page.locator>,
          label: string
        ) => {
          const box = await bbox(locator);
          if (!box) {
            throw new Error(`Tap target not found: ${label}`);
          }
          expect.soft(box.width, `${label} width`).toBeGreaterThanOrEqual(44);
          expect.soft(box.height, `${label} height`).toBeGreaterThanOrEqual(44);
        };

        await clearGameStorage(page);
        await checkNoOverflow('home');

        await createCharacter(page, { class: 'amazon', name: 'M1' });
        await checkNoOverflow('town');

        // Step: town → set out (≥44px button) → map
        const setOut = page.getByTestId('town-set-out');
        await checkTapTarget(setOut, 'town-set-out');
        await setOut.click();
        await expect(page.getByTestId('map-screen')).toBeVisible();
        await checkNoOverflow('map');

        // Step: enter combat
        const enterBtn = page
          .getByRole('button', { name: /进入|Enter/i })
          .first();
        await checkTapTarget(enterBtn, 'map-enter');
        await enterBtn.click();
        await expect(page.getByTestId('combat-screen')).toBeVisible();
        await checkNoOverflow('combat');

        // HUD/combat non-overlap: HUD is hidden on /combat by design (HIDDEN_PATHS).
        const hud = page.getByTestId('character-hud');
        const hudCount = await hud.count();
        if (hudCount > 0) {
          const hudBox = await bbox(hud);
          // Combat header has Pause/Auto/Flee buttons; check none intersect HUD.
          const fleeBtn = page.getByRole('button', { name: /逃跑|Flee/i });
          const fleeBox = await bbox(fleeBtn);
          if (hudBox && fleeBox) {
            expect(rectsIntersect(hudBox, fleeBox)).toBe(false);
          }
        }
        // Otherwise HUD is hidden — that's the intended behaviour and
        // implies no overlap.

        await waitForBattleResolution(page, 30_000);
        const fleeBtn = page.getByRole('button', { name: /逃跑|Flee/i });
        await checkTapTarget(fleeBtn, 'combat-flee');
        await fleeBtn.click();
        await expect(page.getByTestId('town-screen')).toBeVisible();
        await checkNoOverflow('town-after-combat');

        // Step: inventory
        await navTo(page, 'inventory');
        await expect(page.getByTestId('inventory-screen')).toBeVisible();
        await checkNoOverflow('inventory');

        // Step: skills
        await navTo(page, 'skills');
        await expect(page.getByTestId('skills-screen')).toBeVisible();
        await checkNoOverflow('skills');
      });
    });
  }
});

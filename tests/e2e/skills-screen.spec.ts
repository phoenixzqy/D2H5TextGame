/**
 * E2E tests for Skills Screen
 * Verifies that skills load correctly per class and display proper layouts
 */
import { test, expect } from '@playwright/test';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const MOBILE_VIEWPORT = { width: 360, height: 640 };

test.describe('Skills Screen', () => {
  test.describe('Desktop viewport', () => {
    test.use({ viewport: DESKTOP_VIEWPORT });

    test('should display Necromancer skills when Necromancer is selected', async ({ page }) => {
      await clearGameStorage(page);
      await createCharacter(page, { class: 'necromancer', name: 'TestNecro' });
      
      // Navigate to skills screen
      await navTo(page, 'skills');
      await expect(page.getByTestId('skills-screen')).toBeVisible();
      
      // Verify Necromancer-canonical skills are present
      const pageContent = await page.textContent('body');
      expect(pageContent).toMatch(/Bone Spear|骨矛/);
      
      // Verify Barbarian-only skills are NOT present
      expect(pageContent).not.toMatch(/Whirlwind|旋风斩/);
      
      // Verify more than 5 skills render
      const skillNodes = await page.locator('[data-testid^="skill-node-"]').count();
      expect(skillNodes).toBeGreaterThanOrEqual(8);
    });

    test('should display Sorceress skills when Sorceress is selected', async ({ page }) => {
      await clearGameStorage(page);
      await createCharacter(page, { class: 'sorceress', name: 'TestSorc' });
      
      // Navigate to skills screen
      await navTo(page, 'skills');
      await expect(page.getByTestId('skills-screen')).toBeVisible();
      
      // Verify Sorceress-canonical skills are present
      const pageContent = await page.textContent('body');
      expect(pageContent).toMatch(/Frozen Orb|冰封球/);
      
      // Verify Barbarian-only skills are NOT present
      expect(pageContent).not.toMatch(/Whirlwind|旋风斩/);
      
      // Verify more than 5 skills render
      const skillNodes = await page.locator('[data-testid^="skill-node-"]').count();
      expect(skillNodes).toBeGreaterThanOrEqual(8);
    });

    test('should show locked skills with level requirements', async ({ page }) => {
      await clearGameStorage(page);
      await createCharacter(page, { class: 'sorceress', name: 'TestSorc' });
      
      // Navigate to skills screen
      await navTo(page, 'skills');
      await expect(page.getByTestId('skills-screen')).toBeVisible();
      
      // Check for locked skills (minLevel > 1)
      const pageContent = await page.textContent('body');
      
      // Some skills have minLevel > 1, should show lock icon
      const hasLockedSkills = pageContent?.includes('🔒') || pageContent?.includes('需要等级') || pageContent?.includes('Requires Level');
      expect(hasLockedSkills).toBe(true);
    });

    test('should display active skill priority list', async ({ page }) => {
      await clearGameStorage(page);
      await createCharacter(page, { class: 'necromancer', name: 'TestNecro' });
      
      // Navigate to skills screen
      await navTo(page, 'skills');
      await expect(page.getByTestId('skills-screen')).toBeVisible();
      
      // Verify priority list exists with 5 slots
      await expect(page.getByTestId('skills-screen')).toBeVisible();
      const selects = await page.locator('select').filter({ hasText: /无|None|— —/ }).count();
      expect(selects).toBeGreaterThanOrEqual(5);
      
      // Verify move up/down buttons exist
      const moveButtons = await page.locator('button').filter({ hasText: /▲|▼/ }).count();
      expect(moveButtons).toBeGreaterThanOrEqual(5);
    });
  });

  test.describe('Mobile viewport', () => {
    test.use({ viewport: MOBILE_VIEWPORT });

    test('should display Necromancer skills on mobile', async ({ page }) => {
      await clearGameStorage(page);
      await createCharacter(page, { class: 'necromancer', name: 'TestNecro' });
      
      // Navigate to skills screen
      await navTo(page, 'skills');
      await expect(page.getByTestId('skills-screen')).toBeVisible();
      
      // Verify Necromancer-canonical skills are present
      const pageContent = await page.textContent('body');
      expect(pageContent).toMatch(/Bone Spear|骨矛/);
      
      // Verify more than 5 skills render
      const skillNodes = await page.locator('[data-testid^="skill-node-"]').count();
      expect(skillNodes).toBeGreaterThanOrEqual(8);
      
      // Verify no horizontal overflow
      const body = await page.locator('body');
      const scrollWidth = await body.evaluate(el => el.scrollWidth);
      const clientWidth = await body.evaluate(el => el.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // Allow 5px tolerance
    });

    test('should display Sorceress skills on mobile', async ({ page }) => {
      await clearGameStorage(page);
      await createCharacter(page, { class: 'sorceress', name: 'TestSorc' });
      
      // Navigate to skills screen
      await navTo(page, 'skills');
      await expect(page.getByTestId('skills-screen')).toBeVisible();
      
      // Verify Sorceress-canonical skills are present
      const pageContent = await page.textContent('body');
      expect(pageContent).toMatch(/Frozen Orb|冰封球/);
      
      // Verify more than 5 skills render
      const skillNodes = await page.locator('[data-testid^="skill-node-"]').count();
      expect(skillNodes).toBeGreaterThanOrEqual(8);
    });
  });
});

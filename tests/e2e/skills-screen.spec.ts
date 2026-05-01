/**
 * E2E tests for Skills Screen
 * Verifies that skills load correctly per class and display proper layouts
 */
import { test, expect } from '@playwright/test';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const MOBILE_VIEWPORT = { width: 360, height: 640 };

test.describe('Skills Screen', () => {
  test('should render three skill-tree columns without overflow @responsive', async ({ page }) => {
    await clearGameStorage(page);
    await createCharacter(page, { class: 'necromancer', name: 'TestNecro' });

    await navTo(page, 'skills');
    await expect(page.getByTestId('skills-screen')).toBeVisible();

    await expect(page.getByText(/悬停、聚焦|Hover, focus/)).toHaveCount(3);
    const skillNodes = await page.locator('[data-testid^="skill-node-"]').count();
    expect(skillNodes).toBeGreaterThanOrEqual(8);

    const scrollWidth = await page.locator('body').evaluate(el => el.scrollWidth);
    const clientWidth = await page.locator('body').evaluate(el => el.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('should show Golem Mastery only depends on Clay Golem @responsive', async ({ page }) => {
    await clearGameStorage(page);
    await createCharacter(page, { class: 'necromancer', name: 'TestNecro' });

    await navTo(page, 'skills');
    await expect(page.getByTestId('skills-screen')).toBeVisible();

    await page.getByTestId('skill-node-skills-necromancer-golem-mastery').click();
    const detail = page.getByTestId('skill-detail-panel');
    await expect(detail).toContainText(/黏土石魔|Clay Golem/);
    await expect(detail).not.toContainText(/骷髅法师|Skeletal Mage|Raise Skeletal Mage/);
  });

  test.describe('Desktop viewport @desktop-only', () => {
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

    test('should update skill details on click with dynamic Raise Skeleton stats', async ({ page }) => {
      await clearGameStorage(page);
      await createCharacter(page, { class: 'necromancer', name: 'TestNecro' });
      await navTo(page, 'skills');

      await page.getByTestId('skill-node-skills-necromancer-raise-skeleton').click();
      const detail = page.getByTestId('skill-detail-panel');
      await expect(detail).toBeVisible();
      await expect(detail).toContainText(/召唤骷髅|Raise Skeleton/);
      await expect(detail).toContainText(/召唤上限|Summon Cap/);
      await expect(detail).not.toContainText(/上限 5|max 5/i);
    });

    test('should display active skill priority list', async ({ page }) => {
      await clearGameStorage(page);
      await createCharacter(page, { class: 'necromancer', name: 'TestNecro' });
      
      // Navigate to skills screen
      await navTo(page, 'skills');
      await expect(page.getByTestId('skills-screen')).toBeVisible();
      
      // Active-skill priority list lives in the "active" tab (Bug #11 refactor).
      // Click the tab to render its panel, then assert.
      await page.locator('button[role="tab"][aria-controls="tabpanel-active"]').click();
      await expect(page.locator('#tabpanel-active')).toBeVisible();
      
      const selects = await page.locator('select').filter({ hasText: /无|None|— —/ }).count();
      expect(selects).toBeGreaterThanOrEqual(5);
      
      // Verify move up/down buttons exist
      const moveButtons = await page.locator('button').filter({ hasText: /▲|▼/ }).count();
      expect(moveButtons).toBeGreaterThanOrEqual(5);
    });
  });

  test.describe('Mobile viewport @mobile-only', () => {
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

    test('should tap a skill node and keep details usable on mobile', async ({ page }) => {
      await clearGameStorage(page);
      await createCharacter(page, { class: 'necromancer', name: 'TestNecro' });
      await navTo(page, 'skills');

      await page.getByTestId('skill-node-skills-necromancer-raise-skeleton').click();
      await expect(page.getByTestId('skill-detail-panel')).toContainText(/召唤上限|Summon Cap/);

      const scrollWidth = await page.locator('body').evaluate(el => el.scrollWidth);
      const clientWidth = await page.locator('body').evaluate(el => el.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
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

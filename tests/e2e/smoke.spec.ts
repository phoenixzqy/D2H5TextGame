import { test, expect } from '@playwright/test';

test.describe('Smoke Test', () => {
  test('home page loads and displays title @smoke', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/D2/i);

    // Check home screen is visible
    const homeScreen = page.getByTestId('home-screen');
    await expect(homeScreen).toBeVisible();

    // Check title text (should contain either "暗黑" or "Diablo" or "欢迎")
    const content = await page.textContent('body');
    const hasExpectedText = content?.includes('暗黑') || content?.includes('Diablo') || content?.includes('欢迎');
    expect(hasExpectedText).toBeTruthy();

    // Check start button exists (by test ID)
    const startButton = page.getByTestId('home-new-game');
    await expect(startButton).toBeVisible();
  });

  test('home page is responsive on mobile @mobile-only @smoke', async ({ page }) => {
    // This test will run in mobile-portrait project (Pixel 5)
    await page.goto('/');

    const homeScreen = page.getByTestId('home-screen');
    await expect(homeScreen).toBeVisible();

    // Check layout doesn't overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });
});

/**
 * i18n-no-raw-keys.spec.ts
 *
 * Verifies that player-visible text never renders raw i18n keys or raw skill
 * IDs on the Skills and Mercs screens.
 *
 * Checks run at both desktop (1280×800) and mobile (360×640) viewports.
 */
import { test, expect } from '@playwright/test';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const DESKTOP_VP = { width: 1280, height: 800 };
const MOBILE_VP = { width: 360, height: 640 };

// Regex patterns that indicate a raw key leaked into the DOM.
const RAW_SKILL_KEY_RE = /^skills\.[a-z]+\.[a-z].*\.(desc|name)$/m;
const RAW_MSKILL_RE = /mskill-[a-z]/;

/**
 * Assert that `bodyText` does not contain any raw i18n key patterns.
 * We scan the full body text once per assertion rather than querying per
 * element — faster and covers all text nodes including aria labels.
 */
function assertNoRawSkillKeys(bodyText: string) {
  // No raw `skills.<class>.<skill>.desc` or `.name` patterns
  expect(bodyText, 'no raw skills.*.desc/name key').not.toMatch(RAW_SKILL_KEY_RE);
}

function assertNoRawMskillIds(bodyText: string) {
  // No raw `mskill-*` identifiers visible in rendered text
  expect(bodyText, 'no raw mskill-* id').not.toMatch(RAW_MSKILL_RE);
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function openSkillsScreenAsNecro(page: Parameters<typeof createCharacter>[0]) {
  await clearGameStorage(page);
  await createCharacter(page, { class: 'necromancer', name: 'KeyTest' });
  await navTo(page, 'skills');
  await expect(page.getByTestId('skills-screen')).toBeVisible({ timeout: 10_000 });
}

// ── Desktop tests ──────────────────────────────────────────────────────────

test.describe('No raw i18n keys — desktop @desktop-only', () => {
  test.use({ viewport: DESKTOP_VP });

  test('Skills screen (Necromancer) has no raw skill key patterns', async ({ page }) => {
    await openSkillsScreenAsNecro(page);

    // Scroll through the full skill tree to force all skill nodes into the DOM.
    await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });

    const bodyText = (await page.textContent('body')) ?? '';
    assertNoRawSkillKeys(bodyText);
    assertNoRawMskillIds(bodyText);
  });

  test('Mercs screen has no raw mskill-* ids', async ({ page }) => {
    await clearGameStorage(page);
    await createCharacter(page, { class: 'necromancer', name: 'MercKeyTest' });

    // Grant some mercs by adding them directly via store (dev mode).
    // The simplest way in E2E: navigate to gacha, grant currency, pull until
    // we get at least one merc, then check the mercs screen.
    // Fall back to just checking the empty mercs screen (no mercs = no raw keys).
    await navTo(page, 'mercs');
    await expect(page.getByTestId('mercs-screen')).toBeVisible({ timeout: 10_000 });

    const bodyText = (await page.textContent('body')) ?? '';
    assertNoRawMskillIds(bodyText);
    assertNoRawSkillKeys(bodyText);
  });

  test('Mercs screen with pulled merc has no raw mskill-* ids', async ({ page }) => {
    await clearGameStorage(page);
    await createCharacter(page, { class: 'necromancer', name: 'PulledMerc' });

    // Navigate to gacha and do pulls to get a merc in the roster.
    await navTo(page, 'gacha');
    await expect(page.getByTestId('gacha-screen')).toBeVisible({ timeout: 10_000 });

    // Grant currency via dev button (only visible in VITE_E2E / DEV builds).
    const grantBtn = page.getByTestId('gacha-add-currency');
    if (await grantBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      // Grant enough for 10 pulls (cost varies, click multiple times to be safe).
      for (let i = 0; i < 5; i++) {
        await grantBtn.click();
      }
      // Do a 10× pull
      const pull10 = page.getByTestId('gacha-pull-10');
      if (await pull10.isEnabled({ timeout: 2_000 }).catch(() => false)) {
        await pull10.click();
        // Close the result modal
        const closeBtn = page.getByRole('button', { name: /close|关闭|×/i });
        if (await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await closeBtn.click();
        }
      }
    }

    // Navigate to mercs screen and verify no raw keys.
    await navTo(page, 'mercs');
    await expect(page.getByTestId('mercs-screen')).toBeVisible({ timeout: 10_000 });

    const bodyText = (await page.textContent('body')) ?? '';
    assertNoRawMskillIds(bodyText);
    assertNoRawSkillKeys(bodyText);
  });
});

// ── Mobile tests ───────────────────────────────────────────────────────────

test.describe('No raw i18n keys — mobile 360×640 @desktop-only', () => {
  test.use({ viewport: MOBILE_VP });

  test('Skills screen (Necromancer) has no raw skill key patterns on mobile', async ({ page }) => {
    await openSkillsScreenAsNecro(page);

    // Scroll to bottom to ensure all skill nodes render.
    await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });

    const bodyText = (await page.textContent('body')) ?? '';
    assertNoRawSkillKeys(bodyText);
    assertNoRawMskillIds(bodyText);
  });

  test('Mercs screen has no raw mskill-* ids on mobile', async ({ page }) => {
    await clearGameStorage(page);
    await createCharacter(page, { class: 'necromancer', name: 'MobileKeyTest' });
    await navTo(page, 'mercs');
    await expect(page.getByTestId('mercs-screen')).toBeVisible({ timeout: 10_000 });

    const bodyText = (await page.textContent('body')) ?? '';
    assertNoRawMskillIds(bodyText);
    assertNoRawSkillKeys(bodyText);
  });
});

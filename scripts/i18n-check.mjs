import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

const baseURL = process.env.I18N_CHECK_BASE_URL ?? 'http://localhost:5173';
const shotDir = path.join('playwright-report', 'i18n-check');
const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 360, height: 640 },
];
const badText = [
  'returned an object instead of string',
  'i18next::translator',
];
const badConsole = /i18next|missingKey|returned an object|'.*' \(.*\) returned/i;

async function clearStorage(page) {
  await page.goto(`${baseURL}/e2e-reset.html`);
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    if (typeof indexedDB !== 'undefined') {
      await Promise.all(['D2H5TextGame', 'd2h5-game'].map((name) => new Promise((resolve) => {
        const req = indexedDB.deleteDatabase(name);
        req.onsuccess = req.onerror = req.onblocked = () => { resolve(); };
        setTimeout(resolve, 1000);
      })));
    }
  });
}

async function createCharacter(page, suffix) {
  await page.goto(baseURL);
  await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('home-new-game').click();
  await expect(page.getByTestId('character-create')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('class-barbarian').click();
  await page.getByTestId('character-name-input').fill(`I18N${suffix}`);
  await page.getByTestId('character-start-btn').click();
  await expect(page.getByTestId('town-screen')).toBeVisible({ timeout: 10000 });
}

async function scanPage(page, findings, label) {
  const text = await page.locator('body').innerText().catch(() => '');
  for (const needle of badText) {
    if (text.includes(needle)) findings.push(`${label}: body contains ${needle}`);
  }
}

async function visitScreen(page, route, testId, findings, label) {
  const link = page.locator(`a[href="${route}"]`).first();
  if (await link.count()) {
    await link.click();
  } else {
    await page.evaluate((nextRoute) => {
      window.history.pushState({}, '', nextRoute);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, route);
  }
  await expect(page.getByTestId(testId)).toBeVisible({ timeout: 10000 });
  await scanPage(page, findings, label);
}

async function runLocaleSweep(page, viewportName, locale, findings) {
  const prefix = `${locale}-${viewportName}`;
  await visitScreen(page, '/town', 'town-screen', findings, `${prefix}:town`);
  if (locale === 'zh-CN' && viewportName === 'desktop') {
    await page.screenshot({ path: path.join(shotDir, 'zh-CN-desktop-town.png'), fullPage: true });
  }
  await visitScreen(page, '/map', 'map-screen', findings, `${prefix}:map`);
  await visitScreen(page, '/inventory', 'inventory-screen', findings, `${prefix}:inventory`);
  await visitScreen(page, '/skills', 'skills-screen', findings, `${prefix}:skills`);
  await visitScreen(page, '/mercs', 'mercs-screen', findings, `${prefix}:mercs`);
  await visitScreen(page, '/quests', 'quests-screen', findings, `${prefix}:quests`);
  await visitScreen(page, '/settings', 'settings-screen', findings, `${prefix}:settings`);
  if (locale === 'en' && viewportName === 'mobile') {
    await page.screenshot({ path: path.join(shotDir, 'en-mobile-settings.png'), fullPage: true });
  }
  await visitScreen(page, '/combat', 'combat-screen', findings, `${prefix}:combat`);
  if (locale === 'en' && viewportName === 'desktop') {
    await page.screenshot({ path: path.join(shotDir, 'en-desktop-combat.png'), fullPage: true });
  }
  await visitScreen(page, '/gacha', 'gacha-screen', findings, `${prefix}:gacha`);
}

async function switchToEnglish(page) {
  await visitScreen(page, '/settings', 'settings-screen', [], 'switch-settings');
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByTestId('settings-screen')).toContainText(/Settings|Language/, { timeout: 5000 });
}

await fs.mkdir(shotDir, { recursive: true });
const browser = await chromium.launch();
const summary = [];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    const findings = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if ((msg.type() === 'warning' || msg.type() === 'error') && badConsole.test(text)) {
        findings.push(`${msg.type()}: ${text}`);
      }
    });
    page.on('pageerror', (err) => {
      if (badConsole.test(err.message)) findings.push(`pageerror: ${err.message}`);
    });

    await clearStorage(page);
    await createCharacter(page, viewport.name);
    await runLocaleSweep(page, viewport.name, 'zh-CN', findings);
    await switchToEnglish(page);
    await runLocaleSweep(page, viewport.name, 'en', findings);

    summary.push({ viewport: viewport.name, locale: 'zh-CN', status: findings.length ? 'findings' : 'clean' });
    summary.push({ viewport: viewport.name, locale: 'en', status: findings.length ? 'findings' : 'clean' });
    if (findings.length) {
      console.error(`\n[${viewport.name}] findings:`);
      for (const finding of findings) console.error(`- ${finding}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

console.log('\nI18N sweep summary');
for (const row of summary) console.log(`${row.locale} @ ${row.viewport}: ${row.status}`);
if (summary.some((row) => row.status !== 'clean')) process.exit(1);

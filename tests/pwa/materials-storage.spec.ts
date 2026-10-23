/** Storage-only continuation of the retained earned export; no new combat. */
import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
import type { SaveCurrent, SaveV17 } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const taskRoot = process.env.EARNED_MATERIALS_ROOT ?? '';
const root = join(taskRoot, 'storage-continuation');
const rawSha = 'f68fb4988f388f493e54a279c4d0b9bbe2e6ad2f091b4ede886987d39e9dc10a';
const gzipSha = '1de7b2371224cd09d2b1baad532416bad2e4ac19f0719e2dcf64fec9c05c0c8c';
const hash = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');

async function record(label: string, value: unknown): Promise<void> {
  await writeFile(join(root, `${label}.json.gz`), gzipSync(JSON.stringify(value)), { flag: 'wx' });
}

async function backup(page: Page): Promise<{ save: SaveCurrent; raw: string }> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try {
    const raw = await readFile(await download.path(), 'utf8');
    return { save: JSON.parse(raw) as SaveCurrent, raw };
  } finally { await download.delete(); }
}

async function importRaw(page: Page, raw: string, english: boolean): Promise<void> {
  const label = english ? 'Import Save' : '导入存档';
  await page.getByRole('button', { name: label, exact: true }).click();
  const dialog = page.getByRole('dialog'), textbox = dialog.getByRole('textbox');
  // BUG-111: multiline CDP insertText stalls; paste the exact native export.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(page.url()).origin });
  await page.evaluate(async value => navigator.clipboard.writeText(value), raw);
  await textbox.click();
  await textbox.press('ControlOrMeta+V');
  await expect(textbox).toHaveValue(raw);
  await dialog.getByRole('button', { name: label, exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

/** Read only the application's non-sensitive single-player save; no storage writes. */
async function stored(page: Page): Promise<SaveCurrent> {
  return page.evaluate(() => new Promise<SaveCurrent>((resolve, reject) => {
    const open = indexedDB.open('D2H5TextGame');
    open.onerror = () => { reject(new Error('Cannot read game save database')); };
    open.onsuccess = () => {
      const db = open.result;
      const get = db.transaction('saves', 'readonly').objectStore('saves').get('current');
      get.onerror = () => { db.close(); reject(new Error('Cannot read game save record')); };
      get.onsuccess = () => {
        db.close();
        const row = get.result as { data: SaveCurrent } | undefined;
        if (!row) { reject(new Error('No game save record')); return; }
        resolve(JSON.parse(JSON.stringify(row.data, (_key, value: unknown) => {
          if (value instanceof Map) return [...(value as Map<unknown, unknown>).entries()];
          if (value instanceof Set) return [...(value as Set<unknown>).values()];
          return value;
        })) as SaveCurrent);
      };
    };
  }));
}

function owned(save: SaveCurrent | SaveV17): Map<string, Item> {
  const items = [...save.inventory.backpack, ...save.inventory.stash,
    ...Object.values(save.inventory.equipped),
    ...Object.values(save.mercs.mercEquipment).flatMap(equipment => Object.values(equipment))]
    .filter((item): item is Item => item !== null);
  const result = new Map(items.map(item => [item.id, item]));
  expect(result.size).toBe(items.length);
  return result;
}

function conserved(actual: SaveCurrent, expected: SaveCurrent): void {
  for (const field of ['version', 'player', 'inventory', 'mercs', 'map', 'formation'] as const) {
    expect(actual[field], field).toEqual(expected[field]);
  }
  expect(actual.meta.settings).toEqual(expected.meta.settings);
  expect(actual.meta.gachaState).toEqual(expected.meta.gachaState);
  // A real Continue samples real elapsed offline time. Only this separate bonus/time
  // metadata and timestamp may differ; it must never manufacture inventory rewards.
  expect(actual.meta.idleState.idleTarget).toEqual(expected.meta.idleState.idleTarget);
}

async function setLocale(page: Page, locale: 'en' | 'zh-CN') {
  await navTo(page, 'settings');
  await page.getByRole('button', { name: locale === 'en' ? 'English' : '简体中文', exact: true }).click();
}

function materialName(translations: unknown, nameKey: string): string {
  let translated: unknown = translations;
  for (const key of nameKey.split('.').slice(1)) translated = (translated as Record<string, unknown>)[key];
  expect(typeof translated).toBe('string');
  return String(translated);
}

async function panelEvidence(page: Page, expected: SaveCurrent, label: string, assertClean: () => void): Promise<void> {
  const catalog = JSON.parse(await readFile('src/data/items/materials.json', 'utf8')) as { id: string; nameKey: string }[];
  for (const locale of ['en', 'zh-CN'] as const) {
    assertClean();
    await setLocale(page, locale);
    const translations: unknown = JSON.parse(await readFile(`src/i18n/locales/${locale}/items.json`, 'utf8'));
    const started = performance.now();
    await navTo(page, 'inventory');
    const panel = page.getByTestId('materials-panel');
    await expect(panel.getByTestId(/^material-/)).toHaveCount(Object.keys(expected.inventory.materials).length, { timeout: 5000 });
    const readyMs = performance.now() - started;
    await record(`${label}-${locale}-route-timing`, { readyMs, url: page.url() });
    expect(readyMs).toBeLessThanOrEqual(5000);
    for (const [id, quantity] of Object.entries(expected.inventory.materials)) {
      const definition = catalog.find(material => material.id === id);
      expect(definition).toBeDefined();
      const row = panel.getByTestId(`material-${id}`);
      await expect(row.locator(':scope > span').first()).toHaveText(materialName(translations, definition?.nameKey ?? ''));
      await expect(row.locator(':scope > span').last()).toHaveText(
        `${locale === 'en' ? 'Owned: ' : '持有：'}${new Intl.NumberFormat(locale).format(quantity)}`);
    }
    for (const [width, height] of [[360, 640], [1280, 800]]) {
      assertClean();
      await page.setViewportSize({ width: width ?? 360, height: height ?? 640 });
      await panel.scrollIntoViewIfNeeded();
      const geometry = await panel.evaluate(node => ({
        documentOverflow: document.documentElement.scrollWidth - innerWidth,
        rowsFit: [...node.querySelectorAll('li')].every(row => row.scrollWidth <= row.clientWidth),
        text: node.textContent
      }));
      expect(geometry.documentOverflow).toBeLessThanOrEqual(0);
      expect(geometry.rowsFit).toBe(true);
      await record(`${label}-${locale}-${String(width)}`, geometry);
      await page.screenshot({ path: join(root, `${label}-${locale}-${String(width)}.png`), fullPage: false });
    }
  }
}

test('retained earned materials survive public import, manual Save and new-page Continue', async ({ page, context }) => {
  expect(taskRoot).not.toBe('');
  const freeze = JSON.parse(await readFile(join(root, 'freeze.json'), 'utf8')) as {
    approved: boolean; files: { path: string; sha256: string }[];
  };
  expect(freeze.approved).toBe(true);
  expect(freeze.files.length).toBeGreaterThan(100);
  for (const file of freeze.files) expect(hash(await readFile(file.path)), file.path).toBe(file.sha256);
  const bytes = await readFile(join(taskRoot, 'earned-export.json.gz'));
  const raw = gunzipSync(bytes).toString('utf8');
  expect(hash(bytes)).toBe(gzipSha);
  expect(hash(Buffer.from(raw))).toBe(rawSha);
  const earned = JSON.parse(raw) as SaveCurrent;
  expect(earned.version).toBe(18);
  expect(earned.map.challengeOrdinals).toEqual({ normal: 253, nightmare: 0 });
  expect(owned(earned).size).toBe(5693);
  expect(earned.inventory.backpack).toHaveLength(5677);
  expect(earned.inventory.materials).toEqual({
    'runes/eld': 1, 'gems/skull/chipped': 2, 'gems/skull/flawed': 2,
    'gems/sapphire/flawed': 2, 'gems/amethyst/flawed': 1
  });
  // Fail before any browser actions if this exact frozen storage experiment ran already.
  await writeFile(join(root, 'storage-start.json'), JSON.stringify({ at: new Date().toISOString(), rawSha }), { flag: 'wx' });
  const errors: string[] = [], consoleErrors: string[] = [];
  const observe = (next: Page) => {
    next.on('pageerror', error => errors.push(error.message));
    next.on('console', message => {
      if (message.type() === 'error' || message.type() === 'warning') consoleErrors.push(message.text());
    });
  };
  context.on('page', observe);
  observe(page);
  const assertClean = () => { expect(errors).toEqual([]); expect(consoleErrors).toEqual([]); };
  let active = page;
  try {
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name: 'Storage import only' });
    await setLocale(page, 'en');
    await importRaw(page, raw, true);
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    const imported = await backup(page);
    conserved(imported.save, earned);
    await writeFile(join(root, 'imported-native.json.gz'), gzipSync(imported.raw), { flag: 'wx' });
    await panelEvidence(page, earned, 'imported-panel', assertClean);
    const beforeSave = await backup(page);
    const expected = { ...earned, meta: { ...earned.meta,
      settings: { ...earned.meta.settings, locale: 'zh-CN' as const } } };
    conserved(beforeSave.save, expected);
    assertClean();
    await page.getByRole('button', { name: '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('已保存');
    const committed = await stored(page);
    conserved(committed, beforeSave.save);
    await record('committed-indexeddb', committed);
    await page.close();
    active = await context.newPage();
    await active.goto('/');
    await active.getByTestId('home-continue').click();
    await expect(active.getByTestId('town-screen')).toBeVisible();
    const reopened = await backup(active);
    conserved(reopened.save, committed);
    await writeFile(join(root, 'continued-native.json.gz'), gzipSync(reopened.raw), { flag: 'wx' });
    await panelEvidence(active, reopened.save, 'continued-panel', assertClean);
    const final = await backup(active);
    conserved(final.save, committed);
    await writeFile(join(root, 'final-native.json.gz'), gzipSync(final.raw), { flag: 'wx' });
    assertClean();
    await record('result', { outcome: 'pass', input: 'unchanged retained earned-export JSON artifact',
      rawSha, gzipSha, owned: owned(final.save).size, materials: final.save.inventory.materials,
      currencies: final.save.inventory.currencies, ordinals: final.save.map.challengeOrdinals,
      errors, consoleErrors, combatLaunches: 0, retries: 0,
      scope: 'storage/UI only; original combat test remains failed; cache and campaign open' });
    await active.close();
  } catch (error) {
    await record('failure', { error: String(error), errors, consoleErrors });
    if (!active.isClosed()) {
      await active.screenshot({ path: join(root, 'stopped-screen.png') }).catch(() => undefined);
      try {
        const stopped = await backup(active);
        await writeFile(join(root, 'stopped-native.json.gz'), gzipSync(stopped.raw), { flag: 'wx' });
      } catch { /* Preserve the original failure. */ }
    }
    throw error;
  }
});

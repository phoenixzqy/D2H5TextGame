/** One authentic earned continuation, never a constructed material holding or campaign proof. */
import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
import type { SaveCurrent, SaveV17 } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const input = 'docs/plans/evidence/fixtures/fresh-native17-campaign-screen/native17-v2-catacombs24-native-export.json.gz';
const rawSha = 'f11d60c1e05cc3d2f4f30603fd4667931eb720edba65ecada24c3ff407859978';
const gzipSha = 'e7ab711fbbb5afd7ca5570b8e2f1a5816fc406e015c6d90c035d0b248b1fbd2b';
const root = process.env.EARNED_MATERIALS_ROOT ?? '';
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
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill(raw);
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

async function terminal(page: Page) {
  return page.evaluate(() => ({
    wave: document.querySelector('[data-testid="wave-counter"]')?.textContent,
    skipDisabled: document.querySelector<HTMLButtonElement>('[data-testid="skip-button"]')?.disabled,
    log: [...document.querySelectorAll('[data-testid="combat-log"] > div > span:last-child')].map(n => n.textContent),
    liveEnemies: document.querySelectorAll('[data-testid="enemies-grid"] [data-testid^="unit-card-"]:not([data-dead="true"])').length,
    hero: [...document.querySelectorAll('[data-testid^="unit-card-"]')]
      .filter(n => n.getAttribute('data-testid') === 'unit-card-player-1792497600000')
      .map(n => ({ dead: n.getAttribute('data-dead'), text: n.textContent })),
    defeat: document.querySelector('[data-testid="defeat-panel"]')?.textContent ?? null
  }));
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
    await navTo(page, 'inventory');
    const panel = page.getByTestId('materials-panel');
    await expect(panel.getByTestId(/^material-/)).toHaveCount(Object.keys(expected.inventory.materials).length);
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

test('one authentic Catacombs challenge earns concrete materials that survive public save paths', async ({ page, context }) => {
  expect(root).not.toBe('');
  const freeze = JSON.parse(await readFile(join(root, 'freeze.json'), 'utf8')) as {
    approved: boolean; files: { path: string; sha256: string }[];
  };
  expect(freeze.approved).toBe(true);
  expect(freeze.files.length).toBeGreaterThan(100);
  for (const file of freeze.files) expect(hash(await readFile(file.path)), file.path).toBe(file.sha256);
  const bytes = await readFile(input), raw = gunzipSync(bytes).toString('utf8');
  expect(hash(bytes)).toBe(gzipSha);
  expect(hash(Buffer.from(raw))).toBe(rawSha);
  const historical = JSON.parse(raw) as SaveV17;
  expect(historical.version).toBe(17);
  expect(historical.map.challengeOrdinals).toEqual({ normal: 252, nightmare: 0 });
  expect(owned(historical).size).toBe(5680);
  const errors: string[] = [], consoleErrors: string[] = [];
  context.on('page', next => {
    next.on('pageerror', error => errors.push(error.message));
    next.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') consoleErrors.push(message.text()); });
  });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') consoleErrors.push(message.text()); });
  const assertClean = () => { expect(errors).toEqual([]); expect(consoleErrors).toEqual([]); };
  let latest: SaveCurrent | undefined;
  let active = page;
  try {
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name: 'Import screen only' });
    await setLocale(page, 'zh-CN');
    await importRaw(page, raw, false);
    const baseline = (await backup(page)).save;
    await record('import-baseline', baseline);
    expect(baseline.version).toBe(18);
    expect(baseline.inventory).toEqual({ ...historical.inventory, materials: {} });
    for (const field of ['player', 'mercs', 'map', 'formation'] as const) expect(baseline[field]).toEqual(historical[field]);
    expect(baseline.meta.settings).toEqual(historical.meta.settings);
    expect(baseline.meta.gachaState).toEqual(historical.meta.gachaState);
    expect(baseline.meta.idleState.idleTarget).toEqual(historical.meta.idleState.idleTarget);
    expect(baseline.meta.idleState.activeMultiplier).toBe(1);
    expect(baseline.meta.idleState.multiplierSecondsRemaining).toBe(0);
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    await setLocale(page, 'en');
    const before = (await backup(page)).save;
    expect(before).toEqual({ ...baseline, timestamp: before.timestamp, meta: { ...baseline.meta, settings: { ...baseline.meta.settings, locale: 'en' }, idleState: before.meta.idleState } });
    expect(before.meta.idleState.activeMultiplier).toBe(1);
    expect(before.meta.idleState.multiplierSecondsRemaining).toBe(0);
    expect(before.meta.idleState.idleTarget).toEqual(baseline.meta.idleState.idleTarget);
    await record('before-challenge', before);
    latest = before;
    assertClean();
    // Atomic exclusive marker makes a second invocation at this root refuse BEFORE Enter.
    await writeFile(join(root, 'challenge-start.json'), JSON.stringify({ at: new Date().toISOString(), ordinal: 252, area: 'a1-catacombs' }), { flag: 'wx' });
    await navTo(page, 'map');
    const act = page.getByRole('button', { name: /^Act 1 ·/ });
    if (await act.getAttribute('aria-expanded') !== 'true') await act.click();
    assertClean();
    await page.getByTestId('sub-area-row-a1-catacombs').getByRole('button', { name: 'Enter', exact: true }).click();
    await expect(page.getByTestId('combat-screen')).toBeVisible();
    const waveResults = [];
    for (let wave = 1; wave <= 6; wave += 1) {
      assertClean();
      if (wave > 1) await page.getByRole('button', { name: 'Resume', exact: true }).click();
      // Node-side observation checks runtime errors on every poll. A missed
      // expected terminal also returns immediately, and the catch pauses playback.
      const deadline = Date.now() + 90_000;
      let observed = await terminal(page);
      while (Date.now() <= deadline) {
        assertClean();
        const actual = Number(/^\D*(\d+)/.exec(observed.wave ?? '')?.[1]);
        if (actual > wave || observed.defeat !== null || (actual === wave && observed.skipDisabled)) break;
        await page.waitForTimeout(50);
        observed = await terminal(page);
      }
      if (Date.now() > deadline) throw new Error(`Native wave ${String(wave)} observation timed out`);
      await record(`wave-${String(wave)}-terminal`, observed);
      expect(Number(/^\D*(\d+)/.exec(observed.wave ?? '')?.[1])).toBe(wave);
      expect(observed.skipDisabled).toBe(true);
      expect(observed.liveEnemies).toBe(0);
      expect(observed.hero).toHaveLength(1);
      expect(observed.hero[0]?.dead).not.toBe('true');
      expect(observed.log.at(-1)).toBe('Victory! All enemies are defeated.');
      expect(observed.defeat).toBeNull();
      waveResults.push({ wave, observed, at: new Date().toISOString() });
      if (wave < 6) {
        await expect.poll(async () => /^\D*(\d+)/.exec(await page.getByTestId('wave-counter').innerText())?.[1], { timeout: 5000, intervals: [50] }).toBe(String(wave + 1));
        await page.getByRole('button', { name: 'Pause', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Resume', exact: true })).toHaveAttribute('aria-pressed', 'true');
        assertClean();
        latest = (await backup(page)).save;
        await record(`wave-${String(wave)}-settled`, latest);
        await navTo(page, 'combat');
        await expect(page.getByRole('button', { name: 'Resume', exact: true })).toHaveAttribute('aria-pressed', 'true');
      }
    }
    await expect(page.getByTestId('victory-panel')).toBeVisible();
    const summary = await page.getByTestId('loot-summary').innerText();
    const materialLines = await page.getByTestId('loot-summary').locator(':scope > ul:not([data-testid]) > li').allTextContents();
    await record('native-victory', { waveResults, summary, materialLines });
    await page.screenshot({ path: join(root, 'native-victory.png') });
    await page.getByTestId('return-to-town').click();
    await expect(page.getByTestId('town-screen')).toBeVisible();
    assertClean();
    const earnedExport = await backup(page), earned = earnedExport.save;
    latest = earned;
    await record('earned-export', earned);
    expect(earned.map.challengeOrdinals).toEqual({ normal: 253, nightmare: 0 });
    expect(earned.map.questProgress).toEqual(before.map.questProgress);
    expect(earned.inventory.questItems).toEqual(before.inventory.questItems);
    expect(earned.inventory.stash).toEqual(before.inventory.stash);
    expect(earned.inventory.equipped).toEqual(before.inventory.equipped);
    expect(earned.mercs.mercEquipment).toEqual(before.mercs.mercEquipment);
    const allEarned = owned(earned);
    for (const [id, payload] of owned(before)) expect(allEarned.get(id)).toEqual(payload);
    expect(allEarned.size).toBeGreaterThan(5680);
    const ledger = earned.inventory.materials;
    expect(Object.keys(ledger).some(id => id.startsWith('runes/'))).toBe(true);
    expect(Object.keys(ledger).some(id => id.startsWith('gems/'))).toBe(true);
    for (const quantity of Object.values(ledger)) expect(Number.isSafeInteger(quantity) && quantity > 0).toBe(true);
    const definitions = JSON.parse(await readFile('src/data/items/materials.json', 'utf8')) as { id: string; nameKey: string }[];
    const translations: unknown = JSON.parse(await readFile('src/i18n/locales/en/items.json', 'utf8'));
    expect(materialLines).toEqual(definitions.filter(def => (ledger[def.id] ?? 0) > 0).map(def =>
      `+${new Intl.NumberFormat('en').format(ledger[def.id] ?? 0)} ${materialName(translations, def.nameKey)}`));
    const shardDelta = (earned.inventory.currencies['rune-shard'] ?? 0) - (before.inventory.currencies['rune-shard'] ?? 0);
    const wishDelta = (earned.inventory.currencies.wishstone ?? 0) - (before.inventory.currencies.wishstone ?? 0);
    expect(summary).toContain(`+${new Intl.NumberFormat('en').format(shardDelta)} Rune Shards`);
    expect(summary).toContain(`+${new Intl.NumberFormat('en').format(wishDelta)} Wishstones`);
    expect(earned.inventory.currencies).toEqual({ ...before.inventory.currencies,
      'rune-shard': (before.inventory.currencies['rune-shard'] ?? 0) + shardDelta,
      wishstone: (before.inventory.currencies.wishstone ?? 0) + wishDelta });
    await record('earned-deltas', { materials: ledger, shardDelta, wishDelta, gearAdded: allEarned.size - 5680, cacheAcceptance: 'open' });
    // Reimport exactly the public v18 download, without constructing or editing any field.
    assertClean();
    await importRaw(page, earnedExport.raw, true);
    const reimported = (await backup(page)).save;
    conserved(reimported, earned);
    await record('earned-reimport', reimported);
    await panelEvidence(page, earned, 'earned-panel', assertClean);
    assertClean();
    const beforeSave = (await backup(page)).save;
    await page.getByRole('button', { name: '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('已保存');
    const committed = await stored(page);
    conserved(committed, beforeSave);
    await record('committed-indexeddb', committed);
    await page.close();
    const continued = await context.newPage();
    active = continued;
    assertClean();
    await continued.goto('/');
    await continued.getByTestId('home-continue').click();
    await expect(continued.getByTestId('town-screen')).toBeVisible();
    const reopened = (await backup(continued)).save;
    conserved(reopened, committed);
    await record('continued-export', reopened);
    await panelEvidence(continued, reopened, 'continued-panel', assertClean);
    expect(errors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    await record('result', { outcome: 'pass', rawSha, gzipSha, waves: 6, launches: 1, retries: 0,
      materials: ledger, shardDelta, wishDelta, gearBefore: 5680, gearAfter: allEarned.size,
      errors, consoleErrors, cacheAcceptance: 'open', campaignAcceptance: 'Act II remains open' });
    await continued.close();
  } catch (error) {
    // Preserve the first failure and exact earned prefix. No retry or alternate character.
    await record('failure', { error: String(error), errors, consoleErrors });
    if (latest) await record('last-verified-earned-prefix', latest);
    if (!active.isClosed()) {
      // A missed terminal must stop the current native playback immediately.
      const pause = active.getByRole('button', { name: /^(Pause|暂停)$/ });
      if (await pause.isVisible().catch(() => false) && await pause.isEnabled()) {
        await pause.click({ timeout: 1000 }).catch(() => undefined);
      }
      await active.screenshot({ path: join(root, 'stopped-screen.png') }).catch(() => undefined);
      await record('stopped-terminal', await terminal(active)).catch(() => undefined);
      try { await record('stopped-export', (await backup(active)).save); } catch { /* original error controls */ }
    }
    throw error;
  }
});

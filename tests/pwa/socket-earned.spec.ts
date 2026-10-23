/** Exact earned Eld continuation. Private browser battle inputs/receipts are not observable or claimed. */
import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import type { SaveCurrent, SaveV18 } from '../../src/engine/types/save';
import type { HistoricalItem } from '../../src/engine/save/historical-items';
import type { Item } from '../../src/engine/types/items';
import { xpTotal } from '../../src/engine/progression/xp';
import { createCharacter, navTo } from '../e2e/_helpers';

const root = process.env.EARNED_SOCKET_ROOT ?? '';
const original = 'it-1u1tx-10g', replacement = 'it-1u1tx-af';
const inputPath = 'docs/plans/evidence/fixtures/earned-materials-browser/retained-earned-export.json.gz';
const hash = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
const materialsAfter = { 'gems/skull/chipped': 2, 'gems/sapphire/flawed': 2,
  'gems/amethyst/flawed': 1, 'gems/skull/flawed': 2 };
async function record(label: string, value: unknown) {
  await writeFile(join(root, `${label}.json.gz`), gzipSync(JSON.stringify(value)), { flag: 'wx' });
}
async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download', { timeout: 30_000 });
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}
function owned(save: SaveCurrent | SaveV18) {
  const equipment: SaveV18['mercs']['mercEquipment'] = save.mercs.mercEquipment;
  const equipped: SaveV18['inventory']['equipped'] = save.inventory.equipped;
  const items = [...save.inventory.backpack, ...save.inventory.stash, ...Object.values(equipped),
    ...Object.values(equipment).flatMap(slots => Object.values(slots))]
    .filter((item): item is HistoricalItem => item != null);
  const result = new Map(items.map(item => [item.id, item]));
  expect(result.size).toBe(items.length);
  return result;
}
function converted(item: HistoricalItem): Item {
  const { runes, ...rest } = item;
  return { ...rest, ...(runes ? { socketContents: runes.map(id => ({ kind: 'rune' as const, id })) } : {}) };
}
/** Enumerate real clock exceptions; preserve every other top-level and meta field. */
function conserved(actual: SaveCurrent, expected: SaveCurrent) {
  const now = actual.meta.idleState;
  expect(actual).toEqual({ ...expected, timestamp: actual.timestamp,
    meta: { ...expected.meta, idleState: { ...expected.meta.idleState, lastOnline: now.lastOnline,
      offlineTime: now.offlineTime, activeMultiplier: now.activeMultiplier,
      multiplierSecondsRemaining: now.multiplierSecondsRemaining } } });
  expect(now.idleTarget).toBeUndefined();
  expect(now.activeMultiplier).toBe(1); expect(now.multiplierSecondsRemaining).toBe(0);
}
function precombat(actual: SaveCurrent, baseline: SaveCurrent, stage: 'replacement' | 'inserted' | 'equipped') {
  const inserted = stage !== 'replacement', equippedOriginal = stage === 'equipped';
  const all = owned(actual), prior = owned(baseline);
  expect(all.size).toBe(5693);
  for (const [id, item] of prior) {
    const changed = id === original || id === replacement;
    expect(all.get(id), id).toEqual(changed ? { ...item,
      equipped: id === original ? equippedOriginal : !equippedOriginal,
      ...(id === original && inserted ? { socketContents: [{ kind: 'rune', id: 'runes/eld' }] } : {}) } : item);
  }
  expect(actual.inventory.backpack).toHaveLength(baseline.inventory.backpack.length);
  expect(actual.inventory.stash).toEqual(baseline.inventory.stash);
  expect(actual.inventory.equipped).toEqual({ ...baseline.inventory.equipped,
    offhand: all.get(equippedOriginal ? original : replacement) });
  expect(actual.inventory).toEqual({ ...baseline.inventory, backpack: actual.inventory.backpack,
    equipped: actual.inventory.equipped, materials: inserted ? materialsAfter : baseline.inventory.materials,
    materialActionOrdinal: inserted ? 1 : 0,
    ...(inserted ? { latestMaterialAction: actual.inventory.latestMaterialAction } : {}) });
  if (inserted) {
    expect(actual.inventory.latestMaterialAction).toEqual({ ordinal: 1, requestHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      result: { itemId: original, materials: {}, currencies: {} } });
  }
  expect(actual.player).toEqual({ ...baseline.player,
    equipment: Object.values(actual.inventory.equipped).filter(item => item != null),
    derivedStats: { ...baseline.player.derivedStats, physDodge: equippedOriginal ? .26 : .19 } });
  expect(actual.player.derivedStats).toMatchObject({ life: 120, mana: 102, lifeMax: 559, manaMax: 296 });
  for (const field of ['map', 'mercs', 'formation'] as const) expect(actual[field]).toEqual(baseline[field]);
  expect(actual.map.challengeOrdinals).toEqual({ normal: 253, nightmare: 0 });
  expect(actual.meta.settings).toEqual(baseline.meta.settings);
  expect(actual.meta.gachaState).toEqual(baseline.meta.gachaState);
  expect(actual.meta.idleState.idleTarget).toBeUndefined();
  expect(actual.meta.idleState.activeMultiplier).toBe(1);
  expect(actual.meta.idleState.multiplierSecondsRemaining).toBe(0);
}
async function layout(page: Page, scope: Locator) {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await scope.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  for (const control of await scope.locator('button,select').all()) {
    if (!await control.isVisible()) continue;
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44); expect(box?.height).toBeGreaterThanOrEqual(44);
  }
}
async function locale(page: Page, value: 'en' | 'zh-CN') {
  await navTo(page, 'settings');
  await page.getByRole('button', { name: value === 'en' ? 'English' : '简体中文', exact: true }).click();
}
async function equip(page: Page, id: string) {
  await navTo(page, 'inventory');
  await page.getByTestId(`inv-item-${id}`).click(); await page.mouse.move(0, 0);
  await page.getByTestId('inv-detail-panel').getByTestId('inv-primary-action').click();
}
async function preview(page: Page) {
  await navTo(page, 'inventory');
  const panel = page.getByTestId('crafting-panel');
  await panel.getByLabel('Action', { exact: true }).selectOption('socket-insert');
  await panel.getByRole('searchbox', { name: 'Search equipment', exact: true }).fill(original);
  await panel.getByLabel(new RegExp(`#${original}\\s`)).check();
  await panel.getByLabel('Socket material', { exact: true }).selectOption('runes/eld');
  await panel.getByRole('button', { name: 'Preview action', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('section').filter({ has: page.getByRole('heading', { name: 'Costs', exact: true }) }).locator('li')).toHaveText(['Eld × 1']);
  await expect(dialog).toContainText('Socket capacity: 1');
  await expect(page.getByTestId('crafting-output-item')).toContainText('+7% Physical Dodge');
  await expect(dialog).toContainText('No completed runeword. Plain socket effects apply.');
  await layout(page, dialog);
}
async function terminal(page: Page) {
  return page.evaluate(() => ({
    wave: document.querySelector('[data-testid="wave-counter"]')?.textContent ?? '',
    area: document.querySelector('[data-testid="combat-sub-area-name"]')?.textContent ?? '',
    skipDisabled: document.querySelector<HTMLButtonElement>('[data-testid="skip-button"]')?.disabled,
    log: [...document.querySelectorAll('[data-testid="combat-log"] > div > span:last-child')].map(node => node.textContent),
    cards: [...document.querySelectorAll('[data-testid^="unit-card-"]')].map(node => ({
      id: node.getAttribute('data-testid'), dead: node.getAttribute('data-dead'), text: node.textContent })),
    enemyIds: [...document.querySelectorAll('[data-testid="enemies-grid"] [data-testid^="unit-card-"]')].map(node => node.getAttribute('data-testid')),
    liveEnemies: document.querySelectorAll('[data-testid="enemies-grid"] [data-testid^="unit-card-"]:not([data-dead="true"])').length,
    defeat: document.querySelector('[data-testid="defeat-panel"]')?.textContent ?? null
  }));
}
function waveOf(value: Awaited<ReturnType<typeof terminal>>) { return Number(/^\D*(\d+)/.exec(value.wave)?.[1]); }
function rewardDelta(actual: SaveCurrent, before: SaveCurrent) {
  const old = owned(before), after = owned(actual);
  for (const [id, item] of old) expect(after.get(id), id).toEqual(item);
  const newIds = [...after.keys()].filter(id => !old.has(id));
  const materials = Object.fromEntries([...new Set([...Object.keys(before.inventory.materials), ...Object.keys(actual.inventory.materials)])]
    .map(id => [id, (actual.inventory.materials[id] ?? 0) - (before.inventory.materials[id] ?? 0)]));
  const currencies = Object.fromEntries([...new Set([...Object.keys(before.inventory.currencies), ...Object.keys(actual.inventory.currencies)])]
    .map(id => [id, (actual.inventory.currencies[id] ?? 0) - (before.inventory.currencies[id] ?? 0)]));
  const heroXP = xpTotal(actual.player.level) + actual.player.experience
    - xpTotal(before.player.level) - before.player.experience;
  for (const count of [...Object.values(materials), ...Object.values(currencies), heroXP]) expect(count).toBeGreaterThanOrEqual(0);
  expect(actual.inventory.equipped).toEqual(before.inventory.equipped);
  expect(actual.inventory.latestMaterialAction).toEqual(before.inventory.latestMaterialAction);
  expect(actual.inventory.materialActionOrdinal).toBe(1);
  expect(actual.map.challengeOrdinals).toEqual({ normal: 254, nightmare: 0 });
  return { newIds, materials, currencies, heroXP };
}

test('one earned Eld insertion survives Continue and one new native Catacombs run', async ({ page: first, context }) => {
  expect(root).not.toBe('');
  const freeze = JSON.parse(await readFile(join(root, 'freeze.json'), 'utf8')) as { approved: boolean; files: { path: string; sha256: string }[] };
  expect(freeze.approved).toBe(true); expect(freeze.files.length).toBeGreaterThan(100);
  for (const file of freeze.files) expect(hash(await readFile(file.path)), file.path).toBe(file.sha256);
  const bytes = await readFile(inputPath), raw = gunzipSync(bytes).toString('utf8');
  expect(hash(bytes)).toBe('1de7b2371224cd09d2b1baad532416bad2e4ac19f0719e2dcf64fec9c05c0c8c');
  expect(hash(Buffer.from(raw))).toBe('f68fb4988f388f493e54a279c4d0b9bbe2e6ad2f091b4ede886987d39e9dc10a');
  const historical = JSON.parse(raw) as SaveV18;
  expect(historical.version).toBe(18); expect(owned(historical).size).toBe(5693);
  let page = first, latest: SaveCurrent | undefined, launched = false;
  const errors: string[] = [];
  const observe = (current: Page) => {
    current.on('pageerror', error => errors.push(error.message));
    current.on('console', entry => { if (entry.type() === 'error' || entry.type() === 'warning') errors.push(entry.text()); });
  };
  const clean = () => { expect(errors).toEqual([]); };
  const continued = async (label: string) => {
    const before = await backup(page);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Saved'); await page.close();
    page = await context.newPage(); observe(page); await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/'); await page.getByTestId('home-continue').click();
    await expect(page.getByTestId('town-screen')).toBeVisible();
    const after = await backup(page); conserved(after, before); await record(label, after); return after;
  };
  observe(page);
  try {
    await page.goto('/'); await createCharacter(page, { class: 'sorceress', name: 'Import screen only' });
    await locale(page, 'en');
    await page.getByRole('button', { name: 'Import Save', exact: true }).click();
    const dialog = page.getByRole('dialog'), textbox = dialog.getByRole('textbox');
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(page.url()).origin });
    await page.evaluate(async value => navigator.clipboard.writeText(value), raw);
    await textbox.click(); await textbox.press('ControlOrMeta+V'); await expect(textbox).toHaveValue(raw);
    await dialog.getByRole('button', { name: 'Import Save', exact: true }).click(); await expect(dialog).toHaveCount(0);
    const baseline = await backup(page); latest = baseline; await record('m19-migrated', baseline);
    expect(baseline.version).toBe(19);
    expect(baseline.inventory).toEqual({ ...historical.inventory,
      backpack: historical.inventory.backpack.map(converted), stash: historical.inventory.stash.map(converted),
      equipped: Object.fromEntries(Object.entries(historical.inventory.equipped).map(([slot, item]) => [slot, item ? converted(item) : null])),
      socketQuarantine: [], materialActionOrdinal: 0 });
    expect(baseline.player).toEqual({ ...historical.player,
      equipment: Object.values(baseline.inventory.equipped).filter(item => item != null) });
    expect(baseline.map).toEqual(historical.map); expect(baseline.formation).toEqual(historical.formation);
    expect(baseline.mercs).toEqual({ ...historical.mercs,
      mercEquipment: Object.fromEntries(Object.entries(historical.mercs.mercEquipment).map(([id, slots]) =>
        [id, Object.fromEntries(Object.entries(slots).map(([slot, item]) => [slot, item ? converted(item) : null]))])),
      ownedMercs: historical.mercs.ownedMercs.map(merc => ({ ...merc,
        equipment: Object.values(baseline.mercs.mercEquipment[merc.id] ?? {}).filter(item => item != null) })) });
    expect(baseline.meta.settings).toEqual(historical.meta.settings);
    expect(baseline.meta.gachaState).toEqual(historical.meta.gachaState);
    await equip(page, replacement);
    const swapped = await backup(page); precombat(swapped, baseline, 'replacement'); await record('r19-replacement', swapped); latest = swapped;
    await preview(page); await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
    const canceled = await backup(page); conserved(canceled, swapped); await record('cancel-preserved', canceled);
    await preview(page); await page.screenshot({ path: join(root, 'earned-insertion-preview.png') });
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(page.getByRole('dialog').getByRole('status')).toHaveText('Completed');
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    const inserted = await backup(page); precombat(inserted, baseline, 'inserted'); await record('i19-inserted', inserted); latest = inserted;
    await equip(page, original);
    const equipped = await backup(page); precombat(equipped, baseline, 'equipped'); await record('e19-equipped', equipped); latest = equipped;
    const restored = await continued('c19-continued'); precombat(restored, baseline, 'equipped'); latest = restored;
    for (const value of ['en', 'zh-CN'] as const) {
      await locale(page, value);
      for (const [width, height] of [[360, 640], [1280, 800]] as const) {
        await page.setViewportSize({ width, height }); await navTo(page, 'inventory');
        const panel = page.getByTestId('materials-panel'); await layout(page, panel);
        await expect(panel.getByTestId('material-runes/eld')).toHaveCount(0);
        await expect(panel.getByTestId(/^material-/)).toHaveCount(4);
        await panel.scrollIntoViewIfNeeded(); await page.screenshot({ path: join(root, `materials-${value}-${String(width)}.png`) });
        await page.getByRole('tab', { name: value === 'en' ? 'Equipment' : '装备', exact: true }).click();
        await page.getByTestId('equip-slot-offhand-details').click();
        const detail = page.getByTestId('equipped-item-modal');
        await expect(detail).toContainText(value === 'en' ? '+7% Physical Dodge' : '+7% 物理闪避');
        await layout(page, detail); await page.screenshot({ path: join(root, `shield-${value}-${String(width)}.png`) }); clean();
        await page.getByTestId('equipped-item-modal-ok').click();
      }
    }
    await locale(page, 'en'); await page.setViewportSize({ width: 360, height: 640 });
    const before = await backup(page); conserved(before, equipped); precombat(before, baseline, 'equipped');
    await record('before-challenge', before); latest = before; clean();
    await navTo(page, 'map'); const act = page.getByRole('button', { name: /^Act 1 ·/ });
    if (await act.getAttribute('aria-expanded') !== 'true') await act.click();
    await writeFile(join(root, 'challenge-start.json'), JSON.stringify({ at: new Date().toISOString(), ordinal: 253,
      area: 'a1-catacombs', source: hash(bytes), viewport: page.viewportSize() }), { flag: 'wx' });
    clean(); launched = true;
    await page.getByTestId('sub-area-row-a1-catacombs').getByRole('button', { name: 'Enter', exact: true }).click();
    await expect(page.getByTestId('combat-screen')).toBeVisible();
    const waves = [];
    let summary: { text: string; items: string[]; materials: string[] } | undefined;
    for (let wave = 1; wave <= 6; wave++) {
      const start = await terminal(page); expect(waveOf(start)).toBe(wave);
      await record(`wave-${String(wave)}-initial`, start);
      clean();
      if (wave > 1) await page.getByRole('button', { name: 'Resume', exact: true }).click();
      let observed = start;
      await expect.poll(async () => {
        clean(); observed = await terminal(page);
        if (waveOf(observed) !== wave || observed.area !== start.area) {
          await record(`wave-${String(wave)}-unexpected`, observed);
          throw new Error(`Unexpected active wave/area at ${String(wave)}`);
        }
        return observed.defeat !== null || observed.skipDisabled === true;
      }, { timeout: 90_000, intervals: [50] }).toBe(true);
      await record(`wave-${String(wave)}-terminal`, observed);
      expect(waveOf(observed)).toBe(wave); expect(observed.area).toBe(start.area);
      expect(observed.skipDisabled).toBe(true); expect(observed.defeat).toBeNull();
      expect(observed.liveEnemies).toBe(0);
      expect(observed.cards.find(card => card.id === `unit-card-${before.player.id}`)?.dead).toBeNull();
      expect(observed.enemyIds).toEqual(expect.arrayContaining(start.enemyIds));
      expect(observed.log.at(-1)).toBe('Victory! All enemies are defeated.');
      if (wave < 6) {
        await expect.poll(async () => {
          clean();
          const next = waveOf(await terminal(page));
          if (next !== wave && next !== wave + 1) throw new Error(`Unexpected interwave counter ${String(next)} after ${String(wave)}`);
          return next;
        }, { timeout: 5000, intervals: [50] }).toBe(wave + 1);
        await page.getByRole('button', { name: 'Pause', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Resume', exact: true })).toHaveAttribute('aria-pressed', 'true');
      } else {
        await expect(page.getByTestId('victory-panel')).toBeVisible();
        const panel = page.getByTestId('loot-summary');
        summary = { text: await panel.innerText(), items: await panel.getByTestId('loot-items').locator('li').allTextContents(),
          materials: await panel.locator(':scope > ul:not([data-testid]) > li').allTextContents() };
        await record('victory-summary', summary);
        await page.screenshot({ path: join(root, 'native-victory.png') });
        await page.getByTestId('return-to-town').click(); await expect(page.getByTestId('town-screen')).toBeVisible();
      }
      const settled = await backup(page); clean();
      const delta = rewardDelta(settled, latest);
      expect(delta.heroXP).toBeGreaterThan(0); expect(delta.newIds.length).toBeGreaterThan(0);
      await record(`wave-${String(wave)}-settled`, settled); await record(`wave-${String(wave)}-delta`, delta);
      latest = settled; waves.push({ wave, delta });
      if (wave < 6) {
        await navTo(page, 'combat');
        await expect(page.getByTestId('combat-screen')).toBeVisible();
        expect(waveOf(await terminal(page))).toBe(wave + 1);
        await expect(page.getByRole('button', { name: 'Resume', exact: true })).toHaveAttribute('aria-pressed', 'true');
      }
    }
    if (!summary) throw new Error('Missing native victory summary');
    const total = rewardDelta(latest, before);
    expect(summary.items).toHaveLength(total.newIds.length);
    for (const [id, name] of [['rune-shard', 'Rune Shards'], ['wishstone', 'Wishstones']] as const) {
      const quantity = total.currencies[id] ?? 0;
      if (quantity > 0) expect(summary.text).toContain(`+${new Intl.NumberFormat('en').format(quantity)} ${name}`);
    }
    const catalog = JSON.parse(await readFile('src/data/items/materials.json', 'utf8')) as { id: string; nameKey: string }[];
    const translations: unknown = JSON.parse(await readFile('src/i18n/locales/en/items.json', 'utf8'));
    expect(summary.materials).toEqual(catalog.filter(row => (total.materials[row.id] ?? 0) > 0).map(row => {
      let name: unknown = translations;
      for (const key of row.nameKey.split('.').slice(1)) name = (name as Record<string, unknown>)[key];
      expect(typeof name).toBe('string');
      return `+${new Intl.NumberFormat('en').format(total.materials[row.id] ?? 0)} ${String(name)}`;
    }));
    await record('total-earned-deltas', total);
    const final = await continued('final-continued'); conserved(final, latest); clean();
    await record('result', { outcome: 'pass', launches: 1, ordinalBefore: 253, ordinalAfter: 254,
      waves, errors, browserPrivateInputInspection: false, fullCampaignAcceptance: 'open' });
    await page.close();
  } catch (error) {
    await record('failure', { error: String(error), errors, launched });
    if (latest) await record('last-verified-prefix', latest);
    if (!page.isClosed()) {
      const diagnostics: string[] = [];
      try {
        const pause = page.getByRole('button', { name: /^(Pause|暂停)$/ });
        if (await pause.isVisible() && await pause.isEnabled()) await pause.click({ timeout: 1000 });
      } catch (stopError) { diagnostics.push(`pause: ${String(stopError)}`); }
      try { await record('stopped-terminal', await terminal(page)); } catch (stopError) { diagnostics.push(`terminal: ${String(stopError)}`); }
      try { await page.screenshot({ path: join(root, 'stopped-screen.png') }); } catch (stopError) { diagnostics.push(`screen: ${String(stopError)}`); }
      try {
        const stopped = await backup(page); await record('stopped-export', stopped);
        const view = await readFile(join(root, 'stopped-terminal.json.gz')).then(bytes =>
          JSON.parse(gunzipSync(bytes).toString('utf8')) as Awaited<ReturnType<typeof terminal>>);
        if (launched && latest && (view.defeat !== null || view.log.some(line => /Draw|Defeat/.test(line)))) {
          expect(stopped.inventory).toEqual(latest.inventory);
          expect(stopped.player.level).toBe(latest.player.level);
          expect(stopped.player.experience).toBe(latest.player.experience);
          expect(stopped.mercs.mercProgress).toEqual(latest.mercs.mercProgress);
          await record('nonwin-zero-rewards', { verified: true, retainedPrefixOrdinal: latest.map.challengeOrdinals });
        }
      } catch (stopError) { diagnostics.push(`export/reward audit: ${String(stopError)}`); }
      await record('diagnostic-errors', diagnostics); await page.close();
    }
    throw error;
  }
});

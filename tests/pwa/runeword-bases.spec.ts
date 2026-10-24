/** Constructed acquisition/crafting proof; never an earned campaign or pacing claim. */
import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import type { Item } from '../../src/engine/types/items';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const runes = ['runes/hel', 'runes/ko', 'runes/thul', 'runes/eth', 'runes/fal'];
async function acquiredScythe(): Promise<{ seed: number; item: Item }> {
  const repo = fileURLToPath(new URL('../..', import.meta.url));
  // Production modules use Vite JSON imports; load them through that same transformer.
  const server = await createServer({ root: repo, configFile: false,
    cacheDir: `${process.env.CRAFTING_UI_ROOT!}/vite-ssr-cache`,
    server: { middlewareMode: true, hmr: false, ws: false }, resolve: { alias: { '@': `${repo}/src` } } });
  try {
    const { loadItemBases, loadTreasureClasses } = await server.ssrLoadModule('/src/data/loaders/loot.ts') as typeof import('../../src/data/loaders/loot');
    const { createRng } = await server.ssrLoadModule('/src/engine/rng.ts') as typeof import('../../src/engine/rng');
    const { rollDrops } = await server.ssrLoadModule('/src/engine/loot/drop-roller.ts') as typeof import('../../src/engine/loot/drop-roller');
    const { rollItem } = await server.ssrLoadModule('/src/engine/loot/rollItem.ts') as typeof import('../../src/engine/loot/rollItem');
    const tc = loadTreasureClasses().get('loot/trash-act4');
    if (!tc) throw new Error('Missing authored source');
    for (let seed = 1; seed <= 2048; seed++) {
      const rng = createRng(seed);
      for (const drop of rollDrops({ tc, tier: 'trash', monsterLevel: 42, magicFind: 0 }, rng)) {
        if (drop.kind !== 'item' || drop.baseId !== 'items/base/wp2h-battle-scythe') continue;
        const item = rollItem(drop, { bases: loadItemBases(), affixes: [] }, rng);
        if (item?.socketCapacity === 5) return { seed, item };
      }
    }
    throw new Error('No ordinary five-socket scythe materialized in the diagnostic sample');
  } finally { await server.close(); }
}
async function backup(page: Page): Promise<SaveCurrent> {
  const close = page.getByTestId('inv-detail-close');
  if (await close.isVisible()) await close.click();
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download'); await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}
async function imported(page: Page, save: SaveCurrent, en: boolean) {
  await navTo(page, 'settings');
  const label = en ? 'Import Save' : '导入存档';
  await page.getByRole('button', { name: label, exact: true }).click();
  await page.getByRole('dialog').getByRole('textbox').fill(JSON.stringify(save));
  await page.getByRole('dialog').getByRole('button', { name: label, exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
async function layout(page: Page, scope: Locator) {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await scope.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  for (const control of await scope.locator('button,select').all()) {
    if (!(await control.isVisible())) continue;
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44); expect(box?.width).toBeGreaterThanOrEqual(44);
  }
}

for (const locale of ['en', 'zh-CN'] as const) for (const [width, height] of [[360, 640], [1280, 800]] as const) {
  test(`Obedience ordered crafting equip and Continue ${locale} ${String(width)}x${String(height)}`, async ({ page: initial, context }, info) => {
    const en = locale === 'en', errors: string[] = [];
    const observe = (current: Page) => {
      current.on('pageerror', error => errors.push(error.message));
      current.on('console', entry => { if (entry.type() === 'error' || entry.type() === 'warning') errors.push(entry.text()); });
    };
    let page = initial; observe(page); await page.setViewportSize({ width, height });
    await page.goto('/'); await createCharacter(page, { class: 'sorceress', name: 'Obedience QA' });
    await navTo(page, 'settings'); await page.getByRole('button', { name: en ? 'English' : '简体中文', exact: true }).click();
    const fresh = await backup(page), acquisition = await acquiredScythe(), item = acquisition.item;
    const fixture: SaveCurrent = { ...fresh,
      player: { ...fresh.player, level: 40, coreStats: { strength: 50, dexterity: 50, vitality: 50, energy: 50 },
        equipment: [], derivedStats: { ...fresh.player.derivedStats, life: 13, mana: 17 } },
      inventory: { ...fresh.inventory, backpack: [item], stash: [], equipped: {},
        materials: Object.fromEntries(runes.map(rune => [rune, 1])) } };
    await info.attach('constructed-input-and-native-drop', { body: JSON.stringify({ acquisition, fixture }), contentType: 'application/json' });
    await imported(page, fixture, en); await navTo(page, 'inventory');
    const panel = page.getByTestId('crafting-panel');
    await panel.getByLabel(en ? 'Action' : '操作', { exact: true }).selectOption('socket-insert');
    await panel.getByLabel(new RegExp(`#${item.id}\\s`)).check();
    for (let index = 0; index < runes.length; index++) {
      await panel.getByLabel(en ? 'Socket material' : '镶嵌材料').selectOption(runes[index]!);
      await panel.getByRole('button', { name: en ? 'Preview action' : '预览操作', exact: true }).click();
      const dialog = page.getByRole('dialog'); await layout(page, dialog);
      const output = page.getByTestId('crafting-output-item');
      if (index === 4) {
        await expect(output).toContainText(en ? 'Runeword: Obedience' : '符文之语：服从');
        await expect(output).toContainText(en ? '+200 Attack' : '+200 攻击');
        await info.attach('completed-word-preview', { body: await page.screenshot(), contentType: 'image/png' });
      } else await expect(output).not.toContainText(en ? 'Runeword: Obedience' : '符文之语：服从');
      await dialog.getByRole('button', { name: en ? 'Confirm' : '确认', exact: true }).click({ clickCount: 2 });
      await expect(dialog.getByRole('status')).toHaveText(en ? 'Completed' : '已完成');
      await dialog.getByRole('button', { name: en ? 'Close' : '关闭', exact: true }).click();
    }
    const crafted = await backup(page);
    const word = { ...item, rarity: 'runeword', runewordId: 'runewords/obedience',
      socketContents: runes.map(id => ({ kind: 'rune', id })) };
    expect(crafted.inventory.backpack).toEqual([word]);
    expect(crafted.inventory.materials).toEqual({}); expect(crafted.inventory.materialActionOrdinal).toBe(5);
    expect(crafted.inventory.currencies).toEqual(fresh.inventory.currencies);
    await info.attach('crafted-native-save', { body: JSON.stringify(crafted), contentType: 'application/json' });
    await navTo(page, 'inventory'); await page.getByTestId(`inv-item-${item.id}`).click();
    await page.mouse.move(0, 0); await layout(page, page.getByTestId('inv-detail-panel'));
    await page.getByTestId('inv-primary-action').click();
    const refused = await backup(page);
    expect(refused.player).toEqual(crafted.player); expect(refused.inventory).toEqual(crafted.inventory);
    await info.attach('level40-equip-refused', { body: JSON.stringify(refused), contentType: 'application/json' });
    await imported(page, { ...refused, player: { ...refused.player, level: 41 } }, en);
    await navTo(page, 'inventory'); await page.getByTestId(`inv-item-${item.id}`).click();
    await page.mouse.move(0, 0); await page.getByTestId('inv-primary-action').click();
    const equipped = await backup(page);
    expect(equipped.inventory.equipped.weapon).toEqual({ ...word, equipped: true });
    expect(equipped.inventory.backpack).toEqual([]);
    expect(equipped.player.derivedStats.attack).toBe(385 + item.baseRolls!.attack!);
    expect(equipped.player.derivedStats.resistances).toMatchObject({ fire: 30, cold: 40, lightning: 30, poison: 30, arcane: 30 });
    expect([equipped.player.derivedStats.life, equipped.player.derivedStats.mana]).toEqual([13, 17]);
    await page.getByRole('button', { name: en ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(en ? 'Saved' : '已保存'); await page.close();
    page = await context.newPage(); observe(page); await page.setViewportSize({ width, height });
    await page.goto('/'); await page.getByTestId('home-continue').click();
    const continued = await backup(page);
    for (const key of ['player', 'inventory', 'map', 'mercs', 'formation'] as const) expect(continued[key]).toEqual(equipped[key]);
    await info.attach('equipped-native-continued', { body: JSON.stringify(continued), contentType: 'application/json' });
    await navTo(page, 'inventory'); await page.getByRole('tab', { name: en ? 'Equipment' : '装备', exact: true }).click();
    await page.getByTestId('equip-slot-weapon').getByRole('button', { name: en ? 'Unequip' : '卸下', exact: true }).click();
    const removed = await backup(page);
    expect(removed.inventory.backpack).toEqual([word]); expect(removed.player.derivedStats.attack).toBe(115);
    expect(removed.player.derivedStats.resistances).toMatchObject({ fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 });
    expect([removed.player.derivedStats.life, removed.player.derivedStats.mana]).toEqual([13, 17]);
    await info.attach('removed-native-save', { body: JSON.stringify(removed), contentType: 'application/json' });
    await page.close(); expect(errors).toEqual([]);
  });
}

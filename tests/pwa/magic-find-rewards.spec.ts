/** Constructed imported gear; real production UI/offline settlement, no campaign credit. */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { createServer } from 'vite';
import { createRng, hashSeed } from '../../src/engine/rng';
import type { AwardDataPools } from '../../src/engine/loot/award';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import type { CombatUnit } from '../../src/engine/combat/types';
import { createCharacter, navTo } from '../e2e/_helpers';

const createdAt = Date.parse('2026-10-20T12:00:00.000Z');
const returnedAt = createdAt + 8 * 3_600_000;
const area = 'areas/act1-blood-moor';
let pools: AwardDataPools;
let rollKillRewards: typeof import('../../src/engine/loot/award').rollKillRewards;
let gear: Item[];
let fixtureWave: (save: SaveCurrent) => { enemies: CombatUnit[]; treasureClassId: string };
const equipment = [
  ['head', 'shako'], ['gloves', 'chance-guards'], ['belt', 'goldwrap'],
  ['boots', 'war-traveler'], ['amulet', 'the-collector'],
  ['ring-left', 'nagelring'], ['ring-right', 'nagelring'], ['weapon', 'blade-of-ali-baba']
] as const;
test.beforeAll(async () => {
  // Vite loads JSON for the Node-side oracle without listening on a port. The
  // browser continues to run the separate, unmodified production build.
  const source = await createServer({ configFile: false, appType: 'custom',
    root: fileURLToPath(new URL('../..', import.meta.url)),
    resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
    server: { watch: null }, optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    const loot = await source.ssrLoadModule('/src/data/loaders/loot.ts') as typeof import('../../src/data/loaders/loot');
    const items = await source.ssrLoadModule('/src/engine/loot/rollItem.ts') as typeof import('../../src/engine/loot/rollItem');
    const awards = await source.ssrLoadModule('/src/engine/loot/award.ts') as typeof import('../../src/engine/loot/award');
    const catalog = await source.ssrLoadModule('/src/data/index.ts') as typeof import('../../src/data/index');
    const planner = await source.ssrLoadModule('/src/engine/combat/sub-area-run.ts') as typeof import('../../src/engine/combat/sub-area-run');
    const factory = await source.ssrLoadModule('/src/engine/combat/monster-factory.ts') as typeof import('../../src/engine/combat/monster-factory');
    pools = loot.loadAwardPools();
    rollKillRewards = awards.rollKillRewards;
    fixtureWave = save => {
      const subArea = catalog.subAreas.find(entry => entry.id === area);
      const fallback = catalog.monsters.find(entry => entry.id.startsWith('monsters/act1.'));
      if (!subArea || !fallback) throw new Error('Missing canonical MF fixture area/monster');
      const seed = hashSeed(`${area}|${String(returnedAt)}`);
      const wave = planner.resolveChallengeWavePlan({ subArea, fallbackArchetypeId: fallback.id,
        fallbackLevel: subArea.areaLevel, seed, challengeOrdinal: save.map.challengeOrdinals.normal,
        mode: 'manual' }).waves[0];
      if (!wave) throw new Error('Missing first MF fixture wave');
      const rng = createRng((seed ^ 0x9e3779b1) >>> 0);
      const enemies = wave.spawns.map(spawn => {
        const def = catalog.monsters.find(entry => entry.id === spawn.archetypeId);
        if (!def || spawn.tier !== 'trash') throw new Error('MF fixture requires canonical trash spawns');
        return factory.buildMonsterUnit({ def, level: spawn.level, tier: spawn.tier, rng, index: spawn.index });
      });
      return { enemies, treasureClassId: wave.lootTable ?? subArea.lootTable };
    };
    gear = equipment.map(([, slug], index) => {
      const item = items.rollUniqueItem({ uniqueId: `items/unique/${slug}`, ilvl: 60 }, pools, createRng(index + 1));
      if (!item) throw new Error(`Missing constructed MF gear: ${slug}`);
      return { ...item, id: `mf-browser-fixture-${String(index)}` };
    });
  } finally { await source.close(); }
});

async function exportSave(page: Page): Promise<SaveCurrent> {
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}
async function importSave(page: Page, save: SaveCurrent, english: boolean): Promise<void> {
  const label = english ? 'Import Save' : '导入存档';
  await page.getByRole('button', { name: label, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill(JSON.stringify(save));
  await dialog.getByRole('button', { name: label, exact: true }).click();
  await expect(dialog).toHaveCount(0);
}
function withoutId(items: readonly Item[]) {
  return items.map(({ id: _id, ...item }) => item);
}
function expectedRewards(wave: ReturnType<typeof fixtureWave>, save: SaveCurrent, bonus: number) {
  const rng = createRng((hashSeed(`${area}|${String(returnedAt)}`) ^ 0x9e3779b1) >>> 0);
  const items: Item[] = [];
  const currencies = { runeShards: 0, runes: 0, gems: 0, wishstones: 0 };
  const materials: Record<string, number> = {};
  for (const enemy of wave.enemies) {
    const reward = rollKillRewards({ act: 1, tier: enemy.tier, monsterLevel: enemy.level,
      treasureClassId: wave.treasureClassId, magicFind: save.player.derivedStats.magicFind,
      magicFindMultiplier: bonus, goldFind: save.player.derivedStats.goldFind }, pools, rng, rng.fork(`wishstone:${enemy.id}`));
    items.push(...reward.items);
    for (const key of ['runeShards', 'runes', 'gems', 'wishstones'] as const) currencies[key] += reward[key];
    for (const [id, quantity] of Object.entries(reward.materials)) materials[id] = (materials[id] ?? 0) + quantity;
  }
  return { items: withoutId(items), currencies, materials };
}
async function countEnemies(page: Page, expected: readonly CombatUnit[]): Promise<number> {
  let count = 0;
  const representatives = new Set<string>();
  for (const card of await page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]').all()) {
    await expect(card).toHaveAttribute('data-kind', 'monster');
    const id = (await card.getAttribute('data-testid'))?.slice('unit-card-'.length);
    if (!id) throw new Error('Enemy card is missing its runtime unit ID');
    expect(expected.map(enemy => enemy.id)).toContain(id);
    expect(representatives.has(id)).toBe(false);
    representatives.add(id);
    const badge = card.locator(':scope > div:first-of-type > div').filter({ hasText: /^\+\d+$/ });
    expect(await badge.count()).toBeLessThanOrEqual(1);
    count += 1 + (await badge.count() ? Number((await badge.innerText()).slice(1)) : 0);
  }
  expect(count).toBeGreaterThanOrEqual(8); expect(count).toBeLessThanOrEqual(20);
  expect(count).toBe(expected.length);
  return count;
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`real Magic Find loot and offline bonus persist ${locale}`, async ({ page, context }, info) => {
    const english = locale === 'en';
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: createdAt }); await page.clock.pauseAt(createdAt);
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name: 'Imported MF fixture' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state), { timeout: 60_000 }).toBe('activated');
    const fresh = await exportSave(page);
    const constructed: SaveCurrent = { ...fresh,
      player: { ...fresh.player, level: 60, experience: 0, comboOrder: [], equipment: [] },
      inventory: { ...fresh.inventory, equipped: {}, backpack: gear, stash: [] }
    };
    await importSave(page, constructed, english);
    await navTo(page, 'inventory'); await page.locator('#tab-equipment').click();
    for (const [index, [slot]] of equipment.entries()) {
      await page.getByTestId(`equip-slot-${slot}-select`).click({ position: { x: 8, y: 8 } });
      await page.getByTestId(`equip-picker-row-mf-browser-fixture-${String(index)}`).click();
      await page.getByTestId('equip-picker-confirm').click();
      await expect(page.getByTestId('equip-picker')).toHaveCount(0);
    }
    await navTo(page, 'settings');
    const equipped = await exportSave(page);
    expect(equipped.player.derivedStats.magicFind).toBe(285);
    expect(equipped.inventory.backpack).toEqual([]);
    await info.attach('constructed-equipped-fixture', { body: JSON.stringify(equipped), contentType: 'application/json' });

    const raritySequences: string[][] = [];
    await page.clock.setSystemTime(returnedAt);
    for (const boosted of [false, true]) {
      await context.setOffline(false);
      await page.clock.setSystemTime(returnedAt);
      const fixtureTime = boosted ? createdAt : returnedAt;
      const fixture: SaveCurrent = { ...equipped, timestamp: fixtureTime,
        meta: { ...equipped.meta, idleState: { ...equipped.meta.idleState, lastOnline: fixtureTime,
          activeMultiplier: 1, multiplierSecondsRemaining: 0, offlineTime: 0 } } };
      await importSave(page, fixture, english);
      await context.setOffline(true);
      const response = await page.reload();
      expect(response?.fromServiceWorker()).toBe(true);
      await expect(page.getByTestId('settings-screen')).toBeVisible();
      const before = await exportSave(page);
      expect(before.player).toEqual(equipped.player);
      expect(before.inventory).toEqual(equipped.inventory);
      expect(before.map).toEqual(equipped.map);
      expect(before.meta.idleState.activeMultiplier).toBe(boosted ? 1.5 : 1);
      if (boosted) await expect(page.getByTestId('offline-bonus-chip')).toHaveAccessibleName(
        english ? '+50% XP and Magic Find for 120 min' : '+50% 经验与魔法寻获加成，剩余 120 分钟');
      await navTo(page, 'map');
      await page.getByTestId('sub-area-row-a1-blood-moor').getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
      await expect(page.getByTestId('combat-screen')).toBeVisible();
      const wave = fixtureWave(before);
      const enemies = await countEnemies(page, wave.enemies);
      await page.getByTestId('skip-button').click();
      await expect(page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]:not([data-dead="true"])')).toHaveCount(0);
      await expect(page.getByTestId('allies-grid').locator('[data-kind="hero"]')).not.toHaveAttribute('data-dead', 'true');
      await page.clock.runFor(1500);
      await expect(page.getByTestId('wave-counter')).toContainText(/2/);
      await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
      await expect(page.getByTestId('map-screen')).toBeVisible();
      await navTo(page, 'settings');
      await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
      await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
      const after = await exportSave(page);
      const bonus = boosted ? 1 + 0.5 * (7200 - 1.5) / 7200 : 1;
      const oracle = expectedRewards(wave, before, bonus);
      expect(withoutId(after.inventory.backpack)).toEqual(oracle.items);
      const expectedCurrencies = { ...before.inventory.currencies };
      for (const [id, quantity] of [['rune-shard', oracle.currencies.runeShards], ['wishstone', oracle.currencies.wishstones]] as const) {
        if (quantity > 0) expectedCurrencies[id] = (expectedCurrencies[id] ?? 0) + quantity;
      }
      expect(after.inventory.currencies).toEqual(expectedCurrencies);
      expect(after.inventory.materials).toEqual(oracle.materials);
      expect(after.player.experience - before.player.experience).toBe(enemies * Math.floor(20 * bonus));
      expect(after.inventory.equipped).toEqual(before.inventory.equipped);
      expect(after.map.clearedSubAreas).toEqual(before.map.clearedSubAreas);
      raritySequences.push(after.inventory.backpack.map(item => item.rarity));
      expect(after.inventory.backpack.length).toBeGreaterThan(0);
      expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await info.attach(boosted ? 'boosted-loot' : 'baseline-loot', { body: await page.screenshot(), contentType: 'image/png' });
      await info.attach(boosted ? 'boosted-save-and-oracle' : 'baseline-save-and-oracle', {
        body: JSON.stringify({ enemies, enemyIds: wave.enemies.map(enemy => enemy.id), bonus, after, oracle }), contentType: 'application/json' });
      await page.reload();
      await expect(page.getByTestId('settings-screen')).toBeVisible();
      expect(await exportSave(page)).toEqual(after);
    }
    expect(raritySequences[1]).not.toEqual(raritySequences[0]);
    expect(errors).toEqual([]);
  });
}

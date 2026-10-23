/** Functional A4 controls from an exported constructed-power A3 save, never earned-campaign proof. */
import { expect, test, type BrowserContext, type Locator, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { xpTotal } from '../../src/engine/progression/xp';
import { createRng, hashSeed } from '../../src/engine/rng';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import type { KillRewards, QuestTableRewardInput } from '../../src/engine/loot/award';
import { clearGameStorage, createCharacter, navTo } from '../e2e/_helpers';

const IZUAL = 'quests/act4-fallen-angel', FORGE = 'quests/act4-hellforge', DIABLO = 'quests/act4-terrors-end';
const HAMMER = `${FORGE}#objective:obj-kill-hephasto`;
const SOULSTONE = 'quests/act3-guardian#reward:questItem';
type Locale = 'en' | 'zh-CN';

function copy(locale: Locale) {
  return locale === 'en' ? { importSave: 'Import Save', save: 'Save', saved: 'Saved', enter: 'Enter' }
    : { importSave: '导入存档', save: '保存', saved: '已保存', enter: '进入' };
}

async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending, path = await download.path();
  if (!path) throw new Error('Missing exported save');
  try { return JSON.parse(await readFile(path, 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}

function heroXp(save: SaveCurrent): number { return xpTotal(save.player.level) + save.player.experience; }
function mercXp(save: SaveCurrent): number {
  const merc = save.mercs.ownedMercs.find(row => row.id === save.mercs.fieldedMercId);
  if (!merc) throw new Error('Missing fielded mercenary');
  const progress = save.mercs.mercProgress[merc.id];
  if (!progress) throw new Error('Missing mercenary progress');
  let total = progress.experience;
  for (let level = 1; level < merc.level; level++) total += Math.floor(60 * level * 1.30 ** (level - 1));
  return total;
}

async function layout(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function usable(button: Locator): Promise<void> {
  await expect(button).toBeEnabled(); await button.scrollIntoViewIfNeeded();
  await expect(button).toBeInViewport();
  const box = await button.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44); expect(box?.height).toBeGreaterThanOrEqual(44);
}

async function attach(info: TestInfo, name: string, save: SaveCurrent): Promise<void> {
  await info.attach(name, { body: JSON.stringify(save, null, 2), contentType: 'application/json' });
}

async function continued(page: Page, context: BrowserContext, locale: Locale, info: TestInfo,
  stage: string, observe: (page: Page) => void): Promise<Page> {
  const expected = await backup(page), text = copy(locale);
  await page.getByRole('button', { name: text.save, exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(text.saved); await page.close();
  const next = await context.newPage(); observe(next); await next.goto('/');
  await next.getByTestId('home-continue').click(); await expect(next.getByTestId('town-screen')).toBeVisible();
  const actual = await backup(next);
  for (const key of ['player', 'inventory', 'map', 'mercs', 'formation'] as const) expect(actual[key]).toEqual(expected[key]);
  await attach(info, stage, actual); return next;
}

async function expand(page: Page, act: number, target: Locator): Promise<void> {
  if (!(await target.isVisible())) await page.getByRole('button', {
    name: new RegExp(`(?:Act ${String(act)}|第 ?${String(act)} ?章)`)
  }).click();
}

async function inspect(page: Page, area: string): Promise<void> {
  await navTo(page, 'map'); const button = page.getByTestId(`area-objects-${area}`);
  await expand(page, 4, button); await usable(button); await button.click();
  await expect(page.getByTestId('area-object-panel')).toBeVisible();
}

async function victory(page: Page, area: string, locale: Locale, info: TestInfo, stage: string): Promise<void> {
  await navTo(page, 'map'); const row = page.getByTestId(`sub-area-row-${area}`);
  await expand(page, 4, row); await row.getByRole('button', { name: copy(locale).enter, exact: true }).click();
  await expect(page.getByTestId('combat-battlefield')).toBeVisible();
  await expect.poll(async () => {
    if (await page.getByTestId('victory-panel').isVisible()) return 'victory';
    if (await page.getByTestId('defeat-panel').isVisible()) return 'defeat';
    const skip = page.getByTestId('skip-button');
    if (await skip.isEnabled()) {
      try { await skip.click({ timeout: 2000 }); }
      catch (error) { if (!(await page.getByTestId('victory-panel').isVisible())) throw error; }
    }
    return 'playing';
  }, { timeout: 60000, intervals: [100, 200, 500] }).toBe('victory');
  await layout(page); await info.attach(`${stage}-victory`, { body: await page.screenshot(), contentType: 'image/png' });
  await page.getByTestId('return-to-map').click();
}

/** Private Node-side authored cache oracle; never expose a browser debug bridge. */
async function cache(playerId: string, questId: string, input: QuestTableRewardInput): Promise<KillRewards> {
  const server = await createServer({ configFile: false, logLevel: 'error',
    root: fileURLToPath(new URL('../..', import.meta.url)),
    cacheDir: `${String(process.env.ACT4_DELIVERY_OUTPUT)}/oracle-cache`,
    resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
    server: { middlewareMode: true, watch: null, hmr: false } });
  try {
    const award = await server.ssrLoadModule('/src/engine/loot/award.ts') as typeof import('../../src/engine/loot/award');
    const loader = await server.ssrLoadModule('/src/data/loaders/loot.ts') as typeof import('../../src/data/loaders/loot');
    const seed = hashSeed(JSON.stringify(['quest-loot-table-v1', playerId, questId, input.tableId, input.ilvl, input.picks]));
    const result = award.rollQuestTableRewards(input, loader.loadAwardPools(), createRng(seed));
    if (!result) throw new Error('Invalid authored quest cache');
    return result;
  } finally { await server.close(); }
}

function sameReward(before: SaveCurrent, after: SaveCurrent, xp: number, expected: KillRewards | null, gemShards = 0, skillPoints = 0): void {
  expect(heroXp(after) - heroXp(before)).toBe(xp); expect(mercXp(after) - mercXp(before)).toBe(Math.floor(xp * 0.75));
  expect(after.player.skillPoints - before.player.skillPoints).toBe(after.player.level - before.player.level + skillPoints);
  expect(after.player.statPoints - before.player.statPoints).toBe((after.player.level - before.player.level) * 5);
  const currencies = { ...before.inventory.currencies };
  for (const [id, amount] of [['rune-shard', (expected?.runes ?? 0) + (expected?.runeShards ?? 0)],
    ['gem-shard', (expected?.gems ?? 0) + gemShards], ['wishstone', expected?.wishstones ?? 0]] as const) {
    if (amount > 0) currencies[id] = (currencies[id] ?? 0) + amount;
  }
  expect(after.inventory.currencies).toEqual(currencies);
  const properties = (item: Item) => {
    const { id: _id, ...rest } = item;
    return JSON.parse(JSON.stringify(rest, (_key, value: unknown): unknown => value instanceof Map ? [...value] : value)) as unknown;
  };
  expect(after.inventory.backpack.slice(0, before.inventory.backpack.length)).toEqual(before.inventory.backpack);
  expect(after.inventory.backpack.slice(before.inventory.backpack.length).map(properties)).toEqual((expected?.items ?? []).map(properties));
  expect(after.inventory.equipped).toEqual(before.inventory.equipped); expect(after.inventory.stash).toEqual(before.inventory.stash);
  const items = [...after.inventory.backpack, ...after.inventory.stash,
    ...Object.values(after.inventory.equipped).filter((item): item is Item => item !== null)];
  expect(new Set(items.map(item => item.id)).size).toBe(items.length);
}

for (const locale of ['zh-CN', 'en'] as const) {
  test(`constructed A3 Soulstone to actual Izual Hellforge Diablo and Continue ${locale}`, async ({ page: initial, context }, info) => {
    test.setTimeout(300000); let page = initial; const text = copy(locale), errors: string[] = [];
    const observe = (target: Page): void => {
      target.on('pageerror', error => errors.push(error.message));
      target.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    };
    const inputPath = process.env.ACT4_INPUT_SAVE;
    if (!inputPath) throw new Error('Missing constructed prior A3 save path');
    const raw = await readFile(inputPath, 'utf8'), prior = JSON.parse(raw) as SaveCurrent;
    expect(prior.inventory.questItems[SOULSTONE]).toEqual({ itemId: 'items/soulstone_mephisto', state: 'owned' });
    expect(Object.keys(prior.map.questProgress).filter(id => id.startsWith('quests/act4-'))).toEqual([]);
    observe(page); await clearGameStorage(page); await createCharacter(page, { class: 'sorceress', name: 'A4 import fixture' });
    await navTo(page, 'settings'); await page.getByRole('button', { name: locale === 'en' ? 'English' : '简体中文', exact: true }).click();
    await page.getByRole('button', { name: text.importSave, exact: true }).click();
    const dialog = page.getByRole('dialog'); await dialog.getByRole('textbox').fill(raw);
    await dialog.getByRole('button', { name: text.importSave, exact: true }).click(); await expect(dialog).toHaveCount(0);
    // Import restores saved preferences too; explicitly choose this case's locale afterward.
    await navTo(page, 'settings'); await page.getByRole('button', { name: locale === 'en' ? 'English' : '简体中文', exact: true }).click();
    const imported = await backup(page);
    expect(imported.inventory).toEqual(prior.inventory); expect(imported.player).toEqual(prior.player);
    expect(imported.map).toEqual(prior.map); expect(imported.mercs).toEqual(prior.mercs);
    await attach(info, 'constructed-prior-a3-imported', imported);
    await navTo(page, 'quests');
    for (const id of [IZUAL, FORGE, DIABLO]) {
      const start = page.getByTestId(`quest-start-${id}`); await usable(start); await start.click();
    }
    await inspect(page, 'a4-river-of-flame'); await expect(page.getByTestId('quest-recover-quest/hellforge_hammer')).toBeDisabled();
    await expect(page.getByTestId('quest-action-actions/act4-shatter-soulstone')).toBeDisabled();
    await victory(page, 'a4-plains-of-despair', locale, info, 'izual'); const izualWon = await backup(page);
    expect(izualWon.map.questProgress[IZUAL]).toMatchObject({ status: 'completed' });
    expect(izualWon.map.questProgress[IZUAL]?.rewardClaimed).not.toBe(true);
    expect(izualWon.map.questReceipts[`${IZUAL}#action:izual-victory`]).toBe(true);
    await navTo(page, 'quests'); await page.getByTestId(`quest-claim-${IZUAL}`).click(); const izualPaid = await backup(page);
    sameReward(izualWon, izualPaid, 9000, null, 0, 2);
    page = await continued(page, context, locale, info, 'izual-claimed-continued', observe);
    await victory(page, 'a4-river-of-flame', locale, info, 'hephasto'); const hephastoWon = await backup(page);
    expect(hephastoWon.map.questReceipts[`${FORGE}#action:hephasto-victory`]).toBe(true);
    expect(hephastoWon.inventory.questItems[HAMMER]).toBeUndefined();
    await inspect(page, 'a4-river-of-flame'); const recover = page.getByTestId('quest-recover-quest/hellforge_hammer');
    await usable(recover); await recover.focus(); await recover.press('Enter'); await expect(recover).toBeDisabled();
    const recovered = await backup(page); expect(recovered.inventory.questItems[HAMMER]).toEqual({ itemId: 'quest/hellforge_hammer', state: 'owned' });
    expect(recovered.player).toEqual(hephastoWon.player); expect(recovered.mercs).toEqual(hephastoWon.mercs);
    page = await continued(page, context, locale, info, 'hammer-and-soulstone-owned-continued', observe);
    await inspect(page, 'a4-river-of-flame'); const shatter = page.getByTestId('quest-action-actions/act4-shatter-soulstone');
    await usable(shatter); await shatter.focus(); await shatter.press('Enter'); await expect(shatter).toBeDisabled();
    const shattered = await backup(page);
    expect(shattered.inventory.questItems).toEqual({ ...recovered.inventory.questItems,
      [HAMMER]: { itemId: 'quest/hellforge_hammer', state: 'consumed' }, [SOULSTONE]: { itemId: 'items/soulstone_mephisto', state: 'consumed' } });
    expect(shattered.map.questReceipts[`${FORGE}#action:shatter-soulstone`]).toBe(true);
    expect(shattered.map.questProgress[FORGE]).toMatchObject({ status: 'completed' });
    expect(shattered.map.questProgress[FORGE]?.rewardClaimed).not.toBe(true);
    expect(shattered.player).toEqual(recovered.player); expect(shattered.mercs).toEqual(recovered.mercs);
    page = await continued(page, context, locale, info, 'forge-consumed-unclaimed-continued', observe);
    await navTo(page, 'quests'); const forgeClaim = page.getByTestId(`quest-claim-${FORGE}`); await usable(forgeClaim); await forgeClaim.click();
    await expect(forgeClaim).toBeDisabled(); const forgePaid = await backup(page);
    sameReward(shattered, forgePaid, 7000, await cache(shattered.player.id, FORGE, { tableId: 'loot/hellforge-runes', ilvl: 56, picks: 1 }), 3);
    await victory(page, 'a4-chaos-sanctuary', locale, info, 'early-diablo'); const early = await backup(page);
    expect(early.map.questProgress[DIABLO]).toMatchObject({ status: 'inProgress', objectives: { 'obj-kill-diablo': false } });
    expect(early.map.questReceipts[`${DIABLO}#action:diablo-victory`]).toBeUndefined();
    expect(early.map.clearedSubAreas).toContain('areas/act4-chaos-sanctuary');
    await navTo(page, 'map'); const act5 = page.getByTestId('sub-area-row-a5-bloody-foothills'); await expand(page, 5, act5);
    await expect(act5.getByRole('button', { name: text.enter, exact: true })).toBeEnabled();
    await inspect(page, 'a4-chaos-sanctuary');
    for (const seal of [1, 2, 3]) {
      const button = page.getByTestId(`quest-object-objects/diablo_seal_${String(seal)}`);
      if (seal < 3) await expect(page.getByTestId(`quest-object-objects/diablo_seal_${String(seal + 1)}`)).toBeDisabled();
      await usable(button); await button.focus(); await button.press('Enter'); await expect(button).toBeDisabled();
    }
    const seals = await backup(page); expect(seals.player).toEqual(early.player); expect(seals.mercs).toEqual(early.mercs);
    expect(seals.map.questProgress[DIABLO]).toMatchObject({ status: 'inProgress', objectives: {
      'obj-seal-1': true, 'obj-seal-2': true, 'obj-seal-3': true, 'obj-kill-diablo': false } });
    page = await continued(page, context, locale, info, 'seals-no-backfill-continued', observe);
    await victory(page, 'a4-chaos-sanctuary', locale, info, 'qualified-diablo'); const diabloWon = await backup(page);
    expect(diabloWon.map.questProgress[DIABLO]).toMatchObject({ status: 'completed' });
    expect(diabloWon.map.questProgress[DIABLO]?.rewardClaimed).not.toBe(true);
    expect(diabloWon.map.questReceipts[`${DIABLO}#action:diablo-victory`]).toBe(true);
    page = await continued(page, context, locale, info, 'diablo-unclaimed-continued', observe);
    await navTo(page, 'quests'); const diabloClaim = page.getByTestId(`quest-claim-${DIABLO}`); await usable(diabloClaim); await diabloClaim.click();
    const paid = await backup(page); sameReward(diabloWon, paid, 25000,
      await cache(diabloWon.player.id, DIABLO, { tableId: 'loot/diablo-q', ilvl: 61, picks: 5 }));
    expect(paid.inventory.questItems).toEqual(shattered.inventory.questItems);
    await navTo(page, 'inventory'); await layout(page);
    await page.getByTestId('quest-item-quest/hellforge_hammer').scrollIntoViewIfNeeded();
    await info.attach('forge-consumed-items', { body: await page.screenshot(), contentType: 'image/png' });
    page = await continued(page, context, locale, info, 'all-three-claimed-continued', observe);
    await navTo(page, 'quests'); for (const id of [IZUAL, FORGE, DIABLO]) await expect(page.getByTestId(`quest-claim-${id}`)).toBeDisabled();
    const duplicate = await backup(page);
    for (const key of ['player', 'inventory', 'map', 'mercs'] as const) expect(duplicate[key]).toEqual(paid[key]);
    expect(errors).toEqual([]);
  });
}

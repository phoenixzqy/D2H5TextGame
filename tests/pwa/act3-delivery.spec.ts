/** Constructed cleared-area fixtures; all recovery, Give, Claim and persistence use production UI. */
import { expect, test, type Locator, type Page, type TestInfo, type BrowserContext } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import type { KillRewards } from '../../src/engine/loot/award';
import type { Item } from '../../src/engine/types/items';
import type { SaveCurrent } from '../../src/engine/types/save';
import { awardXp, xpRequired, xpTotal } from '../../src/engine/progression/xp';
import { createRng, hashSeed } from '../../src/engine/rng';
import { clearGameStorage, createCharacter, navTo } from '../e2e/_helpers';

const BLADE = 'quests/act3-blade-of-the-old-religion';
const TOME = 'quests/act3-lam-esens-tome';
const bladeSource = `${BLADE}#objective:obj-find-gidbinn`;
const tomeSource = `${TOME}#objective:obj-find-tome`;
const ringPool = ['items/unique/nagelring', 'items/unique/manald-heal',
  'items/unique/ring-of-the-leech', 'items/unique/stone-of-jordan'] as const;
const copy = {
  en: { importSave: 'Import Save', recover: 'Recover', delivered: 'Delivered',
    ring: 'Unique ring', save: 'Save', saved: 'Saved' },
  'zh-CN': { importSave: '导入存档', recover: '取回', delivered: '已交付',
    ring: '暗金戒指', save: '保存', saved: '已保存' }
} as const;

/** Encode fixture Maps in the same public array representation accepted by Import Save. */
function jsonSafe(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, (_key, nested: unknown): unknown =>
    nested instanceof Map ? [...nested.entries()] : nested));
}

async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  const path = await download.path();
  if (!path) throw new Error('Missing exported save');
  try { return JSON.parse(await readFile(path, 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}

for (const locale of ['zh-CN', 'en'] as const) {
  test(`constructed Golden Bird exchange Claim Read and Continue ${locale}`, async ({ page, context }, info) => {
    const english = locale === 'en', text = copy[locale];
    const quest = 'quests/act3-golden-bird';
    const jadeSource = `${quest}#objective:obj-find-figurine`;
    const birdSource = `${quest}#objective:obj-give-cain`;
    const potionSource = `${quest}#reward:questItem`;
    const errors: string[] = [];
    const observe = (target: Page): void => {
      target.on('pageerror', error => errors.push(error.message));
      target.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    };
    observe(page);
    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'Golden Bird fixture' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await navTo(page, 'mercs');
    await page.getByTestId('hire-merc-mercs/act1-rogue-inner-sight').getByRole('button').click();
    const original = await backup(page);
    // Explicit level/clear fixture avoids incidental hero level-up when testing Claim's Life payload.
    const incoming: SaveCurrent = { ...original,
      player: { ...original.player, level: 30, experience: 0, experienceToNextLevel: xpRequired(30),
        derivedStats: { ...original.player.derivedStats, life: 17, lifeMax: 352 } },
      map: { ...original.map, currentAct: 3, currentSubAreaId: 'areas/act3-spider-forest',
        clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha', 'areas/act3-spider-forest'],
        questProgress: { ...original.map.questProgress, [quest]: {
          id: quest, status: 'inProgress', rewardClaimed: false,
          objectives: { 'obj-find-figurine': false, 'obj-give-cain': false, 'obj-give-alkor': false }
        } }
      }
    };
    await page.getByRole('button', { name: text.importSave, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(incoming));
    await dialog.getByRole('button', { name: text.importSave, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const imported = await backup(page);
    expect(imported.player).toEqual(incoming.player);
    await attach(info, 'golden-constructed-start', imported);
    await recover(page, 'a3-spider-forest', english ? 'Jade Figurine' : '玉制小雕像', text.recover, 'quest/jade_figurine');
    const recovered = await backup(page);
    expect(recovered.inventory.questItems).toEqual({
      [jadeSource]: { itemId: 'quest/jade_figurine', state: 'owned' }
    });
    expect(recovered.map.questProgress[quest]).toMatchObject({ status: 'inProgress', rewardClaimed: false,
      objectives: { 'obj-find-figurine': true, 'obj-give-cain': false, 'obj-give-alkor': false } });
    expect(recovered.player).toEqual(imported.player);
    expect(recovered.mercs).toEqual(imported.mercs);
    for (const [npc, item, expectedLedger] of [
      ['cain', 'quest/jade_figurine', { [jadeSource]: { itemId: 'quest/jade_figurine', state: 'consumed' },
        [birdSource]: { itemId: 'quest/golden_bird', state: 'owned' } }],
      ['alkor', 'quest/golden_bird', { [jadeSource]: { itemId: 'quest/jade_figurine', state: 'consumed' },
        [birdSource]: { itemId: 'quest/golden_bird', state: 'consumed' } }]
    ] as const) {
      const beforeTalk = await backup(page);
      await navTo(page, 'town');
      await page.getByTestId(`town-npc-${npc}`).click();
      const talked = await backup(page);
      expect(talked.inventory).toEqual(beforeTalk.inventory);
      expect(talked.map.questProgress).toEqual(beforeTalk.map.questProgress);
      await navTo(page, 'town');
      await page.getByTestId(`town-npc-${npc}`).click();
      const give = page.getByTestId(`quest-give-${item}`);
      await usable(give);
      await give.focus();
      await give.press('Enter');
      await expect(give).toBeDisabled();
      await productionLayout(page);
      await info.attach(`golden-${npc}-give`, { body: await page.screenshot(), contentType: 'image/png' });
      const given = await backup(page);
      expect(given.inventory.questItems).toEqual(expectedLedger);
      expect(given.map.questProgress[quest]).toMatchObject({
        status: npc === 'cain' ? 'inProgress' : 'completed', rewardClaimed: false,
        objectives: { 'obj-find-figurine': true, 'obj-give-cain': true, 'obj-give-alkor': npc === 'alkor' }
      });
      expect(given.player).toEqual(imported.player);
      expect(given.mercs).toEqual(imported.mercs);
    }
    const given = await backup(page);
    expect(given.map.questProgress[quest]).toMatchObject({ status: 'completed', rewardClaimed: false });
    await navTo(page, 'quests');
    const claim = page.getByTestId(`quest-claim-${quest}`);
    await usable(claim);
    await claim.click();
    await expect(claim).toBeDisabled();
    const paid = await backup(page);
    expect(heroXp(paid) - heroXp(given)).toBe(4000);
    expect(mercXp(paid) - mercXp(given)).toBe(3000);
    expect(paid.player.level).toBe(30);
    expect(paid.player.derivedStats.lifeMax).toBe(given.player.derivedStats.lifeMax);
    expect(paid.player.derivedStats.life).toBe(17);
    expect(paid.inventory).toEqual({ ...given.inventory, questItems: {
      ...given.inventory.questItems, [potionSource]: { itemId: 'items/potion_of_life_q', state: 'owned' }
    } });
    await attach(info, 'golden-claim-owned-no-life-bonus', paid);
    await navTo(page, 'inventory');
    const read = page.getByTestId('quest-item-read-items/potion_of_life_q');
    await usable(read);
    await expect(read).toHaveAccessibleName(english ? 'Read' : '阅读');
    await read.focus();
    await read.press('Enter');
    await expect(read).toHaveAttribute('aria-disabled', 'true');
    await expect(read).toHaveText(english ? 'Already read' : '已阅读');
    await productionLayout(page);
    await info.attach('golden-read-no-heal', { body: await page.screenshot(), contentType: 'image/png' });
    const consumed = await backup(page);
    expect(consumed.player).toEqual({ ...paid.player, derivedStats: {
      ...paid.player.derivedStats, lifeMax: paid.player.derivedStats.lifeMax + 20
    } });
    expect(consumed.mercs).toEqual(paid.mercs);
    expect(consumed.inventory).toEqual({ ...paid.inventory, questItems: {
      ...paid.inventory.questItems, [potionSource]: { itemId: 'items/potion_of_life_q', state: 'consumed' }
    } });
    await attach(info, 'golden-read-consumed', consumed);
    await navTo(page, 'settings');
    await page.getByRole('button', { name: text.save, exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(text.saved);
    await page.close();
    const continued = await context.newPage();
    observe(continued);
    await continued.goto('/');
    await continued.getByTestId('home-continue').click();
    await expect(continued.getByTestId('town-screen')).toBeVisible();
    const restored = await backup(continued);
    expect(restored.player).toEqual(consumed.player);
    expect(restored.inventory).toEqual(consumed.inventory);
    expect(restored.mercs).toEqual(consumed.mercs);
    expect(restored.map).toEqual(consumed.map);
    await attach(info, 'golden-continued', restored);
    await navTo(continued, 'inventory');
    const reread = continued.getByTestId('quest-item-read-items/potion_of_life_q');
    await expect(reread).toHaveAttribute('aria-disabled', 'true');
    await reread.focus();
    await reread.press('Enter');
    const repeated = await backup(continued);
    expect(repeated.player).toEqual(restored.player);
    expect(repeated.inventory).toEqual(restored.inventory);
    expect(repeated.mercs).toEqual(restored.mercs);
    expect(errors).toEqual([]);
  });
}

async function attach(info: TestInfo, name: string, save: SaveCurrent): Promise<void> {
  await info.attach(name, { body: JSON.stringify(save, null, 2), contentType: 'application/json' });
}

function heroXp(save: SaveCurrent): number {
  return xpTotal(save.player.level) + save.player.experience;
}

function mercXp(save: SaveCurrent): number {
  const merc = save.mercs.ownedMercs.find(row => row.id === save.mercs.fieldedMercId);
  if (!merc) throw new Error('Missing fielded fixture mercenary');
  const progress = save.mercs.mercProgress[merc.id];
  if (!progress) throw new Error('Missing mercenary progression');
  let total = progress.experience;
  // Convert the saved level and remainder using the documented canonical merc curve.
  for (let level = 1; level < merc.level; level++) total += Math.floor(60 * level * 1.30 ** (level - 1));
  return total;
}

async function productionLayout(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function usable(button: Locator): Promise<void> {
  await expect(button).toBeEnabled();
  await button.scrollIntoViewIfNeeded();
  await expect(button).toBeInViewport();
  const box = await button.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
}

async function recover(page: Page, area: string, itemName: string, actionName: string, itemId: string, act = 3): Promise<void> {
  await navTo(page, 'map');
  const openObjects = page.getByTestId(`area-objects-${area}`);
  if (!(await openObjects.isVisible())) {
    await page.getByRole('button', { name: new RegExp(`(?:Act ${String(act)}|第 ?${String(act)} ?章)`) }).click();
  }
  await openObjects.click();
  const panel = page.getByTestId('area-object-panel');
  await expect(panel.getByRole('heading', { name: itemName, exact: true })).toBeVisible();
  const action = panel.getByTestId(`quest-recover-${itemId}`);
  await expect(action).toHaveAccessibleName(actionName);
  await usable(action);
  await action.click();
  await expect(action).toBeDisabled();
  await productionLayout(page);
}

for (const locale of ['zh-CN', 'en'] as const) {
  test(`constructed Act III Blade/Tome recover Give Claim and Continue ${locale}`, async ({ page, context }, info) => {
    const english = locale === 'en';
    const text = copy[locale];
    const errors: string[] = [];
    const observe = (target: Page): void => {
      target.on('pageerror', error => errors.push(error.message));
      target.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    };
    observe(page);
    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'A3 delivery fixture' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await navTo(page, 'mercs');
    await page.getByTestId('hire-merc-mercs/act1-rogue-inner-sight').getByRole('button').click();
    const original = await backup(page);
    expect(original.inventory.backpack).toEqual([]);
    expect(original.mercs.fieldedMercId).toBeTruthy();
    const incoming: SaveCurrent = { ...original, map: { ...original.map, currentAct: 3,
      currentSubAreaId: 'areas/act3-kurast-bazaar',
      clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha',
        'areas/act3-kurast-bazaar', 'areas/act3-flayer-jungle'],
      questProgress: { ...original.map.questProgress,
        [BLADE]: { id: BLADE, status: 'inProgress', rewardClaimed: false,
          objectives: { 'obj-find-gidbinn': false, 'obj-deliver': false } },
        [TOME]: { id: TOME, status: 'inProgress', rewardClaimed: false,
          objectives: { 'obj-find-tome': false, 'obj-deliver': false } }
      }
    } };
    await page.getByRole('button', { name: text.importSave, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(incoming));
    await dialog.getByRole('button', { name: text.importSave, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const imported = await backup(page);
    expect(imported.player).toEqual(original.player);
    expect(imported.inventory).toEqual(original.inventory);
    expect(imported.map).toEqual(incoming.map);
    await attach(info, 'constructed-start', imported);

    await recover(page, 'a3-kurast-bazaar', english ? 'Lam Esen’s Tome' : '蓝·依森的古书', text.recover, 'quest/lam_esens_tome');
    await recover(page, 'a3-flayer-jungle', english ? 'The Gidbinn' : '吉得宾', text.recover, 'quest/gidbinn');
    const recovered = await backup(page);
    expect(recovered.inventory.questItems).toEqual({
      [tomeSource]: { itemId: 'quest/lam_esens_tome', state: 'owned' },
      [bladeSource]: { itemId: 'quest/gidbinn', state: 'owned' }
    });
    expect(recovered.player).toEqual(imported.player);
    expect(recovered.mercs).toEqual(imported.mercs);
    for (const id of [BLADE, TOME]) expect(recovered.map.questProgress[id]?.status).toBe('inProgress');
    await navTo(page, 'quests');
    for (const id of [BLADE, TOME]) await expect(page.getByTestId(`quest-claim-${id}`)).toHaveCount(0);
    await navTo(page, 'town');
    await page.getByTestId('town-npc-alkor').click();
    await expect(page.getByTestId('quest-give-quest/lam_esens_tome')).toBeEnabled();
    const talked = await backup(page);
    expect(talked.inventory).toEqual(recovered.inventory);
    expect(talked.map.questProgress).toEqual(recovered.map.questProgress);
    expect(talked.player).toEqual(recovered.player);

    for (const [npc, itemId, questId] of [
      ['alkor', 'quest/lam_esens_tome', TOME], ['ormus', 'quest/gidbinn', BLADE]
    ] as const) {
      await navTo(page, 'town');
      await page.getByTestId(`town-npc-${npc}`).click();
      const give = page.getByTestId(`quest-give-${itemId}`);
      await usable(give);
      await expect(give).toHaveAccessibleName(new RegExp(english ? '^Give ' : '^交付'));
      await give.focus();
      await give.press('Enter');
      await expect(give).toBeDisabled();
      await expect(page.getByTestId('quest-deliveries').getByRole('status').first()).toContainText(text.delivered);
      await productionLayout(page);
      await info.attach(`${npc}-give`, { body: await page.screenshot(), contentType: 'image/png' });
      const given = await backup(page);
      expect(given.player).toEqual(imported.player);
      expect(given.mercs).toEqual(imported.mercs);
      expect(given.map.questProgress[questId]).toMatchObject({ status: 'completed', rewardClaimed: false });
    }
    const given = await backup(page);
    expect(given.inventory.questItems).toEqual({
      [tomeSource]: { itemId: 'quest/lam_esens_tome', state: 'consumed' },
      [bladeSource]: { itemId: 'quest/gidbinn', state: 'consumed' }
    });
    await attach(info, 'both-given-no-reward', given);

    await navTo(page, 'quests');
    const ringReward = page.getByTestId(`quest-${BLADE}`).locator('li').filter({ hasText: /^🎁/ });
    await expect(ringReward).toContainText(text.ring);
    expect(await ringReward.textContent()).not.toMatch(/profileId|quest-rewards\/|\[object Object\]/);
    const claimTome = page.getByTestId(`quest-claim-${TOME}`);
    await usable(claimTome);
    await claimTome.click();
    await expect(claimTome).toBeDisabled();
    const tomePaid = await backup(page);
    expect(heroXp(tomePaid) - heroXp(given)).toBe(6000);
    expect(mercXp(tomePaid) - mercXp(given)).toBe(4500);
    const tomeAward = awardXp(heroXp(given), 6000);
    expect(tomePaid.player.statPoints - given.player.statPoints).toBe(tomeAward.statPointsGranted + 5);
    expect(tomePaid.inventory).toEqual(given.inventory);
    await navTo(page, 'quests');
    const claimBlade = page.getByTestId(`quest-claim-${BLADE}`);
    await usable(claimBlade);
    await claimBlade.click();
    await expect(claimBlade).toBeDisabled();
    await productionLayout(page);
    const paid = await backup(page);
    expect(heroXp(paid) - heroXp(tomePaid)).toBe(5000);
    expect(mercXp(paid) - mercXp(tomePaid)).toBe(3750);
    const ring = paid.inventory.backpack[0];
    const selection = createRng(hashSeed(JSON.stringify(['quest-unique-pool-v1', given.player.id,
      BLADE, 'quest-rewards/act3-gidbinn-ring-v1', 34]))).nextInt(0, 3);
    expect(paid.inventory.backpack).toHaveLength(1);
    expect(ring).toMatchObject({ uniqueId: ringPool[selection], rarity: 'unique', ilvl: 34 });
    expect(paid.inventory).toEqual({ ...given.inventory, backpack: [ring] });
    for (const id of [BLADE, TOME]) expect(paid.map.questProgress[id]?.rewardClaimed).toBe(true);
    await attach(info, 'both-paid', paid);
    await navTo(page, 'inventory');
    const questItems = page.getByTestId('quest-items-panel');
    await expect(questItems).toContainText(english ? 'Delivered' : '已交付');
    expect(await questItems.textContent()).not.toMatch(/Inserted at|插入墓穴/);
    await productionLayout(page);
    await info.attach('inventory-delivery-receipts', { body: await questItems.screenshot(), contentType: 'image/png' });

    await navTo(page, 'settings');
    await page.getByRole('button', { name: text.save, exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(text.saved);
    await page.close();
    const continued = await context.newPage();
    observe(continued);
    await continued.goto('/');
    await continued.getByTestId('home-continue').click();
    await expect(continued.getByTestId('town-screen')).toBeVisible();
    const restored = await backup(continued);
    expect(restored.player).toEqual(paid.player);
    expect(restored.inventory).toEqual(paid.inventory);
    expect(restored.mercs).toEqual(paid.mercs);
    expect(restored.map).toEqual(paid.map);
    await attach(info, 'continued', restored);
    await navTo(continued, 'quests');
    for (const id of [BLADE, TOME]) await expect(continued.getByTestId(`quest-claim-${id}`)).toBeDisabled();
    await navTo(continued, 'town');
    for (const [npc, item] of [['alkor', 'quest/lam_esens_tome'], ['ormus', 'quest/gidbinn']] as const) {
      await continued.getByTestId(`town-npc-${npc}`).click();
      await expect(continued.getByTestId(`quest-give-${item}`)).toBeDisabled();
    }
    const repeated = await backup(continued);
    expect(repeated.player).toEqual(paid.player);
    expect(repeated.inventory).toEqual(paid.inventory);
    expect(repeated.mercs).toEqual(paid.mercs);
    await productionLayout(continued);
    expect(errors).toEqual([]);
  });
}


/** Node-side oracle: transform authored JSON through Vite without exposing any browser bridge. */
async function expectedMephistoCache(playerId: string, questId: string): Promise<KillRewards> {
  const server = await createServer({ configFile: false, logLevel: 'error',
    root: fileURLToPath(new URL('../..', import.meta.url)),
    cacheDir: `${String(process.env.ACT3_DELIVERY_OUTPUT)}/oracle-cache`,
    resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
    server: { middlewareMode: true, watch: null, hmr: false } });
  try {
    const award = await server.ssrLoadModule('/src/engine/loot/award.ts') as typeof import('../../src/engine/loot/award');
    const loader = await server.ssrLoadModule('/src/data/loaders/loot.ts') as typeof import('../../src/data/loaders/loot');
    const seed = hashSeed(JSON.stringify(['quest-loot-table-v1', playerId, questId, 'loot/mephisto-q', 47, 5]));
    const cache = award.rollQuestTableRewards({ tableId: 'loot/mephisto-q', ilvl: 47, picks: 5 }, loader.loadAwardPools(), createRng(seed));
    if (!cache) throw new Error('Invalid authored Mephisto cache');
    return cache;
  } finally { await server.close(); }
}

/** Save, close the actual page, and Continue without any test bridge or storage injection. */
async function continueExactly(page: Page, context: BrowserContext, locale: 'en' | 'zh-CN',
  info: TestInfo, stage: string, observe: (page: Page) => void): Promise<Page> {
  const expected = await backup(page), text = copy[locale];
  await page.getByRole('button', { name: text.save, exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(text.saved);
  await page.close();
  const continued = await context.newPage(); observe(continued);
  await continued.goto('/'); await continued.getByTestId('home-continue').click();
  await expect(continued.getByTestId('town-screen')).toBeVisible();
  const restored = await backup(continued);
  for (const key of ['player', 'inventory', 'map', 'mercs'] as const) expect(restored[key]).toEqual(expected[key]);
  await attach(info, stage, restored); return continued;
}

/** Only ordinary Enter, playback Skip, and Return controls; a defeat fails this fixture. */
async function nativeVictory(page: Page, alias: string, english: boolean, info: TestInfo, stage: string): Promise<void> {
  await navTo(page, 'map');
  const row = page.getByTestId(`sub-area-row-${alias}`);
  if (!(await row.isVisible())) await page.getByRole('button', { name: /(?:Act 3|第 ?3 ?章)/ }).click();
  await row.getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
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
  await productionLayout(page);
  await info.attach(`${stage}-native-victory`, { body: await page.screenshot(), contentType: 'image/png' });
  await page.getByTestId('return-to-map').click();
}

for (const locale of ['zh-CN', 'en'] as const) {
  test(`constructed actual Council Khalim Orb Mephisto rewards and Continue ${locale}`, async ({ page: initial, context }, info) => {
    test.setTimeout(240000);
    let page = initial;
    const english = locale === 'en', text = copy[locale];
    const khalim = 'quests/act3-khalims-will', guardian = 'quests/act3-guardian', staff = 'quests/act2-horadric-staff';
    const council = `${khalim}#action:council-victory`, orb = `${guardian}#action:break-compelling-orb`;
    const cube = `${staff}#objective:obj-cube`, will = `${khalim}#objective:obj-transmute`, soulstone = `${guardian}#reward:questItem`;
    const errors: string[] = [];
    const observe = (target: Page): void => {
      target.on('pageerror', error => errors.push(error.message));
      target.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    };
    observe(page); await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'A3 constructed combat fixture' });
    await navTo(page, 'settings'); await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await navTo(page, 'mercs'); await page.getByTestId('hire-merc-mercs/act1-rogue-inner-sight').getByRole('button').click();
    const original = await backup(page);
    // Deliberately constructed power/clear fixture. This proves action wiring, not earned campaign balance.
    const cap: Item = { id: 'a3-browser-constructed-cap', baseId: 'items/base/helm-cap', rarity: 'rare', level: 1,
      identified: true, equipped: false, affixes: [{ affixId: 'constructed-power', values: new Map([
        ['statMods.attack', 99978], ['statMods.defense', 99973], ['statMods.life', 999880]
      ]) }] };
    const incoming: SaveCurrent = { ...original, player: { ...original.player, level: 30, experience: 0,
      experienceToNextLevel: xpRequired(30), comboOrder: [] }, inventory: { ...original.inventory, backpack: [cap] },
      map: { ...original.map, currentAct: 2, currentSubAreaId: 'areas/act2-dry-hills', questReceipts: {},
        clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha', 'areas/act3-flayer-jungle',
          'areas/act3-great-marsh', 'areas/act3-kurast-bazaar'], questProgress: { ...original.map.questProgress,
          [staff]: { id: staff, status: 'inProgress', objectives: { 'obj-cube': false, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } },
          [khalim]: { id: khalim, status: 'inProgress', rewardClaimed: false, objectives: {
            'obj-heart': false, 'obj-brain': false, 'obj-eye': false, 'obj-flail': false, 'obj-transmute': false } },
          [guardian]: { id: guardian, status: 'inProgress', rewardClaimed: false, objectives: { 'obj-kill-mephisto': false } }
        } } };
    await page.getByRole('button', { name: text.importSave, exact: true }).click();
    const dialog = page.getByRole('dialog'); await dialog.getByRole('textbox').fill(JSON.stringify(jsonSafe(incoming)));
    await dialog.getByRole('button', { name: text.importSave, exact: true }).click(); await expect(dialog).toHaveCount(0);
    await navTo(page, 'inventory'); await page.getByTestId(`inv-item-${cap.id}`).click();
    await page.getByTestId('inv-primary-action').click();
    if (await page.getByTestId('inv-detail-close').isVisible()) await page.getByTestId('inv-detail-close').click();
    const prepared = await backup(page); expect(prepared.inventory.equipped.head?.id).toBe(cap.id);
    await attach(info, 'constructed-prepared-no-proof', prepared);
    await recover(page, 'a2-dry-hills', english ? 'Horadric Cube Coffer' : '霍拉德里克方块宝匣', text.recover, 'quest/horadric_cube', 2);
    const parts = [
      ['obj-heart', 'quest/khalims_heart', 'a3-flayer-jungle', english ? 'Khalim’s Heart' : '卡林之心'],
      ['obj-brain', 'quest/khalims_brain', 'a3-great-marsh', english ? 'Khalim’s Brain' : '卡林之脑'],
      ['obj-eye', 'quest/khalims_eye', 'a3-kurast-bazaar', english ? 'Khalim’s Eye' : '卡林之眼']
    ] as const;
    for (const [_objective, item, area, name] of english ? parts : [...parts].reverse()) await recover(page, area, name, text.recover, item);
    await nativeVictory(page, 'a3-travincal', english, info, 'council');
    const councilWon = await backup(page); expect(councilWon.map.questReceipts).toEqual({ [council]: true });
    expect(councilWon.map.clearedSubAreas).toContain('areas/act3-travincal');
    expect(councilWon.inventory.questItems[`${khalim}#objective:obj-flail`]).toBeUndefined();
    await recover(page, 'a3-travincal', english ? 'Khalim’s Flail' : '卡林之连枷', text.recover, 'quest/khalims_flail');
    await navTo(page, 'inventory'); const assemble = page.getByTestId('quest-assemble-items/khalims_will');
    await usable(assemble); await assemble.focus(); await assemble.press('Enter'); await expect(assemble).toBeDisabled();
    const assembled = await backup(page); expect(assembled.inventory.questItems[cube]).toEqual({ itemId: 'quest/horadric_cube', state: 'owned' });
    for (const [objective, item] of [...parts, ['obj-flail', 'quest/khalims_flail']]) {
      expect(assembled.inventory.questItems[`${khalim}#objective:${String(objective)}`]).toEqual({ itemId: item, state: 'consumed' });
    }
    expect(assembled.inventory.questItems[will]).toEqual({ itemId: 'items/khalims_will', state: 'owned' });
    expect(heroXp(assembled)).toBe(heroXp(councilWon)); expect(mercXp(assembled)).toBe(mercXp(councilWon));
    page = await continueExactly(page, context, locale, info, 'will-owned-continued', observe);
    await nativeVictory(page, 'a3-durance-of-hate', english, info, 'early-mephisto');
    const early = await backup(page); expect(early.map.questProgress[guardian]).toMatchObject({ status: 'inProgress', objectives: { 'obj-kill-mephisto': false } });
    expect(early.map.clearedSubAreas).toContain('areas/act3-durance-of-hate');
    expect(heroXp(early)).toBeGreaterThan(heroXp(assembled));
    await navTo(page, 'map'); await page.getByRole('button', { name: /(?:Act 4|第 ?4 ?章)/ }).click();
    await expect(page.getByTestId('sub-area-row-a4-outer-steppes').getByRole('button', { name: english ? 'Enter' : '进入', exact: true })).toBeEnabled();
    if (english) { await navTo(page, 'quests'); await page.getByTestId(`quest-claim-${khalim}`).click(); }
    await navTo(page, 'map'); await page.getByRole('button', { name: /(?:Act 3|第 ?3 ?章)/ }).click();
    await page.getByTestId('area-objects-a3-travincal').click();
    const beforeOrb = await backup(page);
    await navTo(page, 'map'); await page.getByRole('button', { name: /(?:Act 3|第 ?3 ?章)/ }).click();
    await page.getByTestId('area-objects-a3-travincal').click();
    const action = page.getByTestId('quest-action-actions/act3-break-compelling-orb');
    await usable(action); await action.focus(); await action.press('Enter'); await expect(action).toBeDisabled();
    await productionLayout(page); await info.attach('orb-consumed-no-credit', { body: await page.screenshot(), contentType: 'image/png' });
    const consumed = await backup(page);
    expect(consumed.inventory.questItems).toEqual({ ...beforeOrb.inventory.questItems, [will]: { itemId: 'items/khalims_will', state: 'consumed' } });
    expect(consumed.map.questReceipts).toEqual({ [council]: true, [orb]: true });
    expect(consumed.map.questProgress).toEqual(beforeOrb.map.questProgress);
    expect(consumed.player).toEqual(beforeOrb.player); expect(consumed.mercs).toEqual(beforeOrb.mercs);
    if (!english) { await navTo(page, 'quests'); await page.getByTestId(`quest-claim-${khalim}`).click(); }
    const khalimPaid = await backup(page);
    expect(heroXp(khalimPaid) - heroXp(early)).toBe(8000); expect(mercXp(khalimPaid) - mercXp(early)).toBe(6000);
    expect(khalimPaid.inventory.questItems[will]?.state).toBe('consumed');
    page = await continueExactly(page, context, locale, info, 'orb-consumed-no-backfill-continued', observe);
    await nativeVictory(page, 'a3-durance-of-hate', english, info, 'qualified-mephisto');
    const won = await backup(page); expect(won.map.questProgress[guardian]).toMatchObject({ status: 'completed', rewardClaimed: false, objectives: { 'obj-kill-mephisto': true } });
    page = await continueExactly(page, context, locale, info, 'guardian-unclaimed-continued', observe);
    await navTo(page, 'quests'); const claim = page.getByTestId(`quest-claim-${guardian}`);
    await usable(claim); await claim.click(); await expect(claim).toBeDisabled();
    const paid = await backup(page); expect(heroXp(paid) - heroXp(won)).toBe(18000); expect(mercXp(paid) - mercXp(won)).toBe(13500);
    expect(paid.inventory.questItems).toEqual({ ...won.inventory.questItems, [soulstone]: { itemId: 'items/soulstone_mephisto', state: 'owned' } });
    const cache = await expectedMephistoCache(won.player.id, guardian);
    const shape = (item: Item) => { const { id: _id, ...properties } = item; return jsonSafe(properties); };
    expect(paid.inventory.backpack.slice(won.inventory.backpack.length).map(shape)).toEqual(cache.items.map(shape));
    expect(paid.inventory.backpack.slice(0, won.inventory.backpack.length)).toEqual(won.inventory.backpack);
    const currencies = { ...won.inventory.currencies };
    for (const [id, amount] of [['rune-shard', cache.runes + cache.runeShards], ['gem-shard', cache.gems], ['wishstone', cache.wishstones]] as const) {
      if (amount > 0) currencies[id] = (currencies[id] ?? 0) + amount;
    }
    expect(paid.inventory.currencies).toEqual(currencies);
    const allItems = [...paid.inventory.backpack, ...paid.inventory.stash, ...Object.values(paid.inventory.equipped).filter((item): item is Item => item !== null)];
    expect(new Set(allItems.map(item => item.id)).size).toBe(allItems.length);
    await navTo(page, 'inventory'); const stone = page.getByTestId('quest-item-items/soulstone_mephisto');
    await expect(stone).toContainText(english ? 'Mephisto’s Soulstone' : '墨菲斯托的灵魂石');
    await expect(page.getByTestId('quest-item-read-items/soulstone_mephisto')).toHaveCount(0);
    await productionLayout(page); await stone.scrollIntoViewIfNeeded();
    await info.attach('retained-soulstone', { body: await page.screenshot(), contentType: 'image/png' });
    page = await continueExactly(page, context, locale, info, 'guardian-claimed-soulstone-continued', observe);
    await navTo(page, 'quests'); await expect(page.getByTestId(`quest-claim-${guardian}`)).toBeDisabled();
    const duplicate = await backup(page); expect(duplicate.player).toEqual(paid.player); expect(duplicate.inventory).toEqual(paid.inventory);
    expect(duplicate.map).toEqual(paid.map); expect(duplicate.mercs).toEqual(paid.mercs); expect(errors).toEqual([]);
  });
}

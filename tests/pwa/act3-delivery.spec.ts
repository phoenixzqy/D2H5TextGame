/** Constructed cleared-area fixtures; all recovery, Give, Claim and persistence use production UI. */
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { awardXp, xpTotal } from '../../src/engine/progression/xp';
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

async function recover(page: Page, area: string, itemName: string, actionName: string): Promise<void> {
  await navTo(page, 'map');
  const openObjects = page.getByTestId(`area-objects-${area}`);
  if (!(await openObjects.isVisible())) {
    await page.getByRole('button', { name: /(?:Act 3|第 3 章|第3章)/ }).click();
  }
  await openObjects.click();
  const panel = page.getByTestId('area-object-panel');
  await expect(panel.getByRole('heading', { name: itemName, exact: true })).toBeVisible();
  const action = panel.getByRole('button', { name: actionName, exact: true });
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

    await recover(page, 'a3-kurast-bazaar', english ? 'Lam Esen’s Tome' : '蓝·依森的古书', text.recover);
    await recover(page, 'a3-flayer-jungle', english ? 'The Gidbinn' : '吉得宾', text.recover);
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

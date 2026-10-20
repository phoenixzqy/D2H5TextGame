/** Ordinary production creation, weapon authority, real casting, and persistence. */
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Item } from '../../src/engine/types/items';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const fixedTime = new Date('2026-10-20T12:00:00.000Z');
const name = 'Weapon Authority';
const arrow = 'skills-amazon-magic-arrow';
const merc = 'mercs/act1-rogue-inner-sight';
const replacement: Item = { id: 'it-87zeo-7', baseId: 'items/base/wp2h-two-handed-sword',
  rarity: 'normal', level: 2, ilvl: 2, baseRolls: { attack: 8 }, affixes: [],
  generatedName: {}, identified: true, equipped: false };
const starter: Item = { id: 'starter-amazon-bow-1792497600000', baseId: 'items/base/weapon-bow-training',
  rarity: 'normal', level: 1, ilvl: 1, baseRolls: { attack: 13 }, identified: true,
  equipped: true, equipSlot: 'weapon' };
const freshStats = { life: 140, lifeMax: 140, mana: 72, manaMax: 72, attack: 35, defense: 20,
  attackSpeed: 125, critChance: 0.05, critDamage: 2, physDodge: 0.1, magicDodge: 0.05,
  magicFind: 0, goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } };

async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const file = await pending;
  try { return JSON.parse(await readFile(await file.path(), 'utf8')) as SaveCurrent; }
  finally { await file.delete(); }
}
async function production(page: Page) {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}
async function wave(page: Page) {
  const value = /^\D*(\d+)/.exec(await page.getByTestId('wave-counter').innerText())?.[1];
  if (!value) throw new Error('Missing numeric wave');
  return Number(value);
}
async function enter(page: Page, english: boolean) {
  await navTo(page, 'map');
  await page.getByTestId('sub-area-row-a1-blood-moor')
    .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
  await expect(page.getByTestId('combat-screen')).toBeVisible();
  expect(await wave(page)).toBe(1);
}
async function pause(page: Page, english: boolean) {
  await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click({ timeout: 500 });
  await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }))
    .toHaveAttribute('aria-pressed', 'true');
}

async function flee(page: Page, english: boolean) {
  await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
  await expect(page.getByTestId('map-screen')).toBeVisible();
}
async function skills(page: Page, english: boolean, available: boolean, configured: boolean) {
  await navTo(page, 'skills');
  await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
  for (let slot = 1; slot <= 9; slot += 1) {
    const select = page.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} ${String(slot)}`, exact: true });
    await expect(select.locator(`option[value="${arrow}"]`)).toHaveCount(available ? 1 : 0);
    await expect(select).toHaveValue(configured && slot === 1 ? arrow : '');
  }
  await production(page);
}
async function configure(page: Page, english: boolean) {
  await page.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} 1`, exact: true }).selectOption(arrow);
}
async function equipment(page: Page) {
  await navTo(page, 'inventory');
  await page.locator('[role="tab"][aria-controls="tabpanel-equipment"]').click();
}
async function restore(page: Page, english: boolean) {
  await equipment(page);
  // Tap the slot label; the occupied tile's center overlaps Details on mobile.
  await page.getByTestId('equip-slot-weapon').getByText(english ? 'Weapon' : '武器', { exact: true }).click();
  await page.getByTestId(`equip-picker-row-${starter.id}`).click();
  await page.getByTestId('equip-picker-confirm').click();
  await expect(page.getByTestId('equip-picker-confirm')).toBeHidden();
}
async function attack(page: Page, english: boolean, value: number) {
  await page.getByTestId('character-hud').click();
  await expect(page.getByTestId('character-screen')).toBeVisible();
  await expect(page.getByText(english ? 'Attack Rating' : '命中率', { exact: true }).locator('..'))
    .toHaveText(`${english ? 'Attack Rating' : '命中率'}${String(value)}`);
}
function oneStarter(save: SaveCurrent) {
  const all = [...save.inventory.backpack, ...save.inventory.stash,
    ...Object.values(save.inventory.equipped), ...save.player.equipment];
  expect(all.filter(item => item?.id === starter.id)).toHaveLength(1);
  expect(save.player.equipment).toEqual([]);
}
async function stored(page: Page): Promise<SaveCurrent> {
  return page.evaluate(() => new Promise<SaveCurrent>((resolve, reject) => {
    const open = indexedDB.open('D2H5TextGame');
    open.onerror = () => { reject(new Error('Could not open saved character')); };
    open.onsuccess = () => {
      const db = open.result;
      const get = db.transaction('saves', 'readonly').objectStore('saves').get('current');
      get.onerror = () => { db.close(); reject(new Error('Could not read saved character')); };
      get.onsuccess = () => {
        const record = get.result as { data: SaveCurrent } | undefined;
        db.close();
        if (!record) reject(new Error('No committed character'));
        else resolve(record.data);
      };
    };
  }));
}
async function save(page: Page, english: boolean, expected: SaveCurrent) {
  expect(await backup(page)).toEqual(expected);
  oneStarter(expected);
  await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
  expect(await stored(page)).toEqual(expected);
  expect(await backup(page)).toEqual(expected);
  await production(page);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`ordinary Amazon weapon authority ${locale}`, async ({ page, context }, testInfo) => {
    test.setTimeout(150_000);
    const english = locale === 'en';
    const errors: string[] = [];
    const watch = (target: Page) => {
      target.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
      target.on('console', message => {
        if (message.type() === 'warning' || message.type() === 'error') errors.push(`${message.type()}: ${message.text()}`);
      });
    };
    watch(page);
    await page.clock.setFixedTime(fixedTime);
    await page.goto('/');
    await createCharacter(page, { class: 'amazon', name });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state), { timeout: 60_000 }).toBe('activated');
    const fresh = await backup(page);
    expect(fresh.version).toBe(8);
    expect(fresh.player).toEqual({
      id: 'player-1792497600000', name, type: 'player', team: 'player', class: 'amazon', level: 1,
      experience: 0, experienceToNextLevel: 100, statPoints: 0, skillPoints: 1,
      coreStats: { strength: 20, dexterity: 25, vitality: 20, energy: 15 }, derivedStats: freshStats,
      statusEffects: [], cooldowns: [], skills: [], comboOrder: ['amazon.magic_arrow'],
      skillLevels: { 'amazon.magic_arrow': 1 }, alive: true, turnOrder: 0, equipment: []
    });
    expect(fresh.inventory).toEqual({ backpack: [], stash: [], equipped: { weapon: starter, offhand: null }, currencies: {} });
    oneStarter(fresh);
    await equipment(page);
    await expect(page.getByTestId('equip-slot-weapon')).toContainText(english ? 'Training Bow' : '训练弓');
    await page.getByTestId('equip-slot-weapon-details').click();
    await expect(page.getByTestId('equipped-item-modal').getByTestId('header-item-name')).toHaveText(english ? 'Training Bow' : '训练弓');
    await production(page);
    await testInfo.attach('starter-visible', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    await page.getByTestId('equipped-item-modal-close').click();
    await navTo(page, 'skills');
    await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
    for (let slot = 1; slot <= 9; slot += 1) {
      await page.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} ${String(slot)}`, exact: true })
        .selectOption(slot === 1 ? arrow : '');
    }
    const configured = await backup(page);
    expect(configured).toEqual({ ...fresh, player: { ...fresh.player, comboOrder: [arrow] } });
    await navTo(page, 'mercs');
    await page.getByTestId(`hire-merc-${merc}`).getByRole('button', { name: english ? 'Hire' : '招募', exact: true }).click();
    await expect(page.getByTestId(`merc-field-${merc}`)).toHaveText(english ? 'Unfield' : '撤下');
    await enter(page, english);
    const log = page.getByTestId('combat-log');
    const cast = english ? `${name} casts Magic Arrow.` : `${name} 施放了 魔法箭。`;
    const hit = english ? `${name} attacks Fallen A for 26 arcane damage.` : `${name} 普攻 堕落者 A，造成 26 点奥术伤害。`;
    // Independent first-action oracle: same known seed prefix, authored35..50 ->38-12=26.
    await expect(log.getByText(hit, { exact: true })).toBeAttached();
    await pause(page, english);
    await expect(log.getByText(cast, { exact: true })).toBeAttached();
    const target = page.getByTestId('unit-card-enemy-act1.fallen-0-db2c');
    await expect(target.locator('.bg-red-600')).toHaveAttribute('style', 'width: 44.68%;');
    await expect(page.getByRole('group', { name: english ? 'MP' : '法力', exact: true }).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '67');
    const lines = await log.locator(':scope > div > span:last-child').allTextContents();
    expect(lines.filter(line => line.startsWith(name))).toEqual([cast, hit]);
    await testInfo.attach('opening-literal', { body: JSON.stringify({ lines, mana: 67, targetLife: 21 }), contentType: 'application/json' });
    await production(page);
    await page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }).click();
    await page.getByTestId('skip-button').click();
    await expect(page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]:not([data-dead="true"])')).toHaveCount(0);
    await expect(page.getByTestId('unit-card-player-1792497600000')).not.toHaveAttribute('data-dead', 'true');
    await expect.poll(() => wave(page), { timeout: 5000, intervals: [50] }).toBe(2);
    await pause(page, english);
    expect(await wave(page)).toBe(2);
    await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
    await expect(page.getByTestId('map-screen')).toBeVisible();
    const firstEarned = await backup(page);
    expect(firstEarned.player.level).toBe(2);
    expect(firstEarned.player.experience).toBe(60);
    expect(firstEarned.inventory.backpack).toHaveLength(5);
    expect(firstEarned.inventory.currencies).toEqual({ 'rune-shard': 75 });
    // Frozen earned route: exactly two first-wave wins, with a second Date-only seed.
    await page.clock.setFixedTime(new Date('2026-10-20T12:00:00.055Z'));
    await enter(page, english);
    await expect(page.getByTestId('unit-card-enemy-act1.fallen-0-09f2')).toBeVisible();
    await page.getByTestId('skip-button').click();
    await expect(page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]:not([data-dead="true"])')).toHaveCount(0);
    await expect(page.getByTestId('unit-card-player-1792497600000')).not.toHaveAttribute('data-dead', 'true');
    await expect.poll(() => wave(page), { timeout: 5000, intervals: [50] }).toBe(2);
    await pause(page, english);
    expect(await wave(page)).toBe(2);
    await flee(page, english);
    const earned = await backup(page);
    expect(earned.player).toEqual({ ...configured.player,
      level: 2, experience: 240, experienceToNextLevel: 565, statPoints: 5, skillPoints: 2,
      derivedStats: { ...freshStats, lifeMax: 148, manaMax: 76, attack: 37, defense: 23 }
    });
    expect(160 + 180).toBe(100 + earned.player.experience);
    expect(earned.inventory.backpack).toHaveLength(8);
    expect(earned.inventory.backpack[6]).toEqual(replacement);
    expect(earned.inventory.backpack.slice(0, 5)).toEqual(firstEarned.inventory.backpack);
    expect(earned.inventory.equipped).toEqual({ weapon: starter, offhand: null });
    expect(earned.inventory.currencies).toEqual({ 'rune-shard': 158 });
    oneStarter(earned);
    await testInfo.attach('earned-baseline', { body: JSON.stringify(earned), contentType: 'application/json' });

    await equipment(page);
    await page.getByTestId('equip-slot-weapon').getByRole('button', { name: english ? 'Unequip' : '卸下', exact: true }).click();
    await attack(page, english, 24); // NakedL1 attack22 +2 for earnedL2.
    await skills(page, english, false, false);
    const unarmed = { ...earned,
      player: { ...earned.player, comboOrder: [], derivedStats: { ...earned.player.derivedStats, attack: 24 } },
      inventory: { ...earned.inventory, equipped: { weapon: null, offhand: null },
        backpack: [...earned.inventory.backpack, { ...starter, equipped: false }] }
    };
    expect(await backup(page)).toEqual(unarmed);
    oneStarter(unarmed);
    await enter(page, english);
    const basicAction = english ? `${name} readies an attack.` : `${name} 准备出招。`;
    // Date55 first action:24attack -12defense =12physical; no skill spend.
    // Energy15 * recovery0.2 * first-action1.5s grants4MP, reaching cap76.
    const basicHit = english ? `${name} attacks Fallen A for 12 physical damage.`
      : `${name} 普攻 堕落者 A，造成 12 点物理伤害。`;
    await expect(page.getByTestId('combat-log').getByText(basicHit, { exact: true })).toBeAttached();
    await pause(page, english);
    const basicLines = await page.getByTestId('combat-log').locator(':scope > div > span:last-child').allTextContents();
    expect(basicLines.filter(line => line.startsWith(name))).toEqual([basicAction, basicHit]);
    expect(basicLines).not.toContain(cast);
    await expect(page.getByRole('group', { name: english ? 'MP' : '法力', exact: true }).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '76');
    await expect(page.getByTestId('unit-card-enemy-act1.fallen-0-09f2').locator('.bg-red-600')).toHaveAttribute('style', 'width: 71.43%;');
    await production(page);
    await testInfo.attach('unarmed-opening', { body: JSON.stringify(basicLines), contentType: 'application/json' });
    await flee(page, english); // No second wave reward is drained.
    expect(await backup(page)).toEqual(unarmed);

    await restore(page, english);
    await skills(page, english, true, false); // Eligibility returns; removed combo stays empty.
    await configure(page, english);
    expect(await backup(page)).toEqual(earned);
    await navTo(page, 'inventory');
    await page.getByTestId(`inv-item-${replacement.id}`).click();
    const detail = page.getByTestId('inv-detail-panel');
    await expect(detail.getByTestId('candidate-item-header').getByTestId('header-item-name')).toHaveText(english ? 'Two-Handed Sword' : '双手剑');
    const attackRow = detail.getByTestId('stat-row').filter({
      has: page.getByRole('rowheader', { name: english ? 'Attack' : '攻击力', exact: true })
    });
    await expect(attackRow.locator('td').nth(0)).toHaveText('37');
    await expect(attackRow.locator('td').nth(1).locator(':scope > span').first()).toHaveText('32'); // 24 + earned literal8.
    await expect(attackRow.getByTestId('stat-delta')).toContainText('(-5)');
    await production(page);
    await testInfo.attach('sword-preview', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    await detail.getByTestId('inv-primary-action').click();
    await expect(detail).toBeHidden();
    await attack(page, english, 32);
    await skills(page, english, false, false);
    const wrongWeapon = { ...earned,
      player: { ...earned.player, comboOrder: [], derivedStats: { ...earned.player.derivedStats, attack: 32 } },
      inventory: { ...earned.inventory, equipped: { weapon: { ...replacement, equipped: true }, offhand: null },
        backpack: [...earned.inventory.backpack.filter(item => item.id !== replacement.id), { ...starter, equipped: false }] }
    };
    await save(page, english, wrongWeapon);
    await testInfo.attach('saved-sword', { body: JSON.stringify(wrongWeapon), contentType: 'application/json' });
    await page.close();
    const reopened = await context.newPage();
    watch(reopened);
    await reopened.clock.setFixedTime(new Date('2026-10-20T12:00:00.055Z'));
    await reopened.goto('/');
    await reopened.getByTestId('home-continue').click();
    await expect(reopened.getByTestId('town-screen')).toBeVisible();
    expect(await stored(reopened)).toEqual(wrongWeapon);
    expect(await backup(reopened)).toEqual(wrongWeapon);
    await expect(reopened.getByRole('button', { name: english ? 'English' : '简体中文', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await attack(reopened, english, 32);
    await skills(reopened, english, false, false);
    await restore(reopened, english);
    await skills(reopened, english, true, false);
    await configure(reopened, english);
    const restored = { ...earned, inventory: { ...earned.inventory,
      backpack: [...earned.inventory.backpack.filter(item => item.id !== replacement.id), replacement] } };
    expect(await backup(reopened)).toEqual(restored);
    await attack(reopened, english, 37);
    await enter(reopened, english);
    // Same55 first draws: base48, crit2, mitigation12 ->84arcane (rank1 retained).
    // The same pre-action recovery reaches76, then Magic Arrow spends5 ->71MP.
    const restoredHit = english ? `CRITICAL! ${name} hits Fallen A for 84 arcane damage!`
      : `暴击！${name} 对 堕落者 A 造成 84 点奥术伤害！`;
    await expect(reopened.getByTestId('combat-log').getByText(restoredHit, { exact: true })).toBeAttached();
    await pause(reopened, english);
    await expect(reopened.getByTestId('combat-log').getByText(cast, { exact: true })).toBeAttached();
    await expect(reopened.getByRole('group', { name: english ? 'MP' : '法力', exact: true }).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '71');
    await expect(reopened.getByTestId('unit-card-enemy-act1.fallen-0-09f2')).toHaveAttribute('data-dead', 'true');
    await production(reopened);
    await testInfo.attach('restored-opening', { body: await reopened.getByTestId('combat-log').innerText(), contentType: 'text/plain' });
    await flee(reopened, english);
    await save(reopened, english, restored);
    await reopened.close();
    const finalPage = await context.newPage();
    watch(finalPage);
    await finalPage.clock.setFixedTime(new Date('2026-10-20T12:00:00.055Z'));
    await finalPage.goto('/');
    await finalPage.getByTestId('home-continue').click();
    await expect(finalPage.getByTestId('town-screen')).toBeVisible();
    expect(await stored(finalPage)).toEqual(restored);
    expect(await backup(finalPage)).toEqual(restored);
    oneStarter(await backup(finalPage));
    await expect(finalPage.getByRole('button', { name: english ? 'English' : '简体中文', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await skills(finalPage, english, true, true);
    await attack(finalPage, english, 37);
    await equipment(finalPage);
    await expect(finalPage.getByTestId('equip-slot-weapon')).toContainText(english ? 'Training Bow' : '训练弓');
    await testInfo.attach('restored-persistent', { body: await finalPage.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    await production(finalPage);
    expect(errors).toEqual([]);
  });
}

/** Ordinary learning, a literal first hit, earned upgrade, and production persistence. */
import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const fixedTime = new Date('2026-10-20T12:00:00.000Z');
const fireBolt = 'sorceress.fire_bolt';
const authoredFireBolt = 'skills-sorceress-fire-bolt';
const mercId = 'mercs/act1-rogue-inner-sight';
const characterName = 'Earned Fire Bolt';
const starterRanks = { 'sorceress.frost_nova': 1, 'sorceress.ice_bolt': 1 };
const freshStats = {
  life: 120, lifeMax: 120, mana: 102, manaMax: 102, attack: 22, defense: 20,
  attackSpeed: 125, critChance: 0.05, critDamage: 2, physDodge: 0.1, magicDodge: 0.05,
  magicFind: 0, goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};

async function exportBackup(page: Page): Promise<SaveCurrent> {
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}

async function readStoredSave(page: Page): Promise<SaveCurrent> {
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

async function expectProduction(page: Page): Promise<void> {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function currentWave(page: Page): Promise<number> {
  const text = await page.getByTestId('wave-counter').innerText();
  const number = /^\D*(\d+)/.exec(text)?.[1];
  if (!number) throw new Error(`Missing numeric wave counter: ${text}`);
  return Number(number);
}

/** One compact representative plus its +N badge accounts for every monster. */
async function displayedMonsterCount(cards: Locator): Promise<number> {
  let count = 0;
  for (const card of await cards.all()) {
    const badge = card.locator(':scope > div:first-of-type > div').filter({ hasText: /^\+\d+$/ });
    expect(await badge.count()).toBeLessThanOrEqual(1);
    count += 1 + (await badge.count() ? Number((await badge.innerText()).slice(1)) : 0);
  }
  return count;
}

async function selectFireBolt(page: Page): Promise<Locator> {
  await navTo(page, 'skills');
  await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
  await page.getByTestId(`skill-node-${authoredFireBolt}`).click();
  return page.getByTestId('skill-detail-panel');
}

async function expectRank(page: Page, english: boolean, rank: 1 | 2): Promise<void> {
  const detail = await selectFireBolt(page);
  await expect(detail.getByText(english ? `Lv. ${String(rank)}/20 · Active` : `等级 ${String(rank)}/20 · 主动`, { exact: true })).toBeVisible();
  const current = detail.locator('section').filter({
    has: page.getByRole('heading', { name: english ? 'Current' : '当前', exact: true })
  });
  await expect(current).toContainText(rank === 1 ? '30 ~ 45' : '34 ~ 49');
  await expect(current.getByText(english ? 'Cooldown' : '冷却', { exact: true })
    .locator('..').getByRole('definition')).toHaveText(english ? '1 s' : '1 秒');
  await expect(detail.getByRole('button', { name: english ? 'No Points' : '无技能点', exact: true })).toBeDisabled();
  await expectProduction(page);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`ordinary Fire Bolt earns rank 2 and survives save reopen ${locale}`, async ({ page, context }, testInfo) => {
    const english = locale === 'en';
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    // Freeze Date only. Native combat, animation and auto-advance timers keep running.
    await page.clock.setFixedTime(fixedTime);
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name: characterName });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state),
      { timeout: 60_000 }).toBe('activated');
    const fresh = await exportBackup(page);
    expect(fresh.player).toEqual({
      id: 'player-1792497600000', name: characterName, type: 'player', team: 'player',
      level: 1, class: 'sorceress', experience: 0, experienceToNextLevel: 100,
      statPoints: 0, skillPoints: 1,
      coreStats: { strength: 10, dexterity: 25, vitality: 10, energy: 35 },
      derivedStats: freshStats, statusEffects: [], cooldowns: [], skills: [],
      comboOrder: ['sorceress.frost_nova', 'sorceress.ice_bolt'], skillLevels: starterRanks,
      alive: true, turnOrder: 0, equipment: []
    });
    expect(fresh.mercs.ownedMercs).toEqual([]);

    // One fixed ordinary route, including the authored free hire; no loss-dependent fallback.
    await navTo(page, 'mercs');
    const hire = page.getByTestId(`hire-merc-${mercId}`);
    await hire.getByRole('button', { name: english ? 'Hire' : '招募', exact: true }).click();
    await expect(hire.getByRole('button')).toBeDisabled();
    await expect(page.getByTestId(`merc-field-${mercId}`)).toHaveText(english ? 'Unfield' : '撤下');
    const detail = await selectFireBolt(page);
    await expect(detail.getByText(english ? 'Unlearned / 20 · Active' : '未学习 / 20 · 主动', { exact: true })).toBeVisible();
    await navTo(page, 'settings');
    const baseline = await exportBackup(page);
    expect(baseline.player).toEqual({ ...fresh.player, comboOrder: ['skills-sorceress-ice-bolt'] });
    expect(baseline.inventory).toEqual(fresh.inventory);
    expect(baseline.mercs.fieldedMercId).toBe(mercId);
    expect(baseline.mercs.ownedMercs).toHaveLength(1);
    expect(baseline.mercs.mercEquipment).toEqual({ [mercId]: {} });
    expect(baseline.mercs.mercProgress).toEqual({ [mercId]: { experience: 0, experienceToNextLevel: 304 } });
    const initialMerc = baseline.mercs.ownedMercs[0];
    if (!initialMerc) throw new Error('No ordinarily hired mercenary');
    expect(initialMerc.id).toBe(mercId);
    expect(initialMerc.level).toBe(3);
    expect(initialMerc.coreStats).toEqual({ strength: 12, dexterity: 22, vitality: 16, energy: 14 });
    expect(initialMerc.derivedStats.life).toBe(148);
    expect(initialMerc.derivedStats.lifeMax).toBe(148);

    await selectFireBolt(page);
    await page.getByTestId('skill-detail-panel').getByRole('button', { name: english ? 'Allocate' : '分配', exact: true }).click();
    await expectRank(page, english, 1);
    await navTo(page, 'settings');
    const learned = await exportBackup(page);
    expect(learned).toEqual({ ...baseline, player: {
      ...baseline.player, skillPoints: 0, skillLevels: { ...starterRanks, [fireBolt]: 1 }
    } });
    await navTo(page, 'skills');
    await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
    await page.getByRole('combobox', { name: english ? 'Slot 1' : '槽位 1', exact: true }).selectOption(authoredFireBolt);
    // All remaining ordinary slots are explicitly empty.
    for (let slot = 2; slot <= 9; slot += 1) {
      await page.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} ${String(slot)}`, exact: true }).selectOption('');
    }
    await expectProduction(page);
    await navTo(page, 'settings');
    const configured = await exportBackup(page);
    expect(configured).toEqual({ ...learned, player: { ...learned.player, comboOrder: [authoredFireBolt] } });

    await navTo(page, 'map');
    await page.getByTestId('sub-area-row-a1-blood-moor')
      .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
    await expect(page.getByTestId('combat-screen')).toBeVisible();
    expect(await currentWave(page)).toBe(1);
    const enemies = page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]');
    expect(await displayedMonsterCount(enemies)).toBe(8);
    const hero = page.getByTestId('unit-card-player-1792497600000');
    await expect(hero).toHaveAttribute('data-kind', 'hero');
    await expect(page.getByTestId('allies-grid').locator('[data-kind="merc"]')).toHaveCount(1);
    // Independent literal oracle: runSeed2330410254, waveSeed349193407.
    // Fallen HP47/defense12; hit .687..., base33, noncrit .856... =>21, remaining26.
    const target = page.getByTestId('unit-card-enemy-act1.fallen-0-db2c');
    const targetHP = target.locator('.bg-red-600');
    await expect(targetHP).toHaveAttribute('style', 'width: 100%;');
    const log = page.getByTestId('combat-log');
    // Pin the authored localized name while retaining the seeded combat oracle.
    const cast = english ? `${characterName} casts Fire Bolt.` : `${characterName} 施放了 火弹。`;
    await expect(log.getByText(cast, { exact: true })).toBeAttached();
    await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click({ timeout: 500 });
    await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(targetHP).toHaveAttribute('style', 'width: 55.32%;');
    const hit = english
      ? `${characterName} attacks Fallen A for 21 fire damage.`
      : `${characterName} 普攻 堕落者 A，造成 21 点火焰伤害。`;
    await expect(log.getByText(hit, { exact: true })).toBeAttached();
    const heroLines = await log.locator(':scope > div > span:last-child').allTextContents();
    expect(heroLines.filter(line => line.startsWith(characterName))).toEqual([cast, hit]);
    await testInfo.attach('rank-1-opening-log', { body: heroLines.join('\n'), contentType: 'text/plain' });
    await expectProduction(page);
    await page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }).click();
    await page.getByTestId('skip-button').click();
    await expect(page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]:not([data-dead="true"])')).toHaveCount(0);
    await expect(hero).not.toHaveAttribute('data-dead', 'true');
    await expect.poll(() => currentWave(page), { timeout: 5000, intervals: [50] }).toBe(2);
    // A missed window or additional wave award fails instead of being accepted.
    await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click({ timeout: 500 });
    await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await currentWave(page)).toBe(2);
    await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
    await expect(page.getByTestId('map-screen')).toBeVisible();
    await navTo(page, 'settings');
    const earned = await exportBackup(page);
    expect(100 + earned.player.experience).toBe(160);
    expect(earned.player).toEqual({ ...configured.player,
      level: 2, experience: 60, experienceToNextLevel: 565, statPoints: 5, skillPoints: 1,
      derivedStats: { ...freshStats, lifeMax: 128, manaMax: 106, attack: 24, defense: 23 }
    });
    expect(earned.mercs).toEqual({ ...baseline.mercs,
      ownedMercs: [initialMerc], mercProgress: { [mercId]: { experience: 120, experienceToNextLevel: 304 } }
    });
    // Random materialized loot below is only an observed persistence baseline.
    await selectFireBolt(page);
    await page.getByTestId('skill-detail-panel').getByRole('button', { name: english ? 'Allocate' : '分配', exact: true }).click();
    await expectRank(page, english, 2);
    await navTo(page, 'settings');
    const upgraded = await exportBackup(page);
    expect(upgraded).toEqual({ ...earned, player: { ...earned.player,
      skillPoints: 0, skillLevels: { ...starterRanks, [fireBolt]: 2 }
    } });
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    const saved = await exportBackup(page);
    expect(saved).toEqual(upgraded);
    expect(await readStoredSave(page)).toEqual(saved);
    await page.close();
    const reopened = await context.newPage();
    reopened.on('pageerror', error => errors.push(error.message));
    await reopened.clock.setFixedTime(fixedTime);
    await reopened.goto('/');
    await reopened.getByTestId('home-continue').click();
    await expect(reopened.getByTestId('town-screen')).toBeVisible();
    await navTo(reopened, 'settings');
    await expect(reopened.getByRole('button', { name: english ? 'English' : '简体中文', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await readStoredSave(reopened)).toEqual(saved);
    expect(await exportBackup(reopened)).toEqual(saved);
    await expectRank(reopened, english, 2);
    await reopened.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
    await expect(reopened.getByRole('combobox', { name: english ? 'Slot 1' : '槽位 1', exact: true })).toHaveValue(authoredFireBolt);
    for (let slot = 2; slot <= 9; slot += 1) {
      await expect(reopened.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} ${String(slot)}`, exact: true })).toHaveValue('');
    }
    await expectProduction(reopened);
    expect(errors).toEqual([]);
  });
}

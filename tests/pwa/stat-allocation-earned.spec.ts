/** Ordinary earned points, cancellable preview, native checkpoint and Save/reopen. */
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const fixedTime = new Date('2026-10-20T12:00:00.000Z');
const fireBolt = 'sorceress.fire_bolt';
const authoredFireBolt = 'skills-sorceress-fire-bolt';
const mercId = 'mercs/act1-rogue-inner-sight';
const characterName = 'Earned Stats';
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


const checkpointTime = new Date(fixedTime.getTime() + 1000);
const stats = ['strength', 'dexterity', 'vitality', 'energy'] as const;
type Stat = typeof stats[number];
const names = {
  en: { strength: 'Strength', dexterity: 'Dexterity', vitality: 'Vitality', energy: 'Energy' },
  'zh-CN': { strength: '力量', dexterity: '敏捷', vitality: '体力', energy: '精力' }
};

function change(page: Page, locale: 'en' | 'zh-CN', stat: Stat, increase: boolean): Locator {
  const name = locale === 'en'
    ? `${increase ? 'Increase' : 'Decrease'} ${names[locale][stat]}`
    : `${increase ? '增加' : '减少'}${names[locale][stat]}`;
  return page.getByRole('button', { name, exact: true });
}

async function character(page: Page): Promise<void> {
  await page.getByTestId('character-hud').click();
  await expect(page.getByTestId('character-screen')).toBeVisible();
}

async function attachSave(info: TestInfo, name: string, save: SaveCurrent): Promise<void> {
  await info.attach(name, { body: JSON.stringify(save, null, 2), contentType: 'application/json' });
}

async function save(page: Page, english: boolean): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
  const exported = await exportBackup(page);
  expect(await readStoredSave(page)).toEqual(exported);
  return exported;
}

async function expectPreview(page: Page, mixed: boolean): Promise<void> {
  for (const [stat, before, after] of [
    ['strength', 10, 10], ['dexterity', 25, 26], ['vitality', 10, 12], ['energy', 35, 37]
  ] as const) {
    await expect(page.getByTestId(`char-draft-${stat}`))
      .toHaveText(mixed && before !== after ? `${String(before)} → ${String(after)}` : String(before));
  }
  await expect(page.getByTestId('char-draft-remaining')).toHaveText(mixed ? '0' : '5');
  await expect(page.getByTestId('char-stat-points')).toHaveText('5');
}

async function expectDerived(page: Page, english: boolean, applied: boolean): Promise<void> {
  const bars = page.getByTestId('char-derived-stats');
  await expect(bars).toContainText(applied ? '120 / 132' : '120 / 128');
  await expect(bars).toContainText(applied ? '102 / 109' : '102 / 106');
  const panel = bars.locator('..');
  const rows = panel.locator('ul > li');
  await expect(rows).toHaveCount(9);
  for (const [en, zh, value] of [
    ['Attack Rating', '命中率', applied ? '25' : '24'], ['Defense', '防御', '23'],
    ['Attack Speed', '攻击速度', applied ? '126' : '125'], ['Crit Chance', '暴击率', '5%'],
    ['Crit Damage', '暴击伤害', '200%'], ['Physical Dodge', '物理闪避', '10%'],
    ['Magical Dodge', '魔法闪避', '5%'], ['Magic Find', '魔法寻物 (MF)', '0%'],
    ['Gold Find', '金币寻物', '0%']
  ] as const) {
    const row = rows.filter({ has: page.getByText(english ? en : zh, { exact: true }) });
    await expect(row).toHaveCount(1);
    await expect(row.locator('span').last()).toHaveText(value);
  }
}

async function stageMixed(page: Page, locale: 'en' | 'zh-CN'): Promise<void> {
  await change(page, locale, 'dexterity', true).click();
  await change(page, locale, 'vitality', true).click({ clickCount: 2 });
  await change(page, locale, 'energy', true).click({ clickCount: 2 });
  await expectPreview(page, true);
}

async function layout(page: Page, info: TestInfo, label: string): Promise<void> {
  await expectProduction(page);
  const core = page.getByTestId('char-core-stats');
  const buttons = core.getByRole('button');
  await expect(buttons).toHaveCount(10);
  const targets: { name: string; width: number; height: number }[] = [];
  for (const button of await buttons.all()) {
    await button.scrollIntoViewIfNeeded();
    const box = await button.boundingBox();
    if (!box) throw new Error('Missing editor button geometry');
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
    targets.push({ name: await button.getAttribute('aria-label') ?? await button.innerText(), width: box.width, height: box.height });
  }
  const textSizes = await core.locator('p, li span, button').evaluateAll(elements =>
    elements.map(element => Number.parseFloat(getComputedStyle(element).fontSize)));
  expect(textSizes.every(size => size >= 14)).toBe(true);
  const nav = page.getByRole('navigation');
  await expect(nav).toHaveClass(/pb-\[env\(safe-area-inset-bottom\)\]/);
  await info.attach(`layout-${label}`, { body: JSON.stringify({ viewport: page.viewportSize(), targets, textSizes,
    safeAreaPadding: await nav.evaluate(element => getComputedStyle(element).paddingBottom) }), contentType: 'application/json' });
  await info.attach(`editor-${label}`, { body: await core.screenshot(), contentType: 'image/png' });
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`ordinary earned attributes cancel apply and survive reopen ${locale}`, async ({ page, context }, info) => {
    test.setTimeout(180_000);
    const english = locale === 'en';
    const errors: string[] = [];
    const observe = (observed: Page) => {
      observed.on('pageerror', error => errors.push(error.message));
      observed.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    };
    observe(page);
    // Freeze Date only; combat and the real 30s persistence checkpoint retain native timers.
    await page.clock.setFixedTime(fixedTime);
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name: characterName });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state), { timeout: 60_000 }).toBe('activated');
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
    await attachSave(info, 'fresh', fresh);
    await navTo(page, 'mercs');
    const hire = page.getByTestId(`hire-merc-${mercId}`);
    await hire.getByRole('button', { name: english ? 'Hire' : '招募', exact: true }).click();
    await expect(hire.getByRole('button')).toBeDisabled();
    await expect(page.getByTestId(`merc-field-${mercId}`)).toHaveText(english ? 'Unfield' : '撤下');
    await selectFireBolt(page);
    await navTo(page, 'settings');
    const recruited = await exportBackup(page);
    expect(recruited.player).toEqual({ ...fresh.player, comboOrder: ['skills-sorceress-ice-bolt'] });
    expect(recruited.inventory).toEqual(fresh.inventory);
    expect(recruited.mercs.fieldedMercId).toBe(mercId);
    expect(recruited.mercs.ownedMercs).toHaveLength(1);
    const initialMerc = recruited.mercs.ownedMercs[0];
    if (!initialMerc) throw new Error('No ordinarily recruited mercenary');
    expect(initialMerc.id).toBe(mercId);
    expect(initialMerc.level).toBe(3);
    expect(initialMerc.coreStats).toEqual({ strength: 12, dexterity: 22, vitality: 16, energy: 14 });
    expect(initialMerc.derivedStats.life).toBe(148);
    expect(recruited.mercs.mercEquipment).toEqual({ [mercId]: {} });
    expect(recruited.mercs.mercProgress).toEqual({ [mercId]: { experience: 0, experienceToNextLevel: 304 } });
    await selectFireBolt(page);
    await page.getByTestId('skill-detail-panel').getByRole('button', { name: english ? 'Allocate' : '分配', exact: true }).click();
    await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
    await page.getByRole('combobox', { name: english ? 'Slot 1' : '槽位 1', exact: true }).selectOption(authoredFireBolt);
    for (let slot = 2; slot <= 9; slot += 1) {
      await page.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} ${String(slot)}`, exact: true }).selectOption('');
    }
    await navTo(page, 'settings');
    const configured = await exportBackup(page);
    expect(configured).toEqual({ ...recruited, player: { ...recruited.player,
      skillPoints: 0, skillLevels: { ...starterRanks, [fireBolt]: 1 }, comboOrder: [authoredFireBolt]
    } });
    await attachSave(info, 'configured', configured);
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
    await page.getByTestId('skip-button').click();
    await expect(page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]:not([data-dead="true"])')).toHaveCount(0);
    await expect(hero).not.toHaveAttribute('data-dead', 'true');
    await expect.poll(() => currentWave(page), { timeout: 5000, intervals: [50] }).toBe(2);
    await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click({ timeout: 500 });
    await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await currentWave(page)).toBe(2);
    await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
    await expect(page.getByTestId('map-screen')).toBeVisible();
    const earned = await save(page, english);
    expect(earned.player).toEqual({ ...configured.player,
      level: 2, experience: 60, experienceToNextLevel: 565, statPoints: 5, skillPoints: 1,
      derivedStats: { ...freshStats, lifeMax: 128, manaMax: 106, attack: 24, defense: 23 }
    });
    expect(earned.mercs).toEqual({ ...recruited.mercs,
      mercProgress: { [mercId]: { experience: 120, experienceToNextLevel: 304 } }
    });
    // Loot is an observed persistence baseline; no drop distribution is certified here.
    await attachSave(info, 'earned', earned);
    await character(page);
    const core = page.getByTestId('char-core-stats');
    const apply = core.getByRole('button', { name: english ? 'Apply attributes' : '应用属性', exact: true });
    const cancel = core.getByRole('button', { name: english ? 'Cancel changes' : '取消修改', exact: true });
    const derived = page.getByTestId('char-derived-stats').locator('..');
    const committedDerived = await derived.innerText();
    await expectDerived(page, english, false);
    await expectPreview(page, false);
    await expect(apply).toBeDisabled();
    for (const stat of stats) await expect(change(page, locale, stat, false)).toBeDisabled();
    await layout(page, info, 'earned');
    await change(page, locale, 'strength', true).click();
    await change(page, locale, 'strength', false).click();
    await expectPreview(page, false);
    await expect(core.getByRole('status')).toBeEmpty();

    // Real browser Tab order and native Space activation stage/remove additions.
    const dexPlus = change(page, locale, 'dexterity', true);
    await dexPlus.focus();
    await expect(dexPlus).toBeFocused();
    expect(await dexPlus.evaluate(element => getComputedStyle(element).boxShadow)).not.toBe('none');
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await expect(change(page, locale, 'vitality', true)).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await expect(change(page, locale, 'energy', true)).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('Shift+Tab');
    await expect(change(page, locale, 'energy', false)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.getByTestId('char-draft-energy')).toHaveText('35');
    await page.keyboard.press('Tab');
    await expect(change(page, locale, 'energy', true)).toBeFocused();
    await page.keyboard.press('Space');
    await change(page, locale, 'energy', true).click();
    await change(page, locale, 'vitality', true).click();
    await expectPreview(page, true);
    await expect(derived).toHaveText(committedDerived, { useInnerText: true });
    for (const stat of stats) await expect(change(page, locale, stat, true)).toBeDisabled();
    await info.attach('active-draft', { body: await core.screenshot(), contentType: 'image/png' });
    // Date-only +1s makes a genuine quiet checkpoint write observable without injected writes/events.
    await page.clock.setFixedTime(checkpointTime);
    const checkpointExpected: SaveCurrent = { ...earned, timestamp: checkpointTime.getTime(), meta: {
      ...earned.meta, idleState: { ...earned.meta.idleState, lastOnline: checkpointTime.getTime() }
    } };
    await expect.poll(async () => (await readStoredSave(page)).timestamp,
      { timeout: 35_000, intervals: [250] }).toBe(checkpointTime.getTime());
    const checkpoint = await readStoredSave(page);
    expect(checkpoint).toEqual(checkpointExpected);
    await expectPreview(page, true);
    await expect(derived).toHaveText(committedDerived, { useInnerText: true });
    await attachSave(info, 'active-draft-checkpoint', checkpoint);
    await apply.focus();
    await page.keyboard.press('Tab');
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Space');
    await expectPreview(page, false);
    await expect(apply).toBeDisabled();
    await expect(core.getByRole('status')).toHaveText(english ? 'Changes cancelled.' : '已取消修改。');
    await expect(derived).toHaveText(committedDerived, { useInnerText: true });
    const cancelled = await save(page, english);
    expect(cancelled).toEqual(checkpointExpected);
    await attachSave(info, 'cancelled-explicit-save', cancelled);
    await character(page);
    await change(page, locale, 'energy', true).click();
    await navTo(page, 'settings');
    expect(await exportBackup(page)).toEqual(checkpointExpected);
    await character(page);
    await expectPreview(page, false);
    await expect(apply).toBeDisabled();
    const unmounted = await save(page, english);
    expect(unmounted).toEqual(checkpointExpected);
    await attachSave(info, 'unmounted-explicit-save', unmounted);
    await character(page);
    await stageMixed(page, locale);
    await cancel.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(apply).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(core.getByRole('status')).toHaveText(english ? 'Attributes applied.' : '属性已应用。');
    await expect(page.getByTestId('char-stat-points')).toHaveText('0');
    await expect(page.getByTestId('char-draft-remaining')).toHaveText('0');
    for (const [stat, value] of [['strength', '10'], ['dexterity', '26'], ['vitality', '12'], ['energy', '37']] as const) {
      await expect(page.getByTestId(`char-draft-${stat}`)).toHaveText(value);
      await expect(change(page, locale, stat, true)).toBeDisabled();
      await expect(change(page, locale, stat, false)).toBeDisabled();
    }
    await expectDerived(page, english, true);
    await info.attach('applied-editor', { body: await core.screenshot(), contentType: 'image/png' });
    const applied = await save(page, english);
    const appliedExpected: SaveCurrent = { ...checkpointExpected, player: { ...earned.player,
      statPoints: 0, coreStats: { strength: 10, dexterity: 26, vitality: 12, energy: 37 },
      derivedStats: { ...earned.player.derivedStats, lifeMax: 132, manaMax: 109,
        attack: 25, attackSpeed: 126, physDodge: 0.10200000000000001 }
    } };
    expect(applied).toEqual(appliedExpected);
    await attachSave(info, 'applied-explicit-save', applied);
    await page.close();
    const reopened = await context.newPage();
    observe(reopened);
    await reopened.clock.setFixedTime(checkpointTime);
    await reopened.goto('/');
    await reopened.getByTestId('home-continue').click();
    await expect(reopened.getByTestId('town-screen')).toBeVisible();
    await navTo(reopened, 'settings');
    await expect(reopened.getByRole('button', { name: english ? 'English' : '简体中文', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await readStoredSave(reopened)).toEqual(appliedExpected);
    const restored = await exportBackup(reopened);
    expect(restored).toEqual(appliedExpected);
    await attachSave(info, 'reopened', restored);
    await character(reopened);
    await expect(reopened.getByTestId('char-stat-points')).toHaveText('0');
    await expect(reopened.getByTestId('char-draft-dexterity')).toHaveText('26');
    await expect(reopened.getByTestId('char-draft-vitality')).toHaveText('12');
    await expect(reopened.getByTestId('char-draft-energy')).toHaveText('37');
    await expectDerived(reopened, english, true);
    await layout(reopened, info, 'reopened');
    await info.attach('derived-reopened', { body: await reopened.getByTestId('char-derived-stats').locator('..').screenshot(), contentType: 'image/png' });
    // One bounded geometry sweep reuses the earned character; no extra combat or acceptance skips.
    if (english && info.project.name === 'pwa-desktop') {
      for (const [width, height] of [[320,640],[360,640],[375,667],[393,851],[412,915],[640,360],
        [768,1024],[1024,768],[1280,800],[1440,900],[1920,1080]] as const) {
        await reopened.setViewportSize({ width, height });
        await layout(reopened, info, `${String(width)}x${String(height)}`);
      }
    }
    await info.attach('browser-errors', { body: JSON.stringify(errors), contentType: 'application/json' });
    expect(errors).toEqual([]);
  });
}

/** Ordinary level-six earning, living Freeze witnesses, upgrade, and production persistence. */
import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const fixedTime = new Date('2026-10-20T12:00:00.000Z');
const name = 'Earned Frost Nov'; // Character creation permits 16 characters.
const frost = 'skills-sorceress-frost-nova';
const fire = 'skills-sorceress-fire-bolt';
const ice = 'skills-sorceress-ice-bolt';
const merc = 'mercs/act1-rogue-inner-sight';
const ranks = { 'sorceress.frost_nova': 1, 'sorceress.ice_bolt': 1 };
const reachXP = [0, 0, 100, 665, 2223, 5423, 11013];
const nextXP = [0, 100, 565, 1558, 3200, 5590, 8818];
const itemAwards = [5, 6, 6, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12];
const shardAwards = [75, 84, 91, 99, 107, 119, 131, 141, 150, 158, 169, 180, 190];
interface Sample { mp: string | null; log: (string | null)[] }

async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
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
async function production(page: Page) {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function tree(page: Page, skill: string) {
  await navTo(page, 'skills');
  await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
  await page.getByTestId(`skill-node-${skill}`).click();
  return page.getByTestId('skill-detail-panel');
}
async function slots(page: Page, english: boolean, selected: string, available: boolean, configure = false) {
  await navTo(page, 'skills');
  await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
  for (let slot = 1; slot <= 9; slot += 1) {
    const select = page.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} ${String(slot)}`, exact: true });
    await expect(select.locator(`option[value="${frost}"]`)).toHaveCount(available ? 1 : 0);
    if (configure) await select.selectOption(slot === 1 ? selected : '');
    await expect(select).toHaveValue(slot === 1 ? selected : '');
  }
  await production(page);
}
async function countMonsters(cards: Locator) {
  let count = 0;
  for (const card of await cards.all()) {
    const badge = card.locator(':scope > div:first-of-type > div').filter({ hasText: /^\+\d+$/ });
    expect(await badge.count()).toBeLessThanOrEqual(1);
    count += 1 + (await badge.count() ? Number((await badge.innerText()).slice(1)) : 0);
  }
  return count;
}
async function enter(page: Page, english: boolean) {
  await navTo(page, 'map');
  await page.getByTestId('sub-area-row-a1-blood-moor')
    .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
  await expect(page.getByTestId('combat-screen')).toBeVisible();
  expect(await wave(page)).toBe(1);
}
async function wave(page: Page) {
  const value = /^\D*(\d+)/.exec(await page.getByTestId('wave-counter').innerText())?.[1];
  if (!value) throw new Error('Missing numeric wave');
  return Number(value);
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
async function rankDetail(page: Page, english: boolean, rank: 1 | 2) {
  const detail = await tree(page, frost);
  await expect(detail.getByText(english ? `Lv. ${String(rank)}/20 · Active` : `等级 ${String(rank)}/20 · 主动`, { exact: true })).toBeVisible();
  const current = detail.locator('section').filter({ has: page.getByRole('heading', { name: english ? 'Current' : '当前', exact: true }) });
  await expect(current).toContainText(rank === 1 ? '25 ~ 35' : '28 ~ 38');
  await expect(current.getByText(english ? 'Cooldown' : '冷却', { exact: true }).locator('..').getByRole('definition'))
    .toHaveText(english ? '3 s' : '3 秒');
  await production(page);
}
async function save(page: Page, english: boolean, expected: SaveCurrent) {
  expect(await backup(page)).toEqual(expected);
  await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
  expect(await stored(page)).toEqual(expected);
  expect(await backup(page)).toEqual(expected);
  await production(page);
}

/** Read rendered MP/log only. The observer owns no game state or timer. */
async function witness(page: Page, english: boolean, rank: 1 | 2) {
  await enter(page, english);
  expect(await countMonsters(page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]'))).toBe(rank === 1 ? 9 : 8);
  await pause(page, english);
  await expect(page.getByTestId('allies-grid').locator('[data-kind="merc"]')).toHaveCount(0);
  const target = page.getByTestId('unit-card-enemy-act1.fallen-2-4379');
  const control = page.getByTestId('unit-card-enemy-act1.fallen-1-9804');
  await expect(target.locator('.bg-red-600')).toHaveAttribute('style', 'width: 100%;');
  const capture = await page.getByTestId('combat-screen').evaluateHandle((screen, mpLabel) => {
    const samples: Sample[] = [];
    const sample = () => samples.push({
      mp: screen.querySelector(`[role="group"][aria-label="${mpLabel}"] [role="progressbar"]`)?.getAttribute('aria-valuenow') ?? null,
      log: [...screen.querySelectorAll('[data-testid="combat-log"] > div > span:last-child')].map(line => line.textContent)
    });
    sample();
    const observer = new MutationObserver(sample);
    observer.observe(screen, { subtree: true, attributes: true, childList: true, characterData: true });
    return { observer, samples };
  }, english ? 'MP' : '法力');
  const log = page.getByTestId('combat-log');
  const c = english ? 'Fallen C' : '堕落者 C';
  const b = english ? 'Fallen B' : '堕落者 B';
  const cast = english ? `${name} casts Frost Nova.` : `${name} 施放了 冰霜新星。`;
  const status = (unit: string, id: string) => english ? `${unit} is afflicted with [${id}].` : `${unit} 进入【${id}】状态。`;
  const stunned = english ? `${c} is stunned and cannot act.` : `${c} 被眩晕，无法行动。`;
  const normal = (unit: string) => english ? `${unit} casts Weak Melee.` : `${unit} 施放了 弱近战。`;
  const damage = (unit: string, amount: number) => english
    ? `${name} attacks ${unit} for ${String(amount)} cold damage.`
    : `${name} 普攻 ${unit}，造成 ${String(amount)} 点冰冷伤害。`;
  const cAttack = english ? `${c} attacks ${name} for 1 physical damage.` : `${c} 普攻 ${name}，造成 1 点物理伤害。`;
  const cLife = rank === 1 ? 'width: 64.86%;' : 'width: 56.76%;';
  const bLife = rank === 1 ? 'width: 68.18%;' : 'width: 61.36%;';
  try {
    await page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }).click();
    await expect(log.getByText(stunned, { exact: true })).toBeAttached({ timeout: 15_000 });
    await expect(log.getByText(normal(b), { exact: true })).toBeAttached({ timeout: 15_000 });
    await pause(page, english);
    const suppressed = await log.locator(':scope > div > span:last-child').allTextContents();
    const ordered = [damage(c, rank === 1 ? 13 : 16), status(c, 'chill'), status(c, 'freeze'), stunned];
    let prior = -1;
    for (const line of ordered) {
      const index = suppressed.indexOf(line);
      expect(index).toBeGreaterThan(prior);
      prior = index;
    }
    expect(suppressed.filter(line => line === cast)).toHaveLength(1);
    expect(suppressed).not.toContain(normal(c));
    expect(suppressed).not.toContain(status(b, 'freeze'));
    expect(suppressed).not.toContain(english ? `${b} is stunned and cannot act.` : `${b} 被眩晕，无法行动。`);
    expect(suppressed).toContain(damage(english ? 'Fallen A' : '堕落者 A', rank === 1 ? 15 : 18));
    expect(suppressed).toContain(damage(b, rank === 1 ? 14 : 17));
    expect(suppressed.indexOf(status(b, 'chill'))).toBeGreaterThan(suppressed.indexOf(damage(b, rank === 1 ? 14 : 17)));
    expect(suppressed.indexOf(normal(b))).toBeGreaterThan(suppressed.indexOf(status(b, 'chill')));
    await expect(target).not.toHaveAttribute('data-dead', 'true');
    await expect(target.locator('.bg-red-600')).toHaveAttribute('style', cLife);
    await expect(control).not.toHaveAttribute('data-dead', 'true');
    await expect(control.locator('.bg-red-600')).toHaveAttribute('style', bLife);
    await expect(page.getByTestId('unit-card-enemy-act1.fallen-0-db2c').locator('.bg-red-600'))
      .toHaveAttribute('style', rank === 1 ? 'width: 68.09%;' : 'width: 61.7%;');
    const opening = await capture.evaluate(({ samples }) => samples);
    // ENG35 *0.2=7MP/s; floor(1.5s *7)=10, current102→112, cost20→92.
    const recovered = opening.findIndex(sample => sample.mp === '112' && !sample.log.includes(cast));
    expect(recovered).toBeGreaterThanOrEqual(0);
    expect(opening.findIndex((sample, index) => index > recovered && sample.mp === '92' && sample.log.includes(cast))).toBeGreaterThan(recovered);
    await production(page);
    const screenshot = await page.screenshot({ animations: 'disabled' });
    await page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }).click();
    await expect(log.getByText(cAttack, { exact: true })).toBeAttached({ timeout: 15_000 });
    await pause(page, english);
    const resumed = await log.locator(':scope > div > span:last-child').allTextContents();
    expect(resumed.indexOf(normal(c))).toBeGreaterThan(resumed.indexOf(stunned));
    expect(resumed.indexOf(cAttack)).toBeGreaterThan(resumed.indexOf(normal(c)));
    expect(resumed.filter(line => line === normal(c))).toHaveLength(1);
    expect(resumed.filter(line => line === cast)).toHaveLength(1);
    await expect(target).not.toHaveAttribute('data-dead', 'true');
    await expect(target.locator('.bg-red-600')).toHaveAttribute('style', cLife);
    await expect(control).not.toHaveAttribute('data-dead', 'true');
    await expect(control.locator('.bg-red-600')).toHaveAttribute('style', bLife);
    const samples = await capture.evaluate(({ observer, samples }) => { observer.disconnect(); return samples; });
    await production(page);
    return { suppressed, resumed, samples, screenshot, targetId: 'unit-card-enemy-act1.fallen-2-4379', cLife, bLife };
  } finally {
    await capture.evaluate(({ observer }) => { observer.disconnect(); });
    await capture.dispose();
  }
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`ordinary Frost Nova earns level six, freezes and persists rank two ${locale}`, async ({ page, context }, testInfo) => {
    test.setTimeout(180_000); // Measured forty-wave native discovery:110.381s case, no accelerated timers.
    const english = locale === 'en';
    const errors: string[] = [];
    const watch = (watched: Page) => {
      watched.on('pageerror', error => errors.push(error.message));
      watched.on('console', message => { if (['warning', 'error'].includes(message.type())) errors.push(message.text()); });
    };
    watch(page);
    await page.clock.setFixedTime(fixedTime);
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state), { timeout: 60_000 }).toBe('activated');
    const fresh = await backup(page);
    expect(fresh.player.comboOrder).toEqual(['sorceress.frost_nova', 'sorceress.ice_bolt']);
    expect(fresh.player.skillLevels).toEqual(ranks);
    expect(fresh.player.skillPoints).toBe(1);
    expect(fresh.inventory.backpack).toEqual([]);
    expect(fresh.inventory.equipped).toEqual({});
    const detail = await tree(page, frost);
    await expect(detail.getByRole('button', { name: english ? 'Requires Lv. 6' : '需要等级 6', exact: true })).toBeDisabled();
    await expect(detail.getByText(english ? 'Lv. 1/20 · Active' : '等级 1/20 · 主动', { exact: true })).toBeVisible();
    // Automatic normalization must persist before any manual combo selection.
    const sanitized = await backup(page);
    expect(sanitized).toEqual({ ...fresh, player: { ...fresh.player, comboOrder: [ice] } });
    await slots(page, english, ice, false);
    await navTo(page, 'mercs');
    await page.getByTestId(`hire-merc-${merc}`).getByRole('button', { name: english ? 'Hire' : '招募', exact: true }).click();
    const hired = await backup(page);
    expect(hired.mercs.fieldedMercId).toBe(merc);
    expect(hired.mercs.ownedMercs).toHaveLength(1);
    await tree(page, fire);
    await page.getByTestId('skill-detail-panel').getByRole('button', { name: english ? 'Allocate' : '分配', exact: true }).click();
    const learned = await backup(page);
    expect(learned).toEqual({ ...hired, player: { ...hired.player, skillPoints: 0, skillLevels: { ...ranks, 'sorceress.fire_bolt': 1 } } });
    await slots(page, english, fire, false, true);
    const configured = await backup(page);
    expect(configured).toEqual({ ...learned, player: { ...learned.player, comboOrder: [fire] } });
    let totalXP = 0;
    let items = 0;
    let shards = 0;
    let earned = configured;
    for (let ordinal = 0; ordinal < 40; ordinal += 1) {
      await test.step(`qualified first-wave award ${String(ordinal + 1)}`, async () => {
        await enter(page, english);
        expect(await countMonsters(page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]'))).toBe(8 + ordinal % 13);
        await page.getByTestId('skip-button').click();
        await expect(page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]:not([data-dead="true"])')).toHaveCount(0);
        await expect(page.getByTestId('unit-card-player-1792497600000')).not.toHaveAttribute('data-dead', 'true');
        await expect.poll(() => wave(page), { timeout: 5000, intervals: [50] }).toBe(2);
        await pause(page, english);
        expect(await wave(page)).toBe(2);
        await flee(page, english);
        earned = await backup(page);
        totalXP += (8 + ordinal % 13) * 20;
        items += itemAwards[ordinal % 13] ?? 0;
        shards += shardAwards[ordinal % 13] ?? 0;
        const level = earned.player.level;
        expect((reachXP[level] ?? -1) + earned.player.experience).toBe(totalXP);
        expect(earned.player).toEqual({ ...configured.player, level, experience: totalXP - (reachXP[level] ?? -1),
          experienceToNextLevel: nextXP[level], statPoints: (level - 1) * 5, skillPoints: level - 1,
          derivedStats: { ...configured.player.derivedStats, lifeMax: 120 + 8 * (level - 1), manaMax: 102 + 4 * (level - 1),
            attack: 22 + 2 * (level - 1), defense: 20 + 3 * (level - 1) } });
        expect(earned.inventory.backpack).toHaveLength(items);
        expect(earned.inventory.currencies).toEqual({ 'rune-shard': shards });
        expect(earned.inventory.equipped).toEqual({});
        if (ordinal === 38) expect(level).toBe(5);
        await testInfo.attach(`award-${String(ordinal)}`, { body: JSON.stringify({ ordinal, kills: 8 + ordinal % 13,
          totalXP, player: earned.player, items, shards }), contentType: 'application/json' });
      });
    }
    expect(totalXP).toBe(11080);
    expect(earned.player.level).toBe(6);
    expect(earned.player.experience).toBe(67);
    expect(earned.player.skillPoints).toBe(5);
    expect(earned.inventory.backpack).toHaveLength(344);
    expect(new Set(earned.inventory.backpack.map(item => item.id)).size).toBe(344);
    expect(earned.inventory.stash).toEqual([]);
    expect(earned.player.equipment).toEqual([]);
    await testInfo.attach('earned-level-six', { body: JSON.stringify(earned), contentType: 'application/json' });
    await navTo(page, 'mercs');
    await expect(page.getByTestId(`merc-field-${merc}`)).toHaveText(english ? 'Unfield' : '撤下');
    await page.getByTestId(`merc-field-${merc}`).click();
    await expect(page.getByTestId(`merc-field-${merc}`)).toHaveText(english ? 'Set as Fielded' : '设为上场');
    const unfielded = await backup(page);
    expect(unfielded).toEqual({ ...earned, mercs: { ...earned.mercs, fieldedMercId: null } });
    await rankDetail(page, english, 1);
    await slots(page, english, frost, true, true);
    const rankOne = await backup(page);
    expect(rankOne).toEqual({ ...unfielded, player: { ...unfielded.player, comboOrder: [frost] } });
    const first = await witness(page, english, 1);
    await testInfo.attach('rank-one-phases', { body: JSON.stringify({ ...first, screenshot: undefined }), contentType: 'application/json' });
    await testInfo.attach('rank-one-suppressed', { body: first.screenshot, contentType: 'image/png' });
    await flee(page, english);
    expect(await backup(page)).toEqual(rankOne);
    await tree(page, frost);
    await page.getByTestId('skill-detail-panel').getByRole('button', { name: english ? 'Allocate' : '分配', exact: true }).click();
    await rankDetail(page, english, 2);
    const rankTwo = { ...rankOne, player: { ...rankOne.player, skillPoints: 4,
      skillLevels: { ...rankOne.player.skillLevels, 'sorceress.frost_nova': 2 } } };
    await save(page, english, rankTwo);
    await testInfo.attach('saved-rank-two', { body: JSON.stringify(rankTwo), contentType: 'application/json' });
    await page.close();
    const reopened = await context.newPage();
    watch(reopened);
    await reopened.clock.setFixedTime(fixedTime);
    await reopened.goto('/');
    await reopened.getByTestId('home-continue').click();
    await expect(reopened.getByTestId('town-screen')).toBeVisible();
    expect(await stored(reopened)).toEqual(rankTwo);
    expect(await backup(reopened)).toEqual(rankTwo);
    await expect(reopened.getByRole('button', { name: english ? 'English' : '简体中文', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await rankDetail(reopened, english, 2);
    await slots(reopened, english, frost, true);
    const second = await witness(reopened, english, 2);
    await testInfo.attach('rank-two-phases', { body: JSON.stringify({ ...second, screenshot: undefined }), contentType: 'application/json' });
    await testInfo.attach('rank-two-suppressed', { body: second.screenshot, contentType: 'image/png' });
    await flee(reopened, english);
    expect(await backup(reopened)).toEqual(rankTwo);
    await save(reopened, english, rankTwo);
    await slots(reopened, english, frost, true);
    expect(errors).toEqual([]);
  });
}

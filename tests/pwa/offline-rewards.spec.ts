/** Actual offline return, decaying award-time XP and durable earned state. */
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const createdAt = Date.parse('2026-10-20T12:00:00.000Z');
const returnedAt = createdAt + 8 * 3_600_000;
const combatAt = returnedAt + 1_800_000;
const awardedAt = combatAt + 1500;
const mercId = 'mercs/act1-rogue-inner-sight';
const fireBolt = 'skills-sorceress-fire-bolt';

async function exportBackup(page: Page): Promise<SaveCurrent> {
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}

/** Read the real physical save; never write storage or use the debug bridge. */
async function readStoredSave(page: Page): Promise<SaveCurrent> {
  return page.evaluate(() => new Promise<SaveCurrent>((resolve, reject) => {
    const open = indexedDB.open('D2H5TextGame');
    open.onerror = () => { reject(new Error('Could not open saved character')); };
    open.onsuccess = () => {
      const db = open.result;
      const get = db.transaction('saves', 'readonly').objectStore('saves').get('current');
      get.onerror = () => { db.close(); reject(new Error('Could not read saved character')); };
      get.onsuccess = () => {
        const record = get.result as { encoding?: string; data: SaveCurrent | string } | undefined;
        db.close();
        if (!record) { reject(new Error('No committed character')); return; }
        try {
          if (Object.hasOwn(record, 'encoding') && record.encoding !== 'json-v1') {
            throw new Error('Unsupported storage encoding');
          }
          resolve(record.encoding === 'json-v1'
            ? JSON.parse(record.data as string) as SaveCurrent : record.data as SaveCurrent);
        } catch (error) { reject(error instanceof Error ? error : new Error(String(error))); }
      };
    };
  }));
}

async function expectProduction(page: Page): Promise<void> {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function saveBackup(page: Page, english: boolean): Promise<SaveCurrent> {
  await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
  const save = await exportBackup(page);
  expect(await readStoredSave(page)).toEqual(save);
  return save;
}

function atTime(base: SaveCurrent, now: number): SaveCurrent {
  const seconds = (now - returnedAt) / 1000;
  return { ...base, timestamp: now, meta: { ...base.meta, idleState: {
    ...base.meta.idleState, lastOnline: now, offlineTime: 8 * 3_600_000,
    activeMultiplier: 1 + 0.5 * (7200 - seconds) / 7200,
    multiplierSecondsRemaining: 7200 - seconds
  } } };
}

async function waveNumber(page: Page): Promise<number> {
  const label = await page.getByTestId('wave-counter').innerText();
  const number = /^\D*(\d+)/.exec(label)?.[1];
  if (!number) throw new Error(`Missing wave number: ${label}`);
  return Number(number);
}

/** Compact monster cards represent a stack; count its badge as well. */
async function countEnemies(page: Page): Promise<number> {
  let count = 0;
  for (const card of await page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]').all()) {
    // Blood Moor's first trash wave is authored at level 2: 20 base XP/kill.
    await expect(card).toHaveAttribute('data-kind', 'monster');
    const id = await card.getAttribute('data-testid');
    expect(id).toMatch(/^unit-card-enemy-act1\.(fallen|quill-rat)-/);
    const badge = card.locator(':scope > div:first-of-type > div').filter({ hasText: /^\+\d+$/ });
    expect(await badge.count()).toBeLessThanOrEqual(1);
    count += 1 + (await badge.count() ? Number((await badge.innerText()).slice(1)) : 0);
  }
  expect(count).toBeGreaterThanOrEqual(8);
  expect(count).toBeLessThanOrEqual(20);
  return count;
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`offline return awards decayed XP once and reopens durably ${locale}`, async ({ page: initialPage, context }, testInfo) => {
    const english = locale === 'en';
    const errors: string[] = [];
    context.on('page', opened => opened.on('pageerror', error => errors.push(error.message)));
    initialPage.on('pageerror', error => errors.push(error.message));
    let page = initialPage;
    await page.clock.install({ time: createdAt });
    await page.clock.pauseAt(createdAt);
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name: 'Offline rewards' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state),
      { timeout: 60_000 }).toBe('activated');
    await navTo(page, 'mercs');
    await page.getByTestId(`hire-merc-${mercId}`)
      .getByRole('button', { name: english ? 'Hire' : '招募', exact: true }).click();
    await expect(page.getByTestId(`merc-field-${mercId}`)).toHaveText(english ? 'Unfield' : '撤下');
    await navTo(page, 'skills');
    await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
    await page.getByTestId(`skill-node-${fireBolt}`).click();
    await page.getByTestId('skill-detail-panel')
      .getByRole('button', { name: english ? 'Allocate' : '分配', exact: true }).click();
    await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
    for (let slot = 1; slot <= 9; slot += 1) {
      await page.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} ${String(slot)}`, exact: true })
        .selectOption(slot === 1 ? 'sorceress.fire_bolt' : '', { timeout: 1000 });
    }
    await navTo(page, 'settings');
    const before = await saveBackup(page, english);
    expect(before.timestamp).toBe(createdAt);
    expect(before.player.experience).toBe(0);
    expect(before.meta.idleState.activeMultiplier).toBe(1);
    expect(before.meta.idleState.multiplierSecondsRemaining).toBe(0);
    await expectProduction(page);

    // There is no live application page while the eight-hour gap is introduced.
    await page.close();
    page = await context.newPage();
    await page.clock.setSystemTime(returnedAt);
    await context.setOffline(true);
    const response = await page.goto('/');
    expect(response?.ok()).toBe(true);
    expect(response?.fromServiceWorker()).toBe(true);
    await expect(page.getByTestId('offline-bonus-banner')).toContainText(english ? '+50% XP / Magic Find' : '离线加成 +50% 经验／魔法寻获');
    // A whole-save oracle rules out direct offline XP, loot, currency or quest awards.
    const returned = atTime(before, returnedAt);
    expect(await readStoredSave(page)).toEqual(returned);
    await expectProduction(page);
    await page.getByTestId('home-continue').click();
    await navTo(page, 'settings');
    expect(await exportBackup(page)).toEqual(returned);
    await expect(page.getByTestId('offline-art-help')).toBeVisible();

    // Deliver a delayed online checkpoint without spending wall-clock minutes.
    await page.clock.fastForward(1_800_000);
    expect(await saveBackup(page, english)).toEqual(atTime(before, combatAt));
    await expect(page.getByRole('status')).toHaveText(english ? 'Save exported' : '已导出存档');
    // A passive notification must not intercept the ordinary navigation tap.
    const mapLink = page.locator('a[href="/map"]').first();
    expect(await mapLink.evaluate(link => {
      const rect = link.getBoundingClientRect();
      return link.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    })).toBe(true);
    await navTo(page, 'map');
    await page.getByTestId('sub-area-row-a1-blood-moor')
      .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
    await expect(page.getByTestId('combat-screen')).toBeVisible();
    expect(await waveNumber(page)).toBe(1);
    const enemies = await countEnemies(page);
    await page.getByTestId('skip-button').click();
    await expect(page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]:not([data-dead="true"])')).toHaveCount(0);
    await expect(page.getByTestId('allies-grid').locator('[data-kind="hero"]')).not.toHaveAttribute('data-dead', 'true');
    await page.clock.runFor(1500);
    expect(await waveNumber(page)).toBe(2);
    await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
    await expect(page.getByTestId('map-screen')).toBeVisible();
    await navTo(page, 'settings');
    const earned = await saveBackup(page, english);
    const xp = 27 * enemies;
    // floor(20 * 1.374895833...) = 27, independently for every killed enemy.
    expect(earned.player.level).toBe(2);
    expect(100 + earned.player.experience).toBe(xp);
    expect(xp).toBeGreaterThan(20 * enemies);
    expect(xp).toBeLessThan(30 * enemies);
    expect(xp).toBeLessThan(Math.floor(20 * enemies * (1 + 0.5 * 5398.5 / 7200)));
    const merc = earned.mercs.ownedMercs.find(candidate => candidate.id === mercId);
    const progress = earned.mercs.mercProgress[mercId];
    if (!merc || !progress) throw new Error('Missing earned mercenary state');
    expect([3, 4]).toContain(merc.level);
    expect((merc.level === 4 ? 304 : 0) + progress.experience).toBe(Math.floor(xp * 0.75));
    expect(earned.timestamp).toBe(awardedAt);
    expect(earned.meta.idleState).toEqual(atTime(before, awardedAt).meta.idleState);
    await testInfo.attach('earned-save', { body: JSON.stringify(earned), contentType: 'application/json' });
    await testInfo.attach('reward-oracle', { body: JSON.stringify({ enemies, xp, mercXP: Math.floor(xp * 0.75),
      createdAt, returnedAt, combatAt, awardedAt }), contentType: 'application/json' });

    // Reopen at the same instant: neither XP nor the bonus window can refresh.
    await page.close();
    page = await context.newPage();
    const reopened = await page.goto('/');
    expect(reopened?.fromServiceWorker()).toBe(true);
    await page.getByTestId('home-continue').click();
    await navTo(page, 'settings');
    await expectProduction(page);
    expect(await readStoredSave(page)).toEqual(earned);
    expect(await exportBackup(page)).toEqual(earned);
    await expect(page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(errors).toEqual([]);
  });
}

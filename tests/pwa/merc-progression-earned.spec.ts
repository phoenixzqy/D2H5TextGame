/** Ordinary authored hire, earned combat XP and complete production save/reopen. */
import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const mercId = 'mercs/act1-rogue-inner-sight';
const fixedTime = new Date('2026-10-20T12:00:00.000Z');

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

/** Compact grid cards show one representative plus a +N badge per stack. */
async function displayedMonsterCount(cards: Locator): Promise<number> {
  let count = 0;
  for (const card of await cards.all()) {
    const badge = card.locator(':scope > div:first-of-type > div').filter({ hasText: /^\+\d+$/ });
    expect(await badge.count()).toBeLessThanOrEqual(1);
    count += 1 + (await badge.count() ? Number((await badge.innerText()).slice(1)) : 0);
  }
  return count;
}

async function expectMercCard(page: Page, english: boolean, level: number, xp: number): Promise<void> {
  await navTo(page, 'mercs');
  const card = page.getByTestId(`merc-card-${mercId}`);
  await expect(card).toBeVisible();
  await expect(card.getByText(new RegExp(` · ${english ? 'Level' : '等级'} ${String(level)}$`))).toBeVisible();
  await expect(card.getByTestId(`merc-xp-${mercId}`)).toContainText(`${String(xp)} / ${level === 3 ? '304' : '527'}`);
  await expect(card.getByTestId(`merc-field-${mercId}`)).toHaveText(english ? 'Unfield' : '撤下');
  for (const [label, value] of [['STR', level === 3 ? 12 : 13], ['DEX', level === 3 ? 22 : 25], ['VIT', 16]] as const) {
    await expect(card.getByText(label, { exact: true }).locator('..')).toHaveText(`${label}${String(value)}`);
  }
  await expectProduction(page);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`ordinary mercenary earns L3 to L4 and survives save reopen ${locale}`, async ({ page, context }) => {
    const english = locale === 'en';
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    // Date only: native playback/auto-advance timers continue normally.
    await page.clock.setFixedTime(fixedTime);
    await page.goto('/');
    await createCharacter(page, { class: 'druid', name: 'Earned merc' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state),
      { timeout: 60_000 }).toBe('activated');
    const beforeHire = await exportBackup(page);
    expect(beforeHire.player.level).toBe(1);
    expect(beforeHire.player.experience).toBe(0);
    expect(beforeHire.mercs.ownedMercs).toEqual([]);
    await navTo(page, 'mercs');
    const hire = page.getByTestId(`hire-merc-${mercId}`);
    await hire.getByRole('button', { name: english ? 'Hire' : '招募', exact: true }).click();
    await expect(hire.getByRole('button')).toBeDisabled();
    const field = page.getByTestId(`merc-field-${mercId}`);
    await field.click();
    await expect(field).toHaveText(english ? 'Set as Fielded' : '设为上场');
    await field.click();
    await expectMercCard(page, english, 3, 0);
    await navTo(page, 'settings');
    const baseline = await exportBackup(page);
    expect(baseline.inventory.currencies).toEqual(beforeHire.inventory.currencies);
    expect(baseline.mercs.ownedMercs).toHaveLength(1);
    expect(baseline.mercs.fieldedMercId).toBe(mercId);
    expect(baseline.mercs.mercEquipment).toEqual({ [mercId]: {} });
    expect(baseline.mercs.mercProgress).toEqual({ [mercId]: { experience: 0, experienceToNextLevel: 304 } });
    const initial = baseline.mercs.ownedMercs[0];
    if (!initial) throw new Error('No ordinarily hired mercenary');
    expect(initial.id).toBe(mercId);
    expect(initial.level).toBe(3);
    expect(initial.coreStats).toEqual({ strength: 12, dexterity: 22, vitality: 16, energy: 14 });
    expect(initial.derivedStats.life).toBe(148);
    expect(initial.derivedStats.lifeMax).toBe(148);
    let previousHeroTotal = 0;

    for (const step of [
      { monsters: 8, heroAward: 160, heroXP: 60, level: 3, xp: 120 },
      { monsters: 9, heroAward: 180, heroXP: 240, level: 3, xp: 255 },
      { monsters: 10, heroAward: 200, heroXP: 440, level: 4, xp: 101 }
    ]) {
      await navTo(page, 'map');
      await page.getByTestId('sub-area-row-a1-blood-moor')
        .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
      await expect(page.getByTestId('combat-screen')).toBeVisible();
      expect(await currentWave(page)).toBe(1);
      const enemies = page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]');
      expect(await displayedMonsterCount(enemies)).toBe(step.monsters);
      const hero = page.getByTestId('allies-grid').locator('[data-kind="hero"]');
      await expect(hero).toHaveCount(1);
      await expect(page.getByTestId('allies-grid').locator('[data-kind="merc"]')).toHaveCount(1);
      await page.getByTestId('skip-button').click();
      await expect(page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]:not([data-dead="true"])')).toHaveCount(0);
      await expect(hero).not.toHaveAttribute('data-dead', 'true');
      await expect.poll(() => currentWave(page), { timeout: 5000, intervals: [50] }).toBe(2);
      // A missed window fails instead of accepting an extra awarded wave.
      await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click({ timeout: 500 });
      await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true })).toHaveAttribute('aria-pressed', 'true');
      expect(await currentWave(page)).toBe(2);
      await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
      await expect(page.getByTestId('map-screen')).toBeVisible();
      await expectMercCard(page, english, step.level, step.xp);
      await navTo(page, 'settings');
      const earned = await exportBackup(page);
      expect(earned.player.level).toBe(2);
      expect(earned.player.experience).toBe(step.heroXP);
      expect(earned.player.experienceToNextLevel).toBe(565);
      const heroTotal = 100 + earned.player.experience;
      expect(heroTotal - previousHeroTotal).toBe(step.heroAward);
      previousHeroTotal = heroTotal;
      const leveled = step.level === 4;
      const expected = { ...initial, level: step.level,
        coreStats: leveled ? { strength: 13, dexterity: 25, vitality: 16, energy: 15 } : initial.coreStats,
        derivedStats: { ...initial.derivedStats, life: leveled ? 156 : 148, lifeMax: leveled ? 156 : 148 } };
      expect(earned.mercs).toEqual({ ...baseline.mercs, ownedMercs: [expected], mercProgress: {
        [mercId]: { experience: step.xp, experienceToNextLevel: leveled ? 527 : 304 }
      } });
    }

    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    // Known merc/progression assertions above; whole actual payload is persistence baseline only.
    const saved = await exportBackup(page);
    expect(await readStoredSave(page)).toEqual(saved);
    await page.close();
    const reopened = await context.newPage();
    reopened.on('pageerror', error => errors.push(error.message));
    await reopened.goto('/');
    await expect(reopened.getByTestId('home-continue')).toBeVisible();
    await reopened.getByTestId('home-continue').click();
    await expect(reopened.getByTestId('town-screen')).toBeVisible();
    await navTo(reopened, 'settings');
    await expect(reopened.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(await readStoredSave(reopened)).toEqual(saved);
    expect(await exportBackup(reopened)).toEqual(saved);
    await expectMercCard(reopened, english, 4, 101);
    expect(errors).toEqual([]);
  });
}

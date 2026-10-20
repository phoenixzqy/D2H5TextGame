/** Earned passive ranks, frozen recordings, real recovery, and production persistence. */
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const fixedTime = new Date('2026-10-20T12:00:00.055Z');
const characterName = 'Earned Warmth';
const fire = 'skills-sorceress-fire-bolt';
const warmth = 'skills-sorceress-warmth';
const mercId = 'mercs/act1-rogue-inner-sight';

interface DOMSample {
  readonly mp: string | null;
  readonly log: string[];
}

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
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function currentWave(page: Page): Promise<number> {
  const text = await page.getByTestId('wave-counter').innerText();
  const number = /^\D*(\d+)/.exec(text)?.[1];
  if (!number) throw new Error(`Missing wave counter: ${text}`);
  return Number(number);
}

async function pause(page: Page, english: boolean): Promise<void> {
  await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click({ timeout: 500 });
  await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }))
    .toHaveAttribute('aria-pressed', 'true');
}

async function combatDOM(page: Page) {
  return page.getByTestId('combat-screen').evaluate(screen => ({
    wave: screen.querySelector('[data-testid="wave-counter"]')?.textContent,
    mp: screen.querySelector('[role="group"] [role="progressbar"][aria-label]')?.outerHTML,
    bars: [...screen.querySelectorAll('[role="progressbar"]')].map(bar => bar.outerHTML),
    log: [...screen.querySelectorAll('[data-testid="combat-log"] > div')].map(line => line.textContent),
    cards: [...screen.querySelectorAll('[data-testid^="unit-card-"]')].map(card => card.outerHTML)
  }));
}

async function allocate(page: Page, id: string, english: boolean): Promise<void> {
  await navTo(page, 'skills');
  await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
  await page.getByTestId(`skill-node-${id}`).click();
  await page.getByTestId('skill-detail-panel')
    .getByRole('button', { name: english ? 'Allocate' : '分配', exact: true }).click();
}

async function expectWarmth(page: Page, rank: 1 | 2, english: boolean): Promise<void> {
  const panel = page.getByTestId('skill-detail-panel');
  await expect(panel.getByText(english ? `Lv. ${String(rank)}/20 · Passive` : `等级 ${String(rank)}/20 · 被动`, { exact: true }))
    .toBeVisible();
  const current = panel.locator('section').filter({
    has: page.getByRole('heading', { name: english ? 'Current' : '当前', exact: true })
  });
  await expect(current.getByText(english ? 'Fire Damage' : '火焰伤害', { exact: true }).locator('..').getByRole('definition'))
    .toHaveText(rank === 1 ? '1%' : '2%');
  await expect(current.getByText(english ? 'Mana Regeneration' : '法力恢复', { exact: true }).locator('..').getByRole('definition'))
    .toHaveText(rank === 1 ? '4%' : '8%');
  await expect(panel.getByRole('button', { name: english ? 'No Points' : '无技能点', exact: true })).toBeDisabled();
  await expectProduction(page);
}

/** The observer owns only test data; it reads rendered DOM and never accesses game state. */
async function opening(page: Page, english: boolean, casts: number): Promise<DOMSample[]> {
  const capture = await page.getByTestId('combat-screen').evaluateHandle((screen, mpLabel) => {
    const samples: DOMSample[] = [];
    const sample = () => {
      const next = {
        mp: screen.querySelector(`[role="group"][aria-label="${mpLabel}"] [role="progressbar"]`)
          ?.getAttribute('aria-valuenow') ?? null,
        log: [...screen.querySelectorAll('[data-testid="combat-log"] > div > span:last-child')]
          .map(line => line.textContent)
      };
      if (JSON.stringify(samples.at(-1)) !== JSON.stringify(next)) samples.push(next);
    };
    sample();
    const observer = new MutationObserver(sample);
    observer.observe(screen, { subtree: true, childList: true, attributes: true, characterData: true });
    return { observer, samples };
  }, english ? 'MP' : '法力');
  // Canonical fallback is an observed identity; BUG033 still tracks cast-name localization.
  const cast = english ? `${characterName} casts sorceress.fire_bolt.` : `${characterName} 施放了 sorceress.fire_bolt。`;
  try {
    await page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }).click();
    await expect.poll(async () => (await page.getByTestId('combat-log')
      .locator(':scope > div > span:last-child').allTextContents()).filter(line => line === cast).length,
    { timeout: 45_000, intervals: [20] }).toBeGreaterThanOrEqual(casts);
    await pause(page, english);
    await expectProduction(page);
    return await capture.evaluate(({ observer, samples }) => { observer.disconnect(); return samples; });
  } finally {
    await capture.evaluate(({ observer }) => { observer.disconnect(); });
    await capture.dispose();
  }
}

function expectBoundary(
  samples: DOMSample[], cast: string, casts: number, tail: string[], mp: string,
  enemy: string, actions: number, english: boolean, cap: string, spent: string
): void {
  const heroCasts = (sample: DOMSample) => sample.log.filter(line => line === cast).length;
  const capIndex = samples.reduce((last, sample, index) =>
    sample.mp === cap && heroCasts(sample) === casts - 1 ? index : last, -1);
  const spendIndex = samples.findIndex((sample, index) => index > capIndex &&
    sample.mp === spent && heroCasts(sample) === casts);
  const boundaryIndex = samples.findIndex((sample, index) => index > spendIndex && sample.mp === mp &&
    heroCasts(sample) === casts && JSON.stringify(sample.log.slice(-tail.length)) === JSON.stringify(tail) &&
    sample.log.filter(line => line.startsWith(`${enemy}${english ? ' casts ' : ' 施放了 '}`) ||
      line === `${enemy}${english ? ' readies an attack.' : ' 准备出招。'}`).length === actions);
  expect(capIndex, 'cap before the decisive cast').toBeGreaterThanOrEqual(0);
  expect(spendIndex, 'eight MP spent before the recovery boundary').toBeGreaterThan(capIndex);
  expect(boundaryIndex, `MP ${mp} at ${tail.join(' / ')} after ${String(casts)} casts`).toBeGreaterThan(spendIndex);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`ordinary Warmth earns rank 2, freezes waves, and survives save reopen ${locale}`, async ({ page, context }, testInfo) => {
    test.setTimeout(180_000);
    const english = locale === 'en';
    const errors: string[] = [];
    const watch = (target: Page) => {
      target.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
      target.on('console', message => {
        if (['warning', 'error'].includes(message.type())) errors.push(`${message.type()}: ${message.text()}`);
      });
    };
    watch(page);
    // Fixed Date only; native combat, animation and wave-advance timers run normally.
    await page.clock.setFixedTime(fixedTime);
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name: characterName });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state),
      { timeout: 60_000 }).toBe('activated');
    const fresh = await exportBackup(page);
    expect(fresh.player.level).toBe(1);
    expect(fresh.player.skillPoints).toBe(1);
    expect(fresh.player.skillLevels).toEqual({ 'sorceress.frost_nova': 1, 'sorceress.ice_bolt': 1 });
    expect(fresh.mercs.ownedMercs).toEqual([]);
    await navTo(page, 'mercs');
    await page.getByTestId(`hire-merc-${mercId}`)
      .getByRole('button', { name: english ? 'Hire' : '招募', exact: true }).click();
    await expect(page.getByTestId(`merc-field-${mercId}`)).toHaveText(english ? 'Unfield' : '撤下');
    await allocate(page, fire, english);
    await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
    for (let slot = 1; slot <= 9; slot += 1) {
      await page.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} ${String(slot)}`, exact: true })
        .selectOption(slot === 1 ? fire : '');
    }
    const cast = english ? `${characterName} casts sorceress.fire_bolt.` : `${characterName} 施放了 sorceress.fire_bolt。`;
    const timelines: Record<string, DOMSample[]> = {};
    for (let ordinal = 0; ordinal < 5; ordinal += 1) {
      await navTo(page, 'map');
      await page.getByTestId('sub-area-row-a1-blood-moor')
        .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
      await expect(page.getByTestId('combat-screen')).toBeVisible();
      expect(await currentWave(page)).toBe(1);
      await pause(page, english);
      if (ordinal === 1 || ordinal === 4) {
        const before = await combatDOM(page);
        await allocate(page, warmth, english);
        await expectWarmth(page, ordinal === 1 ? 1 : 2, english);
        await navTo(page, 'combat');
        expect(await combatDOM(page)).toEqual(before);
        const samples = await opening(page, english, ordinal === 1 ? 8 : 5);
        timelines[`ordinal${String(ordinal)}-old-wave1`] = samples;
        if (ordinal === 1) {
          // 10780ms, rank0: 98 + floor(7*.280) = 99; rank1 would be100.
          expectBoundary(samples, cast, 7, english ? [
            'Quill Rat B casts monster.weak_melee.',
            'Quill Rat B attacks Rogue Scout — Inner Sight for 1 physical damage.'
          ] : ['尖刺鼠 B 施放了 monster.weak_melee。', '尖刺鼠 B 普攻 罗格侦察兵 — 内视，造成 1 点物理伤害。'],
          '99', english ? 'Quill Rat B' : '尖刺鼠 B', 7, english, '106', '98');
        } else {
          // Base43 critical against12 defense: rank1=74; rank2 would be75.
          expect(samples.some(sample => sample.log.includes(english
            ? `CRITICAL! ${characterName} hits Fallen A for 74 fire damage!`
            : `暴击！${characterName} 对 堕落者 A 造成 74 点火焰伤害！`))).toBe(true);
          expectBoundary(samples, cast, 4, english ? [
            'Fallen I casts monster.weak_melee.', "Rogue Scout — Inner Sight dodges Fallen I's attack!"
          ] : ['堕落者 I 施放了 monster.weak_melee。', '罗格侦察兵 — 内视 闪避了 堕落者 I 的攻击！'],
          '108', english ? 'Fallen I' : '堕落者 I', 4, english, '110', '102');
        }
      }
      await page.getByTestId('skip-button').click();
      await expect(page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]:not([data-dead="true"])')).toHaveCount(0);
      await expect(page.getByTestId('allies-grid').locator('[data-kind="hero"]')).not.toHaveAttribute('data-dead', 'true');
      await expect.poll(() => currentWave(page), { timeout: 6000, intervals: [30] }).toBe(2);
      await pause(page, english);
      expect(await currentWave(page)).toBe(2);
      if (ordinal === 1 || ordinal === 4) {
        const samples = await opening(page, english, ordinal === 1 ? 8 : 4);
        timelines[`ordinal${String(ordinal)}-new-wave2`] = samples;
        if (ordinal === 1) {
          // 10920ms: rank1=101, rank0 would be100, with no intervening orb.
          expectBoundary(samples, cast, 7, english ? [
            'Fallen Shaman B readies an attack.',
            'Fallen Shaman B attacks Rogue Scout — Inner Sight for 37 physical damage.'
          ] : ['堕落者萨满 B 准备出招。', '堕落者萨满 B 普攻 罗格侦察兵 — 内视，造成 37 点物理伤害。'],
          '101', english ? 'Fallen Shaman B' : '堕落者萨满 B', 6, english, '106', '98');
        } else {
          // 5460ms: rank2=109, rank1 would be108. Opening damage14 cannot distinguish ranks.
          expectBoundary(samples, cast, 3, english ? [
            'Fallen Shaman C casts monster.fire_bolt.', `${characterName} dodges Fallen Shaman C's attack!`
          ] : ['堕落者萨满 C 施放了 monster.fire_bolt。', `${characterName} 闪避了 堕落者萨满 C 的攻击！`],
          '109', english ? 'Fallen Shaman C' : '堕落者萨满 C', 3, english, '110', '102');
        }
      }
      await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
      await expect(page.getByTestId('map-screen')).toBeVisible();
    }
    await testInfo.attach('earned-warmth-dom-timelines', { body: JSON.stringify(timelines, null, 2), contentType: 'application/json' });
    await navTo(page, 'settings');
    const earned = await exportBackup(page);
    expect(earned.player).toEqual({ ...fresh.player,
      level: 3, experience: 335, experienceToNextLevel: 1558, statPoints: 10, skillPoints: 0,
      comboOrder: [fire], skillLevels: { ...fresh.player.skillLevels, 'sorceress.fire_bolt': 1, 'sorceress.warmth': 2 },
      derivedStats: { ...fresh.player.derivedStats, lifeMax: 136, manaMax: 110, attack: 26, defense: 26 }
    });
    expect(160 + 180 + 200 + 220 + 240).toBe(100 + 565 + earned.player.experience);
    expect(earned.mercs.fieldedMercId).toBe(mercId);
    expect(earned.mercs.ownedMercs).toHaveLength(1);
    expect(earned.mercs.ownedMercs[0]?.level).toBe(4);
    expect(earned.mercs.mercProgress).toEqual({ [mercId]: { experience: 446, experienceToNextLevel: 527 } });
    expect(JSON.stringify(earned)).not.toMatch(/manaRegen|increasedDamagePct|exactTotal|wholeGranted/);
    // Loot is an observed persistence baseline; the test does not claim a loot oracle.
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    expect(await exportBackup(page)).toEqual(earned);
    expect(await readStoredSave(page)).toEqual(earned);
    await page.close();
    const reopened = await context.newPage();
    watch(reopened);
    await reopened.clock.setFixedTime(fixedTime);
    await reopened.goto('/');
    await reopened.getByTestId('home-continue').click();
    await expect(reopened.getByTestId('town-screen')).toBeVisible();
    await navTo(reopened, 'settings');
    await expect(reopened.getByRole('button', { name: english ? 'English' : '简体中文', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await readStoredSave(reopened)).toEqual(earned);
    expect(await exportBackup(reopened)).toEqual(earned);
    await navTo(reopened, 'skills');
    await reopened.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
    await reopened.getByTestId(`skill-node-${warmth}`).click();
    await expectWarmth(reopened, 2, english);
    await reopened.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
    for (let slot = 1; slot <= 9; slot += 1) {
      await expect(reopened.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} ${String(slot)}`, exact: true }))
        .toHaveValue(slot === 1 ? fire : '');
    }
    // A supplementary fresh battle after reopen proves rank2 fire as well as recovery.
    // Ordinary unfielding removes the merc's RNG draws; no character/save state is injected.
    await navTo(reopened, 'mercs');
    await reopened.getByTestId(`merc-field-${mercId}`).click();
    await navTo(reopened, 'map');
    await reopened.getByTestId('sub-area-row-a1-blood-moor')
      .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
    await pause(reopened, english);
    const afterReopen = await opening(reopened, english, 2);
    expect(afterReopen.some(sample => sample.log.includes(english
      ? `CRITICAL! ${characterName} hits Fallen A for 75 fire damage!`
      : `暴击！${characterName} 对 堕落者 A 造成 75 点火焰伤害！`))).toBe(true);
    // Cap110 -> cast102 at1500ms -> floor(7.5600000000000005*.240)=1MP at1740ms.
    // This proves resumed recovery exists; the earlier fresh-wave109 distinguishes its bonus rate.
    expectBoundary(afterReopen, cast, 1, [english
      ? 'Fallen B casts monster.weak_melee.' : '堕落者 B 施放了 monster.weak_melee。'],
    '103', english ? 'Fallen B' : '堕落者 B', 1, english, '110', '102');
    await testInfo.attach('reopened-rank2-dom-timeline', { body: JSON.stringify(afterReopen, null, 2), contentType: 'application/json' });
    await reopened.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
    await expect(reopened.getByTestId('map-screen')).toBeVisible();
    await expectProduction(reopened);
    expect(errors).toEqual([]);
  });
}

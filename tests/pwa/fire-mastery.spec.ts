/** Imported L30 integration; ordinary production UI, disk saves and native playback. */
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const MASTERY = 'skills-sorceress-fire-mastery';
const BOLT = 'skills-sorceress-fire-bolt';
const NAME = 'Fire Mastery';
const fixedTime = new Date('2026-10-20T12:00:00.000Z');
// Frozen native capture eed1e9d…; same Date-derived seed2330410254/ordinal0.
const opening = {
  en: [
    { cast: 'Fire Mastery casts Fire Bolt.', hit: 'Fire Mastery attacks Fallen A for 22 fire damage.', hp: 53.1915 },
    { cast: 'Fire Mastery casts Fire Bolt.', hit: 'Fire Mastery attacks Fallen A for 23 fire damage.', hp: 51.0638 }
  ],
  'zh-CN': [
    { cast: 'Fire Mastery 施放了 火弹。', hit: 'Fire Mastery 普攻 堕落者 A，造成 22 点火焰伤害。', hp: 53.1915 },
    { cast: 'Fire Mastery 施放了 火弹。', hit: 'Fire Mastery 普攻 堕落者 A，造成 23 点火焰伤害。', hp: 51.0638 }
  ]
} as const;
interface Frame { mp: number; logs: string[]; targetHP: number }
async function attach(info: TestInfo, name: string, value: unknown): Promise<void> {
  await info.attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });
}
async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}
async function production(page: Page): Promise<void> {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
function durable(save: SaveCurrent): void {
  expect(JSON.stringify(save)).not.toMatch(/"increasedDamagePct"|"manaRegenPerSecond"|"manaRegenCarry"|"manaRegenExactCarry"|"manaRegenCompensation"|"activeBuffIds"|"frozenArmor"|"carryPlayerTeam"/);
}
async function slots(page: Page, english: boolean): Promise<void> {
  await navTo(page, 'skills');
  await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
  for (let index = 1; index <= 9; index++) {
    const slot = page.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} ${String(index)}`, exact: true });
    await expect(slot).toHaveValue(index === 1 ? BOLT : '');
    await expect(slot.locator(`option[value="${MASTERY}"]`)).toHaveCount(0);
    await expect(slot.locator('option')).toHaveCount(2); // Empty and the only learned active, Fire Bolt.
  }
}
async function selectMastery(page: Page): Promise<void> {
  await navTo(page, 'skills');
  await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
  await page.getByTestId(`skill-node-${MASTERY}`).click();
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`automatic Fire Mastery allocation and cold reload ${locale}`, async ({ page: initial, context }, info) => {
    const english = locale === 'en';
    const errors: string[] = [];
    const watch = (page: Page): void => {
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`);
      });
    };
    let page = initial;
    watch(page);
    await page.clock.setFixedTime(fixedTime); // Date only; ordinary playback and save timers.
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name: NAME });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const fresh = await backup(page);
    expect(fresh.player).toMatchObject({ level: 1, skillPoints: 1, class: 'sorceress',
      coreStats: { strength: 10, dexterity: 25, vitality: 10, energy: 35 },
      derivedStats: { life: 120, lifeMax: 120, mana: 102, manaMax: 102 } });
    await selectMastery(page);
    const detail = page.getByTestId('skill-detail-panel');
    await expect(detail.getByRole('heading', { name: english ? 'Fire Mastery' : '火焰精通', exact: true })).toBeVisible();
    await expect(detail).toContainText(english ? 'Unlearned / 20' : '未学习 / 20');
    await expect(detail).toContainText(english ? 'Passive' : '被动');
    await expect(detail.getByRole('button', { name: english ? 'Requires Lv. 30' : '需要等级 30', exact: true })).toBeDisabled();
    const locked = await backup(page);
    expect(locked.player.skillLevels).toEqual(fresh.player.skillLevels);
    expect(locked.player.skillPoints).toBe(1);
    await attach(info, '01-fresh-locked-control', locked);

    // Explicit imported eligibility only: preserve all fresh core/equipment/resource values.
    const incoming: SaveCurrent = { ...fresh, player: { ...fresh.player, level: 30, skillPoints: 2,
      skillLevels: { 'sorceress.fire_bolt': 1 }, comboOrder: [BOLT] } };
    const importLabel = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(incoming));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const prepared = await backup(page);
    expect(prepared.player).toEqual(incoming.player);
    expect(prepared.inventory).toEqual(fresh.inventory);
    expect(prepared.mercs).toEqual(fresh.mercs);
    expect(prepared.map).toEqual(fresh.map);
    expect(prepared.formation).toEqual(fresh.formation);
    durable(prepared);
    await attach(info, '02-normalized-import', prepared);

    try {
      for (const [index, oracle] of opening[locale].entries()) {
        const rank = index + 1;
        await selectMastery(page);
        await page.getByTestId('skill-detail-panel').getByRole('button', { name: english ? 'Allocate' : '分配', exact: true }).click();
        const current = page.getByTestId('skill-detail-panel').locator('section')
          .filter({ has: page.getByRole('heading', { name: english ? 'Current' : '当前', exact: true }) });
        await expect(current.getByText(index === 0 ? '4%' : '8%', { exact: true })).toBeVisible();
        await expect(page.getByTestId('skill-detail-panel')).toContainText(english ? `Lv. ${String(rank)}/20` : `等级 ${String(rank)}/20`);
        if (rank === 2) await expect(page.getByTestId('skill-detail-panel').getByRole('button', { name: english ? 'No Points' : '无技能点', exact: true })).toBeDisabled();
        await production(page);
        await info.attach(`03-rank${String(rank)}-detail`, { body: await page.getByTestId('skill-detail-panel').screenshot(), contentType: 'image/png' });
        await slots(page, english);
        const saved = await backup(page);
        expect(saved.player.skillLevels).toEqual({ 'sorceress.fire_bolt': 1, 'sorceress.fire_mastery': rank });
        expect(saved.player.skillPoints).toBe(2 - rank);
        expect(saved.player.comboOrder).toEqual([BOLT]);
        expect(saved.player.derivedStats).toEqual(fresh.player.derivedStats);
        durable(saved);
        await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
        await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
        await page.close();
        page = await context.newPage();
        watch(page);
        await page.clock.setFixedTime(fixedTime);
        await page.goto('/');
        await page.getByTestId('home-continue').click();
        await expect(page.getByTestId('town-screen')).toBeVisible();
        const loaded = await backup(page);
        expect(loaded.player).toEqual(saved.player);
        expect(loaded.inventory).toEqual(saved.inventory);
        expect(loaded.mercs).toEqual(saved.mercs);
        expect(loaded.map).toEqual(saved.map);
        expect(loaded.formation).toEqual(saved.formation);
        expect(loaded.meta.settings).toEqual(saved.meta.settings);
        durable(loaded);
        await attach(info, `04-rank${String(rank)}-disk-reload`, { saved, loaded });

        const observer = await page.evaluateHandle(({ mpLabel, target }) => {
          const frames: Frame[] = []; let previous = ''; let overflow = false;
          const sample = (): void => {
            const root = document.querySelector('[data-testid="combat-screen"]');
            if (!root) return;
            const card = Array.from(root.querySelectorAll<HTMLElement>('[data-testid="enemies-grid"] [data-testid^="unit-card-"]'))
              .find(node => node.querySelector('[title]')?.getAttribute('title') === target);
            const frame: Frame = {
              mp: Number(root.querySelector(`[role="group"][aria-label="${mpLabel}"] [role="progressbar"]`)?.getAttribute('aria-valuenow')),
              logs: Array.from(root.querySelectorAll('[data-testid="combat-log"] > div > span:last-child'), node => node.textContent ?? '').slice(-8),
              targetHP: Number.parseFloat(card?.querySelector<HTMLElement>('.bg-red-600')?.style.width ?? 'NaN')
            };
            const next = JSON.stringify(frame);
            if (next === previous) return;
            previous = next;
            if (frames.length === 256) { overflow = true; return; }
            frames.push(frame);
          };
          const changes = new MutationObserver(sample);
          changes.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
          return { read: () => ({ frames, overflow }), disconnect: () => changes.disconnect() };
        }, { mpLabel: english ? 'MP' : '法力', target: english ? 'Fallen A' : '堕落者 A' });
        try {
          await navTo(page, 'map');
          await page.getByTestId('sub-area-row-a1-blood-moor').getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
          await expect(page.getByTestId('combat-log').getByText(oracle.hit, { exact: true })).toBeAttached();
          await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
          const observed = await observer.evaluate(handle => handle.read());
          expect(observed.overflow).toBe(false);
          const before = observed.frames.findIndex(frame => frame.mp === 102 && !frame.logs.includes(oracle.cast));
          const recovery = observed.frames.findIndex((frame, at) => at > before && frame.mp === 112 && !frame.logs.includes(oracle.cast));
          const debit = observed.frames.findIndex((frame, at) => at > recovery && frame.mp === 104 && frame.logs.includes(oracle.cast));
          expect(before).toBeGreaterThanOrEqual(0);
          expect(recovery).toBeGreaterThan(before);
          expect(debit).toBeGreaterThan(recovery); // Native7MP/s recovery precedes the sole8MP cast debit.
          const hit = observed.frames.find(frame => frame.logs.includes(oracle.hit) && frame.mp === 104);
          expect(hit).toBeDefined();
          expect(hit?.targetHP).toBeCloseTo(oracle.hp, 2);
          const logs = await page.getByTestId('combat-log').innerText();
          expect(logs).not.toMatch(english ? /casts Fire Mastery\.|gains buff: fire-mastery/ : /施放了 火焰精通|获得增益：fire-mastery/);
          expect(logs).not.toContain(english ? 'for 21 fire damage.' : '造成 21 点火焰伤害。');
          if (rank === 2) expect(logs).not.toContain(opening[locale][0].hit);
          await production(page);
          await attach(info, `05-rank${String(rank)}-opening`, observed);
        } finally {
          await observer.evaluate(handle => handle.disconnect());
          await observer.dispose();
        }
        await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
        await expect(page.getByTestId('map-screen')).toBeVisible();
      }
      await production(page);
      await attach(info, '06-browser-errors', errors);
      expect(errors).toEqual([]);
    } finally { await page.close(); }
  });
}

/** Imported-fixture production UI proof; no earned progression or internal snapshot claim. */
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const AREA = 'areas/act1-blood-moor';
const AUTHORED = 'skills-sorceress-frozen-armor';
const NAME = 'Paid Armor';
const CAP = 'fixture-paid-armor-cap';
const fixedTime = new Date('2026-10-21T02:00:00.000Z');
interface Frame { mp: number; logs: string[]; enemies: { name: string; hp: number }[] }

async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}
async function attach(info: TestInfo, name: string, value: unknown): Promise<void> {
  await info.attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });
}
async function production(page: Page): Promise<void> {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
function noCombatSave(save: SaveCurrent): void {
  // Only ordinary durable character/configuration fields may cross reload.
  expect(JSON.stringify(save)).not.toMatch(/"frozenArmor"|"activeBuffIds"|"carryPlayerTeam"/);
}
async function slots(page: Page, armor: boolean, english: boolean): Promise<void> {
  await navTo(page, 'skills');
  await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
  for (let slot = 1; slot <= 9; slot++) {
    const select = page.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} ${String(slot)}`, exact: true });
    await select.selectOption(armor && slot === 1 ? AUTHORED : '');
  }
}
async function enter(page: Page, english: boolean, idle = false): Promise<void> {
  await navTo(page, 'map');
  if (idle) await page.getByTestId('farm-here-a1-blood-moor').click();
  else await page.getByTestId('sub-area-row-a1-blood-moor')
    .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
  await expect(page.getByTestId('combat-screen')).toBeVisible();
}
async function stop(page: Page, english: boolean, idle = false): Promise<void> {
  await page.getByRole('button', { name: idle ? (english ? 'Stop Farm' : '停止挂机') : (english ? 'Flee' : '逃跑'), exact: true }).click();
  await expect(page.getByTestId('map-screen')).toBeVisible();
}
async function wave(page: Page): Promise<number> {
  const value = /^\D*(\d+)/.exec(await page.getByTestId('wave-counter').innerText())?.[1];
  if (!value) throw new Error('Missing wave counter');
  return Number(value);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`paid Frozen Armor ordinary UI and reload ${locale}`, async ({ page }, info) => {
    const english = locale === 'en';
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`);
    });
    await page.clock.setFixedTime(fixedTime); // Date only; native playback and repeat timers.
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name: NAME });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const original = await backup(page);
    const oldCap: Item = { id: 'fixture-paid-armor-old-cap', baseId: 'items/base/helm-cap',
      rarity: 'rare', level: 1, identified: true, equipped: true, equipSlot: 'head',
      affixes: [{ affixId: 'fixture-imported-life', values: new Map([['statMods.life', 999_880]]) }] };
    const newCap: Item = { ...oldCap, id: CAP, equipped: false, affixes: [
      { affixId: 'fixture-imported-life-attack', values: new Map([
        ['statMods.life', 999_880], ['statMods.attack', 100_000]
      ]) }
    ] };
    // Two explicit synthetic caps permit actual equip without a temporary max-HP clamp.
    // Imported rank20 and cleared flag enable mechanic/idle routes, not earned acceptance.
    const incoming: SaveCurrent = { ...original, player: { ...original.player,
      comboOrder: [AUTHORED], skillLevels: { 'sorceress.frozen_armor': 20 },
      derivedStats: { ...original.player.derivedStats, life: 1_000_000, lifeMax: 1_000_000, defense: 27 } },
      inventory: { ...original.inventory, backpack: [newCap],
        equipped: { ...original.inventory.equipped, head: oldCap } },
      map: { ...original.map, clearedSubAreas: [AREA] } };
    const importLabel = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(incoming, (_key, value: unknown) => value instanceof Map ? [...value] : value));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await navTo(page, 'inventory');
    await page.getByTestId(`inv-item-${CAP}`).click();
    await page.getByTestId('inv-primary-action').click();
    const prepared = await backup(page);
    expect(prepared.inventory.equipped.head).toMatchObject({ id: CAP, equipped: true });
    expect(prepared.player.derivedStats).toMatchObject({ life: 1_000_000, lifeMax: 1_000_000, attack: 100_022, defense: 27 });
    expect(prepared.player.skillLevels).toEqual({ 'sorceress.frozen_armor': 20 });
    expect(prepared.player.comboOrder).toEqual([AUTHORED]);
    noCombatSave(prepared);
    await attach(info, '01-imported-equipped-fixture', prepared);

    const cast = english ? `${NAME} casts Frozen Armor.` : `${NAME} 施放了 寒冰甲。`;
    const buff = english ? `${NAME} gains buff: frozen-armor.` : `${NAME} 获得增益：frozen-armor。`;
    const observer = await page.evaluateHandle(mpLabel => {
      const frames: Frame[] = [];
      let previous = '';
      let overflow = false;
      const sample = (): void => {
        const root = document.querySelector('[data-testid="combat-screen"]');
        if (!root) return;
        const frame: Frame = {
          mp: Number(root.querySelector(`[role="group"][aria-label="${mpLabel}"] [role="progressbar"]`)?.getAttribute('aria-valuenow')),
          logs: Array.from(root.querySelectorAll('[data-testid="combat-log"] > div > span:last-child'), node => node.textContent ?? '').slice(-8),
          enemies: Array.from(root.querySelectorAll<HTMLElement>('[data-testid="enemies-grid"] [data-testid^="unit-card-"]'), node => ({
            name: node.querySelector('[title]')?.getAttribute('title') ?? '',
            hp: Number.parseFloat(node.querySelector<HTMLElement>('.bg-red-600')?.style.width ?? 'NaN')
          }))
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
    }, english ? 'MP' : '法力');
    try {
      await enter(page, english);
      await expect(page.getByTestId('combat-log').getByText(cast, { exact: true })).toBeAttached();
      await expect(page.getByTestId('combat-log').locator('div > span:last-child').filter({ hasText: /\[chill\]|【chill】/ }).first()).toBeAttached();
      await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
      const observed = await observer.evaluate(handle => handle.read());
      expect(observed.overflow).toBe(false);
      expect(observed.frames.some(frame => frame.logs.includes(cast) && frame.mp === prepared.player.derivedStats.manaMax - 5)).toBe(true);
      const witness = observed.frames.find(frame => frame.enemies.some(enemy => {
        const chilled = english ? `${enemy.name} is afflicted with [chill].` : `${enemy.name} 进入【chill】状态。`;
        const status = frame.logs.indexOf(chilled);
        if (!(enemy.hp > 0) || status < 0) return false;
        return frame.logs.slice(0, status).some(line => english
          ? new RegExp(`^(CRITICAL! )?${enemy.name} (attacks|hits) ${NAME} for [1-9][0-9]* `).test(line)
          : new RegExp(`^(暴击！)?${enemy.name} (普攻 ${NAME}，造成 |对 ${NAME} 造成 )[1-9][0-9]* `).test(line));
      }));
      expect(witness).toBeDefined();
      expect(observed.frames.some(frame => frame.logs.includes(buff))).toBe(true);
      await attach(info, '02-cast-debit-hit-chill', { observed, witness });
      await production(page);
      await info.attach('03-paid-armor-viewport', { body: await page.screenshot(), contentType: 'image/png' });
    } finally {
      await observer.evaluate(handle => handle.disconnect());
      await observer.dispose();
    }
    await stop(page, english);

    await slots(page, false, english);
    await enter(page, english);
    await page.getByTestId('skip-button').click();
    await expect(page.getByTestId('combat-log').getByText(cast, { exact: true })).toHaveCount(0);
    await expect(page.getByTestId('combat-log').getByText(buff, { exact: true })).toHaveCount(0);
    await stop(page, english);

    await slots(page, true, english);
    await enter(page, english, true);
    await expect(page.getByTestId('idle-loop-panel')).toBeVisible();
    await expect(page.getByTestId('combat-log').getByText(cast, { exact: true })).toBeAttached();
    const total = Number(/\/\D*(\d+)/.exec(await page.getByTestId('wave-counter').innerText())?.[1]);
    expect(total).toBeGreaterThan(1);
    expect(total).toBeLessThanOrEqual(10);
    for (let index = 1; index <= total; index++) {
      expect(await wave(page)).toBe(index);
      await page.getByTestId('skip-button').click();
      if (index < total) await expect.poll(() => wave(page), { intervals: [50] }).toBe(index + 1);
    }
    await expect(page.getByTestId('victory-panel')).toBeVisible();
    await expect.poll(() => wave(page), { intervals: [50] }).toBe(1); // Actual1500ms auto-repeat, no button/timer override.
    await expect(page.getByTestId('combat-log').getByText(cast, { exact: true })).toBeAttached();
    await attach(info, '04-native-idle-repeat-log', await page.getByTestId('combat-log').innerText());
    await stop(page, english, true);
    const stopped = await backup(page);
    expect(stopped.meta.idleState).not.toHaveProperty('idleTarget');
    noCombatSave(stopped);
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    await page.reload();
    await expect(page.getByTestId('export-save-button')).toBeVisible();
    const reloaded = await backup(page);
    expect(reloaded.player).toEqual(stopped.player);
    expect(reloaded.inventory).toEqual(stopped.inventory);
    expect(reloaded.map).toEqual(stopped.map);
    expect(reloaded.meta.idleState).not.toHaveProperty('idleTarget');
    noCombatSave(reloaded);
    await attach(info, '05-stop-save-reload', { stopped, reloaded });
    await enter(page, english);
    await expect(page.getByTestId('combat-log').getByText(cast, { exact: true })).toBeAttached();
    await stop(page, english);
    await production(page);
    await attach(info, '06-browser-errors', errors);
    expect(errors).toEqual([]);
  });
}

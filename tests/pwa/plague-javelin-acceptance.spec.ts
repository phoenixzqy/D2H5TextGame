/** Constructed Plague UI/persistence fixture; does not establish earned builds or campaign balance. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const id = 'skills-amazon-plague-javelin', at = new Date('2026-10-26T12:00:00Z');
async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try {
    const save = JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent;
    expect(save.version).toBe(22); return save;
  } finally { await download.delete(); }
}
for (const locale of ['en', 'zh-CN'] as const) test(`Plague public MAX/cast/status/save/offline ${locale}`, async ({ page, context }, info) => {
  const english = locale === 'en', errors: string[] = [], consoleErrors: string[] = [];
  const watch = (target: Page) => {
    target.on('pageerror', error => errors.push(error.message));
    target.on('console', message => {
      if (message.type() === 'error' || message.type() === 'warning') consoleErrors.push(message.text());
    });
  };
  watch(page); await page.clock.setFixedTime(at);
  await page.goto('/'); await page.waitForLoadState('networkidle');
  await createCharacter(page, { class: 'amazon', name: 'Synthetic Plague Browser' });
  await navTo(page, 'settings');
  await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
  const original = await backup(page);
  const cap: Item = { id: 'synthetic-plague-browser-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
    level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
    affixes: [{ affixId: 'synthetic-import', values: new Map([
      ['statMods.life', 999880], ['statMods.mana', 999000]
    ]) }] };
  const incoming = { ...original, player: { ...original.player, level: 30, skillPoints: 1, comboOrder: [],
    skillLevels: { 'skills-amazon-jab': 1, 'skills-amazon-poison-javelin': 1, [id]: 19 } },
  inventory: { ...original.inventory, backpack: [cap] } };
  const importLabel = english ? 'Import Save' : '导入存档';
  await page.getByRole('button', { name: importLabel, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill(JSON.stringify(incoming, (_key, value: unknown) =>
    value instanceof Map ? [...value] : value));
  await dialog.getByRole('button', { name: importLabel, exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await navTo(page, 'inventory');
  await page.getByTestId('inv-item-' + cap.id).click(); await page.getByTestId('inv-primary-action').click();
  await navTo(page, 'skills');
  await page.getByTestId('skill-node-' + id).focus(); await page.keyboard.press('Enter');
  await page.mouse.move(0, 0);
  const panel = page.getByTestId('skill-detail-panel');
  await expect(panel).toContainText(english ? '84–104 Poison base damage' : '84～104 点毒素基础伤害');
  for (const phrase of english
    ? ['already has 10 active Poison stacks before the cast', 'once per cast', 'Plague adds no extra periodic damage']
    : ['施放前已具有10层生效中的中毒', '每次施放至多触发一次', '瘟疫不额外造成持续伤害'])
    await expect(panel).toContainText(phrase);
  const allocate = panel.getByRole('button', { name: english ? 'Allocate' : '分配', exact: true });
  const geometry: { width: number; height: number; allocationWidth: number; allocationHeight: number }[] = [];
  for (const [width, height] of [[360, 640], [412, 915], [640, 360], [1280, 800], [1920, 1080]] as const) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await allocate.scrollIntoViewIfNeeded(); const box = await allocate.boundingBox();
    if (!box) throw new Error('Missing allocation target');
    expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
    geometry.push({ width, height, allocationWidth: box.width, allocationHeight: box.height });
  }
  await page.setViewportSize(info.project.name.includes('mobile') ? { width: 360, height: 640 } : { width: 1280, height: 800 });
  await allocate.click(); await expect(panel).toContainText(english ? 'Lv. 20/20' : '等级 20/20');
  await expect(panel).toContainText(english ? '87–107 Poison base damage' : '87～107 点毒素基础伤害');
  await expect(panel).toContainText(english ? 'Max level reached.' : '已达到最高等级。');
  const current = panel.getByRole('heading', { name: english ? 'Current' : '当前', exact: true }).locator('..');
  for (const [label, value] of [
    [english ? 'Mana Cost' : '法力消耗', '25'], [english ? 'Cooldown' : '冷却', english ? '2 s' : '2 秒'],
    [english ? 'Applies' : '附加', english ? 'Poisoned, Plague' : '中毒, 瘟疫']
  ]) {
    if (!label || !value) throw new Error('Missing preview oracle');
    await expect(current.getByText(label, { exact: true }).locator('..').locator('dd')).toHaveText(value);
  }
  await panel.evaluate(element => { element.scrollTop = 0; });
  await panel.locator('h2').scrollIntoViewIfNeeded();
  await info.attach('plague-preview-viewport', { body: await page.screenshot(), contentType: 'image/png' });
  await info.attach('geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
  await page.locator('#tab-active').click();
  const slot = page.getByRole('combobox', { name: /^(Slot 1|槽位 1)$/ });
  await slot.focus(); await slot.selectOption(id); await expect(slot).toHaveValue(id);
  const prepared = await backup(page);
  expect(prepared.player.skillLevels?.[id]).toBe(20);
  expect(prepared.player.comboOrder.filter(Boolean)).toEqual([id]);
  const name = english ? 'Plague Javelin' : '瘟疫标枪', poisonName = english ? 'Poison' : '中毒', plagueName = english ? 'Plague' : '瘟疫';
  const observed = await page.evaluateHandle(({ name, poisonName, plagueName }) => {
    let cast: string | null = null, poison: string | null = null, plague: string | null = null, dot: string | null = null;
    const enemyNames = new Set<string>();
    const observer = new MutationObserver(() => {
      for (const card of document.querySelectorAll('[data-testid="enemies-grid"] [data-testid^="unit-card-"]')) {
        const label = card.querySelector('img')?.alt ?? card.querySelector('[title]')?.getAttribute('title');
        if (label) enemyNames.add(label);
        const chips = card.querySelector('[data-testid="unit-effect-chips"]')?.textContent;
        if (poison === null && chips?.includes(poisonName)) poison = chips;
        if (plague === null && chips?.includes(plagueName)) plague = chips;
      }
      for (const row of document.querySelectorAll('[data-testid="combat-log"] > div')) {
        const text = row.textContent;
        if (cast === null && text.includes(name) && (text.includes(' casts ') || text.includes('施放了'))) cast = text;
        if (dot === null && (/ takes [1-9]\d* damage over time\./.test(text) || / 因持续伤害受到 [1-9]\d* 点伤害。/.test(text)) &&
          [...enemyNames].some(enemy => text.includes(enemy + ' takes ') || text.includes(enemy + ' 因持续伤害受到 '))) dot = text;
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return { read: () => ({ cast, poison, plague, dot }), disconnect: () => { observer.disconnect(); } };
  }, { name, poisonName, plagueName });
  try {
    await navTo(page, 'map');
    await page.getByTestId('sub-area-row-a1-catacombs').getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
    await expect.poll(async () => (await observed.evaluate(handle => handle.read())).cast).toContain(name);
    await expect.poll(async () => (await observed.evaluate(handle => handle.read())).poison).toContain(poisonName);
    await expect.poll(async () => (await observed.evaluate(handle => handle.read())).plague).toContain(plagueName);
    await expect.poll(async () => (await observed.evaluate(handle => handle.read())).dot, { timeout: 90_000 }).toMatch(/(?:takes [1-9]\d* damage over time|因持续伤害受到 [1-9]\d* 点伤害)/);
    await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
    const affected = page.locator('[data-testid="enemies-grid"] [data-testid^="unit-card-"]')
      .filter({ has: page.getByTestId('unit-effect-chips').filter({ hasText: plagueName }) }).first();
    await expect(affected).toBeVisible();
    await affected.scrollIntoViewIfNeeded();
    await info.attach('plague-affected-enemy', { body: await affected.screenshot(), contentType: 'image/png' });
    const log = page.getByTestId('combat-log');
    await log.scrollIntoViewIfNeeded();
    await info.attach('plague-visible-log', { body: await log.screenshot(), contentType: 'image/png' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await info.attach('plague-combat-viewport', { body: await page.screenshot(), contentType: 'image/png' });
    await info.attach('public-cast', { body: JSON.stringify(await observed.evaluate(handle => handle.read())), contentType: 'application/json' });
    await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
  } finally {
    await observed.evaluate(handle => { handle.disconnect(); }); await observed.dispose();
  }
  await navTo(page, 'settings');
  await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
  const saved = await backup(page);
  expect(saved.player.skillLevels).toEqual(prepared.player.skillLevels);
  expect(saved.map.clearedSubAreas).not.toContain('areas/act1-catacombs');
  expect(JSON.stringify(saved)).not.toContain('"dotPerStack"');
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated');
  await page.close();
  for (const offline of [false, true]) {
    await context.setOffline(offline); const fresh = await context.newPage(); watch(fresh);
    try {
      await fresh.clock.setFixedTime(at); const response = await fresh.goto('/');
      expect(response?.ok()).toBe(true);
      if (offline) expect(response?.fromServiceWorker()).toBe(true);
      await fresh.getByTestId('home-continue').click(); const restored = await backup(fresh);
      for (const domain of ['endgame', 'player', 'inventory', 'map', 'mercs', 'formation', 'meta'] as const)
        expect(restored[domain]).toEqual(saved[domain]);
      await info.attach(offline ? 'offline-save-pair' : 'online-save-pair', {
        body: JSON.stringify({ saved, restored }), contentType: 'application/json'
      });
    } finally { await fresh.close(); }
  }
  expect(errors).toEqual([]); expect(consoleErrors).toEqual([]);
  await info.attach('console-errors', { body: JSON.stringify({ errors, consoleErrors }), contentType: 'application/json' });
});

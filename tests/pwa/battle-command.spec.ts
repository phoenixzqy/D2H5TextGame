/** Imported diagnostic parties prove public mechanics/persistence, not earned builds or balance. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const at = new Date('2026-10-26T12:00:00Z');
async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}
for (const locale of ['en', 'zh-CN'] as const) test(`Battle Command public party/carry/save/offline ${locale}`, async ({ page, context }, info) => {
  const english = locale === 'en', skillName = english ? 'Battle Command' : '战斗指挥';
  const errors: string[] = [], consoleErrors: string[] = [];
  const watch = (target: Page) => {
    target.on('pageerror', error => errors.push(error.message));
    target.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  };
  watch(page); await page.clock.setFixedTime(at);
  await page.goto('/'); await page.waitForLoadState('networkidle');
  await createCharacter(page, { class: 'barbarian', name: 'Command Browser' });
  await navTo(page, 'settings');
  await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
  // Hire through production UI; importing the runtime factory into Node would
  // bypass that route and requires Vite-only dependency resolution.
  const mercId = 'mercs/act1-rogue-fire';
  await navTo(page, 'mercs');
  const hire = page.getByTestId(`hire-merc-${mercId}`);
  await hire.getByRole('button', { name: english ? 'Hire' : '招募', exact: true }).click();
  await expect(hire.getByRole('button')).toBeDisabled();
  const original = await backup(page);
  const merc = original.mercs.ownedMercs.find(row => row.id === mercId);
  if (!merc) throw new Error('Missing normally hired native mercenary');
  expect(original.mercs.fieldedMercId).toBe(merc.id);
  const cap: Item = { id: 'synthetic-command-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
    level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
    affixes: [{ affixId: 'synthetic-import', values: new Map([['statMods.life', 999880],
      ['statMods.mana', 1000], ['statMods.attack', 100]]) }] };
  const incoming = { ...original, player: { ...original.player, level: 30, skillPoints: 1,
    comboOrder: ['skills-barbarian-battle-command'], skillLevels: { 'skills-barbarian-howl': 1,
      'skills-barbarian-shout': 1, 'skills-barbarian-battle-orders': 1,
      'skills-barbarian-iron-skin': 1, 'skills-barbarian-battle-command': 19 } },
    inventory: { ...original.inventory, backpack: [cap], equipped: { ...original.inventory.equipped,
      head: { ...cap, id: 'synthetic-old-command-cap', equipped: true, equipSlot: 'head' } } },
    mercs: { ...original.mercs,
      mercEquipment: { [merc.id]: { head: { ...cap, id: 'synthetic-command-merc-cap', equipped: true, equipSlot: 'head' } } } } };
  const importLabel = english ? 'Import Save' : '导入存档';
  await page.getByRole('button', { name: importLabel, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill(JSON.stringify(incoming, (_key, value: unknown) => value instanceof Map ? [...value] : value));
  await dialog.getByRole('button', { name: importLabel, exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await navTo(page, 'inventory');
  await page.getByTestId('inv-item-synthetic-command-cap').click();
  await page.getByTestId('inv-primary-action').click();
  await navTo(page, 'skills');
  await page.getByTestId('skill-node-skills-barbarian-battle-command').click(); await page.mouse.move(0, 0);
  const panel = page.getByTestId('skill-detail-panel');
  await expect(panel.getByRole('heading', { name: skillName, exact: true })).toBeVisible();
  await expect(panel).toContainText(english ? 'current living allies' : '当前存活盟友');
  await expect(panel).toContainText(english ? '17 s' : '17 秒');
  await expect(panel).toContainText(english ? '17.5 s' : '17.5 秒');
  await expect(panel).toContainText('+1');
  const allocate = panel.getByRole('button', { name: english ? 'Allocate' : '分配', exact: true });
  const geometry: { width: number; height: number; allocationHeight: number }[] = [];
  for (const [width, height] of [[360, 640], [412, 915], [640, 360], [1280, 800], [1920, 1080]] as const) {
    await page.setViewportSize({ width, height }); await page.mouse.move(0, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const rect = await allocate.boundingBox(); if (!rect) throw new Error('Missing allocation control');
    expect(rect.height).toBeGreaterThanOrEqual(44); geometry.push({ width, height, allocationHeight: rect.height });
  }
  await allocate.click(); await expect(panel).toContainText(english ? 'Lv. 20/20' : '等级 20/20');
  await expect(panel.getByText(english ? 'Applies' : '附加', { exact: true }).locator('..').getByRole('definition'))
    .toHaveText(skillName);
  await page.setViewportSize(info.project.name.includes('mobile') ? { width: 360, height: 640 } : { width: 1280, height: 800 });
  await panel.scrollIntoViewIfNeeded();
  await info.attach('skill-preview', { body: await panel.screenshot(), contentType: 'image/png' });
  await info.attach('geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
  const prepared = await backup(page);
  expect(prepared.player.skillLevels?.['skills-barbarian-battle-command']).toBe(20);
  const capture = await page.evaluateHandle(({ skillName, heroId, mercId }) => {
    const snapshots: { wave: string; chips: number; positive: boolean; livingParty: boolean; log: string }[] = [];
    let previous = '', positiveWave = '', overflow = false, partySeen = false, carrySeen = false, expirySeen = false, rawIdSeen = false;
    const observer = new MutationObserver(() => {
      const wave = document.querySelector('[data-testid="wave-counter"]')?.textContent ?? '';
      const log = document.querySelector('[data-testid="combat-log"]')?.textContent ?? '';
      const cards = [heroId, mercId].map(id => document.querySelector('[data-testid="unit-card-' + id + '"]'));
      const livingParty = cards.every(card => card !== null && !card.hasAttribute('data-dead'));
      const chips = cards.flatMap(card => Array.from(card?.querySelectorAll('[data-testid="unit-effect-chips"] > span') ?? []))
        .filter(node => node.textContent === skillName);
      const positive = chips.length === 2 && chips.every(node => node.classList.contains('text-blue-200'));
      partySeen ||= positive;
      if (positive) positiveWave = wave;
      carrySeen ||= Number(wave.match(/\d+/)?.[0] ?? 0) > 1 && positive && !log.includes(skillName);
      // Require removal within an already-positive wave while both units remain
      // alive and present, so navigation/death/wave teardown cannot pass expiry.
      expirySeen ||= partySeen && chips.length === 0 && livingParty && wave !== '' && wave === positiveWave &&
        document.querySelector('[data-testid="victory-panel"]') === null;
      rawIdSeen ||= log.includes('battle-command');
      const key = JSON.stringify({ wave, chips: chips.length, positive, livingParty, log });
      if (key === previous) return; previous = key;
      if (snapshots.length < 256) snapshots.push({ wave, chips: chips.length, positive, livingParty, log }); else overflow = true;
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return { read: () => ({ snapshots, overflow, partySeen, carrySeen, expirySeen, rawIdSeen }), disconnect: () => observer.disconnect() };
  }, { skillName, heroId: prepared.player.id, mercId: 'merc-' + merc.id });
  try {
    await navTo(page, 'map');
    await page.getByTestId('sub-area-row-a1-blood-moor').getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
    await page.getByRole('button', { name: english ? 'Speed' : '速度', exact: true }).click();
    await page.getByRole('button', { name: english ? 'Speed' : '速度', exact: true }).click(); await page.mouse.move(0, 0);
    await expect.poll(async () => (await capture.evaluate(handle => handle.read())).partySeen, { timeout: 45_000 }).toBe(true);
    await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
    await info.attach('command-battlefield', { body: await page.getByTestId('combat-battlefield').screenshot(), contentType: 'image/png' });
    await page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }).click(); await page.mouse.move(0, 0);
    await expect(page.getByTestId('victory-panel')).toBeVisible({ timeout: 90_000 });
    const observed = await capture.evaluate(handle => handle.read());
    expect(observed.partySeen).toBe(true); expect(observed.carrySeen).toBe(true); expect(observed.expirySeen).toBe(true);
    expect(observed.rawIdSeen).toBe(false); expect(observed.overflow).toBe(false);
    expect(observed.snapshots.some(snapshot => snapshot.log.includes(skillName))).toBe(true);
  } finally {
    await info.attach('command-observations', { body: JSON.stringify(await capture.evaluate(handle => handle.read())), contentType: 'application/json' });
    await capture.evaluate(handle => handle.disconnect()); await capture.dispose();
  }
  await page.getByTestId('return-to-town').click(); await navTo(page, 'settings');
  await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
  const saved = await backup(page);
  expect(saved.player.skillLevels).toEqual(prepared.player.skillLevels);
  expect(JSON.stringify(saved)).not.toMatch(/"battleCommandCarry"|"battleCommandPassives"|"battleCommands"|"activeBuffIds"/);
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated');
  await page.close();
  for (const offline of [false, true]) {
    await context.setOffline(offline); const fresh = await context.newPage(); watch(fresh);
    try {
      await fresh.clock.setFixedTime(at); const response = await fresh.goto('/');
      expect(response?.ok()).toBe(true); if (offline) expect(response?.fromServiceWorker()).toBe(true);
      await fresh.getByTestId('home-continue').click(); const restored = await backup(fresh);
      for (const domain of ['player', 'inventory', 'map', 'mercs', 'formation', 'meta'] as const) expect(restored[domain]).toEqual(saved[domain]);
      await info.attach(offline ? 'offline-save-pair' : 'online-save-pair', { body: JSON.stringify({ saved, restored }), contentType: 'application/json' });
    } finally { await fresh.close(); }
  }
  expect(errors).toEqual([]); expect(consoleErrors).toEqual([]);
  await info.attach('console-errors', { body: JSON.stringify({ errors, consoleErrors }), contentType: 'application/json' });
});

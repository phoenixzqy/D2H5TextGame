/** Synthetic public UI/persistence proof; does not establish earned builds or campaign balance. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const at = new Date('2026-10-26T12:00:00Z');
const spells = ['teeth', 'bone-spear', 'bone-spirit', 'poison-nova'] as const;
async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download'); await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}
for (const locale of ['en', 'zh-CN'] as const) test(`Necromancer direct public previews/casts/save/offline ${locale}`, async ({ page, context }, info) => {
  const english = locale === 'en', errors: string[] = [], consoleErrors: string[] = [];
  const watch = (target: Page) => {
    target.on('pageerror', error => errors.push(error.message));
    target.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  };
  watch(page); await page.clock.setFixedTime(at);
  await page.goto('/'); await page.waitForLoadState('networkidle');
  await createCharacter(page, { class: 'necromancer', name: 'Bone Poison Browser' });
  await navTo(page, 'settings');
  await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
  const original = await backup(page);
  const rows = JSON.parse(await readFile(new URL('../../src/data/skills/necromancer.json', import.meta.url), 'utf8')) as
    { id: string; prerequisites?: string[] }[];
  const levels: Record<string, number> = {};
  const add = (id: string) => {
    const row = rows.find(value => value.id === id); if (!row) throw new Error('Missing native prerequisite');
    for (const ancestor of row.prerequisites ?? []) add(ancestor);
    levels[id] = 1;
  };
  for (const slug of spells) add('skills-necromancer-' + slug);
  for (const slug of spells) levels['skills-necromancer-' + slug] = 19;
  const cap: Item = { id: 'synthetic-necromancer-direct-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
    level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
    affixes: [{ affixId: 'synthetic-import', values: new Map([['statMods.life', 999880],
      ['statMods.mana', 1000], ['statMods.attack', 100]]) }] };
  const incoming = { ...original, player: { ...original.player, level: 30, skillPoints: 4,
    comboOrder: spells.map(slug => 'skills-necromancer-' + slug), skillLevels: levels },
    inventory: { ...original.inventory, backpack: [cap], equipped: original.inventory.equipped } };
  const importLabel = english ? 'Import Save' : '导入存档';
  await page.getByRole('button', { name: importLabel, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill(JSON.stringify(incoming, (_key, value: unknown) => value instanceof Map ? [...value] : value));
  await dialog.getByRole('button', { name: importLabel, exact: true }).click(); await expect(dialog).toHaveCount(0);
  await navTo(page, 'inventory'); await page.getByTestId('inv-item-' + cap.id).click();
  await page.getByTestId('inv-primary-action').click(); await navTo(page, 'skills');
  const geometry: { skill: string; width: number; height: number; allocationHeight: number }[] = [];
  for (const slug of spells) {
    await page.getByTestId('skill-node-skills-necromancer-' + slug).click(); await page.mouse.move(0, 0);
    const panel = page.getByTestId('skill-detail-panel');
    await expect(panel).toContainText(english ? 'base damage' : '基础伤害');
    await expect(panel).toContainText(english ? (slug === 'poison-nova' ? 'Poison resistance and Defense' : 'Arcane resistance and magic resist')
      : slug === 'poison-nova' ? '毒素抗性与防御' : '奥术抗性与魔法抵抗');
    if (slug === 'poison-nova') for (const phrase of english ? ['2 Poison stacks', '5% of the final hit per second', '5 s', '10 stacks']
      : ['2 层中毒', '最终命中伤害的5%', '5 秒', '10层']) await expect(panel).toContainText(phrase);
    const allocate = panel.getByRole('button', { name: english ? 'Allocate' : '分配', exact: true });
    for (const [width, height] of [[360, 640], [412, 915], [640, 360], [1280, 800], [1920, 1080]] as const) {
      await page.setViewportSize({ width, height });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const box = await allocate.boundingBox(); if (!box) throw new Error('Missing allocation target');
      expect(box.height).toBeGreaterThanOrEqual(44); geometry.push({ skill: slug, width, height, allocationHeight: box.height });
    }
    await allocate.click(); await expect(panel).toContainText(english ? 'Lv. 20/20' : '等级 20/20');
    await page.setViewportSize(info.project.name.includes('mobile') ? { width: 360, height: 640 } : { width: 1280, height: 800 });
    await info.attach(slug + '-preview', { body: await panel.screenshot(), contentType: 'image/png' });
  }
  await info.attach('geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
  const prepared = await backup(page);
  for (const slug of spells) expect(prepared.player.skillLevels?.['skills-necromancer-' + slug]).toBe(20);
  await navTo(page, 'map');
  await page.getByTestId('sub-area-row-a1-blood-moor').getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: english ? 'Speed' : '速度', exact: true }).click();
  await page.mouse.move(0, 0); await expect(page.getByTestId('victory-panel')).toBeVisible({ timeout: 90_000 });
  await info.attach('victory', { body: await page.getByTestId('victory-panel').screenshot(), contentType: 'image/png' });
  await page.getByTestId('return-to-town').click(); await navTo(page, 'settings');
  await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
  const saved = await backup(page); expect(saved.player.skillLevels).toEqual(prepared.player.skillLevels);
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

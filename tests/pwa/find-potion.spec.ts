/** Imported diagnostic characters prove public mechanics/persistence, not earned balance. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const at = new Date('2026-10-25T12:00:00Z');
async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}
for (const locale of ['en', 'zh-CN'] as const) {
  test(`Find Potion public corpse recovery/save/offline ${locale}`, async ({ page, context }, info) => {
    const english = locale === 'en', skillName = english ? 'Find Potion' : '找药水';
    const name = 'Recovery Browser', errors: string[] = [], consoleErrors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await page.clock.setFixedTime(at);
    await page.goto('/'); await createCharacter(page, { class: 'barbarian', name });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const original = await backup(page);
    const cap: Item = { id: 'synthetic-recovery-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
      level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
      affixes: [{ affixId: 'synthetic-import', values: new Map([['statMods.life', 999880],
        ['statMods.mana', 1000], ['statMods.attack', 100]]) }] };
    const incoming = { ...original, player: { ...original.player, level: 30, skillPoints: 1,
      comboOrder: ['skills-barbarian-find-potion'], skillLevels: { 'skills-barbarian-find-potion': 1 } },
      inventory: { ...original.inventory, backpack: [cap], equipped: { ...original.inventory.equipped,
        head: { ...cap, id: 'synthetic-old-recovery-cap', equipped: true, equipSlot: 'head' } } } };
    const importLabel = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(incoming, (_key, value: unknown) => value instanceof Map ? [...value] : value));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await navTo(page, 'inventory');
    await page.getByTestId('inv-item-synthetic-recovery-cap').click();
    await page.getByTestId('inv-primary-action').click();
    await navTo(page, 'skills');
    await page.getByTestId('skill-node-skills-barbarian-find-potion').click();
    await page.mouse.move(0, 0);
    const panel = page.getByTestId('skill-detail-panel');
    await expect(panel.getByRole('heading', { name: skillName, exact: true })).toBeVisible();
    await expect(panel).toContainText(english ? 'one shared enemy corpse' : '一具共享敌人尸体');
    await expect(panel).toContainText(english ? 'no potion item' : '不生成药水物品');
    const allocate = panel.getByRole('button', { name: english ? 'Allocate' : '分配', exact: true });
    const geometry: { width: number; height: number; allocationHeight: number }[] = [];
    for (const [width, height] of [[360, 640], [412, 915], [640, 360], [1280, 800], [1920, 1080]] as const) {
      await page.setViewportSize({ width, height }); await page.mouse.move(0, 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const rect = await allocate.boundingBox(); if (!rect) throw new Error('Missing allocation control');
      expect(rect.height).toBeGreaterThanOrEqual(44);
      geometry.push({ width, height, allocationHeight: rect.height });
    }
    await allocate.click();
    await expect(panel).toContainText(english ? 'Lv. 2/20' : '等级 2/20');
    await expect(panel).toContainText('10.5%'); await expect(panel).toContainText('5.25%');
    await page.setViewportSize(info.project.name.includes('mobile') ? { width: 360, height: 640 } : { width: 1280, height: 800 });
    await panel.scrollIntoViewIfNeeded();
    await info.attach('skill-preview', { body: await panel.screenshot(), contentType: 'image/png' });
    await info.attach('geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
    const prepared = await backup(page);
    expect(prepared.player.skillLevels?.['skills-barbarian-find-potion']).toBe(2);
    const bars = await page.evaluateHandle(labels => {
      const values: { resource: string; value: number }[] = []; let overflow = false;
      const observer = new MutationObserver(() => {
        for (const [resource, label] of Object.entries(labels)) {
          const group = [...document.querySelectorAll('[data-testid="combat-screen"] [role="group"]')]
            .find(element => element.getAttribute('aria-label') === label);
          const bar = group?.querySelector('[role="progressbar"]');
          if (!bar) continue;
          const value = Number(bar.getAttribute('aria-valuenow'));
          if (values.filter(entry => entry.resource === resource).at(-1)?.value !== value) {
            if (values.length >= 512) overflow = true; else values.push({ resource, value });
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
      return { read: () => ({ values, overflow }), disconnect: () => { observer.disconnect(); } };
    }, english ? { hp: 'HP', mp: 'MP' } : { hp: '生命', mp: '法力' });
    const log = page.getByTestId('combat-log');
    try {
      await navTo(page, 'map');
      await page.getByTestId('sub-area-row-a1-blood-moor').getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
      // Use the player's ordinary4x playback control for this eight-enemy encounter.
      await page.getByRole('button', { name: english ? 'Speed' : '速度', exact: true }).click();
      await page.getByRole('button', { name: english ? 'Speed' : '速度', exact: true }).click();
      await expect(log).toContainText(english ? 'Find Potion consumes a corpse' : '找药水消耗一具尸体');
      await expect(log).toContainText(english ? `${name} recovers` : `${name} 恢复了`);
      await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
      const text = await log.innerText(), lines = text.split('\n');
      const death = lines.findIndex(line => line.includes(english ? 'falls.' : '倒下'));
      const consumption = lines.findIndex(line => line.includes(english ? 'Find Potion consumes a corpse' : '找药水消耗一具尸体'));
      expect(consumption).toBeGreaterThan(death); expect(death).toBeGreaterThanOrEqual(0);
      const observed = await bars.evaluate(handle => handle.read());
      expect(observed.overflow).toBe(false);
      expect(observed.values.some(entry => entry.resource === 'mp')).toBe(true);
      await info.attach('resource-playback', { body: JSON.stringify(observed), contentType: 'application/json' });
      await info.attach('combat-log', { body: text, contentType: 'text/plain' });
      await log.scrollIntoViewIfNeeded();
      await info.attach('combat', { body: await page.screenshot(), contentType: 'image/png' });
    } finally { await bars.evaluate(handle => { handle.disconnect(); }); await bars.dispose(); }
    await info.attach('console-errors', { body: JSON.stringify(consoleErrors), contentType: 'application/json' });
    expect(consoleErrors).toEqual([]);
    await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    const saved = await backup(page);
    expect(JSON.stringify(saved)).not.toMatch(/"findPotion"|"corpses"|"activeBuffIds"/);
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated');
    await page.close();
    for (const offline of [false, true]) {
      await context.setOffline(offline);
      const fresh = await context.newPage();
      fresh.on('pageerror', error => errors.push(error.message));
      try {
        await fresh.clock.setFixedTime(at);
        const response = await fresh.goto('/');
        expect(response?.ok()).toBe(true);
        if (offline) expect(response?.fromServiceWorker()).toBe(true);
        await fresh.getByTestId('home-continue').click();
        const restored = await backup(fresh);
        for (const domain of ['player', 'inventory', 'map', 'mercs', 'formation', 'meta'] as const)
          expect(restored[domain]).toEqual(saved[domain]);
        await info.attach(offline ? 'offline-save-pair' : 'online-save-pair', {
          body: JSON.stringify({ saved, restored }), contentType: 'application/json'
        });
      } finally { await fresh.close(); }
    }
    expect(errors).toEqual([]);
  });
}

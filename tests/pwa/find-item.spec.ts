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
  test(`Find Item public corpse search/save/offline ${locale}`, async ({ page, context }, info) => {
    const english = locale === 'en', skillName = english ? 'Find Item' : '找物品';
    const name = 'Search Browser', errors: string[] = [], consoleErrors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await page.clock.setFixedTime(at);
    await page.goto('/'); await createCharacter(page, { class: 'barbarian', name });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const original = await backup(page);
    const cap: Item = { id: 'synthetic-search-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
      level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
      affixes: [{ affixId: 'synthetic-import', values: new Map([['statMods.life', 999880],
        ['statMods.mana', 1000], ['statMods.attack', 100]]) }] };
    const incoming = { ...original, player: { ...original.player, level: 30, skillPoints: 1,
      comboOrder: ['skills-barbarian-find-item'], skillLevels: { 'skills-barbarian-find-potion': 1, 'skills-barbarian-find-item': 19 } },
      inventory: { ...original.inventory, backpack: [cap], equipped: { ...original.inventory.equipped,
        head: { ...cap, id: 'synthetic-old-search-cap', equipped: true, equipSlot: 'head' } } } };
    const importLabel = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(incoming, (_key, value: unknown) => value instanceof Map ? [...value] : value));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await navTo(page, 'inventory');
    await page.getByTestId('inv-item-synthetic-search-cap').click();
    await page.getByTestId('inv-primary-action').click();
    await navTo(page, 'skills');
    await page.getByTestId('skill-node-skills-barbarian-find-item').click();
    await page.mouse.move(0, 0);
    const panel = page.getByTestId('skill-detail-panel');
    await expect(panel.getByRole('heading', { name: skillName, exact: true })).toBeVisible();
    await expect(panel).toContainText(english ? 'one shared enemy corpse' : '一具共享敌人尸体');
    await expect(panel).toContainText(english ? 'ordinary loot roll' : '普通掉落');
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
    await expect(panel).toContainText(english ? 'Lv. 20/20' : '等级 20/20');
    await expect(panel).toContainText('39%');
    await page.setViewportSize(info.project.name.includes('mobile') ? { width: 360, height: 640 } : { width: 1280, height: 800 });
    await panel.scrollIntoViewIfNeeded();
    await info.attach('skill-preview', { body: await panel.screenshot(), contentType: 'image/png' });
    await info.attach('geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
    const prepared = await backup(page);
    expect(prepared.player.skillLevels?.['skills-barbarian-find-item']).toBe(20);
    const successText = english ? 'search successful' : '搜索成功';
    const capture = await page.evaluateHandle(phrase => {
      const snapshots: string[] = []; let previous = '', overflow = false;
      const observer = new MutationObserver(() => {
        const log = document.querySelector('[data-testid="combat-log"]');
        const text = log?.textContent ?? '';
        if (!text.includes(phrase) || text === previous) return;
        previous = text;
        if (snapshots.length < 128) snapshots.push(text); else overflow = true;
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      return { read: () => ({ snapshots, overflow }), disconnect: () => { observer.disconnect(); } };
    }, successText);
    let rewardText = '', rewardItemCount = 0;
    try {
      await navTo(page, 'map');
      await page.getByTestId('sub-area-row-a1-blood-moor').getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
      // Public4x playback, followed through actual guarded settlement to complete run victory.
      await page.getByRole('button', { name: english ? 'Speed' : '速度', exact: true }).click();
      await page.getByRole('button', { name: english ? 'Speed' : '速度', exact: true }).click();
      await page.mouse.move(0, 0);
      await expect.poll(async () => (await capture.evaluate(handle => handle.read())).snapshots.length,
        { timeout: 45_000 }).toBeGreaterThan(0);
      await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
      const feedback = page.getByTestId('combat-log').getByText(successText, { exact: false }).last();
      await feedback.scrollIntoViewIfNeeded();
      await info.attach('search-feedback', { body: await feedback.screenshot(), contentType: 'image/png' });
      await page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }).click();
      await page.mouse.move(0, 0);
      await expect(page.getByTestId('victory-panel')).toBeVisible({ timeout: 90_000 });
      const observed = await capture.evaluate(handle => handle.read());
      expect(observed.snapshots.length).toBeGreaterThan(0);
      const successfulLog = observed.snapshots[0] ?? '';
      const death = successfulLog.indexOf(english ? 'falls.' : '倒下');
      const success = successfulLog.indexOf(successText);
      expect(death).toBeGreaterThanOrEqual(0); expect(success).toBeGreaterThan(death);
      await info.attach('search-log-observation', { body: JSON.stringify(observed), contentType: 'application/json' });
      const summary = page.getByTestId('loot-summary');
      rewardText = await summary.innerText();
      rewardItemCount = await summary.getByTestId('loot-items').locator('li').count();
      expect(rewardItemCount).toBeGreaterThan(0);
      await summary.scrollIntoViewIfNeeded();
      await info.attach('victory-rewards', { body: await summary.screenshot(), contentType: 'image/png' });
      await info.attach('reward-summary', { body: JSON.stringify({ rewardText, rewardItemCount }), contentType: 'application/json' });
    } finally { await capture.evaluate(handle => { handle.disconnect(); }); await capture.dispose(); }
    await page.getByTestId('return-to-town').click();
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    const saved = await backup(page);
    const ownedBefore = [...prepared.inventory.backpack, ...prepared.inventory.stash,
      ...Object.values(prepared.inventory.equipped).filter(item => item !== null)];
    const ownedAfter = [...saved.inventory.backpack, ...saved.inventory.stash,
      ...Object.values(saved.inventory.equipped).filter(item => item !== null)];
    const beforeIds = new Set(ownedBefore.map(item => item.id));
    const additions = ownedAfter.filter(item => !beforeIds.has(item.id));
    expect(additions).toHaveLength(rewardItemCount);
    expect(new Set(ownedAfter.map(item => item.id)).size).toBe(ownedAfter.length);
    for (const originalItem of ownedBefore) expect(ownedAfter.find(item => item.id === originalItem.id)).toEqual(originalItem);
    const shards = (saved.inventory.currencies['rune-shard'] ?? 0) - (prepared.inventory.currencies['rune-shard'] ?? 0);
    expect(shards).toBeGreaterThan(0);
    expect(rewardText).toContain(new Intl.NumberFormat(locale).format(shards));
    await info.attach('collected-rewards', { body: JSON.stringify({ prepared, saved, additions, shards, rewardItemCount }), contentType: 'application/json' });
    expect(JSON.stringify(saved)).not.toMatch(/"findItemFinds"|"findItem"|"corpses"|"activeBuffIds"/);
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated');
    await page.close();
    for (const offline of [false, true]) {
      await context.setOffline(offline);
      const fresh = await context.newPage();
      fresh.on('pageerror', error => errors.push(error.message));
      fresh.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
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
    expect(errors).toEqual([]); expect(consoleErrors).toEqual([]);
    await info.attach('console-errors', { body: JSON.stringify(consoleErrors), contentType: 'application/json' });
  });
}

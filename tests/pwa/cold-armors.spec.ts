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
for (const locale of ['en', 'zh-CN'] as const) for (const slug of ['shiver-armor', 'chilling-armor']) {
  test(`${slug} public allocation/counter/save/offline ${locale}`, async ({ page, context }, info) => {
    const english = locale === 'en', shiver = slug === 'shiver-armor';
    const armorName = english ? (shiver ? 'Shiver Armor' : 'Chilling Armor') : (shiver ? '颤栗甲' : '寒冰装甲');
    const name = 'Armor Browser', errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(at);
    await page.goto('/'); await createCharacter(page, { class: 'sorceress', name });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const original = await backup(page);
    const cap: Item = { id: 'synthetic-cold-armor-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
      level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [], affixes: [{ affixId: 'synthetic-import',
        values: new Map([['statMods.life', 999_880], ['statMods.mana', 1000], ['statMods.attackSpeed', 300]]) }] };
    const levels = { 'skills-sorceress-frozen-armor': 1, 'skills-sorceress-shiver-armor': 1,
      ['skills-sorceress-' + slug]: 1 };
    const incoming = { ...original, player: { ...original.player, level: 30, skillPoints: 1,
      comboOrder: ['skills-sorceress-' + slug], skillLevels: levels,
      coreStats: { ...original.player.coreStats, energy: 100 },
      derivedStats: { ...original.player.derivedStats, life: 1_000_000, lifeMax: 1_000_000, mana: 1000, manaMax: 1000 } },
      inventory: { ...original.inventory, backpack: [cap], equipped: { ...original.inventory.equipped,
        head: { ...cap, id: 'synthetic-old-armor-cap', equipped: true, equipSlot: 'head' } } } };
    const importLabel = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(incoming, (_key, value: unknown) => value instanceof Map ? [...value] : value));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await navTo(page, 'inventory');
    await page.getByTestId('inv-item-synthetic-cold-armor-cap').click();
    await page.getByTestId('inv-primary-action').click();
    await navTo(page, 'skills');
    await page.getByTestId('skill-node-skills-sorceress-' + slug).click();
    await page.mouse.move(0, 0);
    const panel = page.getByTestId('skill-detail-panel');
    await expect(panel.getByRole('heading', { name: armorName, exact: true })).toBeVisible();
    await expect(panel).toContainText(english ? 'Cold base damage' : '点冰冷基础伤害');
    const allocate = panel.getByRole('button', { name: english ? 'Allocate' : '分配', exact: true });
    await expect(allocate).toHaveCount(1);
    for (const [width, height] of [[360, 640], [412, 915], [640, 360], [1280, 800], [1920, 1080]] as const) {
      await page.setViewportSize({ width, height });
      await page.mouse.move(0, 0);
      await expect(panel.getByRole('heading', { name: armorName, exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const rect = await allocate.boundingBox();
      if (!rect) throw new Error('Missing allocation control');
      expect(rect.height).toBeGreaterThanOrEqual(44);
    }
    await allocate.click();
    await expect(panel).toContainText(english ? 'Lv. 2/20' : '等级 2/20');
    await page.setViewportSize(info.project.name.includes('mobile') ? { width: 360, height: 640 } : { width: 1280, height: 800 });
    await info.attach('skill-preview', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    const prepared = await backup(page);
    expect(prepared.player.skillLevels?.['skills-sorceress-' + slug]).toBe(2);
    // Sample the public MP bar while native playback runs; recovery may refill it before the counter.
    const manaFrames = await page.evaluateHandle(label => {
      const values: number[] = [];
      let overflow = false;
      const observer = new MutationObserver(() => {
        const bar = document.querySelector(`[data-testid="combat-screen"] [role="group"][aria-label="${label}"] [role="progressbar"]`);
        if (!bar) return;
        const value = Number(bar.getAttribute('aria-valuenow'));
        if (values.at(-1) === value) return;
        if (values.length >= 256) { overflow = true; return; }
        values.push(value);
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
      return { read: () => ({ values, overflow }), disconnect: () => { observer.disconnect(); } };
    }, english ? 'MP' : '法力');
    const log = page.getByTestId('combat-log');
    try {
      await navTo(page, 'map');
      await page.getByTestId('sub-area-row-a1-blood-moor').getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
      await expect(log).toContainText(armorName);
      await expect(log).toContainText(english ? 'cold damage' : '冰冷');
      await expect(log).toContainText(english ? '[Freeze]' : '【冻结】');
      await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
      const observed = await manaFrames.evaluate(handle => handle.read());
      await info.attach('mana-playback', { body: JSON.stringify(observed), contentType: 'application/json' });
      expect(observed.overflow).toBe(false);
      expect(observed.values).toContain(prepared.player.derivedStats.manaMax - (shiver ? 11 : 15));
    } finally {
      await manaFrames.evaluate(handle => { handle.disconnect(); });
      await manaFrames.dispose();
    }
    await info.attach('combat-log', { body: await log.innerText(), contentType: 'text/plain' });
    await info.attach('combat', { body: await page.screenshot(), contentType: 'image/png' });
    await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    const saved = await backup(page);
    expect(JSON.stringify(saved)).not.toMatch(/"coldArmors"|"coldArmorRanks"|"activeBuffIds"/);
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
        for (const domain of ['player', 'inventory', 'map', 'mercs', 'meta'] as const)
          expect(restored[domain]).toEqual(saved[domain]);
        await info.attach(offline ? 'offline-save-pair' : 'online-save-pair', {
          body: JSON.stringify({ saved, restored }), contentType: 'application/json'
        });
      } finally { await fresh.close(); }
    }
    expect(errors).toEqual([]);
  });
}

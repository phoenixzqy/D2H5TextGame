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
  test(`Hydra public allocation/body/save/offline ${locale}`, async ({ page, context }, info) => {
    const english = locale === 'en', armorName = english ? 'Hydra' : '九头海蛇';
    const name = 'Summon Browser', errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(at);
    await page.goto('/'); await createCharacter(page, { class: 'sorceress', name });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const original = await backup(page);
    const cap: Item = { id: 'synthetic-hydra-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
      level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [], affixes: [{ affixId: 'synthetic-import',
        values: new Map([['statMods.life', 999_880], ['statMods.mana', 1000], ['statMods.attackSpeed', 300]]) }] };
    const incoming = { ...original, player: { ...original.player, level: 30, skillPoints: 1,
      comboOrder: ['skills-sorceress-hydra'], skillLevels: { 'skills-sorceress-inferno': 1,
        'skills-sorceress-blaze': 1, 'skills-sorceress-fire-wall': 1, 'skills-sorceress-hydra': 1 },
      coreStats: { ...original.player.coreStats, energy: 100 },
      derivedStats: { ...original.player.derivedStats, life: 1_000_000, lifeMax: 1_000_000, mana: 1000, manaMax: 1000 } },
      inventory: { ...original.inventory, backpack: [cap], equipped: { ...original.inventory.equipped,
        head: { ...cap, id: 'synthetic-old-hydra-cap', equipped: true, equipSlot: 'head' } } } };
    const importLabel = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(incoming, (_key, value: unknown) => value instanceof Map ? [...value] : value));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await navTo(page, 'inventory');
    await page.getByTestId('inv-item-synthetic-hydra-cap').click();
    await page.getByTestId('inv-primary-action').click();
    await navTo(page, 'skills');
    await page.getByTestId('skill-node-skills-sorceress-hydra').click();
    await page.mouse.move(0, 0);
    const panel = page.getByTestId('skill-detail-panel');
    await expect(panel.getByRole('heading', { name: armorName, exact: true })).toBeVisible();
    await expect(panel).toContainText(english ? 'per head bolt' : '每个头的火弹');
    await expect(panel).toContainText(english ? 'targetable body' : '可被攻击的实体');
    await expect(panel).toContainText(english ? '10 s' : '10 秒');
    await expect(panel).toContainText(english ? '240' : '240');
    const allocate = panel.getByRole('button', { name: english ? 'Allocate' : '分配', exact: true });
    await expect(allocate).toHaveCount(1);
    const geometry: { width: number; height: number; allocationHeight: number }[] = [];
    for (const [width, height] of [[360, 640], [412, 915], [640, 360], [1280, 800], [1920, 1080]] as const) {
      await page.setViewportSize({ width, height });
      await page.mouse.move(0, 0);
      await expect(panel.getByRole('heading', { name: armorName, exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const rect = await allocate.boundingBox();
      if (!rect) throw new Error('Missing allocation control');
      expect(rect.height).toBeGreaterThanOrEqual(44);
      geometry.push({ width, height, allocationHeight: rect.height });
    }
    await allocate.click();
    await expect(panel).toContainText(english ? 'Lv. 2/20' : '等级 2/20');
    await page.setViewportSize(info.project.name.includes('mobile') ? { width: 360, height: 640 } : { width: 1280, height: 800 });
    await panel.scrollIntoViewIfNeeded();
    await info.attach('skill-preview', { body: await panel.screenshot(), contentType: 'image/png' });
    await info.attach('geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
    const prepared = await backup(page);
    expect(prepared.player.skillLevels?.['skills-sorceress-hydra']).toBe(2);
    // Sample the public MP bar while native playback runs; recovery may refill it before inspection.
    const manaFrames = await page.evaluateHandle(label => {
      const values: number[] = [], positiveChips: string[] = [];
      let overflow = false;
      const observer = new MutationObserver(() => {
        const bar = document.querySelector(`[data-testid="combat-screen"] [role="group"][aria-label="${label}"] [role="progressbar"]`);
        if (bar) {
          const value = Number(bar.getAttribute('aria-valuenow'));
          if (values.at(-1) !== value) {
            if (values.length >= 256) overflow = true; else values.push(value);
          }
        }
        for (const chip of document.querySelectorAll('[data-testid="unit-effect-chips"] > .text-blue-200'))
          if (chip.textContent && !positiveChips.includes(chip.textContent)) positiveChips.push(chip.textContent);
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
      return { read: () => ({ values, positiveChips, overflow }), disconnect: () => { observer.disconnect(); } };
    }, english ? 'MP' : '法力');
    const log = page.getByTestId('combat-log');
    try {
      await navTo(page, 'map');
      // Catacombs enemies survive rank-two bolts, avoiding immediate kill-orb
      // refunds that legitimately conceal the debit in one timestamp batch.
      await page.getByTestId('sub-area-row-a1-catacombs').getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
      await expect(log).toContainText(armorName);
      await expect(page.getByTestId('allies-grid').getByTestId('summon-badge')).toHaveCount(1);
      await expect(page.getByTestId('allies-grid')).toContainText(armorName);
      const bodyFire = (line: string) => line.includes(armorName) && line.includes(english ? 'fire damage' : '火焰伤害');
      // More than three attempts requires a second scheduled body action.
      await expect.poll(async () => (await log.innerText()).split('\n').filter(bodyFire).length)
        .toBeGreaterThanOrEqual(4);
      const text = await log.innerText();
      expect(text.split('\n').filter(line => line.includes(name) && line.includes(english ? 'casts Hydra' : '施放了 九头海蛇')))
        .toHaveLength(1);
      expect(text.split('\n').filter(line => line.includes(name) && line.includes(english ? 'fire damage' : '火焰伤害')))
        .toEqual([]);
      await expect(log).toContainText(english ? '[Burn]' : '【燃烧】');
      await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
      const observed = await manaFrames.evaluate(handle => handle.read());
      await info.attach('mana-playback', { body: JSON.stringify(observed), contentType: 'application/json' });
      expect(observed.overflow).toBe(false);
      expect(observed.values).toContain(prepared.player.derivedStats.manaMax - 40);
    } finally {
      await manaFrames.evaluate(handle => { handle.disconnect(); });
      await manaFrames.dispose();
    }
    await info.attach('combat-log', { body: await log.innerText(), contentType: 'text/plain' });
    const bodyCard = page.getByTestId('allies-grid').locator('[data-testid^="unit-card-"]')
      .filter({ has: page.getByTestId('summon-badge') });
    await expect(bodyCard).toHaveCount(1);
    await expect(bodyCard).toContainText(armorName);
    await bodyCard.scrollIntoViewIfNeeded();
    await info.attach('hydra-body', { body: await bodyCard.screenshot(), contentType: 'image/png' });
    await info.attach('combat', { body: await page.screenshot(), contentType: 'image/png' });
    await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    const saved = await backup(page);
    expect(JSON.stringify(saved)).not.toMatch(/"hydraRank"|"hydras"|"summonTemplateId"|"activeBuffIds"/);
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

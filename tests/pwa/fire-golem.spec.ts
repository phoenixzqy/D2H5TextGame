/** Imported diagnostic characters prove public mechanics/persistence, not earned balance. */
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
for (const locale of ['en', 'zh-CN'] as const) {
  test(`Fire Golem public allocation/body/Burn/save/offline ${locale}`, async ({ page, context }, info) => {
    const english = locale === 'en', summonName = english ? 'Fire Golem' : '火焰石魔';
    const name = 'Golem Browser', errors: string[] = [], consoleErrors: string[] = [];
    const watch = (target: Page) => {
      target.on('pageerror', error => errors.push(error.message));
      target.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    };
    watch(page); await page.clock.setFixedTime(at);
    await page.goto('/'); await page.waitForLoadState('networkidle');
    await createCharacter(page, { class: 'necromancer', name });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const original = await backup(page);
    const rows = JSON.parse(await readFile(new URL('../../src/data/skills/necromancer.json', import.meta.url), 'utf8')) as
      { id: string; prerequisites?: string[] }[];
    const levels: Record<string, number> = {};
    const add = (id: string) => {
      if (levels[id]) return;
      const row = rows.find(value => value.id === id); if (!row) throw new Error('Missing native prerequisite');
      for (const ancestor of row.prerequisites ?? []) add(ancestor);
      levels[id] = 1;
    };
    add('skills-necromancer-fire-golem'); levels['skills-necromancer-fire-golem'] = 19;
    const cap: Item = { id: 'synthetic-fire-golem-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
      level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
      affixes: [{ affixId: 'synthetic-import', values: new Map([['statMods.life', 999880], ['statMods.mana', 1000]]) }] };
    const incoming = { ...original, player: { ...original.player, level: 30, skillPoints: 1,
      comboOrder: ['skills-necromancer-fire-golem'], skillLevels: levels },
      inventory: { ...original.inventory, backpack: [cap], equipped: original.inventory.equipped } };
    const importLabel = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(incoming, (_key, value: unknown) => value instanceof Map ? [...value] : value));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click(); await expect(dialog).toHaveCount(0);
    await navTo(page, 'inventory'); await page.getByTestId('inv-item-' + cap.id).click();
    await page.getByTestId('inv-primary-action').click(); await navTo(page, 'skills');
    await page.getByTestId('skill-node-skills-necromancer-fire-golem').click(); await page.mouse.move(0, 0);
    const panel = page.getByTestId('skill-detail-panel');
    await expect(panel.getByRole('heading', { name: summonName, exact: true })).toBeVisible();
    for (const phrase of english
      ? ['Fire damage', '10%', 'rounded down', 'minimum 1', '3 s', '5 stacks', 'refresh', 'whole batch', 'no retry']
      : ['火焰伤害', '10%', '向下取整', '最低1', '3 秒', '5层', '刷新', '整批', '不再重试'])
      await expect(panel).toContainText(phrase);
    await expect(panel).not.toContainText(/\{\{|undefined|NaN|details\.|combat:/);
    const current = panel.getByRole('heading', { name: english ? 'Current' : '当前', exact: true });
    const next = panel.getByRole('heading', { name: english ? 'Next Level' : '下一级', exact: true });
    await expect(current).toHaveCount(1); await expect(next).toHaveCount(1);
    const allocate = panel.getByRole('button', { name: english ? 'Allocate' : '分配', exact: true });
    const geometry: { width: number; height: number; allocationHeight: number; allocationWidth: number }[] = [];
    for (const [width, height] of [[360, 640], [412, 915], [640, 360], [1280, 800], [1920, 1080]] as const) {
      await page.setViewportSize({ width, height }); await page.mouse.move(0, 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const box = await allocate.boundingBox(); if (!box) throw new Error('Missing allocation control');
      expect(box.height).toBeGreaterThanOrEqual(44); expect(box.width).toBeGreaterThanOrEqual(44);
      geometry.push({ width, height, allocationHeight: box.height, allocationWidth: box.width });
    }
    await allocate.focus(); await expect(allocate).toBeFocused(); await allocate.press('Enter');
    await expect(panel).toContainText(english ? 'Lv. 20/20' : '等级 20/20');
    await expect(next.locator('..')).toContainText(english ? 'Max level reached.' : '已达到最高等级。');
    await expect(next.locator('..').locator('dl')).toHaveCount(0);
    await expect(panel.getByRole('button', { name: english ? 'Maxed' : '已满级', exact: true })).toBeDisabled();
    await page.setViewportSize(info.project.name.includes('mobile') ? { width: 360, height: 640 } : { width: 1280, height: 800 });
    await panel.getByRole('heading', { name: summonName, exact: true }).scrollIntoViewIfNeeded();
    await info.attach('fire-golem-title-viewport', { body: await page.screenshot(), contentType: 'image/png' });
    await current.scrollIntoViewIfNeeded();
    await info.attach('fire-golem-stats-viewport', { body: await page.screenshot(), contentType: 'image/png' });
    await info.attach('geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
    const prepared = await backup(page);
    expect(prepared.player.skillLevels?.['skills-necromancer-fire-golem']).toBe(20);
    expect(prepared.player.comboOrder).toEqual(['skills-necromancer-fire-golem']);
    // Observe only public DOM while the actual recording is played back.
    const observed = await page.evaluateHandle(({ manaLabel, bodyName, heroName, fire, cast, burn, chipName, dot }) => {
      const values: number[] = [], bodyFire: string[] = [], heroFire: string[] = [], casts: string[] = [], burns: string[] = [], dots: string[] = [];
      const seen = new WeakSet<Element>();
      let overflow = false, enemyChip: string | null = null;
      const append = (values: string[], value: string) => {
        if (values.length >= 64) overflow = true; else values.push(value);
      };
      const observer = new MutationObserver(() => {
        const bar = document.querySelector(`[data-testid="combat-screen"] [role="group"][aria-label="${manaLabel}"] [role="progressbar"]`);
        if (bar) {
          const value = Number(bar.getAttribute('aria-valuenow'));
          if (values.at(-1) !== value) { if (values.length >= 256) overflow = true; else values.push(value); }
        }
        for (const row of document.querySelectorAll('[data-testid="combat-log"] > div')) {
          if (seen.has(row)) continue;
          seen.add(row);
          const text = row.textContent ?? '';
          if (text.includes(dot) && /(?:takes |受到 )[1-9]\d*(?: damage over time\.| 点伤害)/.test(text)) append(dots, text);
          if (text.includes(bodyName) && text.includes(fire)) append(bodyFire, text);
          if (text.includes(heroName) && text.includes(fire)) append(heroFire, text);
          if (text.includes(heroName) && text.includes(cast)) append(casts, text);
          if (text.includes(burn)) append(burns, text);
        }
        if (enemyChip === null) for (const chip of document.querySelectorAll('[data-testid="enemies-grid"] [data-testid="unit-effect-chips"]')) {
          if (chip.textContent?.includes(chipName)) { enemyChip = chip.textContent; break; }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
      return { read: () => ({ values, bodyFire, heroFire, casts, burns, dots, enemyChip, overflow }), disconnect: () => { observer.disconnect(); } };
    }, { manaLabel: english ? 'MP' : '法力', bodyName: summonName, heroName: name,
      fire: english ? 'fire damage' : '火焰伤害', cast: english ? 'casts Fire Golem' : '施放了 火焰石魔',
      burn: english ? '[Burn]' : '【燃烧】', chipName: english ? 'Ignite' : '点燃', dot: english ? 'damage over time.' : '因持续伤害受到' });
    try {
      await navTo(page, 'map');
      // Actual Catacombs enemies survive the first hit, allowing periodic damage to be observed.
      await page.getByTestId('sub-area-row-a1-catacombs').getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
      await expect(page.getByTestId('allies-grid').getByTestId('summon-badge')).toHaveCount(1);
      await expect.poll(() => observed.evaluate(handle => handle.read().bodyFire.length), { timeout: 20_000 }).toBeGreaterThanOrEqual(2);
      await expect.poll(() => observed.evaluate(handle => handle.read().burns.length)).toBeGreaterThan(0);
      await expect.poll(() => observed.evaluate(handle => handle.read().dots.length)).toBeGreaterThan(0);
      await expect.poll(() => observed.evaluate(handle => handle.read().enemyChip)).toContain(english ? 'Ignite' : '点燃');
      await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
      const evidence = await observed.evaluate(handle => handle.read());
      expect(evidence.overflow).toBe(false); expect(evidence.casts).toHaveLength(1); expect(evidence.heroFire).toEqual([]);
      expect(evidence.values).toContain(prepared.player.derivedStats.manaMax - 35);
    } finally {
      await info.attach('paid-body-fire-burn', { body: JSON.stringify(await observed.evaluate(handle => handle.read())), contentType: 'application/json' });
      await observed.evaluate(handle => { handle.disconnect(); }); await observed.dispose();
    }
    const bodyCard = page.getByTestId('allies-grid').locator('[data-testid^="unit-card-"]')
      .filter({ has: page.getByTestId('summon-badge') });
    await expect(bodyCard).toHaveCount(1); await expect(bodyCard).toContainText(summonName);
    await bodyCard.scrollIntoViewIfNeeded();
    await info.attach('fire-golem-body', { body: await bodyCard.screenshot(), contentType: 'image/png' });
    await info.attach('combat-viewport', { body: await page.screenshot(), contentType: 'image/png' });
    await info.attach('combat-log', { body: await page.getByTestId('combat-log').innerText(), contentType: 'text/plain' });
    await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
    await navTo(page, 'settings'); await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    const saved = await backup(page);
    expect(saved.player.skillLevels).toEqual(prepared.player.skillLevels);
    expect(JSON.stringify(saved)).not.toMatch(/"fireGolemRank"|"fireGolems"|"summonTemplateId"|"activeBuffIds"/);
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
        for (const domain of ['player', 'inventory', 'map', 'mercs', 'formation', 'meta'] as const)
          expect(restored[domain]).toEqual(saved[domain]);
        await info.attach(offline ? 'offline-save-pair' : 'online-save-pair', { body: JSON.stringify({ saved, restored }), contentType: 'application/json' });
      } finally { await fresh.close(); }
    }
    expect(errors).toEqual([]); expect(consoleErrors).toEqual([]);
    await info.attach('console-errors', { body: JSON.stringify({ errors, consoleErrors }), contentType: 'application/json' });
  });
}

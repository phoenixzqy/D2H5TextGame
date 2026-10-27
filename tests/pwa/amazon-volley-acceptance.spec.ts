/** Constructed three-skill public fixture; no earned build/campaign/balance claim. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const at = new Date('2026-10-26T12:00:00Z'), character = 'Ama Volley Test';
const skills = [
  { slug: 'guided-arrow', en: 'Guided Arrow', zh: '导引箭', min: 70, max: 100, growth: 6 },
  { slug: 'multiple-shot', en: 'Multiple Shot', zh: '多重箭', min: 40, max: 60, growth: 4 },
  { slug: 'strafe', en: 'Strafe', zh: '扫射', min: 35, max: 55, growth: 4 }
] as const;
async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings'); const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click(); const download = await pending;
  try { const save = JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent;
    expect(save.version).toBe(22); return save;
  } finally { await download.delete(); }
}
for (const locale of ['en', 'zh-CN'] as const) test(`three Amazon volley skills use public MAX/cast/save/offline ${locale}`, async ({ page, context }, info) => {
  const english = locale === 'en', errors: string[] = [], consoleErrors: string[] = [];
  const watch = (target: Page) => {
    target.on('pageerror', error => errors.push(error.message));
    target.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') consoleErrors.push(message.text()); });
  };
  watch(page); await page.clock.setFixedTime(at); await page.goto('/'); await page.waitForLoadState('networkidle');
  await createCharacter(page, { class: 'amazon', name: character }); await navTo(page, 'settings');
  await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
  const original = await backup(page);
  expect(original.inventory.equipped.weapon?.baseId).toBe('items/base/weapon-bow-training');
  const cap: Item = { id: 'synthetic-amazon-volley-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
    level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
    affixes: [{ affixId: 'synthetic-import', values: new Map([['statMods.life', 999880], ['statMods.mana', 999000]]) }] };
  const levels = { 'skills-amazon-magic-arrow': 1,
    ...Object.fromEntries(skills.map(skill => ['skills-amazon-' + skill.slug, 19])) };
  const incoming = { ...original, player: { ...original.player, level: 90, skillPoints: 3, comboOrder: [], skillLevels: levels },
    inventory: { ...original.inventory, backpack: [...original.inventory.backpack, cap] } };
  const importLabel = english ? 'Import Save' : '导入存档';
  await page.getByRole('button', { name: importLabel, exact: true }).click(); const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill(JSON.stringify(incoming, (_key, value: unknown) => value instanceof Map ? [...value] : value));
  await dialog.getByRole('button', { name: importLabel, exact: true }).click(); await expect(dialog).toHaveCount(0);
  await navTo(page, 'inventory'); await page.getByTestId('inv-item-' + cap.id).click(); await page.getByTestId('inv-primary-action').click();
  const geometry: { slug: string; width: number; height: number; allocationWidth: number; allocationHeight: number }[] = [];
  await navTo(page, 'skills');
  for (const skill of skills) {
    const id = 'skills-amazon-' + skill.slug;
    await page.getByTestId('skill-node-' + id).focus(); await page.keyboard.press('Enter'); await page.mouse.move(0, 0);
    const panel = page.getByTestId('skill-detail-panel');
    const preview = (rank: number) => english
      ? `${String(skill.min + skill.growth * (rank - 1))}–${String(skill.max + skill.growth * (rank - 1))} base damage`
      : `${String(skill.min + skill.growth * (rank - 1))}～${String(skill.max + skill.growth * (rank - 1))} 点`;
    await expect(panel).toContainText(preview(19));
    const identity = skill.slug === 'guided-arrow' ? (english ? 'One guaranteed single-target Physical hit' : '对单个存活敌人必定命中一次')
      : skill.slug === 'multiple-shot' ? (english ? 'three-row widening cone (1, 3, then 5 cells)' : '每排1、3、5格')
        : (english ? '2 ordered passes' : '依次进行2轮攻击');
    await expect(panel).toContainText(identity);
    await expect(panel).not.toContainText('{{');
    const allocate = panel.getByRole('button', { name: english ? 'Allocate' : '分配', exact: true });
    for (const [width, height] of [[360, 640], [412, 915], [640, 360], [1280, 800], [1920, 1080]] as const) {
      await page.setViewportSize({ width, height }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await allocate.scrollIntoViewIfNeeded(); const box = await allocate.boundingBox(); if (!box) throw new Error('Missing allocation target');
      expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
      geometry.push({ slug: skill.slug, width, height, allocationWidth: box.width, allocationHeight: box.height });
    }
    await page.setViewportSize(info.project.name.includes('mobile') ? { width: 360, height: 640 } : { width: 1280, height: 800 });
    await allocate.click(); await expect(panel).toContainText(preview(20));
    await expect(panel).toContainText(english ? 'Max level reached.' : '已达到最高等级。');
    await panel.locator('h2').scrollIntoViewIfNeeded();
    await info.attach(skill.slug + '-preview', { body: await panel.screenshot(), contentType: 'image/png' });
  }
  const prepared = await backup(page);
  for (const skill of skills) expect(prepared.player.skillLevels?.['skills-amazon-' + skill.slug]).toBe(20);
  for (const skill of skills) {
    await navTo(page, 'skills'); await page.locator('#tab-active').click();
    const slot = page.getByRole('combobox', { name: /^(Slot 1|槽位 1)$/ });
    await slot.selectOption('skills-amazon-' + skill.slug); await expect(slot).toHaveValue('skills-amazon-' + skill.slug);
    const observed = await page.evaluateHandle(({ name, character }) => {
      let cast: string | null = null, hit: string | null = null;
      const enemyNames = new Set<string>();
      const observer = new MutationObserver(() => {
        for (const card of document.querySelectorAll('[data-testid="enemies-grid"] [data-testid^="unit-card-"]')) {
          const label = card.querySelector('img')?.alt ?? card.querySelector('[title]')?.getAttribute('title'); if (label) enemyNames.add(label);
        }
        let selectedAction = false;
        for (const row of document.querySelectorAll('[data-testid="combat-log"] > div')) {
          const text = row.lastElementChild?.textContent ?? '';
          if (text.includes(' casts ') || text.includes('施放了') || text.endsWith(' readies an attack.') || text.endsWith(' 准备出招。')) {
            selectedAction = text.startsWith(character) && text.includes(name);
            if (cast === null && selectedAction) cast = text;
          }
          if (hit === null && selectedAction && [character + ' attacks ', character + ' hits ', character + ' 普攻 ', character + ' 对 '].some(prefix => text.includes(prefix)) && (text.includes('physical') || text.includes('物理')) &&
            (/ for [1-9]\d* /.test(text) || /造成 [1-9]\d* 点/.test(text)) && [...enemyNames].some(enemy => text.includes(enemy))) hit = text;

        }
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      return { read: () => ({ cast, hit }), disconnect: () => { observer.disconnect(); } };
    }, { name: english ? skill.en : skill.zh, character });
    try {
      await navTo(page, 'map'); await page.getByTestId('sub-area-row-a1-catacombs').getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
      await expect.poll(async () => (await observed.evaluate(handle => handle.read())).cast).toContain(english ? skill.en : skill.zh);
      await expect.poll(async () => (await observed.evaluate(handle => handle.read())).hit).not.toBeNull();
      await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
      await info.attach(skill.slug + '-public-cast', { body: JSON.stringify(await observed.evaluate(handle => handle.read())), contentType: 'application/json' });
      await info.attach(skill.slug + '-combat', { body: await page.getByTestId('enemies-grid').screenshot(), contentType: 'image/png' });
      await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
    } finally { await observed.evaluate(handle => { handle.disconnect(); }); await observed.dispose(); }
  }
  await info.attach('geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
  await navTo(page, 'settings'); await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
  const saved = await backup(page); expect(saved.player.skillLevels).toEqual(prepared.player.skillLevels);
  expect(saved.player.comboOrder.filter(Boolean)).toEqual(['skills-amazon-strafe']);
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated'); await page.close();
  for (const offline of [false, true]) {
    await context.setOffline(offline); const fresh = await context.newPage(); watch(fresh);
    try {
      await fresh.clock.setFixedTime(at); const response = await fresh.goto('/'); expect(response?.ok()).toBe(true);
      if (offline) expect(response?.fromServiceWorker()).toBe(true);
      await fresh.getByTestId('home-continue').click(); const restored = await backup(fresh);
      for (const domain of ['endgame', 'player', 'inventory', 'map', 'mercs', 'formation', 'meta'] as const) expect(restored[domain]).toEqual(saved[domain]);
      await info.attach(offline ? 'offline-save-pair' : 'online-save-pair', { body: JSON.stringify({ saved, restored }), contentType: 'application/json' });
    } finally { await fresh.close(); }
  }
  expect(errors).toEqual([]); expect(consoleErrors).toEqual([]);
});

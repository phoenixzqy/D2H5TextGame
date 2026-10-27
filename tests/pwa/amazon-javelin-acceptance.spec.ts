/** Constructed four-skill public fixture; no earned build/campaign/balance claim. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const at = new Date('2026-10-26T12:00:00Z'), character = 'Ama Javelin Test';
const skills = [
  {slug:'power-strike',en:'Power Strike',zh:'力量攻击',min:40,max:60,growth:4},
  {slug:'charged-strike',en:'Charged Strike',zh:'充能一击',min:70,max:100,growth:6},
  {slug:'poison-javelin',en:'Poison Javelin',zh:'毒枪',min:20,max:35,growth:3},
  {slug:'lightning-strike',en:'Lightning Strike',zh:'雷霆一击',min:80,max:110,growth:7}
] as const;
async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings'); const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click(); const download = await pending;
  try { const save = JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent;
    expect(save.version).toBe(22); return save;
  } finally { await download.delete(); }
}
for (const locale of ['en', 'zh-CN'] as const) test(`four Amazon javelin skills use public MAX/cast/save/offline ${locale}`, async ({ page, context }, info) => {
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
  const cap: Item = { id: 'synthetic-amazon-javelin-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
    level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
    affixes: [{ affixId: 'synthetic-import', values: new Map([['statMods.life', 999880], ['statMods.mana', 999000]]) }] };
  const levels = { 'skills-amazon-jab':1,'skills-amazon-lightning-bolt':1,
    ...Object.fromEntries(skills.map(skill => ['skills-amazon-' + skill.slug, 19])) };
  const incoming = { ...original, player: { ...original.player, level: 90, skillPoints: 4, comboOrder: [], skillLevels: levels },
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
    const identity=skill.slug==='power-strike'?(english?'equal Physical and Lightning shares':'物理与闪电各占一半')
      :skill.slug==='charged-strike'?(english?'cross around the primary':'主目标周围的十字')
      :skill.slug==='poison-javelin'?(english?'3×3 impact cloud':'3×3冲击毒云')
      :(english?'nearest Manhattan neighbor':'曼哈顿距离最近');
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
    const observed = await page.evaluateHandle(({ name, character, poisonSkill, poisonName, paralyzeName }) => {
      let cast: string | null = null, hit: string | null = null, physical: string | null = null, poison: string | null = null, paralyze: string | null = null, dot: string | null = null;
      const enemyNames = new Set<string>();
      const observer = new MutationObserver(() => {
        for (const card of document.querySelectorAll('[data-testid="enemies-grid"] [data-testid^="unit-card-"]')) {
          const label = card.querySelector('img')?.alt ?? card.querySelector('[title]')?.getAttribute('title'); if (label) enemyNames.add(label);
          for(const chip of card.querySelectorAll('[data-testid="unit-effect-chips"] > [title]')) {
            const title=chip.getAttribute('title');
            if(poison===null&&title?.startsWith(poisonName))poison=title;
            if(paralyze===null&&title===paralyzeName)paralyze=title;
          }
        }
        let selectedAction = false;
        for (const row of document.querySelectorAll('[data-testid="combat-log"] > div')) {
          const text = row.lastElementChild?.textContent ?? '';
          if (text.includes(' casts ') || text.includes('施放了') || text.endsWith(' readies an attack.') || text.endsWith(' 准备出招。')) {
            selectedAction = text.startsWith(character) && text.includes(name);
            if (cast === null && selectedAction) cast = text;
          }
          if (hit === null && selectedAction && [character + ' attacks ', character + ' hits ', character + ' 普攻 ', character + ' 对 '].some(prefix => text.includes(prefix)) && (poisonSkill?(text.includes('poison')||text.includes('毒素')):(text.includes('lightning')||text.includes('闪电'))) &&
            (/ for [1-9]\d* /.test(text) || /造成 [1-9]\d* 点/.test(text)) && [...enemyNames].some(enemy => text.includes(enemy))) hit = text;
          if(physical===null&&selectedAction&&text.startsWith(character)&&[...enemyNames].some(enemy=>text.includes(enemy))&&
            (text.includes('physical')||text.includes('物理'))&&(/ for [1-9]\d* /.test(text)||/造成 [1-9]\d* 点/.test(text)))physical=text;
          if(dot===null&&cast!==null&&(/ takes [1-9]\d* damage over time\./.test(text)||/ 因持续伤害受到 [1-9]\d* 点伤害。/.test(text))&&
            [...enemyNames].some(enemy=>text.includes(enemy+' takes ')||text.includes(enemy+' 因持续伤害受到 ')))dot=text;

        }
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      return { read: () => ({ cast, hit, physical, poison, paralyze, dot }), disconnect: () => { observer.disconnect(); } };
    }, { name: english ? skill.en : skill.zh, character,poisonSkill:skill.slug==='poison-javelin',
      poisonName:english?'Poison':'中毒',paralyzeName:english?'Paralyze':'麻痹' });
    try {
      await navTo(page, 'map'); await page.getByTestId('sub-area-row-a1-catacombs').getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
      await expect.poll(async () => (await observed.evaluate(handle => handle.read())).cast).toContain(english ? skill.en : skill.zh);
      await expect.poll(async () => (await observed.evaluate(handle => handle.read())).hit).not.toBeNull();
      if(skill.slug==='power-strike')await expect.poll(async()=>(await observed.evaluate(handle=>handle.read())).physical).not.toBeNull();
      if(skill.slug==='poison-javelin') {
        await expect.poll(async()=>(await observed.evaluate(handle=>handle.read())).poison).not.toBeNull();
        await expect.poll(async()=>(await observed.evaluate(handle=>handle.read())).dot,{timeout:90_000}).not.toBeNull();
      }
      if(skill.slug==='lightning-strike')await expect.poll(async()=>(await observed.evaluate(handle=>handle.read())).paralyze).not.toBeNull();
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
  expect(saved.player.comboOrder.filter(Boolean)).toEqual(['skills-amazon-lightning-strike']);
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

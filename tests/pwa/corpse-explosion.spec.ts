/** Imported level/Teeth/points/survival gear/resources are unearned scaffolding. Native controls and production DOM only. */
import { expect, test, type Page, type TestInfo, type Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const SKILL = 'necromancer.corpse_explosion', NODE = 'skills-necromancer-corpse-explosion';
const TEETH = 'skills-necromancer-teeth', NAME = 'Corpse Proof';
const fixedTime = new Date('2026-10-21T12:00:00.055Z');
const sizes = [[360,640],[412,915],[640,360],[375,667],[393,851],[768,1024],[1280,800],[1920,1080],[915,412]] as const;
const copy = {
  en: { name: 'Corpse Explosion', teeth: 'Teeth', allocate: 'Allocate', current: 'Current', next: 'Next Level',
    damage: 'Fire attack', mana: 'Mana Cost', cooldown: 'Cooldown', statuses: 'Applies', effects: 'Ignite', seconds: '2 s', mp: 'MP',
    cast: `${NAME} casts Corpse Explosion.`, opening: `${NAME} casts Teeth.`,
    available: 'A fallen enemy leaves a corpse. Available: 1.', consumed: 'Corpse Explosion consumes a corpse. Remaining:',
    description: (min: number, max: number) => `Requires an enemy monster to die in this wave first. Consumes one shared corpse and 20 MP to deal ${String(min)}–${String(max)} Fire damage to all remaining enemies and apply Ignite on hit. Cooldown: 2 s. With no corpse, the combo skips this skill. Corpses clear between waves; consumption leaves normal kill rewards unchanged.` },
  'zh-CN': { name: '尸体爆炸', teeth: '尸牙', allocate: '分配', current: '当前', next: '下一级',
    damage: '火焰攻击', mana: '法力消耗', cooldown: '冷却', statuses: '附加', effects: '点燃', seconds: '2 秒', mp: '法力',
    cast: `${NAME} 施放了 尸体爆炸。`, opening: `${NAME} 施放了 尸牙。`,
    available: '敌人倒下，留下一具尸体。可用尸体：1。', consumed: '尸体爆炸消耗一具尸体。剩余尸体：',
    description: (min: number, max: number) => `需先有敌方怪物在本波战斗中死亡。每次消耗1具队伍共享尸体和20点法力，对所有存活敌人造成${String(min)}–${String(max)}点火焰伤害，命中时附加点燃。冷却：2 秒。没有尸体时连招跳过此技能。尸体在每波之间清空，消耗尸体不影响原有击杀奖励。` }
} as const;
interface Frame { at: number; mp: number; logs: string[]; monsters: { id: string; dead: boolean; hp: number }[] }
async function attach(info: TestInfo, name: string, value: unknown): Promise<void> {
  await info.attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });
}
async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}
async function importSave(page: Page, save: SaveCurrent, english: boolean): Promise<void> {
  await navTo(page, 'settings');
  const label = english ? 'Import Save' : '导入存档';
  await page.getByRole('button', { name: label, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill(JSON.stringify(save));
  await dialog.getByRole('button', { name: label, exact: true }).click();
  await expect(dialog).toHaveCount(0);
}
async function production(page: Page): Promise<void> {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function detail(page: Page): Promise<Locator> {
  await navTo(page, 'skills');
  await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
  await page.getByTestId(`skill-node-${NODE}`).click();
  await page.mouse.move(1, 1);
  return page.getByTestId('skill-detail-panel');
}
async function hitGrid(target: Locator): Promise<unknown[]> {
  await target.scrollIntoViewIfNeeded();
  const points = await target.evaluate(node => {
    const b = node.getBoundingClientRect();
    return [0.05,0.5,0.95].flatMap(x => [0.05,0.5,0.95].map(y => {
      const hit = document.elementFromPoint(b.left+b.width*x, b.top+b.height*y);
      return { x,y,clear: hit !== null && node.contains(hit) };
    }));
  });
  for (const point of points) expect(point).toMatchObject({ clear: true });
  return points;
}
async function pause(page: Page, english: boolean): Promise<void> {
  await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click({ timeout: 500 });
  await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }))
    .toHaveAttribute('aria-pressed', 'true');
}

async function combatSnapshot(page: Page) {
  // Router clicks can resolve before the combat screen remounts.
  await expect(page.getByTestId('combat-log')).toBeVisible();
  return {
    log: await page.getByTestId('combat-log').allTextContents(),
    cards: await page.locator('[data-testid^="unit-card-"]').allTextContents(),
    bars: await page.getByTestId('combat-screen').getByRole('progressbar').evaluateAll(nodes =>
      nodes.map(node => ({ now: node.getAttribute('aria-valuenow'), max: node.getAttribute('aria-valuemax') })))
  };
}
function section(panel: Locator, page: Page, name: string): Locator {
  return panel.locator('section').filter({ has: page.getByRole('heading', { name,exact: true }) });
}
/** Observes rendered output only; never reads or changes the game stores or clocks. */
async function observe(page: Page, mpLabel: string) {
  return page.evaluateHandle(label => {
    const frames: Frame[] = []; let previous = '', overflow = false;
    const sample = (): void => {
      const root = document.querySelector('[data-testid="combat-screen"]'); if (!root) return;
      const bar = root.querySelector(`[role="group"][aria-label="${label}"] [role="progressbar"]`);
      const state = { mp: Number(bar?.getAttribute('aria-valuenow')),
        logs: Array.from(root.querySelectorAll('[data-testid="combat-log"] > div > span:last-child'), node => node.textContent ?? ''),
        monsters: Array.from(root.querySelectorAll<HTMLElement>('[data-side-testid="combat-enemy-card"][data-kind="monster"]'), node => ({
          id: node.dataset.testid ?? '', dead: node.dataset.dead === 'true',
          hp: Number.parseFloat(node.querySelector<HTMLElement>('.bg-red-600')?.style.width ?? 'NaN') })) };
      const serialized = JSON.stringify(state); if (serialized === previous) return; previous = serialized;
      if (frames.length === 512) { overflow = true; return; }
      frames.push({ at: performance.now(), ...state });
    };
    const changes = new MutationObserver(sample);
    changes.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
    sample();
    return { read: () => ({ frames, overflow }), disconnect: () => changes.disconnect() };
  }, mpLabel);
}
function fire(line: string, english: boolean): boolean {
  const outgoing = english ? line.startsWith(`${NAME} attacks `) || line.startsWith(`CRITICAL! ${NAME} hits `)
    : line.startsWith(`${NAME} 普攻 `) || line.startsWith(`暴击！${NAME} 对 `);
  return outgoing && (english ? /for [1-9]\d* fire damage[.!]/ : /造成 [1-9]\d* 点火焰伤害[。！]/).test(line);
}
async function enter(page: Page, english: boolean): Promise<void> {
  await navTo(page, 'map');
  await page.getByTestId('sub-area-row-a1-blood-moor').getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
  await expect(page.getByTestId('combat-screen')).toBeVisible(); await pause(page, english);
}
for (const locale of ['en', 'zh-CN'] as const) {
  test(`finite CE native allocation, first kill, payment and reload ${locale}`, async ({ page: initial, context }, info) => {
    const english = locale === 'en', text = copy[locale], errors: string[] = [];
    const watch = (p: Page): void => {
      p.on('pageerror', error => errors.push(error.message));
      p.on('console', message => { if (['warning', 'error'].includes(message.type())) errors.push(`${message.type()}: ${message.text()}`); });
    };
    let page = initial; watch(page); await page.clock.setFixedTime(fixedTime); // Date only; native playback timers.
    try {
      await page.goto('/'); await createCharacter(page, { class: 'necromancer', name: NAME });
      await navTo(page, 'settings');
      await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
      const fresh = await backup(page);
      expect(fresh.player).toMatchObject({ class: 'necromancer', level: 1, skillPoints: 1 });
      const cap: Item = { id: 'fixture-ce-survival-cap', baseId: 'items/base/helm-cap',
        rarity: 'rare', level: 1, identified: true, equipped: true, equipSlot: 'head',
        affixes: [{ affixId: 'fixture-unearned-ce-survival', values: new Map([
          ['statMods.life', 1000000], ['statMods.defense', 1000000], ['statMods.mana', 10000]
        ]) }] };
      const eligible: SaveCurrent = { ...fresh, player: { ...fresh.player, level: 6, skillPoints: 2,
        skillLevels: { 'necromancer.teeth': 1 }, comboOrder: [TEETH],
        derivedStats: { ...fresh.player.derivedStats, life: 1000, lifeMax: 1000000, mana: 100, manaMax: 10000 } },
        inventory: { ...fresh.inventory, equipped: { ...fresh.inventory.equipped, head: cap } } };
      // Settings import is the only fixture boundary; nothing here is earned progression.
      const serializable = JSON.parse(JSON.stringify(eligible, (_key, value: unknown) => value instanceof Map ? [...value] : value)) as SaveCurrent;
      await importSave(page, serializable, english); const prepared = await backup(page);
      expect(prepared.player).toEqual(serializable.player); await attach(info, '01-unearned-fixture', { fresh, prepared });
      let panel = await detail(page); await expect(panel).toContainText(text.description(50, 80));
      await enter(page, english); const before = await combatSnapshot(page);
      for (const rank of [1, 2]) {
        panel = await detail(page); const allocate = panel.getByRole('button', { name: text.allocate, exact: true });
        await allocate.focus(); await expect(allocate).toBeFocused(); await page.keyboard.press('Enter');
        const min = rank === 1 ? 50 : 56, max = rank === 1 ? 80 : 86;
        const current = section(panel, page, text.current), next = section(panel, page, text.next);
        await expect(current.getByText(text.damage, { exact: true }).locator('+ dd')).toHaveText(`${String(min)} ~ ${String(max)}`);
        await expect(next.getByText(text.damage, { exact: true }).locator('+ dd')).toHaveText(`${String(min+6)} ~ ${String(max+6)}(+6 ~ +6)`);
        await expect(current.getByText(text.mana, { exact: true }).locator('+ dd')).toHaveText('20');
        await expect(current.getByText(text.cooldown, { exact: true }).locator('+ dd')).toHaveText(text.seconds);
        await expect(current.getByText(text.statuses, { exact: true }).locator('+ dd')).toHaveText(text.effects);
        await expect(panel).toContainText(text.description(min, max));
        const allocated = await backup(page);
        expect(allocated.player).toEqual({ ...prepared.player, skillPoints: 2-rank,
          skillLevels: { ...prepared.player.skillLevels, [SKILL]: rank } });
        await navTo(page, 'combat'); expect(await combatSnapshot(page)).toEqual(before);
        await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true })).toHaveAttribute('aria-pressed', 'true');
        await attach(info, `02-native-allocation-${String(rank)}`, { allocated, paused: before });
      }
      await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
      await navTo(page, 'skills'); await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
      const slot1 = page.getByRole('combobox', { name: english ? 'Slot 1' : '槽位 1', exact: true });
      const slot2 = page.getByRole('combobox', { name: english ? 'Slot 2' : '槽位 2', exact: true });
      const index = await slot1.locator('option').evaluateAll((options, id) => options.findIndex(option => option.getAttribute('value') === id), NODE);
      expect(index).toBeGreaterThan(0); await slot1.focus(); await page.keyboard.press('Home');
      for (let n = 0; n < index; n++) await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter'); await expect(slot1).toHaveValue(NODE);
      await slot2.selectOption(TEETH); await expect(slot2).toHaveValue(TEETH);
      const configured = await backup(page); expect(configured.player.comboOrder).toEqual([NODE, TEETH]);
      await enter(page, english); const observer = await observe(page, text.mp);
      try {
        const start = await observer.evaluate(handle => handle.read());
        expect(start.frames[0]?.monsters.length).toBeGreaterThanOrEqual(2);
        expect(start.frames[0]?.monsters.every(monster => !monster.dead && monster.hp > 0)).toBe(true);
        expect(start.frames[0]?.mp).toBeGreaterThanOrEqual(20);
        await page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }).click();
        await page.mouse.move(1, 1);
        await expect.poll(async () => (await observer.evaluate(handle => handle.read())).frames.some(frame => frame.logs.some(line => fire(line, english))),
          { timeout: 30_000, intervals: [50, 100] }).toBe(true);
        await pause(page, english);
        const observed = await observer.evaluate(handle => handle.read()), frames = observed.frames;
        await attach(info, '03-native-ordinal1-complete-DOM-timeline', { fixedTime, expectedManualOrdinal: 1,
          history: ['fresh module ordinal0: enter allocation wave', 'flee', 'combo CE/Teeth', 'enter observed wave ordinal1'], observed });
        expect(observed.overflow).toBe(false);
        const castIndex = frames.findIndex(frame => frame.logs.includes(text.cast)), cast = frames[castIndex];
        expect(castIndex).toBeGreaterThan(0); expect(cast).toBeDefined();
        if (!cast) throw new Error('CE action missing from native DOM timeline');
        const castRow = cast.logs.indexOf(text.cast), supplyRow = cast.logs.indexOf(text.available);
        const deathRow = cast.logs.findIndex(line => english ? line.endsWith(' falls.') : line.endsWith(' 倒下了。'));
        expect(cast.logs.find(line => line.startsWith(`${NAME} ${english ? 'casts' : '施放了'}`))).toBe(text.opening);
        expect(deathRow).toBeGreaterThanOrEqual(0); expect(supplyRow).toBeGreaterThan(deathRow); expect(castRow).toBeGreaterThan(supplyRow);
        expect(cast.monsters.some(monster => monster.dead)).toBe(true);
        expect(cast.monsters.some(monster => !monster.dead && monster.hp > 0)).toBe(true);
        const debitIndex = frames.findIndex((frame, n) => n > castIndex && frame.mp !== cast.mp), debit = frames[debitIndex];
        expect(debit).toBeDefined(); expect(debit?.mp).toBe(cast.mp - 20); expect(debit?.logs).toEqual(cast.logs);
        const consumedIndex = frames.findIndex(frame => frame.logs.some(line => line.startsWith(text.consumed)));
        expect(consumedIndex).toBeGreaterThan(debitIndex);
        const remaining = frames[consumedIndex]?.logs.find(line => line.startsWith(text.consumed))?.match(/\d+/)?.[0];
        const supply = cast.logs.filter(line => line.startsWith(english ? 'A fallen enemy leaves a corpse.' : '敌人倒下，留下一具尸体。')).at(-1)?.match(/\d+/)?.[0];
        expect(supply).toBeDefined(); expect(remaining).toBeDefined(); expect(Number(remaining)).toBe(Number(supply) - 1);
        const fireIndex = frames.findIndex(frame => frame.logs.some(line => fire(line, english)));
        expect(fireIndex).toBeGreaterThan(consumedIndex); await production(page);
        await info.attach('04-native-first-explosion', { body: await page.screenshot(), contentType: 'image/png' });
      } finally {
        await attach(info, '03-final-DOM-timeline-including-failures', await observer.evaluate(handle => handle.read()));
        await observer.evaluate(handle => handle.disconnect()); await observer.dispose();
      }
      await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
      panel = await detail(page); const metrics = [];
      const viewports = info.project.name === 'corpse-desktop' ? sizes : [[360, 640]] as const;
      for (const [width, height] of viewports) {
        await page.setViewportSize({ width, height }); const controls = [];
        for (const target of [page.getByTestId(`skill-node-${NODE}`), panel.getByRole('button')]) {
          await target.scrollIntoViewIfNeeded(); const bounds = await target.boundingBox(); expect(bounds).not.toBeNull();
          expect(bounds?.width).toBeGreaterThanOrEqual(44); expect(bounds?.height).toBeGreaterThanOrEqual(44);
          controls.push({ bounds, hits: await hitGrid(target) });
        }
        const description = panel.getByText(text.description(56, 86), { exact: true }); await description.scrollIntoViewIfNeeded();
        await expect(description).toBeVisible(); const font = await description.evaluate(node => getComputedStyle(node).fontSize);
        expect(Number.parseFloat(font)).toBeGreaterThanOrEqual(14); await production(page);
        await info.attach(`detail-${String(width)}x${String(height)}`, { body: await page.screenshot(), contentType: 'image/png' });
        metrics.push({ width, height, font, controls });
      }
      await attach(info, '05-layout-metrics', metrics);
      const saved = await backup(page);
      expect(saved.player.skillLevels?.[SKILL]).toBe(2); expect(saved.player.comboOrder).toEqual([NODE, TEETH]);
      await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
      await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
      await page.close(); page = await context.newPage(); watch(page); await page.clock.setFixedTime(fixedTime);
      await page.goto('/'); await page.getByTestId('home-continue').click();
      await expect(page.getByTestId('town-screen')).toBeVisible();
      const loaded = await backup(page); expect(loaded).toEqual(saved);
      await attach(info, '06-exact-save-newpage-continue', { saved, loaded });
      panel = await detail(page); await expect(panel).toContainText(text.description(56, 86));
      await enter(page, english);
      await page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }).click();
      await page.mouse.move(1, 1);
      await expect(page.getByTestId('combat-log')).toContainText(text.opening, { timeout: 5000 });
      await pause(page, english);
      const freshWave = await page.getByTestId('combat-log').innerText();
      expect(freshWave).not.toContain(text.cast); expect(freshWave).not.toContain(text.consumed);
      expect(freshWave).not.toContain(english ? ' falls.' : ' 倒下了。');
      expect(freshWave).not.toContain(english ? 'A fallen enemy leaves a corpse.' : '敌人倒下，留下一具尸体。');
      const freshMonsters = page.locator('[data-side-testid="combat-enemy-card"][data-kind="monster"]');
      expect(await freshMonsters.count()).toBeGreaterThan(0);
      await expect(freshMonsters.locator('[data-dead="true"]')).toHaveCount(0);
      const living = await freshMonsters.evaluateAll(nodes => nodes.every(node => node.getAttribute('data-dead') !== 'true'
        && Number.parseFloat(node.querySelector<HTMLElement>('.bg-red-600')?.style.width ?? 'NaN') > 0));
      expect(living).toBe(true);
      await attach(info, '07-fresh-ordinal0-predeath-control', { expectedManualOrdinal: 0, freshWave, living });
      await attach(info, '08-console-errors', errors); expect(errors).toEqual([]); await production(page);
    } finally { await page.close(); }
  });
}

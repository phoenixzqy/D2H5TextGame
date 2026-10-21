/** Imported L6/points/gear/resources scaffold; native allocations and ordinary production DOM. */
import { expect, test, type Page, type TestInfo, type Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const SKILL = 'druid.raven', NODE = 'skills-druid-raven', NAME = 'Paid Ravens';
const fixedTime = new Date('2026-10-21T12:00:00.055Z');
const sizes = [[360,640],[412,915],[640,360],[375,667],[393,851],[768,1024],[1280,800],[1920,1080],[915,412]] as const;
const copy = {
  en: { name: 'Raven', allocate: 'Allocate', current: 'Current', next: 'Next Level',
    mana: 'Mana Cost', cap: 'Summon Cap', mp: 'MP',
    description: 'Raven: once at each wave start, if learned, unlocked and in your combo, fill missing living summons up to 2 for one payment of 6 MP for the whole batch. Already full: no cost. Not enough mana: no summons or payment, and no retry that wave. This skill uses no ordinary action; fallen summons are not replaced and return no mana. Each new wave starts with fresh summons, paid from your carried mana.' },
  'zh-CN': { name: '乌鸦', allocate: '分配', current: '当前', next: '下一级',
    mana: '法力消耗', cap: '召唤上限', mp: '法力',
    description: '乌鸦：已学习、已解锁并编入连招时，每波开始仅准备一次，以整批共 6 点法力补足存活召唤物，最多 2 名。已满员不消耗法力；法力不足则不召唤、不扣费，本波不再重试。此技能不占常规行动，召唤物阵亡不补召、不返还法力。新一波召唤物重新生成，从继承的法力中重新付费。' }
} as const;
interface Frame { mp: number; max: number; ravens: { id: string; lifeWidth: string }[]; logs: string[] }
async function attach(info: TestInfo, name: string, value: unknown): Promise<void> {
  await info.attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });
}
async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download'); await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}
async function production(page: Page): Promise<void> {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function detail(page: Page): Promise<Locator> {
  await navTo(page, 'skills');
  await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
  await page.getByTestId(`skill-node-${NODE}`).click(); await page.mouse.move(1, 1);
  return page.getByTestId('skill-detail-panel');
}
async function pause(page: Page, english: boolean): Promise<void> {
  await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click({ timeout: 500 });
  await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true })).toHaveAttribute('aria-pressed', 'true');
}
async function combatSnapshot(page: Page) {
  return { log: await page.getByTestId('combat-log').allTextContents(),
    cards: await page.locator('[data-testid^="unit-card-"]').allTextContents(),
    bars: await page.getByTestId('combat-screen').getByRole('progressbar').evaluateAll(nodes =>
      nodes.map(node => ({ now: node.getAttribute('aria-valuenow'), max: node.getAttribute('aria-valuemax') }))) };
}
async function hitGrid(target: Locator) {
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
function section(panel: Locator, page: Page, name: string): Locator {
  return panel.locator('section').filter({ has: page.getByRole('heading', { name,exact: true }) });
}
for (const locale of ['en','zh-CN'] as const) {
  test(`paid Raven native allocation, startup, disk reload and layouts ${locale}`, async ({ page: initial, context }, info) => {
    const english = locale === 'en', text = copy[locale], errors: string[] = [];
    const watch = (p: Page): void => {
      p.on('pageerror', error => errors.push(error.message));
      p.on('console', message => { if (['warning','error'].includes(message.type())) errors.push(`${message.type()}: ${message.text()}`); });
    };
    let page = initial; watch(page); await page.clock.setFixedTime(fixedTime); // Date only, native timers.
    try {
      await page.goto('/'); await createCharacter(page,{ class: 'druid',name: NAME });
      await navTo(page,'settings');
      await page.getByRole('button',{ name: english ? 'English' : '简体中文',exact: true }).click();
      const fresh = await backup(page);
      expect(fresh.player).toMatchObject({ class: 'druid',level: 1,skillPoints: 1 });
      const cap: Item = { id: 'fixture-paid-raven-cap',baseId: 'items/base/helm-cap',
        rarity: 'rare',level: 1,identified: true,equipped: true,equipSlot: 'head',
        affixes: [{ affixId: 'fixture-imported-survival-mana',values: new Map([
          ['statMods.life',999810],['statMods.mana',900],['statMods.defense',99958]
        ]) }] };
      // Explicitly imported eligibility/survival scaffold; no earned progression or balance claim.
      const eligible: SaveCurrent = { ...fresh,player: { ...fresh.player,level: 6,skillPoints: 2,
        skillLevels: {},comboOrder: [],derivedStats: { ...fresh.player.derivedStats,
          life: 900000,lifeMax: 1000000,mana: 300,manaMax: 1000,attack: 30,defense: 100000,attackSpeed: 120 } },
        inventory: { ...fresh.inventory,equipped: { ...fresh.inventory.equipped,head: cap } } };
      const importLabel = english ? 'Import Save' : '导入存档';
      await page.getByRole('button',{ name: importLabel,exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('textbox').fill(JSON.stringify(eligible, (_key,value: unknown) => value instanceof Map ? [...value] : value));
      await dialog.getByRole('button',{ name: importLabel,exact: true }).click(); await expect(dialog).toHaveCount(0);
      const prepared = await backup(page); expect(prepared.player).toEqual(eligible.player);
      await attach(info,'01-imported-eligibility-and-gear',{ fresh,prepared });
      await navTo(page,'map');
      await page.getByTestId('sub-area-row-a1-blood-moor').getByRole('button',{ name: english ? 'Enter' : '进入',exact: true }).click();
      await expect(page.getByTestId('combat-screen')).toBeVisible(); await pause(page,english);
      const before = await combatSnapshot(page); expect(before.cards.length).toBeGreaterThan(1);
      expect(await page.locator('[data-kind="summon"]').count()).toBe(0);
      await attach(info,'02-paused-wave-before-allocation',before);
      for (const rank of [1,2]) {
        const panel = await detail(page), allocate = panel.getByRole('button',{ name: text.allocate,exact: true });
        await allocate.focus(); await expect(allocate).toBeFocused(); await page.keyboard.press('Enter');
        const current = section(panel,page,text.current), next = section(panel,page,text.next);
        await expect(current.getByText(text.cap,{ exact: true }).locator('+ dd')).toHaveText(String(rank));
        await expect(current.getByText(text.mana,{ exact: true }).locator('+ dd')).toHaveText('6');
        await expect(next.getByText(text.cap,{ exact: true }).locator('+ dd')).toHaveText(`${String(rank+1)}(+1)`);
        await expect(next.getByText(text.mana,{ exact: true }).locator('+ dd')).toHaveText('6');
        if (rank === 2) await expect(panel).toContainText(text.description);
        const allocated = await backup(page);
        expect(allocated.player).toEqual({ ...prepared.player,skillPoints: 2-rank,skillLevels: { [SKILL]: rank } });
        await navTo(page,'combat');
        await expect(page.getByRole('button',{ name: english ? 'Resume' : '继续',exact: true })).toHaveAttribute('aria-pressed','true');
        const after = await combatSnapshot(page); expect(after).toEqual(before);
        await attach(info,`03-native-allocation-${String(rank)}`,{ allocated,after });
      }
      await navTo(page,'skills'); await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
      const slot = page.getByRole('combobox',{ name: english ? 'Slot 1' : '槽位 1',exact: true });
      await expect(slot).toHaveValue(''); await expect(slot.locator(`option[value="${NODE}"]`)).toHaveCount(1);
      await slot.selectOption(NODE); await expect(slot).toHaveValue(NODE); // Explicit native combo replay.
      const observer = await page.evaluateHandle(mpLabel => {
        const frames: Frame[] = []; let previous = '', overflow = false;
        const sample = (): void => {
          const root = document.querySelector('[data-testid="combat-screen"]'); if (!root) return;
          const bar = root.querySelector(`[role="group"][aria-label="${mpLabel}"] [role="progressbar"]`);
          const frame: Frame = { mp: Number(bar?.getAttribute('aria-valuenow')),max: Number(bar?.getAttribute('aria-valuemax')),
            ravens: Array.from(root.querySelectorAll<HTMLElement>('[data-testid^="unit-card-"][data-testid*="-summon-raven-"]'),node => ({
              id: node.dataset.testid ?? '',lifeWidth: node.querySelector<HTMLElement>('.bg-red-600')?.style.width ?? '' })),
            logs: Array.from(root.querySelectorAll('[data-testid="combat-log"] > div > span:last-child'),node => node.textContent ?? '').slice(-8) };
          const serialized = JSON.stringify(frame); if (serialized === previous) return; previous = serialized;
          if (frames.length === 128) { overflow = true; return; } frames.push(frame);
        };
        const changes = new MutationObserver(sample);
        changes.observe(document.body,{ childList: true,subtree: true,attributes: true,characterData: true });
        return { read: () => ({ frames,overflow }),disconnect: () => changes.disconnect() };
      },text.mp);
      try {
        await navTo(page,'combat');
        const ravens = page.locator('[data-testid^="unit-card-"][data-testid*="-summon-raven-"]');
        await expect(ravens).toHaveCount(2,{ timeout: 1500 }); await pause(page,english);
        const observation = await observer.evaluate(handle => handle.read());
        await attach(info,'04-ordinary-DOM-paid-two-raven-startup',observation);
        expect(observation.overflow).toBe(false);
        expect(observation.frames.some(frame => frame.mp === 300 && frame.max === 1000 && frame.ravens.length === 0)).toBe(true);
        const batch = observation.frames.find(frame => frame.ravens.length === 2);
        expect(batch).toBeDefined(); expect(batch).toMatchObject({ mp: 294,max: 1000 });
        expect(new Set(batch?.ravens.map(raven => raven.id)).size).toBe(2);
        expect(batch?.ravens.map(raven => raven.lifeWidth)).toEqual(['100%','100%']);
        const cast = english ? `${NAME} casts Raven.` : `${NAME} 施放了 乌鸦。`;
        const summon = english ? `${NAME} summons Raven.` : `${NAME} 召唤了 乌鸦。`;
        expect(batch?.logs.filter(line => line === cast)).toHaveLength(1);
        expect(batch?.logs.filter(line => line === summon)).toHaveLength(2);
        expect(batch?.logs[0]).toBe(english ? 'Turn 1 begins' : '第 1 回合开始');
        await production(page);
      } finally { await observer.evaluate(handle => handle.disconnect()); await observer.dispose(); }
      await page.getByRole('button',{ name: english ? 'Flee' : '逃跑',exact: true }).click();
      const panel = await detail(page), metrics = [];
      await expect(panel).toContainText(text.description);
      for (const [width,height] of sizes) {
        await page.setViewportSize({ width,height }); const controls = [];
        for (const target of [page.getByTestId(`skill-node-${NODE}`),panel.getByRole('button')]) {
          await target.scrollIntoViewIfNeeded(); const bounds = await target.boundingBox(); expect(bounds).not.toBeNull();
          expect(bounds?.width).toBeGreaterThanOrEqual(44); expect(bounds?.height).toBeGreaterThanOrEqual(44);
          controls.push({ bounds,hits: await hitGrid(target) });
        }
        const description = panel.getByText(text.description,{ exact: true });
        await description.scrollIntoViewIfNeeded(); await expect(description).toBeVisible();
        const font = await description.evaluate(node => getComputedStyle(node).fontSize);
        expect(Number.parseFloat(font)).toBeGreaterThanOrEqual(14); await production(page);
        const headingHits = await hitGrid(panel.getByRole('heading',{ name: text.name,exact: true }));
        if (!english && width === 360) {
          const cdp = await context.newCDPSession(page);
          try {
            await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); const doc = await cdp.send('DOM.getDocument');
            const node = await cdp.send('DOM.querySelector',{ nodeId: doc.root.nodeId,
              selector: '[data-testid="skill-detail-panel"] #skill-detail-panel > p' });
            const fonts = await cdp.send('CSS.getPlatformFontsForNode',{ nodeId: node.nodeId });
            await attach(info,'05-actual-Chinese-fonts',fonts);
            expect(fonts.fonts.some(f => f.familyName === 'Noto Sans CJK SC' && f.glyphCount > 0)).toBe(true);
          } finally { await cdp.detach(); }
        }
        if (width === 360 || width === 1280) await info.attach(`detail-${String(width)}x${String(height)}`,{ body: await page.screenshot(),contentType: 'image/png' });
        metrics.push({ width,height,font,controls,headingHits });
      }
      await attach(info,'05-finite-layout-metrics',metrics); await page.setViewportSize({ width: 1280,height: 800 });
      const saved = await backup(page);
      expect(saved.player).toEqual({ ...prepared.player,skillPoints: 0,skillLevels: { [SKILL]: 2 },comboOrder: [NODE] });
      await page.getByRole('button',{ name: english ? 'Save' : '保存',exact: true }).click();
      await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
      await page.close(); page = await context.newPage(); watch(page); await page.clock.setFixedTime(fixedTime);
      await page.goto('/'); await page.getByTestId('home-continue').click(); await expect(page.getByTestId('town-screen')).toBeVisible();
      const loaded = await backup(page); expect(loaded).toEqual(saved);
      await attach(info,'06-explicit-save-close-newpage-continue',{ saved,loaded });
      await expect(await detail(page)).toContainText(text.description);
      await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
      await expect(page.getByRole('combobox',{ name: english ? 'Slot 1' : '槽位 1',exact: true })).toHaveValue(NODE);
      await attach(info,'07-console-errors',errors); expect(errors).toEqual([]); await production(page);
    } finally { await page.close(); }
  });
}

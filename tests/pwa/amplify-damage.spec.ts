/** Imported ranks/points are scaffolding, not earned campaign evidence. */
import { expect, test, type Page, type TestInfo, type Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const SKILL = 'necromancer.amplify_damage';
const NODE = 'skills-necromancer-amplify-damage';
const TEETH = 'skills-necromancer-teeth';
const NAME = 'Amplify Proof';
const fixedTime = new Date('2026-10-21T12:00:00.055Z');
const sizes = [[360,640],[412,915],[640,360],[375,667],[393,851],[768,1024],[1280,800],[1920,1080],[915,412]] as const;
const copy = {
  en: { name: 'Amplify Damage', allocate: 'Allocate', current: 'Current', next: 'Next Level',
    mana: 'Mana Cost', cooldown: 'Cooldown', statuses: 'Applies', seconds: '3 s',
    description: 'Curses all living enemies, reducing physical resistance by 50 percentage points for 3 s at every skill rank.' },
  'zh-CN': { name: '加强伤害', allocate: '分配', current: '当前', next: '下一级',
    mana: '法力消耗', cooldown: '冷却', statuses: '附加', seconds: '3 秒',
    description: '诅咒所有存活敌人，使物理抗性降低50个百分点，持续3 秒，各技能等级相同。' }
} as const;
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
for (const locale of ['en','zh-CN'] as const) {
  test(`Amplify Damage native allocation, combo, disk reload and layouts ${locale}`, async ({ page: initial, context }, info) => {
    const english = locale === 'en', text = copy[locale], errors: string[] = [];
    const watch = (p: Page): void => {
      p.on('pageerror', error => errors.push(error.message));
      p.on('console', message => { if (['warning','error'].includes(message.type())) errors.push(`${message.type()}: ${message.text()}`); });
    };
    let page = initial; watch(page);
    await page.clock.setFixedTime(fixedTime);
    try {
      await page.goto('/'); await createCharacter(page,{ class: 'necromancer',name: NAME });
      await navTo(page,'settings');
      await page.getByRole('button',{ name: english ? 'English' : '简体中文',exact: true }).click();
      const fresh = await backup(page);
      expect(fresh.player).toMatchObject({ class: 'necromancer',level: 1,skillPoints: 1 });
      // Imported eligibility is display scaffolding; all allocations below use native UI.
      const eligible: SaveCurrent = { ...fresh,player: { ...fresh.player,level: 1,skillPoints: 2,
        skillLevels: { 'necromancer.teeth': 1 },
        comboOrder: [TEETH] } };
      await importSave(page,eligible,english); const prepared = await backup(page);
      expect(prepared.player).toEqual(eligible.player); await attach(info,'01-imported-eligibility',{ fresh,prepared });
      let panel = await detail(page);
      await expect(panel).toContainText(text.description);
      await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
      for (let index=1;index<=9;index++) {
        const slot=page.getByRole('combobox',{ name: `${english ? 'Slot' : '槽位'} ${String(index)}`,exact: true });
        await expect(slot.locator(`option[value="${NODE}"]`)).toHaveCount(0);
      }
      const inspected = await backup(page); expect(inspected.player).toEqual(prepared.player);
      await navTo(page,'map');
      await page.getByTestId('sub-area-row-a1-blood-moor').getByRole('button',{ name: english ? 'Enter' : '进入',exact: true }).click();
      await expect(page.getByTestId('combat-screen')).toBeVisible(); await pause(page,english);
      const before = await combatSnapshot(page); expect(before.cards.length).toBeGreaterThan(1);
      await attach(info,'02-native-paused-wave-before-allocation',before);
      for (const rank of [1,2]) {
        panel = await detail(page);
        const allocate = panel.getByRole('button',{ name: text.allocate,exact: true });
        await allocate.focus(); await expect(allocate).toBeFocused(); await page.keyboard.press('Enter');
        const current=section(panel,page,text.current),next=section(panel,page,text.next);
        await expect(current.getByText(text.mana,{ exact: true }).locator('+ dd')).toHaveText('15');
        await expect(current.getByText(text.cooldown,{ exact: true }).locator('+ dd')).toHaveText(text.seconds);
        await expect(next.getByText(text.mana,{ exact: true }).locator('+ dd')).toHaveText('15');
        await expect(next.getByText(text.cooldown,{ exact: true }).locator('+ dd')).toContainText(rank === 1 ? text.seconds : `2.9 ${english ? 's' : '秒'}`);
        await expect(current.getByText(text.statuses,{ exact: true }).locator('+ dd')).toHaveText(text.name);
        await expect(panel).toContainText(text.description);
        const allocated=await backup(page);
        expect(allocated.player).toEqual({ ...prepared.player,skillPoints: 2-rank,
          skillLevels: { ...prepared.player.skillLevels,[SKILL]: rank } });
        await navTo(page,'combat');
        await expect(page.getByRole('button',{ name: english ? 'Resume' : '继续',exact: true })).toHaveAttribute('aria-pressed','true');
        const after=await combatSnapshot(page); expect(after).toEqual(before);
        await attach(info,`03-native-allocation-${String(rank)}`,{ allocated,after });
      }
      await page.getByRole('button',{ name: english ? 'Flee' : '逃跑',exact: true }).click();
      panel=await detail(page); const metrics=[];
      for (const [width,height] of sizes) {
        await page.setViewportSize({ width,height });
        const controls=[];
        for (const target of [page.getByTestId(`skill-node-${NODE}`),panel.getByRole('button')]) {
          await target.scrollIntoViewIfNeeded(); const bounds=await target.boundingBox(); expect(bounds).not.toBeNull();
          expect(bounds?.width).toBeGreaterThanOrEqual(44); expect(bounds?.height).toBeGreaterThanOrEqual(44);
          controls.push({ bounds,hits: await hitGrid(target) });
        }
        const description=panel.getByText(text.description,{ exact: true });
        await description.scrollIntoViewIfNeeded(); await expect(description).toBeVisible();
        const font=await description.evaluate(node=>getComputedStyle(node).fontSize);
        expect(Number.parseFloat(font)).toBeGreaterThanOrEqual(14); await production(page);
        const headingHits=await hitGrid(panel.getByRole('heading',{ name: text.name,exact: true }));
        if (!english && width===360) {
          const cdp=await context.newCDPSession(page);
          try {
            await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); const doc=await cdp.send('DOM.getDocument');
            const node=await cdp.send('DOM.querySelector',{ nodeId: doc.root.nodeId,
              selector: '[data-testid="skill-detail-panel"] #skill-detail-panel > p' });
            const fonts=await cdp.send('CSS.getPlatformFontsForNode',{ nodeId: node.nodeId });
            await attach(info,'04-actual-Chinese-fonts',fonts);
            expect(fonts.fonts.some(f=>f.familyName==='Noto Sans CJK SC' && f.glyphCount>0)).toBe(true);
          } finally { await cdp.detach(); }
        }
        await info.attach(`detail-${String(width)}x${String(height)}`,{ body: await page.screenshot(),contentType: 'image/png' });
        metrics.push({ width,height,font,controls,headingHits });
      }
      await attach(info,'04-finite-layout-metrics',metrics); await page.setViewportSize({ width: 1280,height: 800 });
      await navTo(page,'skills'); await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
      const slot1=page.getByRole('combobox',{ name: english ? 'Slot 1' : '槽位 1',exact: true });
      const slot2=page.getByRole('combobox',{ name: english ? 'Slot 2' : '槽位 2',exact: true });
      await expect(slot1).toHaveValue(TEETH); await expect(slot2.locator(`option[value="${NODE}"]`)).toHaveCount(1);
      // Native select keys; read the option index so both localized labels use the same path.
      const amplifyIndex=await slot2.locator('option').evaluateAll((options,id)=>
        options.findIndex(option=>option.getAttribute('value')===id),NODE);
      expect(amplifyIndex).toBeGreaterThan(0);
      await slot2.focus(); await page.keyboard.press('Home');
      for (let index=0;index<amplifyIndex;index++) await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(slot2).toHaveValue(NODE);
      await slot2.selectOption(''); await expect(slot2).toHaveValue('');
      await slot2.selectOption(NODE); await expect(slot1).toHaveValue(TEETH);
      const saved=await backup(page);
      expect(saved.player).toEqual({ ...prepared.player,skillPoints: 0,
        skillLevels: { ...prepared.player.skillLevels,[SKILL]: 2 },comboOrder: [TEETH,NODE] });
      await page.getByRole('button',{ name: english ? 'Save' : '保存',exact: true }).click();
      await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
      await page.close(); page=await context.newPage(); watch(page); await page.clock.setFixedTime(fixedTime);
      await page.goto('/'); await page.getByTestId('home-continue').click(); await expect(page.getByTestId('town-screen')).toBeVisible();
      const loaded=await backup(page); expect(loaded).toEqual(saved);
      await attach(info,'05-save-saved-close-newpage-continue',{ saved,loaded });
      panel=await detail(page); await expect(panel).toContainText(text.description);
      await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
      await expect(page.getByRole('combobox',{ name: english ? 'Slot 1' : '槽位 1',exact: true })).toHaveValue(TEETH);
      await expect(page.getByRole('combobox',{ name: english ? 'Slot 2' : '槽位 2',exact: true })).toHaveValue(NODE);
      await attach(info,'06-console-errors',errors); expect(errors).toEqual([]); await production(page);
    } finally { await page.close(); }
  });
}

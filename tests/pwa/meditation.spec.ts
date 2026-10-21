/** Imported L24/prerequisites/ranks/stats are scaffolding, not earned campaign evidence. */
import { expect, test, type Page, type TestInfo, type Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const AURA = 'paladin.meditation';
const NODE = 'skills-paladin-meditation';
const HOLY = 'skills-paladin-holy-bolt';
const NAME = 'Meditation Proof';
const fixedTime = new Date('2026-10-21T12:00:00.055Z');
const sizes = [[360,640],[412,915],[640,360],[375,667],[393,851],[768,1024],[1280,800],[1920,1080],[915,412]] as const;
const copy = {
  en: { aura: 'Aura for next wave', none: 'None', might: 'Might', meditation: 'Meditation',
    allocate: 'Allocate', current: 'Current', next: 'Next Level', regen: 'Mana Regeneration',
    description: 'Selected aura: adds 3% of your normal mana regeneration per second per allocated rank to you and your living fielded mercenary (up to 60% at rank 20). Each recipient retains their own normal recovery. Unlocks at character level 24.' },
  'zh-CN': { aura: '下一波光环', none: '无', might: '力量', meditation: '冥想',
    allocate: '分配', current: '当前', next: '下一级', regen: '法力恢复',
    description: '选择此光环后：每投入1点技能点，每秒为自身与存活的上阵佣兵额外恢复相当于角色自身正常法力恢复速度3%的法力（最多20点，合计60%）。各自原有的正常恢复仍然生效。角色24级解锁。' }
} as const;
interface DOMSample { readonly mp: string | null; readonly log: string[] }
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
function durable(save: SaveCurrent): void {
  expect(JSON.stringify(save)).not.toMatch(/"meditationAura"|"sourceBaselinePerSecond"|"manaRegenPerSecond"|"manaRegenCarry"|"manaRegenExactCarry"|"manaRegenCompensation"|"carryPlayerTeam"|"mightAura"/);
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
/** Observe only rendered output. No game bridge, hidden state, timer mutation or DOM action injection. */
async function firstAction(page: Page, english: boolean, selected: boolean, info: TestInfo): Promise<DOMSample[]> {
  const capture = await page.getByTestId('combat-screen').evaluateHandle((screen, mpLabel) => {
    const samples: DOMSample[] = [];
    const sample = () => {
      const next = { mp: screen.querySelector(`[role="group"][aria-label="${mpLabel}"] [role="progressbar"]`)
        ?.getAttribute('aria-valuenow') ?? null,
        log: [...screen.querySelectorAll('[data-testid="combat-log"] > div > span:last-child')]
          .map(line => line.textContent ?? '') };
      if (JSON.stringify(samples.at(-1)) !== JSON.stringify(next)) samples.push(next);
    };
    sample(); const observer = new MutationObserver(sample);
    observer.observe(screen, { subtree: true, childList: true, attributes: true, characterData: true });
    return { observer,samples };
  }, english ? 'MP' : '法力');
  try {
    await page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }).click();
    await expect.poll(async () => (await page.getByTestId('combat-log')
      .locator(':scope > div > span:last-child').allTextContents()).some(line => line.startsWith(`${NAME} `)),
    { timeout: 10_000, intervals: [20] }).toBe(true);
    if (selected) {
      const cast = english ? `${NAME} casts Holy Bolt.` : `${NAME} 施放了 神圣箭。`;
      // Cast log precedes the separate payment event. Observe the real debit before pausing.
      await expect.poll(() => capture.evaluate(({ samples }, line) =>
        samples.some(sample => sample.mp === '0' && sample.log.includes(line)), cast),
      { timeout: 10_000, intervals: [20] }).toBe(true);
    }
    await pause(page, english);
    return await capture.evaluate(({ observer,samples }) => { observer.disconnect(); return samples; });
  } catch (error) {
    await attach(info,'first-action-failure-samples', await capture.evaluate(({ samples }) => samples));
    throw error;
  } finally { await capture.evaluate(({ observer }) => { observer.disconnect(); }); await capture.dispose(); }
}

for (const locale of ['en','zh-CN'] as const) {
  test(`Meditation native selection, disk reload, layouts and additional cast ${locale}`, async ({ page: initial, context }, info) => {
    const english = locale === 'en', text = copy[locale];
    const errors: string[] = [];
    const watch = (p: Page): void => {
      p.on('pageerror', error => errors.push(error.message));
      p.on('console', message => { if (['warning','error'].includes(message.type())) errors.push(`${message.type()}: ${message.text()}`); });
    };
    let page = initial; watch(page);
    await page.clock.setFixedTime(fixedTime); // Date only; native simulation/playback timers run normally.
    await page.goto('/'); await createCharacter(page, { class: 'paladin', name: NAME });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const fresh = await backup(page);
    expect(fresh.player).toMatchObject({ class: 'paladin',level: 1,skillPoints: 1 });
    await detail(page);
    const group = () => page.getByRole('group', { name: text.aura, exact: true });
    const radio = (name: string) => group().getByRole('radio', { name,exact: true });
    await expect(radio(text.meditation)).toBeDisabled(); await expect(radio(text.none)).toBeChecked();
    await page.getByTestId('skill-node-skills-paladin-might').click();
    await page.getByTestId('skill-detail-panel').getByRole('button', { name: text.allocate,exact: true }).click();
    await expect(radio(text.might)).toBeEnabled(); await expect(radio(text.meditation)).toBeDisabled();
    await expect(radio(text.none)).toBeChecked();
    const nativeMight = await backup(page);
    expect(nativeMight.player.level).toBe(1); expect(nativeMight.player.skillPoints).toBe(0);
    expect(nativeMight.player.skillLevels?.['paladin.might']).toBe(1);
    expect(nativeMight.player).not.toHaveProperty('selectedAuraId');
    expect(nativeMight.player.derivedStats).toEqual(fresh.player.derivedStats);
    await attach(info,'00-native-fresh-Might-independent-unlock', { fresh,nativeMight });
    // Explicit imported eligibility and baseline4; no earned-unlock or campaign claim.
    const eligible: SaveCurrent = { ...fresh, player: { ...fresh.player,level: 24,skillPoints: 2,
      coreStats: { ...fresh.player.coreStats,energy: 20 },
      derivedStats: { ...fresh.player.derivedStats,life: 334,lifeMax: 334,mana: 6,manaMax: 172,
        attack: 68,defense: 89,attackSpeed: 120 },
      skillLevels: { 'paladin.holy_bolt': 1,'paladin.prayer': 1,'paladin.cleansing': 1,'paladin.might': 1 },
      comboOrder: [HOLY] } };
    await importSave(page,eligible,english);
    const prepared = await backup(page); expect(prepared.player).toEqual(eligible.player); durable(prepared);
    await attach(info,'01-explicit-imported-eligibility', { fresh,prepared });
    try {
      for (const rank of [1,2]) {
        const panel = await detail(page);
        await expect(radio(text.might)).toBeEnabled();
        await panel.getByRole('button', { name: text.allocate,exact: true }).click();
        await expect(radio(text.none)).toBeChecked(); // Learning/upgrading never selects.
        const current = panel.locator('section').filter({ has: page.getByRole('heading', { name: text.current,exact: true }) });
        const next = panel.locator('section').filter({ has: page.getByRole('heading', { name: text.next,exact: true }) });
        await expect(current.getByText(text.regen, { exact: true }).locator('+ dd')).toHaveText(`${String(rank*3)}%`);
        await expect(next.getByText(text.regen, { exact: true }).locator('+ dd')).toHaveText(`${String((rank+1)*3)}%(+3%)`);
        await expect(panel).toContainText(text.description);
      }
      const beforeSelection = await backup(page); await navTo(page,'skills');
      await expect(group().getByRole('radio')).toHaveCount(3);
      // Native radio keyboard behavior: focus None by ordinary click, then arrows wrap backward.
      await radio(text.none).click();
      for (const name of [text.meditation,text.might,text.none]) {
        await page.keyboard.press('ArrowLeft'); await expect(radio(name)).toBeFocused();
        await expect(radio(name)).toBeChecked();
        await expect(group().locator('input:checked')).toHaveCount(1);
      }
      const afterSelection = await backup(page); expect(afterSelection.player).toEqual(beforeSelection.player);
      expect(afterSelection.player).not.toHaveProperty('selectedAuraId');
      await attach(info,'02-keyboard-exclusive-no-resource-change', { beforeSelection,afterSelection });
      await navTo(page,'skills'); await radio(text.meditation).click();
      const panel = await detail(page); const metrics = [];
      for (const [width,height] of sizes) {
        await page.setViewportSize({ width,height });
        const controls = [];
        for (const name of [text.none,text.might,text.meditation]) {
          const label = radio(name).locator('..'); await label.scrollIntoViewIfNeeded();
          const bounds = await label.boundingBox(); expect(bounds).not.toBeNull();
          expect(bounds?.width).toBeGreaterThanOrEqual(44); expect(bounds?.height).toBeGreaterThanOrEqual(44);
          controls.push({ name,bounds,hits: await hitGrid(label) });
        }
        await production(page);
        await info.attach(`aura-${String(width)}x${String(height)}`, { body: await page.screenshot(),contentType: 'image/png' });
        const description = panel.getByText(text.description, { exact: true }); await description.scrollIntoViewIfNeeded();
        const font = await description.evaluate(node => getComputedStyle(node).fontSize);
        expect(Number.parseFloat(font)).toBeGreaterThanOrEqual(14); await expect(description).toBeVisible();
        const headingHits = await hitGrid(panel.getByRole('heading', { name: text.meditation,exact: true }));
        if (!english && width === 360) {
          const cdp = await context.newCDPSession(page);
          try {
            await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
            const doc = await cdp.send('DOM.getDocument');
            const node = await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId,
              selector: '[data-testid="skill-detail-panel"] #skill-detail-panel > p' });
            const fonts = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: node.nodeId });
            await attach(info,'03-actual-Chinese-fonts',fonts);
            expect(fonts.fonts.some(f => f.familyName === 'Noto Sans CJK SC' && f.glyphCount > 0)).toBe(true);
          } finally { await cdp.detach(); }
        }
        await info.attach(`detail-${String(width)}x${String(height)}`, { body: await page.screenshot(),contentType: 'image/png' });
        metrics.push({ width,height,font,controls,headingHits });
      }
      await attach(info,'03-finite-layout-metrics',metrics);
      await page.setViewportSize({ width: 1280,height: 800 });
      await navTo(page,'skills'); await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
      for (let index=1;index<=9;index++) {
        const slot = page.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} ${String(index)}`,exact: true });
        await expect(slot).toHaveValue(index===1 ? HOLY : '');
        await expect(slot.locator(`option[value="${AURA}"],option[value="${NODE}"]`)).toHaveCount(0);
      }
      const saved = await backup(page); expect(saved.player.selectedAuraId).toBe(AURA);
      expect(saved.player.skillLevels?.[AURA]).toBe(2); expect(saved.player.skillPoints).toBe(0); durable(saved);
      expect(saved.player.derivedStats).toEqual(prepared.player.derivedStats);
      await page.getByRole('button', { name: english ? 'Save' : '保存',exact: true }).click();
      await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
      await page.close(); page = await context.newPage(); watch(page); await page.clock.setFixedTime(fixedTime);
      await page.goto('/'); await page.getByTestId('home-continue').click(); await expect(page.getByTestId('town-screen')).toBeVisible();
      const loaded = await backup(page);
      expect(loaded.player).toEqual(saved.player); expect(loaded.inventory).toEqual(saved.inventory);
      expect(loaded.mercs).toEqual(saved.mercs); expect(loaded.map).toEqual(saved.map);
      expect(loaded.formation).toEqual(saved.formation); expect(loaded.meta).toEqual(saved.meta);
      expect(loaded).toEqual(saved); durable(loaded);
      await attach(info,'04-explicit-save-close-newpage-continue', { saved,loaded });
      await navTo(page,'skills'); await expect(radio(text.meditation)).toBeChecked();
      // Paired low-mana input: rank20 is imported scaffolding, not native earned rank20.
      const { selectedAuraId: discarded, ...unselected } = loaded.player; expect(discarded).toBe(AURA);
      const paired: SaveCurrent = { ...loaded,player: { ...unselected,
        skillLevels: { ...loaded.player.skillLevels,[AURA]: 20 },
        derivedStats: { ...prepared.player.derivedStats,mana: 6 } } };
      const timelines: Record<string,DOMSample[]> = {};
      let originalEncounter: string[] | undefined;
      for (const selected of [false,true]) {
        // A full new page resets the native module-local challenge ordinal to zero.
        await page.close(); page = await context.newPage(); watch(page); await page.clock.setFixedTime(fixedTime);
        await page.goto('/'); await page.getByTestId('home-continue').click();
        await expect(page.getByTestId('town-screen')).toBeVisible();
        const input: SaveCurrent = { ...paired,player: { ...paired.player,...(selected ? { selectedAuraId: AURA } : {}) } };
        await importSave(page,input,english); const verified = await backup(page);
        expect(verified.player).toEqual(input.player); await attach(info,`05-paired-input-${String(selected)}`,verified);
        await navTo(page,'map');
        await page.getByTestId('sub-area-row-a1-blood-moor').getByRole('button', { name: english ? 'Enter' : '进入',exact: true }).click();
        await expect(page.getByTestId('combat-screen')).toBeVisible(); await pause(page,english);
        const encounter = await page.getByTestId('combat-screen').locator('[data-testid^="unit-card-"]').allTextContents();
        expect(encounter.length).toBeGreaterThan(1);
        if (originalEncounter) expect(encounter).toEqual(originalEncounter); else originalEncounter = encounter;
        await attach(info,`05-first-native-encounter-${String(selected)}`, { fixedTime: fixedTime.toISOString(),encounter });
        const samples = await firstAction(page,english,selected,info); timelines[String(selected)] = samples;
        await attach(info,`06-first-action-${String(selected)}`,samples);
        const basic = english ? `${NAME} readies an attack.` : `${NAME} 准备出招。`;
        const cast = english ? `${NAME} casts Holy Bolt.` : `${NAME} 施放了 神圣箭。`;
        // 1540ms: None 6+floor(4*1.54)=12; Meditation20 6+floor(6.4*1.54)=15.
        const action = selected ? cast : basic, recovered = selected ? '15' : '12';
        const ready = samples.findIndex(s => s.mp===recovered && !s.log.some(line => line.startsWith(`${NAME} `)));
        expect(ready,`recovered ${recovered} before the first hero action`).toBeGreaterThanOrEqual(0);
        const acted = samples.findIndex((s,index) => index>ready && s.log.includes(action));
        expect(acted).toBeGreaterThan(ready);
        if (selected) expect(samples.some((s,index) => index>ready && s.mp==='0' && s.log.includes(cast))).toBe(true);
        else expect(samples.slice(0,acted+1).some(s => s.log.includes(cast))).toBe(false);
        await production(page);
        await page.getByRole('button', { name: english ? 'Flee' : '逃跑',exact: true }).click();
      }
      await attach(info,'07-paired-native-consequence',timelines);
      await attach(info,'08-console-errors',errors); expect(errors).toEqual([]); await production(page);
    } finally { await page.close(); }
  });
}

/** Production layout regression; explicitly imported L30/bonus eligibility, no game bridge. */
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { navTo } from '../e2e/_helpers';

const MASTERY = 'skills-sorceress-lightning-mastery';
const sizes = [[360,640],[412,915],[640,360],[375,667],[393,851],[768,1024],[1280,800],[1920,1080],[915,412]] as const;

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
  const label = english ? 'Import Save' : '导入存档';
  await page.getByRole('button', { name: label, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill(JSON.stringify(save));
  await dialog.getByRole('button', { name: label, exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

/** Read-only edge/center hit tests catch partial obstruction that toBeVisible misses. */
async function hitPoints(target: Locator): Promise<unknown[]> {
  return target.evaluate(node => {
    const b = node.getBoundingClientRect();
    return [0.05, 0.5, 0.95].flatMap(x => [0.05, 0.5, 0.95].map(y => {
      const px = b.left + b.width * x, py = b.top + b.height * y;
      const hit = document.elementFromPoint(px, py);
      return { x: px, y: py, clear: hit !== null && node.contains(hit), hit: hit?.tagName ?? null,
        hitText:hit?.textContent?.slice(0,120) ?? null, hitTestId:hit?.closest('[data-testid]')?.getAttribute('data-testid') ?? null };
    }));
  });
}

async function clearTarget(target: Locator, label: string): Promise<unknown[]> {
  await target.scrollIntoViewIfNeeded();
  const points = await hitPoints(target);
  for (const point of points) expect.soft(point, label).toMatchObject({ clear: true });
  return points;
}

async function layout(page: Page, bonus: boolean): Promise<unknown> {
  const measured = await page.evaluate(() => {
    const main = document.querySelector('main');
    const hud = document.querySelector('[data-testid="character-hud"]');
    const chip = document.querySelector('[data-testid="offline-bonus-chip"]');
    const header = main?.previousElementSibling;
    if (!main || !hud || !header) throw new Error('Expected main, HUD and screen header');
    const rect = (node: Element) => {
      const b = node.getBoundingClientRect();
      return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height };
    };
    const h = rect(header), m = rect(main), u = rect(hud), c = chip ? rect(chip) : null;
    const contains = (a: typeof h, b: typeof h) => b.left >= a.left && b.right <= a.right && b.top >= a.top && b.bottom <= a.bottom;
    const targets = [...document.querySelectorAll('[data-testid="skill-detail-panel"] h2, [data-testid="skill-detail-panel"] button')].map(node => {
      const b = rect(node);
      const visible = { left: Math.max(b.left,m.left), right: Math.min(b.right,m.right), top: Math.max(b.top,m.top), bottom: Math.min(b.bottom,m.bottom) };
      const shown = visible.right > visible.left && visible.bottom > visible.top;
      const overlaps = (a: typeof h) => shown && visible.left < a.right && visible.right > a.left && visible.top < a.bottom && visible.bottom > a.top;
      return { text: node.textContent, rect:b, visible, shown, hudCollision: overlaps(u), chipCollision: c !== null && overlaps(c) };
    });
    return { header: h, main: m, hud: u, chip: c, hudContained: contains(h,u), chipContained: c === null || contains(h,c),
      mainBelowHud: m.top >= u.bottom, mainBelowChip: c === null || m.top >= c.bottom,
      chipBelowButton: c === null || c.top >= u.bottom, chipOutsideButton: chip === null || !hud.contains(chip),
      documentOverflow: document.documentElement.scrollWidth - innerWidth,
      mainOverflow: main.scrollWidth - main.clientWidth, windowY: scrollY,
      shellY: main.parentElement?.parentElement?.scrollTop, mainY: main.scrollTop,
      mainScrollHeight: main.scrollHeight, mainClientHeight: main.clientHeight, targets };
  });
  expect.soft(measured.hudContained, 'header reserves actual HUD height').toBe(true);
  expect.soft(measured.chipContained, 'header reserves active bonus chip height').toBe(true);
  expect.soft(measured.mainBelowHud, 'main cannot scroll under HUD').toBe(true);
  expect.soft(measured.mainBelowChip, 'main cannot scroll under chip').toBe(true);
  expect.soft(measured.chipBelowButton).toBe(true);
  expect.soft(measured.chipOutsideButton).toBe(true);
  expect.soft(measured.documentOverflow).toBeLessThanOrEqual(0);
  expect.soft(measured.mainOverflow).toBeLessThanOrEqual(0);
  expect.soft(measured.windowY).toBe(0); expect.soft(measured.shellY).toBe(0);
  expect.soft(measured.hud.width).toBeGreaterThanOrEqual(44);
  expect.soft(measured.hud.height).toBeGreaterThanOrEqual(44);
  expect.soft(measured.main.height).toBeGreaterThan(0);
  expect.soft(measured.chip !== null).toBe(bonus);
  for (const target of measured.targets) {
    expect.soft(target.hudCollision, 'visible detail remains clear of HUD at original scroll position').toBe(false);
    expect.soft(target.chipCollision, 'visible detail remains clear of active chip at original scroll position').toBe(false);
  }
  return measured;
}

for (const locale of ['en','zh-CN'] as const) for (const bonus of [false,true]) {
  test(`shared header stays clear ${locale} bonus=${String(bonus)}`, async ({ page, context }, info) => {
    const english = locale === 'en';
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`); });
    await page.goto('/settings');
    await expect(page.getByTestId('character-hud')).toHaveCount(0);
    await page.goto('/');
    await expect(page.getByTestId('character-hud')).toHaveCount(0);
    await page.getByTestId('home-new-game').click();
    await expect(page.getByTestId('character-hud')).toHaveCount(0);
    await page.getByTestId('class-sorceress').click();
    const name = english ? 'MMMMMMMMMMMMMMMM' : '闪'.repeat(16);
    await page.getByTestId('character-name-input').fill(name);
    await page.getByTestId('character-start-btn').click();
    await expect(page.getByTestId('town-screen')).toBeVisible();
    await navTo(page,'settings');
    const language = page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true });
    await language.click();
    await expect(language).toHaveAttribute('aria-pressed','true');
    const fresh = await backup(page);
    expect(fresh.player.name).toBe(name);
    const incoming: SaveCurrent = { ...fresh, player: { ...fresh.player, level: 30, skillPoints: 2,
      skillLevels: { 'sorceress.fire_bolt': 1 }, comboOrder: ['skills-sorceress-fire-bolt'] },
      meta: { ...fresh.meta, idleState: { ...fresh.meta.idleState, lastOnline: Date.now(),
        activeMultiplier: bonus ? 1.5 : 1, multiplierSecondsRemaining: bonus ? 7200 : 0 } } };
    await importSave(page, incoming, english);
    await attach(info, '01-imported-eligibility', incoming);

    for (const route of ['town','settings','skills']) {
      await navTo(page, route);
      await expect(page.getByTestId('character-hud')).toHaveCount(1);
      await expect(page.getByTestId('character-hud')).toHaveAccessibleName(new RegExp(name));
      await attach(info, `route-${route}`, await layout(page,bonus));
    }
    const panel = page.getByTestId('skill-detail-panel');
    await page.getByTestId(`skill-node-${MASTERY}`).click();
    // Keep the ordinary pointer outside preview nodes while layout changes beneath it.
    await page.mouse.move(1,1);
    const heading = panel.getByRole('heading', { name: english ? 'Lightning Mastery' : '闪电精通', exact: true });
    const allocate = panel.getByRole('button');
    const description = panel.locator('#skill-detail-panel > p');
    const metrics = [];
    for (const [width,height] of sizes) {
      await page.setViewportSize({ width,height });
      await description.scrollIntoViewIfNeeded();
      const originalPosition = await layout(page,bonus);
      if (width === 360 && height === 640) {
        expect.soft(await page.locator('main').evaluate(node => node.scrollTop), 'baseline detail scrolls inside main').toBeGreaterThan(0);
      }
      await info.attach(`layout-${String(width)}x${String(height)}`, { body: await page.screenshot(), contentType: 'image/png' });
      const headingHits = await clearTarget(heading,`${String(width)}x${String(height)} heading`);
      const actionHits = await clearTarget(allocate,`${String(width)}x${String(height)} Allocate`);
      if (!english && width === 360) {
        const cdp = await context.newCDPSession(page);
        try {
          await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
          const document = await cdp.send('DOM.getDocument');
          const node = await cdp.send('DOM.querySelector',{ nodeId: document.root.nodeId, selector: '[data-testid="skill-detail-panel"] #skill-detail-panel > p' });
          const fonts = await cdp.send('CSS.getPlatformFontsForNode',{ nodeId: node.nodeId });
          expect(fonts.fonts.some(font => font.familyName === 'Noto Sans CJK SC' && font.glyphCount > 0)).toBe(true);
          await attach(info,'actual-Chinese-platform-fonts',fonts);
        } finally { await cdp.detach(); }
      }
      metrics.push({ width,height,originalPosition,headingHits,actionHits });
    }
    await attach(info,'02-layout-metrics',metrics);

    await page.setViewportSize({ width:375,height:667 });
    await description.scrollIntoViewIfNeeded();
    await expect(allocate).toHaveText(english ? 'Allocate' : '分配');
    await allocate.click(); // Ordinary pointer; Playwright must resolve the actual target.
    await expect(panel).toContainText(english ? 'Lv. 1/20' : '等级 1/20');
    const rank1 = await backup(page);
    expect(rank1.player).toEqual({ ...incoming.player, skillPoints:1,
      skillLevels:{ 'sorceress.fire_bolt':1,'sorceress.lightning_mastery':1 } });
    await navTo(page,'skills');
    await page.getByTestId(`skill-node-${MASTERY}`).click();
    await page.mouse.move(1,1);
    await page.setViewportSize({ width:915,height:412 });
    let reached = false;
    for (let step=0;step<100;step++) {
      await page.keyboard.press('Tab');
      if (await allocate.evaluate(node => node === document.activeElement)) { reached=true;break; }
    }
    expect(reached).toBe(true);
    await expect(heading).toBeVisible();
    await expect(allocate).toHaveText(english ? 'Allocate' : '分配');
    await expect(allocate).toBeEnabled(); await expect(allocate).toBeFocused();
    await clearTarget(allocate,'keyboard target');
    await page.keyboard.press('Enter');
    await expect(panel).toContainText(english ? 'Lv. 2/20' : '等级 2/20');
    const rank2 = await backup(page);
    expect(rank2.player).toEqual({ ...rank1.player,skillPoints:0,
      skillLevels:{ 'sorceress.fire_bolt':1,'sorceress.lightning_mastery':2 } });
    for (const slice of ['inventory','mercs','map','formation'] as const) expect(rank2[slice]).toEqual(incoming[slice]);
    await attach(info,'03-pointer-keyboard-allocation',{ rank1,rank2 });

    // Let the actual export status dismiss before opening the unrelated dialog.
    await expect(page.getByRole('status')).toHaveCount(0);
    // Real dialog remains above the shared header, including with an active chip.
    const label = english ? 'Import Save' : '导入存档';
    await page.getByRole('button',{ name:label,exact:true }).click();
    const modalPriority = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return [...document.querySelectorAll('[data-testid="character-hud"], [data-testid="offline-bonus-chip"]')].flatMap(node => {
        const b = node.getBoundingClientRect();
        return [0.05,0.5,0.95].flatMap(x => [0.05,0.5,0.95].map(y => {
          const px=b.left+b.width*x, py=b.top+b.height*y;
          const hit=document.elementFromPoint(px,py);
          return { target:node.getAttribute('data-testid'),x:px,y:py,modalOwnsHit:hit !== null && dialog !== null && dialog.contains(hit) };
        }));
      });
    });
    await attach(info,'modal-priority-at-header',modalPriority);
    expect(modalPriority).toHaveLength(bonus ? 18 : 9);
    for (const point of modalPriority) expect.soft(point).toMatchObject({ modalOwnsHit:true });
    const cancel = page.getByRole('dialog').getByRole('button',{ name:english ? 'Cancel' : '取消',exact:true });
    await attach(info,'modal-cancel-hits',await clearTarget(cancel,'modal cancel')); await cancel.click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('character-screen')).toBeVisible();
    await expect(page.getByTestId('character-hud')).toHaveCount(0);
    await navTo(page,'combat');
    await expect(page.getByTestId('combat-screen')).toBeVisible();
    await expect(page.getByTestId('character-hud')).toHaveCount(0);
    const combatHeader = page.getByTestId('combat-screen').locator('header');
    const width = await combatHeader.evaluate(node => ({ outer:node.clientWidth,inner:node.firstElementChild?.getBoundingClientRect().width }));
    expect(width.inner).toBeGreaterThanOrEqual(width.outer - 32);
    await navTo(page,'skills');
    await expect(page.getByTestId('character-hud')).toHaveCount(1);
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    await attach(info,'04-console-errors',errors); expect(errors).toEqual([]);
    await page.close();
  });
}

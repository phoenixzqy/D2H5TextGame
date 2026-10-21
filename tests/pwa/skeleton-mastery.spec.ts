/** Explicit imported extra L1 point; production UI and actual Settings Save/disk reload only. */
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';
const MASTERY = 'skills-necromancer-skeleton-mastery';
const RAISE = 'skills-necromancer-raise-skeleton';
const sizes = [[360,640],[412,915],[640,360],[375,667],[393,851],[768,1024],[1280,800],[1920,1080],[915,412]] as const;
const prose = {
  en: 'Passive: Newly created skeleton warriors and mages gain +4% maximum life, +2% Attack and +1% ordinary Defense per allocated skill rank (up to +80%/+40%/+20% at rank 20). Unlocks at character level 1.',
  'zh-CN': '被动：每投入1点技能点，新召唤的骷髅战士和骷髅法师最大生命+4%、攻击+2%、普通防御+1%（最多20点，合计+80%/+40%/+20%）。角色1级解锁。'
};
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
async function production(page: Page): Promise<void> {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
function durable(save: SaveCurrent): void {
  expect(JSON.stringify(save)).not.toMatch(/"increasedDamagePct"|"manaRegenPerSecond"|"manaRegenCarry"|"manaRegenExactCarry"|"manaRegenCompensation"|"activeBuffIds"|"frozenArmor"|"carryPlayerTeam"|"skeletonMastery"|"summonLifePct"|"summonAttackPct"|"summonDefensePct"|"summonTemplateId"/);
}
async function slots(page: Page, english: boolean): Promise<void> {
  await navTo(page, 'skills');
  await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
  for (let index = 1; index <= 9; index++) {
    const slot = page.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} ${String(index)}`, exact: true });
    await expect(slot).toHaveValue(index === 1 ? RAISE : '');
    await expect(slot.locator(`option[value="${MASTERY}"]`)).toHaveCount(0);
    await expect(slot.locator('option')).toHaveCount(2); // Empty and the only learned active, Raise Skeleton.
  }
}
/** Read-only edge/center hits catch occlusion beyond mere DOM visibility. */
async function clearHits(target: import('@playwright/test').Locator): Promise<unknown[]> {
  await target.scrollIntoViewIfNeeded();
  const points = await target.evaluate(node => {
    const b = node.getBoundingClientRect();
    return [0.05, 0.5, 0.95].flatMap(x => [0.05, 0.5, 0.95].map(y => {
      const px = b.left + b.width * x, py = b.top + b.height * y;
      const hit = document.elementFromPoint(px, py);
      return { x: px, y: py, clear: hit !== null && node.contains(hit) };
    }));
  });
  for (const point of points) expect(point).toMatchObject({ clear: true });
  return points;
}
async function selectSkeletonMastery(page: Page): Promise<void> {
  await navTo(page, 'skills');
  await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
  await page.getByTestId(`skill-node-${MASTERY}`).click();
  await page.mouse.move(1, 1); // Keep pointer clear of tree previews during resize/scroll.
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`Skeleton Mastery imported eligibility, bilingual layouts and disk reload ${locale}`, async ({ page: initial, context }, info) => {
    const english = locale === 'en';
    const errors: string[] = [];
    const watch = (p: Page): void => {
      p.on('pageerror', error => errors.push(error.message));
      p.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`); });
    };
    let page = initial; watch(page);
    await page.goto('/');
    await createCharacter(page, { class: 'necromancer', name: 'Skeleton Mastery' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const fresh = await backup(page);
    expect(fresh.player).toMatchObject({ level: 1, skillPoints: 1, class: 'necromancer' });
    expect(fresh.player.comboOrder).toEqual(['necromancer.raise_skeleton']);
    await selectSkeletonMastery(page);
    await expect(page.getByTestId('skill-detail-panel').getByRole('button', { name: english ? 'Allocate' : '分配', exact: true })).toBeEnabled();
    await expect(page.getByTestId('skill-detail-panel')).toContainText(prose[locale]);
    const eligible = await backup(page);
    // Existing first-visit sanitizer normalizes the learned Raise Skeleton identifier.
    expect(eligible.player).toEqual({ ...fresh.player, comboOrder: [RAISE] });
    await attach(info, '01-fresh-level1-eligible-control', eligible);
    // Extra point is an explicit imported fixture; no earned progression is claimed.
    const incoming: SaveCurrent = { ...fresh, player: { ...fresh.player, level: 1, skillPoints: 2,
      skillLevels: { 'necromancer.raise_skeleton': 1 }, comboOrder: [RAISE] } };
    const importLabel = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(incoming));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const prepared = await backup(page);
    expect(prepared.player).toEqual(incoming.player);
    expect(prepared.inventory).toEqual(fresh.inventory);
    expect(prepared.map).toEqual(fresh.map);
    durable(prepared);
    await attach(info, '02-explicit-imported-extra-point', prepared);
    try {
      for (const rank of [1, 2]) {
        await selectSkeletonMastery(page);
        const panel = page.getByTestId('skill-detail-panel');
        const allocate = panel.getByRole('button');
        // Native keyboard traversal from the selected tree node; no focus() or DOM click injection.
        const trace = [];
        const focusSnapshot = () => page.evaluate(() => {
          const active = document.activeElement;
          const detail = document.querySelector('[data-testid="skill-detail-panel"]');
          const action = detail?.querySelector('button');
          return { time: performance.now(), active: { tag: active?.tagName,
            testId: active?.getAttribute('data-testid'), label: active?.getAttribute('aria-label'),
            text: active?.textContent?.slice(0, 160) },
            heading: detail?.querySelector('h2')?.textContent,
            button: { text: action?.textContent, disabled: action?.disabled } };
        });
        let reached = false;
        for (let step = 0; step < 100; step++) {
          const before = await focusSnapshot();
          await page.keyboard.press('Tab');
          const after = await focusSnapshot();
          trace.push({ step, before, after });
          if (await allocate.evaluate(node => node === document.activeElement)) { reached = true; break; }
        }
        await attach(info, `keyboard-trace-rank${String(rank)}`, trace);
        if (!reached) await info.attach('keyboard-failure-before-close', {
          body: await page.screenshot(), contentType: 'image/png' });
        expect(reached).toBe(true);
        await expect(allocate).toBeFocused();
        await expect(panel.getByRole('heading', { name: english ? 'Skeleton Mastery' : '支配骷髅', exact: true })).toBeVisible();
        await expect(allocate).toHaveText(english ? 'Allocate' : '分配');
        await expect(allocate).toBeEnabled();
        await page.keyboard.press('Enter');
        await expect(panel).toContainText(english ? `Lv. ${String(rank)}/20` : `等级 ${String(rank)}/20`);
        const current = panel.locator('section').filter({ has: page.getByRole('heading', { name: english ? 'Current' : '当前', exact: true }) });
        const next = panel.locator('section').filter({ has: page.getByRole('heading', { name: english ? 'Next Level' : '下一级', exact: true }) });
        const rows = english
          ? [['Summon Life', 4], ['Summon Attack', 2], ['Summon Defense', 1]] as const
          : [['召唤物生命', 4], ['召唤物攻击', 2], ['召唤物防御', 1]] as const;
        for (const [label, coefficient] of rows) {
          await expect(current.locator('dt').filter({ hasText: label }).locator('+ dd')).toHaveText(`${String(rank * coefficient)}%`);
          await expect(next.locator('dt').filter({ hasText: label }).locator('+ dd')).toHaveText(`${String((rank + 1) * coefficient)}%(+${String(coefficient)}%)`);
        }
        await expect(panel).toContainText(prose[locale]);
        if (rank === 1) {
          const metrics = [];
          for (const [width, height] of sizes) {
            await page.setViewportSize({ width, height });
            const control = panel.getByRole('button');
            await control.scrollIntoViewIfNeeded();
            const bounds = await control.boundingBox();
            expect(bounds).not.toBeNull();
            expect(bounds?.width).toBeGreaterThanOrEqual(44); expect(bounds?.height).toBeGreaterThanOrEqual(44);
            const controlHits = await clearHits(control);
            const headingHits = await clearHits(panel.getByRole('heading', { name: english ? 'Skeleton Mastery' : '支配骷髅', exact: true }));
            await production(page);
            const description = panel.getByText(prose[locale], { exact: true });
            await description.scrollIntoViewIfNeeded();
            const font = await description.evaluate(node => getComputedStyle(node).fontSize);
            expect(Number.parseFloat(font)).toBeGreaterThanOrEqual(14);
            await expect(description).toBeVisible();
            if (!english && width === 360) {
              const cdp = await context.newCDPSession(page);
              try {
                await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
                const document = await cdp.send('DOM.getDocument');
                const node = await cdp.send('DOM.querySelector', { nodeId: document.root.nodeId,
                  selector: '[data-testid="skill-detail-panel"] #skill-detail-panel > p' });
                const fonts = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: node.nodeId });
                await attach(info, '03-actual-Chinese-platform-fonts', fonts);
                expect(fonts.fonts.some(font => font.familyName === 'Noto Sans CJK SC' && font.glyphCount > 0)).toBe(true);
              } finally { await cdp.detach(); }
            }
            await info.attach(`layout-${String(width)}x${String(height)}`, { body: await page.screenshot(), contentType: 'image/png' });
            for (const section of [current, next]) {
              await section.scrollIntoViewIfNeeded(); await expect(section).toBeVisible();
            }
            metrics.push({ width, height, bounds, font, controlHits, headingHits });
          }
          await attach(info, '03-layout-metrics', metrics);
        }
        await slots(page, english);
        const saved = await backup(page);
        expect(saved.player.skillLevels).toEqual({ 'necromancer.raise_skeleton': 1, 'necromancer.skeleton_mastery': rank });
        expect(saved.player.skillPoints).toBe(2 - rank); expect(saved.player.comboOrder).toEqual([RAISE]);
        expect(saved.player.derivedStats).toEqual(fresh.player.derivedStats); durable(saved);
        await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
        await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
        await page.close(); page = await context.newPage(); watch(page);
        await page.goto('/'); await page.getByTestId('home-continue').click();
        await expect(page.getByTestId('town-screen')).toBeVisible();
        const loaded = await backup(page);
        expect(loaded.player).toEqual(saved.player); expect(loaded.inventory).toEqual(saved.inventory);
        expect(loaded.mercs).toEqual(saved.mercs); expect(loaded.map).toEqual(saved.map);
        expect(loaded.formation).toEqual(saved.formation); expect(loaded.meta.settings).toEqual(saved.meta.settings); durable(loaded);
        await attach(info, `04-rank${String(rank)}-actual-disk-reload`, { saved, loaded });
        await selectSkeletonMastery(page); await expect(page.getByTestId('skill-detail-panel')).toContainText(english ? `Lv. ${String(rank)}/20` : `等级 ${String(rank)}/20`);
        await production(page);
      }
      await attach(info, '05-console-errors', errors); expect(errors).toEqual([]);
    } finally { await page.close(); }
  });
}

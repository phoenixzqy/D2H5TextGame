/** Real layout geometry; paused DOM invariance is separate from mutating controls. */
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { createCharacter, navTo } from '../e2e/_helpers';

const sizes = [
  [360, 640], [412, 915], [640, 360], [915, 412],
  [1023, 768], [1024, 768], [1280, 800], [1920, 1080]
] as const;
const mercId = 'mercs/act1-rogue-inner-sight';
const heroName = 'ReadabilityProof'; // Ordinary supported 16-character name; no spaces.
const fixedTime = new Date('2026-10-21T00:00:00Z');

async function attach(info: TestInfo, name: string, value: unknown): Promise<void> {
  await info.attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });
}
async function stored(page: Page): Promise<unknown> {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('D2H5TextGame');
    request.onerror = () => reject(new Error('Cannot open saved character'));
    request.onsuccess = () => {
      const db = request.result;
      const get = db.transaction('saves', 'readonly').objectStore('saves').get('current');
      get.onerror = () => { db.close(); reject(new Error('Cannot read saved character')); };
      get.onsuccess = () => { db.close(); resolve((get.result as { data: unknown }).data); };
    };
  }));
}
async function enter(page: Page, english: boolean): Promise<void> {
  await page.clock.setFixedTime(fixedTime); // Only Date; native playback timers.
  await page.goto('/');
  await createCharacter(page, { class: 'druid', name: heroName });
  await navTo(page, 'settings');
  await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state), { timeout: 60_000 }).toBe('activated');
  await navTo(page, 'mercs');
  await page.getByTestId(`hire-merc-${mercId}`).getByRole('button', { name: english ? 'Hire' : '招募', exact: true }).click();
  await expect(page.getByTestId(`merc-field-${mercId}`)).toHaveText(english ? 'Unfield' : '撤下');
  // Stabilize committed-save baseline before entering combat; invariant readers never write.
  await navTo(page, 'settings');
  await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
  await navTo(page, 'map');
  await page.getByTestId('sub-area-row-a1-blood-moor').getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
  await expect(page.getByTestId('combat-screen')).toBeVisible();
  await expect(page.getByTestId('allies-grid').locator('[data-kind="merc"]')).toHaveCount(1);
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
}
async function visibleState(page: Page) {
  return page.getByTestId('combat-screen').evaluate(root => ({
    wave: root.querySelector('[data-testid="wave-counter"]')?.textContent,
    cells: Array.from(root.querySelectorAll('[data-testid*="-grid-cell-"]'), cell => ({
      id: cell.getAttribute('data-testid'), text: cell.textContent,
      cards: Array.from(cell.querySelectorAll<HTMLElement>('[data-testid^="unit-card-"]'), card => ({
        id: card.dataset.testid, kind: card.dataset.kind, dead: card.dataset.dead, acting: card.dataset.acting,
        name: card.querySelector('[title]')?.getAttribute('title'),
        hp: card.querySelector<HTMLElement>('.bg-red-600')?.style.width,
        feedback: card.querySelector('[data-testid="combat-event-fx"]')?.textContent
      }))
    })),
    mp: root.querySelector('[role="group"]')?.textContent,
    log: root.querySelector('[data-testid="combat-log"]')?.textContent
  }));
}
async function geometry(page: Page) {
  return page.getByTestId('combat-screen').evaluate(root => {
    const rect = (node: Element) => {
      const r = node.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    const main = root.querySelector('main')!;
    const field = root.querySelector('[data-testid="combat-battlefield"]')!;
    const allies = field.children[0]!;
    const separator = field.children[1]!;
    const enemies = field.children[2]!;
    return {
      viewport: { width: innerWidth, height: innerHeight }, main: rect(main),
      overflow: { document: document.documentElement.scrollWidth - innerWidth, main: main.scrollWidth - main.clientWidth },
      allies: rect(allies), separator: rect(separator), enemies: rect(enemies),
      metadata: rect(root.querySelector('[data-testid="wave-counter"]')!.parentElement!),
      cells: Array.from(field.querySelectorAll('[data-testid*="-grid-cell-"]'), cell => ({
        rect: rect(cell), minimum: Number.parseFloat(getComputedStyle(cell).minHeight),
        emptyMinimum: cell.querySelector('[title]') ? null : Number.parseFloat(getComputedStyle(cell.children[0]!).minHeight)
      })),
      columns: [allies, enemies].map(side => getComputedStyle(side.querySelector('[data-testid$="-grid"]')!).gridTemplateColumns.split(' ').length),
      controls: Array.from(root.querySelectorAll('header button, header label'), node => ({ text: node.textContent, ...rect(node) })),
      cards: Array.from(field.querySelectorAll<HTMLElement>('[data-testid^="unit-card-"]'), outer => {
        const card = outer.querySelector('[title]')!;
        const name = card.children[1]!.children[0]!;
        const hp = outer.querySelector('.bg-red-600')!.parentElement!;
        const range = document.createRange(); range.selectNodeContents(name);
        const lines = Array.from(range.getClientRects(), r => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom }));
        const style = getComputedStyle(name);
        const clippingAncestors = [];
        for (let node: Element | null = name; node && node !== main; node = node.parentElement) {
          const s = getComputedStyle(node);
          if (/(hidden|clip)/.test(`${s.overflowX} ${s.overflowY}`)) clippingAncestors.push(rect(node));
        }
        const badge = outer.querySelector('[data-testid="combat-event-fx"]');
        return { id: outer.dataset.testid, name: name.textContent, card: rect(card), hp: rect(hp), lines,
          font: Number.parseFloat(style.fontSize), lineHeight: Number.parseFloat(style.lineHeight),
          whiteSpace: style.whiteSpace, ellipsis: style.textOverflow, clippingAncestors,
          image: rect(card.children[0]!), badge: badge ? rect(badge) : null };
      })
    };
  });
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`paused responsive geometry and W1 Flee ${locale}`, async ({ page }, info) => {
    const english = locale === 'en';
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
    await enter(page, english);
    await expect(page.getByTestId('combat-event-fx').first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
    await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true })).toHaveAttribute('aria-pressed', 'true');
    const before = await visibleState(page);
    expect(before.wave).toMatch(english ? /^Wave 1 / : /^第 1 波/);
    expect(before.cells).toHaveLength(18);
    expect(before.cells.flatMap(cell => cell.cards)).toHaveLength(10);
    expect(before.cells.flatMap(cell => cell.cards).some(card => card.feedback)).toBe(true);
    if (!english) {
      const cdp = await page.context().newCDPSession(page);
      try {
        await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
        const document = await cdp.send('DOM.getDocument');
        const node = await cdp.send('DOM.querySelector', { nodeId: document.root.nodeId, selector: '[data-testid="combat-sub-area-name"]' });
        const fonts = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: node.nodeId });
        await attach(info, 'actual-cjk-platform-fonts', fonts);
        expect(fonts.fonts.some(font => /WenQuanYi|WQY/i.test(font.familyName) && font.glyphCount > 0)).toBe(true);
      } finally { await cdp.detach(); }
    }
    const saved = await stored(page);
    const samples = [];
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      const g = await geometry(page); samples.push(g);
      expect.soft(g.overflow, `${width}: no horizontal overflow`).toEqual({ document: 0, main: 0 });
      expect.soft(g.main.height, `${width}: usable scrollport`).toBeGreaterThanOrEqual(120);
      expect.soft(g.columns).toEqual([3, 3]);
      for (const cell of g.cells) {
        expect.soft(cell.minimum).toBe(width < 1024 ? 112 : 168);
        expect.soft(cell.rect.height).toBeGreaterThanOrEqual(width < 1024 ? 112 : 168);
        if (cell.emptyMinimum !== null) expect.soft(cell.emptyMinimum).toBe(width < 1024 ? 0 : 152);
      }
      if (width < 1024) expect.soft(g.metadata.bottom).toBeLessThanOrEqual(Math.min(...g.controls.map(control => control.top)));
      if (width < 1024) {
        expect.soft(g.allies.bottom).toBeLessThanOrEqual(g.separator.top);
        expect.soft(g.separator.bottom).toBeLessThanOrEqual(g.enemies.top);
        expect.soft(g.separator.height).toBeGreaterThanOrEqual(40);
        expect.soft(g.separator.height).toBeLessThanOrEqual(48);
      } else {
        expect.soft(g.allies.right).toBeLessThanOrEqual(g.separator.left);
        expect.soft(g.separator.right).toBeLessThanOrEqual(g.enemies.left);
        expect.soft(g.separator.height).toBeGreaterThanOrEqual(288);
      }
      for (const control of g.controls) {
        expect.soft(control.width).toBeGreaterThanOrEqual(44);
        expect.soft(control.height).toBeGreaterThanOrEqual(44);
        expect.soft(control.left).toBeGreaterThanOrEqual(0);
        expect.soft(control.right).toBeLessThanOrEqual(width);
      }
      for (let i = 0; i < g.controls.length; i++) for (const other of g.controls.slice(i + 1)) {
        const c = g.controls[i]!;
        expect.soft(c.right + 7.9 <= other.left || other.right + 7.9 <= c.left ||
          c.bottom + 7.9 <= other.top || other.bottom + 7.9 <= c.top, 'toolbar target spacing').toBe(true);
      }
      for (const c of g.cards) {
        if (width < 1024) {
          expect.soft(c.card.width).toBeGreaterThanOrEqual(width === 360 ? 84 : width === 412 ? 100 : 80);
          expect.soft(c.font).toBeGreaterThanOrEqual(14);
          expect.soft(c.lineHeight).toBeGreaterThanOrEqual(18);
          expect.soft(c.whiteSpace).not.toBe('nowrap');
          expect.soft(c.ellipsis).not.toBe('ellipsis');
          expect.soft(c.hp.height).toBeGreaterThanOrEqual(6);
          expect.soft(c.image.height).toBe(64);
          if (width === 360 && c.name === heroName) expect.soft(c.lines.length).toBeGreaterThanOrEqual(2);
          for (const line of c.lines) for (const ancestor of [c.card, ...c.clippingAncestors]) {
            expect.soft(line.left).toBeGreaterThanOrEqual(ancestor.left - 1);
            expect.soft(line.right).toBeLessThanOrEqual(ancestor.right + 1);
            expect.soft(line.top).toBeGreaterThanOrEqual(ancestor.top - 1);
            expect.soft(line.bottom).toBeLessThanOrEqual(ancestor.bottom + 1);
          }
        } else {
          expect.soft(c.font).toBe(10);
          expect.soft(c.hp.height).toBe(4);
        }
        expect.soft(c.hp.left).toBeGreaterThanOrEqual(c.card.left - 1);
        expect.soft(c.hp.right).toBeLessThanOrEqual(c.card.right + 1);
        expect.soft(c.hp.top).toBeGreaterThanOrEqual(c.card.top - 1);
        expect.soft(c.hp.bottom).toBeLessThanOrEqual(c.card.bottom + 1);
        if (c.badge) {
          expect.soft(c.badge.left).toBeGreaterThanOrEqual(c.card.left - 1);
          expect.soft(c.badge.right).toBeLessThanOrEqual(c.card.right + 1);
          expect.soft(c.badge.top).toBeGreaterThanOrEqual(c.card.top - 1);
          expect.soft(c.badge.bottom).toBeLessThanOrEqual(c.card.bottom + 1);
        }
      }
      // Ordinary scrolling must reveal complete name+HP for each team and the log.
      for (const side of ['allies', 'enemies']) {
        const card = page.getByTestId(`${side}-grid`).locator('[title]').first();
        await card.scrollIntoViewIfNeeded();
        const r = await card.boundingBox(); const m = await page.locator('main').boundingBox();
        expect.soft(r!.y).toBeGreaterThanOrEqual(m!.y - 1);
        expect.soft(r!.y + r!.height).toBeLessThanOrEqual(m!.y + m!.height + 1);
      }
      await page.getByTestId('combat-log').scrollIntoViewIfNeeded();
      await expect(page.getByTestId('combat-log')).toBeInViewport();
      expect(await visibleState(page)).toEqual(before);
      expect(await stored(page)).toEqual(saved);
      // Two representative shots per locale; all eight sizes retain numeric geometry.
      if (width === 360 || width === 1280) {
        await page.getByTestId('allies-grid').locator('[title]').first().scrollIntoViewIfNeeded();
        await info.attach(`layout-${width}`, { body: await page.screenshot(), contentType: 'image/png' });
      }
    }
    await attach(info, 'paused-visible-state', before);
    await attach(info, 'all-eight-geometry-samples', samples);
    await attach(info, 'stable-committed-save', saved);
    await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
    await expect(page.getByTestId('map-screen')).toBeVisible();
    await attach(info, 'browser-errors', errors); expect(errors).toEqual([]);
  });

  test(`native toolbar and terminal return ${locale}`, async ({ page }, info) => {
    const english = locale === 'en';
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
    await enter(page, english);
    await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
    const paused = await visibleState(page);
    const initialCards = paused.cells.flatMap(cell => cell.cards);
    expect(initialCards.length).toBeGreaterThan(0);
    for (const card of initialCards) {
      const hp = Number.parseFloat(card.hp ?? 'NaN');
      expect(Number.isFinite(hp)).toBe(true); expect(hp).toBeGreaterThanOrEqual(0); expect(hp).toBeLessThanOrEqual(100);
    }
    expect(paused.mp).toMatch(/\d+ \/ \d+/);
    await page.getByTestId('formation-editor-open').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape'); // Close only; assignments are immediate, not transactional.
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await visibleState(page)).toEqual(paused);
    const auto = page.getByRole('checkbox'); const initialAuto = await auto.isChecked();
    await auto.setChecked(!initialAuto); await expect(auto).toBeChecked({ checked: !initialAuto });
    await auto.setChecked(initialAuto); await expect(auto).toBeChecked({ checked: initialAuto });
    const speed = page.getByRole('button', { name: english ? 'Speed' : '速度', exact: true });
    for (const n of [2, 4, 1]) { await speed.click(); await expect(speed).toHaveText(`${n}x`); }
    await page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }).click();
    await expect.poll(async () => {
      const state = await visibleState(page);
      return state.mp !== paused.mp || state.cells.flatMap(cell => cell.cards).some(card =>
        initialCards.some(before => before.id === card.id && before.hp !== card.hp));
    }, { timeout: 15_000, intervals: [50] }).toBe(true);
    await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
    const resumed = await visibleState(page);
    expect(resumed.log).not.toBe(paused.log);
    await attach(info, 'native-controls', { paused, resumed, initialAuto });
    // One ordinary run, at most three waves; either native terminal outcome is acceptable.
    for (let wave = 1; wave <= 3; wave++) {
      await page.getByTestId('skip-button').click();
      await expect.poll(async () => {
        if (await page.getByTestId('return-to-map').isVisible()) return true;
        return (await page.getByTestId('wave-counter').innerText()).includes(english ? `Wave ${wave + 1} ` : `第 ${wave + 1} 波`);
      }, { timeout: 7000 }).toBe(true);
      if (await page.getByTestId('return-to-map').isVisible()) break;
    }
    await expect(page.getByTestId('return-to-map')).toBeVisible();
    await page.getByTestId('return-to-map').scrollIntoViewIfNeeded();
    await page.getByTestId('return-to-map').click();
    await expect(page.getByTestId('map-screen')).toBeVisible();
    await attach(info, 'terminal-exit', { destination: 'map', scope: 'return-control only; no clear/balance claim' });
    await attach(info, 'browser-errors', errors); expect(errors).toEqual([]);
  });
}

/**
 * Constructed native19 Exile proves functional behavior, never earned acquisition or campaign balance.
 * Dedicated runner: CRAFTING_UI_ROOT=<absolute build root> playwright test --config tests/pwa/crafting.config.ts
 */
import { expect, test, type BrowserContext, type Locator, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Item } from '../../src/engine/types/items';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const sizes = [[360, 640], [412, 915], [640, 360], [1280, 800], [1920, 1080]] as const;
const exile: Item = { id: 'browser-exile', baseId: 'items/base/sh-monarch', rarity: 'runeword',
  level: 60, identified: true, equipped: true, socketCapacity: 4, baseRolls: { defense: 64 },
  runewordId: 'runewords/exile',
  socketContents: ['vex', 'ohm', 'ist', 'dol'].map(id => ({ kind: 'rune', id: `runes/${id}` })) };

async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download'); await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}

async function layout(page: Page, scope: Locator): Promise<void> {
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const overflow = await scope.evaluate(node => {
    const parent = node.getBoundingClientRect();
    return { width: node.clientWidth, scrollWidth: node.scrollWidth,
      children: [...node.querySelectorAll('*')].filter(child => child.getBoundingClientRect().right > parent.right + 1)
        .slice(0, 12).map(child => ({ tag: child.tagName, classes: child.className,
          text: child.textContent?.slice(0, 70), width: child.getBoundingClientRect().width })) };
  });
  expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width);
  for (const control of await scope.locator('button').all()) {
    if (!(await control.isVisible())) continue;
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44); expect(box?.height).toBeGreaterThanOrEqual(44);
  }
}

async function continued(page: Page, context: BrowserContext, en: boolean, info: TestInfo, stage: string,
  viewport: { width: number; height: number }, observe: (page: Page) => void): Promise<Page> {
  const before = await backup(page);
  await page.getByRole('button', { name: en ? 'Save' : '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(en ? 'Saved' : '已保存'); await page.close();
  const next = await context.newPage(); observe(next);
  await next.setViewportSize(viewport);
  expect(next.viewportSize()).toEqual(viewport);
  await next.goto('/'); await next.getByTestId('home-continue').click();
  await expect(next.getByTestId('town-screen')).toBeVisible();
  const after = await backup(next);
  for (const key of ['player', 'inventory', 'map', 'mercs', 'formation'] as const) expect(after[key]).toEqual(before[key]);
  await info.attach(stage, { body: JSON.stringify(after), contentType: 'application/json' });
  return next;
}

for (const locale of ['en', 'zh-CN'] as const) for (const [width, height] of sizes) {
  test(`combat grants inspection, equipment and Continue ${locale} ${String(width)}x${String(height)}`, async ({ page: initial, context }, info) => {
    const en = locale === 'en', errors: string[] = [];
    const observe = (current: Page) => {
      current.on('pageerror', error => errors.push(error.message));
      current.on('console', entry => {
        if (entry.type() === 'error' || entry.type() === 'warning') errors.push(entry.text());
      });
    };
    let page = initial; observe(page); await page.setViewportSize({ width, height });
    await page.goto('/'); await createCharacter(page, { class: 'paladin', name: 'Combat Grant QA' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: en ? 'English' : '简体中文', exact: true }).click();
    const fresh = await backup(page);
    const rows = [
      { id: 'leaf', base: 'weapon-staff', runes: ['tir', 'ral'],
        lines: [en ? 'While equipped: +12% Fire Damage (self only)' : '装备时：自身火焰伤害 +12%'] },
      { id: 'infinity', base: 'wp2h-giant-thresher', runes: ['ber', 'mal', 'ber', 'ist'],
        lines: en ? ['Fire', 'Cold', 'Lightning', 'Poison'].map(type => `While equipped: +10% ${type} Damage (self only)`)
          .concat('While equipped: +5% Arcane Damage (self only)')
          : ['火焰', '冰冷', '闪电', '毒素'].map(type => `装备时：自身${type}伤害 +10%`).concat('装备时：自身奥术伤害 +5%') },
      { id: 'dream', base: 'helm-war-hat', runes: ['io', 'jah', 'pul'],
        lines: [en ? 'While equipped: +15% Lightning Damage (self only)' : '装备时：自身闪电伤害 +15%'] },
      { id: 'bramble', base: 'armor-archon-plate', runes: ['ral', 'ohm', 'sur', 'eth'],
        lines: [en ? 'While equipped: survive a direct physical hit to reflect 20% of Life lost as Thorns Damage (self only)'
          : '装备时：承受直接物理攻击后若存活，将所失生命的 20% 以荆棘伤害反弹（仅自身）'] },
      { id: 'phoenix', base: 'sh-monarch', runes: ['vex', 'vex', 'lo', 'jah'],
        lines: [en ? 'While equipped: +10% to existing Mana Regeneration (self only)' : '装备时：自身已有法力回复速率 +10%'] }
    ];
    const items: Item[] = rows.map(row => ({ id: `combat-${row.id}`, baseId: `items/base/${row.base}`,
      level: 70, rarity: 'runeword', runewordId: `runewords/${row.id}`, identified: true, equipped: false,
      socketCapacity: row.runes.length, socketContents: row.runes.map(id => ({ kind: 'rune', id: `runes/${id}` })) }));
    const fixture: SaveCurrent = { ...fresh, player: { ...fresh.player, level: 70,
      coreStats: { strength: 300, dexterity: 300, vitality: 50, energy: 20 }, equipment: [] },
      inventory: { ...fresh.inventory, equipped: {}, backpack: items, stash: [] } };
    const importLabel = en ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    await page.getByRole('dialog').getByRole('textbox').fill(JSON.stringify(fixture));
    await page.getByRole('dialog').getByRole('button', { name: importLabel, exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await info.attach('constructed-combat-grants-input', { body: JSON.stringify(fixture), contentType: 'application/json' });
    await navTo(page, 'inventory');
    for (const row of rows) {
      await page.getByTestId(`inv-item-combat-${row.id}`).click(); await page.mouse.move(0, 0);
      const detail = page.getByTestId('inv-detail-panel');
      for (const line of row.lines) await expect(detail).toContainText(line);
      await layout(page, detail);
      if (row.id === 'bramble') {
        await detail.getByText(row.lines[0]!, { exact: true }).scrollIntoViewIfNeeded();
        await expect(detail.getByText(row.lines[0]!, { exact: true })).toBeVisible();
        await info.attach('reflection-visible', { body: await page.screenshot(), contentType: 'image/png' });
      }
      if (row.id === 'phoenix') await detail.getByTestId('inv-primary-action').click();
      else await detail.getByTestId('inv-detail-close').click();
    }
    const equipped = await backup(page);
    expect(equipped.inventory.equipped.offhand).toEqual({ ...items[4], equipped: true });
    expect(equipped.player.skillLevels).toEqual(fixture.player.skillLevels);
    page = await continued(page, context, en, info, 'combat-grants-equipped-continued', { width, height }, observe);
    await navTo(page, 'inventory'); await page.getByRole('tab', { name: en ? 'Equipment' : '装备', exact: true }).click();
    await page.getByTestId('equip-slot-offhand-details').click();
    await expect(page.getByTestId('equipped-item-modal')).toContainText(rows[4]!.lines[0]!);
    await layout(page, page.getByTestId('equipped-item-modal'));
    await page.getByTestId('equipped-item-modal-close').click();
    await page.getByTestId('equip-slot-offhand').getByRole('button', { name: en ? 'Unequip' : '卸下', exact: true }).click();
    const removed = await backup(page);
    expect(removed.inventory.backpack).toEqual(items);
    expect(removed.player.skillLevels).toEqual(fixture.player.skillLevels);
    const last = await continued(page, context, en, info, 'combat-grants-removed-continued', { width, height }, observe);
    await last.close(); expect(errors).toEqual([]);
  });

  test(`Exile cache, removal, comparison and Continue ${locale} ${String(width)}x${String(height)}`, async ({ page: initial, context }, info) => {
    const en = locale === 'en', errors: string[] = [], warnings: string[] = [];
    const observe = (page: Page) => {
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', entry => { if (entry.type() === 'error' || entry.type() === 'warning') warnings.push(entry.text()); });
    };
    let page = initial; observe(page); await page.setViewportSize({ width, height });
    await page.goto('/'); await createCharacter(page, { class: 'sorceress', name: 'Exile QA' });
    await navTo(page, 'settings'); await page.getByRole('button', { name: en ? 'English' : '简体中文', exact: true }).click();
    const fresh = await backup(page);
    // Intentionally stale pre-adaptation native19 defense; unrelated caches must survive import exactly.
    const fixture: SaveCurrent = { ...fresh, player: { ...fresh.player, level: 60, equipment: [exile],
      derivedStats: { ...fresh.player.derivedStats, defense: 481, life: 13, mana: 17 } },
      inventory: { ...fresh.inventory, equipped: { offhand: exile }, backpack: [], stash: [] } };
    const importLabel = en ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    await page.getByRole('dialog').getByRole('textbox').fill(JSON.stringify(fixture));
    await page.getByRole('dialog').getByRole('button', { name: importLabel, exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await info.attach('constructed-native19-input', { body: JSON.stringify(fixture), contentType: 'application/json' });
    const repaired = await backup(page);
    expect(repaired.player.derivedStats).toEqual({ ...fixture.player.derivedStats, defense: 481 * 1.2 });
    expect(repaired.inventory).toEqual(fixture.inventory);
    await page.getByRole('button', { name: /Exile QA.*60/ }).click();
    await expect(page.getByTestId('character-screen').locator('li')
      .filter({ has: page.getByText(en ? 'Defense' : '防御', { exact: true }) })).toContainText('577');
    await navTo(page, 'inventory');
    const equipment = () => page.getByRole('tab', { name: en ? 'Equipment' : '装备', exact: true });
    await equipment().click(); await page.getByTestId('equip-slot-offhand-details').click();
    const selfOnly = en ? 'While equipped: +20% Defense (self only)' : '装备时：自身防御 +20%';
    await expect(page.getByTestId('equipped-item-modal')).toContainText(selfOnly);
    await layout(page, page.getByTestId('equipped-item-modal'));
    await info.attach('equipped-exile', { body: await page.screenshot(), contentType: 'image/png' });
    await page.getByTestId('equipped-item-modal-close').click();
    await page.getByTestId('equip-slot-offhand').getByRole('button', { name: en ? 'Unequip' : '卸下', exact: true }).click();
    const bare = await backup(page);
    expect(bare.player.derivedStats.defense).toBe(197);
    expect([bare.player.derivedStats.life, bare.player.derivedStats.mana]).toEqual([13, 17]);
    expect(bare.inventory.equipped.offhand).toBeNull();
    expect(bare.inventory.backpack).toEqual([{ ...exile, equipped: false }]);
    await navTo(page, 'inventory'); await page.getByTestId('inv-item-browser-exile').click();
    await page.mouse.move(0, 0);
    const detail = page.getByTestId('inv-detail-panel');
    await expect(detail).toContainText(selfOnly);
    const defense = detail.getByTestId('stat-row').filter({ has: page.getByText(en ? 'Defense' : '防御', { exact: true }) });
    await expect(defense).toContainText('577'); await expect(defense).toContainText('+380');
    await layout(page, detail);
    await detail.getByTestId('inv-primary-action').click();
    const reequipped = await backup(page);
    expect(reequipped.player.derivedStats.defense).toBeCloseTo(577.2, 12);
    expect([reequipped.player.derivedStats.life, reequipped.player.derivedStats.mana]).toEqual([13, 17]);
    expect(reequipped.inventory.equipped.offhand).toEqual(exile);
    expect(reequipped.player.skillLevels).toEqual(fixture.player.skillLevels);
    page = await continued(page, context, en, info, 'exile-equipped-continued', { width, height }, observe);
    await navTo(page, 'inventory'); await equipment().click();
    await page.getByTestId('equip-slot-offhand').getByRole('button', { name: en ? 'Unequip' : '卸下', exact: true }).click();
    const final = await backup(page);
    expect(final.player.derivedStats.defense).toBe(197);
    expect([final.player.derivedStats.life, final.player.derivedStats.mana]).toEqual([13, 17]);
    const last = await continued(page, context, en, info, 'exile-removed-continued', { width, height }, observe); await last.close();
    expect(errors).toEqual([]); expect(warnings).toEqual([]);
  });

  for (const word of ['beast', 'last-wish'] as const) {
    test(`${word} stat grant, removal and Continue ${locale} ${String(width)}x${String(height)}`, async ({ page: initial, context }, info) => {
      const en = locale === 'en', errors: string[] = [];
      const observe = (current: Page) => {
        current.on('pageerror', error => errors.push(error.message));
        current.on('console', entry => {
          if (entry.type() === 'error' || entry.type() === 'warning') errors.push(entry.text());
        });
      };
      let page = initial; observe(page); await page.setViewportSize({ width, height });
      await page.goto('/'); await createCharacter(page, { class: 'sorceress', name: 'Stat Grant QA' });
      await navTo(page, 'settings');
      await page.getByRole('button', { name: en ? 'English' : '简体中文', exact: true }).click();
      const fresh = await backup(page);
      const beast = word === 'beast';
      const runes = beast ? ['ber', 'tir', 'um', 'mal', 'lum'] : ['jah', 'mal', 'jah', 'sur', 'jah', 'ber'];
      const item: Item = { id: `browser-${word}`, baseId: beast ? 'items/base/wp2h-thunder-maul' : 'items/base/wp1h-legend-sword',
        rarity: 'runeword', runewordId: `runewords/${word}`, level: 70, identified: true, equipped: true,
        socketCapacity: runes.length, socketContents: runes.map(id => ({ kind: 'rune', id: `runes/${id}` })) };
      const ordinaryLife = 100 + 69 * 8 + fresh.player.coreStats.vitality * 2;
      const ordinarySpeed = 100 + fresh.player.coreStats.dexterity;
      const affected = beast ? { lifeMax: ordinaryLife * 1.15, attackSpeed: ordinarySpeed * 1.05 }
        : { magicDodge: .05 + .025,
          resistances: { physical: 10, fire: 10, cold: 10, lightning: 10, poison: 10, arcane: 10 } };
      const fixture: SaveCurrent = { ...fresh, player: { ...fresh.player, level: 70, equipment: [item],
        derivedStats: { ...fresh.player.derivedStats, life: 13, mana: 17 } },
        inventory: { ...fresh.inventory, equipped: { weapon: item }, backpack: [], stash: [] } };
      const importLabel = en ? 'Import Save' : '导入存档';
      await page.getByRole('button', { name: importLabel, exact: true }).click();
      await page.getByRole('dialog').getByRole('textbox').fill(JSON.stringify(fixture));
      await page.getByRole('dialog').getByRole('button', { name: importLabel, exact: true }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await info.attach('constructed-native19-input', { body: JSON.stringify(fixture), contentType: 'application/json' });
      expect((await backup(page)).player.derivedStats).toEqual({ ...fixture.player.derivedStats, ...affected });
      await navTo(page, 'inventory');
      const equipment = () => page.getByRole('tab', { name: en ? 'Equipment' : '装备', exact: true });
      await equipment().click(); await page.getByTestId('equip-slot-weapon-details').click();
      const selfOnly = beast
        ? en ? 'While equipped: +15% maximum Life and +5% Attack Speed (self only)' : '装备时：自身生命上限 +15%，攻击速度 +5%'
        : en ? 'While equipped: +10 to all six resistances and +2.5% Magic Dodge (self only)' : '装备时：自身六系抗性 +10，魔法闪避 +2.5%';
      await expect(page.getByTestId('equipped-item-modal')).toContainText(selfOnly);
      await layout(page, page.getByTestId('equipped-item-modal'));
      await info.attach('equipped-stat-grant', { body: await page.screenshot(), contentType: 'image/png' });
      await page.getByTestId('equipped-item-modal-close').click();
      await page.getByTestId('equip-slot-weapon').getByRole('button', { name: en ? 'Unequip' : '卸下', exact: true }).click();
      const removed = await backup(page);
      expect(removed.player.derivedStats).toMatchObject({ lifeMax: ordinaryLife, attackSpeed: ordinarySpeed,
        magicDodge: .05, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }, life: 13, mana: 17 });
      expect(removed.inventory.backpack).toEqual([{ ...item, equipped: false }]);
      await navTo(page, 'inventory'); await page.getByTestId(`inv-item-browser-${word}`).click(); await page.mouse.move(0, 0);
      const detail = page.getByTestId('inv-detail-panel');
      await expect(detail).toContainText(selfOnly); await layout(page, detail);
      await detail.getByTestId('inv-primary-action').click();
      const equipped = await backup(page);
      expect(equipped.player.derivedStats).toMatchObject({ ...affected, life: 13, mana: 17 });
      expect(equipped.player.skillLevels).toEqual(fixture.player.skillLevels);
      page = await continued(page, context, en, info, 'stat-grant-equipped-continued', { width, height }, observe);
      await navTo(page, 'inventory'); await equipment().click();
      await page.getByTestId('equip-slot-weapon').getByRole('button', { name: en ? 'Unequip' : '卸下', exact: true }).click();
      expect((await backup(page)).player.derivedStats).toEqual(removed.player.derivedStats);
      const last = await continued(page, context, en, info, 'stat-grant-removed-continued', { width, height }, observe);
      await last.close(); expect(errors).toEqual([]);
    });
  }
}

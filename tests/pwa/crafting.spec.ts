/** Constructed v18 holdings prove functional crafting/migration, never earned campaign acceptance. */
import { expect, test, type BrowserContext, type Locator, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Item } from '../../src/engine/types/items';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';
import { withoutV19Fields } from '../helpers/save-fixtures';

const sizes = [[360, 640], [412, 915], [640, 360], [1280, 800], [1920, 1080]] as const;
const gear = (id: string, fields: Partial<Item> = {}): Item => ({ id,
  baseId: 'items/base/wp1h-short-sword', rarity: 'normal', level: 1,
  identified: true, equipped: false, socketCapacity: 2, ...fields });

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
  const controls = scope.locator('button, select, input, summary');
  for (const control of await controls.all()) {
    if (!(await control.isVisible())) continue;
    const box = await control.evaluate(node => (node.matches('input[type="checkbox"]') ? node.closest('label') ?? node : node).getBoundingClientRect().toJSON() as { width: number; height: number });
    expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
  }
  expect(await scope.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
}

async function continued(page: Page, context: BrowserContext, en: boolean, info: TestInfo, stage: string): Promise<Page> {
  const before = await backup(page);
  await page.getByRole('button', { name: en ? 'Save' : '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(en ? 'Saved' : '已保存'); await page.close();
  const next = await context.newPage(); await next.goto('/'); await next.getByTestId('home-continue').click();
  await expect(next.getByTestId('town-screen')).toBeVisible();
  const after = await backup(next);
  for (const key of ['player', 'inventory', 'map', 'mercs', 'formation'] as const) expect(after[key]).toEqual(before[key]);
  await info.attach(stage, { body: JSON.stringify(after), contentType: 'application/json' });
  return next;
}

for (const locale of ['en', 'zh-CN'] as const) for (const [width, height] of sizes) {
  test(`all material actions and v18 recovery ${locale} ${String(width)}x${String(height)}`, async ({ page: initial, context }, info) => {
    const en = locale === 'en', errors: string[] = [], warnings: string[] = [];
    const observe = (page: Page) => {
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', entry => { if (entry.type() === 'error' || entry.type() === 'warning') warnings.push(entry.text()); });
    };
    let page = initial; observe(page); await page.setViewportSize({ width, height });
    await page.goto('/'); await createCharacter(page, { class: 'sorceress', name: 'Crafting QA' });
    await navTo(page, 'settings'); await page.getByRole('button', { name: en ? 'English' : '简体中文', exact: true }).click();
    const fresh = await backup(page), predecessor = withoutV19Fields(fresh);
    const oldLore = { ...gear('old-lore', { baseId: 'items/base/armor-quilted', rarity: 'runeword', runewordId: 'runewords/lore',
      baseRolls: { defense: 17 }, personalizedBy: { characterId: fresh.player.id, name: 'Original Smith' } }), runes: ['runes/ort', 'runes/sol'] };
    const fixture = { ...predecessor, version: 18, inventory: { ...predecessor.inventory,
      backpack: [gear('blade'), gear('chest', { baseId: 'items/base/armor-quilted', socketCapacity: 0, baseRolls: { defense: 17 } }),
        gear('amulet', { baseId: 'items/base/amu-tin', socketCapacity: 0, rarity: 'magic', ilvl: 30 }), gear('scrap-bag'), oldLore],
      stash: [gear('scrap-stash', { rarity: 'magic' })],
      legacyGearQuarantine: [{ item: { id: 'old16', baseId: 'items/base/wp1h-short-sword', rarity: 'normal', level: 1, identified: true, equipped: false }, origin: { container: 'stash', index: 0 } }],
      materials: { 'runes/el': 6, 'runes/tir': 1, 'runes/ral': 3, 'runes/hel': 2, 'runes/amn': 1, 'runes/um': 1,
        'gems/amethyst/chipped': 3, 'gems/ruby/perfect': 1, 'gems/topaz/perfect': 1, 'gems/skull/flawed': 1,
        'gems/amethyst/perfect': 1, 'materials/scrap': 20 }, currencies: { 'rune-shard': 1100, 'gem-shard': 1 }
    } };
    const importLabel = en ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    await page.getByRole('dialog').getByRole('textbox').fill(JSON.stringify(fixture));
    await page.getByRole('dialog').getByRole('button', { name: importLabel, exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await info.attach('constructed-v18-input', { body: JSON.stringify(fixture), contentType: 'application/json' });
    const migrated = await backup(page);
    expect(migrated.version).toBe(19); expect(migrated.inventory.socketQuarantine).toHaveLength(1);
    expect(migrated.inventory.socketQuarantine[0]?.item).toEqual(oldLore);
    await navTo(page, 'inventory');
    const panel = () => page.getByTestId('crafting-panel');
    const category = async (value: string) => { await panel().getByLabel(en ? 'Action' : '操作', { exact: true }).selectOption(value); };
    const recipe = async (value: string) => { await panel().getByLabel(en ? 'Recipe' : '配方', { exact: true }).selectOption(value); };
    const target = async (id: string) => { await panel().getByLabel(new RegExp(`#${id}\\s`)).check(); };
    const preview = async () => {
      await panel().getByRole('button', { name: en ? 'Preview action' : '预览操作', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible(); await layout(page, page.getByRole('dialog'));
    };
    const commit = async () => {
      await page.getByRole('dialog').getByRole('button', { name: en ? 'Confirm' : '确认', exact: true }).click({ clickCount: 2 });
      await expect(page.getByRole('dialog').getByRole('status')).toHaveText(en ? 'Completed' : '已完成');
      await page.getByRole('dialog').getByRole('button', { name: en ? 'Close' : '关闭', exact: true }).click();
    };

    await layout(page, panel());
    await recipe('recipes/rune-fusion/ral');
    await panel().getByRole('button', { name: en ? 'Preview action' : '预览操作' }).click();
    await expect(panel().getByRole('alert')).toContainText(en ? 'not unlocked' : '尚未解锁');
    expect((await backup(page)).inventory).toEqual(migrated.inventory); await navTo(page, 'inventory');
    await category('socket-insert'); await target('blade');
    await panel().getByLabel(en ? 'Socket material' : '镶嵌材料').selectOption('runes/um'); await preview();
    await expect(page.getByTestId('crafting-output-item')).toContainText(en ? '+5% Crit Chance' : '+5% 暴击率');
    await page.keyboard.press('Escape');
    expect((await backup(page)).inventory).toEqual(migrated.inventory); await navTo(page, 'inventory');
    await category('rune-fusion');
    await recipe('recipes/rune-fusion/el'); await preview();
    const cancel = page.getByRole('dialog').getByRole('button', { name: en ? 'Cancel' : '取消' });
    await expect(cancel).toBeFocused(); await page.keyboard.press('Tab');
    await expect(page.getByRole('dialog').getByRole('button', { name: en ? 'Confirm' : '确认' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel().getByRole('button', { name: en ? 'Preview action' : '预览操作' })).toBeFocused();
    await preview(); await commit();
    await category('gem-fusion'); await recipe('recipes/gem-fusion/amethyst/chipped'); await preview(); await commit();
    await category('gem-dismantle'); await recipe('recipes/gem-dismantle/ruby/perfect'); await preview(); await commit();
    await category('socket-armor'); await target('chest'); await preview(); await commit();
    await category('socket-insert'); await target('chest');
    await panel().getByLabel(en ? 'Socket material' : '镶嵌材料').selectOption('runes/eld'); await preview();
    await expect(page.getByTestId('crafting-output-item')).toContainText(en ? '+2% Physical Dodge' : '+2% 物理闪避');
    await info.attach('percentage-preview', { body: await page.screenshot(), contentType: 'image/png' });
    await page.keyboard.press('Escape');
    await category('caster-amulet'); await target('amulet'); await preview();
    await expect(page.getByTestId('crafting-output-item')).toContainText(en ? '+20 Mana' : '+20 法力'); await commit();
    await category('socket-insert'); await target('blade');
    await panel().getByLabel(en ? 'Socket material' : '镶嵌材料').selectOption('runes/tir'); await preview(); await commit();
    await panel().getByLabel(en ? 'Socket material' : '镶嵌材料').selectOption('runes/el'); await preview();
    await expect(page.getByTestId('crafting-output-item')).toContainText(en ? 'Runeword: Steel' : '符文之语：钢铁');
    await expect(page.getByTestId('crafting-output-item')).toContainText(en ? '+25 Attack Speed' : '+25 攻击速度');
    await info.attach('word-preview', { body: await page.screenshot(), contentType: 'image/png' }); await commit();
    const wordState = await backup(page);
    expect(wordState.inventory.materialActionOrdinal).toBe(7);
    expect(wordState.inventory.backpack.find(item => item.id === 'blade')).toMatchObject({ rarity: 'runeword', runewordId: 'runewords/steel',
      socketContents: [{ kind: 'rune', id: 'runes/tir' }, { kind: 'rune', id: 'runes/el' }] });
    page = await continued(page, context, en, info, 'completed-word-continued'); observe(page); await page.setViewportSize({ width, height });
    await navTo(page, 'inventory');
    await category('socket-clear'); await target('blade'); await preview();
    await expect(page.getByRole('dialog')).toContainText(en ? 'No inserts are refunded' : '不返还镶嵌材料'); await commit();
    await category('salvage'); await target('scrap-bag'); await target('scrap-stash'); await preview();
    await expect(page.getByRole('dialog')).toContainText(en ? 'permanently destroyed' : '永久销毁'); await commit();
    await category('recover-v18'); await expect(panel().getByLabel(/old16/)).toHaveCount(0); await target('old-lore'); await preview();
    await page.getByRole('dialog').locator('summary').click();
    await expect(page.getByRole('dialog')).toContainText(en ? 'Preserved rune order' : '保留的符文顺序');
    await expect(page.getByRole('dialog')).toContainText(en ? 'Socket capacity: 2' : '镶嵌孔数：2');
    await expect(page.getByRole('dialog')).not.toContainText(en ? 'could not be verified' : '无法验证');
    await layout(page, page.getByRole('dialog'));
    await info.attach('recovery-preview', { body: await page.screenshot(), contentType: 'image/png' }); await commit();
    const result = await backup(page);
    expect(result.inventory.materialActionOrdinal).toBe(10); expect(result.inventory.socketQuarantine).toEqual([]);
    expect(result.inventory.legacyGearQuarantine).toEqual(migrated.inventory.legacyGearQuarantine);
    expect(result.inventory.materials).toEqual({ 'runes/el': 2, 'runes/eld': 1, 'runes/ral': 2, 'runes/um': 1,
      'gems/amethyst/flawed': 1, 'materials/scrap': 3, 'runes/ort': 1, 'runes/sol': 1 });
    expect(result.inventory.currencies).toEqual({ 'rune-shard': 0, 'gem-shard': 5 });
    expect(result.inventory.backpack.map(item => item.id).sort()).toEqual(['amulet', 'blade', 'chest', 'old-lore']);
    expect(result.inventory.stash).toEqual([]);
    const { runes: _runes, runewordId: _word, ...preserved } = oldLore;
    expect(result.inventory.backpack.find(item => item.id === 'old-lore')).toEqual({ ...preserved, rarity: 'normal', socketContents: [] });
    expect(result.inventory.backpack.find(item => item.id === 'amulet')?.affixes).toHaveLength(3);
    expect(result.inventory.backpack.find(item => item.id === 'chest')?.baseRolls).toEqual({ defense: 17 });
    const finalPage = await continued(page, context, en, info, 'all-actions-continued'); await finalPage.close();
    expect(errors).toEqual([]); expect(warnings).toEqual([]);
  });
}

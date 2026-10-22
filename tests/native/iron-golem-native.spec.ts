/** Native production controls. Imported eligibility/core stats are unearned QA scaffolding. */
import { test, expect, type Page, type Locator, type TestInfo, type BrowserContext } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

interface ItemSnapshot { id: string; [key: string]: unknown }
interface NativeSave {
  version: number;
  timestamp: number;
  player: {
    id: string; level: number; class: string; name: string; skillPoints: number;
    coreStats: Record<string, number>;
    derivedStats: { life: number; lifeMax: number; mana: number; manaMax: number };
    skillLevels: Record<string, number>; comboOrder: string[];
  };
  inventory: { backpack: ItemSnapshot[]; stash: ItemSnapshot[]; equipped: Record<string, unknown> };
  mercs: { fieldedMercId: string | null; mercEquipment: Record<string, unknown> };
  meta: { settings: { locale: string }; idleState: Record<string, unknown> };
}
const IRON = 'skills-necromancer-iron-golem';
const BLOOD = 'skills-necromancer-blood-golem';
const FIRST = 'native-iron-short-sword';
const SECOND = 'native-iron-chain-mail';
const names = {
  choose: /^(Backpack item|背包物品)$/,
  ack: /^(I understand:|我明白：)/,
  arm: /^(Arm for next wave|设为下一波祭品)$/,
  clear: /^(Clear instruction|清除待用指令)$/,
  armedSword: /Next new wave: Short Sword|下一场新波次：短剑/,
  armedMail: /Next new wave: Chain Mail|下一场新波次：锁子甲/,
  none: /No item armed for the next new wave|尚未为下一场新波次设置祭品/,
  noAttempt: /No recorded attempt for this hero|当前角色没有已记录的尝试/,
  paid: /Short Sword was sacrificed.*35 MP|本次记录已献祭短剑，并支付35点法力/,
  unpaid: /Iron Golem was not prepared|本次记录未准备钢铁石魔/,
  replay: /This is a replay|当前为重播/,
  locked: /This wave keeps its original Iron Golem result|本波保留原始钢铁石魔结果/,
  unlocked: /Iron Golem added now waits|现在加入钢铁石魔需等到下一场新波次/,
  import: /^(Import Save|导入存档)$/,
  save: /^(Save|保存)$/,
  pause: /^(Pause|暂停)$/,
  resume: /^(Resume|继续)$/,
  iron: /^(Iron Golem|钢铁石魔)$/
};
const panel = (page: Page) => page.getByTestId('iron-golem-panel');
const select = (page: Page) => panel(page).getByRole('combobox', { name: names.choose });
const ack = (page: Page) => panel(page).getByRole('checkbox', { name: names.ack });
const status = (page: Page) => panel(page).getByRole('status');
const node = (page: Page, id = IRON) => page.getByTestId('skill-node-' + id);
const ids = (save: NativeSave) => save.inventory.backpack.map((item) => item.id);

async function evidence(info: TestInfo, label: string, value: string | Buffer) {
  const root = process.env.D06_IRON_ARTIFACT_ROOT;
  if (!root) throw new Error('Missing evidence root');
  const runId = process.env.D06_IRON_RUN_ID;
  if (!runId || !/^[a-zA-Z0-9_-]+$/.test(runId)) throw new Error('Missing unique evidence run identity');
  const dir = resolve(root, 'browser-evidence', runId, info.title.replace(/[^a-zA-Z0-9_-]/g, '-'));
  await mkdir(dir, { recursive: true });
  const path = resolve(dir, label);
  await writeFile(path, value, { flag: 'wx' });
  return path;
}
async function download(page: Page, info: TestInfo, label: string): Promise<NativeSave> {
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const path = await (await pending).path();
  if (!path) throw new Error('Native export did not produce a file');
  const json = await readFile(path, 'utf8');
  await evidence(info, label + '.json', json);
  const save = JSON.parse(json) as NativeSave;
  expect(save.version).toBe(11);
  return save;
}
async function nav(page: Page, route: string) {
  await page.locator(`a[href="/${route}"]`).first().click();
  await expect(page.getByTestId(route + '-screen')).toBeVisible();
}
async function save(page: Page) {
  await page.getByRole('button', { name: names.save }).click();
  await expect(page.getByRole('status')).toHaveText(/^(Saved|已保存)$/);
}
async function importSave(page: Page, json: string, succeeds = true) {
  await page.getByRole('button', { name: names.import }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill(json);
  await dialog.getByRole('button', { name: names.import }).click();
  if (succeeds) await expect(dialog).toHaveCount(0);
  else {
    await expect(page.getByRole('status')).toContainText(/Current progress was kept|当前进度已保留/);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  }
}
async function setup(page: Page, info: TestInfo, locale: string, mana = 35) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  await page.getByTestId('home-new-game').click();
  await page.getByTestId('class-necromancer').click();
  await page.getByTestId('character-name-input').fill('Iron native QA');
  await page.getByTestId('character-start-btn').click();
  await expect(page.getByTestId('town-screen')).toBeVisible();
  await nav(page, 'settings');
  await page.getByRole('button', { name: locale === 'en' ? 'English' : '简体中文', exact: true }).click();
  const native = await download(page, info, 'native-v11');
  // Explicitly unearned eligibility and capped core-stat edits; never an earned-clear claim.
  const fixture: NativeSave = {
    ...native,
    player: {
      ...native.player, level: 24, skillPoints: 1,
      coreStats: { strength: 15, dexterity: 500, vitality: 500, energy: 25 },
      derivedStats: { ...native.player.derivedStats, life: 984, lifeMax: 984, mana, manaMax: 179 },
      skillLevels: { 'necromancer.iron_golem': 6, 'necromancer.blood_golem': 1 },
      comboOrder: [IRON]
    },
    inventory: {
      ...native.inventory,
      backpack: [
        { id: FIRST, baseId: 'items/base/wp1h-short-sword', rarity: 'normal', level: 1, identified: true, equipped: false },
        { id: SECOND, baseId: 'items/base/armor-chain-mail', rarity: 'normal', level: 1, identified: true, equipped: false }
      ],
      stash: [], equipped: Object.fromEntries(Object.keys(native.inventory.equipped).map((slot) => [slot, null]))
    },
    mercs: { ...native.mercs, fieldedMercId: null, mercEquipment: {} }
  };
  expect(new Set(ids(fixture)).size).toBe(2);
  const json = JSON.stringify(fixture);
  await evidence(info, 'controlled-fixture.json', json);
  await evidence(info, 'fixture-sha256.txt', createHash('sha256').update(json).digest('hex'));
  await importSave(page, json);
  const observed = await download(page, info, 'imported-v11');
  expect(observed.player.level).toBe(24);
  expect(observed.player.skillLevels).toEqual(fixture.player.skillLevels);
  expect(observed.player.comboOrder).toEqual([IRON]);
  expect(observed.player.coreStats).toEqual(fixture.player.coreStats);
  expect(observed.player.derivedStats.mana).toBe(mana);
  expect(observed.meta.settings.locale).toBe(locale);
  expect(observed.inventory).toEqual(fixture.inventory);
  return fixture;
}
async function skills(page: Page) {
  await nav(page, 'skills');
  await node(page).click();
  await expect(panel(page)).toBeVisible();
}
async function arm(page: Page, item = FIRST) {
  await select(page).selectOption(item);
  await ack(page).check();
  await panel(page).getByRole('button', { name: names.arm }).click();
  await expect(status(page)).toContainText(item === FIRST ? names.armedSword : names.armedMail);
}
async function enter(page: Page) {
  await nav(page, 'map');
  await page.getByTestId('sub-area-row-a1-blood-moor').getByRole('button', { name: /^(Enter|进入)$/ }).click();
  await expect(page.getByTestId('combat-screen')).toBeVisible();
  await expect(page.getByTestId('wave-counter')).toHaveText(/^Wave 1 \/|^第 1 波/);
}
async function progressedAndPaused(page: Page) {
  const card = page.locator('[data-kind="summon"]').filter({ has: page.getByText(names.iron, { exact: true }) });
  await expect(card).toHaveCount(1);
  await expect(card).toBeVisible();
  const identity = await card.getAttribute('data-testid');
  await page.getByRole('button', { name: names.pause }).click();
  await expect(page.getByRole('button', { name: names.resume })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('skip-button')).toBeEnabled();
  await expect(page.getByTestId('next-wave-banner')).toHaveCount(0);
  await expect(page.getByTestId('wave-counter')).toHaveText(/^Wave 1 \/|^第 1 波/);
  return identity;
}
async function minTarget(control: Locator) {
  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
}
async function capturePart(page: Page, info: TestInfo, label: string, target: Locator) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox(), main = await page.locator('main').boundingBox();
  if (!box || !main) throw new Error('Missing visible form bounds');
  expect(box.x).toBeGreaterThanOrEqual(main.x);
  expect(box.x + box.width).toBeLessThanOrEqual(main.x + main.width);
  expect(box.y).toBeGreaterThanOrEqual(main.y - 1);
  expect(box.y + box.height).toBeLessThanOrEqual(main.y + main.height + 1);
  await evidence(info, label + '.png', await target.screenshot());
}
const errorsByContext = new WeakMap<BrowserContext, string[]>();
test.beforeEach(({ page, context }) => {
  const errors: string[] = [];
  errorsByContext.set(context, errors);
  const monitor = (opened: Page) => {
    opened.on('pageerror', (error) => errors.push(error.message));
    opened.on('console', (message) => { if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text()); });
  };
  monitor(page);
  context.on('page', monitor);
});
test.afterEach(({ context }) => {
  expect(errorsByContext.get(context)).toEqual([]);
});

for (const locale of ['en', 'zh-CN']) {
  for (const [width, height] of [[360, 640], [412, 915], [640, 360], [1280, 800], [1920, 1080]] as const) {
    test(`controls ${locale} ${String(width)}x${String(height)}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height });
      const fixture = await setup(page, info, locale);
      await nav(page, 'skills');
      await node(page).hover();
      await expect(panel(page)).toHaveCount(0);
      await node(page).click();
      await expect(panel(page).getByRole('combobox', { name: locale === 'en' ? 'Backpack item' : '背包物品', exact: true })).toBeVisible();
      await expect(panel(page).getByRole('checkbox', { name: locale === 'en'
        ? 'I understand: if Iron Golem prepares successfully in the next new wave, this item will be permanently consumed.'
        : '我明白：若下一场新波次成功召唤钢铁石魔，所选物品将被永久消耗。', exact: true })).not.toBeChecked();
      await expect(select(page)).toHaveValue('');
      await expect(ack(page)).not.toBeChecked();
      await expect(panel(page).getByRole('button', { name: names.arm })).toBeDisabled();
      await select(page).selectOption(FIRST);
      for (const [id, values] of [['iron-preview-current', ['340', '54', '63']], ['iron-preview-next', ['356', '56', '66']]] as const) {
        for (const value of values) await expect(page.getByTestId(id).getByText(value, { exact: true })).toBeVisible();
      }
      await ack(page).check();
      const identity = await panel(page).elementHandle();
      await node(page, BLOOD).hover();
      await expect(ack(page)).toBeChecked();
      await node(page, BLOOD).focus();
      await page.keyboard.press('Tab');
      await expect(select(page)).toHaveValue(FIRST);
      await expect(ack(page)).toBeChecked();
      expect(await panel(page).evaluate((element, original) => element === original, identity)).toBe(true);
      await select(page).focus();
      await page.keyboard.press('Tab');
      await expect(ack(page)).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(panel(page).getByRole('button', { name: names.arm })).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(status(page)).toContainText(names.armedSword);
      for (const key of ['Enter', 'Space']) {
        await node(page, BLOOD).focus();
        await page.keyboard.press(key);
        await expect(panel(page)).toHaveCount(0);
        await node(page).focus();
        await page.keyboard.press('Enter');
        await expect(select(page)).toHaveValue('');
        await expect(ack(page)).not.toBeChecked();
        await expect(status(page)).toContainText(names.armedSword);
      }
      await select(page).selectOption(FIRST);
      await ack(page).check();
      await minTarget(select(page));
      await minTarget(ack(page).locator('..'));
      for (const button of await panel(page).getByRole('button').all()) await minTarget(button);
      expect(await select(page).evaluate((element) => getComputedStyle(element).fontSize)).toBe('16px');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      const metrics = await panel(page).evaluate((element) => {
        const main = element.closest('main');
        if (!main) throw new Error('Missing main scroller');
        return { mainOverflow: main.scrollWidth - main.clientWidth, panelOverflow: element.scrollWidth - element.clientWidth };
      });
      expect(metrics.mainOverflow).toBeLessThanOrEqual(0);
      expect(metrics.panelOverflow).toBeLessThanOrEqual(0);
      await evidence(info, 'layout.json', JSON.stringify({ locale, width, height, ...metrics }));
      await capturePart(page, info, 'rules', panel(page).locator(':scope > div').first());
      await capturePart(page, info, 'choice', select(page).locator('..'));
      await capturePart(page, info, 'current', page.getByTestId('iron-preview-current'));
      await capturePart(page, info, 'next', page.getByTestId('iron-preview-next'));
      await capturePart(page, info, 'acknowledgement', ack(page).locator('..'));
      await capturePart(page, info, 'actions', panel(page).getByRole('button', { name: names.arm }).locator('..'));
      await capturePart(page, info, 'status', status(page));
      await select(page).focus();
      await page.keyboard.press('Tab');
      await evidence(info, 'keyboard-focus.png', await page.screenshot());
      await panel(page).getByRole('button', { name: names.clear }).click();
      await expect(status(page)).toContainText(names.none);
      await nav(page, 'settings');
      const after = await download(page, info, 'after-controls');
      expect(after.inventory).toEqual(fixture.inventory);
      expect(after.player.derivedStats.mana).toBe(35);
      expect(after.player.comboOrder).toEqual([IRON]);
    });
  }

  for (const mana of [35, 34]) {
    test(`startup save Continue ${locale} ${String(mana)}MP`, async ({ page, context }, info) => {
      await page.setViewportSize({ width: 360, height: 640 });
      const fixture = await setup(page, info, locale, mana);
      await skills(page); await arm(page); await enter(page);
      if (mana === 35) await progressedAndPaused(page);
      else await page.getByRole('button', { name: names.pause }).click();
      await skills(page);
      await expect(status(page)).toContainText(mana === 35 ? names.paid : names.unpaid);
      await expect(status(page)).toContainText(names.none);
      await nav(page, 'settings');
      await save(page);
      const after = await download(page, info, 'after-startup');
      expect(after.inventory).toEqual({ ...fixture.inventory, backpack: fixture.inventory.backpack.filter((item) => mana === 34 || item.id !== FIRST) });
      await skills(page);
      await expect(status(page)).toContainText(mana === 35 ? names.paid : names.unpaid);
      await arm(page, SECOND);
      await nav(page, 'settings');
      await save(page);
      await page.close();
      const reopened = await context.newPage();
      await reopened.goto('/');
      await expect(reopened.getByTestId('home-continue')).toBeVisible();
      expect(await reopened.evaluate(() => '__GAME__' in window)).toBe(false);
      await reopened.getByTestId('home-continue').click();
      await skills(reopened);
      await expect(status(reopened)).toContainText(names.none);
      await expect(status(reopened)).toContainText(names.noAttempt);
      await nav(reopened, 'settings');
      const restored = await download(reopened, info, 'after-continue');
      expect(restored.inventory).toEqual(after.inventory);
      expect(restored.meta.settings.locale).toBe(locale);
      await reopened.close();
    });
  }

  test(`locked replay and actual next wave ${locale}`, async ({ page }, info) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await setup(page, info, locale);
    await skills(page); await arm(page); await enter(page);
    const original = await progressedAndPaused(page);
    await skills(page); await arm(page, SECOND);
    await expect(status(page)).toContainText(names.paid);
    await page.locator('#tab-active').click();
    await page.getByRole('combobox', { name: /^(Slot 1|槽位 1)$/ }).selectOption('');
    await page.locator('#tab-tree').click();
    await expect(status(page)).toContainText(names.replay);
    await expect(status(page)).toContainText(names.locked);
    await expect(status(page)).toContainText(names.armedMail);
    await nav(page, 'settings');
    const replayed = await download(page, info, 'replayed-wave');
    expect(ids(replayed)).not.toContain(FIRST);
    expect(ids(replayed)).toContain(SECOND);
    expect(replayed.player.comboOrder.filter(Boolean)).toEqual([]);
    await nav(page, 'combat');
    expect(await progressedAndPaused(page)).toBe(original);
    await page.getByRole('button', { name: /^(Speed|速度)$/ }).click();
    await page.getByRole('button', { name: /^(Speed|速度)$/ }).click();
    await page.getByRole('button', { name: names.resume }).click();
    await expect(page.getByTestId('next-wave-banner')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('wave-counter')).toHaveText(/^Wave 2 \/|^第 2 波/);
    await expect(page.locator('[data-kind="summon"]').filter({ has: page.getByText(names.iron, { exact: true }) })).toHaveCount(0);
    await page.getByRole('button', { name: names.pause }).click();
    await skills(page);
    await expect(status(page)).toContainText(names.unpaid);
    await expect(status(page)).toContainText(names.unlocked);
    await expect(status(page)).toContainText(names.none);
    await nav(page, 'settings');
    const next = await download(page, info, 'actual-wave-two');
    expect(ids(next)).not.toContain(FIRST);
    expect(ids(next)).toContain(SECOND);
    expect(next.player.comboOrder.filter(Boolean)).toEqual([]);
  });

  test(`rejected import preserves authority and backup rollback clears it ${locale}`, async ({ page }, info) => {
    await page.setViewportSize({ width: 360, height: 640 });
    const backup = await setup(page, info, locale);
    await skills(page); await arm(page); await enter(page); await progressedAndPaused(page);
    await skills(page); await arm(page, SECOND); await nav(page, 'settings');
    const before = await download(page, info, 'before-rejected-import');
    await importSave(page, '{"version":11}', false);
    const rejected = await download(page, info, 'after-rejected-import');
    expect(rejected.inventory).toEqual(before.inventory);
    await skills(page);
    await expect(status(page)).toContainText(names.paid);
    await expect(status(page)).toContainText(names.armedMail);
    await nav(page, 'settings');
    // Ordinary preconsumption backup rollback restores its item; no antirollback claim.
    await importSave(page, JSON.stringify(backup));
    const restored = await download(page, info, 'backup-restored');
    expect(restored.inventory).toEqual(backup.inventory);
    expect(ids(restored)).toContain(FIRST);
    await skills(page);
    await expect(status(page)).toContainText(names.none);
    await expect(status(page)).toContainText(names.noAttempt);
    await enter(page);
    await page.getByRole('button', { name: names.pause }).click();
    await skills(page);
    await expect(status(page)).toContainText(names.unpaid);
    await expect(status(page)).toContainText(names.locked);
    await expect(status(page)).toContainText(names.none);
    await nav(page, 'settings');
    expect((await download(page, info, 'fresh-unarmed-recording')).inventory).toEqual(backup.inventory);
  });
}

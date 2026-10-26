/** Native production controls; imported ranks/equipment are explicitly unearned scaffolding. */
import { test, expect, type Page, type Locator, type TestInfo, type BrowserContext } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import type { SaveVersion } from '../../src/engine/types/save';

interface ItemSnapshot { id: string; [key: string]: unknown }
interface NativeSave {
  version: number;
  timestamp: number;
  player: {
    id: string; level: number; class: string; name: string; skillPoints: number;
    coreStats: Record<string, number>;
    derivedStats: Record<string, unknown> & { life: number; lifeMax: number; mana: number; manaMax: number };
    skillLevels: Record<string, number>; comboOrder: string[];
  };
  inventory: { backpack: ItemSnapshot[]; stash: ItemSnapshot[]; equipped: Record<string, unknown> };
  mercs: { fieldedMercId: string | null; mercEquipment: Record<string, unknown> };
  meta: { settings: { locale: string; autoCombat: boolean; combatSpeed: number } };
  formation: unknown;
}
const MAGE = 'skills-necromancer-raise-skeletal-mage';
// Typecheck flags a future version bump without loading game-data imports in Node.
const EXPECTED_SAVE_VERSION: SaveVersion = 22;
const EPOCH = 1792454400000;
const COPY = {
  en: {
    mage: 'Skeletal Mage',
    description: 'Each fresh batch assigns mages Fire → Cold → Lightning → Poison, repeating from Fire. Basic attacks deal their assigned element; no corpse is required. Landed Fire bolts apply 3s Burn (10% of hit damage/s/stack, max 5); Cold applies 2s Chill (−50% Attack Speed); Lightning attempts 1s Paralyze (50% rejection if repeated within 5s); Poison applies 5s Poison (5% of hit damage/s/stack, max 10). Each damage-over-time status retains the first hit rate until it ends, rounded down to at least 1 damage/s per stack. Further Burn or Poison hits add stacks up to the cap and refresh the duration. On death, half the Poison stacks (rounded down, minimum 1) spread to other living enemies for 5s at the captured rate.',
    preparation: 'fill missing living summons up to 4 for one payment of 22 MP for the whole batch.',
    bolts: [/^(?:Skeletal Mage attacks .+ for [1-9]\d* fire damage\.|CRITICAL! Skeletal Mage hits .+ for [1-9]\d* fire damage!)$/,
      /^(?:Skeletal Mage attacks .+ for [1-9]\d* cold damage\.|CRITICAL! Skeletal Mage hits .+ for [1-9]\d* cold damage!)$/,
      /^(?:Skeletal Mage attacks .+ for [1-9]\d* lightning damage\.|CRITICAL! Skeletal Mage hits .+ for [1-9]\d* lightning damage!)$/,
      /^(?:Skeletal Mage attacks .+ for [1-9]\d* poison damage\.|CRITICAL! Skeletal Mage hits .+ for [1-9]\d* poison damage!)$/]
  },
  'zh-CN': {
    mage: '骷髅法师',
    description: '每批新准备的法师按火焰→冰冷→闪电→毒素循环分配元素，每批从火焰开始。普通攻击造成所分配元素的伤害，无需尸体。火焰命中附加3秒燃烧（每层每秒为命中伤害的10%，最多5层）；冰冷命中附加2秒冰冷（攻击速度−50%）；闪电命中尝试附加1秒麻痹（5秒内再次尝试有50%概率被抵抗）；毒素命中附加5秒中毒（每层每秒为命中伤害的5%，最多10层）。每种持续伤害在状态结束前沿用首次命中的每层伤害，向下取整且最低每秒1点。再次命中叠加燃烧或中毒至上限，并刷新持续时间。目标死亡时，一半中毒层数（向下取整，最低1层）以原每层伤害传播给其他存活敌人，持续5秒。',
    preparation: '以整批共 22 点法力补足存活召唤物，最多 4 名。',
    bolts: [/^(?:骷髅法师 普攻 .+，造成 [1-9]\d* 点火焰伤害。|暴击！骷髅法师 对 .+ 造成 [1-9]\d* 点火焰伤害！)$/,
      /^(?:骷髅法师 普攻 .+，造成 [1-9]\d* 点冰冷伤害。|暴击！骷髅法师 对 .+ 造成 [1-9]\d* 点冰冷伤害！)$/,
      /^(?:骷髅法师 普攻 .+，造成 [1-9]\d* 点闪电伤害。|暴击！骷髅法师 对 .+ 造成 [1-9]\d* 点闪电伤害！)$/,
      /^(?:骷髅法师 普攻 .+，造成 [1-9]\d* 点毒素伤害。|暴击！骷髅法师 对 .+ 造成 [1-9]\d* 点毒素伤害！)$/]
  }
} as const;
const names = {
  import: /^(Import Save|导入存档)$/,
  save: /^(Save|保存)$/,
  pause: /^(Pause|暂停)$/,
  resume: /^(Resume|继续)$/,
  slot: /^(Slot 1|槽位 1)$/
};

function runRoot(): string {
  const root = process.env.D06_MAGE_ARTIFACT_ROOT, run = process.env.D06_MAGE_RUN_ID;
  if (!root || !run || !/^[A-Za-z0-9_-]+$/.test(run)) throw new Error('Explicit artifact root and safe unique run ID required');
  return resolve(root, 'browser-evidence', run);
}
async function evidence(info: TestInfo, label: string, value: string | Buffer) {
  if (!/^[A-Za-z0-9_.-]+$/.test(label)) throw new Error('Unsafe evidence label');
  const dir = resolve(runRoot(), info.title.replace(/[^a-zA-Z0-9_-]/g, '-'));
  await mkdir(dir, { recursive: true });
  const path = resolve(dir, label);
  await writeFile(path, value, { flag: 'wx' });
  return path;
}
async function screenshot(info: TestInfo, label: string, locator: Page | Locator) {
  const path = await evidence(info, label + '.png', await locator.screenshot());
  await info.attach(label, { path, contentType: 'image/png' });
}
async function visiblePart(page: Page, info: TestInfo, label: string, target: Locator) {
  await target.scrollIntoViewIfNeeded();
  const rect = await target.boundingBox(), main = await page.getByRole('main').boundingBox();
  const viewport = page.viewportSize();
  if (!rect || !main || !viewport) throw new Error('Missing visible capture geometry');
  const x = Math.max(0, rect.x, main.x), y = Math.max(0, rect.y, main.y);
  const right = Math.min(viewport.width, rect.x + rect.width, main.x + main.width);
  const bottom = Math.min(viewport.height, rect.y + rect.height, main.y + main.height);
  const clip = { x, y, width: right - x, height: bottom - y };
  expect(clip.width).toBeGreaterThan(0); expect(clip.height).toBeGreaterThan(0);
  await evidence(info, label + '-visible-part.json', JSON.stringify({ rect, main, viewport, clip,
    note: 'Only the intersection visible within main and viewport; no full-container visibility claim.' }, null, 2));
  const path = await evidence(info, label + '-visible-part.png', await page.screenshot({ clip }));
  await info.attach(label + '-visible-part', { path, contentType: 'image/png' });
}
async function download(page: Page, info: TestInfo, label: string): Promise<NativeSave> {
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const path = await (await pending).path();
  if (!path) throw new Error('Native export did not produce a file');
  const json = await readFile(path, 'utf8');
  await evidence(info, label + '.json', json);
  const save = JSON.parse(json) as NativeSave;
  expect(save.version).toBe(EXPECTED_SAVE_VERSION);
  return save;
}
async function nav(page: Page, route: string) {
  await page.locator(`a[href="/${route}"]`).first().click();
  await expect(page.getByTestId(route + '-screen')).toBeVisible();
}
async function importSave(page: Page, json: string) {
  await page.getByRole('button', { name: names.import }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill(json);
  await dialog.getByRole('button', { name: names.import }).click();
  await expect(dialog).toHaveCount(0);
}
async function minTarget(control: Locator) {
  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(await page.getByRole('main').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0);
}
async function setup(page: Page, info: TestInfo, locale: 'en' | 'zh-CN') {
  // Date is fixed but native timers run normally; the app derives its own native seed.
  await page.clock.setFixedTime(EPOCH);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  await page.getByTestId('home-new-game').click();
  await page.getByTestId('class-necromancer').click();
  await page.getByTestId('character-name-input').fill('Unearned Mage native QA');
  await page.getByTestId('character-start-btn').click();
  await expect(page.getByTestId('town-screen')).toBeVisible();
  await nav(page, 'settings');
  await page.getByRole('button', { name: locale === 'en' ? 'English' : '简体中文', exact: true }).click();
  const native = await download(page, info, 'native-current');
  const cap: ItemSnapshot = { id: 'native-mage-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
    level: 1, identified: true, equipped: true, socketCapacity: 0, socketContents: [],
    affixes: [{ affixId: 'fixture-mage-survival', values: [
      ['statMods.life', 1000000], ['statMods.defense', 1000000], ['statMods.mana', 1000],
      ['statMods.attackSpeed', -63], ['statMods.attack', -79], ['statMods.critChance', -0.05]
    ] }] };
  const fixture: NativeSave = {
    ...native,
    player: { ...native.player, level: 30, skillPoints: 0,
      coreStats: { strength: 15, dexterity: 25, vitality: 20, energy: 21 },
      derivedStats: { ...native.player.derivedStats, life: 1000372, lifeMax: 1000372, mana: 100,
        manaMax: 1197, attack: 1, defense: 1000114, attackSpeed: 62, critChance: 0 },
      skillLevels: { 'necromancer.raise_skeletal_mage': 6, 'necromancer.raise_skeleton': 1,
        'necromancer.skeleton_mastery': 20 }, comboOrder: [] },
    inventory: { ...native.inventory, backpack: [], stash: [],
      equipped: { ...Object.fromEntries(Object.keys(native.inventory.equipped).map(slot => [slot, null])), head: cap } },
    mercs: { ...native.mercs, fieldedMercId: null, mercEquipment: {} },
    meta: { ...native.meta, settings: { ...native.meta.settings, locale, autoCombat: false, combatSpeed: 1 } }
  };
  const json = JSON.stringify(fixture);
  await evidence(info, 'unearned-fixture.json', json);
  await evidence(info, 'fixture-sha256.txt', createHash('sha256').update(json).digest('hex'));
  await importSave(page, json);
  const imported = await download(page, info, 'imported-current');
  expect(imported.player.skillLevels).toEqual(fixture.player.skillLevels);
  expect(imported.player.comboOrder).toEqual([]);
  expect(imported.player.coreStats).toEqual(fixture.player.coreStats);
  expect(imported.player.derivedStats).toMatchObject(fixture.player.derivedStats);
  expect(imported.inventory).toEqual(fixture.inventory);
  expect(imported.formation).toEqual(fixture.formation);
  return fixture;
}
const errorsByContext = new WeakMap<BrowserContext, string[]>();
test.beforeEach(({ page, context }) => {
  const errors: string[] = [];
  errorsByContext.set(context, errors);
  const monitor = (opened: Page) => {
    opened.on('pageerror', error => errors.push(error.message));
    opened.on('console', message => {
      if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text());
    });
  };
  monitor(page); context.on('page', monitor);
});
test.afterEach(async ({ context }, info) => {
  await evidence(info, 'console-errors.json', JSON.stringify(errorsByContext.get(context)));
  expect(errorsByContext.get(context)).toEqual([]);
});

for (const locale of ['zh-CN', 'en'] as const) {
  for (const [width, height] of [[360, 640], [412, 915], [640, 360], [1280, 800], [1920, 1080]] as const) {
    test(`native Mage ${locale} ${String(width)}x${String(height)}`, async ({ page, context }, info) => {
      await page.setViewportSize({ width, height });
      const fixture = await setup(page, info, locale), copy = COPY[locale];
      await nav(page, 'skills');
      const node = page.getByTestId('skill-node-' + MAGE);
      await node.focus(); await page.keyboard.press('Enter');
      const detail = page.getByTestId('skill-detail-panel');
      await expect(detail).toContainText(copy.description);
      await expect(detail).toContainText(copy.preparation);
      await noOverflow(page); await minTarget(node);
      expect(await detail.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0);
      const rows = locale === 'en'
        ? ['Current', 'Next Level', 'Summon Cap', 'Life', 'Attack', 'Defense', 'Mana Cost']
        : ['当前', '下一级', '召唤上限', '生命', '攻击', '防御', '法力消耗'];
      for (const [index, expected] of [['4', '221.4', '63', '12', '22'], [locale === 'en' ? '4(no change)' : '4（无变化）', '234(+12.6)', '67.2(+4.2)', '12', '22']].entries()) {
        const heading = rows[index];
        if (!heading) throw new Error('Missing independent rank heading');
        const section = detail.getByRole('heading', { name: heading, level: 3, exact: true }).locator('..');
        for (const [stat, value] of expected.entries()) {
          const label = rows[stat + 2];
          if (!label) throw new Error('Missing independent stat label');
          await expect(section.getByText(label, { exact: true }).locator('..').locator('dd')).toHaveText(value);
        }
      }
      await visiblePart(page, info, 'skill-detail', detail);
      await page.locator('#tab-active').click();
      const slot = page.getByRole('combobox', { name: names.slot });
      await slot.selectOption(MAGE); await expect(slot).toHaveValue(MAGE);
      await minTarget(slot); await slot.focus(); await expect(slot).toBeFocused();
      await visiblePart(page, info, 'native-combo', page.getByTestId('skills-active-panel'));
      await nav(page, 'settings');
      const configured = await download(page, info, 'native-combo-current');
      expect(configured.player.comboOrder.filter(Boolean)).toEqual([MAGE]);
      expect(configured.inventory).toEqual(fixture.inventory);
      await nav(page, 'map');
      const enter = page.getByTestId('sub-area-row-a1-catacombs').getByRole('button', { name: /^(Enter|进入)$/ });
      await minTarget(enter); await enter.click();
      await expect(page.getByTestId('combat-screen')).toBeVisible();
      const cards = page.locator('[data-kind="summon"]');
      await expect(cards).toHaveCount(4);
      await page.getByRole('button', { name: names.pause }).click();
      await expect(page.getByRole('button', { name: names.resume })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('wave-counter')).toHaveText(/^Wave 1 \/|^第 1 波/);
      await expect(page.getByTestId('next-wave-banner')).toHaveCount(0);
      const identities = await cards.evaluateAll(elements => elements.map(element => element.getAttribute('data-testid')));
      expect(new Set(identities).size).toBe(4);
      expect(identities.every(id => id?.startsWith('unit-card-'))).toBe(true);
      // Accepted fresh-challenge entry fills1197MP before the single22MP batch payment.
      const mana = page.getByRole('group', { name: /^(MP|法力)$/ }).getByRole('progressbar');
      await expect(mana).toHaveAttribute('aria-valuemax', '1197');
      await expect(mana).toHaveAttribute('aria-valuenow', '1175');
      await noOverflow(page);
      expect(await page.getByTestId('allies-grid').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0);
      await visiblePart(page, info, 'startup-grid', page.getByTestId('allies-grid'));
      for (let index = 0; index < 4; index++) {
        const card = cards.nth(index);
        await expect(card).toContainText(copy.mage);
        await card.scrollIntoViewIfNeeded(); await expect(card).toBeVisible();
        await expect(card).toBeInViewport({ ratio: 1 });
        await screenshot(info, 'mage-card-' + String(index + 1), card);
      }
      const resume = page.getByRole('button', { name: names.resume });
      await minTarget(resume); await resume.click();
      const log = page.getByTestId('combat-log');
      await expect(log).toHaveAttribute('role', 'log'); await expect(log).toHaveAttribute('aria-live', 'polite');
      let observed: string[] = [];
      const effectNames = locale === 'en' ? ['Ignite', 'Chill', 'Paralyze', 'Poison']
        : ['点燃', '冰冷', '麻痹', '中毒'];
      const livingEffects = new Map<string, { id: string; hpPercent: number; labels: string[] }>();
      const dotPattern = locale === 'en' ? /^.+ takes [1-9]\d* damage over time\.$/
        : /^.+ 因持续伤害受到 [1-9]\d* 点伤害。$/;
      await expect.poll(async () => {
        await expect(page.getByTestId('wave-counter')).toHaveText(/^Wave 1 \/|^第 1 波/);
        observed = await log.locator(':scope > div > span:last-child').allTextContents();
        const living = await page.locator('[data-side-testid="combat-enemy-card"]:not([data-dead])')
          .evaluateAll(elements => elements.map(element => ({
            id: element.getAttribute('data-testid') ?? '',
            hpPercent: Number.parseFloat(element.querySelector<HTMLElement>('.bg-red-600')?.style.width ?? '0'),
            labels: Array.from(element.querySelectorAll('[data-testid="unit-effect-chips"] > span'))
              .map(chip => chip.getAttribute('title') ?? '')
          })));
        for (const name of effectNames) {
          const target = living.find(unit => unit.hpPercent > 0 && unit.hpPercent < 100 && unit.labels.includes(name));
          if (target && !livingEffects.has(name)) livingEffects.set(name, target);
        }
        return copy.bolts.every(pattern => observed.some(message => pattern.test(message))) &&
          effectNames.every(name => livingEffects.has(name)) && observed.some(message => dotPattern.test(message));
      }, { timeout: 20_000, intervals: [10, 20, 50] }).toBe(true);
      await page.getByRole('button', { name: names.pause }).click();
      await expect(page.getByRole('button', { name: names.resume })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('skip-button')).toBeEnabled();
      for (const id of ['next-wave-banner', 'victory-panel', 'defeat-panel']) await expect(page.getByTestId(id)).toHaveCount(0);
      await expect(page.getByTestId('wave-counter')).toHaveText(/^Wave 1 \/|^第 1 波/);
      const elemental = copy.bolts.map(pattern => observed.find(message => pattern.test(message)));
      await evidence(info, 'observed-playback.json', JSON.stringify({
        fixture: 'unearned imported current-version native save; native Mage combo only; no fixture skills', epoch: EPOCH,
        seedPolicy: 'native area and Date.now hash; no injected seed and no seed7 oracle',
        identities, elemental, livingEffects: Object.fromEntries(livingEffects),
        positivePeriodicMessages: observed.filter(message => dotPattern.test(message)),
        log: observed, viewport: { width, height }, locale, area: 'areas/act1-catacombs',
        limits: 'Living effect chips and reduced positive HP are observed through the ordinary DOM; periodic loss has a positive native log witness. Exact source IDs, per-tick HP and controls are covered by engine/store/mounted tests.'
      }, null, 2));
      await noOverflow(page); await visiblePart(page, info, 'elemental-log', log);
      for (const [index, pattern] of copy.bolts.entries()) {
        const line = log.locator(':scope > div > span:last-child').filter({ hasText: pattern }).first();
        await line.scrollIntoViewIfNeeded(); await expect(line).toBeVisible();
        await expect(line).toBeInViewport({ ratio: 1 });
        await screenshot(info, 'elemental-line-' + String(index + 1), line);
      }
      await nav(page, 'settings');
      await page.getByRole('button', { name: names.save }).click();
      await expect(page.getByRole('status')).toHaveText(/^(Saved|已保存)$/);
      const beforeClose = await download(page, info, 'before-close-current');
      // Live combat MP and durable player MP differ before settlement; compare actual exports.
      await page.close();
      const reopened = await context.newPage();
      await reopened.setViewportSize({ width, height });
      await reopened.clock.setFixedTime(EPOCH); await reopened.goto('/');
      await reopened.waitForLoadState('networkidle');
      expect(await reopened.evaluate(() => '__GAME__' in window)).toBe(false);
      await reopened.getByTestId('home-continue').click();
      await expect(reopened.getByTestId('town-screen')).toBeVisible();
      await expect(reopened.locator('[data-kind="summon"]')).toHaveCount(0);
      await nav(reopened, 'skills');
      await reopened.locator('#tab-active').click();
      await expect(reopened.getByRole('combobox', { name: names.slot })).toHaveValue(MAGE);
      await noOverflow(reopened); await visiblePart(reopened, info, 'continued-combo', reopened.getByTestId('skills-active-panel'));
      await nav(reopened, 'settings');
      const restored = await download(reopened, info, 'continued-current');
      expect(restored.player).toEqual(beforeClose.player);
      expect(restored.inventory).toEqual(beforeClose.inventory);
      expect(restored.formation).toEqual(beforeClose.formation);
      expect(restored.player.skillLevels).toEqual(fixture.player.skillLevels);
      expect(restored.meta.settings.locale).toBe(locale);
      expect(Object.keys(restored).sort()).toEqual(['endgame', 'formation', 'inventory', 'map', 'mercs', 'meta', 'player', 'timestamp', 'version']);
      await reopened.close();
    });
  }
}

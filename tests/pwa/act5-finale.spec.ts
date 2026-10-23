/** Actual Act V finale controls from a constructed-power service export; never earned C2 proof. */
import { expect, test, type BrowserContext, type Locator, type Page, type TestInfo } from '@playwright/test';
import { readFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createRng, hashSeed } from '../../src/engine/rng';
import type { KillRewards } from '../../src/engine/loot/award';
import { xpTotal } from '../../src/engine/progression/xp';
import { createCharacter, navTo } from '../e2e/_helpers';

const SIEGE = 'quests/act5-siege-on-harrogath', RESCUE = 'quests/act5-rescue-on-mount-arreat';
const PRISON = 'quests/act5-prison-of-ice', RITE = 'quests/act5-rite-of-passage', EVE = 'quests/act5-eve-of-destruction';
type Locale = 'en' | 'zh-CN';
const copy = (locale: Locale) => locale === 'en'
  ? { importSave: 'Import Save', save: 'Save', saved: 'Saved', enter: 'Enter' }
  : { importSave: '导入存档', save: '保存', saved: '已保存', enter: '进入' };
const json = (value: unknown): unknown => JSON.parse(JSON.stringify(value,
  (_key, field: unknown): unknown => field instanceof Map ? [...field] : field)) as unknown;
const hash = (value: string): string => createHash('sha256').update(value).digest('hex');

async function importSave(page: Page, raw: string, locale: Locale): Promise<void> {
  await navTo(page, 'settings');
  const language = locale === 'en' ? 'English' : '简体中文', text = copy(locale);
  await page.getByRole('button', { name: language, exact: true }).click();
  await page.getByRole('button', { name: text.importSave, exact: true }).click();
  const dialog = page.getByRole('dialog'), textbox = dialog.getByRole('textbox');
  // Multiline CDP insertText stalls for large exports; use the player's paste path.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(page.url()).origin });
  await page.evaluate(async value => navigator.clipboard.writeText(value), raw);
  await textbox.click(); await textbox.press('ControlOrMeta+V');
  await expect(textbox).toHaveValue(raw);
  await dialog.getByRole('button', { name: text.importSave, exact: true }).click(); await expect(dialog).toHaveCount(0);
  await navTo(page, 'settings'); await page.getByRole('button', { name: language, exact: true }).click();
}

async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download'); await page.getByTestId('export-save-button').click();
  const download = await pending, path = await download.path();
  if (!path) throw new Error('Missing ordinary save export');
  try { return JSON.parse(await readFile(path, 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}
async function usable(button: Locator): Promise<void> {
  await expect(button).toBeEnabled(); await button.scrollIntoViewIfNeeded(); await expect(button).toBeInViewport();
  const box = await button.boundingBox(); expect(box?.width).toBeGreaterThanOrEqual(44); expect(box?.height).toBeGreaterThanOrEqual(44);
}
async function layout(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function attach(info: TestInfo, name: string, save: SaveCurrent): Promise<void> {
  await info.attach(name, { body: JSON.stringify(save, null, 2), contentType: 'application/json' });
}
async function continued(page: Page, context: BrowserContext, locale: Locale, info: TestInfo,
  stage: string, observe: (page: Page) => void): Promise<Page> {
  const before = await backup(page), text = copy(locale);
  await page.getByRole('button', { name: text.save, exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(text.saved); await page.close();
  const next = await context.newPage(); observe(next); await next.goto('/');
  await next.getByTestId('home-continue').click(); await expect(next.getByTestId('town-screen')).toBeVisible();
  const after = await backup(next);
  for (const key of ['player', 'inventory', 'map', 'mercs', 'formation'] as const) expect(after[key]).toEqual(before[key]);
  await attach(info, stage, after); return next;
}
async function expand(page: Page, target: Locator): Promise<void> {
  if (!(await target.isVisible())) await page.getByRole('button', { name: /(?:Act 5|第 ?5 ?章)/ }).click();
}
async function victory(page: Page, area: string, locale: Locale, info: TestInfo, stage: string): Promise<void> {
  await navTo(page, 'map'); const row = page.getByTestId(`sub-area-row-${area}`); await expand(page, row);
  const enter = row.getByRole('button', { name: copy(locale).enter, exact: true }); await usable(enter); await enter.click();
  await expect(page.getByTestId('combat-battlefield')).toBeVisible();
  await expect.poll(async () => {
    if (await page.getByTestId('victory-panel').isVisible() || await page.getByTestId('defeat-panel').isVisible()) return 'terminal';
    const skip = page.getByTestId('skip-button');
    if (await skip.isEnabled()) {
      try { await skip.click({ timeout: 2000 }); }
      catch (error) {
        if (!(await page.getByTestId('victory-panel').isVisible()) && !(await page.getByTestId('defeat-panel').isVisible())) throw error;
      }
    }
    return 'playing';
  }, { timeout: 60000, intervals: [100, 200, 500] }).toBe('terminal');
  const terminal = page.locator('[data-testid="victory-panel"], [data-testid="defeat-panel"]');
  await terminal.getByRole('heading').scrollIntoViewIfNeeded();
  await expect(terminal.getByRole('heading')).toBeInViewport();
  await layout(page); await info.attach(`${stage}-terminal`, { body: await page.screenshot(), contentType: 'image/png' });
  const nonwin = page.getByTestId('defeat-panel');
  if (await nonwin.isVisible()) throw new Error(`${stage}: ${await nonwin.getByRole('heading').innerText()}`);
  await expect(page.getByTestId('victory-panel')).toBeVisible();
  await page.getByTestId('return-to-map').click();
}
const heroXp = (save: SaveCurrent) => xpTotal(save.player.level) + save.player.experience;
function mercXp(save: SaveCurrent): number {
  const merc = save.mercs.ownedMercs.find(row => row.id === save.mercs.fieldedMercId);
  if (!merc) throw new Error('Missing fielded mercenary');
  const progress = save.mercs.mercProgress[merc.id]; if (!progress) throw new Error('Missing mercenary progress');
  let xp = progress.experience;
  for (let level = 1; level < merc.level; level++) xp += Math.floor(60 * level * 1.30 ** (level - 1));
  return xp;
}

function xpChanges(before: SaveCurrent, after: SaveCurrent, xp: number, bonus = 0): void {
  expect(heroXp(after) - heroXp(before)).toBe(xp);
  expect(mercXp(after) - mercXp(before)).toBe(Math.floor(xp * 0.75));
  expect(after.player.skillPoints - before.player.skillPoints).toBe(after.player.level - before.player.level + bonus);
  expect(after.player.statPoints - before.player.statPoints).toBe(5 * (after.player.level - before.player.level));
}
function cacheChanges(before: SaveCurrent, after: SaveCurrent, reward: KillRewards): void {
  const currencies = { ...before.inventory.currencies };
  for (const [id, amount] of [['rune-shard', reward.runes + reward.runeShards],
    ['gem-shard', reward.gems], ['wishstone', reward.wishstones]] as const) {
    if (amount > 0) currencies[id] = (currencies[id] ?? 0) + amount;
  }
  const payload = (item: Item): unknown => { const { id: _id, ...rest } = item; return json(rest); };
  const added = after.inventory.backpack.slice(before.inventory.backpack.length);
  expect(added.map(payload)).toEqual(reward.items.map(payload));
  const owned = (save: SaveCurrent): readonly Item[] => [...save.inventory.backpack, ...save.inventory.stash,
    ...Object.values(save.inventory.equipped).filter((item): item is Item => item !== null),
    ...Object.values(save.mercs.mercEquipment).flatMap(slots => Object.values(slots).filter((item): item is Item => item !== null))];
  const priorIds = new Set(owned(before).map(item => item.id));
  for (const item of added) expect(priorIds.has(item.id)).toBe(false);
  expect(new Set(owned(after).map(item => item.id)).size).toBe(owned(after).length);
  expect(after.inventory).toEqual({ ...before.inventory,
    backpack: [...before.inventory.backpack, ...added], currencies });
}

const THRONE = `${EVE}#action:throne-waves-victory`, BAAL = `${EVE}#action:baal-victory`;
const ANCIENTS = `${RITE}#action:ancients-victory`;
const waveText = (locale: Locale, n: number): string => locale === 'en'
  ? `Wave ${String(n)} / 8` : `第 ${String(n)} 波 / 共 8 波`;

async function interruptThrone(page: Page, locale: Locale, wins: 4 | 5, info: TestInfo): Promise<void> {
  await navTo(page, 'map'); const row = page.getByTestId('sub-area-row-a5-throne-of-destruction');
  await expand(page, row); await row.getByRole('button', { name: copy(locale).enter, exact: true }).click();
  const counter = page.getByTestId('wave-counter'), skip = page.getByTestId('skip-button');
  for (let wave = 1; wave <= wins; wave++) {
    await expect(counter).toContainText(waveText(locale, wave));
    await usable(skip); await skip.click();
    await expect(counter).toContainText(waveText(locale, wave + 1));
  }
  const pause = page.getByRole('button', { name: locale === 'en' ? 'Pause' : '暂停', exact: true });
  await usable(pause); await pause.click();
  await expect(page.getByRole('button', { name: locale === 'en' ? 'Resume' : '继续', exact: true }))
    .toHaveAttribute('aria-pressed', 'true');
  await expect(skip).toBeEnabled(); await expect(counter).toContainText(waveText(locale, wins + 1));
  await counter.scrollIntoViewIfNeeded(); await layout(page);
  await info.attach(`throne-${String(wins)}-wins-paused`, { body: await page.screenshot(), contentType: 'image/png' });
  await page.getByRole('button', { name: locale === 'en' ? 'Flee' : '逃跑', exact: true }).click();
  await expect(page.getByTestId('map-screen')).toBeVisible();
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`constructed ancestry actual Rite Eve interruption title Nightmare ${locale}`, async ({ page: initial, context }, info) => {
    let page = initial; const errors: string[] = [];
    const observe = (target: Page): void => {
      target.on('pageerror', error => errors.push(error.message));
      target.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    };
    const input = process.env.ACT5_FINALE_INPUT_SAVE, output = process.env.ACT5_DELIVERY_OUTPUT;
    if (!input || !output) throw new Error('Missing task-owned finale paths');
    const raw = await readFile(input, 'utf8'); expect(hash(raw)).toBe('977f1f09a2a737f9f54c8ccba76e147954e5839517762db6e212f24356f03746');
    const prior = JSON.parse(raw) as SaveCurrent;
    for (const quest of [SIEGE, RESCUE, PRISON]) expect(prior.map.questProgress[quest]?.rewardClaimed).toBe(true);
    for (const quest of [RITE, EVE]) expect(prior.map.questProgress[quest]?.status).toBe('inProgress');
    expect(prior.map.questReceipts[THRONE]).toBeUndefined(); expect(prior.map.questReceipts[BAAL]).toBeUndefined();
    const cacheDir = `${output}/oracle-cache-${info.project.name}-${locale}`;
    const oracle = await createServer({ configFile: false, logLevel: 'error',
      root: fileURLToPath(new URL('../..', import.meta.url)), cacheDir,
      resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
      server: { middlewareMode: true, watch: null, hmr: false, ws: false } });
    try {
      const codec = await oracle.ssrLoadModule('/src/engine/save/validate.ts') as typeof import('../../src/engine/save/validate');
      expect(json(codec.decodeSave(JSON.parse(raw)))).toEqual(json(prior));
      observe(page); await page.goto('/'); await createCharacter(page, { class: 'sorceress', name: 'Finale fixture' });
      await importSave(page, raw, locale); const imported = await backup(page);
      for (const key of ['player', 'inventory', 'map', 'mercs', 'formation'] as const) expect(imported[key]).toEqual(prior[key]);
      await navTo(page, 'map'); await expect(page.getByTestId('replay-profile-nightmare')).toBeDisabled();
      await victory(page, 'a5-ancients-way', locale, info, 'all-three-ancients');
      const rite = await backup(page); expect(rite.map.questReceipts[ANCIENTS]).toBe(true);
      await navTo(page, 'quests'); const claimRite = page.getByTestId(`quest-claim-${RITE}`);
      await usable(claimRite); await claimRite.click(); await expect(claimRite).toBeDisabled();
      const ritePaid = await backup(page); xpChanges(rite, ritePaid, 15000, 1); expect(ritePaid.inventory).toEqual(rite.inventory);
      page = await continued(page, context, locale, info, 'rite-claimed-continued', observe);
      await interruptThrone(page, locale, 4, info); const four = await backup(page);
      expect(four.map.questReceipts[THRONE]).toBeUndefined(); expect(four.map.questReceipts[BAAL]).toBeUndefined();
      expect(four.map.questProgress[EVE]?.objectives).toEqual({ 'obj-throne-waves': false, 'obj-kill-baal': false });
      page = await continued(page, context, locale, info, 'four-waves-abandoned-continued', observe);
      await interruptThrone(page, locale, 5, info); const five = await backup(page);
      expect(five.map.questReceipts[THRONE]).toBe(true); expect(five.map.questReceipts[BAAL]).toBeUndefined();
      expect(five.map.questProgress[EVE]?.objectives).toEqual({ 'obj-throne-waves': true, 'obj-kill-baal': false });
      expect(five.map.questTitles).toEqual({}); expect(five.map.questDifficulties).toEqual({});
      page = await continued(page, context, locale, info, 'five-waves-proof-continued', observe);
      await victory(page, 'a5-throne-of-destruction', locale, info, 'new-qualified-baal');
      const baal = await backup(page);
      expect(baal.map.questReceipts[THRONE]).toBe(true); expect(baal.map.questReceipts[BAAL]).toBe(true);
      expect(baal.map.questProgress[EVE]?.status).toBe('completed');
      expect(baal.map.questProgress[EVE]?.rewardClaimed).not.toBe(true);
      expect(baal.map.questTitles).toEqual({}); expect(baal.map.questDifficulties).toEqual({});
      await attach(info, 'baal-won-before-separate-claim', baal);
      const award = await oracle.ssrLoadModule('/src/engine/loot/award.ts') as typeof import('../../src/engine/loot/award');
      const loot = await oracle.ssrLoadModule('/src/data/loaders/loot.ts') as typeof import('../../src/data/loaders/loot');
      const rewardInput = { tableId: 'loot/baal-q', ilvl: 82, picks: 5 };
      const seed = hashSeed(JSON.stringify(['quest-loot-table-v1', baal.player.id, EVE, rewardInput.tableId, 82, 5]));
      const expected = award.rollQuestTableRewards(rewardInput, loot.loadAwardPools(), createRng(seed));
      if (!expected) throw new Error('Invalid authored Baal quest cache');
      await navTo(page, 'quests'); const claimEve = page.getByTestId(`quest-claim-${EVE}`);
      await usable(claimEve); await claimEve.click(); await expect(claimEve).toBeDisabled();
      const paid = await backup(page); xpChanges(baal, paid, 40000); cacheChanges(baal, paid, expected);
      expect(paid.map.questTitles).toEqual({ 'titles/slayer_of_baal': true });
      expect(paid.map.questDifficulties).toEqual({ 'difficulty/nightmare': true });
      expect(paid.map.selectedTitle).toBeNull(); expect(paid.map.selectedDifficulty).toBe('normal');
      await navTo(page, 'quests'); await expect(page.getByTestId(`quest-claim-${EVE}`)).toBeDisabled();
      const repeated = await backup(page);
      for (const key of ['player', 'inventory', 'map', 'mercs', 'formation'] as const) expect(repeated[key]).toEqual(paid[key]);
      page = await continued(page, context, locale, info, 'eve-cache-entitlements-continued', observe);
      await navTo(page, 'town'); const title = page.getByTestId('quest-title-slayer');
      await usable(title); const titleName = await title.innerText(); await title.click();
      await expect(title).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('town-screen')).toContainText(`${paid.player.name} · ${titleName}`);
      const titled = await backup(page);
      expect(titled.map).toEqual({ ...paid.map, selectedTitle: 'titles/slayer_of_baal' });
      for (const key of ['player', 'inventory', 'mercs', 'formation'] as const) expect(titled[key]).toEqual(paid[key]);
      page = await continued(page, context, locale, info, 'selected-title-continued', observe);
      await navTo(page, 'map'); const nightmare = page.getByTestId('replay-profile-nightmare');
      await usable(nightmare); await nightmare.click(); await expect(nightmare).toHaveAttribute('aria-pressed', 'true');
      const selected = await backup(page);
      expect(selected.map).toEqual({ ...titled.map, selectedDifficulty: 'nightmare' });
      for (const key of ['player', 'inventory', 'mercs', 'formation'] as const) expect(selected[key]).toEqual(titled[key]);
      await navTo(page, 'map'); const nmRow = page.getByTestId('sub-area-row-a5-bloody-foothills'); await expand(page, nmRow);
      const data = await oracle.ssrLoadModule('/src/data/index.ts') as typeof import('../../src/data');
      const baseLevel = data.subAreas.find(row => row.id === 'areas/act5-bloody-foothills')?.areaLevel;
      if (baseLevel === undefined) throw new Error('Missing authored replay area level');
      await expect(nmRow).toContainText(String(baseLevel + 20));
      await victory(page, 'a5-bloody-foothills', locale, info, 'nightmare-actual-victory');
      const replayed = await backup(page);
      expect(replayed.map.challengeOrdinals).toEqual({ normal: selected.map.challengeOrdinals.normal,
        nightmare: selected.map.challengeOrdinals.nightmare + 1 });
      expect(replayed.map.clearedSubAreas).toEqual(selected.map.clearedSubAreas);
      expect(replayed.map.nightmareClearedSubAreas).toEqual(['areas/act5-bloody-foothills']);
      expect(replayed.map.questProgress).toEqual(selected.map.questProgress);
      expect(replayed.map.questReceipts).toEqual(selected.map.questReceipts);
      expect(heroXp(replayed)).toBeGreaterThan(heroXp(selected));
      page = await continued(page, context, locale, info, 'nightmare-victory-continued', observe);
      await navTo(page, 'map'); const normal = page.getByTestId('replay-profile-normal'); await usable(normal); await normal.click();
      await expect(normal).toHaveAttribute('aria-pressed', 'true');
      const restored = await backup(page);
      expect(restored.map).toEqual({ ...replayed.map, selectedDifficulty: 'normal' });
      for (const key of ['player', 'inventory', 'mercs', 'formation'] as const) expect(restored[key]).toEqual(replayed[key]);
      page = await continued(page, context, locale, info, 'normal-restored-continued', observe);
      await navTo(page, 'town'); await page.getByTestId('quest-title-slayer').scrollIntoViewIfNeeded(); await layout(page);
      await info.attach('selected-title-final', { body: await page.screenshot(), contentType: 'image/png' });
      expect(errors).toEqual([]);
    } finally { await oracle.close(); await rm(cacheDir, { recursive: true, force: true }); }
  });
}

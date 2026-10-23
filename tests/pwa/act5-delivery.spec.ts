/** Constructed-power functional browser proof, separate from fresh earned campaign acceptance. */
import { expect, test, type BrowserContext, type Locator, type Page, type TestInfo } from '@playwright/test';
import { readFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
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
  const dialog = page.getByRole('dialog'); await dialog.getByRole('textbox').fill(raw);
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
async function inspect(page: Page, area: string): Promise<void> {
  await navTo(page, 'map'); const button = page.getByTestId(`area-objects-${area}`);
  await expand(page, button); await usable(button); await button.click(); await expect(page.getByTestId('area-object-panel')).toBeVisible();
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
function exactClaim(before: SaveCurrent, after: SaveCurrent, xp: number, points = 0): void {
  expect(heroXp(after) - heroXp(before)).toBe(xp); expect(mercXp(after) - mercXp(before)).toBe(Math.floor(xp * 0.75));
  expect(after.player.skillPoints - before.player.skillPoints).toBe(after.player.level - before.player.level + points);
  expect(after.player.statPoints - before.player.statPoints).toBe(5 * (after.player.level - before.player.level));
  for (const key of ['backpack', 'stash', 'equipped', 'currencies'] as const) expect(after.inventory[key]).toEqual(before.inventory[key]);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`constructed A4 migration and actual Siege Rescue rewards ${locale}`, async ({ page: initial, context }, info) => {
    let page = initial; const errors: string[] = [];
    const observe = (target: Page): void => {
      target.on('pageerror', error => errors.push(error.message));
      target.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    };
    const input = process.env.ACT5_INPUT_SAVE, output = process.env.ACT5_DELIVERY_OUTPUT;
    if (!input || !output) throw new Error('Missing task-owned browser paths');
    const raw = await readFile(input, 'utf8');
    expect(hash(raw)).toBe('08d2531df6df82f1c305b02136515b5bd8e97d368af14f9cd6e8b962f076eb79');
    const cacheDir = `${output}/oracle-cache-${info.project.name}-${locale}`;
    const oracle = await createServer({ configFile: false, logLevel: 'error',
      root: fileURLToPath(new URL('../..', import.meta.url)), cacheDir,
      resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
      server: { middlewareMode: true, watch: null, hmr: false, ws: false } });
    try {
      const codec = await oracle.ssrLoadModule('/src/engine/save/validate.ts') as typeof import('../../src/engine/save/validate');
      const decoded = codec.decodeSave(JSON.parse(raw));
      const expected = json(decoded) as SaveCurrent;
      observe(page); await page.goto('/'); await createCharacter(page, { class: 'sorceress', name: 'A5 fixture' });
      await importSave(page, raw, locale);
      const imported = await backup(page);
      for (const key of ['player', 'inventory', 'map', 'mercs', 'formation'] as const) expect(imported[key]).toEqual(expected[key]);
      expect(Object.keys(imported.map.questProgress).filter(id => id.startsWith('quests/act5-'))).toEqual([]);
      expect(imported.inventory.questServices).toEqual({}); expect(imported.map.questTitles).toEqual({});
      expect(imported.map.questDifficulties).toEqual({}); await attach(info, 'migrated-actual-a4-export', imported);
      // BUG108: separately declared power for flat AoE damage, never earned balance evidence.
      // First prove the untouched historical migration above; alter only the existing constructed cap below.
      const cap = decoded.inventory.equipped.head;
      expect(cap?.id).toBe('a3-browser-constructed-cap');
      if (!cap) throw new Error('Missing declared constructed-power cap');
      const modifiers = [['statMods.critChance', 0.95], ['statMods.critDamage', 10000], ['statMods.mana', 100000]] as const;
      const powered: Item = { ...cap, affixes: [...(cap.affixes ?? []), {
        affixId: 'act5-functional-aoe-only', values: new Map<string, number>(modifiers) }] };
      const equipment: Readonly<Record<string, Item | null>> = { ...decoded.inventory.equipped, head: powered };
      const composition = await oracle.ssrLoadModule('/src/engine/progression/equipped-stats.ts') as typeof import('../../src/engine/progression/equipped-stats');
      const prepared: SaveCurrent = { ...decoded, inventory: { ...decoded.inventory, equipped: equipment },
        player: { ...decoded.player, equipment: Object.values(equipment).filter((item): item is Item => item !== null),
          derivedStats: composition.deriveEquippedPlayerStats(decoded.player, decoded.player.level, equipment,
            decoded.map.questProgress, decoded.inventory.questItems, decoded.map.questReceipts) } };
      expect(json(codec.decodeSave(json(prepared)))).toEqual(json(prepared));
      const preparedRaw = JSON.stringify(json(prepared));
      await info.attach('constructed-preparation-delta', { body: JSON.stringify({ originalSha256: hash(raw),
        preparedSha256: hash(preparedRaw), itemId: cap.id, addedLegacyModifiers: modifiers,
        preservesCurrentLife: prepared.player.derivedStats.life === decoded.player.derivedStats.life,
        preservesCurrentMana: prepared.player.derivedStats.mana === decoded.player.derivedStats.mana }), contentType: 'application/json' });
      await importSave(page, preparedRaw, locale);
      const ready = await backup(page);
      for (const key of ['player', 'inventory', 'map', 'mercs', 'formation'] as const) expect(ready[key]).toEqual((json(prepared) as SaveCurrent)[key]);
      await navTo(page, 'skills'); await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
      await page.getByRole('combobox', { name: `${locale === 'en' ? 'Slot' : '槽位'} 1`, exact: true })
        .selectOption('skills-sorceress-frost-nova');
      const configured = await backup(page);
      expect(configured.player).toEqual({ ...ready.player, comboOrder: ['skills-sorceress-frost-nova'] });
      for (const key of ['inventory', 'map', 'mercs', 'formation'] as const) expect(configured[key]).toEqual(ready[key]);
      await attach(info, 'constructed-functional-preparation', configured);
      await navTo(page, 'quests');
      for (const id of [SIEGE, RESCUE, PRISON, RITE, EVE]) {
        const start = page.getByTestId(`quest-start-${id}`); await usable(start); await start.click();
      }
      await inspect(page, 'a5-frigid-highlands');
      for (const n of [1, 2, 3]) await expect(page.getByTestId(`quest-action-actions/act5-release-barbarian-cage-${String(n)}`)).toBeDisabled();
      await victory(page, 'a5-bloody-foothills', locale, info, 'shenk');
      const siege = await backup(page); expect(siege.map.questReceipts[`${SIEGE}#action:shenk-victory`]).toBe(true);
      await navTo(page, 'quests'); const claimSiege = page.getByTestId(`quest-claim-${SIEGE}`);
      await usable(claimSiege); await claimSiege.click(); await expect(claimSiege).toBeDisabled();
      const siegePaid = await backup(page); exactClaim(siege, siegePaid, 10000);
      expect(siegePaid.inventory.questServices[`${SIEGE}#reward:service`]).toEqual({ serviceId: 'socket_item', state: 'available' });
      await victory(page, 'a5-frigid-highlands', locale, info, 'frigid'); const frigid = await backup(page);
      await inspect(page, 'a5-frigid-highlands');
      for (const n of [3, 1, 2]) {
        const cage = page.getByTestId(`quest-action-actions/act5-release-barbarian-cage-${String(n)}`);
        await usable(cage); await cage.focus(); await cage.press('Enter'); await expect(cage).toBeDisabled();
      }
      const freed = await backup(page); expect(freed.player).toEqual(frigid.player); expect(freed.mercs).toEqual(frigid.mercs);
      expect(freed.map.questProgress[RESCUE]?.status).toBe('completed');
      await navTo(page, 'quests'); await page.getByTestId(`quest-claim-${RESCUE}`).click();
      const rescuePaid = await backup(page); exactClaim(freed, rescuePaid, 8000, 1);
      for (const channel of ['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison'] as const) {
        expect(rescuePaid.player.derivedStats.resistances[channel]).toBe(freed.player.derivedStats.resistances[channel] + 5);
      }
      page = await continued(page, context, locale, info, 'siege-rescue-claimed-continued', observe);
      await layout(page); expect(errors).toEqual([]);
    } finally { await oracle.close(); await rm(cacheDir, { recursive: true, force: true }); }
  });
}

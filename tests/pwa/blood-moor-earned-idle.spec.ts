/** One bounded fresh production Blood Moor → active idle repeat/stop pilot. */
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const fixedTime = new Date('2026-10-20T12:00:00.000Z');
const name = 'Earned Moor';
const fire = 'skills-sorceress-fire-bolt';
const frost = 'skills-sorceress-frost-nova';
const ice = 'skills-sorceress-ice-bolt';
const merc = 'mercs/act1-rogue-inner-sight';
const ranks = { 'sorceress.frost_nova': 1, 'sorceress.ice_bolt': 1 };
const reachXP = [0, 0, 100, 665, 2223, 5423, 11013];
const nextXP = [0, 100, 565, 1558, 3200, 5590, 8818];
const itemAwards = [5, 6, 6, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12];
const shardAwards = [75, 84, 91, 99, 107, 119, 131, 141, 150, 158, 169, 180, 190];

async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}
async function stored(page: Page): Promise<SaveCurrent> {
  return page.evaluate(() => new Promise<SaveCurrent>((resolve, reject) => {
    const open = indexedDB.open('D2H5TextGame');
    open.onerror = () => { reject(new Error('Could not open saved character')); };
    open.onsuccess = () => {
      const db = open.result;
      const get = db.transaction('saves', 'readonly').objectStore('saves').get('current');
      get.onerror = () => { db.close(); reject(new Error('Could not read saved character')); };
      get.onsuccess = () => {
        const record = get.result as { data: SaveCurrent } | undefined;
        db.close();
        if (!record) reject(new Error('No committed character'));
        else resolve(record.data);
      };
    };
  }));
}
async function production(page: Page) {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function tree(page: Page, skill: string) {
  await navTo(page, 'skills');
  await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
  await page.getByTestId(`skill-node-${skill}`).click();
  return page.getByTestId('skill-detail-panel');
}
async function slots(page: Page, english: boolean, selected: readonly string[]) {
  await navTo(page, 'skills');
  await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
  for (let slot = 1; slot <= 9; slot += 1) {
    const select = page.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} ${String(slot)}`, exact: true });
    await select.selectOption(selected[slot - 1] ?? '');
    await expect(select).toHaveValue(selected[slot - 1] ?? '');
  }
  await production(page);
}
async function countMonsters(cards: Locator) {
  let count = 0;
  for (const card of await cards.all()) {
    const badge = card.locator(':scope > div:first-of-type > div').filter({ hasText: /^\+\d+$/ });
    expect(await badge.count()).toBeLessThanOrEqual(1);
    count += 1 + (await badge.count() ? Number((await badge.innerText()).slice(1)) : 0);
  }
  return count;
}
async function enter(page: Page, english: boolean, area = 'a1-blood-moor', started?: () => void) {
  await navTo(page, 'map');
  await page.getByTestId(`sub-area-row-${area}`)
    .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
  started?.();
  await expect(page.getByTestId('combat-screen')).toBeVisible();
  expect(await wave(page)).toBe(1);
}
async function wave(page: Page) {
  const value = /^\D*(\d+)/.exec(await page.getByTestId('wave-counter').innerText())?.[1];
  if (!value) throw new Error('Missing numeric wave');
  return Number(value);
}
async function pause(page: Page, english: boolean) {
  await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click({ timeout: 500 });
  await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }))
    .toHaveAttribute('aria-pressed', 'true');
}
async function flee(page: Page, english: boolean) {
  await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
  await expect(page.getByTestId('map-screen')).toBeVisible();
}
async function attach(info: TestInfo, label: string, value: unknown) {
  await info.attach(label, { body: JSON.stringify(value), contentType: 'application/json' });
}
/** One readonly DOM observation before native inter-wave navigation can replace it. */
async function terminalDOM(page: Page) {
  return page.evaluate(() => {
    const hero = document.querySelector('[data-testid="unit-card-player-1792497600000"]');
    const log = Array.from(document.querySelectorAll('[data-testid="combat-log"] > div > span:last-child'), node => node.textContent ?? '');
    return {
      waveText: document.querySelector('[data-testid="wave-counter"]')?.textContent,
      waveKind: document.querySelector('[data-testid="wave-kind-label"]')?.textContent,
      heroPresent: hero !== null,
      heroDead: hero?.getAttribute('data-dead') ?? null,
      heroHPPercent: Number.parseFloat(hero?.querySelector<HTMLElement>('.bg-red-600')?.style.width ?? 'NaN'),
      idleMode: document.querySelector('[data-testid="idle-loop-label"]') !== null,
      enemyRoster: Array.from(document.querySelectorAll('[data-testid="enemies-grid"] [data-testid^="unit-card-"]'),
        node => ({ id: node.getAttribute('data-testid'), dead: node.getAttribute('data-dead') === 'true' })),
      liveEnemies: document.querySelectorAll('[data-testid="enemies-grid"] [data-testid^="unit-card-"]:not([data-dead="true"])').length,
      defeatPanels: document.querySelectorAll('[data-testid="defeat-panel"]').length,
      deadMerc: document.querySelectorAll('[data-testid="allies-grid"] [data-kind="merc"][data-dead="true"]').length,
      skipDisabled: document.querySelector<HTMLButtonElement>('[data-testid="skip-button"]')?.disabled,
      log,
      allies: document.querySelector('[data-testid="allies-grid"]')?.textContent,
      enemies: document.querySelector('[data-testid="enemies-grid"]')?.textContent
    };
  });
}
function expectTerminal(result: Awaited<ReturnType<typeof terminalDOM>>, expectedWave: number, opening: Awaited<ReturnType<typeof terminalDOM>>, idleMode = false) {
  expect(Number(/^\D*(\d+)/.exec(result.waveText ?? '')?.[1])).toBe(expectedWave);
  expect(result.idleMode).toBe(idleMode);
  expect(opening.idleMode).toBe(idleMode);
  expect(opening.enemyRoster.length).toBeGreaterThan(0);
  expect(result.enemyRoster.map(enemy => enemy.id)).toEqual(opening.enemyRoster.map(enemy => enemy.id));
  expect(result.enemyRoster.every(enemy => enemy.dead)).toBe(true);
  expect(Number.isFinite(result.heroHPPercent)).toBe(true);
  expect(result.heroHPPercent).toBeGreaterThan(0);
  expect(result.skipDisabled).toBe(true);
  expect(result.log.at(-1)).toBe('Victory! All enemies are defeated.');
  expect(result.defeatPanels).toBe(0);
  expect(result.liveEnemies).toBe(0);
  expect(result.heroPresent).toBe(true);
  expect(result.heroDead).not.toBe('true');
}
function expectPlayer(actual: SaveCurrent, configured: SaveCurrent, totalXP: number, fireRank: number, spent: number, questPoints = 0) {
  const level = totalXP >= 11013 ? 6 : totalXP >= 5423 ? 5 : totalXP >= 2223 ? 4 : totalXP >= 665 ? 3 : totalXP >= 100 ? 2 : 1;
  expect(actual.player).toEqual({ ...configured.player, level, experience: totalXP - (reachXP[level] ?? -1),
    experienceToNextLevel: nextXP[level], statPoints: (level - 1) * 5,
    skillPoints: level - 1 - spent + questPoints,
    skillLevels: { ...ranks, 'sorceress.fire_bolt': fireRank },
    derivedStats: { ...configured.player.derivedStats, lifeMax: 120 + 8 * (level - 1),
      manaMax: 102 + 4 * (level - 1), attack: 22 + 2 * (level - 1), defense: 20 + 3 * (level - 1) } });
}
function expectMerc(actual: SaveCurrent, hired: SaveCurrent, earnedXP: number, equipment = hired.mercs.mercEquipment) {
  const initial = hired.mercs.ownedMercs[0];
  if (!initial) throw new Error('Missing normally hired mercenary');
  let level = 3;
  let xp = earnedXP;
  const threshold = (rank: number) => Math.floor(60 * rank * 1.3 ** (rank - 1));
  while (xp >= threshold(level)) { xp -= threshold(level); level += 1; }
  const gains = level - 3;
  expect(actual.mercs).toEqual({ ...hired.mercs, mercEquipment: equipment, ownedMercs: [{ ...initial, level,
    coreStats: { ...initial.coreStats, strength: initial.coreStats.strength + gains,
      dexterity: initial.coreStats.dexterity + 3 * gains, energy: initial.coreStats.energy + gains },
    derivedStats: { ...initial.derivedStats, life: initial.derivedStats.life + 8 * gains,
      lifeMax: initial.derivedStats.lifeMax + 8 * gains } }],
    mercProgress: { [merc]: { experience: xp, experienceToNextLevel: threshold(level) } } });
}
// Independently frozen literals from accepted merc-gear-earned.spec.ts; no item injection.
const mercGlove: Item = { id: 'it-8jv2k-1', baseId: 'items/base/glove-leather', rarity: 'normal', level: 2, ilvl: 2, baseRolls: { defense: 4 }, affixes: [], generatedName: {}, identified: true, equipped: false };
const heroGlove: Item = { id: 'it-96fga-3', baseId: 'items/base/glove-leather', rarity: 'normal', level: 2, ilvl: 2, baseRolls: { defense: 5 }, affixes: [], generatedName: {}, identified: true, equipped: false };
const heroBoots: Item = { id: 'it-5iwwr-4', baseId: 'items/base/boot-leather', rarity: 'normal', level: 2, ilvl: 2, baseRolls: { defense: 3 }, affixes: [], generatedName: {}, identified: true, equipped: false };

test('fresh earned Blood Moor unlocks active idle, repeats, stops and persists en', async ({ page, context }, info) => {
  test.setTimeout(180_000);
  const english = true;
  const counts = { starts: 0, computedWaves: 0, skipClicks: 0, observedSettlements: 0 };
  let phase = 'creation';
  let activePage = page;
  const errors: string[] = [];
  let lastJournal: SaveCurrent | null = null;
  let lastTerminal: Awaited<ReturnType<typeof terminalDOM>> | null = null;
  const reads: { label: string; elapsedMs: number; items: number; shards: number | undefined }[] = [];
  const began = performance.now();
  async function committed(label: string, previous: SaveCurrent) {
    let current = previous;
    await expect.poll(async () => {
      current = await stored(page);
      reads.push({ label, elapsedMs: performance.now() - began, items: current.inventory.backpack.length,
        shards: current.inventory.currencies['rune-shard'] });
      return current.inventory.backpack.length > previous.inventory.backpack.length &&
        (current.inventory.currencies['rune-shard'] ?? 0) > (previous.inventory.currencies['rune-shard'] ?? 0);
    }, { timeout: 1000, intervals: [25] }).toBe(true);
    lastJournal = current;
    await attach(info, label, current);
    return current;
  }
  const watch = (watched: Page) => {
    watched.on('pageerror', error => errors.push(error.message));
    watched.on('console', message => { if (['warning', 'error'].includes(message.type())) errors.push(message.text()); });
  };
  watch(page);
  try {
    await page.clock.setFixedTime(fixedTime); // Date only; timers remain native.
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state), { timeout: 60_000 }).toBe('activated');
    const fresh = await backup(page);
    expect(fresh.map.clearedSubAreas).toEqual([]);
    expect(fresh.meta.idleState.idleTarget).toBeUndefined();
    await navTo(page, 'map');
    await expect(page.getByTestId('farm-locked-a1-blood-moor')).toBeDisabled();
    await attach(info, 'fresh', fresh);
    expect(fresh.player).toMatchObject({ level: 1, experience: 0, statPoints: 0, skillPoints: 1, skillLevels: ranks });
    expect(fresh.inventory.backpack).toEqual([]);
    expect(fresh.inventory.equipped).toEqual({});
    const locked = await tree(page, frost);
    await expect(locked.getByRole('button', { name: 'Requires Lv. 6', exact: true })).toBeDisabled();
    expect(await backup(page)).toEqual({ ...fresh, player: { ...fresh.player, comboOrder: [ice] } });
    await navTo(page, 'mercs');
    await page.getByTestId(`hire-merc-${merc}`).getByRole('button', { name: 'Hire', exact: true }).click();
    const hired = await backup(page);
    await attach(info, 'hired', hired);
    expect(hired.inventory).toEqual(fresh.inventory);
    expect(hired.mercs.fieldedMercId).toBe(merc);
    expect(hired.mercs.ownedMercs).toHaveLength(1);
    expect(hired.mercs.ownedMercs[0]?.level).toBe(3);
    expect(hired.mercs.mercProgress).toEqual({ [merc]: { experience: 0, experienceToNextLevel: 304 } });
    await tree(page, fire);
    await page.getByTestId('skill-detail-panel').getByRole('button', { name: 'Allocate', exact: true }).click();
    const learned = await backup(page);
    expect(learned).toEqual({ ...hired, player: { ...hired.player, skillPoints: 0,
      skillLevels: { ...ranks, 'sorceress.fire_bolt': 1 } } });
    await slots(page, english, [fire]);
    const configured = await backup(page);
    await attach(info, 'configured', configured);
    expect(configured).toEqual({ ...learned, player: { ...learned.player, comboOrder: [fire] } });
    let totalXP = 0;
    let items = 0;
    let shards = 0;
    let earned = configured;
    phase = 'forty-earned-first-waves';
    for (let ordinal = 0; ordinal < 40; ordinal += 1) {
      await test.step(`earned prep ordinal ${String(ordinal)}`, async () => {
        await enter(page, english, 'a1-blood-moor', () => { counts.starts += 1; counts.computedWaves += 1; });
        await attach(info, `prep-opening-${String(ordinal)}`, {
          ordinal, wave: await wave(page), waveKind: await page.getByTestId('wave-kind-label').innerText(),
          enemies: await page.getByTestId('enemies-grid').innerText(), allies: await page.getByTestId('allies-grid').innerText()
        });
        expect(await countMonsters(page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]'))).toBe(8 + ordinal % 13);
        await expect(page.getByTestId('allies-grid').locator('[data-kind="merc"]')).toHaveCount(1);
        const opening = await terminalDOM(page);
        await page.getByTestId('skip-button').click(); counts.skipClicks += 1;
        await expect(page.getByTestId('skip-button')).toBeDisabled();
        const result = await terminalDOM(page);
        await attach(info, `prep-result-${String(ordinal)}`, result);
        lastTerminal = result;
        expectTerminal(result, 1, opening);
        await expect.poll(() => wave(page), { timeout: 5000, intervals: [50] }).toBe(2);
        counts.computedWaves += 1; counts.observedSettlements += 1;
        await pause(page, english);
        expect(await wave(page)).toBe(2);
        await flee(page, english);
        const before = earned;
        earned = await backup(page); lastJournal = earned;
        await attach(info, `prep-${String(ordinal)}`, earned);
        totalXP += (8 + ordinal % 13) * 20;
        items += itemAwards[ordinal % 13] ?? 0;
        shards += shardAwards[ordinal % 13] ?? 0;
        expectPlayer(earned, configured, totalXP, 1, 0);
        expectMerc(earned, hired, totalXP * 0.75);
        expect(earned.inventory.backpack).toHaveLength(items);
        expect(earned.inventory.backpack.slice(0, before.inventory.backpack.length)).toEqual(before.inventory.backpack);
        expect(earned.inventory.currencies).toEqual({ 'rune-shard': shards });
        expect(earned.inventory.equipped).toEqual({});
        expect(earned.inventory.stash).toEqual([]);
        expect(earned.map.clearedSubAreas).toEqual([]);
        expect(earned.meta.idleState.idleTarget).toBeUndefined();
      });
    }
    expect(totalXP).toBe(11080);
    expect(items).toBe(344);
    expect(shards).toBe(5157);
    expect(earned.player).toMatchObject({ level: 6, experience: 67, experienceToNextLevel: 8818, skillPoints: 5, statPoints: 25 });
    expect(earned.mercs.ownedMercs[0]).toMatchObject({ level: 9, coreStats: { strength: 18, dexterity: 40, vitality: 16, energy: 20 },
      derivedStats: { life: 196, lifeMax: 196, mana: 79, manaMax: 79, attack: 25, defense: 26, attackSpeed: 122 } });
    expect(earned.mercs.mercProgress[merc]).toEqual({ experience: 249, experienceToNextLevel: 4404 });
    expect(new Set(earned.inventory.backpack.map(item => item.id)).size).toBe(344);
    expect(earned.player.equipment).toEqual([]);
    for (const item of [mercGlove, heroGlove, heroBoots]) {
      expect(earned.inventory.backpack.find(candidate => candidate.id === item.id)).toEqual(item);
    }
    await attach(info, 'earned-level-six', earned);

    phase = 'prepare-same40A';
    const detail = await tree(page, frost);
    for (let point = 0; point < 5; point += 1)
      await detail.getByRole('button', { name: 'Allocate', exact: true }).click();
    await slots(page, english, [frost, fire]);
    for (const item of [heroGlove, heroBoots]) {
      await navTo(page, 'inventory');
      await page.getByTestId(`inv-item-${item.id}`).click();
      await page.getByTestId('inv-primary-action').click();
    }
    await navTo(page, 'mercs');
    await page.getByTestId(`merc-equipment-${merc}`).click();
    await page.getByTestId('merc-equip-slot-gloves').getByText('Gloves', { exact: true }).click();
    const choices = page.getByRole('dialog').getByRole('listitem')
      .filter({ has: page.getByRole('button', { name: 'Equip', exact: true }) });
    // Exact candidate is the first still-earned glove in the native ordered picker.
    expect(earned.inventory.backpack.filter(item => item.baseId === 'items/base/glove-leather' &&
      ![heroGlove.id, heroBoots.id].includes(item.id))[0]).toEqual(mercGlove);
    await choices.first().getByRole('button', { name: 'Equip', exact: true }).click();
    await page.keyboard.press('Escape');
    await page.getByTestId('character-hud').click();
    for (let point = 0; point < 10; point += 1)
      await page.getByRole('button', { name: 'Increase Energy', exact: true }).click();
    for (let point = 0; point < 15; point += 1)
      await page.getByRole('button', { name: 'Increase Vitality', exact: true }).click();
    await expect(page.getByTestId('char-draft-remaining')).toHaveText('0');
    await page.getByRole('button', { name: 'Apply attributes', exact: true }).click();
    const prepared = await backup(page);
    await attach(info, 'prepared-same40A', prepared);
    const selected = new Set([heroGlove.id, heroBoots.id, mercGlove.id]);
    expect(prepared).toEqual({ ...earned,
      inventory: { ...earned.inventory, backpack: earned.inventory.backpack.filter(item => !selected.has(item.id)),
        equipped: { gloves: { ...heroGlove, equipped: true }, boots: { ...heroBoots, equipped: true } } },
      player: { ...earned.player, statPoints: 0, skillPoints: 0,
        coreStats: { strength: 10, dexterity: 25, vitality: 25, energy: 45 },
        derivedStats: { ...earned.player.derivedStats, life: 120, lifeMax: 190, mana: 102, manaMax: 137, defense: 43 },
        comboOrder: [frost, fire], skillLevels: { ...ranks, 'sorceress.fire_bolt': 1, 'sorceress.frost_nova': 6 } },
      mercs: { ...earned.mercs, mercEquipment: { [merc]: { gloves: { ...mercGlove, equipped: true, equipSlot: 'gloves' } } } }
    });
    expect(prepared.inventory.backpack).toHaveLength(341);
    await navTo(page, 'map');
    await expect(page.getByTestId('farm-locked-a1-blood-moor')).toBeDisabled();

    async function completeThreeWaves(label: string, previous: SaveCurrent) {
      let journal = previous;
      for (const index of [1, 2, 3]) {
        expect(await wave(page)).toBe(index);
        const opening = await terminalDOM(page);
        await attach(info, `${label}-opening-${String(index)}`, opening);
        await page.getByTestId('skip-button').click(); counts.skipClicks += 1;
        await expect(page.getByTestId('skip-button')).toBeDisabled();
        const terminal = await terminalDOM(page);
        await attach(info, `${label}-terminal-${String(index)}`, terminal);
        lastTerminal = terminal;
        expectTerminal(terminal, index, opening, label === 'idle');
        if (index < 3) {
          await expect.poll(() => wave(page), { timeout: 5000, intervals: [50] }).toBe(index + 1);
          counts.computedWaves += 1; counts.observedSettlements += 1;
        } else {
          await expect(page.getByTestId('victory-panel')).toBeVisible({ timeout: 5000 });
          counts.observedSettlements += 1;
          await attach(info, `${label}-qualified-victory`, {
            terminal: await terminalDOM(page), loot: await page.getByTestId('loot-summary').innerText()
          });
        }
        journal = await committed(`${label}-settled-${String(index)}`, journal);
      }
      return journal;
    }
    phase = 'first-earned-manual-clear';
    await enter(page, english, 'a1-blood-moor', () => { counts.starts += 1; counts.computedWaves += 1; });
    const manualSettled = await completeThreeWaves('manual', prepared);
    await page.getByTestId('return-to-map').click();
    await expect(page.getByTestId('map-screen')).toBeVisible();
    await expect(page.getByTestId('cleared-badge-a1-blood-moor')).toBeVisible();
    await expect(page.getByTestId('farm-here-a1-blood-moor')).toBeEnabled();
    const cleared = await backup(page); await attach(info, 'first-earned-manual-clear', cleared);
    expect(cleared).toEqual(manualSettled);
    expect(cleared.map.clearedSubAreas).toEqual(['areas/act1-blood-moor']);
    expect(cleared.meta.idleState.idleTarget).toBeUndefined();
    expect(cleared.player.experience).toBeGreaterThan(prepared.player.experience);
    expect(cleared.inventory.backpack.length).toBeGreaterThan(prepared.inventory.backpack.length);
    expect(cleared.inventory.backpack.slice(0, 341)).toEqual(prepared.inventory.backpack);
    expect(cleared.inventory.currencies['rune-shard']).toBeGreaterThan(5157);
    expect(cleared.inventory.equipped).toEqual(prepared.inventory.equipped);
    await navTo(page, 'map');
    phase = 'native-idle-clear-and-auto-repeat';
    await page.getByTestId('farm-here-a1-blood-moor').click();
    counts.starts += 1; counts.computedWaves += 1;
    await expect(page.getByTestId('combat-screen')).toBeVisible();
    await expect(page.getByTestId('idle-loop-label')).toBeVisible();
    const idleSettled = await completeThreeWaves('idle', cleared);
    expect(idleSettled.meta.idleState.idleTarget).toBeDefined();
    // Sole driver of the new run is the native post-victory effect.
    await expect.poll(() => wave(page), { timeout: 5000, intervals: [50] }).toBe(1);
    counts.starts += 1; counts.computedWaves += 1;
    await pause(page, english);
    await expect(page.getByTestId('skip-button')).toBeEnabled();
    await expect(page.getByTestId('idle-loop-label')).toBeVisible();
    await expect(page.getByTestId('victory-panel')).toHaveCount(0);
    await expect(page.getByTestId('defeat-panel')).toHaveCount(0);
    await attach(info, 'automatic-repeat-paused-before-award', await terminalDOM(page));
    await info.attach('repeat-paused', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    expect(await stored(page)).toEqual(idleSettled);
    phase = 'combat-stop-and-no-late-award';
    await page.getByRole('button', { name: 'Stop Farm', exact: true }).click();
    await expect(page.getByTestId('map-screen')).toBeVisible();
    await expect(page.getByTestId('idle-location-banner')).toHaveCount(0);
    const stopped = await backup(page); await attach(info, 'stopped-before-wait', stopped);
    const stoppedIdleState = { ...idleSettled.meta.idleState };
    delete stoppedIdleState.idleTarget;
    expect(stopped).toEqual({ ...idleSettled, meta: { ...idleSettled.meta, idleState: stoppedIdleState } });
    expect(stopped.meta.idleState.idleTarget).toBeUndefined();
    expect(stopped.map.clearedSubAreas).toEqual(cleared.map.clearedSubAreas);
    expect(stopped.player.experience).toBeGreaterThan(cleared.player.experience);
    expect(stopped.inventory.backpack.length).toBeGreaterThan(cleared.inventory.backpack.length);
    expect(stopped.inventory.backpack.slice(0, cleared.inventory.backpack.length)).toEqual(cleared.inventory.backpack);
    expect(stopped.inventory.currencies['rune-shard']).toBeGreaterThan(cleared.inventory.currencies['rune-shard'] ?? 0);
    expect(new Set(stopped.inventory.backpack.map(item => item.id)).size).toBe(stopped.inventory.backpack.length);
    await page.waitForTimeout(4000); // Observe beyond the native 1500ms restart delay; never accelerates time.
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    expect(await backup(page)).toEqual(stopped);
    await navTo(page, 'map');
    await expect(page.getByTestId('idle-location-banner')).toHaveCount(0);
    await expect(page.getByTestId('farm-here-a1-blood-moor')).toBeEnabled();
    await info.attach('stopped-map', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    phase = 'save-and-same-context-reopen';
    await navTo(page, 'settings');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Saved');
    const saved = await backup(page); expect(saved).toEqual(stopped); await expect.poll(() => stored(page), { timeout: 2000, intervals: [25] }).toEqual(saved);
    await attach(info, 'saved-stopped', saved);
    await page.close();
    const reopened = await context.newPage(); activePage = reopened; watch(reopened);
    await reopened.clock.setFixedTime(fixedTime);
    await reopened.goto('/');
    await reopened.getByTestId('home-continue').click();
    await expect(reopened.getByTestId('town-screen')).toBeVisible();
    expect(await stored(reopened)).toEqual(saved);
    expect(await backup(reopened)).toEqual(saved);
    await production(reopened);
    await navTo(reopened, 'map');
    await expect(reopened.getByTestId('idle-location-banner')).toHaveCount(0);
    await expect(reopened.getByTestId('cleared-badge-a1-blood-moor')).toBeVisible();
    await expect(reopened.getByTestId('farm-here-a1-blood-moor')).toBeEnabled();
    expect(counts).toEqual({ starts: 43, computedWaves: 87, skipClicks: 46, observedSettlements: 46 });
    expect(errors).toEqual([]);
    phase = 'complete';
  } finally {
    let diagnosticError: string | null = null;
    try {
      if (!activePage.isClosed()) await attach(info, 'failure-or-final-dom', await terminalDOM(activePage));
    } catch (error) { diagnosticError = String(error); }
    await attach(info, 'pilot-position-and-counts', { phase, counts, errors,
      lastJournal, lastTerminal, committedReads: reads, diagnosticError,
      accountingPrecision: phase === 'complete' ? 'complete source-derived successful path' :
        'lower bound: failed/unfinished click or transition may have computed additional unobserved work',
      expectedSourceDerivedSeed: 2330410254, expectedSourceDerivedOrdinals: { manual: 40, idle: 41, repeat: 42 },
      accounting: 'computed includes installed unplayed prep W2 and repeated W1; no bridge/direct run handle observation' });
  }
});

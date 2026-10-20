/** Native earned glove, source-reconstructed first Fire Bolt mitigation and save/reopen. */
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const mercId = 'mercs/act1-rogue-inner-sight';
const fixedTime = new Date('2026-10-20T12:00:00.000Z');
const drops: readonly Item[] = [
  { id: 'it-8jv2k-1', baseId: 'items/base/glove-leather', rarity: 'normal', level: 2, ilvl: 2, baseRolls: { defense: 4 }, affixes: [], generatedName: {}, identified: true, equipped: false },
  { id: 'it-3yxk7-2', baseId: 'items/base/glove-leather', rarity: 'normal', level: 2, ilvl: 2, baseRolls: { defense: 3 }, affixes: [], generatedName: {}, identified: true, equipped: false },
  { id: 'it-96fga-3', baseId: 'items/base/glove-leather', rarity: 'normal', level: 2, ilvl: 2, baseRolls: { defense: 5 }, affixes: [], generatedName: {}, identified: true, equipped: false },
  { id: 'it-5iwwr-4', baseId: 'items/base/boot-leather', rarity: 'normal', level: 2, ilvl: 2, baseRolls: { defense: 3 }, affixes: [], generatedName: {}, identified: true, equipped: false },
  { id: 'it-3h1j3-5', baseId: 'items/base/amu-tin', rarity: 'normal', level: 2, ilvl: 2, baseRolls: {}, affixes: [], generatedName: {}, identified: true, equipped: false }
];
const glove = drops[0];
if (!glove) throw new Error('Missing frozen first-compatible glove');
const equippedGlove: Item = { ...glove, equipped: true, equipSlot: 'gloves' };

async function exportBackup(page: Page): Promise<SaveCurrent> {
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}

async function readStoredSave(page: Page): Promise<SaveCurrent> {
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

async function expectProduction(page: Page): Promise<void> {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function currentWave(page: Page): Promise<number> {
  const text = await page.getByTestId('wave-counter').innerText();
  const number = /^\D*(\d+)/.exec(text)?.[1];
  if (!number) throw new Error(`Missing numeric wave counter: ${text}`);
  return Number(number);
}

/** Compact grid cards show one representative plus a +N badge per stack. */
async function displayedMonsterCount(cards: Locator): Promise<number> {
  let count = 0;
  for (const card of await cards.all()) {
    const badge = card.locator(':scope > div:first-of-type > div').filter({ hasText: /^\+\d+$/ });
    expect(await badge.count()).toBeLessThanOrEqual(1);
    count += 1 + (await badge.count() ? Number((await badge.innerText()).slice(1)) : 0);
  }
  return count;
}

async function attach(info: TestInfo, name: string, value: unknown): Promise<void> {
  await info.attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });
}

async function inspectGlove(page: Page, english: boolean, info: TestInfo, name: string): Promise<void> {
  await page.getByTestId(`merc-equipment-${mercId}`).click();
  await page.getByTestId('merc-equip-slot-gloves-details').click();
  const modal = page.getByTestId('equipped-item-modal');
  await expect(modal).toContainText(english ? 'Leather Gloves' : '皮手套');
  await expect(modal.getByTestId('item-tooltip-defense')).toHaveText(english ? 'Defense: 4' : '防御: 4');
  await expectProduction(page);
  await info.attach(name, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  await page.getByTestId('equipped-item-modal-close').click();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('merc-equip-slot-gloves')).toHaveCount(0);
}

async function enterAndAwardWaveOne(page: Page, english: boolean, monsters: number): Promise<void> {
  await navTo(page, 'map');
  await page.getByTestId('sub-area-row-a1-blood-moor')
    .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
  await expect(page.getByTestId('combat-screen')).toBeVisible();
  expect(await currentWave(page)).toBe(1);
  expect(await displayedMonsterCount(page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]'))).toBe(monsters);
  await expect(page.getByTestId('allies-grid').locator('[data-kind="hero"]')).toHaveCount(1);
  await expect(page.getByTestId('allies-grid').locator('[data-kind="merc"]')).toHaveCount(1);
  await page.getByTestId('skip-button').click();
  await expect(page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]:not([data-dead="true"])')).toHaveCount(0);
  await expect(page.getByTestId('allies-grid').locator('[data-kind="hero"]')).not.toHaveAttribute('data-dead', 'true');
  await expect.poll(() => currentWave(page), { timeout: 5000, intervals: [50] }).toBe(2);
  await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click({ timeout: 500 });
  await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await currentWave(page)).toBe(2);
  await expect(page.getByTestId('allies-grid').locator('[data-kind="summon"]')).toHaveCount(0);
}

async function flee(page: Page, english: boolean): Promise<void> {
  await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
  await expect(page.getByTestId('map-screen')).toBeVisible();
}

interface Witness { index: number; action: string; damage: string; amount: number; critical: boolean }
function firstFireBolt(log: readonly string[], mercName: string, english: boolean): Witness | undefined {
  for (let index = 0; index < log.length - 1; index++) {
    const action = log[index] ?? '';
    const suffix = english ? ' casts Fire Bolt.' : ' 施放了 火弹。';
    if (!action.endsWith(suffix)) continue;
    const actor = action.slice(0, -suffix.length);
    // Authored raw unit names are independently checked before matrix acceptance.
    if (!actor.startsWith(english ? 'Fallen Shaman ' : '堕落者萨满 ')) continue;
    const damage = log[index + 1] ?? '';
    const critical = damage.startsWith(english ? 'CRITICAL!' : '暴击！');
    const prefix = english
      ? (critical ? `CRITICAL! ${actor} hits ${mercName} for ` : `${actor} attacks ${mercName} for `)
      : (critical ? `暴击！${actor} 对 ${mercName} 造成 ` : `${actor} 普攻 ${mercName}，造成 `);
    const tail = english ? (critical ? ' fire damage!' : ' fire damage.') : (critical ? ' 点火焰伤害！' : ' 点火焰伤害。');
    if (!damage.startsWith(prefix) || !damage.endsWith(tail)) continue;
    const amount = Number(damage.slice(prefix.length, -tail.length));
    if (Number.isInteger(amount) && amount > 0) return { index, action, damage, amount, critical };
  }
  return undefined;
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`earned mercenary glove reduces first Fire Bolt and survives reopen ${locale}`, async ({ page, context }, info) => {
    const english = locale === 'en';
    const errors: string[] = [];
    const observe = (target: Page): void => {
      target.on('pageerror', error => errors.push(`page: ${error.message}`));
      target.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
    };
    observe(page);
    await page.clock.setFixedTime(fixedTime); // Date only; native timers.
    await page.goto('/');
    await createCharacter(page, { class: 'druid', name: 'Earned Merc Gear' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state), { timeout: 60_000 }).toBe('activated');
    const beforeHire = await exportBackup(page);
    expect(beforeHire.player.level).toBe(1);
    expect(beforeHire.player.experience).toBe(0);
    expect(beforeHire.inventory.backpack).toEqual([]);
    expect(beforeHire.mercs.ownedMercs).toEqual([]);
    await navTo(page, 'mercs');
    await page.getByTestId(`hire-merc-${mercId}`).getByRole('button', { name: english ? 'Hire' : '招募', exact: true }).click();
    await expect(page.getByTestId(`merc-field-${mercId}`)).toHaveText(english ? 'Unfield' : '撤下');
    await navTo(page, 'settings');
    const baseline = await exportBackup(page);
    await attach(info, '01-ordinary-hire', baseline);
    expect(baseline.inventory.currencies).toEqual(beforeHire.inventory.currencies);
    expect(baseline.mercs.ownedMercs).toHaveLength(1);
    expect(baseline.mercs.fieldedMercId).toBe(mercId);
    expect(baseline.mercs.mercEquipment).toEqual({ [mercId]: {} });
    const merc = baseline.mercs.ownedMercs[0];
    if (!merc) throw new Error('Missing ordinarily hired merc');
    expect(merc.level).toBe(3);
    expect(merc.coreStats).toEqual({ strength: 12, dexterity: 22, vitality: 16, energy: 14 });
    expect(merc.derivedStats).toMatchObject({ life: 148, lifeMax: 148, mana: 79, manaMax: 79, attack: 25, defense: 26, attackSpeed: 122 });
    await enterAndAwardWaveOne(page, english, 8);
    await flee(page, english);
    await navTo(page, 'settings');
    const earned = await exportBackup(page);
    await attach(info, '02-earned-before-equip', earned);
    expect(earned.inventory.backpack).toEqual(drops);
    expect(earned.inventory.currencies).toEqual({ ...baseline.inventory.currencies, 'rune-shard': (baseline.inventory.currencies['rune-shard'] ?? 0) + 75 });
    expect(earned.player).toMatchObject({ level: 2, experience: 60, experienceToNextLevel: 565, statPoints: 5, skillPoints: 2 });
    expect(earned.mercs).toEqual({ ...baseline.mercs, mercProgress: { [mercId]: { experience: 120, experienceToNextLevel: 304 } } });
    await navTo(page, 'mercs');
    await page.getByTestId(`merc-equipment-${mercId}`).click();
    await page.getByTestId('merc-equip-slot-gloves').getByText(english ? 'Gloves' : '手套', { exact: true }).click();
    const choices = page.getByRole('dialog').getByRole('listitem').filter({ has: page.getByRole('button', { name: english ? 'Equip' : '装备', exact: true }) });
    await expect(choices).toHaveCount(3);
    await choices.first().getByRole('button', { name: english ? 'Equip' : '装备', exact: true }).click();
    await page.keyboard.press('Escape');
    await inspectGlove(page, english, info, '03-equipped-item');
    await navTo(page, 'settings');
    const equipped = await exportBackup(page);
    await attach(info, '04-canonical-equipped-save', equipped);
    expect(equipped).toEqual({ ...earned,
      inventory: { ...earned.inventory, backpack: drops.slice(1) },
      mercs: { ...earned.mercs, mercEquipment: { [mercId]: { gloves: equippedGlove } } }
    });
    await enterAndAwardWaveOne(page, english, 9);
    expect(await displayedMonsterCount(page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]'))).toBe(10);
    const messages = (): Promise<string[]> => page.getByTestId('combat-log').locator(':scope > div > span:last-child').allTextContents();
    await attach(info, '05-wave-two-before-resume', await messages());
    await page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }).click();
    let witness: Witness | undefined;
    try {
      await expect.poll(async () => {
        witness = firstFireBolt(await messages(), english ? 'Rogue Scout — Inner Sight' : '罗格侦察兵 — 内视', english);
        return witness !== undefined;
      }, { timeout: 30_000, intervals: [50] }).toBe(true);
    } finally {
      await attach(info, '06-wave-two-observed-prefix', await messages());
    }
    await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click({ timeout: 500 });
    await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await currentWave(page)).toBe(2);
    const prefix = await messages();
    expect(prefix).toContain(english ? 'Turn 1 begins' : '第 1 回合开始');
    expect(prefix.length).toBeLessThan(200); // Store cap: a capped log is not a complete prefix.
    expect(firstFireBolt(prefix, english ? 'Rogue Scout — Inner Sight' : '罗格侦察兵 — 内视', english)).toEqual(witness);
    const mercCard = page.getByTestId('allies-grid').locator('[data-kind="merc"]');
    await expect(mercCard).not.toHaveAttribute('data-dead', 'true');
    await expect(page.getByTestId('allies-grid').locator('[data-kind="hero"]')).not.toHaveAttribute('data-dead', 'true');
    await attach(info, '07-first-landed-fire-bolt', { witness, prefix, hpStyle: await mercCard.locator('.bg-red-600').getAttribute('style') });
    await expectProduction(page);
    await info.attach('08-native-combat-paused', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    await info.attach('08b-native-combat-log', { body: await page.getByTestId('combat-log').screenshot(), contentType: 'image/png' });
    // Independently reconstructed before matrix: seed3062484588 draws71–74,
    // target roll3 of0..3 (hero/merc weights2:2), hit, raw35, noncritical.
    // Fire resistance0 / flat0 / combo1: floor(35−30)=5; bare defense26 gives9.
    // See docs/plans/evidence/p13c01b-earned-merc-gear.md for carried-state proof.
    expect(witness).toEqual({
      index: 39,
      action: english ? 'Fallen Shaman A casts Fire Bolt.' : '堕落者萨满 A 施放了 火弹。',
      damage: english ? 'Fallen Shaman A attacks Rogue Scout — Inner Sight for 5 fire damage.'
        : '堕落者萨满 A 普攻 罗格侦察兵 — 内视，造成 5 点火焰伤害。',
      amount: 5,
      critical: false
    });
    await flee(page, english);
    await navTo(page, 'settings');
    const afterCombat = await exportBackup(page);
    await attach(info, '09-after-combat', afterCombat);
    expect(afterCombat.player).toMatchObject({ level: 2, experience: 240, experienceToNextLevel: 565, statPoints: 5, skillPoints: 2 });
    expect(afterCombat.mercs).toEqual({ ...equipped.mercs, mercProgress: { [mercId]: { experience: 255, experienceToNextLevel: 304 } } });
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    const saved = await exportBackup(page);
    expect(saved).toEqual(afterCombat);
    expect(await readStoredSave(page)).toEqual(saved);
    await attach(info, '10-committed-save', saved);
    await page.close();
    const reopened = await context.newPage();
    observe(reopened);
    await reopened.goto('/');
    await reopened.getByTestId('home-continue').click();
    await expect(reopened.getByTestId('town-screen')).toBeVisible();
    await navTo(reopened, 'settings');
    await expect(reopened.getByRole('button', { name: english ? 'English' : '简体中文', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await readStoredSave(reopened)).toEqual(saved);
    const reopenedSave = await exportBackup(reopened);
    expect(reopenedSave).toEqual(saved);
    await attach(info, '10b-reopened-full-save', reopenedSave);
    await navTo(reopened, 'mercs');
    await expect(reopened.getByTestId(`merc-field-${mercId}`)).toHaveText(english ? 'Unfield' : '撤下');
    await expect(reopened.getByTestId(`merc-xp-${mercId}`)).toContainText('255 / 304');
    await inspectGlove(reopened, english, info, '11-reopened-equipped-item');
    await attach(info, '12-browser-errors', errors);
    expect(errors).toEqual([]);
  });
}

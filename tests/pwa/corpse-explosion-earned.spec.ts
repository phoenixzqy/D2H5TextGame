/** Frozen accelerated native-UI farming experiment. No imports, injected state, gear or respecs. */
import { errors, expect, test, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const NAME = 'Earned Corpse', TEETH = 'skills-necromancer-teeth';
const SKELETON = 'skills-necromancer-raise-skeleton', CE = 'skills-necromancer-corpse-explosion';
const MERC = 'mercs/act1-rogue-inner-sight';
const reachXP = [0, 0, 100, 665, 2223, 5423, 11013];
const nextXP = [0, 100, 565, 1558, 3200, 5590, 8818];
interface Frame {
  at: number; wave: string; mp: number; logs: string[];
  monsters: { id: string; dead: boolean; hp: number }[];
  heroDead: boolean; defeat: boolean;
}
async function attach(info: TestInfo, label: string, value: unknown): Promise<void> {
  await info.attach(label, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });
}
async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const file = await pending;
  try { return JSON.parse(await readFile(await file.path(), 'utf8')) as SaveCurrent; }
  finally { await file.delete(); }
}
async function detail(page: Page, node: string) {
  await navTo(page, 'skills');
  await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
  await page.getByTestId(`skill-node-${node}`).click();
  return page.getByTestId('skill-detail-panel');
}
async function slots(page: Page, nodes: string[]): Promise<void> {
  await navTo(page, 'skills');
  await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
  for (let i = 1; i <= 9; i++) {
    await page.getByRole('combobox', { name: `Slot ${String(i)}`, exact: true }).selectOption(nodes[i - 1] ?? '');
  }
}
async function wave(page: Page): Promise<number> {
  return Number(/^\D*(\d+)/.exec(await page.getByTestId('wave-counter').innerText())?.[1]);
}
async function enter(page: Page): Promise<void> {
  await navTo(page, 'map');
  await page.getByTestId('sub-area-row-a1-blood-moor').getByRole('button', { name: 'Enter', exact: true }).click();
  await expect(page.getByTestId('combat-screen')).toBeVisible();
  expect(await wave(page)).toBe(1);
}
async function pause(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Pause', exact: true }).click({ timeout: 500 });
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toHaveAttribute('aria-pressed', 'true');
}
async function frame(page: Page): Promise<Frame> {
  return page.evaluate(() => ({
    at: performance.now(), wave: document.querySelector('[data-testid="wave-counter"]')?.textContent ?? '',
    mp: Number(document.querySelector('[role="group"][aria-label="MP"] [role="progressbar"]')?.getAttribute('aria-valuenow')),
    logs: Array.from(document.querySelectorAll('[data-testid="combat-log"] > div > span:last-child'), n => n.textContent ?? ''),
    monsters: Array.from(document.querySelectorAll<HTMLElement>('[data-side-testid="combat-enemy-card"][data-kind="monster"]'), n => ({
      id: n.dataset.testid ?? '', dead: n.dataset.dead === 'true', hp: Number.parseFloat(n.querySelector<HTMLElement>('.bg-red-600')?.style.width ?? 'NaN') })),
    heroDead: document.querySelector('[data-testid="allies-grid"] [data-kind="hero"]')?.getAttribute('data-dead') === 'true',
    defeat: document.querySelector('[data-testid="defeat-panel"]') !== null
  }));
}
function expectEarned(save: SaveCurrent, configured: SaveCurrent, total: number): void {
  const level = total >= 11013 ? 6 : total >= 5423 ? 5 : total >= 2223 ? 4 : total >= 665 ? 3 : total >= 100 ? 2 : 1;
  expect(save.player).toEqual({ ...configured.player, level, experience: total - (reachXP[level] ?? -1),
    experienceToNextLevel: nextXP[level], skillPoints: level - 1, statPoints: (level - 1) * 5,
    derivedStats: { ...configured.player.derivedStats, lifeMax: configured.player.derivedStats.lifeMax + (level - 1) * 8,
      manaMax: configured.player.derivedStats.manaMax + (level - 1) * 4,
      attack: configured.player.derivedStats.attack + (level - 1) * 2,
      defense: configured.player.derivedStats.defense + (level - 1) * 3 } });
  expect(save.inventory.equipped).toEqual({});
  expect(save.inventory.stash).toEqual([]);
  expect(save.mercs.mercEquipment).toEqual({ [MERC]: {} });
  expect(save.map.clearedSubAreas).toEqual([]);
}
function fire(line: string): boolean {
  return (line.startsWith(`${NAME} attacks `) || line.startsWith(`CRITICAL! ${NAME} hits `)) && /for [1-9]\d* fire damage[.!]/.test(line);
}

test('records one bounded fresh earned Necromancer-to-CE pilot', async ({ page }, info) => {
  test.setTimeout(180_000); // Hard preparation deadline, including creation and all in-flight UI/export work.
  const began = performance.now(), consoleErrors: string[] = [];
  const attempts: unknown[] = [];
  let outcome = 'protocol-incomplete', earned: SaveCurrent | undefined, totalXP = 0, phase = 'creation';
  page.on('pageerror', e => consoleErrors.push(e.message));
  page.on('console', m => { if (['warning', 'error'].includes(m.type())) consoleErrors.push(`${m.type()}: ${m.text()}`); });
  try {
    const oracleBytes = await readFile(join(process.env.EARNED_CORPSE_ROOT ?? '', 'loot-oracle.json'));
    expect(createHash('sha256').update(oracleBytes).digest('hex')).toBe('95e6b7f7f531f62d5725b78eb88786e02209f22858bb95a440c09f2ad0e735f8');
    const lootOracle = JSON.parse(oracleBytes.toString()) as { ordinal: number; addedItems: unknown[]; currencies: Record<string, number> }[];
    expect(lootOracle).toHaveLength(40);
    await page.clock.setFixedTime(new Date('2026-10-20T12:00:00.000Z')); // Date only; native playback timers.
    await page.goto('/'); await createCharacter(page, { class: 'necromancer', name: NAME });
    await navTo(page, 'settings'); await page.getByRole('button', { name: 'English', exact: true }).click();
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    const fresh = await backup(page); await attach(info, '01-fresh', fresh);
    expect(fresh.player).toMatchObject({ class: 'necromancer', level: 1, experience: 0, skillPoints: 1,
      statPoints: 0, skillLevels: { 'necromancer.raise_skeleton': 1 } });
    expect(fresh.inventory.backpack).toEqual([]); expect(fresh.inventory.equipped).toEqual({});
    expect(fresh.mercs.ownedMercs).toEqual([]);
    await expect((await detail(page, CE)).getByRole('button', { name: 'Requires Lv. 6', exact: true })).toBeDisabled();
    await navTo(page, 'mercs');
    await page.getByTestId(`hire-merc-${MERC}`).getByRole('button', { name: 'Hire', exact: true }).click();
    const hired = await backup(page);
    expect(hired.inventory).toEqual(fresh.inventory); expect(hired.mercs.fieldedMercId).toBe(MERC);
    expect(hired.mercs.ownedMercs).toHaveLength(1); expect(hired.mercs.ownedMercs[0]?.level).toBe(3);
    await (await detail(page, TEETH)).getByRole('button', { name: 'Allocate', exact: true }).click();
    await slots(page, [SKELETON, TEETH]);
    const configured = await backup(page); await attach(info, '02-legal-build', { hired, configured });
    expect(configured).toEqual({ ...hired, player: { ...hired.player, comboOrder: [SKELETON, TEETH],
      skillPoints: 0, skillLevels: { 'necromancer.raise_skeleton': 1, 'necromancer.teeth': 1 } } });
    earned = configured; phase = 'accelerated-farming';
    for (let ordinal = 0; ordinal < 40; ordinal++) {
      if (performance.now() - began >= 175_000) { outcome = 'prep-budget'; break; }
      await enter(page); const opening = await frame(page);
      expect(opening.monsters.length).toBeGreaterThan(0);
      expect(opening.monsters.every(m => !m.dead && m.hp > 0)).toBe(true);
      // Terminal logs retain only 200 rows; capture the startup before Skip can evict it.
      await expect(page.getByTestId('combat-log').getByText(`${NAME} summons Skeleton Warrior.`, { exact: true })).toBeAttached({ timeout: 2000 });
      const startup = await frame(page);
      expect(startup.logs).toContain(`${NAME} casts Raise Skeleton.`);
      await page.getByTestId('skip-button').click();
      await expect(page.getByTestId('skip-button')).toBeDisabled();
      const terminal = await frame(page);
      expect(terminal.monsters.map(m => m.id)).toEqual(opening.monsters.map(m => m.id));
      expect(Number(/^\D*(\d+)/.exec(terminal.wave)?.[1])).toBe(1);
      if (terminal.heroDead || terminal.defeat) {
        outcome = 'prep-defeat'; attempts.push({ ordinal, opening, startup, terminal, elapsedMs: performance.now() - began });
        await attach(info, `attempt-${String(ordinal)}`, attempts.at(-1)); break;
      }
      expect(terminal.monsters.every(m => m.dead)).toBe(true);
      expect(terminal.logs.at(-1)).toBe('Victory! All enemies are defeated.');
      await expect.poll(() => wave(page), { timeout: 5000, intervals: [50] }).toBe(2);
      await pause(page); const incidentalWave2 = await frame(page);
      await page.getByRole('button', { name: 'Flee', exact: true }).click();
      await expect(page.getByTestId('map-screen')).toBeVisible();
      const previous = earned; earned = await backup(page);
      totalXP += (8 + ordinal % 13) * 20;
      expectEarned(earned, configured, totalXP);
      expect(earned.inventory.backpack.slice(0, previous.inventory.backpack.length)).toEqual(previous.inventory.backpack);
      expect(earned.inventory.backpack.length).toBeGreaterThan(previous.inventory.backpack.length);
      expect(new Set(earned.inventory.backpack.map(item => item.id)).size).toBe(earned.inventory.backpack.length);
      const oracle = lootOracle[ordinal]; expect(oracle?.ordinal).toBe(ordinal);
      expect(earned.inventory.backpack.slice(previous.inventory.backpack.length).map(item =>
        Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'id')))).toEqual(oracle?.addedItems);
      expect(earned.inventory.currencies).toEqual(oracle?.currencies);
      attempts.push({ ordinal, opening, startup, terminal, incidentalWave2, earned, totalXP, elapsedMs: performance.now() - began });
      await attach(info, `attempt-${String(ordinal)}`, attempts.at(-1));
    }
    const preparationMs = performance.now() - began;
    await attach(info, 'preparation-deadline', { preparationMs, limitMs: 180_000, outcome });
    expect(preparationMs).toBeLessThanOrEqual(180_000);
    if (outcome === 'protocol-incomplete' && attempts.length === 40) {
      expect(totalXP).toBe(11080); expect(earned.player.level).toBe(6);
      expect(earned.player.experience).toBe(67); expect(earned.player.skillPoints).toBe(5);
      expect(performance.now() - began).toBeLessThanOrEqual(180_000);
      test.setTimeout(240_000); // Extend only after the frozen legal L6 preparation has actually completed.
      phase = 'earned-CE-allocation';
      await (await detail(page, CE)).getByRole('button', { name: 'Allocate', exact: true }).click();
      const allocated = await backup(page);
      expect(allocated).toEqual({ ...earned, player: { ...earned.player, skillPoints: 4,
        skillLevels: { ...earned.player.skillLevels, 'necromancer.corpse_explosion': 1 } } });
      await slots(page, [SKELETON, CE, TEETH]); const ready = await backup(page);
      expect(ready).toEqual({ ...allocated, player: { ...allocated.player, comboOrder: [SKELETON, CE, TEETH] } });
      await attach(info, '03-earned-unlock', { allocated, ready, totalXP, elapsedMs: performance.now() - began });
      phase = 'native-ordinal40-observation';
      // Rendered DOM only; no engine/store/resource/clock mutation.
      const observer = await page.evaluateHandle(() => {
        const frames: Frame[] = []; let previous = '', overflow = false;
        const sample = (): void => {
          const root = document.querySelector('[data-testid="combat-screen"]'); if (!root) return;
          const state = { wave: root.querySelector('[data-testid="wave-counter"]')?.textContent ?? '',
            mp: Number(root.querySelector('[role="group"][aria-label="MP"] [role="progressbar"]')?.getAttribute('aria-valuenow')),
            logs: Array.from(root.querySelectorAll('[data-testid="combat-log"] > div > span:last-child'), n => n.textContent ?? ''),
            monsters: Array.from(root.querySelectorAll<HTMLElement>('[data-side-testid="combat-enemy-card"][data-kind="monster"]'), n => ({
              id: n.dataset.testid ?? '', dead: n.dataset.dead === 'true', hp: Number.parseFloat(n.querySelector<HTMLElement>('.bg-red-600')?.style.width ?? 'NaN') })),
            heroDead: root.querySelector('[data-testid="allies-grid"] [data-kind="hero"]')?.getAttribute('data-dead') === 'true',
            defeat: root.querySelector('[data-testid="defeat-panel"]') !== null };
          const serial = JSON.stringify(state); if (serial === previous) return; previous = serial;
          if (frames.length === 1024) { overflow = true; return; } frames.push({ at: performance.now(), ...state });
        };
        const observer = new MutationObserver(sample);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
        return { read: () => ({ frames, overflow }), disconnect: () => observer.disconnect() };
      });
      try {
        await enter(page); await page.mouse.move(1, 1);
        let timedOut = false;
        try {
          await page.waitForFunction(name => {
            const lines = Array.from(document.querySelectorAll('[data-testid="combat-log"] > div > span:last-child'), n => n.textContent ?? '');
            return lines.some(l => l.startsWith('Corpse Explosion consumes a corpse.')) &&
              lines.some(l => (l.startsWith(`${name} attacks `) || l.startsWith(`CRITICAL! ${name} hits `)) && /for [1-9]\d* fire damage[.!]/.test(l)) ||
              document.querySelector('[data-testid="defeat-panel"]') !== null;
          }, NAME, { timeout: 30_000, polling: 50 });
        } catch (error) { if (!(error instanceof errors.TimeoutError)) throw error; timedOut = true; }
        if (await page.getByRole('button', { name: 'Pause', exact: true }).isVisible()) await pause(page);
        const observed = await observer.evaluate(o => o.read());
        await attach(info, '04-ordinal40-DOM-timeline', { observed, timedOut, elapsedMs: performance.now() - began });
        expect(observed.overflow).toBe(false);
        const startupIndex = observed.frames.findIndex(f => f.logs.includes(`${NAME} casts Raise Skeleton.`));
        const startup = observed.frames[startupIndex]; expect(startup).toBeDefined();
        const startupDebit = observed.frames.find((f, i) => i > startupIndex && f.mp !== startup?.mp);
        expect(startupDebit?.mp).toBe((startup?.mp ?? 0) - 15);
        expect(startupDebit?.logs).toEqual(startup?.logs);
        const castIndex = observed.frames.findIndex(f => f.logs.includes(`${NAME} casts Corpse Explosion.`));
        const cast = observed.frames[castIndex];
        const hit = observed.frames.findIndex(f => f.logs.some(fire));
        if (cast && hit >= 0) {
          const death = cast.logs.findIndex(l => l.endsWith(' falls.'));
          const supply = cast.logs.findIndex(l => l.startsWith('A fallen enemy leaves a corpse.'));
          const action = cast.logs.indexOf(`${NAME} casts Corpse Explosion.`);
          expect(death).toBeGreaterThanOrEqual(0); expect(supply).toBeGreaterThan(death); expect(action).toBeGreaterThan(supply);
          expect(cast.monsters.some(m => !m.dead && m.hp > 0)).toBe(true);
          const debitIndex = observed.frames.findIndex((f, i) => i > castIndex && f.mp !== cast.mp);
          const debit = observed.frames[debitIndex]; expect(debit?.mp).toBe(cast.mp - 20); expect(debit?.logs).toEqual(cast.logs);
          const consumed = observed.frames.findIndex(f => f.logs.some(l => l.startsWith('Corpse Explosion consumes a corpse.')));
          expect(consumed).toBeGreaterThan(debitIndex); expect(hit).toBeGreaterThan(consumed);
          const supplyCount = Number(cast.logs.filter(l => l.startsWith('A fallen enemy leaves a corpse.')).at(-1)?.match(/\d+/)?.[0]);
          const remaining = Number(observed.frames[consumed]?.logs.find(l => l.startsWith('Corpse Explosion consumes a corpse.'))?.match(/\d+/)?.[0]);
          expect(supplyCount).toBeGreaterThan(0); expect(remaining).toBe(supplyCount - 1);
          outcome = 'earned-CE-observed';
        } else { outcome = observed.frames.some(f => f.defeat || f.heroDead) ? 'earned-unlock-observation-defeat' : 'earned-unlock-CE-not-observed'; }
        await info.attach('05-native-outcome', { body: await page.screenshot(), contentType: 'image/png' });
      } finally { await observer.evaluate(o => o.disconnect()); await observer.dispose(); }
    }
    expect(['prep-defeat', 'prep-budget', 'earned-CE-observed', 'earned-unlock-observation-defeat', 'earned-unlock-CE-not-observed']).toContain(outcome);
    expect(attempts.length).toBeGreaterThan(0);
    await attach(info, '07-final-native-export', await backup(page));
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    expect(consoleErrors).toEqual([]);
  } finally {
    await attach(info, '06-pilot-outcome', { phase, outcome, attempts: attempts.length, totalXP, earned,
      elapsedMs: performance.now() - began, consoleErrors,
      scope: 'Protocol completion is not CE acceptance. Skip preparation does not establish pacing/feel/broad balance.' });
  }
});

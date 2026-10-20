/** Ordinary starter hire, native W1 debuff/damage feedback and committed save/reopen. */
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const mercId = 'mercs/act1-rogue-inner-sight';
const fixedTime = new Date('2026-10-20T12:00:00.000Z');
interface Card { id: string; name: string; hpPercent: number }
interface Frame { wave: string; logs: string[]; cards: Card[] }
interface Witness { before: Frame; after: Frame; target: string; damage: string; amount: number }

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
    open.onerror = () => reject(new Error('Could not open saved character'));
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
async function attach(info: TestInfo, name: string, value: unknown): Promise<void> {
  await info.attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });
}
async function production(page: Page): Promise<void> {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
function firstWitness(frames: readonly Frame[], english: boolean): Witness | undefined {
  const cast = english ? 'Rogue Scout — Inner Sight casts Inner Sight.' : '罗格侦察兵 — 内视 施放了 心眼。';
  for (let index = 1; index < frames.length; index++) {
    const before = frames[index - 1];
    const after = frames[index];
    if (!before || !after || after.logs.length !== before.logs.length + 1 ||
      JSON.stringify(after.logs.slice(0, -1)) !== JSON.stringify(before.logs)) continue;
    const damage = after.logs.at(-1) ?? '';
    for (const card of after.cards) {
      const old = before.cards.find(row => row.id === card.id);
      if (!old || old.name !== card.name || !(card.hpPercent < old.hpPercent)) continue;
      const applied = english ? `${card.name} is afflicted with [Inner Sight].` : `${card.name} 进入【心眼】状态。`;
      const castAt = after.logs.indexOf(cast);
      const statusAt = after.logs.indexOf(applied);
      if (castAt < 0 || statusAt <= castAt || statusAt >= after.logs.length - 1) continue;
      const critical = damage.startsWith(english ? 'CRITICAL!' : '暴击！');
      const separator = english
        ? (critical ? ` hits ${card.name} for ` : ` attacks ${card.name} for `)
        : (critical ? ` 对 ${card.name} 造成 ` : ` 普攻 ${card.name}，造成 `);
      const tail = english ? (critical ? ' physical damage!' : ' physical damage.')
        : (critical ? ' 点物理伤害！' : ' 点物理伤害。');
      const start = damage.indexOf(separator);
      if (start < 0 || !damage.endsWith(tail)) continue;
      const amount = Number(damage.slice(start + separator.length, -tail.length));
      if (Number.isInteger(amount) && amount > 0) return { before, after, target: card.name, damage, amount };
    }
  }
  return undefined;
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`ordinary Rogue Inner Sight intro and save reopen ${locale}`, async ({ page, context }, info) => {
    const english = locale === 'en';
    const errors: string[] = [];
    const observeErrors = (target: Page): void => {
      target.on('pageerror', error => errors.push(`page: ${error.message}`));
      target.on('console', message => {
        if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`);
      });
    };
    observeErrors(page);
    await page.clock.setFixedTime(fixedTime); // Date only; native timers and combat playback.
    await page.goto('/');
    await createCharacter(page, { class: 'druid', name: 'Inner Sight Intro' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state), { timeout: 60_000 }).toBe('activated');
    const initial = await exportBackup(page);
    expect(initial.player).toMatchObject({ level: 1, experience: 0 });
    expect(initial.mercs.ownedMercs).toEqual([]);
    await navTo(page, 'mercs');
    await page.getByTestId(`hire-merc-${mercId}`).getByRole('button', { name: english ? 'Hire' : '招募', exact: true }).click();
    await expect(page.getByTestId(`merc-field-${mercId}`)).toHaveText(english ? 'Unfield' : '撤下');
    await production(page);
    await navTo(page, 'settings');
    const hired = await exportBackup(page);
    expect(hired.inventory.currencies).toEqual(initial.inventory.currencies);
    expect(hired.mercs.ownedMercs).toHaveLength(1);
    expect(hired.mercs.fieldedMercId).toBe(mercId);
    expect(hired.mercs.ownedMercs[0]).toMatchObject({ id: mercId, level: 3, signatureSkillId: 'mskill-inner-sight',
      comboOrder: ['mskill-inner-sight', 'mskill-basic-arrow', 'mskill-pierce-arrow'] });
    await attach(info, '01-native-free-hire', { initial, hired });
    await navTo(page, 'map');
    // Test-owned observer reads visible DOM only. No application state/API or timer mutation.
    const observer = await page.evaluateHandle(() => {
      const frames: Frame[] = [];
      let overflow = false;
      let previous = '';
      const sample = (): void => {
        const root = document.querySelector('[data-testid="combat-screen"]');
        if (!root) return;
        const frame: Frame = {
          wave: root.querySelector('[data-testid="wave-counter"]')?.textContent ?? '',
          logs: Array.from(root.querySelectorAll('[data-testid="combat-log"] > div > span:last-child'), node => node.textContent ?? ''),
          cards: Array.from(root.querySelectorAll<HTMLElement>('[data-testid="enemies-grid"] [data-testid^="unit-card-"]'), node => ({
            id: node.dataset.testid ?? '', name: node.querySelector('[title]')?.getAttribute('title') ?? '',
            hpPercent: Number.parseFloat(node.querySelector<HTMLElement>('.bg-red-600')?.style.width ?? 'NaN')
          }))
        };
        const fingerprint = JSON.stringify(frame);
        if (fingerprint === previous) return;
        previous = fingerprint;
        if (frames.length >= 256) { overflow = true; return; }
        frames.push(frame);
      };
      const changes = new MutationObserver(sample);
      changes.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
      sample();
      return { read: () => ({ frames, overflow }), disconnect: () => changes.disconnect() };
    });
    let observed: { frames: Frame[]; overflow: boolean } = { frames: [], overflow: false };
    let witness: Witness | undefined;
    try {
      await page.getByTestId('sub-area-row-a1-blood-moor')
        .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
      await expect(page.getByTestId('combat-screen')).toBeVisible();
      await expect(page.getByTestId('allies-grid').locator('[data-kind="merc"]')).toHaveCount(1);
      await expect.poll(async () => {
        observed = await observer.evaluate(handle => handle.read());
        expect(observed.overflow).toBe(false);
        witness = firstWitness(observed.frames, english);
        return witness !== undefined;
      }, { timeout: 30_000, intervals: [50] }).toBe(true);
      await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click({ timeout: 1000 });
      await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true })).toHaveAttribute('aria-pressed', 'true');
      const wave = await page.getByTestId('wave-counter').innerText();
      expect(Number(/^\D*(\d+)/.exec(wave)?.[1])).toBe(1);
      expect(witness).toBeDefined();
      expect(witness?.after.logs.length).toBeLessThan(200);
      expect(witness?.after.logs.join('\n')).not.toContain('merc-inner-sight');
      await production(page);
      await info.attach('03-native-w1-paused', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
      await info.attach('04-native-log', { body: await page.getByTestId('combat-log').screenshot(), contentType: 'image/png' });
    } finally {
      observed = await observer.evaluate(handle => { handle.disconnect(); return handle.read(); });
      await observer.dispose();
      await attach(info, '02-native-dom-frames', { ...observed, witness });
    }
    await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
    await expect(page.getByTestId('map-screen')).toBeVisible();
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    const saved = await exportBackup(page);
    expect(saved.player).toMatchObject({ level: 1, experience: 0 });
    expect(saved.inventory.currencies).toEqual(hired.inventory.currencies);
    expect(saved.mercs).toEqual(hired.mercs);
    expect(await readStoredSave(page)).toEqual(saved);
    await attach(info, '05-committed-save', saved);
    await page.close();
    const reopened = await context.newPage();
    observeErrors(reopened);
    await reopened.clock.setFixedTime(fixedTime);
    await reopened.goto('/');
    await reopened.getByTestId('home-continue').click();
    await expect(reopened.getByTestId('town-screen')).toBeVisible();
    await navTo(reopened, 'settings');
    await expect(reopened.getByRole('button', { name: english ? 'English' : '简体中文', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await readStoredSave(reopened)).toEqual(saved);
    expect(await exportBackup(reopened)).toEqual(saved);
    await attach(info, '06-reopened-save', await readStoredSave(reopened));
    await navTo(reopened, 'mercs');
    await expect(reopened.getByTestId(`merc-field-${mercId}`)).toHaveText(english ? 'Unfield' : '撤下');
    await production(reopened);
    await attach(info, '07-browser-errors', errors);
    expect(errors).toEqual([]);
  });
}

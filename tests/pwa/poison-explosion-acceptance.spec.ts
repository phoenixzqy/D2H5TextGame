/** Imported level, points and survival equipment are synthetic; all actions use production controls. */
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const PE = 'skills-necromancer-poison-explosion', RUNTIME = 'necromancer.poison_explosion';
const TEETH = 'skills-necromancer-teeth', DAGGER = 'skills-necromancer-poison-dagger';
const NAME = 'PE Browser', fixedTime = new Date('2026-10-21T12:00:00.055Z');
interface Frame {
  mp: number;
  mpMax: number;
  logs: string[];
  enemies: { name: string; dead: boolean; hp: number; effects: string }[];
}
async function attach(info: TestInfo, name: string, value: unknown): Promise<void> {
  await info.attach(name, { body: JSON.stringify(value), contentType: 'application/json' });
}
async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try {
    const save = JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent;
    expect(save.version).toBe(22);
    return save;
  } finally { await download.delete(); }
}
async function observe(page: Page, mpLabel: string) {
  return page.evaluateHandle(label => {
    const frames: Frame[] = []; let previous = '', overflow = false;
    const sample = () => {
      const root = document.querySelector('[data-testid="combat-screen"]');
      if (!root) return;
      const bar = root.querySelector(`[role="group"][aria-label="${label}"] [role="progressbar"]`);
      const frame: Frame = {
        mp: Number(bar?.getAttribute('aria-valuenow')),
        mpMax: Number(bar?.getAttribute('aria-valuemax')),
        logs: Array.from(root.querySelectorAll('[data-testid="combat-log"] > div > span:last-child'), node => node.textContent),
        enemies: Array.from(root.querySelectorAll<HTMLElement>('[data-side-testid="combat-enemy-card"][data-kind="monster"]'), node => ({
          name: node.querySelector('img')?.alt ?? '',
          dead: node.dataset.dead === 'true',
          hp: Number.parseFloat(node.querySelector<HTMLElement>('.bg-red-600')?.style.width ?? 'NaN'),
          effects: node.querySelector('[data-testid="unit-effect-chips"]')?.textContent ?? ''
        }))
      };
      const serialized = JSON.stringify(frame);
      if (serialized === previous) return;
      previous = serialized;
      if (frames.length === 2048) { overflow = true; return; }
      frames.push(frame);
    };
    const observer = new MutationObserver(sample);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
    sample();
    return { read: () => ({ frames, overflow }), disconnect: () => { observer.disconnect(); } };
  }, mpLabel);
}
for (const locale of ['en', 'zh-CN'] as const) {
  test(`Poison Explosion public first kill, payment, Poison and persistence ${locale}`, async ({ page, context }, info) => {
    const english = locale === 'en', errors: string[] = [];
    const watch = (target: Page) => {
      target.on('pageerror', error => errors.push(error.message));
      target.on('console', message => {
        if (['error', 'warning'].includes(message.type())) errors.push(message.text());
      });
    };
    watch(page); await page.clock.setFixedTime(fixedTime);
    await page.goto('/'); await page.waitForLoadState('networkidle');
    await createCharacter(page, { class: 'necromancer', name: NAME });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const fresh = await backup(page);
    const cap: Item = {
      id: 'synthetic-pe-public-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
      level: 1, identified: true, equipped: true, equipSlot: 'head', socketCapacity: 0,
      affixes: [{ affixId: 'synthetic-pe-public-survival', values: new Map([
        ['statMods.life', 1000000], ['statMods.defense', 1000000], ['statMods.mana', 10000]
      ]) }]
    };
    const fixture = {
      ...fresh,
      player: { ...fresh.player, level: 18, skillPoints: 2,
        skillLevels: { [DAGGER]: 1, [TEETH]: 1 }, comboOrder: [],
        derivedStats: { ...fresh.player.derivedStats, life: 1000, lifeMax: 1000000, mana: 1000, manaMax: 10000 } },
      inventory: { ...fresh.inventory, equipped: { ...fresh.inventory.equipped, head: cap } }
    };
    const importLabel = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(fixture, (_key, value: unknown) => value instanceof Map ? [...value] : value));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await attach(info, 'synthetic-fixture', { fresh, imported: await backup(page) });
    await navTo(page, 'skills');
    await page.getByTestId('skill-node-' + PE).focus(); await page.keyboard.press('Enter');
    const panel = page.getByTestId('skill-detail-panel');
    const geometry = [];
    for (const rank of [1, 2]) {
      const allocate = panel.getByRole('button', { name: english ? 'Allocate' : '分配', exact: true });
      if (rank === 1) {
        for (const [width, height] of [[360, 640], [412, 915], [640, 360], [1280, 800], [1920, 1080]] as const) {
          await page.setViewportSize({ width, height }); await allocate.scrollIntoViewIfNeeded();
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          const bounds = await allocate.boundingBox();
          if (!bounds) throw new Error('Missing Poison Explosion allocation control');
          expect(bounds.width).toBeGreaterThanOrEqual(44); expect(bounds.height).toBeGreaterThanOrEqual(44);
          geometry.push({ width, height, bounds });
        }
        await page.setViewportSize(info.project.name.includes('mobile') ? { width: 360, height: 640 } : { width: 1280, height: 800 });
      }
      await allocate.focus(); await expect(allocate).toBeFocused(); await page.keyboard.press('Enter');
      const current = panel.getByRole('heading', { name: english ? 'Current' : '当前', exact: true, level: 3 }).locator('..');
      const next = panel.getByRole('heading', { name: english ? 'Next Level' : '下一级', exact: true, level: 3 }).locator('..');
      const min = rank === 1 ? 40 : 45, max = rank === 1 ? 60 : 65;
      for (const [label, value] of [
        [english ? 'Poison attack' : '毒素攻击', `${String(min)} ~ ${String(max)}`],
        [english ? 'Mana Cost' : '法力消耗', '15'],
        [english ? 'Cooldown' : '冷却', english ? '2 s' : '2 秒'],
        [english ? 'Applies' : '附加', english ? 'Poisoned' : '中毒']
      ]) {
        if (!label || !value) throw new Error('Missing literal Poison Explosion preview oracle');
        await expect(current.getByText(label, { exact: true }).locator('+ dd')).toHaveText(value);
      }
      await expect(next.getByText(english ? 'Poison attack' : '毒素攻击', { exact: true }).locator('+ dd'))
        .toHaveText(`${String(min + 5)} ~ ${String(max + 5)}(+5 ~ +5)`);
      await expect(panel).toContainText(english ? 'Requires an enemy monster to die in this wave first.' : '需先有敌方怪物在本波战斗中死亡。');
      await expect(panel).toContainText(english ? 'With no corpse, the combo skips this skill.' : '没有尸体时连招跳过此技能。');
      await expect(panel).toContainText(english ? 'fresh Poison lasts 5 s, up to 10 stacks' : '首次施加持续5 秒，最多叠加10层');
      await info.attach(`rank-${String(rank)}-stats`, { body: await current.screenshot(), contentType: 'image/png' });
    }
    await attach(info, 'geometry', geometry);
    await page.locator('#tab-active').click();
    const slot1 = page.getByRole('combobox', { name: english ? 'Slot 1' : '槽位 1', exact: true });
    await slot1.selectOption(PE);
    await page.getByRole('combobox', { name: english ? 'Slot 2' : '槽位 2', exact: true }).selectOption(TEETH);
    const prepared = await backup(page);
    expect(prepared.player.skillLevels?.[RUNTIME]).toBe(2);
    expect(prepared.player.comboOrder).toEqual([PE, TEETH]);
    expect(prepared.player.skillPoints).toBe(0);
    // Teeth is the only opening attack. Learned Dagger is deliberately unslotted,
    // so its damaging Poison cannot masquerade as Poison Explosion evidence.
    const spell = english ? 'Poison Explosion' : '尸体剧毒爆破';
    const castLine = `${NAME} ${english ? 'casts ' : '施放了 '}${spell}${english ? '.' : '。'}`;
    const opening = `${NAME} ${english ? 'casts Teeth.' : '施放了 尸牙。'}`;
    const available = english ? 'A fallen enemy leaves a corpse.' : '敌人倒下，留下一具尸体。';
    const consumed = english ? 'Poison Explosion consumes a corpse.' : '尸体剧毒爆破消耗一具尸体。';
    const chip = english ? 'Poison' : '中毒';
    const observer = await observe(page, english ? 'MP' : '法力');
    try {
      await navTo(page, 'map');
      await page.getByTestId('sub-area-row-a1-catacombs').getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
      await expect.poll(async () => {
        const { frames } = await observer.evaluate(handle => handle.read());
        return frames.some(frame => frame.logs.includes(castLine) && frame.logs.some(line => frame.enemies.some(enemy => enemy.name && (english
          ? line.startsWith(enemy.name + ' takes ') && / takes [1-9]\d* damage over time\./.test(line)
          : line.startsWith(enemy.name + ' 因持续伤害受到 ') && / 因持续伤害受到 [1-9]\d* 点伤害。/.test(line)))));
      }, { timeout: 90000, intervals: [50, 100] }).toBe(true);
      await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
      const observed = await observer.evaluate(handle => handle.read()), frames = observed.frames;
      expect(observed.overflow).toBe(false);
      const index = frames.findIndex(frame => frame.logs.includes(castLine)), cast = frames[index];
      expect(index).toBeGreaterThan(0);
      if (!cast) throw new Error('Missing actual Poison Explosion action');
      expect(cast.logs.find(line => line.startsWith(NAME + (english ? ' casts ' : ' 施放了 ')))).toBe(opening);
      const deathRow = cast.logs.findIndex(line => english ? line.endsWith(' falls.') : line.endsWith(' 倒下了。'));
      const supplyRow = cast.logs.findIndex(line => line.startsWith(available));
      expect(deathRow).toBeGreaterThanOrEqual(0); expect(supplyRow).toBeGreaterThan(deathRow);
      expect(cast.logs.indexOf(castLine)).toBeGreaterThan(supplyRow);
      expect(frames.slice(0, index).every(frame => frame.enemies.every(enemy => !enemy.effects.includes(chip)))).toBe(true);
      // Atomic timestamp playback includes regeneration and payment together.
      // The exact native public-fixture witness (seed2688559832,18000ms)
      // recovers to10155 before paying15, then publishes10140 with these hits.
      // A second post-cast DOM debit would charge the same cast twice.
      expect(cast.mpMax).toBe(10155);
      expect(cast.mp).toBe(10140);
      expect(cast.mpMax - cast.mp).toBe(15);
      const consumedIndex = frames.findIndex(frame => frame.logs.some(line => line.startsWith(consumed)));
      expect(consumedIndex).toBe(index);
      expect(cast.logs.findIndex(line => line.startsWith(consumed))).toBeGreaterThan(cast.logs.indexOf(castLine));
      const beforeSupply = cast.logs.filter(line => line.startsWith(available)).at(-1)?.match(/\d+/)?.[0];
      const afterSupply = frames[consumedIndex]?.logs.find(line => line.startsWith(consumed))?.match(/\d+/)?.[0];
      expect(beforeSupply).toBeDefined(); expect(afterSupply).toBeDefined();
      expect(Number(afterSupply)).toBe(Number(beforeSupply) - 1);
      expect(frames.slice(consumedIndex).some(frame => frame.enemies.some(enemy => !enemy.dead && enemy.effects.includes(chip)))).toBe(true);
      const poisonHit = frames.slice(consumedIndex).flatMap(frame => frame.logs).find(line => english
        ? (line.startsWith(NAME + ' attacks ') || line.startsWith('CRITICAL! ' + NAME + ' hits ')) && /for [1-9]\d* poison damage[.!]/.test(line)
        : (line.startsWith(NAME + ' 普攻 ') || line.startsWith('暴击！' + NAME + ' 对 ')) && /造成 [1-9]\d* 点毒素伤害[。！]/.test(line));
      expect(poisonHit).toBeDefined();
      const names = new Set(frames.flatMap(frame => frame.enemies.map(enemy => enemy.name)).filter(Boolean));
      const enemyDot = frames.slice(consumedIndex).flatMap(frame => frame.logs).find(line => [...names].some(name => english
        ? line.startsWith(name + ' takes ') && / takes [1-9]\d* damage over time\./.test(line)
        : line.startsWith(name + ' 因持续伤害受到 ') && / 因持续伤害受到 [1-9]\d* 点伤害。/.test(line)));
      expect(enemyDot).toBeDefined();
      await attach(info, 'public-first-kill-payment-poison', { castLine, opening, corpseBefore: beforeSupply, corpseAfter: afterSupply,
        observedManaBeforeBatch: frames[index - 1]?.mp, observedManaMax: cast.mpMax, observedManaAfterBatch: cast.mp,
        nativePrepaymentMana: 10155, nativePaymentCost: 15, poisonHit, enemyDot });
      await info.attach('poison-battle-viewport', { body: await page.screenshot(), contentType: 'image/png' });
    } finally {
      await attach(info, 'complete-DOM-timeline', await observer.evaluate(handle => handle.read()));
      await observer.evaluate(handle => { handle.disconnect(); }); await observer.dispose();
    }
    await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    const saved = await backup(page);
    expect(saved.player.skillLevels).toEqual(prepared.player.skillLevels);
    expect(saved.map.clearedSubAreas).not.toContain('areas/act1-catacombs');
    expect(JSON.stringify(saved)).not.toContain('"dotPerStack"');
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated');
    await page.close();
    for (const offline of [false, true]) {
      await context.setOffline(offline);
      const resumed = await context.newPage(); watch(resumed); await resumed.clock.setFixedTime(fixedTime);
      try {
        const response = await resumed.goto('/'); expect(response?.ok()).toBe(true);
        if (offline) expect(response?.fromServiceWorker()).toBe(true);
        await resumed.getByTestId('home-continue').click();
        const restored = await backup(resumed);
        for (const domain of ['endgame', 'player', 'inventory', 'map', 'mercs', 'formation', 'meta'] as const)
          expect(restored[domain]).toEqual(saved[domain]);
        await attach(info, offline ? 'offline-save-pair' : 'online-save-pair', { saved, restored });
      } finally { await resumed.close(); }
    }
    expect(errors).toEqual([]); await attach(info, 'console-errors', errors);
  });
}

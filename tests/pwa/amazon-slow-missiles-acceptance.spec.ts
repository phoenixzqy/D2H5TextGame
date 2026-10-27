/** Constructed public fixture; no earned progression or balance claim. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const at = new Date('2026-10-26T12:00:00Z'),
  character = 'Ama Slow Test';
const id = 'skills-amazon-slow-missiles';
async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try {
    return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent;
  } finally {
    await download.delete();
  }
}
for (const locale of ['en', 'zh-CN'] as const)
  test(`Amazon Slow Missiles public allocation, cast, save and offline ${locale}`, async ({
    page,
    context
  }, info) => {
    const english = locale === 'en',
      errors: string[] = [];
    const watch = (target: Page) => {
      target.on('pageerror', (error) => errors.push(error.message));
      target.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text());
      });
    };
    watch(page);
    await page.clock.setFixedTime(at);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await createCharacter(page, { class: 'amazon', name: character });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const original = await backup(page);
    const cap: Item = {
      id: 'synthetic-slow-missiles-cap',
      baseId: 'items/base/helm-cap',
      rarity: 'rare',
      level: 1,
      identified: true,
      equipped: false,
      socketCapacity: 0,
      socketContents: [],
      affixes: [
        {
          affixId: 'synthetic-import',
          values: new Map([
            ['statMods.life', 999880],
            ['statMods.mana', 999000]
          ])
        }
      ]
    };
    const incoming = {
      ...original,
      player: {
        ...original.player,
        level: 30,
        skillPoints: 21,
        comboOrder: [],
        skillLevels: {}
      },
      inventory: { ...original.inventory, backpack: [...original.inventory.backpack, cap] }
    };
    const importLabel = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('textbox')
      .fill(
        JSON.stringify(incoming, (_key, value: unknown) =>
          value instanceof Map ? [...value] : value
        )
      );
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await navTo(page, 'inventory');
    await page.getByTestId('inv-item-' + cap.id).click();
    await page.getByTestId('inv-primary-action').click();
    await navTo(page, 'skills');
    await page.getByTestId('skill-node-skills-amazon-inner-sight').click();
    await page.getByTestId('skill-detail-panel').getByRole('button', {
      name: english ? 'Allocate' : '分配', exact: true
    }).click();
    const geometry: {
      rank: number;
      width: number;
      height: number;
      targetWidth: number;
      targetHeight: number;
    }[] = [];
    for (const rank of [1, 20]) {
      await navTo(page, 'skills');
      await page.getByTestId('skill-node-' + id).focus();
      await page.keyboard.press('Enter');
      await page.mouse.move(0, 0);
      const panel = page.getByTestId('skill-detail-panel');
      const allocate = panel.getByRole('button', {
        name: english ? 'Allocate' : '分配',
        exact: true
      });
      for (let point = 0; point < (rank === 1 ? 1 : 19); point++) await allocate.click();
      const current = panel.locator('section').filter({
        has: page.getByRole('heading', { name: english ? 'Current' : '当前', exact: true })
      });
      for (const phrase of english
        ? ['all living enemies', 'for 6 s', '33% normal speed', 'shots already in flight',
          'enemy attack cadence stay unchanged', 'defenses resolve on impact',
          `Pay ${rank === 1 ? '10' : '8'} MP`, `${rank === 1 ? '3' : '2'} s cooldown`]
        : ['所有存活敌人', '6 秒', '正常速度的33%', '已发射', '敌人出手频率不变',
          '防御在命中时结算', `消耗${rank === 1 ? '10' : '8'} 点法力`, `冷却${rank === 1 ? '3' : '2'} 秒`])
        await expect(panel).toContainText(phrase);
      await expect(
        current.getByText(english ? 'Mana Cost' : '法力消耗', { exact: true }).locator('+ dd')
      ).toHaveText(rank === 1 ? '10' : '8');
      await expect(
        current.getByText(english ? 'Cooldown' : '冷却', { exact: true }).locator('+ dd')
      ).toHaveText(english ? `${rank === 1 ? '3' : '2'} s` : `${rank === 1 ? '3' : '2'} 秒`);
      if (rank === 20)
        await expect(panel).toContainText(english ? 'Max level reached.' : '已达到最高等级。');
      await expect(panel).not.toContainText('{{');
      await panel.locator('h2').scrollIntoViewIfNeeded();
      await info.attach(`rank${String(rank)}-preview`, {
        body: await panel.screenshot(),
        contentType: 'image/png'
      });
      await page.locator('#tab-active').click();
      const slot = page.getByRole('combobox', { name: /^(Slot 1|槽位 1)$/ });
      await slot.selectOption(id);
      await expect(slot).toHaveValue(id);
      for (const [width, height] of [
        [360, 640],
        [412, 915],
        [640, 360],
        [1280, 800],
        [1920, 1080]
      ] as const) {
        await page.setViewportSize({ width, height });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        );
        await slot.scrollIntoViewIfNeeded();
        const box = await slot.boundingBox();
        if (!box) throw new Error('Missing native priority control');
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
        geometry.push({ rank, width, height, targetWidth: box.width, targetHeight: box.height });
      }
      await page.setViewportSize(
        info.project.name.includes('mobile')
          ? { width: 360, height: 640 }
          : { width: 1280, height: 800 }
      );
      const prepared = await backup(page);
      expect(prepared.player.skillLevels?.['amazon.slow_missiles']).toBe(rank);
      expect(prepared.player.skillLevels?.['amazon.inner_sight']).toBe(1);
      expect(prepared.player.skillPoints).toBe(20 - rank);
      expect(prepared.player.comboOrder.filter(Boolean)).toEqual([id]);
      const observed = await page.evaluateHandle(
        ({ character, marker }) => {
          let cast: string | null = null, chip: string | null = null;
          let launch: { text: string; at: number; actor: string } | null = null;
          let impact: { text: string; at: number } | null = null, positiveHit: string | null = null;
          const archers = new Set<string>(), seen = new WeakSet<Element>();
          const observer = new MutationObserver(() => {
            for (const card of document.querySelectorAll(
              '[data-testid="enemies-grid"] [data-testid^="unit-card-"]'
            )) {
              if (!card.getAttribute('data-testid')?.includes('dark-archer')) continue;
              const name = card.querySelector('img')?.alt ?? card.querySelector('[title]')?.getAttribute('title');
              if (name) archers.add(name);
              const text = card.querySelector('[data-testid="unit-effect-chips"]')?.textContent;
              if (text?.includes(marker)) chip ??= text;
            }
            for (const row of document.querySelectorAll('[data-testid="combat-log"] > div')) {
              if (seen.has(row)) continue;
              seen.add(row);
              const text = row.lastElementChild?.textContent ?? '', at = performance.now();
              if (text.includes(character) && (text.includes(' casts Slow Missiles.') ||
                text.includes('施放了 缓速飞弹。'))) cast ??= text;
              for (const actor of archers) {
                if (launch === null && (text.includes(actor + ' casts Weak Ranged.') ||
                  text.includes(actor + ' 施放了 弱远程。'))) launch = { text, at, actor };
                if (!launch || actor !== launch.actor || !text.includes(character)) continue;
                const damage = [actor + ' attacks ', actor + ' hits ', actor + ' 普攻 ', actor + ' 对 ']
                  .some(prefix => text.includes(prefix));
                const dodge = text.includes(character + ' dodges ' + actor) ||
                  text.includes(character + ' 闪避了 ' + actor);
                if (damage || dodge) impact ??= { text, at };
                if (damage && (/ for [1-9]\d* /.test(text) || /造成 [1-9]\d* 点/.test(text))) positiveHit ??= text;
              }
            }
          });
          observer.observe(document.body, { childList: true, subtree: true, characterData: true });
          return {
            read: () => ({ cast, chip, launch, impact, positiveHit,
              delayMs: launch && impact ? impact.at - launch.at : null }),
            disconnect: () => { observer.disconnect(); }
          };
        }, { character, marker: english ? 'Slow Missiles' : '缓速飞弹' }
      );
      try {
        await navTo(page, 'map');
        await page
          .getByTestId('sub-area-row-a1-cold-plains')
          .getByRole('button', { name: english ? 'Enter' : '进入', exact: true })
          .click();
        for (const key of ['cast', 'chip', 'launch', 'impact', 'positiveHit'] as const)
          await expect
            .poll(async () => (await observed.evaluate((handle) => handle.read()))[key])
            .not.toBeNull();
        // Observe actual presentation delay; native tests separately prove exact simulation clocks.
        expect((await observed.evaluate(handle => handle.read())).delayMs).toBeGreaterThanOrEqual(1200);
        await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
        await info.attach(`rank${String(rank)}-cast`, {
          body: JSON.stringify(await observed.evaluate((handle) => handle.read())),
          contentType: 'application/json'
        });
        await info.attach(`rank${String(rank)}-combat`, {
          body: await page.getByTestId('enemies-grid').screenshot(),
          contentType: 'image/png'
        });
      } finally {
        await observed.evaluate((handle) => {
          handle.disconnect();
        });
        await observed.dispose();
      }
      await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
    }
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    const saved = await backup(page);
    expect(saved.player.skillLevels?.['amazon.slow_missiles']).toBe(20);
    expect(saved.player.skillPoints).toBe(0);
    expect(saved.player.comboOrder.filter(Boolean)).toEqual([id]);
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    await expect
      .poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state))
      .toBe('activated');
    await info.attach('geometry', {
      body: JSON.stringify(geometry),
      contentType: 'application/json'
    });
    await page.close();
    for (const offline of [false, true]) {
      await context.setOffline(offline);
      const fresh = await context.newPage();
      watch(fresh);
      try {
        await fresh.clock.setFixedTime(at);
        const response = await fresh.goto('/');
        expect(response?.ok()).toBe(true);
        if (offline) expect(response?.fromServiceWorker()).toBe(true);
        await fresh.getByTestId('home-continue').click();
        const restored = await backup(fresh);
        for (const domain of [
          'endgame',
          'player',
          'inventory',
          'map',
          'mercs',
          'formation',
          'meta'
        ] as const)
          expect(restored[domain]).toEqual(saved[domain]);
        await info.attach(offline ? 'offline-save-pair' : 'online-save-pair', {
          body: JSON.stringify({ saved, restored }),
          contentType: 'application/json'
        });
      } finally {
        await fresh.close();
      }
    }
    expect(errors).toEqual([]);
  });

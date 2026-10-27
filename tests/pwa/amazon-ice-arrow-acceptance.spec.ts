/** Constructed public fixture; no earned progression or balance claim. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const at = new Date('2026-10-26T12:00:00Z'),
  character = 'Ama Ice Test';
const id = 'skills-amazon-ice-arrow';
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
  test(`Amazon Ice Arrow public allocation, cast, save and offline ${locale}`, async ({
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
      id: 'synthetic-ice-arrow-cap',
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
        level: 18,
        skillPoints: 20,
        comboOrder: [],
        skillLevels: {
          'amazon.magic_arrow': 1,
          'amazon.cold_arrow': 1
        }
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
      const range = rank === 1 ? (english ? '55–80' : '55～80') : english ? '150–175' : '150～175';
      await expect(panel).toContainText(range);
      for (const phrase of english
        ? [
            'single-target attempt',
            'Freeze for 1 s',
            'bosses: 0.5 s',
            'Chill for 2 s',
            '50%',
            '15 MP',
            '1 s cooldown'
          ]
        : [
            '单体攻击',
            '冰封1 秒',
            '首领0.5 秒',
            '冰冻减速持续2 秒',
            '50%',
            '15 点法力',
            '冷却1 秒'
          ])
        await expect(panel).toContainText(phrase);
      await expect(
        current.getByText(english ? 'Mana Cost' : '法力消耗', { exact: true }).locator('+ dd')
      ).toHaveText('15');
      await expect(
        current.getByText(english ? 'Cooldown' : '冷却', { exact: true }).locator('+ dd')
      ).toHaveText(english ? '1 s' : '1 秒');
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
      expect(prepared.player.skillLevels?.['amazon.ice_arrow']).toBe(rank);
      expect(prepared.player.skillPoints).toBe(20 - rank);
      expect(prepared.player.comboOrder.filter(Boolean)).toEqual([id]);
      const observed = await page.evaluateHandle(
        ({ character, freeze, chill }) => {
          let cast: string | null = null,
            hit: string | null = null,
            freezeChip: string | null = null,
            chillChip: string | null = null,
            both: string | null = null;
          const enemyNames = new Set<string>();
          const observer = new MutationObserver(() => {
            for (const card of document.querySelectorAll(
              '[data-testid="enemies-grid"] [data-testid^="unit-card-"]'
            )) {
              const label =
                card.querySelector('img')?.alt ??
                card.querySelector('[title]')?.getAttribute('title');
              if (label) enemyNames.add(label);
              const chips = card.querySelector('[data-testid="unit-effect-chips"]')?.textContent;
              if (chips?.includes(freeze)) freezeChip ??= chips;
              if (chips?.includes(chill)) chillChip ??= chips;
              if (chips?.includes(freeze) && chips.includes(chill)) both ??= chips;
            }
            for (const row of document.querySelectorAll('[data-testid="combat-log"] > div')) {
              const text = row.lastElementChild?.textContent ?? '';
              if (
                cast === null &&
                text.includes(character) &&
                (text.includes(' casts Ice Arrow.') || text.includes('施放了 冰箭。'))
              )
                cast = text;
              if (
                hit === null &&
                [
                  character + ' attacks ',
                  character + ' hits ',
                  character + ' 普攻 ',
                  character + ' 对 '
                ].some((prefix) => text.includes(prefix)) &&
                (text.toLowerCase().includes('cold') || text.includes('冰冷')) &&
                (/ for [1-9]\d* /.test(text) || /造成 [1-9]\d* 点/.test(text)) &&
                [...enemyNames].some((enemy) => text.includes(enemy))
              )
                hit = text;
            }
          });
          observer.observe(document.body, { childList: true, subtree: true, characterData: true });
          return {
            read: () => ({ cast, hit, freezeChip, chillChip, both }),
            disconnect: () => {
              observer.disconnect();
            }
          };
        },
        { character, freeze: english ? 'Freeze' : '冻结', chill: english ? 'Chill' : '冰冷' }
      );
      try {
        await navTo(page, 'map');
        await page
          .getByTestId('sub-area-row-a1-catacombs')
          .getByRole('button', { name: english ? 'Enter' : '进入', exact: true })
          .click();
        for (const key of ['cast', 'hit', 'freezeChip', 'chillChip', 'both'] as const)
          await expect
            .poll(async () => (await observed.evaluate((handle) => handle.read()))[key])
            .not.toBeNull();
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
    expect(saved.player.skillLevels?.['amazon.ice_arrow']).toBe(20);
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

/** Constructed public fixture; no earned progression or balance claim. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const at = new Date('2026-10-26T12:00:00Z'),
  character = 'Ama Decoy Test';
const id = 'skills-amazon-decoy';
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
  test(`Amazon Decoy public allocation, cast, save and offline ${locale}`, async ({
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
      id: 'synthetic-decoy-cap',
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
        level: 24,
        skillPoints: 20,
        comboOrder: [],
        skillLevels: {
          'amazon.inner_sight': 1,
          'amazon.slow_missiles': 1
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
      for (const [label, value] of [
        [english ? 'Life' : '生命', rank === 1 ? '200' : '580'],
        [english ? 'Attack' : '攻击', '0'],
        [english ? 'Defense' : '防御', '20'],
        [english ? 'Mana Cost' : '法力消耗', rank === 1 ? '15' : '13'],
        [
          english ? 'Decoy lifetime' : '诱饵持续时间',
          rank === 1 ? (english ? '8 s' : '8 秒') : english ? '17.5 s' : '17.5 秒'
        ],
        [
          english ? 'Cooldown' : '冷却',
          rank === 1 ? (english ? '4 s' : '4 秒') : english ? '3 s' : '3 秒'
        ]
      ]) {
        if (!label || !value) throw new Error('Missing literal Decoy preview');
        await expect(current.getByText(label, { exact: true }).locator('+ dd')).toHaveText(value);
      }
      if (rank === 20)
        await expect(panel).toContainText(english ? 'Max level reached.' : '已达到最高等级。');
      await expect(panel).not.toContainText('{{');
      await expect(panel).toContainText(english ? 'non-attacking Decoy' : '不攻击的诱饵');
      await expect(panel).toContainText(english ? 'Taunt takes priority' : '嘲讽优先');
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
      expect(prepared.player.skillLevels?.['amazon.decoy']).toBe(rank);
      expect(prepared.player.skillPoints).toBe(20 - rank);
      expect(prepared.player.comboOrder.filter(Boolean)).toEqual([id]);
      await navTo(page, 'map');
      await page
        .getByTestId('sub-area-row-a1-blood-moor')
        .getByRole('button', { name: english ? 'Enter' : '进入', exact: true })
        .click();
      const cast = english ? `${character} casts Decoy.` : `${character} 施放了 诱饵。`;
      await expect(page.getByTestId('combat-log')).toContainText(cast);
      const body = page
        .getByTestId('allies-grid')
        .locator('[data-kind="summon"][data-testid*="-summon-decoy-"]');
      await expect(body).toHaveCount(1);
      await expect(body).toContainText(english ? 'Decoy' : '诱饵');
      await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
      await expect(body).not.toHaveAttribute('data-dead', 'true');
      await info.attach(`rank${String(rank)}-cast`, {
        body: JSON.stringify({
          cast,
          body: await body.getAttribute('data-testid'),
          log: await page.getByTestId('combat-log').innerText()
        }),
        contentType: 'application/json'
      });
      await info.attach(`rank${String(rank)}-combat`, {
        body: await body.screenshot(),
        contentType: 'image/png'
      });
      await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
    }
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    const saved = await backup(page);
    expect(saved.player.skillLevels?.['amazon.decoy']).toBe(20);
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

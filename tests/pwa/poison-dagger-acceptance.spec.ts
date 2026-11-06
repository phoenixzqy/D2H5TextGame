/** Synthetic Poison Dagger public UI/persistence proof; does not establish earned builds or campaign balance. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const at = new Date('2026-10-26T12:00:00Z');
const spells = ['poison-dagger'] as const;
const EXPECTED_SAVE_VERSION: SaveCurrent['version'] = 33;
async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try {
    const save = JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent;
    expect(save.version).toBe(EXPECTED_SAVE_VERSION);
    return save;
  } finally {
    await download.delete();
  }
}
for (const slug of spells)
  for (const locale of ['en', 'zh-CN'] as const)
    test(`Necromancer ${slug} public preview/cast/draw/save/offline ${locale}`, async ({
      page,
      context
    }, info) => {
      const english = locale === 'en',
        errors: string[] = [],
        consoleErrors: string[] = [];
      const watch = (target: Page) => {
        target.on('pageerror', (error) => errors.push(error.message));
        target.on('console', (message) => {
          if (message.type() === 'error' || message.type() === 'warning')
            consoleErrors.push(message.text());
        });
      };
      watch(page);
      await page.clock.setFixedTime(at);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await createCharacter(page, { class: 'necromancer', name: 'Poison Browser' });
      await navTo(page, 'settings');
      await page
        .getByRole('button', { name: english ? 'English' : '简体中文', exact: true })
        .click();
      const original = await backup(page);
      const rows = JSON.parse(
        await readFile(new URL('../../src/data/skills/necromancer.json', import.meta.url), 'utf8')
      ) as { id: string; prerequisites?: string[] }[];
      const levels: Record<string, number> = {};
      const add = (id: string) => {
        const row = rows.find((value) => value.id === id);
        if (!row) throw new Error('Missing native prerequisite');
        for (const ancestor of row.prerequisites ?? []) add(ancestor);
        levels[id] = 1;
      };
      add('skills-necromancer-' + slug);
      levels['skills-necromancer-' + slug] = 19;
      const cap: Item = {
        id: 'synthetic-poison-dagger-acceptance-cap',
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
              ['statMods.mana', 999000],
              ['statMods.attack', 100]
            ])
          }
        ]
      };
      const incoming = {
        ...original,
        player: {
          ...original.player,
          level: 30,
          skillPoints: 1,
          comboOrder: [],
          skillLevels: levels
        },
        inventory: { ...original.inventory, backpack: [cap], equipped: original.inventory.equipped }
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
      const geometry: {
        skill: string;
        width: number;
        height: number;
        allocationHeight: number;
        allocationWidth: number;
      }[] = [];
      {
        await page.getByTestId('skill-node-skills-necromancer-' + slug).focus();
        await page.keyboard.press('Enter');
        await page.mouse.move(0, 0);
        const panel = page.getByTestId('skill-detail-panel');
        await expect(panel).toContainText(
          english
            ? 'One attempt at one prioritized living enemy, dealing 115–130 Poison base damage.'
            : '对优先顺序中的一个存活敌人判定一次，造成115～130 点毒素基础伤害。'
        );
        for (const [heading, mana, cooldown] of [
          [english ? 'Current' : '当前', '5', '1'],
          [english ? 'Next Level' : '下一级', '5', '1']
        ] as const) {
          const section = panel
            .getByRole('heading', { name: heading, exact: true, level: 3 })
            .locator('..');
          for (const [label, value] of [
            [english ? 'Mana Cost' : '法力消耗', mana],
            [english ? 'Cooldown' : '冷却', cooldown + (english ? ' s' : ' 秒')]
          ]) {
            if (!label || !value)
              throw new Error('Missing Poison Dagger preview oracle');
            await expect(
              section.getByText(label, { exact: true }).locator('..').locator('dd')
            ).toHaveText(value);
          }
        }
        const allocate = panel.getByRole('button', {
          name: english ? 'Allocate' : '分配',
          exact: true
        });
        for (const [width, height] of [
          [360, 640],
          [412, 915],
          [640, 360],
          [1280, 800],
          [1920, 1080]
        ] as const) {
          await page.setViewportSize({ width, height });
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
          ).toBe(true);
          const box = await allocate.boundingBox();
          if (!box) throw new Error('Missing allocation target');
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.width).toBeGreaterThanOrEqual(44);
          geometry.push({
            skill: slug,
            width,
            height,
            allocationHeight: box.height,
            allocationWidth: box.width
          });
        }
        await page.setViewportSize(
          info.project.name.includes('mobile')
            ? { width: 360, height: 640 }
            : { width: 1280, height: 800 }
        );
        await allocate.click();
        await expect(panel).toContainText(english ? 'Lv. 20/20' : '等级 20/20');
        await expect(panel).toContainText(english ? 'Max level reached.' : '已达到最高等级。');
        await expect(panel).toContainText(english ? '120–135 Poison base damage' : '120～135 点毒素基础伤害');
        for (const phrase of english
          ? ['5% of the final hit per second', '5 s', '10 stacks', 'keeps its original rate']
          : ['最终命中伤害的5%', '5 秒', '10层', '保留原伤害率'])
          await expect(panel).toContainText(phrase);
        await page.setViewportSize(
          info.project.name.includes('mobile')
            ? { width: 360, height: 640 }
            : { width: 1280, height: 800 }
        );
        const maxCurrent = panel
          .getByRole('heading', {
            name: english ? 'Current' : '当前',
            exact: true,
            level: 3
          })
          .locator('..');
        for (const [label, value] of [
          [english ? 'Mana Cost' : '法力消耗', '5'],
          [english ? 'Cooldown' : '冷却', '1' + (english ? ' s' : ' 秒')]
        ]) {
          if (!label || !value) throw new Error('Missing MAX Poison Dagger oracle');
          await expect(
            maxCurrent.getByText(label, { exact: true }).locator('..').locator('dd')
          ).toHaveText(value);
        }
        await panel.evaluate((element) => {
          element.scrollTop = 0;
        });
        await panel.locator('h2').scrollIntoViewIfNeeded();
        await info.attach(slug + '-preview-viewport', {
          body: await page.screenshot(),
          contentType: 'image/png'
        });
        const current = panel
          .getByRole('heading', { name: english ? 'Current' : '当前', exact: true, level: 3 })
          .locator('..');
        await current.scrollIntoViewIfNeeded();
        await info.attach(slug + '-current-stats', {
          body: await current.screenshot(),
          contentType: 'image/png'
        });
      }
      await info.attach('geometry', {
        body: JSON.stringify(geometry),
        contentType: 'application/json'
      });
      await page.locator('#tab-active').click();
      const slot = page.getByRole('combobox', { name: /^(Slot 1|槽位 1)$/ });
      await slot.focus();
      await slot.selectOption('skills-necromancer-' + slug);
      await expect(slot).toHaveValue('skills-necromancer-' + slug);
      const prepared = await backup(page);
      expect(prepared.player.skillLevels?.['skills-necromancer-' + slug]).toBe(20);
      expect(prepared.player.comboOrder.filter(Boolean)).toEqual(['skills-necromancer-' + slug]);
      expect(JSON.stringify(prepared)).not.toContain('"dotPerStack"');
      const names = { 'poison-dagger': ['Poison Dagger', '淬毒匕首'] } as const;
      const spellName = names[slug][english ? 0 : 1];
      const chipName = english ? 'Poison' : '中毒';
      // Observe real rendered log entries across wave resets, retaining only one matching line.
      const observed = await page.evaluateHandle(
        ({ name, chipName }) => {
          let castLine: string | null = null, poisonChip: string | null = null,
            enemyDotLine: string | null = null;
          const enemyNames = new Set<string>();
          const observer = new MutationObserver(() => {
            for (const card of document.querySelectorAll('[data-testid="enemies-grid"] [data-testid^="unit-card-"]')) {
              const image = card.querySelector('img');
              const name = image?.alt ?? card.querySelector('[title]')?.getAttribute('title');
              if (name) enemyNames.add(name);
              const chip = card.querySelector('[data-testid="unit-effect-chips"]')?.textContent;
              if (poisonChip === null && chip?.includes(chipName)) poisonChip = chip;
            }
            for (const row of document.querySelectorAll('[data-testid="combat-log"] > div')) {
              const text = row.textContent;
              if (castLine === null && text.includes(name) && (text.includes(' casts ') || text.includes('施放了')))
                castLine = text;
              if (enemyDotLine === null &&
                (/ takes [1-9]\d* damage over time\./.test(text) || / 因持续伤害受到 [1-9]\d* 点伤害。/.test(text)) &&
                [...enemyNames].some(enemy => text.includes(enemy + ' takes ') || text.includes(enemy + ' 因持续伤害受到 ')))
                enemyDotLine = text;
            }
          });
          observer.observe(document.body, { childList: true, subtree: true, characterData: true });
          return {
            read: () => castLine,
            chip: () => poisonChip,
            dot: () => enemyDotLine,
            disconnect: () => {
              observer.disconnect();
            }
          };
        },
        { name: spellName, chipName }
      );
      try {
        await navTo(page, 'map');
        await page
          .getByTestId('sub-area-row-a1-catacombs')
          .getByRole('button', { name: english ? 'Enter' : '进入', exact: true })
          .click();
        await expect.poll(() => observed.evaluate((handle) => handle.chip())).toContain(chipName);
        await expect.poll(() => observed.evaluate((handle) => handle.dot()), { timeout: 90_000 }).toMatch(/(?:takes [1-9]\d* damage over time|因持续伤害受到 [1-9]\d* 点伤害)/);
        await expect.poll(() => observed.evaluate((handle) => handle.read())).toContain(spellName);
        await info.attach('poison-battle-viewport', {
          body: await page.screenshot(),
          contentType: 'image/png'
        });
        for (let i = 0; i < 2; i++)
          await page.getByRole('button', { name: english ? 'Speed' : '速度', exact: true }).click();
        await page.mouse.move(0, 0);
        // The single-skill synthetic fixture draws on the elite wave. It proves
        // Dagger casting/persistence and does not establish a campaign clear.
        const draw = page.getByTestId('defeat-panel');
        await expect(draw).toBeVisible({ timeout: 90_000 });
        await expect(draw.getByRole('heading', {
          name: english ? 'The battle ends in a draw.' : '战斗以平局结束。', exact: true
        })).toBeVisible();
        await expect(page.getByTestId('victory-panel')).toHaveCount(0);
        await draw.scrollIntoViewIfNeeded();
        await info.attach('draw-panel', {
          body: await draw.screenshot(),
          contentType: 'image/png'
        });
        await info.attach('public-cast', {
          body: JSON.stringify({
            slug,
            spellName,
            chipName,
            line: await observed.evaluate((handle) => handle.read()),
            enemyChip: await observed.evaluate((handle) => handle.chip()),
            positiveEnemyPeriodicHP: await observed.evaluate((handle) => handle.dot()),
            outcome: 'draw'
          }),
          contentType: 'application/json'
        });
      } finally {
        await observed.evaluate((handle) => {
          handle.disconnect();
        });
        await observed.dispose();
      }
      await page.getByTestId('return-to-town').click();
      await navTo(page, 'settings');
      await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
      await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
      const saved = await backup(page);
      expect(saved.player.skillLevels).toEqual(prepared.player.skillLevels);
      expect(JSON.stringify(saved)).not.toContain('"dotPerStack"');
      expect(saved.map.clearedSubAreas).not.toContain('areas/act1-catacombs');
      expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
      });
      await expect
        .poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state))
        .toBe('activated');
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
      expect(consoleErrors).toEqual([]);
      await info.attach('console-errors', {
        body: JSON.stringify({ errors, consoleErrors }),
        contentType: 'application/json'
      });
    });

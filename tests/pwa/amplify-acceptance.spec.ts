/** Synthetic Amplify Damage public UI/persistence proof; does not establish earned builds or campaign balance. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const at = new Date('2026-10-26T12:00:00Z');
const spells = ['amplify-damage'] as const;
const EXPECTED_SAVE_VERSION: SaveCurrent['version'] = 24;
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
    test(`Necromancer ${slug} public preview/cast/save/offline ${locale}`, async ({
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
      await createCharacter(page, { class: 'necromancer', name: 'Curse Browser' });
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
        id: 'synthetic-amplify-acceptance-cap',
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
              ['statMods.mana', 1000],
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
            ? 'Curses all living enemies, reducing physical resistance by 50 percentage points for 3 s at every skill rank.'
            : '诅咒所有存活敌人，使物理抗性降低50个百分点，持续3 秒，各技能等级相同。'
        );
        for (const [heading, mana, cooldown] of [
          [english ? 'Current' : '当前', '11', '2.1'],
          [english ? 'Next Level' : '下一级', '11', '2']
        ] as const) {
          const section = panel
            .getByRole('heading', { name: heading, exact: true, level: 3 })
            .locator('..');
          for (const [label, value] of [
            [english ? 'Mana Cost' : '法力消耗', mana],
            [english ? 'Cooldown' : '冷却', cooldown + (english ? ' s' : ' 秒')]
          ]) {
            if (!label || !value)
              throw new Error('Missing independent target curse preview oracle');
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
          [english ? 'Mana Cost' : '法力消耗', '11'],
          [english ? 'Cooldown' : '冷却', '2' + (english ? ' s' : ' 秒')]
        ]) {
          if (!label || !value) throw new Error('Missing MAX Amplify Damage oracle');
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
      expect(JSON.stringify(prepared)).not.toContain('"physicalResistReductionPct"');
      const names = { 'amplify-damage': ['Amplify Damage', '加强伤害'] } as const;
      const spellName = names[slug][english ? 0 : 1];
      const chipName = english ? 'Amplify' : '伤害加深';
      // Observe real rendered log entries across wave resets, retaining only one matching line.
      const observed = await page.evaluateHandle(
        ({ name, chipName }) => {
          let castLine: string | null = null,
            curseChip: string | null = null;
          const observer = new MutationObserver(() => {
            if (curseChip === null)
              for (const chip of document.querySelectorAll(
                '[data-testid="enemies-grid"] [data-testid="unit-effect-chips"]'
              )) {
                const text = chip.textContent;
                if (text.includes(chipName)) {
                  curseChip = text;
                  break;
                }
              }
            if (castLine !== null) return;
            for (const row of document.querySelectorAll('[data-testid="combat-log"] > div')) {
              const text = row.textContent;
              if (text.includes(name) && (text.includes(' casts ') || text.includes('施放了'))) {
                castLine = text;
                break;
              }
            }
          });
          observer.observe(document.body, { childList: true, subtree: true, characterData: true });
          return {
            read: () => castLine,
            chip: () => curseChip,
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
          .getByTestId('sub-area-row-a1-blood-moor')
          .getByRole('button', { name: english ? 'Enter' : '进入', exact: true })
          .click();
        await expect.poll(() => observed.evaluate((handle) => handle.chip())).toContain(chipName);
        for (let i = 0; i < 2; i++)
          await page.getByRole('button', { name: english ? 'Speed' : '速度', exact: true }).click();
        await page.mouse.move(0, 0);
        await expect(page.getByTestId('victory-panel')).toBeVisible({ timeout: 90_000 });
        await expect.poll(() => observed.evaluate((handle) => handle.read())).toContain(spellName);
        await info.attach('public-cast', {
          body: JSON.stringify({
            slug,
            spellName,
            chipName,
            line: await observed.evaluate((handle) => handle.read()),
            enemyChip: await observed.evaluate((handle) => handle.chip())
          }),
          contentType: 'application/json'
        });
      } finally {
        await observed.evaluate((handle) => {
          handle.disconnect();
        });
        await observed.dispose();
      }
      await info.attach('victory', { body: await page.screenshot(), contentType: 'image/png' });
      await page.getByTestId('return-to-town').click();
      await navTo(page, 'settings');
      await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
      await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
      const saved = await backup(page);
      expect(saved.player.skillLevels).toEqual(prepared.player.skillLevels);
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

/** Constructed public fixture; no earned progression or balance claim. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import type { Item } from '../../src/engine/types/items';
import { createCharacter, navTo } from '../e2e/_helpers';

const at = new Date('2026-10-26T12:00:00Z'),
  character = 'Shadow Test';
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
 for (const slug of ['shadow-warrior', 'shadow-master'] as const)
  test(`Assassin ${slug} public allocation, typed skill damage, save and offline ${locale}`, async ({
    page,
    context
  }, info) => {
    const english = locale === 'en', id = 'skills-assassin-' + slug,
      bodyName = english ? (slug === 'shadow-warrior' ? 'Shadow Warrior' : 'Shadow Master') :
        (slug === 'shadow-warrior' ? '影子战士' : '影子大师'),
      attackName = english ? (slug === 'shadow-warrior' ? 'Fire Blast' : 'Mind Blast') :
        (slug === 'shadow-warrior' ? '烈焰冲击' : '精神爆裂'),
      damageName = english ? (slug === 'shadow-warrior' ? 'fire' : 'arcane') :
        (slug === 'shadow-warrior' ? '火焰' : '奥术'),
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
    await createCharacter(page, { class: 'assassin', name: character });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const original = await backup(page);
    const cap: Item = {
      id: 'synthetic-shadow-cap',
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
        skillPoints: 20,
        comboOrder: [],
        skillLevels: {
          'assassin.claw_mastery': 1,
          'assassin.weapon_block': 1,
          ...(slug === 'shadow-warrior' ? { 'assassin.fire_blast': 1 } : { 'assassin.shadow_warrior': 1 })
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
      const current = panel
        .locator('section')
        .filter({
          has: page.getByRole('heading', { name: english ? 'Current' : '当前', exact: true })
        });
      for (const [label, value] of [
        [english ? 'Own Mana' : '自身法力', slug === 'shadow-warrior' ? '100' : '150'],
        [english ? 'Skill rank cap' : '技能等级上限', String(rank)],
        [english ? 'Mana Cost' : '法力消耗', slug === 'shadow-warrior' ? (rank === 1 ? '22' : '18') : (rank === 1 ? '35' : '30')],
        [english ? 'Cooldown' : '冷却', english ? '4 s' : '4 秒']
      ]) {
        if (!label || !value) throw new Error('Missing literal shadow preview');
        await expect(current.getByText(label, { exact: true }).locator('+ dd')).toHaveText(value);
      }
      for (const phrase of english ? ['own cooldowns', 'No automatic mana refill', 'next wave'] : ['独立冷却', '不会自动补满法力', '下一波'])
        await expect(panel).toContainText(phrase);
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
      if (slug === 'shadow-warrior')
        await page.getByRole('combobox', { name: /^(Slot 2|槽位 2)$/ }).selectOption('skills-assassin-fire-blast');
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
      expect(prepared.player.skillLevels?.['assassin.' + slug.replaceAll('-', '_')]).toBe(rank);
      expect(prepared.player.skillPoints).toBe(20 - rank);
      expect(prepared.player.comboOrder.filter(Boolean)).toEqual(slug === 'shadow-warrior' ? [id, 'skills-assassin-fire-blast'] : [id]);
      const observed = await page.evaluateHandle(({ character, bodyName, attackName, damageName, english }) => {
        const seen = new WeakSet<Element>();
        let ownerCast: string | null = null, skillCast: string | null = null, positiveHit: string | null = null;
        let damagedEnemy: string | null = null;
        const observer = new MutationObserver(() => {
          for (const row of document.querySelectorAll('[data-testid="combat-log"] > div')) {
            if (seen.has(row)) continue;
            seen.add(row);
            const text = row.lastElementChild?.textContent ?? '';
            if (text.includes(character) && text.includes(bodyName) &&
              text.includes(english ? ' casts ' : ' 施放了 ')) ownerCast ??= text;
            if (text.includes(bodyName + (english ? ' casts ' : ' 施放了 ') + attackName)) skillCast ??= text;
            if (skillCast && text.includes(bodyName) && text.includes(damageName) &&
              (english ? /(?:for|for ) [1-9]\d* /.test(text) : /造成 [1-9]\d* 点/.test(text))) positiveHit ??= text;
          }
          if (positiveHit) for (const card of document.querySelectorAll('[data-testid="enemies-grid"] [data-kind="monster"]')) {
            const bar = card.querySelector<HTMLElement>('[style*="width"]');
            if (bar && Number.parseFloat(bar.style.width) < 100) damagedEnemy ??= card.textContent;
          }
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['style'] });
        return { read: () => ({ ownerCast, skillCast, positiveHit, damagedEnemy }), disconnect: () => { observer.disconnect(); } };
      }, { character, bodyName, attackName, damageName, english });
      try {
        await navTo(page, 'map');
        await page.getByTestId('sub-area-row-a1-cold-plains')
          .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
        const body = page.getByTestId('allies-grid')
          .locator('[data-kind="summon"][data-testid*="-summon-' + slug.replaceAll('-', '_') + '-"]');
        await expect(body).toHaveCount(1);
        for (const key of ['ownerCast', 'skillCast', 'positiveHit', 'damagedEnemy'] as const)
          await expect.poll(async () => (await observed.evaluate(handle => handle.read()))[key]).not.toBeNull();
        await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
        await expect(body).not.toHaveAttribute('data-dead', 'true');
        await info.attach(`rank${String(rank)}-cast`, { body: JSON.stringify({
          ...await observed.evaluate(handle => handle.read()), body: await body.getAttribute('data-testid'),
          log: await page.getByTestId('combat-log').innerText()
        }), contentType: 'application/json' });
        await info.attach(`rank${String(rank)}-combat`, { body: await body.screenshot(), contentType: 'image/png' });
      } finally {
        await observed.evaluate(handle => { handle.disconnect(); });
        await observed.dispose();
      }
      await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
    }
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    const saved = await backup(page);
    expect(saved.player.skillLevels?.['assassin.' + slug.replaceAll('-', '_')]).toBe(20);
    expect(saved.player.skillPoints).toBe(0);
    expect(saved.player.comboOrder.filter(Boolean)).toEqual(slug === 'shadow-warrior' ? [id, 'skills-assassin-fire-blast'] : [id]);
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

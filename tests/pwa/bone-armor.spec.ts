/** Fresh native level1 allocation and production persistence; no earned campaign/balance claim. */
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

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
const cases = [
  {
    classId: 'necromancer',
    slug: 'bone-armor',
    canonical: 'necromancer.bone_armor',
    rows: [
      ['Bone Armor Absorb', '骨甲吸收', 12]
    ]
  }
] as const;
for (const locale of ['en', 'zh-CN'] as const) {
  for (const c of cases) {
    test(
      c.canonical + ' native allocation and exact Continue ' + locale,
      async ({ page: initial, context }, info) => {
        const english = locale === 'en',
          errors: string[] = [];
        const watch = (p: Page) => {
          p.on('pageerror', (error) => errors.push(error.message));
          p.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text());
          });
        };
        let page = initial;
        watch(page);
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await createCharacter(page, { class: c.classId, name: 'Bone Armor fixture' });
        await navTo(page, 'settings');
        await page
          .getByRole('button', { name: english ? 'English' : '简体中文', exact: true })
          .click();
        const fresh = await backup(page);
        expect(fresh.player.level).toBe(1);
        expect(fresh.player.skillPoints).toBe(1);
        const prepared = fresh;
        await navTo(page, 'skills');
        await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
        const id = 'skills-' + c.classId + '-' + c.slug;
        await page.getByTestId('skill-node-' + id).click();
        await page.mouse.move(1, 1);
        const panel = page.getByTestId('skill-detail-panel');
        await expect(panel).toContainText(english ? '12 absorption per rank' : '每级提供12点吸收');
        await expect(panel).toContainText(english ? 'next fresh area run' : '下次新区域挑战');
        await expect(panel).toContainText(english ? 'does not refill between waves' : '波次之间不补充');
        await expect(panel).toContainText(english ? 'maximum 20 ranks' : '最高20级');
        await expect(panel).not.toContainText('{{');
        await expect(panel).not.toContainText(english ? 'movement speed' : '移动速度');
        const allocate = panel.getByRole('button');
        await allocate.scrollIntoViewIfNeeded();
        const bounds = await allocate.boundingBox();
        expect(bounds?.width).toBeGreaterThanOrEqual(44);
        expect(bounds?.height).toBeGreaterThanOrEqual(44);
        const current = panel.locator('section').filter({
          has: page.getByRole('heading', { name: english ? 'Current' : '当前', exact: true })
        });
        const next = panel.locator('section').filter({
          has: page.getByRole('heading', { name: english ? 'Next Level' : '下一级', exact: true })
        });
        for (const rank of [1]) {
          await allocate.click();
          await expect(panel).toContainText(
            english ? 'Lv. ' + String(rank) + '/20' : '等级 ' + String(rank) + '/20'
          );
          for (const [en, zh, bonus] of c.rows) {
            const label = english ? en : zh;
            await expect(
              current.locator('dt').filter({ hasText: label }).locator('+ dd')
            ).toHaveText(String(bonus * rank));
            await expect(next.locator('dt').filter({ hasText: label }).locator('+ dd')).toHaveText(
              new RegExp(
                '^' +
                  String(bonus * (rank + 1)).replace('.', '[.]') +
                  '[ ]*[(][+]'  +
                  String(bonus).replace('.', '[.]') +
                  '[)]$'
              )
            );
          }
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        );
        await info.attach('allocated-bone-armor', {
          body: await page.screenshot(),
          contentType: 'image/png'
        });
        const dimensions = [];
        for (const [width, height] of [[360,640], [412,915], [640,360], [1280,800], [1920,1080]] as const) {
          await page.setViewportSize({ width, height });
          await panel.scrollIntoViewIfNeeded();
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          await allocate.scrollIntoViewIfNeeded();
          const b = await allocate.boundingBox();
          expect(b?.width).toBeGreaterThanOrEqual(44);
          expect(b?.height).toBeGreaterThanOrEqual(44);
          dimensions.push({ width, height, button: b });
        }
        await info.attach('responsive-dimensions', { body: JSON.stringify(dimensions), contentType: 'application/json' });
        await page.setViewportSize(info.project.name.includes('mobile') ? {width:360,height:640} : {width:1280,height:800});
        const allocated = await backup(page);
        expect(allocated.player.skillPoints).toBe(0);
        expect(allocated.player.skillLevels).toEqual({
          ...prepared.player.skillLevels,
          [c.canonical]: 1
        });
        expect(allocated.player.derivedStats).toEqual(prepared.player.derivedStats);
        expect(allocated.inventory).toEqual(prepared.inventory);
        expect(allocated.map).toEqual(prepared.map);
        expect(allocated.mercs).toEqual(prepared.mercs);
        expect(allocated.formation).toEqual(prepared.formation);
        await navTo(page, 'skills');
        await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
        const slot = page.getByRole('combobox', { name: english ? 'Slot 1' : '槽位 1', exact: true });
        await expect(slot.locator('option[value="' + id + '"]')).toHaveCount(0);
        await expect(slot).toHaveValue('skills-necromancer-raise-skeleton');
        expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
        const saved = await backup(page);
        // The existing first Skills visit normalizes the starter's canonical alias.
        expect(prepared.player.comboOrder).toEqual(['necromancer.raise_skeleton']);
        expect(saved.player.comboOrder).toEqual(['skills-necromancer-raise-skeleton']);
        expect(saved.player.skillLevels?.[c.canonical]).toBe(1);
        expect(saved.player.derivedStats).toEqual(prepared.player.derivedStats);
        await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
        await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
        await page.close();
        page = await context.newPage();
        watch(page);
        await page.goto('/');
        await page.getByTestId('home-continue').click();
        await expect(page.getByTestId('town-screen')).toBeVisible();
        const loaded = await backup(page);
        expect(loaded.player).toEqual(saved.player);
        expect(loaded.inventory).toEqual(saved.inventory);
        expect(loaded.map).toEqual(saved.map);
        expect(loaded.mercs).toEqual(saved.mercs);
        expect(loaded.formation).toEqual(saved.formation);
        await navTo(page, 'skills');
        await page.getByTestId('skill-node-' + id).click();
        await page.mouse.move(1, 1);
        await page.getByTestId('skill-detail-panel').scrollIntoViewIfNeeded();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        );
        await info.attach('bone-armor-after-Continue', {
          body: await page.screenshot(),
          contentType: 'image/png'
        });
        await info.attach('exact-Continue', {
          body: JSON.stringify({ saved, loaded, errors }, null, 2),
          contentType: 'application/json'
        });
        expect(JSON.stringify(loaded)).not.toContain('boneArmor');
        expect(errors).toEqual([]);
      }
    );
  }
}

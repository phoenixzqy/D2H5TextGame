/** Imported powerful heroes prove quest/event wiring, not earned campaign balance. */
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const QUEST = 'quests/act1-den-of-evil';
const AREA = 'areas/act1-den-of-evil';

async function exportBackup(page: Page): Promise<SaveCurrent> {
  const download = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const path = await (await download).path();
  return JSON.parse(await readFile(path, 'utf8')) as SaveCurrent;
}

async function expectPartialQuest(page: Page, locale: 'en' | 'zh-CN'): Promise<void> {
  const card = page.getByTestId(`quest-${QUEST}`);
  await expect(card).toContainText(locale === 'en' ? 'In Progress' : '进行中');
  const clear = card.getByText(locale === 'en' ? 'Slay all monsters in the Den' : '击杀巢穴中所有怪物', { exact: true });
  await expect(clear).toHaveClass(/line-through/);
  await expect(card.getByText('Return to Akara.', { exact: true })).not.toHaveClass(/line-through/);
  await expect(page.getByTestId(`quest-claim-${QUEST}`)).toHaveCount(0);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`real Den clear advances only its tracked clear objective and persists ${locale} @responsive`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'Quest wiring' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: locale === 'en' ? 'English' : '简体中文', exact: true }).click();
    const original = await exportBackup(page);
    const imported: SaveCurrent = {
      ...original,
      player: {
        ...original.player, comboOrder: [],
        derivedStats: {
          ...original.player.derivedStats, attack: 100_000, defense: 100_000,
          life: 1_000_000, lifeMax: 1_000_000
        }
      }
    };
    const importLabel = locale === 'en' ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(imported));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);

    await navTo(page, 'quests');
    await page.getByTestId(`quest-start-${QUEST}`).click();
    const card = page.getByTestId(`quest-${QUEST}`);
    await expect(card).toContainText(locale === 'en' ? 'In Progress' : '进行中');
    await expect(card.locator('.line-through')).toHaveCount(0);
    await expect(page.getByTestId(`quest-claim-${QUEST}`)).toHaveCount(0);
    await navTo(page, 'map');
    // Freeze timer transport only; actual engine results and ordinary Skip controls remain real.
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await page.getByTestId('sub-area-row-a1-den-of-evil')
      .getByRole('button', { name: locale === 'en' ? 'Enter' : '进入', exact: true }).click();
    const counter = page.getByTestId('wave-counter');
    // The first render shows 1/1 until the run-start effect installs its real plan.
    await expect.poll(async () => Number((await counter.innerText()).match(/\d+/g)?.[1] ?? 0))
      .toBeGreaterThan(1);
    const count = (await counter.innerText()).match(/\d+/g);
    if (count?.length !== 2) throw new Error('Missing wave counter');
    const total = Number(count[1]);
    expect(total).toBeGreaterThan(1);
    for (let wave = 1; wave <= total; wave++) {
      await expect(counter).toContainText(locale === 'en'
        ? `Wave ${String(wave)} / ${String(total)}`
        : `第 ${String(wave)} 波 / 共 ${String(total)} 波`);
      await page.getByTestId('skip-button').click();
      await page.clock.runFor(1600);
    }
    await expect(page.getByTestId('victory-panel')).toBeVisible();
    await expect(page.getByTestId('defeat-panel')).toHaveCount(0);
    await page.getByTestId('return-to-map').click();
    await expect(page.getByTestId('cleared-badge-a1-den-of-evil')).toBeVisible();
    await navTo(page, 'quests');
    await expectPartialQuest(page, locale);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await navTo(page, 'settings');
    const saveLabel = locale === 'en' ? 'Save' : '保存';
    await page.getByRole('button', { name: saveLabel, exact: true }).click();
    const backup = await exportBackup(page);
    expect(backup.map.clearedSubAreas.filter((area) => area === AREA)).toEqual([AREA]);
    expect(backup.map.questProgress[QUEST]).toEqual({
      id: QUEST, status: 'inProgress',
      objectives: { 'obj-clear-den': true, 'obj-return': false }
    });
    await page.reload();
    await expect(page.getByRole('button', { name: saveLabel, exact: true })).toBeVisible();
    const restored = await exportBackup(page);
    expect(restored.map).toEqual(backup.map);
    expect(restored.player).toEqual(backup.player);
    expect(restored.inventory).toEqual(backup.inventory);
    await navTo(page, 'quests');
    await expectPartialQuest(page, locale);
    expect(errors).toEqual([]);
  });
}

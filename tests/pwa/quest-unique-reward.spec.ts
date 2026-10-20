/** UI-imported completion proves production claim wiring, not earned boss victory. */
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { awardXp, xpTotal } from '../../src/engine/progression/xp';
import { clearGameStorage, createCharacter, navTo } from '../e2e/_helpers';

const QUEST = 'quests/act1-sisters-to-the-slaughter';
const copy = {
  en: {
    name: 'Sisters to the Slaughter',
    desc: 'Andariel, the Maiden of Anguish, has corrupted the Rogue Monastery. Descend through the Catacombs and slay her to free the Sisters and reopen the path east.',
    objective: 'Slay Andariel.', item: 'Coif of Glory',
    feedback: 'Rewards claimed.', claimed: 'Claimed',
    stats: ['Lightning Resist', 'Defense', 'Life']
  },
  'zh-CN': {
    name: '姐妹的劫难',
    desc: '苦痛之女安达利尔已腐化了罗格修女堡。深入地下墓穴，斩杀她，解救姐妹们，重开通往东方的道路。',
    objective: '斩杀安达利尔。', item: '荣耀之盔',
    feedback: '奖励已领取。', claimed: '已领取',
    stats: ['闪电抗性', '防御', '生命']
  }
} as const;

async function exportBackup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}

async function expectProduction(page: Page): Promise<void> {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function attachSave(info: TestInfo, name: string, save: SaveCurrent): Promise<void> {
  await info.attach(name, { body: JSON.stringify(save, null, 2), contentType: 'application/json' });
}

for (const locale of ['zh-CN', 'en'] as const) {
  test(`actual unique quest claim and save/reload ${locale}`, async ({ page, isMobile }, info) => {
    const english = locale === 'en';
    const text = copy[locale];
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'Unique reward proof' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const original = await exportBackup(page);
    expect(original.inventory.backpack).toEqual([]);
    const incoming: SaveCurrent = { ...original, map: { ...original.map, questProgress: {
      ...original.map.questProgress,
      [QUEST]: { id: QUEST, status: 'completed', objectives: { 'obj-kill-andariel': true } }
    } } };
    const importLabel = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(incoming));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const completed = await exportBackup(page);
    expect(completed.player).toEqual(original.player);
    expect(completed.inventory).toEqual(original.inventory);
    expect(completed.map).toEqual(incoming.map);
    await attachSave(info, 'completed', completed);
    await navTo(page, 'quests');
    await page.waitForLoadState('networkidle');
    await expectProduction(page);
    const card = page.getByTestId(`quest-${QUEST}`);
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible();
    // Soft geometry/copy checks retain all observed defects while exercising settlement.
    expect.soft(await card.getByRole('heading', { level: 3 }).textContent()).toBe(text.name);
    expect.soft(await card.locator(':scope > p').textContent()).toBe(text.desc);
    expect.soft(await card.locator('li.line-through').textContent()).toBe(text.objective);
    const gift = card.locator('li').filter({ hasText: /^🎁/ });
    await expect(gift).toHaveCount(1);
    await expect(gift).toHaveText(`🎁 ${text.item}`);
    expect(await gift.textContent()).not.toMatch(/uniqueId|ilvl|items\/|\[object Object\]/);
    const claim = page.getByTestId(`quest-claim-${QUEST}`);
    await expect(claim).toBeEnabled();
    const bounds = await claim.boundingBox();
    expect.soft(bounds?.height).toBeGreaterThanOrEqual(44);
    expect.soft(bounds?.width).toBeGreaterThanOrEqual(44);
    await info.attach('claim-geometry', { body: JSON.stringify({ viewport: page.viewportSize(), bounds }),
      contentType: 'application/json' });
    await claim.click();
    await expect(claim).toBeDisabled();
    await expect(claim).toHaveText(text.claimed);
    await expect(page.getByTestId(`quest-feedback-${QUEST}`)).toHaveText(text.feedback);
    await card.screenshot({ path: info.outputPath('quest-claimed.png') });
    const feedback = page.getByTestId(`quest-feedback-${QUEST}`);
    await feedback.evaluate(element => {
      element.scrollIntoView({
        block: 'center', inline: 'nearest', behavior: 'instant'
      });
    });
    await expect(feedback).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: info.outputPath('quest-feedback-viewport.png') });
    const paid = await exportBackup(page);
    const award = awardXp(xpTotal(completed.player.level) + completed.player.experience, 8000);
    expect(xpTotal(paid.player.level) + paid.player.experience).toBe(award.totalXp);
    expect(paid.player.level).toBe(award.level);
    expect(paid.player.statPoints).toBe(completed.player.statPoints + award.statPointsGranted);
    expect(paid.player.skillPoints).toBe(completed.player.skillPoints + award.skillPointsGranted);
    const item = paid.inventory.backpack[0];
    expect(item).toMatchObject({ uniqueId: 'items/unique/coif-of-glory',
      baseId: 'items/base/helm-skull-cap', rarity: 'unique', ilvl: 19, statRolls: {} });
    if (!item) throw new Error('Missing paid Coif');
    expect(paid.inventory).toEqual({ ...completed.inventory, backpack: [item] });
    expect(paid.map).toEqual({ ...completed.map, questProgress: {
      ...completed.map.questProgress, [QUEST]: { ...completed.map.questProgress[QUEST], rewardClaimed: true }
    } });
    await attachSave(info, 'paid', paid);
    await navTo(page, 'inventory');
    const itemCard = page.getByTestId(`inv-item-${item.id}`);
    await expect(itemCard).toHaveAccessibleName(new RegExp(text.item));
    if (isMobile) await itemCard.tap();
    else await itemCard.click();
    const detail = page.getByTestId('inv-detail-panel');
    await expect(detail).toBeVisible();
    // Dismiss the documented hint with an ordinary neutral detail interaction.
    const title = detail.getByText(text.item, { exact: true });
    if (isMobile) await title.tap();
    else await title.click();
    await expect(page.getByTestId('tooltip')).toHaveCount(0);
    await expect(detail).toBeVisible();
    await expect(title).toBeVisible();
    await expect(title).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: info.outputPath('inventory-title-viewport.png') });
    await expect(detail).toContainText(text.item);
    const stats = page.getByTestId('inv-detail-definition-stats');
    await expect(stats.locator('li')).toHaveCount(3);
    await stats.scrollIntoViewIfNeeded();
    for (const [index, value] of [15, 20, 10].entries()) {
      await expect(stats.locator('li').nth(index)).toContainText(text.stats[index] ?? 'MISSING');
      await expect(stats.locator('li').nth(index)).toContainText(`+${String(value)}`);
      await expect(stats.locator('li').nth(index)).toBeVisible();
      await expect(stats.locator('li').nth(index)).toBeInViewport({ ratio: 1 });
    }
    await expectProduction(page);
    await expect(page.getByTestId('tooltip')).toHaveCount(0);
    await page.screenshot({ path: info.outputPath('inventory-stats-viewport.png') });
    await detail.screenshot({ path: info.outputPath('inventory-coif.png') });
    await page.getByTestId('inv-detail-close').click();
    await navTo(page, 'settings');
    const save = page.getByRole('button', { name: english ? 'Save' : '保存', exact: true });
    await save.click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    await page.reload();
    await expect(save).toBeVisible();
    await page.waitForLoadState('networkidle');
    const restored = await exportBackup(page);
    expect(restored.player).toEqual(paid.player);
    expect(restored.inventory).toEqual(paid.inventory);
    expect(restored.map).toEqual(paid.map);
    await attachSave(info, 'restored', restored);
    await navTo(page, 'quests');
    await expect(claim).toBeDisabled();
    await expect(claim).toHaveText(text.claimed);
    const repeated = await exportBackup(page);
    expect(repeated.player).toEqual(paid.player);
    expect(repeated.inventory).toEqual(paid.inventory);
    expect(repeated.map).toEqual(paid.map);
    await expectProduction(page);
    expect(errors).toEqual([]);
  });
}

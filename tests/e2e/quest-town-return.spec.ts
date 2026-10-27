/** Ordinary imported combat strength proves event/reward wiring, not earned balance. */
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { awardXp, xpTotal } from '../../src/engine/progression/xp';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const QUEST = 'quests/act1-den-of-evil';
const AREA = 'areas/act1-den-of-evil';

async function exportBackup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const download = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const path = await (await download).path();
  return JSON.parse(await readFile(path, 'utf8')) as SaveCurrent;
}

function cumulative(save: SaveCurrent): number {
  return xpTotal(save.player.level) + save.player.experience;
}

function expectSameRewards(actual: SaveCurrent, expected: SaveCurrent): void {
  expect(actual.player).toEqual(expected.player);
  expect(actual.inventory).toEqual(expected.inventory);
}

async function expectConversationTargets(page: Page): Promise<void> {
  for (const id of ['town-conversation-close', 'town-conversation-quests']) {
    const target = page.getByTestId(id);
    const box = await target.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`real Den clear then town return requires one explicit reward claim and persists ${locale} @responsive`, async ({ page }) => {
    const english = locale === 'en';
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'Town return wiring' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const original = await exportBackup(page);
    // Only attack/defense/life change. Quest flags, combo, XP, items and points remain ordinary.
    const imported: SaveCurrent = {
      ...original,
      player: { ...original.player, derivedStats: {
        ...original.player.derivedStats, attack: 100_000, defense: 100_000,
        life: 1_000_000, lifeMax: 1_000_000
      } }
    };
    const importLabel = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(imported));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);

    await navTo(page, 'town');
    const akara = page.getByRole('button', { name: english ? 'Akara' : '阿卡拉', exact: true });
    await akara.click();
    await expect(akara).toBeFocused();
    await expect(page.getByRole('region', { name: english ? 'Akara' : '阿卡拉', exact: true })).toBeVisible();
    await expect(page.getByTestId('town-npc-warriv')).toBeVisible();
    await expect(page.getByTestId('town-greeting')).toContainText(english ? 'Track the Den of Evil in Quests' : '请到任务中追踪邪恶巢穴');
    await expectConversationTargets(page);
    await page.getByTestId('town-conversation-close').click();
    await expect(akara).toBeFocused();
    const untracked = await exportBackup(page);
    expect(untracked.map.questProgress[QUEST]).toBeUndefined();
    expectSameRewards(untracked, imported);

    await navTo(page, 'quests');
    await page.getByTestId(`quest-start-${QUEST}`).click();
    await navTo(page, 'town');
    await akara.click();
    await expect(page.getByTestId('town-greeting')).toContainText(english ? 'Slay them all, then return to me.' : '消灭每一只怪物，再回来找我。');
    const tracked = await exportBackup(page);
    expect(tracked.map.questProgress[QUEST]).toEqual({
      id: QUEST, status: 'inProgress', objectives: { 'obj-clear-den': false, 'obj-return': false }
    });
    expectSameRewards(tracked, imported);

    await navTo(page, 'map');
    // Freeze timer transport; the real encounter plan and ordinary Skip controls resolve combat.
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await page.getByTestId('sub-area-row-a1-den-of-evil')
      .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
    const counter = page.getByTestId('wave-counter');
    await expect.poll(async () => Number((await counter.innerText()).match(/\d+/g)?.[1] ?? 0)).toBeGreaterThan(1);
    const count = (await counter.innerText()).match(/\d+/g);
    if (count?.length !== 2) throw new Error('Missing real wave counter');
    const total = Number(count[1]);
    for (let wave = 1; wave <= total; wave++) {
      await expect(counter).toContainText(english ? `Wave ${String(wave)} / ${String(total)}` : `第 ${String(wave)} 波 / 共 ${String(total)} 波`);
      await page.getByTestId('skip-button').click();
      await page.clock.runFor(1600);
    }
    await expect(page.getByTestId('victory-panel')).toBeVisible();
    await expect(page.getByTestId('defeat-panel')).toHaveCount(0);
    await page.getByTestId('return-to-map').click();
    await expect(page.getByTestId('cleared-badge-a1-den-of-evil')).toBeVisible();
    const cleared = await exportBackup(page);
    expect(cleared.map.clearedSubAreas.filter((area) => area === AREA)).toEqual([AREA]);
    expect(cleared.map.questProgress[QUEST]).toEqual({
      id: QUEST, status: 'inProgress', objectives: { 'obj-clear-den': true, 'obj-return': false }
    });
    // Separate combat XP and automatic level-up points from the later quest reward.
    const combatXp = cumulative(cleared) - cumulative(tracked);
    expect(combatXp).toBeGreaterThan(0);
    const combat = awardXp(cumulative(tracked), combatXp);
    expect(cleared.player.level).toBe(combat.level);
    expect(cleared.player.statPoints).toBe(tracked.player.statPoints + combat.statPointsGranted);
    expect(cleared.player.skillPoints).toBe(tracked.player.skillPoints + combat.skillPointsGranted);

    await navTo(page, 'town');
    await page.getByTestId('town-npc-charsi').click();
    const wrong = await exportBackup(page);
    expect(wrong.map).toEqual(cleared.map);
    expectSameRewards(wrong, cleared);
    await navTo(page, 'town');
    await akara.click();
    await expect(page.getByTestId('town-greeting')).toContainText(english ? 'Claim your reward in Quests.' : '请到任务中领取应得的奖励。');
    await expectConversationTargets(page);
    const completed = await exportBackup(page);
    expect(completed.map.questProgress[QUEST]).toEqual({
      id: QUEST, status: 'completed', objectives: { 'obj-clear-den': true, 'obj-return': true }
    });
    expectSameRewards(completed, cleared);

    await navTo(page, 'town');
    await akara.click();
    await page.getByTestId('town-conversation-quests').click();
    await expect(page).toHaveURL(/\/quests$/);
    const claim = page.getByTestId(`quest-claim-${QUEST}`);
    await expect(claim).toBeEnabled();
    await claim.click();
    await expect(claim).toBeDisabled();
    const claimed = await exportBackup(page);
    const questAward = awardXp(cumulative(completed), 500);
    expect(cumulative(claimed)).toBe(cumulative(completed) + 500);
    expect(claimed.player.level).toBe(questAward.level);
    expect(claimed.player.experience).toBe(questAward.totalXp - xpTotal(questAward.level));
    expect(claimed.player.statPoints).toBe(completed.player.statPoints + questAward.statPointsGranted);
    expect(claimed.player.skillPoints).toBe(completed.player.skillPoints + questAward.skillPointsGranted + 1);
    expect(claimed.inventory).toEqual(completed.inventory);
    expect(claimed.map.questProgress[QUEST]).toEqual({
      id: QUEST, status: 'completed', objectives: { 'obj-clear-den': true, 'obj-return': true }, rewardClaimed: true
    });

    await navTo(page, 'town');
    await akara.click();
    await expect(page.getByTestId('town-greeting')).toContainText(english ? 'May your new strength guard the camp.' : '愿你的新力量守护营地。');
    await page.getByTestId('town-conversation-quests').click();
    await expect(claim).toBeDisabled();
    const repeated = await exportBackup(page);
    expectSameRewards(repeated, claimed);
    expect(repeated.map).toEqual(claimed.map);
    const saveLabel = english ? 'Save' : '保存';
    await page.getByRole('button', { name: saveLabel, exact: true }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: saveLabel, exact: true })).toBeVisible();
    const restored = await exportBackup(page);
    expect(restored.map).toEqual(claimed.map);
    expectSameRewards(restored, claimed);
    await navTo(page, 'quests');
    await expect(claim).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

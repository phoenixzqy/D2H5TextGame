/** Constructed encounter graphs exercise accounting, never earned campaign provenance. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { constructActFourPrefix, fixtureSave } from './act4-fixture';
import { auditCampaignQuests } from './quest-audit';
import * as nativeActions from '@/features/quests/questActions';

const fallen = 'quests/act4-fallen-angel', forge = 'quests/act4-hellforge', terror = 'quests/act4-terrors-end';
const hammer = `${forge}#objective:obj-kill-hephasto`, stone = 'quests/act3-guardian#reward:questItem';
const shatter = `${forge}#action:shatter-soulstone`, izual = `${fallen}#action:izual-victory`;
const river = 'areas/act4-river-of-flame', chaos = 'areas/act4-chaos-sanctuary';
let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });
type Stop = 'izual' | 'fallen-claim' | 'hephasto' | 'hammer' | 'shatter' | 'forge-claim' |
  'seal1' | 'seal2' | 'seals' | 'diablo' | 'claim';
function fixture(stop: Stop = 'claim') {
  const f = constructActFourPrefix();
  const result = () => ({ ...f, terminal: fixtureSave(),
    options: { act3Start: f.act3Start, act4Start: f.act4Start, settlements: f.settlements } });
  f.actions.start(fallen); f.actions.start(forge); f.actions.start(terror);
  f.enter(4, 'areas/act4-plains-of-despair'); if (stop === 'izual') return result();
  f.actions.claim(fallen); if (stop === 'fallen-claim') return result();
  f.enter(4, river); if (stop === 'hephasto') return result();
  f.actions.visit(river, 4); f.actions.recover(hammer); if (stop === 'hammer') return result();
  f.actions.execute(shatter); if (stop === 'shatter') return result();
  f.actions.claim(forge); if (stop === 'forge-claim') return result();
  f.actions.visit(chaos, 4);
  for (let index = 1; index <= 3; index++) {
    f.actions.interact(`objects/diablo_seal_${String(index)}`);
    if (stop === `seal${String(index)}` || stop === 'seals' && index === 3) return result();
  }
  f.enter(4, chaos); if (stop === 'diablo') return result();
  f.actions.claim(terror); return result();
}
const audit = (f: ReturnType<typeof fixture>) =>
  auditCampaignQuests(f.initial, f.terminal, f.actions.entries, f.prefixClaims, f.options);

it.each(['izual', 'fallen-claim', 'hephasto', 'hammer', 'shatter', 'forge-claim', 'seal1', 'seal2', 'seals',
  'diablo', 'claim'] as const)('reconciles native actions and the constructed partial %s graph', stop => {
  const f = fixture(stop), result = audit(f);
  expect(result).toMatchObject({ councilProofs: 1, guardianCompletions: 1, izualProofs: 1,
    hephastoProofs: ['izual', 'fallen-claim'].includes(stop) ? 0 : 1,
    diabloProofs: ['diablo', 'claim'].includes(stop) ? 1 : 0,
    explicitSkillPoints: stop === 'izual' ? 2 : 4, explicitStatPoints: 0 });
  expect(f.act3Start).toBe(21); expect(f.act4Start).toBe(32);
});

it.each(['stone', 'hammer', 'receipt', 'progress', 'point', 'boundary'] as const)(
  'rejects unaccounted terminal Act IV %s corruption', fault => {
    const f = fixture();
    if (fault === 'stone' || fault === 'hammer') {
      const source = fault === 'stone' ? stone : hammer, item = f.terminal.inventory.questItems[source]; assert.ok(item);
      f.terminal = { ...f.terminal, inventory: { ...f.terminal.inventory, questItems: {
        ...f.terminal.inventory.questItems, [source]: { ...item, state: 'owned' } } } };
    }
    if (fault === 'receipt') {
      const receipts = { ...f.terminal.map.questReceipts }; Reflect.deleteProperty(receipts, izual);
      f.terminal = { ...f.terminal, map: { ...f.terminal.map, questReceipts: receipts } };
    }
    if (fault === 'progress') {
      const row = f.terminal.map.questProgress[terror]; assert.ok(row);
      f.terminal = { ...f.terminal, map: { ...f.terminal.map, questProgress: { ...f.terminal.map.questProgress,
        [terror]: { ...row, objectives: { ...row.objectives, 'obj-seal-2': false } } } } };
    }
    if (fault === 'point') f.terminal = { ...f.terminal,
      player: { ...f.terminal.player, skillPoints: f.terminal.player.skillPoints + 1 } };
    if (fault === 'boundary') f.options.act4Start--;
    expect(() => audit(f)).toThrow();
  });

it.each(['wrong-area', 'nonwin', 'missing-proof', 'early-diablo', 'combat-item', 'unrelated-proof'] as const)(
  'rejects corrupted constructed Act IV settlement evidence: %s', fault => {
    const f = fixture(), index = f.settlements.findIndex(row => row.act === 4 && row.area === chaos);
    const event = f.settlements[index]; assert.ok(event);
    if (fault === 'wrong-area') f.settlements[index] = { ...event, area: river };
    if (fault === 'nonwin') f.settlements[index] = { ...event, winner: 'enemy', advance: 'defeat' };
    if (fault === 'missing-proof') f.settlements.splice(index, 1);
    if (fault === 'early-diablo') {
      const row = event.before.progress[terror]; assert.ok(row);
      f.settlements[index] = { ...event, before: { ...event.before, progress: { ...event.before.progress,
        [terror]: { ...row, objectives: { ...row.objectives, 'obj-seal-3': false } } } } };
    }
    if (fault === 'combat-item') f.settlements[index] = { ...event, after: { ...event.after,
      items: { ...event.after.items, [stone]: { itemId: 'items/soulstone_mephisto', state: 'owned' } } } };
    if (fault === 'unrelated-proof') f.settlements[index] = { ...event, after: { ...event.after,
      receipts: { ...event.after.receipts, 'quests/act4-wrong#action:wrong': true } } };
    expect(() => audit(f)).toThrow();
  });

it('retains a bounded native Shatter commit followed by a throw, without continuing', () => {
  const f = fixture('hammer'), execute = nativeActions.executeQuestAction;
  const failure = new Error('Constructed postcommit Shatter failure');
  vi.spyOn(nativeActions, 'executeQuestAction').mockImplementation(source => {
    expect(execute(source)).toBe('ok'); throw failure;
  });
  expect(() => { f.actions.execute(shatter); }).toThrow(failure);
  f.terminal = fixtureSave();
  expect(audit(f)).toMatchObject({ exceptions: 1, explicitSkillPoints: 4, hephastoProofs: 1 });
  expect(f.terminal.inventory.questItems[stone]?.state).toBe('consumed');
});

it.each(['unrelated-receipt', 'unrelated-progress', 'combat-continuation'] as const)(
  'rejects %s after an exceptional Shatter entry', fault => {
    const f = fixture('shatter'), index = f.actions.entries.length - 1, entry = f.actions.entries[index]; assert.ok(entry);
    const after = structuredClone(entry.after);
    if (fault === 'unrelated-receipt') after.receipts = { ...after.receipts, 'quests/act4-wrong#action:wrong': true };
    if (fault === 'unrelated-progress') after.progress = { ...after.progress,
      [terror]: { id: terror, status: 'completed', objectives: { 'obj-kill-diablo': true } } };
    f.actions.entries[index] = { ...entry, result: 'threw', after };
    f.terminal = { ...f.terminal, map: { ...f.terminal.map, questReceipts: after.receipts, questProgress: after.progress } };
    if (fault === 'combat-continuation') {
      f.settlements.push({ act: 4, area: chaos, ordinal: 100, index: 0, actionIndex: f.actions.entries.length,
        nativeReturned: false, winner: null, heroLife: null, advance: null,
        before: { items: after.items, progress: after.progress, receipts: after.receipts },
        after: { items: after.items, progress: after.progress, receipts: after.receipts } });
    }
    expect(() => audit(f)).toThrow();
  });

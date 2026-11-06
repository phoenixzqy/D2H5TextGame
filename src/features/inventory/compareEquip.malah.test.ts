import { describe, expect, it } from 'vitest';
import { compareEquip } from './compareEquip';
import { composeEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { deriveStats } from '@/engine/progression/stats';
import type { Item } from '@/engine/types/items';
import type { QuestItemLedger } from '@/engine/types/save';

const QUEST = 'quests/side-act5-malahs-elixir';
const progress = { [QUEST]: { id: QUEST, status: 'completed' as const, rewardClaimed: true,
  objectives: { 'obj-collect': true } } };
const items: QuestItemLedger = Object.fromEntries(Array.from({ length: 5 }, (_, i) =>
  [`${QUEST}#objective:obj-collect:source:lichen-${String(i + 1)}`, { itemId: 'quest/frost_lichen', state: 'consumed' as const }]));
const candidate: Item = { id: 'vitality-cap', baseId: 'items/base/helm-cap', rarity: 'rare', level: 1,
  identified: true, equipped: false, affixes: [{ affixId: 'fixture-vit', values: new Map([['coreStats.vitality', 2]]) }] };

describe('Malah equipment comparison uses the shared post-cap composition', () => {
  it.each([[199,3],[500,0]])('projects an actual candidate at raw%s with Life delta%s', (vitality, delta) => {
    const coreStats = { strength: 10, dexterity: 25, vitality, energy: 63 };
    const owner = { level: 13, coreStats, derivedStats: { ...deriveStats(coreStats, 13), life: 13, mana: 17 } };
    const before = structuredClone({ owner, candidate, progress, items });
    const comparison = compareEquip(owner, candidate, 'head', {}, undefined, progress, items);
    const current = composeEquippedPlayerStats(owner, 13, {}, progress, items);
    const proposed = composeEquippedPlayerStats(owner, 13, { head: candidate }, progress, items);
    expect(comparison.stats.lifeMax).toEqual({ current: current.derivedStats.lifeMax,
      candidate: proposed.derivedStats.lifeMax, delta });
    expect(proposed.vitality.elixir).toBe(10); expect(proposed.derivedStats.life).toBe(13);
    expect({ owner, candidate, progress, items }).toEqual(before);
  });
});

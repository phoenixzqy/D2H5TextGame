import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { composeEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { xpRequired } from '@/engine/progression/xp';
import { usePlayerStore } from './playerStore';
import { useMapStore } from './mapStore';
import { useInventoryStore } from './inventoryStore';

const QUEST = 'quests/side-act5-malahs-elixir';
function player(): Player { const hero = usePlayerStore.getState().player; if (!hero) throw new Error('Missing fixture hero'); return hero; }
function view() { return composeEquippedPlayerStats(player(), player().level, useInventoryStore.getState().equipped,
  useMapStore.getState().questProgress, useInventoryStore.getState().questItems, useMapStore.getState().questReceipts); }
const stores = [usePlayerStore, useInventoryStore, useMapStore] as const;
beforeEach(() => {
  for (const store of stores) store.getState().reset();
  const fresh = createMockPlayer('Malah', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 13, statPoints: 8,
    coreStats: { ...fresh.coreStats, vitality: 199 }, derivedStats: { ...fresh.derivedStats, life: 13, mana: 17 } });
  useMapStore.setState({ questProgress: { [QUEST]: { id: QUEST, status: 'completed', rewardClaimed: true,
    objectives: { 'obj-collect': true } } } });
  useInventoryStore.setState({ questItems: Object.fromEntries(Array.from({ length: 5 }, (_, i) =>
    [`${QUEST}#objective:obj-collect:source:lichen-${String(i + 1)}`, { itemId: 'quest/frost_lichen', state: 'consumed' as const }])) });
  usePlayerStore.getState().recomputeDerived({});
});
afterEach(() => { for (const store of stores) store.getState().reset(); });

describe('Malah progression through public hero actions', () => {
  it('uses shared projection for legacy public levelUp without healing or changing raw investment', () => {
    const before = player(), capacity = before.derivedStats.lifeMax;
    usePlayerStore.getState().levelUp();
    expect(player()).toMatchObject({ level: 14, statPoints: 13,
      derivedStats: { life: 13, mana: 17, lifeMax: capacity + 8 } });
    expect(player().coreStats).toBe(before.coreStats); expect(player().derivedStats).toEqual(view().derivedStats);
  });

  it('keeps post-cap bonus separate during actual allocation, preview, ordinary XP and repeated recomposition', () => {
    const before = player(), draft = { strength: 0, dexterity: 0, vitality: 2, energy: 0 };
    const preview = composeEquippedPlayerStats({ ...before, coreStats: { ...before.coreStats, vitality: 201 } },
      before.level, {}, useMapStore.getState().questProgress, useInventoryStore.getState().questItems);
    expect(usePlayerStore.getState().allocateStatPoints(draft, before)).toBe('ok');
    expect(player().derivedStats).toEqual(preview.derivedStats);
    expect(view().vitality).toMatchObject({ raw: 201, ordinaryContribution: 200.5, elixir: 10, formula: 210.5 });
    expect(player().statPoints).toBe(6);
    const allocated = player();
    usePlayerStore.getState().gainExperience(1);
    expect(player().derivedStats).toEqual(allocated.derivedStats);
    for (let i = 0; i < 3; i++) usePlayerStore.getState().recomputeDerived({});
    expect(player().derivedStats).toEqual(allocated.derivedStats);
    expect(player().coreStats).toEqual(allocated.coreStats);
    expect(player().derivedStats.life).toBe(13); expect(player().derivedStats.mana).toBe(17);
  });

  it('keeps the raw allocation cap500 independently of effective sheet510', () => {
    const old = player();
    usePlayerStore.setState({ player: { ...old, coreStats: { ...old.coreStats, vitality: 499 } } });
    usePlayerStore.getState().recomputeDerived({});
    usePlayerStore.getState().allocateStatPoint('vitality');
    expect(view().vitality).toMatchObject({ raw: 500, sheet: 510, formula: 360 });
    const capped = player();
    usePlayerStore.getState().allocateStatPoint('vitality');
    expect(player()).toBe(capped);
    expect(usePlayerStore.getState().allocateStatPoints({ strength: 0, dexterity: 0, vitality: 1, energy: 0 }, capped)).toBe('stat-cap');
  });

  it('uses actual equipment and XP level changes without changing the allocated source or healing', () => {
    const original = player(), capacity = original.derivedStats.lifeMax;
    const cap: Item = { id: 'real-equipped-malah-cap', baseId: 'items/base/helm-cap', rarity: 'rare', level: 1,
      identified: true, equipped: false, affixes: [{ affixId: 'fixture-vit', values: new Map([['coreStats.vitality', 2]]) }] };
    useInventoryStore.getState().addItem(cap);
    expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
    expect(view().vitality).toMatchObject({ raw: 199, equipment: 2, formula: 210.5 });
    expect(player().derivedStats).toMatchObject({ lifeMax: capacity + 3, life: 13, mana: 17 });
    const beforeXp = player();
    expect(usePlayerStore.getState().gainExperience(xpRequired(beforeXp.level)).levelsGained).toBe(1);
    expect(player().derivedStats).toMatchObject({ lifeMax: capacity + 3 + 8, life: 13, mana: 17 });
    expect(player().coreStats).toBe(original.coreStats);
    expect(useInventoryStore.getState().unequipItem('head')).toEqual({ ok: true });
    expect(player().derivedStats).toEqual(view().derivedStats);
    expect(player().derivedStats).toMatchObject({ lifeMax: capacity + 8, life: 13, mana: 17 });
    expect(view().vitality).toMatchObject({ raw: 199, equipment: 0, formula: 209 });
  });
});

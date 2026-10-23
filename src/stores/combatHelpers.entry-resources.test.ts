import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as combatEngine from '@/engine/combat/combat';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import type { Mercenary } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, advanceWaveOrFinish, hasActiveSubAreaRun,
  playerToCombatUnit, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';

const stores = [useCombatStore, usePlayerStore, useInventoryStore,
  useMercStore, useMapStore, useFormationStore] as const;
const options = { subAreaId: 'areas/act1-blood-moor', act: 1, runSeed: 7, challengeOrdinal: 0 };

function arrange(life = 5, mana = 7): void {
  const fresh = createMockPlayer('Entry resources', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 12, comboOrder: [],
    coreStats: { ...fresh.coreStats, vitality: 50, energy: 40 },
    derivedStats: { ...fresh.derivedStats, life, mana } });
  const cap: Item = { id: 'entry-resource-cap', baseId: 'items/base/helm-cap',
    rarity: 'rare', level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'fixture-entry', values: new Map([
      ['statMods.life', 50], ['statMods.mana', 35]
    ]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  const merc: Mercenary = { ...fresh, id: 'entry-merc', type: 'mercenary',
    archetype: 'back', rarity: 'R', equipment: [], comboOrder: [],
    derivedStats: { ...fresh.derivedStats, life: 1, mana: 0 } };
  useMercStore.setState({ ownedMercs: [merc], fieldedMercId: merc.id });
}

function persistentState() {
  return structuredClone({ player: usePlayerStore.getState().player,
    inventory: { backpack: useInventoryStore.getState().backpack,
      equipped: useInventoryStore.getState().equipped,
      currencies: useInventoryStore.getState().currencies },
    mercs: useMercStore.getState().ownedMercs });
}

function drain(): void {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}

beforeEach(() => {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792497600000);
});
afterEach(() => {
  vi.restoreAllMocks();
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('idle');
  resetRegistry(); loadDefaultSkills();
});

describe('new challenge resource entry (BUG-088)', () => {
  it.each(['manual', 'idle'] as const)('starts %s with current equipped maxima without healing the save', mode => {
    arrange();
    const before = persistentState();
    expect(startSubAreaRun({ ...options, mode })).not.toBeNull();
    const [hero, merc] = useCombatStore.getState().playerTeam;
    // combat-formulas §2.1, including L12, Vit50/Eng40 and +50/+35 gear.
    expect(hero?.stats.lifeMax).toBe(338);
    expect(hero?.stats.manaMax).toBe(189);
    expect.soft(hero?.life).toBe(338);
    expect.soft(hero?.mana).toBe(189);
    expect(hero?.manaRegenCarry).toBe(0);
    expect(hero?.manaRegenCompensation).toBe(0);
    expect(hero?.manaRegenExactCarry).toBe('0');
    expect(merc?.life).toBe(merc?.stats.lifeMax);
    expect(merc?.mana).toBe(merc?.stats.manaMax);
    expect(persistentState()).toEqual(before);
  });

  it.each([0, -10])('starts a fresh challenge alive with a saved pool of %s', pool => {
    arrange(pool, pool);
    expect(startSubAreaRun(options)).not.toBeNull();
    const hero = useCombatStore.getState().playerTeam[0];
    expect.soft(hero?.life).toBe(338);
    expect.soft(hero?.mana).toBe(189);
  });

  it('keeps the default adapter depleted and clamps above-max saved pools', () => {
    arrange();
    const player = usePlayerStore.getState().player;
    if (!player) throw new Error('Missing adapter control');
    const unit = playerToCombatUnit(player);
    expect([unit.life, unit.mana]).toEqual([5, 7]);
    const high = playerToCombatUnit({ ...player, derivedStats: {
      ...player.derivedStats, life: 9999, mana: 9999 } });
    expect([high.life, high.mana]).toEqual([338, 189]);
  });

  it('does not persist an entry heal after rejected staging, and fills a later successful start', () => {
    arrange();
    const before = persistentState();
    const fault = new Error('entry recording rejected');
    vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementationOnce(() => { throw fault; });
    expect(() => startSubAreaRun(options)).toThrow(fault);
    expect(hasActiveSubAreaRun()).toBe(false);
    expect(persistentState()).toEqual(before);
    expect(startSubAreaRun(options)).not.toBeNull();
    expect.soft(useCombatStore.getState().playerTeam[0]?.life).toBe(338);
    expect.soft(useCombatStore.getState().playerTeam[0]?.mana).toBe(189);
    expect(persistentState()).toEqual(before);
  });

  it('carries actually spent mana into the next wave and replays that depleted input exactly', () => {
    arrange();
    registerSkill({ id: 'fixture.entry-finisher', archetype: 'fixture', target: 'all-enemies',
      cooldown: 1, manaCost: 80, minLevel: 1,
      effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
    const player = usePlayerStore.getState().player;
    if (!player) throw new Error('Missing carry control');
    usePlayerStore.getState().setPlayer({ ...player, comboOrder: ['fixture.entry-finisher'] });
    expect(startSubAreaRun(options)?.totalWaves).toBeGreaterThan(1);
    const first = useCombatStore.getState();
    expect(first.outcome?.winner).toBe('player');
    expect(first.recordedEvents.some(event => event.kind === 'mana' && event.reason === 'cast')).toBe(true);
    const finalHero = first.outcome?.finalPlayerTeam.find(unit => unit.id === player.id);
    if (!finalHero) throw new Error('Missing earned first-wave output');
    expect(finalHero.mana).toBeLessThan(189);
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const second = useCombatStore.getState();
    expect(second.playerTeam[0]?.mana).toBe(finalHero.mana);
    expect(second.playerTeam[0]?.life).toBe(finalHero.life);
    const original = structuredClone({ team: second.playerTeam, events: second.recordedEvents,
      outcome: second.outcome, rewards: second.runRewards });
    drain();
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    const replay = useCombatStore.getState();
    expect({ team: replay.playerTeam, events: replay.recordedEvents,
      outcome: replay.outcome, rewards: replay.runRewards }).toEqual(original);
  });
});

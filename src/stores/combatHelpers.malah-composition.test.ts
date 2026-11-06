import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { composeEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { deriveEquippedMercStats } from '@/engine/progression/merc-equipment-stats';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { Mercenary } from '@/engine/types/entities';
import { composeStatAura } from '@/engine/skills/stat-auras';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { abortSubAreaRun, advanceWaveOrFinish, playerToCombatUnit, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useCombatStore } from './combatStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';

const QUEST = 'quests/side-act5-malahs-elixir';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useCombatStore, useMercStore, useFormationStore] as const;
function player() { const hero = usePlayerStore.getState().player; if (!hero) throw new Error('Missing fixture hero'); return hero; }
function arrange(kind: 'sorceress' | 'paladin' | 'druid' = 'sorceress') {
  const fresh = createMockPlayer('Malah battle', kind);
  usePlayerStore.getState().setPlayer({ ...fresh, level: 30, comboOrder: [],
    coreStats: { ...fresh.coreStats, vitality: 500 }, derivedStats: { ...fresh.derivedStats, life: 13, mana: 17 } });
  useMapStore.setState({ questProgress: { [QUEST]: { id: QUEST, status: 'completed', rewardClaimed: true,
    objectives: { 'obj-collect': true } } } });
  useInventoryStore.setState({ questItems: Object.fromEntries(Array.from({ length: 5 }, (_, i) =>
    [`${QUEST}#objective:obj-collect:source:lichen-${String(i + 1)}`, { itemId: 'quest/frost_lichen', state: 'consumed' as const }])) });
  usePlayerStore.getState().recomputeDerived({});
}
function target(base: CombatUnit): CombatUnit {
  return { id: 'target', name: 'Target', side: 'enemy', kind: 'monster', level: 30, tier: 'trash',
    life: 99999, mana: 0, stats: { ...base.stats, lifeMax: 99999 },
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }], cooldowns: {},
    activeBuffIds: [], skillOrder: [], enraged: false };
}
function drain() { for (let i = 0, count = useCombatStore.getState().recordedEvents.length; i < count; i++) useCombatStore.getState().advanceEvent(); }
beforeEach(() => { abortSubAreaRun(); for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { abortSubAreaRun(); for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills(); });

describe('Malah native battle composition', () => {
  it('uses the same base at entry while keeping the bonus hero-only and saved pools damaged', () => {
    arrange();
    const hero = player(), unit = playerToCombatUnit(hero);
    const composition = composeEquippedPlayerStats(hero, 30, {}, useMapStore.getState().questProgress,
      useInventoryStore.getState().questItems);
    expect(unit.stats.lifeMax).toBe(composition.derivedStats.lifeMax);
    expect(unit.life).toBe(13); expect(unit.mana).toBe(17);
    const merc: Mercenary = { ...hero, id: 'merc', type: 'mercenary', archetype: 'back', rarity: 'R', equipment: [] };
    // Its saved bare baseline has no entitlement; quest authority never enters the merc formula.
    const bare = createMockPlayer('Merc baseline', 'sorceress');
    const control = { ...merc, coreStats: bare.coreStats, derivedStats: { ...bare.derivedStats, life: 7 } };
    expect(deriveEquippedMercStats(control, {})).toEqual(control.derivedStats);
    expect(usePlayerStore.getState().player).toBe(hero);
  });

  it('applies native Vigor after the new shared base without persisting or compounding the aura', () => {
    arrange('paladin');
    usePlayerStore.setState({ player: { ...player(), skillLevels: { 'paladin.vigor': 1 }, selectedAuraId: 'paladin.vigor' } });
    const hero = player(), unit = playerToCombatUnit(hero), base = unit.stats.lifeMax;
    const statAura = composeStatAura(hero); if (!statAura) throw new Error('Missing actual Vigor projection');
    const scene = { seed: 7, playerTeam: [unit], enemyTeam: [target(unit)], statAura, maxRounds: 1 };
    const out = runBattleRecorded(scene), final = out.result.playerTeam[0];
    expect(final?.stats.lifeMax).toBe(base + Math.floor(base * .02));
    expect(final?.life).toBe(13);
    expect(runBattleRecorded({ ...scene, playerTeam: out.result.playerTeam }).result.playerTeam[0]?.stats.lifeMax).toBe(final?.stats.lifeMax);
    expect(player().derivedStats).toEqual(hero.derivedStats); expect(player().derivedStats.lifeMax).toBe(base);
  });

  it('applies a real paid Werewolf form after the shared base without healing or compounding it', () => {
    arrange('druid');
    usePlayerStore.setState({ player: { ...player(), comboOrder: ['druid.werewolf'],
      skillLevels: { 'druid.werewolf': 1, 'druid.lycanthropy': 1 } } });
    const hero = player(), unit = playerToCombatUnit(hero), base = unit.stats.lifeMax;
    const scene = { seed: 7, playerTeam: [unit], enemyTeam: [target(unit)], maxRounds: 1 };
    const out = runBattleRecorded(scene), final = out.result.playerTeam[0];
    expect(out.events.some(event => event.kind === 'action' && event.skillId === 'druid.werewolf')).toBe(true);
    expect(final?.stats.lifeMax).toBe(base + Math.floor(base * .03));
    expect(final?.life).toBe(13);
    expect(runBattleRecorded({ ...scene, playerTeam: out.result.playerTeam }).result.playerTeam[0]?.stats.lifeMax).toBe(final?.stats.lifeMax);
    expect(player()).toBe(hero); expect(player().derivedStats.lifeMax).toBe(base);
  });

  it('keeps fresh shared capacity and actual pools across a native wave and original-input replay', () => {
    arrange();
    registerSkill({ id: 'fixture.malah-finisher', archetype: 'fixture', target: 'all-enemies', cooldown: 1,
      manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [100000,100000] }] });
    usePlayerStore.setState({ player: { ...player(), comboOrder: ['fixture.malah-finisher'] } });
    const saved = player(), base = playerToCombatUnit(saved).stats.lifeMax;
    expect(startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', act: 1, runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(1);
    const first = useCombatStore.getState(), final = first.outcome?.finalPlayerTeam.find(unit => unit.id === saved.id);
    if (!final) throw new Error('Missing first-wave result');
    expect(final.stats.lifeMax).toBe(base); drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    const second = useCombatStore.getState(), carried = second.playerTeam.find(unit => unit.id === saved.id);
    expect(carried).toMatchObject({ life: final.life, mana: final.mana, stats: { lifeMax: base } });
    const original = structuredClone({ team: second.playerTeam, events: second.recordedEvents, outcome: second.outcome });
    drain(); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    const replay = useCombatStore.getState();
    expect({ team: replay.playerTeam, events: replay.recordedEvents, outcome: replay.outcome }).toEqual(original);
    expect(player().derivedStats).toMatchObject({ lifeMax: base, life: 13, mana: 17 });
  });
});

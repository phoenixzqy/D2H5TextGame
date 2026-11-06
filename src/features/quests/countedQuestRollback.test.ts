import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadCountedQuestItems } from '@/data/loaders/counted-quest-items';
import { loadMercPool } from '@/data/loaders/mercs';
import type { Item } from '@/engine/types/items';
import { awardXp, xpRequired, xpTotal } from '@/engine/progression/xp';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { createMercFromDef } from '@/stores/mercFactory';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { claimQuestReward } from './claimReward';

const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing counted physical fixture'); return value; }
function gear(id: string): Item { return { id, baseId: 'items/base/wp1h-short-sword', rarity: 'magic', level: 1, identified: true,
  equipped: false, affixes: [{ affixId: 'legacy-map', values: new Map([['statMods.life', 7]]) }] }; }
function prepare(key: 'alkor' | 'jade' | 'jamella' | 'malah' = 'alkor') {
  const d = required(loadCountedQuestItems().find(row => row.key === key));
  useMapStore.setState({ questProgress: { [d.quest]: { id: d.quest, status: 'completed', rewardClaimed: false, objectives: { [d.objective]: true } } } });
  useInventoryStore.setState({ questItems: Object.fromEntries(d.sources.map(source => [source, { itemId: d.itemId, state: key === 'jade' ? 'consumed' : 'owned' }])) });
  const def = required(loadMercPool().pool.find(row => row.id === 'mercs/act2-blessed-aim'));
  const blade = { ...gear('recipient-blade'), equipped: true, equipSlot: 'weapon' as const };
  const chosen = { ...createMercFromDef(def, 'chosen'), equipment: [blade] }, other = createMercFromDef(def, 'other');
  useMercStore.setState({ ownedMercs: [other, chosen], fieldedMercId: chosen.id, mercEquipment: { [other.id]: {}, [chosen.id]: { weapon: blade } },
    mercProgress: { [other.id]: { experience: 9, experienceToNextLevel: 100000 }, [chosen.id]: { experience: 13, experienceToNextLevel: 100000 } } });
  return { d, chosen, other, blade };
}
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); }); useHydrationStore.getState().setStatus('ready');
  const hero = createMockPlayer('Counted rollback', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, derivedStats: { ...hero.derivedStats, life: 3, mana: 2 } });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); });

describe('counted Claim actual-recipient and scoped restoration', () => {
  it.each(['stash', 'hero', 'other-merc', 'orphan-map', 'legacy', 'socket'] as const)('conserves actual XP-recipient Map gear moved to %s once', destination => {
    const { d, chosen, other, blade } = prepare(), beforeBlade = structuredClone(blade); let fired = false;
    stops.push(useMercStore.subscribe(() => {
      if (fired) return; fired = true;
      useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.map(row => row.id === chosen.id ? { ...row, equipment: [] } : row),
        mercEquipment: { ...state.mercEquipment, [chosen.id]: {} } }));
      if (destination === 'stash') useInventoryStore.setState({ stash: [blade] });
      if (destination === 'hero') {
        useInventoryStore.setState({ equipped: { weapon: blade } });
        usePlayerStore.setState(state => ({ player: state.player && { ...state.player, equipment: [blade] } }));
      }
      if (destination === 'other-merc' || destination === 'orphan-map') useMercStore.setState(state => ({ mercEquipment: {
        ...state.mercEquipment, [destination === 'other-merc' ? other.id : 'orphan']: { weapon: blade }
      } }));
      if (destination === 'legacy') useInventoryStore.setState({ legacyGearQuarantine: [{ item: blade, origin: { container: 'backpack', index: 0 } }] });
      if (destination === 'socket') useInventoryStore.setState({ socketQuarantine: [{ sourceVersion: 18, item: blade, origin: { container: 'backpack', index: 0 } }] });
    }));
    expect(claimQuestReward(d.quest)).toBe('grant-failed');
    expect(useMercStore.getState().mercEquipment[chosen.id]?.weapon).toEqual(beforeBlade);
    expect(useMercStore.getState().getMercProgress(chosen.id).experience).toBe(13);
    expect(useMercStore.getState().getMercProgress(other.id).experience).toBe(9);
    expect(useInventoryStore.getState().stash).toEqual([]); expect(useInventoryStore.getState().equipped).toEqual({});
    expect(useInventoryStore.getState().legacyGearQuarantine).toEqual([]); expect(useInventoryStore.getState().socketQuarantine).toEqual([]);
    expect(useMercStore.getState().mercEquipment[other.id]).toEqual({}); expect(useMercStore.getState().mercEquipment.orphan ?? {}).toEqual({});
    expect(usePlayerStore.getState().player?.derivedStats.life).toBe(3);
    expect(useMapStore.getState().questProgress[d.quest]?.rewardClaimed).toBe(false);
  });
  it('preserves independent fielding and a fresh same-ID recipient replacement without crediting its progress', () => {
    const { d, chosen, other } = prepare(); const replacement = { ...structuredClone(chosen), equipment: [] }; let fired = false;
    stops.push(useMercStore.subscribe(() => {
      if (fired) return; fired = true;
      useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.map(row => row.id === chosen.id ? replacement : row),
        fieldedMercId: other.id, mercProgress: { ...state.mercProgress, [chosen.id]: { experience: 77, experienceToNextLevel: 100000 } } }));
    }));
    expect(claimQuestReward(d.quest)).toBe('grant-failed');
    expect(useMercStore.getState().ownedMercs.find(row => row.id === chosen.id)).toBe(replacement);
    expect(useMercStore.getState().getMercProgress(chosen.id).experience).toBe(77); expect(useMercStore.getState().fieldedMercId).toBe(other.id);
    expect(useInventoryStore.getState().backpack.filter(item => item.id === 'recipient-blade')).toHaveLength(1);
  });
  it('preserves a fresh hero replacement and restores only the counted sources', () => {
    const { d } = prepare(), replacement = createMockPlayer('Independent replacement', 'barbarian'); let fired = false;
    stops.push(usePlayerStore.subscribe(() => { if (fired) return; fired = true; usePlayerStore.setState({ player: replacement }); }));
    expect(claimQuestReward(d.quest)).toBe('grant-failed'); expect(usePlayerStore.getState().player).toBe(replacement);
    expect(useMapStore.getState().questProgress[d.quest]?.rewardClaimed).toBe(false);
    expect(Object.values(useInventoryStore.getState().questItems).every(item => item.state === 'owned')).toBe(true);
  });
  it.each([['xp', 11, 3], ['direct-reward', 11, 3], ['xp', 0, 0], ['direct-reward', 0, 0]] as const)('fences grant-dependent public allocations and preserves independent XP during %s with balances %s/%s, then retries once', (phase, statPoints, skillPoints) => {
    const { d } = prepare(); useMercStore.setState({ ownedMercs: [], mercEquipment: {}, mercProgress: {}, fieldedMercId: null });
    const hero = required(usePlayerStore.getState().player);
    usePlayerStore.setState({ player: { ...hero, statPoints, skillPoints } });
    const before = structuredClone(required(usePlayerStore.getState().player)); let publications = 0, fired = false;
    stops.push(usePlayerStore.subscribe(() => {
      if (fired || ++publications < (phase === 'xp' ? 1 : 2)) return; fired = true;
      const live = required(usePlayerStore.getState().player);
      expect(() => { usePlayerStore.getState().allocateStatPoint('vitality'); }).toThrow('questBusy');
      expect(() => usePlayerStore.getState().allocateStatPoints({ strength: 0, dexterity: 0, vitality: 1, energy: 0 }, live)).toThrow('questBusy');
      expect(() => usePlayerStore.getState().allocateSkillPoint('skills-sorceress-fire-bolt')).toThrow('questBusy');
      expect(usePlayerStore.getState().player).toBe(live);
      usePlayerStore.getState().addXP(2);
    }));
    expect(claimQuestReward(d.quest)).toBe('grant-failed'); expect(fired).toBe(true);
    const restored = required(usePlayerStore.getState().player);
    expect(restored.coreStats).toEqual(before.coreStats);
    expect(restored.statPoints).toBe(before.statPoints); expect(restored.skillPoints).toBe(before.skillPoints);
    expect(restored.skillLevels).toEqual(before.skillLevels);
    expect(xpTotal(restored.level) + restored.experience).toBe(xpTotal(before.level) + before.experience + 2);
    expect(restored.level).toBe(before.level); expect(restored.derivedStats.life).toBe(3); expect(restored.derivedStats.mana).toBe(2);
    expect(useMapStore.getState().questProgress[d.quest]?.rewardClaimed).toBe(false);
    expect(Object.values(useInventoryStore.getState().questItems).every(item => item.state === 'owned')).toBe(true);
    stops.splice(0).forEach(stop => { stop(); });
    expect(claimQuestReward(d.quest)).toBe('ok'); expect(claimQuestReward(d.quest)).toBe('already-claimed');
    const paid = required(usePlayerStore.getState().player);
    expect(xpTotal(paid.level) + paid.experience).toBe(xpTotal(before.level) + before.experience + 4502);
    expect(paid.statPoints).toBe(before.statPoints + (paid.level - before.level) * 5 + 5);
    expect(paid.skillPoints).toBe(before.skillPoints + paid.level - before.level);
    usePlayerStore.getState().allocateStatPoint('vitality');
    expect(usePlayerStore.getState().allocateSkillPoint('skills-sorceress-fire-bolt')).toBe('ok');
    const invested = required(usePlayerStore.getState().player);
    expect(invested.coreStats.vitality).toBe(before.coreStats.vitality + 1);
    expect(invested.statPoints).toBe(paid.statPoints - 1); expect(invested.skillPoints).toBe(paid.skillPoints - 1);
    expect(invested.skillLevels?.['sorceress.fire_bolt']).toBe((before.skillLevels?.['sorceress.fire_bolt'] ?? 0) + 1);
  });
  it.each(['addXP', 'gainExperience'] as const)('replays independent %s across a level boundary without retaining quest-generated progression', action => {
    const { d } = prepare(); useMercStore.setState({ ownedMercs: [], mercEquipment: {}, mercProgress: {}, fieldedMercId: null });
    const hero = required(usePlayerStore.getState().player);
    usePlayerStore.setState({ player: { ...hero, experience: xpRequired(hero.level) - 1, statPoints: 11, skillPoints: 3 } });
    const before = structuredClone(required(usePlayerStore.getState().player)); let fired = false;
    stops.push(usePlayerStore.subscribe(() => {
      if (fired) return; fired = true; usePlayerStore.getState()[action](2);
    }));
    expect(claimQuestReward(d.quest)).toBe('grant-failed');
    const restored = required(usePlayerStore.getState().player), growth = awardXp(xpTotal(before.level) + before.experience, 2);
    expect(xpTotal(restored.level) + restored.experience).toBe(xpTotal(before.level) + before.experience + 2);
    expect(restored.level).toBe(action === 'addXP' ? before.level : growth.level);
    expect(restored.statPoints).toBe(before.statPoints + (action === 'addXP' ? 0 : growth.statPointsGranted));
    expect(restored.skillPoints).toBe(before.skillPoints + (action === 'addXP' ? 0 : growth.skillPointsGranted));
    expect(restored.derivedStats.life).toBe(3); expect(restored.derivedStats.mana).toBe(2);
  });
  it('captures its own XP edge when an earlier subscriber publishes independent XP and then throws', () => {
    const { d } = prepare(); let fired = false;
    stops.push(usePlayerStore.subscribe(() => {
      if (fired) return; fired = true; usePlayerStore.getState().addXP(2); throw new Error('earlier subscriber');
    }));
    expect(claimQuestReward(d.quest)).toBe('grant-failed');
    expect(usePlayerStore.getState().player?.experience).toBe(2); expect(usePlayerStore.getState().player?.level).toBe(1);
  });
  it.each([false, true])('removes its own XP and preserves an in-place observer residual when the observer throws: %s', throws => {
    const { d } = prepare(); let fired = false;
    stops.push(usePlayerStore.subscribe(next => {
      if (fired) return; fired = true; const observed = required(next.player);
      Object.defineProperty(observed, 'experience', { value: observed.experience + 2, enumerable: true, configurable: true, writable: true });
      if (throws) throw new Error('in-place XP observer');
    }));
    expect(claimQuestReward(d.quest)).toBe('grant-failed');
    const restored = required(usePlayerStore.getState().player);
    expect(restored.level).toBe(1); expect(restored.experience).toBe(2);
    expect(restored.statPoints).toBe(0); expect(restored.skillPoints).toBe(1);
    expect(restored.derivedStats.life).toBe(3); expect(useMapStore.getState().questProgress[d.quest]?.rewardClaimed).toBe(false);
    expect(Object.values(useInventoryStore.getState().questItems).every(item => item.state === 'owned')).toBe(true);
    stops.splice(0).forEach(stop => { stop(); });
    expect(claimQuestReward(d.quest)).toBe('ok'); expect(claimQuestReward(d.quest)).toBe('already-claimed');
    const paid = required(usePlayerStore.getState().player); expect(xpTotal(paid.level) + paid.experience).toBe(4502);
  });
  it('holds the allocation fence through restoration failure and releases it after AggregateError', () => {
    const { d } = prepare(); useMercStore.setState({ ownedMercs: [], mercEquipment: {}, mercProgress: {}, fieldedMercId: null });
    const hero = required(usePlayerStore.getState().player);
    usePlayerStore.setState({ player: { ...hero, statPoints: 11, skillPoints: 3 } });
    const mark = useMapStore.getState().markQuestRewardClaimed;
    vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => { mark(id); throw new Error('claimed observer'); });
    let publications = 0, restoring = false;
    stops.push(usePlayerStore.subscribe(() => {
      if (++publications !== 3) return; restoring = true;
      const live = required(usePlayerStore.getState().player);
      expect(() => { usePlayerStore.getState().allocateStatPoint('vitality'); }).toThrow('questBusy');
      expect(() => usePlayerStore.getState().allocateStatPoints({ strength: 0, dexterity: 0, vitality: 1, energy: 0 }, live)).toThrow('questBusy');
      expect(() => usePlayerStore.getState().allocateSkillPoint('skills-sorceress-fire-bolt')).toThrow('questBusy');
      throw new Error('restoration observer');
    }));
    expect(() => claimQuestReward(d.quest)).toThrow(AggregateError); expect(restoring).toBe(true);
    stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks();
    usePlayerStore.getState().allocateStatPoint('vitality');
    const live = required(usePlayerStore.getState().player);
    expect(usePlayerStore.getState().allocateStatPoints({ strength: 0, dexterity: 0, vitality: 1, energy: 0 }, live)).toBe('ok');
    expect(usePlayerStore.getState().allocateSkillPoint('skills-sorceress-fire-bolt')).toBe('ok');
    expect(usePlayerStore.getState().player?.statPoints).toBe(9); expect(usePlayerStore.getState().player?.skillPoints).toBe(2);
    expect(claimQuestReward(d.quest)).toBe('ok'); expect(claimQuestReward(d.quest)).toBe('already-claimed');
  });
  it('reports a silent in-place restoration heal against an independent witness and releases the allocation fence', () => {
    const { d } = prepare(); useMercStore.setState({ ownedMercs: [], mercEquipment: {}, mercProgress: {}, fieldedMercId: null });
    const hero = required(usePlayerStore.getState().player);
    usePlayerStore.setState({ player: { ...hero, statPoints: 11, skillPoints: 3 } });
    const mark = useMapStore.getState().markQuestRewardClaimed;
    vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => { mark(id); throw new Error('claimed observer'); });
    let publications = 0, healed = false;
    stops.push(usePlayerStore.subscribe(next => {
      if (++publications !== 3) return; healed = true;
      const restored = required(next.player);
      Object.defineProperty(restored.derivedStats, 'life', { value: restored.derivedStats.lifeMax, enumerable: true, configurable: true, writable: true });
    }));
    expect(() => claimQuestReward(d.quest)).toThrow(AggregateError); expect(healed).toBe(true);
    expect(useMapStore.getState().questProgress[d.quest]?.rewardClaimed).toBe(false);
    expect(Object.values(useInventoryStore.getState().questItems).every(item => item.state === 'owned')).toBe(true);
    stops.splice(0).forEach(stop => { stop(); });
    usePlayerStore.getState().allocateStatPoint('vitality');
    expect(usePlayerStore.getState().player?.statPoints).toBe(10);
    expect(usePlayerStore.getState().allocateSkillPoint('skills-sorceress-fire-bolt')).toBe('ok');
  });
  it('refuses an independent authoritative hero equipment change and recomposes rollback with the retained gear without healing', () => {
    const { d } = prepare(); useMercStore.setState({ ownedMercs: [], mercEquipment: {}, mercProgress: {}, fieldedMercId: null });
    const equipped = { ...gear('independent-hero-gear'), equipped: true, equipSlot: 'weapon' as const }; let fired = false;
    stops.push(usePlayerStore.subscribe(() => {
      if (fired) return; fired = true; useInventoryStore.setState({ equipped: { weapon: equipped } });
    }));
    expect(claimQuestReward(d.quest)).toBe('grant-failed'); expect(useInventoryStore.getState().equipped.weapon).toBe(equipped);
    expect(usePlayerStore.getState().player?.derivedStats.life).toBe(3);
    expect(useMapStore.getState().questProgress[d.quest]?.rewardClaimed).toBe(false);
  });
  it('restores a participating source accessor injected during publication without executing it', () => {
    const { d } = prepare(), source = required(d.sources[0]); let fired = false, reads = 0;
    stops.push(useInventoryStore.subscribe(() => {
      if (fired) return; fired = true;
      Object.defineProperty(useInventoryStore.getState().questItems, source, { configurable: true, enumerable: true, get: () => { reads++; return { itemId: d.itemId, state: 'consumed' }; } });
    }));
    expect(claimQuestReward(d.quest)).toBe('grant-failed'); expect(reads).toBe(0);
    expect(useInventoryStore.getState().questItems[source]).toEqual({ itemId: d.itemId, state: 'owned' });
  });
  it('pins the same Jamella material through a failed publication and one complete retry, preserving unrelated material keys', () => {
    const { d } = prepare('jamella'); const real = useInventoryStore.getState().addMaterials; const attempts: unknown[] = [];
    vi.spyOn(useInventoryStore.getState(), 'addMaterials').mockImplementation(materials => {
      attempts.push(structuredClone(materials)); real(materials);
      useInventoryStore.setState(state => ({ materials: { ...state.materials, 'materials/scrap': 5 } }));
      throw new Error('material observer');
    });
    expect(claimQuestReward(d.quest)).toBe('grant-failed'); expect(useInventoryStore.getState().materials).toEqual({ 'materials/scrap': 5 });
    vi.restoreAllMocks(); const spy = vi.spyOn(useInventoryStore.getState(), 'addMaterials');
    expect(claimQuestReward(d.quest)).toBe('ok'); expect(spy).toHaveBeenCalledWith(attempts[0]);
    expect(useInventoryStore.getState().materials['materials/scrap']).toBe(5);
  });
  it('rolls back Malah consumed sources and prospective capacity if the final claimed publication fails', () => {
    const { d } = prepare('malah'), before = structuredClone(usePlayerStore.getState().player), mark = useMapStore.getState().markQuestRewardClaimed;
    vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => { mark(id); throw new Error('claimed observer'); });
    expect(claimQuestReward(d.quest)).toBe('grant-failed'); expect(usePlayerStore.getState().player).toEqual(before);
    expect(Object.values(useInventoryStore.getState().questItems).every(item => item.state === 'owned')).toBe(true);
  });
});

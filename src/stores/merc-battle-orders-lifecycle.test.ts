import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { Item } from '@/engine/types/items';
import { battleCommandDuration } from '@/engine/skills/battle-command';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { abortSubAreaRun, advanceWaveOrFinish, playerToCombatUnit,
  refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import { applyEventToTeams } from './combatPlayback';
import { stageRecordedBattle } from './recordedBattlePublication';
import { eventToLocalizedLogEntry } from './eventToLogI18n';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { __resetPersistenceForTests } from './persistence';

const def = loadMercPool().pool.find(row => row.id === 'mercs/act5-barbarian-battle-orders');
if (!def) throw new Error('Missing authored Orders mercenary');
const hold = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
const emptyRewards = { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} };
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
function player() {
  const p = usePlayerStore.getState().player;
  if (!p) throw new Error('Missing native fixture hero');
  return p;
}
function currentHero() {
  const hero = useCombatStore.getState().playerTeam[0];
  if (!hero) throw new Error('Missing staged hero');
  return hero;
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function recording() {
  const s = useCombatStore.getState();
  return structuredClone({ team: s.playerTeam, events: s.recordedEvents, outcome: s.outcome, rewards: s.runRewards });
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready'); resetRegistry(); loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset(); useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks();
});

it('publishes both initial caps, replays absolute withdrawal idempotently and keeps capacity observations silent', () => {
  const base = playerToCombatUnit(createMockPlayer('Orders playback', 'sorceress'));
  const hero = { ...base, life: 1250, mana: 125, manaRegenPerSecond: 0,
    manaRegenCarry: .5, manaRegenCompensation: .01, manaRegenExactCarry: '1/2',
    stats: { ...base.stats, lifeMax: 1000, manaMax: 100 }, statuses: [hold], skillOrder: [] };
  const merc = { ...mercToCombatUnit(createMercFromDef(def, 'playback')), life: 1, statuses: [hold,
    { id: 'poison', sourceId: 'enemy', stacks: 1, remaining: -1, dotPerStack: 1 }] };
  const enemy = { ...hero, id: 'enemy', kind: 'monster' as const, side: 'enemy' as const, life: 700, mana: 80 };
  const input = { seed: 7, playerTeam: [hero, merc], enemyTeam: [enemy] };
  const out = runBattleRecorded(input), before = structuredClone(out);
  const published = stageRecordedBattle({ initialPlayerTeam: input.playerTeam, initialEnemyTeam: input.enemyTeam,
    events: out.events, unitNameMap: new Map(), outcome: { winner: out.result.winner,
      finalPlayerTeam: out.result.playerTeam, finalEnemyTeam: out.result.enemyTeam } },
  { currentWave: 1, totalWaves: 1, subAreaRunId: null, runRewards: emptyRewards });
  expect(published.playerTeam[0]).toMatchObject({ life: 1250, mana: 125, stats: { lifeMax: 1300, manaMax: 130 } });
  let team: readonly CombatUnit[] = published.playerTeam, enemies: readonly CombatUnit[] = published.enemyTeam;
  for (const ev of out.events) {
    const next = applyEventToTeams(team, enemies, ev);
    if (ev.kind === 'mana-capacity') {
      expect(eventToLocalizedLogEntry(ev)).toBeNull();
      expect(applyEventToTeams(next.playerTeam, next.enemyTeam, ev)).toEqual(next);
    }
    team = next.playerTeam; enemies = next.enemyTeam;
  }
  const resources = (units: readonly CombatUnit[]) => units.map(u => ({ life: u.life, mana: u.mana,
    stats: u.stats, vigorLife: u.vigorLife, manaCapacity: u.manaCapacity, carry: u.manaRegenCarry }));
  expect(resources(team)).toEqual(resources(out.result.playerTeam));
  expect(team[0]).not.toHaveProperty('manaCapacity');
  expect(out).toEqual(before);
});

it.each([{}, null])('publishes removal of malformed MP transport %j even when numeric values stay unchanged', metadata => {
  const native = playerToCombatUnit(createMockPlayer('Malformed MP transport', 'sorceress'));
  const hero = { ...native, life: 700, mana: 80, manaRegenPerSecond: 0,
    stats: { ...native.stats, lifeMax: 1000, manaMax: 100 }, statuses: [hold], skillOrder: [],
    manaCapacity: metadata as unknown as NonNullable<CombatUnit['manaCapacity']> };
  const { manaCapacity: _capacity, ...withoutCapacity } = hero;
  const enemy = { ...withoutCapacity, id: 'enemy', kind: 'monster' as const, side: 'enemy' as const };
  const out = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [enemy] });
  expect(out.result.playerTeam[0]).not.toHaveProperty('manaCapacity');
  let team: readonly CombatUnit[] = [hero];
  for (const event of out.events) team = applyEventToTeams(team, [enemy], event).playerTeam;
  expect(team[0]).not.toHaveProperty('manaCapacity');
  expect(team[0]).toMatchObject({ mana: 80, stats: { manaMax: 100 } });
});

it('composes native paid Command profiles before MP clamping at payment and expiry', () => {
  const fresh = createMockPlayer('Native Command and merc Orders', 'barbarian');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 30, coreStats: { ...fresh.coreStats, energy: 1000 },
    skillLevels: { 'barbarian.howl': 1, 'barbarian.shout': 1, 'barbarian.battle_orders': 1,
      'barbarian.battle_command': 1 }, comboOrder: ['barbarian.battle_command'] });
  const native = playerToCombatUnit(player()), max = native.stats.manaMax;
  const hero = { ...native, life: 1, mana: max + Math.floor(max * .25), manaRegenPerSecond: 0,
    basicAttack: { damageType: 'physical' as const, damage: [0, 0] as const } };
  const merc = { ...mercToCombatUnit(createMercFromDef(def, 'command')), statuses: [hold] };
  const { battleCommandPassives: _profiles, ...withoutProfiles } = hero;
  const enemy = { ...withoutProfiles, id: 'enemy', kind: 'monster' as const, side: 'enemy' as const,
    life: 1000000, stats: { ...hero.stats, lifeMax: 1000000 },
    statuses: [hold], skillOrder: [] };
  const out = runBattleRecorded({ seed: 7, playerTeam: [hero, merc], enemyTeam: [enemy] });
  const cast = out.events.find(e => e.kind === 'action' && e.skillId === 'barbarian.battle_command');
  if (!cast) throw new Error('Missing actual paid Command');
  const expiry = cast.simClockMs + battleCommandDuration(1);
  const transitions = out.events.filter(e => e.kind === 'stats-state' && e.target === hero.id && e.simClockMs <= expiry);
  expect(transitions).toHaveLength(2);
  for (const ev of transitions) {
    if (ev.kind !== 'stats-state') throw new Error('Expected actual Command transition');
    expect(ev.state.mana).toBeGreaterThan(max);
    expect(ev.state.stats.manaMax).toBe(max + Math.floor(max * .30));
    expect(ev.state.manaCapacity).toEqual({ baseManaMax: max, appliedManaMax: max + Math.floor(max * .30) });
    const replayed = applyEventToTeams([hero], [], ev).playerTeam[0];
    expect(replayed?.manaCapacity).toEqual(ev.state.manaCapacity);
    expect(replayed?.mana).toBe(ev.state.mana);
  }
  expect(native.stats.manaMax).toBe(playerToCombatUnit({ ...player(), skillLevels: {} }).stats.manaMax);
});

it.each([false, true])('refreshes native wave MP after complete party qualification (remove support: %s)', remove => {
  const fresh = createMockPlayer('Constructed native Orders wave', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 30,
    coreStats: { ...fresh.coreStats, energy: 100 },
    skillLevels: { 'sorceress.warmth': 20 }, comboOrder: [] });
  const cap: Item = { id: 'fixture-orders-cap', baseId: 'items/base/helm-cap', rarity: 'rare', level: 1,
    identified: true, equipped: false, affixes: [{ affixId: 'fixture-imported', values: new Map([
      ['statMods.life', 999000], ['statMods.attack', 10000]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  const owned = createMercFromDef(def, 'native-wave');
  useMercStore.getState().addMerc(owned); useMercStore.getState().setFieldedMerc(owned.id);
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  const first = recording(), final = useCombatStore.getState().outcome?.finalPlayerTeam[0];
  if (!final) throw new Error('Missing real first-wave result');
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  const baseMax = playerToCombatUnit(player()).stats.manaMax;
  expect(final.mana).toBeGreaterThan(baseMax);
  if (remove) {
    const { signatureSkillId: _signature, ...withoutSignature } = owned;
    useMercStore.setState({ ownedMercs: [{ ...withoutSignature, comboOrder: ['mskill-bash'] }] });
  }
  expect(recording()).toEqual(first);
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  const next = currentHero(), expectedMax = remove ? baseMax : baseMax + Math.floor(baseMax * .30);
  expect(next.stats.manaMax).toBe(expectedMax);
  expect(next.mana).toBe(Math.min(final.mana, expectedMax));
  const second = recording();
  for (let repeat = 0; repeat < 2; repeat++) {
    drain(); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(recording()).toEqual(second);
  }
});

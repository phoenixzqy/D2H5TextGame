/** Constructed whole-admission controller/audit checks, not native campaign viability. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { campaignProfiles } from './profiles';
import { growCampaignBuild } from './actions';
import type { CampaignWave } from './policy';
import { createCampaignQuestActions } from './quest-actions';
import { actTwoActionOrder } from './act2-route';
import { CampaignStop } from './route';
import { createNovaActTwoPreparation, runPreparedNovaActTwo, auditNovaActTwoPreparation } from './nova-act2-preparation';
import { campaignExecution, assertCampaignExecutionProfile } from './execution';
import type { CampaignReward } from './economy';

let restores: (() => void)[];
const hero = () => { const p = usePlayerStore.getState().player; assert.ok(p); return p; };
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Act II QA', 'sorceress').ok).toBe(true);
  usePlayerStore.getState().gainExperience(xpTotal(14));
  growCampaignBuild(campaignProfiles['sorceress-cold-nova-focus'], () => undefined);
  for (const area of ['areas/act1-catacombs', 'areas/act1-dark-wood']) useMapStore.getState().markCleared(area);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

function fixture(nonwin?: (area: string, phase: 'farm' | 'route', ordinal: number) => boolean,
  earnedXp?: (area: string, phase: 'farm' | 'route', purpose: string) => number) {
  const waves: CampaignWave[] = [], orders: string[][] = [], routeSkills: Record<string, number>[] = [];
  const records: Record<string, unknown>[] = [], rewards: CampaignReward[] = [];
  const state = createNovaActTwoPreparation();
  const actions = createCampaignQuestActions(() => undefined, () => undefined);
  const enter = (act: number, area: string, phase: 'farm' | 'route') => {
    const map = useMapStore.getState(), ordinal = map.challengeOrdinals.normal;
    useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, normal: ordinal + 1 } });
    map.setCurrentLocation(act, area); orders.push([...hero().comboOrder]);
    if (phase === 'route') routeSkills.push({ ...hero().skillLevels });
    const failed = nonwin?.(area, phase, ordinal) ?? false;
    const purpose = state.attempts.at(-1)?.purpose; assert.ok(purpose);
    const xp = failed ? 0 : earnedXp?.(area, phase, purpose) ?? (phase === 'farm' ? 150_000 : 1000);
    usePlayerStore.getState().gainExperience(xp);
    waves.push({ area, phase, ordinal, index: 0, outcome: failed ? 'defeat' : 'victory',
      advance: failed ? 'defeat' : 'victory', logicalMs: 1, xp, items: 0, heroLife: failed ? 0 : 1, heroMana: 1 });
    if (failed) throw new CampaignStop('nonwin', 'Constructed settled nonwin', { area, phase, ordinal, index: 0, outcome: 'defeat' });
    map.markCleared(area);
    const archetype = ({ 'areas/act2-far-oasis': 'monsters/act2.radament',
      'areas/act2-arcane-sanctuary': 'monsters/act2.the-summoner' } as Record<string, string>)[area];
    if (archetype) useMapStore.getState().recordMonsterKills({ actId: 'acts/act2', areaId: area, archetypeIds: [archetype] });
    if (area === 'areas/act2-tomb-of-tal-rasha') useMapStore.getState().recordBossKill({ actId: 'acts/act2',
      areaId: area, bossArchetypeId: 'monsters/act2.duriel' });
  };
  const run = () => runPreparedNovaActTwo(campaignProfiles['sorceress-cold-nova-focus'],
    row => { records.push(row); }, enter, actions, state, delta => { rewards.push(delta); });
  return { state, actions, waves, orders, routeSkills, records, rewards, run };
}

it('prepares owned sockets once before the first Tomb admission and forwards every committed cost across retries', () => {
  useInventoryStore.getState().addItem({ id: 'owned-cap', baseId: 'items/base/helm-cap', rarity: 'normal',
    level: 1, ilvl: 1, socketCapacity: 1, identified: true, equipped: false });
  const cap = useInventoryStore.getState().backpack.find(row => row.id === 'owned-cap'); assert.ok(cap);
  expect(useInventoryStore.getState().equipItem(cap, 'head').ok).toBe(true);
  useInventoryStore.setState({ materials: { 'gems/diamond/normal': 1 } });
  let failed = false;
  const f = fixture((area, phase) => {
    if (area !== 'areas/act2-tomb-of-tal-rasha' || phase !== 'route') return false;
    expect(useInventoryStore.getState().equipped.head?.socketContents).toEqual([{ kind: 'gem', id: 'gems/diamond/normal' }]);
    if (!failed) { failed = true; return true; } return false;
  });
  f.run();
  expect(f.records.filter(row => row.kind === 'campaign-socket-preparation')).toHaveLength(1);
  expect(f.rewards).toHaveLength(1);
  expect(f.rewards[0]?.materials).toEqual({ 'gems/diamond/normal': -1 });
  expect(f.waves.filter(row => row.phase === 'route' && row.area === 'areas/act2-tomb-of-tal-rasha')).toHaveLength(2);
  expect(auditNovaActTwoPreparation(f.state, f.waves).completed).toBe(true);
});

it('keeps explicit trained execution separate from the screen envelope', () => {
  expect(campaignExecution('nova-act2-prepared-v1')).toEqual({ mode: 'nova-act2-prepared-v1',
    maxAdmissions: 1800, maxCombatMs: 216_000_000, maxWallMs: 1_500_000 });
  expect(campaignExecution().mode).toBe('screen');
});

it.each([['act1', 'sorceress-cold-nova-focus'], ['act2', 'sorceress-cold'], ['intro', 'sorceress-fire']])(
  'refuses incompatible diagnostic %s/%s before any mutation', (phase, id) => {
    expect(() => { assertCampaignExecutionProfile(campaignExecution('nova-act2-prepared-v1'), phase, id); })
      .toThrow('Nova Act II preparation requires');
  });

it('runs all six areas, keeps quest action order, buys cold ranks and retains prepared priority', () => {
  const f = fixture(), profile = f.run();
  expect(f.actions.entries.map(row => [row.action, row.id])).toEqual(actTwoActionOrder);
  expect(f.waves.filter(row => row.phase === 'route').map(row => row.area)).toEqual([
    'areas/act2-rocky-waste', 'areas/act2-dry-hills', 'areas/act2-far-oasis', 'areas/act2-lost-city',
    'areas/act2-arcane-sanctuary', 'areas/act2-tomb-of-tal-rasha']);
  expect(hero().skillLevels?.['sorceress.blizzard']).toBe(20);
  expect(f.orders.at(-1)).toEqual(['sorceress.static_field', 'sorceress.blizzard']);
  expect(hero().comboOrder).toEqual(profile.priority);
  expect(auditNovaActTwoPreparation(f.state, f.waves)).toMatchObject({ completed: true, routeAdmissions: 6 });
});

it('retains a route loss, earns a level, and restarts the whole same area', () => {
  let failed = false;
  const f = fixture((area, phase) => {
    if (!failed && phase === 'route' && area === 'areas/act2-dry-hills') { failed = true; return true; } return false;
  });
  f.run(); const audit = auditNovaActTwoPreparation(f.state, f.waves);
  expect(audit.nonwinOrdinals).toHaveLength(1); expect(f.state.recoveries).toHaveLength(1);
  const recovery = f.state.recoveries[0]; assert.ok(recovery);
  const retry = f.state.attempts.find(row => row.ordinal === recovery.retryOrdinal); assert.ok(retry);
  expect(retry.fromLevel).toBeGreaterThanOrEqual(recovery.targetLevel);
  expect(f.waves.filter(row => row.area === 'areas/act2-dry-hills' && row.phase === 'route')).toHaveLength(2);
});

it('falls back to cleared Dark Wood after an Act II farm loss and retains its exact XP interval', () => {
  let failed = false;
  const f = fixture((area, phase) => {
    if (!failed && phase === 'farm' && area.startsWith('areas/act2-')) { failed = true; return true; } return false;
  });
  f.run(); const audit = auditNovaActTwoPreparation(f.state, f.waves);
  const loss = f.waves.find(row => row.outcome === 'defeat'); assert.ok(loss);
  expect(f.waves.find(row => row.ordinal === loss.ordinal + 1)).toMatchObject({ area: 'areas/act1-dark-wood', phase: 'farm' });
  expect(audit.nonwinOrdinals).toContain(loss.ordinal);
});

it('stops after three training nonwins and retains their exact source and ordinals', () => {
  const f = fixture((_area, phase) => phase === 'farm');
  expect(() => f.run()).toThrow('training nonwin bound reached');
  expect(f.state.completed).toBe(false);
  expect(f.state.profile?.statsPerLevel).toEqual({ strength: 0, dexterity: 0, vitality: 5, energy: 0 });
  expect(auditNovaActTwoPreparation(f.state, f.waves)).toMatchObject({ trainingNonwins: 3, trainingAdmissions: 3 });
  expect(f.waves.filter(row => row.phase === 'farm').map(row => row.area)).toEqual([
    'areas/act2-rocky-waste', 'areas/act1-dark-wood', 'areas/act1-dark-wood']);
});

function coldTrainingFixture(blockCold = false) {
  return fixture(undefined, (area, phase, purpose) => {
    if (phase === 'route' && area === 'areas/act2-far-oasis')
      return xpTotal(20) - xpTotal(hero().level) - hero().experience;
    if (purpose === 'first-entry:areas/act2-lost-city' ||
      (blockCold && purpose.startsWith('cold-evolution:'))) return 0;
    return phase === 'farm' ? 150_000 : 1000;
  });
}

it('earns level24 and buys Blizzard before Lost City when its first-entry block earns no XP', () => {
  const f = coldTrainingFixture(); f.run();
  const lost = f.state.attempts.find(row => row.purpose === 'route:areas/act2-lost-city:1');
  expect(lost?.fromLevel).toBeGreaterThanOrEqual(24);
  expect(f.routeSkills[3]?.['sorceress.blizzard']).toBe(20);
  const entryTraining = f.state.attempts.filter(row => row.purpose === 'first-entry:areas/act2-lost-city');
  expect(entryTraining).toHaveLength(64);
  expect(entryTraining.every(row => row.targetLevel === 21 && row.fromXp === row.terminalXp)).toBe(true);
  for (const target of [23, 24]) {
    const training = f.state.attempts.filter(row => row.purpose === `cold-evolution:${String(target)}`);
    expect(training.length).toBeGreaterThan(0); expect(training.length).toBeLessThanOrEqual(64);
    expect(training.every(row => row.targetLevel === target)).toBe(true);
    expect(training.at(-1)?.terminalLevel).toBeGreaterThanOrEqual(target);
  }
  expect(auditNovaActTwoPreparation(f.state, f.waves)).toMatchObject({ completed: true });
});

it('stops honestly when mandatory cold training exhausts its bound without earning the target', () => {
  const f = coldTrainingFixture(true);
  expect(() => f.run()).toThrow('purpose training bound reached');
  expect(f.state.attempts.some(row => row.purpose === 'route:areas/act2-lost-city:1')).toBe(false);
  expect(hero().skillLevels?.['sorceress.blizzard'] ?? 0).toBe(0);
  expect(auditNovaActTwoPreparation(f.state, f.waves).completed).toBe(false);
});

it.each(['target', 'purpose', 'entry-level'] as const)('rejects forged cold-training %s evidence', mutation => {
  const f = fixture(); f.run();
  const training = f.state.attempts.find(row => row.purpose === 'cold-evolution:23'); assert.ok(training);
  if (mutation === 'target') training.targetLevel = 24;
  else if (mutation === 'purpose') training.purpose = 'cold-evolution:22';
  else {
    const entry = f.state.attempts.find(row => row.purpose === 'route:areas/act2-lost-city:1'); assert.ok(entry);
    const xp = entry.terminalXp - entry.fromXp;
    entry.fromLevel = 23; entry.fromXp = xpTotal(23);
    entry.terminalLevel = 23; entry.terminalXp = entry.fromXp + xp;
  }
  expect(() => auditNovaActTwoPreparation(f.state, f.waves)).toThrow();
});

it.each(['area', 'xp', 'ordinal', 'recovery-target', 'training-target', 'training-purpose', 'level'] as const)(
  'rejects forged %s preparation evidence', mutation => {
  let failed = false;
  const f = fixture((area, phase) => {
    if (!failed && area === 'areas/act2-dry-hills' && phase === 'route') { failed = true; return true; } return false;
  });
  f.run();
  const first = f.state.attempts[0], recovery = f.state.recoveries[0];
  const training = f.state.attempts.find(row => row.kind === 'training'); assert.ok(first && recovery && training);
  if (mutation === 'area') first.area = 'areas/act5-worldstone-keep';
  if (mutation === 'xp') first.terminalXp++;
  if (mutation === 'ordinal') first.nextOrdinal++;
  if (mutation === 'recovery-target') recovery.targetLevel++;
  if (mutation === 'training-target') training.targetLevel = 28;
  if (mutation === 'training-purpose') training.purpose = 'undeclared';
  if (mutation === 'level') first.fromLevel++;
  expect(() => auditNovaActTwoPreparation(f.state, f.waves)).toThrow();
});


it('prepares offense once before Tomb and preserves its native reset and order across retries', () => {
  let tombFailed = false;
  const f = fixture((area, phase) => {
    if (!tombFailed && area === 'areas/act2-tomb-of-tal-rasha' && phase === 'route') { tombFailed = true; return true; }
    return false;
  });
  f.run();
  expect(f.state.offensePrepared).toBe(true);
  expect(f.state.profile?.statsPerLevel).toEqual({ strength: 0, dexterity: 5, vitality: 0, energy: 0 });
  expect(f.state.profile?.priority).toEqual(['sorceress.static_field', 'sorceress.blizzard']);
  const resets = f.records.filter(row => row.kind === 'act2-native-point-reset' &&
    (row.audit as { kind?: string }).kind === 'stat');
  expect(resets).toHaveLength(2);
  expect(f.records.filter(row => row.kind === 'act2-owned-offense-preparation')).toHaveLength(1);
  const firstTomb = f.state.attempts.findIndex(row => row.area === 'areas/act2-tomb-of-tal-rasha');
  for (const index of f.state.attempts.keys()) {
    if (index >= firstTomb) expect(f.orders[index]).toEqual(['sorceress.static_field', 'sorceress.blizzard']);
  }
  expect(auditNovaActTwoPreparation(f.state, f.waves).completed).toBe(true);
});

it.each(['flag', 'stats', 'order'] as const)('rejects forged offensive preparation %s', mutation => {
  const f = fixture(); f.run();
  if (mutation === 'flag') f.state.offensePrepared = false;
  else if (mutation === 'stats') { assert.ok(f.state.profile); f.state.profile = { ...f.state.profile, statsPerLevel: { strength: 0, dexterity: 0, vitality: 5, energy: 0 } }; }
  else { assert.ok(f.state.profile); f.state.profile = { ...f.state.profile, priority: ['sorceress.blizzard'] }; }
  expect(() => auditNovaActTwoPreparation(f.state, f.waves)).toThrow();
});

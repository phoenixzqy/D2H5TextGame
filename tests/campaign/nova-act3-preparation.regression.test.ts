/** Constructed admissions test preparation/conservation, never native campaign viability. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { xpRequired, xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { snapshotStores } from '@/stores/persistence';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { campaignProfiles } from './profiles';
import { novaActTwoProfile, resetCampaignPoints } from './caster-preparation';
import { growCampaignBuild } from './actions';
import { CampaignStop } from './route';
import type { CampaignWave } from './policy';
import type { CampaignPreparation } from './preparation';
import { prepareNovaDurance, auditNovaActThreePreparation } from './nova-act3-preparation';

let restores: (() => void)[];
const hero = () => { const player = usePlayerStore.getState().player; assert.ok(player); return player; };
const save = () => { const snapshot = snapshotStores(); assert.ok(snapshot); return snapshot; };
const profile = { ...novaActTwoProfile(campaignProfiles['sorceress-cold-nova-focus'], true),
  statsPerLevel: { strength: 0, dexterity: 5, vitality: 0, energy: 0 },
  priority: ['sorceress.static_field', 'sorceress.blizzard'] };

beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Act III QA', 'sorceress').ok).toBe(true);
  usePlayerStore.getState().gainExperience(xpTotal(26));
  // Constructed quest entitlement; production fresh campaign proofs own acquisition.
  usePlayerStore.setState({ player: { ...hero(), skillPoints: hero().skillPoints + 3 } });
  resetCampaignPoints('skill', () => undefined); growCampaignBuild(profile, () => undefined);
  expect(Object.values(hero().skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0)).toBe(33);
  for (const area of ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha', 'areas/act3-great-marsh'])
    useMapStore.getState().markCleared(area);
  useMapStore.getState().setCurrentLocation(3, 'a3-travincal');
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

function fixture(outcome: 'victory' | 'defeat' | 'no-xp' = 'victory', failure?: Error) {
  const records: Readonly<Record<string, unknown>>[] = [], waves: CampaignWave[] = [];
  let recordHook: (row: Readonly<Record<string, unknown>>) => void = () => undefined;
  let checkpoint: CampaignPreparation | null = null;
  const run = () => prepareNovaDurance(profile, row => { records.push(row); recordHook(row); }, (_act, area, phase) => {
    assert.ok(checkpoint); expect(hero().comboOrder).toEqual(profile.priority);
    const map = useMapStore.getState(), ordinal = map.challengeOrdinals.normal;
    expect(area).toBe('areas/act3-great-marsh'); expect(phase).toBe('farm');
    map.setCurrentLocation(3, 'a3-great-marsh');
    useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, normal: ordinal + 1 } });
    const xp = outcome === 'victory' ? xpRequired(hero().level) - hero().experience : 0;
    usePlayerStore.getState().gainExperience(xp);
    waves.push({ area, phase, ordinal, index: 0, outcome: outcome === 'defeat' ? 'defeat' : 'victory',
      advance: outcome === 'defeat' ? 'defeat' : 'victory', logicalMs: 1, xp, items: 0,
      heroLife: outcome === 'defeat' ? 0 : 1, heroMana: 1 });
    if (failure) throw failure;
    if (outcome === 'defeat') throw new CampaignStop('nonwin', 'Constructed training defeat',
      { area, phase, ordinal, index: 0, outcome: 'defeat' });
  }, next => { checkpoint = next; });
  const state = () => { assert.ok(checkpoint); return checkpoint; };
  return { run, state, waves, records, hook: (next: typeof recordHook) => { recordHook = next; } };
}

it('earns level30, spends one free reset, and conserves the same37 paid points and stats', () => {
  const before = save(), f = fixture(), prepared = f.run(), after = save();
  expect(f.state().result).toMatchObject({ status: 'target-earned', admissions: 4, terminalLevel: 30, nonwins: 0 });
  expect(after.player.skillLevels).toMatchObject({ 'sorceress.cold_mastery': 6, 'sorceress.blizzard': 20,
    'sorceress.frost_nova': 6, 'sorceress.static_field': 1, 'sorceress.ice_blast': 1 });
  expect(Object.values(after.player.skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0)).toBe(37);
  expect(after.player.skillPoints).toBe(0);
  expect(after.player.respecsRemaining.skill).toBe(before.player.respecsRemaining.skill - 1);
  expect(after.player.respecsRemaining.stat).toBe(before.player.respecsRemaining.stat);
  expect(after.player.coreStats).toEqual({ ...before.player.coreStats, dexterity: before.player.coreStats.dexterity + 20 });
  expect(after.inventory).toEqual(before.inventory);
  expect(after.mercs).toEqual(before.mercs);
  expect(prepared.priority).toEqual(['sorceress.static_field', 'sorceress.blizzard', 'sorceress.ice_blast']);
  expect(after.player.comboOrder).toEqual(prepared.priority);
  expect(auditNovaActThreePreparation(f.state(), f.waves)).toMatchObject({ admissions: 4, nonwinOrdinals: [] });
});

it.each([['defeat', 3, 'nonwin'], ['no-xp', 128, 'budget']] as const)(
  'retains the exact %s training bound without a reset or prepared priority', (outcome, count, status) => {
    const before = save(), f = fixture(outcome);
    expect(f.run).toThrow(CampaignStop);
    expect(f.state().failureStatus).toBe(status); expect(f.waves).toHaveLength(count);
    expect(hero().respecsRemaining?.skill).toBe(before.player.respecsRemaining.skill);
    expect(hero().comboOrder).toEqual(profile.priority);
    expect(auditNovaActThreePreparation(f.state(), f.waves).admissions).toBe(count);
  });

it('retains a technical interruption and committed XP before failing preparation', () => {
  const f = fixture('victory', new Error('Constructed post-award observer failure'));
  expect(f.run).toThrow('post-award');
  expect(f.state()).toMatchObject({ result: null, failureStatus: 'technical', nextOrdinal: 1 });
  expect(hero().level).toBe(27);
  expect(auditNovaActThreePreparation(f.state(), f.waves).admissions).toBe(1);
});

it('retains the native free reset and refunded points when its recorder throws after commitment', () => {
  const before = save(), f = fixture();
  f.hook(row => { if (row.kind === 'act2-native-point-reset') throw new Error('Constructed reset recorder failure'); });
  expect(f.run).toThrow('reset recorder');
  const after = save();
  expect(after.player.level).toBe(30); expect(after.player.skillLevels).toEqual({});
  expect(after.player.skillPoints).toBe(37);
  expect(after.player.respecsRemaining.skill).toBe(before.player.respecsRemaining.skill - 1);
  expect(f.state()).toMatchObject({ failureStatus: 'technical', result: { status: 'target-earned' } });
  expect(auditNovaActThreePreparation(f.state(), f.waves).admissions).toBe(4);
});

it('rejects missing native area access before retaining or allocating preparation', () => {
  useMapStore.setState({ clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha'] });
  const before = save(), f = fixture();
  expect(f.run).toThrow('cleared'); expect(save()).toEqual(before); expect(f.waves).toHaveLength(0);
});

it.each(['target', 'bound', 'xp', 'area', 'ordinal'] as const)('rejects forged preparation audit: %s', corruption => {
  const f = fixture(); f.run(); const state = structuredClone(f.state()), waves = [...f.waves];
  if (corruption === 'target') Object.assign(state, { request: { ...state.request, targetLevel: 31 } });
  if (corruption === 'bound') Object.assign(state, { request: { ...state.request, maxAdmissions: 129 } });
  if (corruption === 'xp') state.terminalXp++;
  if (corruption === 'ordinal') state.nextOrdinal++;
  if (corruption === 'area') { const first = waves[0]; assert.ok(first); waves[0] = { ...first, area: 'areas/act3-travincal' }; }
  expect(() => auditNovaActThreePreparation(state, waves)).toThrow();
});

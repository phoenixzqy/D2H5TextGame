/** Constructed admissions isolate native XP/point conservation and bounded opening recovery. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { xpRequired, xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { growCampaignBuild, startCampaignQuest } from './actions';
import { campaignProfiles } from './profiles';
import { CampaignStop } from './route';
import { runCampaignDen, type CampaignOpeningRecovery } from './opening-recovery';

const den = 'areas/act1-den-of-evil', moor = 'areas/act1-blood-moor';
const profile = campaignProfiles['sorceress-cold-nova-focus'];
let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Opening QA', 'sorceress').ok).toBe(true);
  expect(usePlayerStore.getState().gainExperience(xpTotal(6)).newLevel).toBe(6);
  growCampaignBuild(profile, () => undefined);
  startCampaignQuest('quests/act1-den-of-evil', () => undefined);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

function fixture(options: { failures?: number; trainingXp?: boolean; trainingFailure?: Error;
  malformedFailure?: Error; recorderFailure?: string } = {}) {
  const opening: CampaignOpeningRecovery = { mode: 'den-training-v1', cycles: [] };
  const admissions: { area: string; phase: 'farm' | 'route'; ordinal: number }[] = [];
  const records: Readonly<Record<string, unknown>>[] = [];
  let failures = options.failures ?? 1;
  const record = (row: Readonly<Record<string, unknown>>) => {
    records.push(row); if (row.kind === options.recorderFailure) throw new Error('Opening recorder failure');
  };
  const enter = (area: string, phase: 'farm' | 'route') => {
    const ordinal = useMapStore.getState().challengeOrdinals.normal;
    useMapStore.setState(state => ({ challengeOrdinals: { ...state.challengeOrdinals, normal: ordinal + 1 } }));
    admissions.push({ area, phase, ordinal });
    if (phase === 'route' && failures-- > 0) throw options.malformedFailure ??
      new CampaignStop('nonwin', 'Constructed Den defeat', { area, phase, ordinal, index: 0, outcome: 'defeat' });
    if (phase === 'farm') {
      if (options.trainingFailure) { useInventoryStore.getState().addCurrency('rune-shard', 2); throw options.trainingFailure; }
      if (options.trainingXp !== false) {
        const hero = usePlayerStore.getState().player; assert.ok(hero);
        usePlayerStore.getState().gainExperience(xpRequired(hero.level) - hero.experience);
      }
    }
  };
  const run = () => { runCampaignDen(profile, record, enter, opening, () => { growCampaignBuild(profile, record); }); };
  return { opening, admissions, records, enter, run };
}

it('retains an initial Den loss, earns one level and retries the whole Den exactly once', () => {
  const before = usePlayerStore.getState().player; assert.ok(before);
  const f = fixture(); f.run();
  expect(f.admissions).toEqual([{ area: den, phase: 'route', ordinal: 0 },
    { area: moor, phase: 'farm', ordinal: 1 }, { area: den, phase: 'route', ordinal: 2 }]);
  expect(f.opening.cycles).toMatchObject([{ fromLevel: 6, targetLevel: 7,
    trainingStartOrdinal: 1, trainingNextOrdinal: 2, retryOrdinal: 2, resolution: 'retry-won',
    trainingResult: { status: 'target-earned', admissions: 1, wins: 1, nonwins: 0 } }]);
  const after = usePlayerStore.getState().player; assert.ok(after);
  expect(after.level).toBe(7); expect(after.coreStats).toEqual({ ...before.coreStats,
    vitality: before.coreStats.vitality + 2, energy: before.coreStats.energy + 3 });
  expect(after.skillLevels?.['sorceress.frost_nova']).toBe((before.skillLevels?.['sorceress.frost_nova'] ?? 0) + 1);
  expect(after.skillPoints).toBe(0); expect(after.statPoints).toBe(0);
  expect(useMapStore.getState().questProgress['quests/act1-den-of-evil']?.rewardClaimed).not.toBe(true);
});

it('keeps the old single-attempt opening when the explicit recovery option is absent', () => {
  const f = fixture(), before = usePlayerStore.getState().player;
  expect(() => { runCampaignDen(profile, () => undefined, f.enter); }).toThrow('Constructed Den defeat');
  expect(f.admissions).toHaveLength(1); expect(f.opening.cycles).toEqual([]);
  expect(usePlayerStore.getState().player).toEqual(before);
});

it('stops after two opening cycles and three real Den attempts without erasing any failure', () => {
  const f = fixture({ failures: 3 }); expect(f.run).toThrow('Constructed Den defeat');
  expect(f.admissions.map(row => row.phase)).toEqual(['route', 'farm', 'route', 'farm', 'route']);
  expect(f.opening.cycles).toMatchObject([{ retryOrdinal: 2, resolution: 'retry-nonwin' },
    { failure: { ordinal: 2 }, retryOrdinal: 4, resolution: 'retry-nonwin' }]);
  expect(usePlayerStore.getState().player?.level).toBe(8);
});

it('stops at forty full training admissions without inventing a level or retry', () => {
  const f = fixture({ trainingXp: false }); expect(f.run).toThrow('Opening training admission-limit');
  expect(f.admissions).toHaveLength(41);
  expect(f.opening.cycles).toMatchObject([{ retryOrdinal: null, resolution: 'stopped',
    trainingStartOrdinal: 1, trainingNextOrdinal: 41, trainingResult: {
      status: 'admission-limit', admissions: 40, terminalLevel: 6 } }]);
  expect(usePlayerStore.getState().player?.level).toBe(6);
});

it.each([new CampaignStop('budget', 'Outer deadline'), new Error('Native observer failure')])(
  'retains actual mutations and propagates a training interruption: %s', error => {
    const f = fixture({ trainingFailure: error }); expect(f.run).toThrow(error);
    expect(f.admissions).toHaveLength(2); expect(f.opening.cycles).toMatchObject([
      { trainingResult: null, retryOrdinal: null, resolution: 'stopped', trainingNextOrdinal: 2 }]);
    expect(useInventoryStore.getState().currencies['rune-shard']).toBe(2);
  });

it('rejects a nonwin without original settled-wave identity before planning training', () => {
  const f = fixture({ malformedFailure: new CampaignStop('nonwin', 'Unbound failure') });
  expect(f.run).toThrow('Unbound failure'); expect(f.opening.cycles).toEqual([]);
  expect(f.admissions).toHaveLength(1);
});

it('retains a settled training nonwin and stops before another Den attempt', () => {
  const f = fixture({ trainingFailure: new CampaignStop('nonwin', 'Constructed farm draw',
    { area: moor, phase: 'farm', ordinal: 1, index: 0, outcome: 'draw' }) });
  expect(f.run).toThrow('Opening training retry-limit'); expect(f.admissions).toHaveLength(2);
  expect(f.opening.cycles).toMatchObject([{ resolution: 'stopped', stopStatus: 'nonwin',
    retryOrdinal: null, trainingResult: { admissions: 1, nonwins: 1, status: 'retry-limit' } }]);
  expect(useInventoryStore.getState().currencies['rune-shard']).toBe(2);
});

it.each(['opening-recovery-start', 'opening-attempt-retry'])('does not admit or fabricate a retry after %s recorder failure', kind => {
  const f = fixture({ recorderFailure: kind }); expect(f.run).toThrow('Opening recorder failure');
  expect(f.admissions).toHaveLength(kind === 'opening-recovery-start' ? 1 : 2);
  expect(f.opening.cycles).toMatchObject([{ retryOrdinal: null, resolution: 'stopped' }]);
});

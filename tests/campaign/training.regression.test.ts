/** Constructed admissions test orchestration; XP/point actions are native, not earned combat evidence. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import type { CampaignProfile } from './policy';
import { CampaignStop } from './route';
import { trainCampaignBuild, type CampaignTrainingRequest } from './training';
import { equipCampaignGear } from './actions';

const area = 'areas/act5-bloody-foothills';
const profile: CampaignProfile = { classId: 'sorceress', priority: [],
  targets: [{ id: 'sorceress.warmth', rank: 20, level: 1 }],
  statsPerLevel: { strength: 0, dexterity: 0, vitality: 2, energy: 3 } };
const request: CampaignTrainingRequest = { act: 5, area, targetLevel: 2,
  maxAdmissions: 10, maxConsecutiveNonwins: 3, maxTotalNonwins: 5 };
let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Training QA', 'sorceress').ok).toBe(true);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

function admitted(nonwin = false) {
  const ordinal = useMapStore.getState().challengeOrdinals.normal;
  useMapStore.setState(state => ({ challengeOrdinals: { ...state.challengeOrdinals, normal: ordinal + 1 } }));
  if (nonwin) throw new CampaignStop('nonwin', 'Constructed settled defeat',
    { area, phase: 'farm', ordinal, index: 0, outcome: 'defeat' });
}

it('retains partial income and newly earned points without counting a failed area as a win', () => {
  const before = usePlayerStore.getState().player;
  if (!before) throw new Error('Missing constructed hero');
  const result = trainCampaignBuild(profile, request, () => undefined, () => {
    usePlayerStore.getState().gainExperience(100);
    useInventoryStore.getState().addCurrency('rune-shard', 2);
    admitted(true);
  });
  expect(result).toMatchObject({ status: 'target-earned', admissions: 1, wins: 0,
    nonwins: 1, lastAttempt: 'nonwin', terminalLevel: 2 });
  expect(useInventoryStore.getState().currencies['rune-shard']).toBe(2);
  const after = usePlayerStore.getState().player;
  expect(after?.coreStats).toEqual({ ...before.coreStats,
    vitality: before.coreStats.vitality + 2, energy: before.coreStats.energy + 3 });
  expect(after?.skillLevels?.['sorceress.warmth']).toBe(2);
  expect(after?.statPoints).toBe(0);
});

it('resets consecutive failures after a win and stops at the exact retry limit', () => {
  const outcomes = [true, false, true, true, true];
  const result = trainCampaignBuild(profile, request, () => undefined, () => {
    admitted(outcomes.shift());
  });
  expect(result).toMatchObject({ status: 'retry-limit', admissions: 5, wins: 1,
    nonwins: 4, consecutiveNonwins: 3, terminalLevel: 1 });
  expect(outcomes).toEqual([]);
});

it('bounds total failures even when intervening wins reset the consecutive count', () => {
  const outcomes = [true, false, true, false, true];
  const result = trainCampaignBuild(profile, { ...request, maxTotalNonwins: 3 },
    () => undefined, () => { admitted(outcomes.shift()); });
  expect(result).toMatchObject({ status: 'retry-limit', admissions: 5, wins: 2,
    nonwins: 3, consecutiveNonwins: 1 });
});

it('reports an admission bound without inventing the target level', () => {
  const result = trainCampaignBuild(profile, { ...request, maxAdmissions: 2 },
    () => undefined, () => { admitted(); });
  expect(result).toMatchObject({ status: 'admission-limit', admissions: 2,
    wins: 2, nonwins: 0, terminalLevel: 1 });
});

it('equips earned training loot after growth before the next admission housekeeping', () => {
  let entries = 0, boundaries = 0;
  const result = trainCampaignBuild(profile, { ...request, targetLevel: 3 }, () => undefined, () => {
    entries++;
    if (entries === 2) {
      expect(useInventoryStore.getState().equipped.head?.id).toBe('training-cap');
      expect(usePlayerStore.getState().player?.skillLevels?.['sorceress.warmth']).toBe(2);
      expect(boundaries).toBe(1);
    }
    admitted(); usePlayerStore.getState().gainExperience(entries === 1 ? 100 : 600);
    if (entries === 1) useInventoryStore.getState().addItem({ id: 'training-cap',
      baseId: 'items/base/helm-cap', rarity: 'normal', level: 1, ilvl: 1,
      identified: true, equipped: false, socketCapacity: 0 });
  }, () => { boundaries++; equipCampaignGear(() => undefined, profile); });
  expect(result.status).toBe('target-earned'); expect(boundaries).toBe(2);
});

it.each([new CampaignStop('budget', 'Outer budget'), new Error('Native reward observer')])(
  'propagates technical and outer budget failures while retaining actual prior mutations', failure => {
    expect(() => trainCampaignBuild(profile, request, () => undefined, () => {
      useInventoryStore.getState().addCurrency('rune-shard', 3); throw failure;
    })).toThrow(failure);
    expect(useInventoryStore.getState().currencies['rune-shard']).toBe(3);
  }
);

it('rejects an unbound nonwin and an unfinished admission instead of retrying them', () => {
  expect(() => trainCampaignBuild(profile, request, () => undefined, () => {
    admitted(); throw new CampaignStop('nonwin', 'No settled-wave identity');
  })).toThrow('No settled-wave identity');
  expect(() => trainCampaignBuild(profile, request, () => undefined, () => {
    admitted(); useCombatStore.setState({ inCombat: true });
  })).toThrow('settled');
});

it('validates all bounds and the area before allocating any existing points', () => {
  const before = observeEarnedState();
  for (const invalid of [{ ...request, targetLevel: 91 }, { ...request, maxAdmissions: 0 },
    { ...request, maxConsecutiveNonwins: 1.5 }, { ...request, maxTotalNonwins: -1 },
    { ...request, area: 'areas/act4-plains-of-despair' }]) {
    expect(() => trainCampaignBuild(profile, invalid, () => undefined, () => {
      throw new Error('Must not admit');
    })).toThrow();
    expect(observeEarnedState()).toEqual(before);
  }
});

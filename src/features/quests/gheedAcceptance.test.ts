/** Independent public Gheed acceptance with constructed capabilities, not earned campaign evidence. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import * as quests from '@/data/loaders/quests';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { xpRequired } from '@/engine/progression/xp';
import { useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore,
  useMetaStore, usePlayerStore } from '@/stores';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { createMercFromDef } from '@/stores/mercFactory';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { claimQuestReward, canClaim } from './claimReward';
import { recoverCountedQuestSource } from './countedQuestActions';

const Q = 'quests/side-act1-gheeds-gamble', O = 'obj-gamble-5';
const sources = [1, 2, 3, 4, 5].map(n => `${Q}#objective:${O}:source:lot-${String(n)}`);
const stops: (() => void)[] = [];
const stores = [useCombatStore, useFormationStore, useInventoryStore, useMapStore,
  useMercStore, useMetaStore, usePlayerStore] as const;
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing independent Gheed fixture');
  return value;
}
const hero = () => required(usePlayerStore.getState().player);
function recover(count = 5): void {
  for (const source of sources.slice(0, count)) expect(recoverCountedQuestSource(source)).toBe('ok');
}
function merc(id: string) {
  const definition = required(loadMercPool().pool.find(row => row.id === 'mercs/act5-barbarian-recruit'));
  const actor = createMercFromDef(definition, id);
  useMercStore.getState().addMerc(actor);
  return actor;
}
function payment() {
  const inv = useInventoryStore.getState(), map = useMapStore.getState(), current = useMercStore.getState();
  return structuredClone({ hero: hero(), currencies: inv.currencies, materials: inv.materials,
    items: inv.questItems, rows: map.questProgress, roster: current.ownedMercs, progress: current.mercProgress });
}
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  const actor = createMockPlayer('Independent Gheed', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...actor, level: 35, experience: 0,
    experienceToNextLevel: xpRequired(35), derivedStats: { ...actor.derivedStats, life: 7, mana: 2 } });
  useMapStore.setState({ currentAct: 1, currentSubAreaId: 'areas/act1-cold-plains', selectedDifficulty: 'normal',
    questProgress: { [Q]: { id: Q, status: 'inProgress', rewardClaimed: false, objectives: { [O]: false } } } });
});
afterEach(() => {
  stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests();
});

describe('independent Gheed recipient and closed-ingress acceptance', () => {
  it('pays the actual fielded recipient when its saved progress key was initially absent', () => {
    recover(); const recipient = merc('gheed-absent-progress');
    useMercStore.getState().setFieldedMerc(recipient.id);
    useMercStore.setState({ mercProgress: {} });
    const share = vi.spyOn(useMercStore.getState(), 'shareExperienceWithFielded');
    expect(claimQuestReward(Q)).toBe('ok');
    expect(share).toHaveBeenCalledTimes(1); expect(share).toHaveBeenCalledWith(1000, recipient.id);
    expect(Object.hasOwn(useMercStore.getState().mercProgress, recipient.id)).toBe(true);
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(1);
    expect(useMapStore.getState().questProgress[Q]?.rewardClaimed).toBe(true);
  });

  it('restores absent recipient progress after a post-share failure and permits a single retry', () => {
    recover(); const recipient = merc('gheed-absent-progress-rollback');
    useMercStore.getState().setFieldedMerc(recipient.id); useMercStore.setState({ mercProgress: {} });
    const before = payment(), share = useMercStore.getState().shareExperienceWithFielded;
    vi.spyOn(useMercStore.getState(), 'shareExperienceWithFielded').mockImplementation((amount, id) => {
      share(amount, id); throw new Error('independent post-share failure');
    });
    expect(claimQuestReward(Q)).toBe('grant-failed'); expect(payment()).toEqual(before);
    expect(Object.hasOwn(useMercStore.getState().mercProgress, recipient.id)).toBe(false);
    vi.restoreAllMocks(); expect(claimQuestReward(Q)).toBe('ok'); expect(claimQuestReward(Q)).toBe('already-claimed');
  });

  it('refuses to redirect the share when fielding changes inside the real hero award', () => {
    recover(); const recipient = merc('gheed-pinned-before-xp'), other = merc('gheed-switch-during-xp');
    useMercStore.getState().setFieldedMerc(recipient.id); const before = payment();
    const share = vi.spyOn(useMercStore.getState(), 'shareExperienceWithFielded');
    let fired = false;
    stops.push(usePlayerStore.subscribe(next => {
      if (fired || next.player?.experience !== 1000) return;
      fired = true; useMercStore.getState().setFieldedMerc(other.id);
    }));
    expect(claimQuestReward(Q)).toBe('grant-failed'); expect(fired).toBe(true);
    expect(share).not.toHaveBeenCalled(); expect(useMercStore.getState().fieldedMercId).toBe(other.id);
    expect(payment()).toEqual(before); expect(canClaim(Q)).toBe(true);
  });

  it('does not resurrect a recipient removed inside the actual share observer', () => {
    recover(); const recipient = merc('gheed-removed-during-share');
    useMercStore.getState().setFieldedMerc(recipient.id); const before = structuredClone(hero());
    let fired = false;
    stops.push(useMercStore.subscribe(next => {
      if (fired || !Object.hasOwn(next.mercProgress, recipient.id)) return;
      fired = true; next.removeMerc(recipient.id);
    }));
    expect(claimQuestReward(Q)).toBe('grant-failed'); expect(fired).toBe(true);
    expect(useMercStore.getState().ownedMercs).toEqual([]);
    expect(useMercStore.getState().mercProgress).toEqual({}); expect(hero()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({}); expect(canClaim(Q)).toBe(true);
  });

  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER])(
    'fences invalid same-key addition %s at the actual shard observer while retaining a valid independent addition', amount => {
      recover(); const before = structuredClone(hero()); let fired = false;
      stops.push(useInventoryStore.subscribe(next => {
        if (fired || next.currencies['gem-shard'] !== 1) return;
        fired = true;
        expect(() => { next.addCurrency('gem-shard', amount); }).toThrow();
        next.addCurrency('gem-shard', 2); throw new Error('after independent validated addition');
      }));
      expect(claimQuestReward(Q)).toBe('grant-failed'); expect(fired).toBe(true);
      expect(useInventoryStore.getState().currencies['gem-shard']).toBe(2); expect(hero()).toEqual(before);
      expect(useInventoryStore.getState().questItems[sources[0] ?? '']?.state).toBe('owned');
      expect(useMapStore.getState().questProgress[Q]?.rewardClaimed).toBe(false);
      expect(useInventoryStore.getState().spendCurrency('gem-shard', 2)).toBe(true);
    });

  it('rejects a reward accessor before executing it or publishing any participant', () => {
    recover(); const before = payment(), authored = quests.loadQuests(); let getterCalls = 0;
    const changed = authored.map(row => row.id === Q ? { ...row, rewards: Object.defineProperty({}, 'xp', {
      enumerable: true, get: () => { getterCalls++; return 1000; }
    }) } : row);
    vi.spyOn(quests, 'loadQuests').mockReturnValue(changed);
    expect(canClaim(Q)).toBe(false); expect(claimQuestReward(Q)).toBe('unsupported-rewards');
    expect(getterCalls).toBe(0); expect(payment()).toEqual(before);
  });

  it('rolls back the final source while preserving an independent hero rename and unrelated currency', () => {
    recover(4); const before = payment(); let fired = false;
    stops.push(useInventoryStore.subscribe(next => {
      if (fired || !Object.hasOwn(next.questItems, required(sources[4]))) return;
      fired = true; next.addCurrency('independent-gheed', 9);
      usePlayerStore.setState({ player: { ...hero(), name: 'Independent rename' } });
    }));
    expect(recoverCountedQuestSource(required(sources[4]))).toBe('grant-failed'); expect(fired).toBe(true);
    expect(useInventoryStore.getState().questItems).toEqual(before.items);
    expect(useMapStore.getState().questProgress).toEqual(before.rows);
    expect(hero()).toEqual({ ...before.hero, name: 'Independent rename' });
    expect(useInventoryStore.getState().currencies).toEqual({ 'independent-gheed': 9 });
    expect(recoverCountedQuestSource(required(sources[4]))).toBe('ok'); expect(canClaim(Q)).toBe(true);
  });
});

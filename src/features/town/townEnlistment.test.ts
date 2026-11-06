import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import * as quests from '@/data/loaders/quests';
import * as towns from '@/data/loaders/towns';
import { TOWN_ENLISTMENTS, hasTownEnlistmentProof, type TownEnlistmentKey } from '@/engine/map/town-enlistment-quest';
import type { Item } from '@/engine/types/items';
import type { Player } from '@/engine/types/entities';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { withQuestTransaction } from '@/features/quests/questTransaction';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { createMercFromDef } from '@/stores/mercFactory';
import { abortSubAreaRun, hasActiveSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { canEnlistTownMercenary, townEnlistmentCandidates, selectTownEnlistmentRecruit, currentTownEnlistmentRecruit, enlistTownMercenary } from './townEnlistment';

// Fault fixtures intentionally mutate the captured actual object in place.
type WritableWitness<T> = { -readonly [Key in keyof T]: T[Key] };

const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const unlock = useMapStore.getState().isActUnlocked;
const stops: (() => void)[] = [];
const map = () => useMapStore.getState(), mercs = () => useMercStore.getState();
const bytes = () => JSON.stringify(stores.map(store => store.getState()));
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing town enlistment fixture'); return value; }
function prepare(key: TownEnlistmentKey) {
  const c = TOWN_ENLISTMENTS[key], prerequisite = c.prerequisite;
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Town enlistment', 'sorceress'), level: 18, equipment: [] });
  useMapStore.setState({ currentAct: Number(c.actId.slice(-1)), currentSubAreaId: 'areas/act1-blood-moor', isActUnlocked: () => true,
    questProgress: {
      ...(prerequisite ? { [prerequisite.quest]: { id: prerequisite.quest, status: 'completed' as const, rewardClaimed: false,
        objectives: Object.fromEntries(prerequisite.objectiveIds.map(id => [id, true])) } } : {}),
      [c.quest]: { id: c.quest, status: 'inProgress', rewardClaimed: false, objectives: { [c.objective]: false } }
    }, questReceipts: {} });
  return c;
}
function own(key: TownEnlistmentKey, suffix = 'retained') {
  const def = required(loadMercPool().pool.find(row => row.id === TOWN_ENLISTMENTS[key].mercId));
  const merc = createMercFromDef(def, suffix); Object.assign(merc.derivedStats, { life: 3, mana: 2 });
  mercs().addMerc(merc); return merc;
}
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); useMapStore.setState({ isActUnlocked: unlock }); __resetPersistenceForTests(); });

describe('finite captain enlistment actions', () => {
  it.each(['kashya', 'greiz', 'asheara'] as const)('earns %s through exact fresh action, with no income or remembered-area change', key => {
    const c = prepare(key), before = structuredClone({ hero: usePlayerStore.getState().player, inventory: useInventoryStore.getState().currencies });
    const def = required(loadMercPool().pool.find(row => row.id === c.mercId));
    expect(canEnlistTownMercenary(key)).toBe(true);
    expect(enlistTownMercenary(key, required(selectTownEnlistmentRecruit(key, null)))).toBe('ok');
    expect(mercs().ownedMercs).toEqual([createMercFromDef(def)]); expect(mercs().fieldedMercId).toBe(c.mercId);
    expect(hasTownEnlistmentProof(map().questProgress, map().questReceipts, c)).toBe(true);
    expect(map().questProgress[c.quest]?.rewardClaimed).toBe(false);
    expect(map().currentSubAreaId).toBe('areas/act1-blood-moor');
    expect(usePlayerStore.getState().player).toEqual(before.hero); expect(useInventoryStore.getState().currencies).toEqual(before.inventory);
    expect(enlistTownMercenary(key, null)).toBe('not-eligible');
  });
  it.each(['kashya', 'greiz', 'asheara'] as const)('retains the named actual %s choice, multiplicity, resources and investment', key => {
    prepare(key); const first = own(key, 'first'), selected = own(key, 'selected'); mercs().setFieldedMerc(first.id);
    useMercStore.setState(state => ({ mercProgress: { ...state.mercProgress, [selected.id]: { experience: 123, experienceToNextLevel: 777 } } }));
    const before = structuredClone({ ownedMercs: mercs().ownedMercs, mercProgress: mercs().mercProgress, mercEquipment: mercs().mercEquipment });
    expect(townEnlistmentCandidates(key)).toEqual([first, selected]); expect(selectTownEnlistmentRecruit(key, null)).toBeNull();
    const selection = required(selectTownEnlistmentRecruit(key, selected)); expect(currentTownEnlistmentRecruit(key, selection)).toBe(selected);
    expect(enlistTownMercenary(key, selection)).toBe('ok'); expect(mercs().fieldedMercId).toBe(selected.id);
    expect({ ownedMercs: mercs().ownedMercs, mercProgress: mercs().mercProgress, mercEquipment: mercs().mercEquipment }).toEqual(before);
    expect(mercs().ownedMercs[1]).toBe(selected);
  });
  it.each([['kashya', 1], ['greiz', 12], ['asheara', 18]] as const)('uses the existing %s hero gate=%s separately from factory level', (key, gate) => {
    prepare(key); const hero = required(usePlayerStore.getState().player) as WritableWitness<Player>;
    hero.level = gate - 1; expect(canEnlistTownMercenary(key)).toBe(false);
    hero.level = gate; expect(canEnlistTownMercenary(key)).toBe(true);
    expect(enlistTownMercenary(key, required(selectTownEnlistmentRecruit(key, null)))).toBe('ok');
    expect(mercs().ownedMercs[0]?.level).toBe(key === 'kashya' ? 3 : key === 'greiz' ? 10 : 16);
  });
  it('requires an actual Blood Raven kill and ordered current-town return without main Claim', () => {
    const c = prepare('kashya'), main = required(c.prerequisite);
    map().updateQuestProgress(main.quest, { status: 'inProgress', objectives: { 'obj-kill-blood-raven': false, 'obj-return': false, legacy: true } });
    map().recordNpcTalk(c.npc); expect(canEnlistTownMercenary('kashya')).toBe(false);
    expect(map().questProgress[main.quest]?.objectives['obj-return']).toBe(false);
    map().recordMonsterKills({ actId: c.actId, areaId: 'areas/act1-burial-grounds', archetypeIds: ['monsters/act1.blood-raven'] });
    expect(canEnlistTownMercenary('kashya')).toBe(false);
    map().recordNpcTalk(c.npc); expect(map().questProgress[main.quest]).toMatchObject({ status: 'completed', rewardClaimed: false, objectives: { legacy: true } });
    expect(enlistTownMercenary('kashya', required(selectTownEnlistmentRecruit('kashya', null)))).toBe('ok');
  });
  it('accepts a qualified Radament kill before main Claim or Book ownership/Read', () => {
    const c = prepare('greiz'), main = required(c.prerequisite);
    map().updateQuestProgress(main.quest, { status: 'inProgress', objectives: { 'obj-kill-radament': false, legacy: true } });
    expect(canEnlistTownMercenary('greiz')).toBe(false);
    map().recordMonsterKills({ actId: c.actId, areaId: 'areas/act2-far-oasis', archetypeIds: ['monsters/act2.radament'] });
    expect(canEnlistTownMercenary('greiz')).toBe(true); expect(useInventoryStore.getState().questItems).toEqual({});
    expect(map().questProgress[main.quest]?.rewardClaimed).toBe(false);
  });
  it.each(['quest', 'chapter-clear'] as const)('uses Asheara existing ActIII unlock via %s without an extra main prerequisite', route => {
    prepare('asheara'); useMapStore.setState({ isActUnlocked: unlock, questProgress: {
      ...map().questProgress, ...(route === 'quest' ? { 'quests/act2-seven-tombs': { id: 'quests/act2-seven-tombs', status: 'completed', objectives: {} } } : {})
    }, clearedSubAreas: route === 'chapter-clear' ? ['areas/act2-tomb-of-tal-rasha'] : [] });
    expect(map().isActUnlocked(3)).toBe(true); expect(canEnlistTownMercenary('asheara')).toBe(true);
  });
  it.each(['missing-main', 'main-flag', 'claimed', 'wrong-side', 'extra-objective', 'act', 'npc', 'locked', 'nightmare', 'loading', 'no-player', 'combat', 'orphan-progress', 'duplicate-id'] as const)('refuses %s without publication', fault => {
    const c = prepare('greiz'), selection = required(selectTownEnlistmentRecruit('greiz', null));
    if (fault === 'missing-main') useMapStore.setState(state => { const rows = { ...state.questProgress }; Reflect.deleteProperty(rows, required(c.prerequisite).quest); return { questProgress: rows }; });
    if (fault === 'main-flag') required(map().questProgress[required(c.prerequisite).quest]).objectives['obj-kill-radament'] = false;
    if (fault === 'claimed') map().updateQuestProgress(c.quest, { rewardClaimed: true });
    if (fault === 'wrong-side') map().updateQuestProgress(c.quest, { id: 'wrong' });
    if (fault === 'extra-objective') map().updateQuestProgress(c.quest, { objectives: { [c.objective]: false, extra: false } });
    if (fault === 'act') useMapStore.setState({ currentAct: 1 });
    if (fault === 'npc') vi.spyOn(towns, 'loadTownNpcs').mockReturnValue([]);
    if (fault === 'locked') useMapStore.setState({ isActUnlocked: () => false });
    if (fault === 'nightmare') useMapStore.setState({ selectedDifficulty: 'nightmare' });
    if (fault === 'loading') useHydrationStore.getState().setStatus('loading');
    if (fault === 'no-player') usePlayerStore.getState().reset();
    if (fault === 'combat') useCombatStore.setState({ inCombat: true });
    if (fault === 'orphan-progress') useMercStore.setState({ mercProgress: { [c.mercId]: { experience: 99, experienceToNextLevel: 777 } } });
    if (fault === 'duplicate-id') { const merc = own('greiz'); useMercStore.setState({ ownedMercs: [merc, merc] }); }
    const before = bytes(); expect(enlistTownMercenary('greiz', selection)).not.toBe('ok'); expect(bytes()).toBe(before);
  });
  it.each(['lookalike', 'replace', 'merc', 'progress', 'hero', 'equipment-map', 'definition', 'quest', 'key-switch'] as const)('refuses stale %s actual witness', fault => {
    const c = prepare('greiz'), selected = own('greiz');
    const values = new Map([['statMods.life', 7]]), blade: Item = { id: 'retained-gear', baseId: 'items/base/wp1h-short-sword', rarity: 'magic',
      level: 1, equipped: true, identified: true, affixes: [{ affixId: 'legacy', values }] };
    useMercStore.setState({ mercEquipment: { [selected.id]: { weapon: blade } } });
    const selection = required(selectTownEnlistmentRecruit('greiz', selected));
    if (fault === 'lookalike') { expect(selectTownEnlistmentRecruit('greiz', structuredClone(selected))).toBeNull(); return; }
    if (fault === 'replace') useMercStore.setState({ ownedMercs: [structuredClone(selected)] });
    if (fault === 'merc') (selected.derivedStats as WritableWitness<typeof selected.derivedStats>).life++;
    if (fault === 'progress') required(mercs().mercProgress[selected.id]).experience++;
    if (fault === 'hero') (required(usePlayerStore.getState().player) as WritableWitness<Player>).experience++;
    if (fault === 'equipment-map') values.set('statMods.life', 999);
    if (fault === 'definition') selection.definitionBefore.baseStats.strength++;
    if (fault === 'quest') {
      const all = quests.loadQuests(); vi.spyOn(quests, 'loadQuests').mockReturnValue(all.map(row => row.id === c.quest ? { ...row, name: 'changed' } : row));
    }
    if (fault === 'key-switch') { expect(currentTownEnlistmentRecruit('kashya', selection)).toBeNull(); expect(enlistTownMercenary('kashya', selection)).toBe('not-eligible'); return; }
    const before = bytes(); expect(currentTownEnlistmentRecruit('greiz', selection)).toBeNull(); expect(enlistTownMercenary('greiz', selection)).toBe('not-eligible'); expect(bytes()).toBe(before);
  });
  it('refuses a retained fresh choice after matching ownership appears', () => {
    prepare('greiz'); const selection = required(selectTownEnlistmentRecruit('greiz', null)); own('greiz');
    const before = bytes(); expect(enlistTownMercenary('greiz', selection)).toBe('not-eligible'); expect(bytes()).toBe(before);
  });
  it('ordinary Hire/addMerc/fielding grants no proof; completed proofless history still needs confirmation', () => {
    const c = prepare('greiz'), def = required(loadMercPool().pool.find(row => row.id === c.mercId));
    expect(mercs().hireMerc(def).ok).toBe(true); expect(map().questReceipts[c.proof]).toBeUndefined();
    map().updateQuestProgress(c.quest, { status: 'completed', objectives: { [c.objective]: true } });
    expect(enlistTownMercenary('greiz', required(selectTownEnlistmentRecruit('greiz', required(mercs().ownedMercs[0]))))).toBe('ok');
  });
  it('refuses a paused actual active run and holds the shared lease', () => {
    prepare('greiz'); const selection = required(selectTownEnlistmentRecruit('greiz', null));
    expect(withQuestTransaction(() => enlistTownMercenary('greiz', selection))).toBe('claim-in-progress');
    map().setCurrentLocation(1, 'areas/act1-blood-moor'); expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
    useCombatStore.setState({ inCombat: false }); expect(hasActiveSubAreaRun()).toBe(true);
    expect(enlistTownMercenary('greiz', selection)).toBe('combat-active');
  });
  it.each(['throw-before-merc', 'throw-after-merc', 'silent-merc', 'throw-after-proof', 'rename-created'] as const)('restores a failed fresh action after %s', fault => {
    const c = prepare('greiz'), selection = required(selectTownEnlistmentRecruit('greiz', null)), rows = structuredClone(map().questProgress);
    if (fault === 'throw-after-proof') {
      const real = useMapStore.setState; vi.spyOn(useMapStore, 'setState').mockImplementationOnce(update => { real(update); throw new Error('after source'); });
    } else if (fault === 'rename-created') {
      let fired = false; stops.push(useMercStore.subscribe(() => { if (!fired && mercs().ownedMercs.length) { fired = true; Object.assign(required(mercs().ownedMercs[0]), { id: 'renamed-created' }); } }));
    } else {
      const real = useMercStore.setState; vi.spyOn(useMercStore, 'setState').mockImplementationOnce(update => {
        if (fault === 'throw-before-merc') throw new Error('before merc'); if (fault === 'silent-merc') return; real(update); throw new Error('after merc');
      });
    }
    expect(enlistTownMercenary('greiz', selection)).toBe('grant-failed'); expect(mercs().ownedMercs).toEqual([]);
    expect(mercs().mercEquipment).toEqual({}); expect(mercs().mercProgress).toEqual({}); expect(mercs().fieldedMercId).toBeNull();
    expect(map().questProgress).toEqual(rows); expect(map().questReceipts[c.proof]).toBeUndefined();
  });
  it.each(['dismiss', 'field', 'away-back', 'hero-xp', 'main-change', 'merc-change', 'source-change'] as const)('restores owned source while preserving independent %s', fault => {
    const c = prepare('greiz'), first = own('greiz', 'first'), selected = own('greiz', 'selected'); mercs().setFieldedMerc(first.id);
    const selection = required(selectTownEnlistmentRecruit('greiz', selected)), side = structuredClone(map().questProgress[c.quest]);
    let fired = false; stops.push(useMapStore.subscribe(() => {
      if (fired) return; fired = true; useInventoryStore.setState(state => ({ currencies: { ...state.currencies, gems: 7 } }));
      if (fault === 'dismiss') mercs().removeMerc(selected.id);
      if (fault === 'field') mercs().setFieldedMerc(null);
      if (fault === 'away-back') { mercs().setFieldedMerc(null); mercs().setFieldedMerc(selected.id); }
      if (fault === 'hero-xp') usePlayerStore.getState().gainExperience(5);
      if (fault === 'main-change') required(map().questProgress[required(c.prerequisite).quest]).objectives.legacy = true;
      if (fault === 'merc-change') (selected.derivedStats as WritableWitness<typeof selected.derivedStats>).life = 999;
      if (fault === 'source-change') required(map().questProgress[c.quest]).objectives[c.objective] = false;
    }));
    expect(enlistTownMercenary('greiz', selection)).toBe('grant-failed'); expect(map().questProgress[c.quest]).toEqual(side);
    expect(map().questReceipts[c.proof]).toBeUndefined(); expect(useInventoryStore.getState().currencies.gems).toBe(7);
    if (fault === 'dismiss') { expect(mercs().ownedMercs).toEqual([first]); expect(mercs().fieldedMercId).toBeNull(); }
    if (fault === 'field') expect(mercs().fieldedMercId).toBeNull();
    if (fault === 'away-back') expect(mercs().fieldedMercId).toBe(selected.id);
    if (fault === 'hero-xp') expect(usePlayerStore.getState().player?.experience).toBe(5);
    if (fault === 'main-change') expect(map().questProgress[required(c.prerequisite).quest]?.objectives.legacy).toBe(true);
    if (fault === 'merc-change') expect(mercs().ownedMercs[1]?.derivedStats.life).toBe(3);
  });
});

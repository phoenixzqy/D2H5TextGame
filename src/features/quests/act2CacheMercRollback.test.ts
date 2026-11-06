import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from '@/stores/mercFactory';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { captureAct2CacheMercParticipant, planAct2CacheMercAward, type Act2CacheMercJournal } from './act2CacheMercRollback';
const mercs = () => useMercStore.getState();
const journals: Act2CacheMercJournal[] = [], stops: (() => void)[] = [];
function recruit(suffix = 'actual') {
  const definition = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-trainee');
  if (!definition) throw new Error('Missing cache merc fixture');
  const fresh = createMercFromDef(definition, suffix);
  return { ...fresh, derivedStats: { ...fresh.derivedStats, life: 7, mana: 3 } };
}
function current(id: string) { const result = mercs().ownedMercs.find(actor => actor.id === id); if (!result) throw new Error('Missing recipient'); return result; }
function capture() { const actor = mercs().ownedMercs[0]; if (!actor) throw new Error('Missing actual recipient'); const journal = captureAct2CacheMercParticipant(actor); journals.push(journal); return { actor, journal }; }
beforeEach(() => { mercs().reset(); const actor = recruit(); mercs().addMerc(actor); mercs().setFieldedMerc(actor.id); });
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); journals.splice(0).forEach(journal => { journal.dispose(); }); });
describe('cache actual-recipient delta journal', () => {
  it.each(['no-op', 'throw-before', 'throw-after'] as const)('removes only actual owned progression for %s publication', mode => {
    const { actor, journal } = capture(), before = structuredClone(actor), beforeProgress = structuredClone(mercs().getMercProgress(actor.id));
    const expected = planAct2CacheMercAward(actor, beforeProgress, 3750);
    const operation = () => { journal.publish(expected, () => {
      if (mode === 'throw-before') throw new Error('before write');
      if (mode !== 'no-op') { mercs().addExperience(actor.id, 3750); throw new Error('after write'); }
    }); };
    if (mode === 'no-op') operation(); else expect(operation).toThrow();
    journal.restore(); journal.verifyRestored(); expect(current(actor.id)).toEqual(before); expect(mercs().getMercProgress(actor.id)).toEqual(beforeProgress);
  });
  it.each([2, 2000, 10000])('replays independent real +%s from an early throwing nested listener without own levels', amount => {
    let fired = false;
    const actor = mercs().ownedMercs[0]; if (!actor) throw new Error('Missing fixture');
    const baseline = structuredClone(actor), progress = structuredClone(mercs().getMercProgress(actor.id));
    stops.push(useMercStore.subscribe(() => { if (fired) return; fired = true; mercs().addExperience(actor.id, amount); throw new Error('nested independent actual award'); }));
    const { journal } = capture(), expected = planAct2CacheMercAward(actor, progress, 3750);
    expect(() => { journal.publish(expected, () => { mercs().addExperience(actor.id, 3750); }); }).toThrow();
    journal.restore(); journal.verifyRestored();
    const independent = planAct2CacheMercAward(baseline, progress, amount);
    expect(current(actor.id)).toEqual(independent.actor); expect(mercs().getMercProgress(actor.id)).toEqual(independent.progress);
  });
  it.each([false, true])('preserves progress-key absence unless an independent real award creates it (%s)', independent => {
    useMercStore.setState({ mercProgress: {} }); const { actor, journal } = capture();
    journal.publish(planAct2CacheMercAward(actor, mercs().getMercProgress(actor.id), 2250), () => { mercs().addExperience(actor.id, 2250); });
    if (independent) mercs().addExperience(actor.id, 2);
    journal.restore(); journal.verifyRestored(); expect(Object.hasOwn(mercs().mercProgress, actor.id)).toBe(independent);
    expect(mercs().getMercProgress(actor.id)).toEqual({ experience: independent ? 2 : 0, experienceToNextLevel: mercXpForLevel(actor.level) });
  });
  it.each([2, 2000])('preserves independent real XP%s plus later damage and positive resource deltas', independent => {
    const { actor, journal } = capture(), baseline = structuredClone(actor), progress = structuredClone(mercs().getMercProgress(actor.id));
    journal.publish(planAct2CacheMercAward(actor, progress, 3750), () => { mercs().addExperience(actor.id, 3750); });
    mercs().addExperience(actor.id, independent);
    useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.map(row => row.id === actor.id ? { ...row,
      derivedStats: { ...row.derivedStats, life: 2, mana: row.derivedStats.mana + 1 } } : row) }));
    journal.restore(); journal.verifyRestored();
    const expected = planAct2CacheMercAward(baseline, progress, independent);
    expect(current(actor.id)).toEqual({ ...expected.actor, derivedStats: { ...expected.actor.derivedStats, life: 2, mana: baseline.derivedStats.mana + 1 } });
    expect(mercs().getMercProgress(actor.id)).toEqual(expected.progress);
  });
  it('preserves raw investments, current damage, equipment and away/back fielding', () => {
    const { actor, journal } = capture(), before = structuredClone(actor);
    journal.publish(planAct2CacheMercAward(actor, mercs().getMercProgress(actor.id), 3750), () => { mercs().addExperience(actor.id, 3750); });
    const item = { id: 'independent-merc-ring', baseId: 'items/base/ring', rarity: 'normal' as const, level: 1, identified: true, equipped: true, equipSlot: 'ring-left' as const };
    useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.map(row => row.id === actor.id ? { ...row, equipment: [item],
      coreStats: { ...row.coreStats, strength: row.coreStats.strength + 3 },
      derivedStats: { ...row.derivedStats, defense: row.derivedStats.defense + 9, life: 2, mana: 1 } } : row),
      mercEquipment: { ...state.mercEquipment, [actor.id]: { 'ring-left': item } } }));
    mercs().setFieldedMerc(null); mercs().setFieldedMerc(actor.id); journal.restore(); journal.verifyRestored();
    expect(current(actor.id).level).toBe(before.level); expect(current(actor.id).coreStats.strength).toBe(before.coreStats.strength + 3);
    expect(current(actor.id).derivedStats).toMatchObject({ defense: before.derivedStats.defense + 9, life: 2, mana: 1 });
    expect(current(actor.id).equipment).toEqual([item]); expect(mercs().mercEquipment[actor.id]?.['ring-left']).toBe(item); expect(mercs().fieldedMercId).toBe(actor.id);
  });
  it.each([false, true])('does not resurrect a removed actor or rewind a foreign same-ID replacement (%s)', replacement => {
    const { actor, journal } = capture();
    journal.publish(planAct2CacheMercAward(actor, mercs().getMercProgress(actor.id), 3750), () => { mercs().addExperience(actor.id, 3750); });
    mercs().removeMerc(actor.id);
    const foreign = { ...structuredClone(actor), name: 'foreign same ID' };
    if (replacement) { mercs().addMerc(foreign); mercs().addExperience(foreign.id, 2); }
    const foreignProgress = structuredClone(mercs().mercProgress);
    journal.restore(); journal.verifyRestored(); expect(mercs().ownedMercs).toEqual(replacement ? [foreign] : []);
    expect(mercs().mercProgress).toEqual(foreignProgress);
  });
});

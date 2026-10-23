/**
 * mercStore tests — Bug #7 dismiss, Bug #8 equipment slots, Bug #12 XP/level.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useMercStore, mercXpForLevel } from './mercStore';
import { useInventoryStore } from './inventoryStore';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { deriveStats } from '@/engine/progression/stats';
import type { CoreStats } from '@/engine/types/attributes';
import type { Mercenary } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';

const core: CoreStats = { strength: 10, dexterity: 10, vitality: 10, energy: 10 };

function makeMerc(id = 'mercs/act1-rogue-trainee', classId: string | null = 'rogue'): Mercenary {
  return {
    id,
    name: id,
    type: 'mercenary',
    team: 'player',
    level: 1,
    coreStats: { ...core },
    derivedStats: deriveStats(core, 1),
    statusEffects: [],
    cooldowns: [],
    skills: [],
    comboOrder: [],
    alive: true,
    turnOrder: 0,
    archetype: 'back',
    ...(classId !== null ? { classId } : {}),
    rarity: 'R',
    equipment: []
  } as Mercenary;
}

function item(id: string, baseId: string): Item {
  return { id, baseId, rarity: 'magic', level: 1, identified: true, equipped: false, affixes: [] };
}

beforeEach(() => {
  useMercStore.getState().reset();
  useInventoryStore.getState().reset();
});

describe('mercStore — dismissMerc (Bug #7)', () => {
  it('blocks dismissal while any item is equipped', () => {
    const m = makeMerc();
    useMercStore.getState().addMerc(m);
    // Inject equipment directly to avoid needing a real item-base lookup.
    const sword = item('it1', 'short-sword');
    useMercStore.setState((s) => ({
      mercEquipment: { ...s.mercEquipment, [m.id]: { weapon: sword } }
    }));
    const dismissed = useMercStore.getState().dismissMerc(m.id);
    expect(dismissed).toBe(false);
    expect(useMercStore.getState().ownedMercs).toHaveLength(1);
    expect(useMercStore.getState().hasEquippedItems(m.id)).toBe(true);
  });

  it('clears progress and equipment maps', () => {
    const m = makeMerc();
    useMercStore.getState().addMerc(m);
    useMercStore.getState().addExperience(m.id, 10);
    expect(useMercStore.getState().dismissMerc(m.id)).toBe(true);
    expect(useMercStore.getState().mercProgress[m.id]).toBeUndefined();
    expect(useMercStore.getState().mercEquipment[m.id]).toBeUndefined();
  });
});

describe('mercStore — equipOnMerc / unequipFromMerc (Bug #8)', () => {
  it('rejects items whose base slot does not match', () => {
    const m = makeMerc();
    useMercStore.getState().addMerc(m);
    // 'no-such-base' has no entry in item-bases → invalid.
    const source = item('it1', 'no-such-base');
    useInventoryStore.setState({ backpack: [source] });
    const result = useMercStore.getState().equipOnMerc(m.id, 'weapon', source);
    expect(result).toEqual({ ok: false, reason: 'incompatible_slot' });
    expect(useMercStore.getState().getMercEquipment(m.id).weapon ?? null).toBeNull();
    expect(useInventoryStore.getState().backpack).toEqual([source]);
  });

  it('unequipFromMerc transfers previously equipped item once and distinguishes refusal', () => {
    const m = makeMerc();
    useMercStore.getState().addMerc(m);
    const it = item('it1', 'short-sword');
    useMercStore.setState((s) => ({
      mercEquipment: { ...s.mercEquipment, [m.id]: { weapon: it } }
    }));
    expect(useMercStore.getState().unequipFromMerc(m.id, 'weapon')).toEqual({ ok: true });
    expect(useInventoryStore.getState().backpack).toEqual([{ ...it, equipped: false }]);
    expect(useMercStore.getState().getMercEquipment(m.id).weapon).toBeNull();
    expect(useMercStore.getState().unequipFromMerc(m.id, 'weapon')).toEqual({ ok: false, reason: 'not_found' });
  });
});

describe('mercStore — addExperience / shareExperienceWithFielded (Bug #12)', () => {
  it('accumulates XP without level-up below threshold', () => {
    const m = makeMerc();
    useMercStore.getState().addMerc(m);
    const result = useMercStore.getState().addExperience(m.id, 10);
    expect(result.levelsGained).toBe(0);
    expect(useMercStore.getState().mercProgress[m.id]?.experience).toBe(10);
  });

  it('levels up when XP crosses the threshold and bumps stats', () => {
    const m = makeMerc(); // rogue: life+8, str+1, dex+3, energy+1
    useMercStore.getState().addMerc(m);
    const before = useMercStore.getState().ownedMercs[0];
    if (!before) throw new Error('merc not added');
    const need = mercXpForLevel(1);
    const result = useMercStore.getState().addExperience(m.id, need + 5);
    expect(result.levelsGained).toBe(1);
    expect(result.newLevel).toBe(2);
    const after = useMercStore.getState().ownedMercs[0];
    if (!after) throw new Error('merc missing post-grant');
    expect(after.level).toBe(2);
    expect(after.coreStats.strength).toBe(before.coreStats.strength + 1);
    expect(after.coreStats.dexterity).toBe(before.coreStats.dexterity + 3);
    expect(after.coreStats.energy).toBe(before.coreStats.energy + 1);
    expect(after.derivedStats.lifeMax).toBe(before.derivedStats.lifeMax + 8);
    expect(useMercStore.getState().mercProgress[m.id]?.experience).toBe(5);
  });

  it('cascades multiple level-ups in a single grant', () => {
    const m = makeMerc();
    useMercStore.getState().addMerc(m);
    const huge = mercXpForLevel(1) + mercXpForLevel(2) + 1;
    const result = useMercStore.getState().addExperience(m.id, huge);
    expect(result.levelsGained).toBeGreaterThanOrEqual(2);
  });

  it('shareExperienceWithFielded only grants when a merc is fielded', () => {
    const m = makeMerc();
    useMercStore.getState().addMerc(m);
    useMercStore.getState().shareExperienceWithFielded(100);
    expect(useMercStore.getState().mercProgress[m.id]?.experience ?? 0).toBe(0);
    useMercStore.getState().setFieldedMerc(m.id);
    useMercStore.getState().shareExperienceWithFielded(20);
    expect(useMercStore.getState().mercProgress[m.id]?.experience).toBe(15); // 75% share
  });
});

describe('mercStore — per-class progression (Bug #12)', () => {
  it('applies distinct gains for different classes', () => {
    const rogue = makeMerc('mercs/test-rogue', 'rogue');
    const barb = makeMerc('mercs/test-barb', 'barbarian');
    useMercStore.getState().addMerc(rogue);
    useMercStore.getState().addMerc(barb);
    const rBefore = useMercStore.getState().ownedMercs.find((x) => x.id === rogue.id);
    const bBefore = useMercStore.getState().ownedMercs.find((x) => x.id === barb.id);
    if (!rBefore || !bBefore) throw new Error('mercs not added');

    const need = mercXpForLevel(1);
    useMercStore.getState().addExperience(rogue.id, need);
    useMercStore.getState().addExperience(barb.id, need);

    const rAfter = useMercStore.getState().ownedMercs.find((x) => x.id === rogue.id);
    const bAfter = useMercStore.getState().ownedMercs.find((x) => x.id === barb.id);
    if (!rAfter || !bAfter) throw new Error('mercs gone');

    // rogue: dex+3, life+8, str+1
    expect(rAfter.coreStats.dexterity - rBefore.coreStats.dexterity).toBe(3);
    expect(rAfter.derivedStats.lifeMax - rBefore.derivedStats.lifeMax).toBe(8);
    // barbarian: str+3, dex+2, life+16
    expect(bAfter.coreStats.strength - bBefore.coreStats.strength).toBe(3);
    expect(bAfter.coreStats.dexterity - bBefore.coreStats.dexterity).toBe(2);
    expect(bAfter.derivedStats.lifeMax - bBefore.derivedStats.lifeMax).toBe(16);

    // Distinct: rogue and barbarian must not gain identical stat blocks.
    expect(rAfter.coreStats.dexterity - rBefore.coreStats.dexterity)
      .not.toBe(bAfter.coreStats.dexterity - bBefore.coreStats.dexterity);
    expect(rAfter.derivedStats.lifeMax - rBefore.derivedStats.lifeMax)
      .not.toBe(bAfter.derivedStats.lifeMax - bBefore.derivedStats.lifeMax);
  });

  it('falls back to default gains for unknown class ids', () => {
    const unknown = makeMerc('mercs/test-unknown', 'no-such-class');
    useMercStore.getState().addMerc(unknown);
    const before = useMercStore.getState().ownedMercs.find((x) => x.id === unknown.id);
    if (!before) throw new Error('merc not added');
    const need = mercXpForLevel(1);
    useMercStore.getState().addExperience(unknown.id, need);
    const after = useMercStore.getState().ownedMercs.find((x) => x.id === unknown.id);
    if (!after) throw new Error('merc missing');
    // default: life+10, str+2, dex+1, energy+1
    expect(after.derivedStats.lifeMax - before.derivedStats.lifeMax).toBe(10);
    expect(after.coreStats.strength - before.coreStats.strength).toBe(2);
    expect(after.coreStats.dexterity - before.coreStats.dexterity).toBe(1);
    expect(after.coreStats.energy - before.coreStats.energy).toBe(1);
  });

  it('falls back to default when classId is missing entirely', () => {
    const noClass = makeMerc('mercs/test-noclass', null);
    useMercStore.getState().addMerc(noClass);
    const before = useMercStore.getState().ownedMercs.find((x) => x.id === noClass.id);
    if (!before) throw new Error('merc not added');
    useMercStore.getState().addExperience(noClass.id, mercXpForLevel(1));
    const after = useMercStore.getState().ownedMercs.find((x) => x.id === noClass.id);
    if (!after) throw new Error('merc missing');
    expect(after.derivedStats.lifeMax - before.derivedStats.lifeMax).toBe(10);
  });
});

describe('mercStore — XP curve sanity (Bug #12)', () => {
  it('is monotonic across levels 1..98', () => {
    for (let L = 1; L < 98; L++) {
      expect(mercXpForLevel(L + 1)).toBeGreaterThan(mercXpForLevel(L));
    }
  });

  it('produces finite, safe-integer values up to L=99', () => {
    const top = mercXpForLevel(99);
    expect(Number.isFinite(top)).toBe(true);
    expect(Number.isSafeInteger(top)).toBe(true);
    expect(top).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });

  it('matches design targets at L=1 and L=10', () => {
    expect(mercXpForLevel(1)).toBe(60);
    // floor(60 * 10 * 1.30^9) — keep as a regression anchor.
    expect(mercXpForLevel(10)).toBe(Math.floor(60 * 10 * Math.pow(1.30, 9)));
  });
});


describe('mercStore — level-aware new and missing progress (P13a)', () => {
  it.each([1, 3, 10])('initializes new level-%s mercs at their actual threshold', (level) => {
    const merc = { ...makeMerc(), level };
    useMercStore.getState().addMerc(merc);
    expect(useMercStore.getState().mercProgress[merc.id]).toEqual({
      experience: 0, experienceToNextLevel: mercXpForLevel(level)
    });
  });

  it.each([false, true])('keeps L10 stats and all 60XP without a phantom level (missing=%s)', (missing) => {
    const merc = { ...makeMerc(), level: 10 };
    if (missing) useMercStore.setState({ ownedMercs: [merc] });
    else useMercStore.getState().addMerc(merc);
    expect(useMercStore.getState().addExperience(merc.id, 60)).toEqual({ levelsGained: 0, newLevel: 10 });
    expect(useMercStore.getState().ownedMercs[0]).toBe(merc);
    expect(useMercStore.getState().getMercProgress(merc.id)).toEqual({ experience: 60, experienceToNextLevel: 6362 });
  });

  it('projects missing progress from the current owned level without publishing state', () => {
    const merc = { ...makeMerc(), level: 10 };
    useMercStore.setState({ ownedMercs: [merc] });
    const before = useMercStore.getState();
    expect(before.getMercProgress(merc.id)).toEqual({ experience: 0, experienceToNextLevel: 6362 });
    expect(useMercStore.getState()).toBe(before);
    expect(before.mercProgress).toEqual({});
    useMercStore.getState().upgradeMerc(merc.id);
    const updated = useMercStore.getState();
    expect(updated.getMercProgress(merc.id)).toEqual({ experience: 0, experienceToNextLevel: mercXpForLevel(11) });
    expect(useMercStore.getState()).toBe(updated);
    expect(updated.mercProgress).toBe(before.mercProgress);
  });

  it.each([
    { amount: 6361, levels: 0, remainder: 6361, attack: 15, manaMax: 65 },
    { amount: 6362, levels: 1, remainder: 0, attack: 18, manaMax: 70 },
    { amount: 6362 + 7, levels: 1, remainder: 7, attack: 18, manaMax: 70 },
    { amount: 6362 + mercXpForLevel(11) + 9, levels: 2, remainder: 9, attack: 22, manaMax: 76 }
  ])('preserves exact L10 thresholds and gains for $amount XP', ({ amount, levels, remainder, attack, manaMax }) => {
    const merc = { ...makeMerc(), level: 10 };
    useMercStore.getState().addMerc(merc);
    expect(useMercStore.getState().addExperience(merc.id, amount)).toEqual({ levelsGained: levels, newLevel: 10 + levels });
    expect(useMercStore.getState().getMercProgress(merc.id)).toEqual({
      experience: remainder, experienceToNextLevel: mercXpForLevel(10 + levels)
    });
    const grown = useMercStore.getState().ownedMercs[0];
    if (!grown) throw new Error('Missing grown merc');
    // This fixture stores an L1 baseline at L10: retain its offsets and add
    // only the shared L10→new-level contributions, including floor boundaries.
    expect(grown.derivedStats.physDodge).toBeCloseTo(0.07 + 0.006 * levels, 12);
    expect({ ...grown, derivedStats: { ...grown.derivedStats,
      physDodge: merc.derivedStats.physDodge } }).toEqual({
      ...merc, level: 10 + levels,
      coreStats: { ...merc.coreStats, strength: merc.coreStats.strength + levels,
        dexterity: merc.coreStats.dexterity + 3 * levels, energy: merc.coreStats.energy + levels },
      derivedStats: { ...merc.derivedStats, life: merc.derivedStats.life + 8 * levels,
        lifeMax: merc.derivedStats.lifeMax + 8 * levels, attack, manaMax,
        defense: 20 + 3 * levels, attackSpeed: 110 + 3 * levels }
    });
  });

  it('initializes an actual authored hire at reqLevel3 and its 304XP threshold', () => {
    const def = loadMercHireRoster().flatMap((act) => act.mercs).find((entry) => entry.reqLevel === 3);
    if (!def) throw new Error('Missing authored level-three hire');
    expect(useMercStore.getState().hireMerc(def)).toEqual({ ok: true, mercId: def.id });
    expect(useMercStore.getState().getFieldedMerc()?.level).toBe(3);
    expect(useMercStore.getState().getMercProgress(def.id)).toEqual({ experience: 0, experienceToNextLevel: 304 });
  });

  it('preserves explicit saved custom thresholds through add/read/award', () => {
    const merc = { ...makeMerc(), level: 10 };
    const explicit = { experience: 17, experienceToNextLevel: 50 };
    useMercStore.setState({ mercProgress: { [merc.id]: explicit } });
    useMercStore.getState().addMerc(merc);
    expect(useMercStore.getState().getMercProgress(merc.id)).toBe(explicit);
    expect(useMercStore.getState().addExperience(merc.id, 32)).toEqual({ levelsGained: 0, newLevel: 10 });
    expect(useMercStore.getState().getMercProgress(merc.id)).toEqual({ experience: 49, experienceToNextLevel: 50 });
    expect(explicit).toEqual({ experience: 17, experienceToNextLevel: 50 });
    expect(useMercStore.getState().addExperience(merc.id, 1)).toEqual({ levelsGained: 1, newLevel: 11 });
    expect(useMercStore.getState().getMercProgress(merc.id)).toEqual({ experience: 0, experienceToNextLevel: mercXpForLevel(11) });
  });

  it('keeps unknown reads and awards harmless and missing progress nonpositive awards unchanged', () => {
    const merc = { ...makeMerc(), level: 10 };
    useMercStore.setState({ ownedMercs: [merc] });
    const before = useMercStore.getState();
    expect(before.getMercProgress('unknown')).toEqual({ experience: 0, experienceToNextLevel: 60 });
    expect(before.addExperience('unknown', 100)).toEqual({ levelsGained: 0, newLevel: 1 });
    expect(before.addExperience(merc.id, 0)).toEqual({ levelsGained: 0, newLevel: 10 });
    expect(before.addExperience(merc.id, -1)).toEqual({ levelsGained: 0, newLevel: 10 });
    before.shareExperienceWithFielded(100);
    expect(useMercStore.getState()).toBe(before);
    expect(before.mercProgress).toEqual({});
  });
});

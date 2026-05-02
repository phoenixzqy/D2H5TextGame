/**
 * mercStore tests — Bug #7 dismiss, Bug #8 equipment slots, Bug #12 XP/level.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMercStore, mercXpForLevel } from './mercStore';
import { useInventoryStore } from './inventoryStore';
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
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // 'no-such-base' has no entry in item-bases → invalid.
    const displaced = useMercStore.getState().equipOnMerc(m.id, 'weapon', item('it1', 'no-such-base'));
    expect(displaced).toBeNull();
    expect(useMercStore.getState().getMercEquipment(m.id).weapon ?? null).toBeNull();
    warn.mockRestore();
  });

  it('unequipFromMerc returns previously equipped item or null', () => {
    const m = makeMerc();
    useMercStore.getState().addMerc(m);
    const it = item('it1', 'short-sword');
    useMercStore.setState((s) => ({
      mercEquipment: { ...s.mercEquipment, [m.id]: { weapon: it } }
    }));
    const removed = useMercStore.getState().unequipFromMerc(m.id, 'weapon');
    expect(removed?.id).toBe('it1');
    expect(removed?.equipped).toBe(false);
    expect(useMercStore.getState().getMercEquipment(m.id).weapon).toBeNull();
    expect(useMercStore.getState().unequipFromMerc(m.id, 'weapon')).toBeNull();
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

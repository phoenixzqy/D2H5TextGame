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

function makeMerc(id = 'mercs/act1-rogue-trainee'): Mercenary {
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
    archetype: 'rogue',
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
  it('removes merc and returns equipped items via callback', () => {
    const m = makeMerc();
    useMercStore.getState().addMerc(m);
    // Inject equipment directly to avoid needing a real item-base lookup.
    const sword = item('it1', 'short-sword');
    useMercStore.setState((s) => ({
      mercEquipment: { ...s.mercEquipment, [m.id]: { weapon: sword } }
    }));
    const returned: Item[] = [];
    useMercStore.getState().dismissMerc(m.id, (it) => returned.push(it));
    expect(useMercStore.getState().ownedMercs).toHaveLength(0);
    expect(returned).toHaveLength(1);
    expect(returned[0]?.baseId).toBe('short-sword');
    expect(returned[0]?.equipped).toBe(false);
  });

  it('clears progress and equipment maps', () => {
    const m = makeMerc();
    useMercStore.getState().addMerc(m);
    useMercStore.getState().addExperience(m.id, 10);
    useMercStore.getState().dismissMerc(m.id, () => undefined);
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
    const m = makeMerc();
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
    expect(after.coreStats.dexterity).toBe(before.coreStats.dexterity + 1);
    expect(after.derivedStats.lifeMax).toBe(before.derivedStats.lifeMax + 5);
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
    expect(useMercStore.getState().mercProgress[m.id]?.experience).toBe(10); // 50% share
  });
});

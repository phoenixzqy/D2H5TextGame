import { withoutV24Fields, withV24Defaults } from '../../../tests/helpers/save-fixtures';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import paladinSkills from '../../data/skills/paladin.json';
import type { Player } from '../types/entities';
import { CURRENT_SAVE_VERSION, type SaveCurrent, type SaveV21 } from '../types/save';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateSave } from './validate';
import { runMigrations } from './migrate';

const ids = ['might', 'holy-fire', 'conviction', 'meditation', 'thorns', 'blessed-aim',
  'concentration', 'holy-freeze', 'holy-shock', 'sanctuary', 'fanaticism', 'prayer',
  'resist-fire', 'defiance', 'resist-cold', 'cleansing', 'resist-lightning', 'vigor',
  'redemption', 'salvation'] as const;
type ExpectedAura = `paladin.${typeof ids[number]}`;

function sample() {
  const hero = createMockPlayer('Aura keeper', 'paladin');
  return buildSave({ timestamp: 123, player: { ...hero, level: 30,
    derivedStats: { ...hero.derivedStats, life: 17, mana: 9 },
    respecsRemaining: { stat: 1, skill: 0 }, skillPoints: 3,
    skillLevels: { 'paladin.might': 2 }, skills: [{ id: 'mapped-skill', name: 'Map', description: '',
      trigger: 'active', target: 'single-enemy', cooldown: 1, cost: {}, minLevel: 1, level: 1,
      maxLevel: 20, synergies: new Map([['physical', 0.2]]) }] },
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 7 }, materials: { 'runes/el': 2 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false, combatSpeed: 1, autoCombat: false },
      idleState: { lastOnline: 100, offlineTime: 20, multiplierSecondsRemaining: 13, activeMultiplier: 2 },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 0, col: 0 }, mercPosition: { row: 0, col: 1 }, summonPositions: [] } });
}

describe('v22 complete canonical player aura save domain', () => {
  it('matches all twenty authored aura IDs and freezes the historical v21 type', () => {
    expect(CURRENT_SAVE_VERSION).toBe(24);
    expect(paladinSkills.filter(row => 'aura' in row && row.aura).map(row => row.id.replace('skills-paladin-', '')).sort())
      .toEqual([...ids].sort());
    expectTypeOf<SaveV21['player']['selectedAuraId']>().toEqualTypeOf<'paladin.might' | 'paladin.meditation' | undefined>();
    expectTypeOf<Player['selectedAuraId']>().toEqualTypeOf<ExpectedAura | undefined>();
    expectTypeOf<SaveCurrent['player']['selectedAuraId']>().toEqualTypeOf<ExpectedAura | undefined>();
  });

  it.each(ids)('round-trips canonical paladin.%s without changing resources or ownership', id => {
    const base = sample(), input = { ...base, player: { ...base.player, selectedAuraId: `paladin.${id}` } };
    const before = structuredClone(input);
    expect(validateSave(input)).toEqual(toJsonSafe(input));
    expect(decodeSave(input)).toEqual(input);
    expect(decodeSave(toJsonSafe(input))).toEqual(input);
    expect(input).toEqual(before);
  });

  it.each([undefined, 'paladin.might', 'paladin.meditation'])('migrates v21 selection %s by changing only version', selectedAuraId => {
    const base = withoutV24Fields(sample()), old = { ...base, version: 21, player: { ...base.player,
      ...(selectedAuraId ? { selectedAuraId } : {}) } };
    const before = structuredClone(old), expected = { ...old, version: 23 };
    const migrated = runMigrations(old, 23);
    expect(migrated).toEqual(expected);
    expect(Reflect.get(migrated, 'player')).toBe(old.player);
    expect(Reflect.get(migrated, 'inventory')).toBe(old.inventory);
    expect(runMigrations(old).player.skills[0]?.synergies).toBe(old.player.skills[0]?.synergies);
    expect(runMigrations(old)).toEqual(withV24Defaults(expected));
    expect(decodeSave(old)).toEqual(withV24Defaults(expected));
    expect(runMigrations(old, 21)).toBe(old);
    expect(old).toEqual(before);
  });

  it.each(ids.filter(id => id !== 'might' && id !== 'meditation'))('rejects future %s in v21 before widening', id => {
    const base = withoutV24Fields(sample()), old = { ...base, version: 21, player: { ...base.player, selectedAuraId: `paladin.${id}` } };
    const before = structuredClone(old);
    expect(() => runMigrations(old)).toThrow('Invalid save');
    expect(() => decodeSave(old)).toThrow('Invalid save');
    expect(old).toEqual(before);
  });

  it.each([undefined, null, '', 'paladin.Holy-Fire', 'paladin.holy_fire', 'skills-paladin-thorns',
    ' paladin.thorns', 'paladin.thorns ', 'paladin.holy-shield', 'paladin.unknown', {}, [], 1])(
    'rejects malformed present current selection %j', selectedAuraId => {
      const base = sample(), input = { ...base, player: { ...base.player, selectedAuraId } };
      const before = structuredClone(input);
      expect(() => validateSave(input)).toThrow('Invalid save');
      expect(() => decodeSave(input)).toThrow('Invalid save');
      expect(input).toEqual(before);
    });

  it('does not launder malformed reset counters through the v21 migration', () => {
    const base = withoutV24Fields(sample());
    for (const respecsRemaining of [undefined, null, { stat: 4, skill: 0 }, { stat: 0, skill: -1 }]) {
      const old = { ...base, version: 21, player: { ...base.player, respecsRemaining } };
      expect(() => runMigrations(old)).toThrow('Invalid save');
    }
  });
});

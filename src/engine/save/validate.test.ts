import { describe, expect, it } from 'vitest';
import { buildSave } from './serialize';
import { decodeSave } from './validate';
import { deriveStats } from '../progression/stats';

const coreStats = { strength: 10, dexterity: 25, vitality: 10, energy: 35 };
function sampleSave() {
  return buildSave({
    player: {
      id: 'hero',
      name: 'Hero',
      type: 'player',
      team: 'player',
      class: 'sorceress',
      level: 1,
      coreStats,
      derivedStats: deriveStats(coreStats, 1),
      statusEffects: [],
      cooldowns: [],
      skills: [],
      comboOrder: [],
      alive: true,
      turnOrder: 0,
      experience: 0,
      experienceToNextLevel: 100,
      statPoints: 0,
      skillPoints: 1,
      equipment: []
    },
    inventory: { backpack: [], stash: [], equipped: {}, currencies: {} },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: {
      currentAct: 1,
      currentSubAreaId: null,
      discoveredAreas: [],
      clearedSubAreas: [],
      questProgress: {}
    },
    meta: {
      settings: {
        locale: 'zh-CN',
        stealthMode: false,
        soundEnabled: true,
        musicEnabled: true,
        combatSpeed: 1,
        autoCombat: true
      },
      idleState: {
        lastOnline: 1000,
        offlineTime: 0,
        multiplierSecondsRemaining: 0,
        activeMultiplier: 1
      },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 }
    },
    formation: {
      playerPosition: { row: 1, col: 1 },
      mercPosition: { row: 0, col: 0 },
      summonPositions: []
    },
    timestamp: 1000
  });
}

describe('save boundary', () => {
  it('preserves a valid v7 save and optional legacy fields without mutation', () => {
    const save = sampleSave();
    const original = JSON.stringify(save);
    expect(decodeSave(save)).toEqual(save);
    expect(JSON.stringify(save)).toBe(original);
  });

  it('migrates valid v6 formation preferences without mutating the original', () => {
    const { formation: _formation, ...rest } = sampleSave();
    const legacy = { ...rest, version: 6 };
    expect(decodeSave(legacy).version).toBe(7);
    expect(decodeSave(legacy).formation.playerPosition).toEqual({ row: 1, col: 1 });
    expect(legacy).not.toHaveProperty('formation');
  });

  it('restores JSON-serialized legacy affix values and skill synergies as Maps', () => {
    const save = sampleSave();
    const withMaps = {
      ...save,
      inventory: {
        ...save.inventory,
        equipped: {
          weapon: {
            id: 'legacy-item',
            baseId: 'items/base/weapon-bow',
            rarity: 'normal',
            level: 1,
            identified: true,
            equipped: true,
            affixes: [{ affixId: 'legacy-affix', values: [['attack', 12]] }]
          }
        }
      },
      player: {
        ...save.player,
        skills: [
          {
            id: 'test-skill',
            name: 'Test',
            description: '',
            trigger: 'active',
            target: 'single-enemy',
            cooldown: 1,
            cost: {},
            minLevel: 1,
            level: 1,
            maxLevel: 20,
            synergies: [['physical', 0.2]]
          }
        ]
      }
    };
    const decoded = decodeSave(withMaps);
    const affix = decoded.inventory.equipped.weapon?.affixes?.[0];
    expect(affix && 'values' in affix && affix.values).toEqual(new Map([['attack', 12]]));
    expect(decoded.player.skills[0]?.synergies).toEqual(new Map([['physical', 0.2]]));
  });

  it.each([0, -1, 0.5, 91, 1e300])('rejects unsafe player level %s', (level) => {
    const save = sampleSave();
    expect(() => decodeSave({ ...save, player: { ...save.player, level } })).toThrow(
      'Invalid save'
    );
  });

  it.each([new Map([['attack', 'bad']]), new Map([['attack', Infinity]]), new Map([[3, 12]])])(
    'rejects corrupt native Maps loaded from IndexedDB %#',
    (values) => {
      const save = sampleSave();
      const corrupted = {
        ...save,
        inventory: {
          ...save.inventory,
          stash: [
            {
              id: 'bad-affix',
              baseId: 'items/base/weapon-bow',
              rarity: 'normal',
              level: 1,
              identified: true,
              equipped: false,
              affixes: [{ affixId: 'legacy', values }]
            }
          ]
        }
      };
      expect(() => decodeSave(corrupted)).toThrow('Invalid save');
    }
  );

  it.each([
    null,
    [],
    {},
    { version: 7 },
    { version: 8 },
    { version: NaN },
    { version: Infinity },
    { version: 6.5 },
    { version: -1 }
  ])('rejects invalid version/shape %#', (value) => {
    expect(() => decodeSave(value)).toThrow();
  });

  it.each([
    ['inventory', { ...sampleSave().inventory, backpack: [null] }],
    ['meta', { ...sampleSave().meta, settings: { locale: 'bad' } }],
    ['formation', { ...sampleSave().formation, mercPosition: { row: 3, col: 0 } }],
    ['player', { ...sampleSave().player, experience: Infinity }],
    ['map', { ...sampleSave().map, questProgress: { quest: { status: 'completed' } } }]
  ])('rejects malformed nested %s before hydration', (field, value) => {
    expect(() => decodeSave({ ...sampleSave(), [field]: value })).toThrow('Invalid save');
  });
});

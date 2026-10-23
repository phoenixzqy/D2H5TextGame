import { describe, expect, it } from 'vitest';
import definition from '@/data/endgame/worldstone-remnant.json';
import { endgameDefinition, parseEndgameDefinition } from '@/data/loaders/endgame';
import { getSkill } from '../skills/registry';
import { monsters } from '@/data/index';
import en from '@/i18n/locales/en/common.json';
import zh from '@/i18n/locales/zh-CN/common.json';

function required<T>(value: T | undefined): T { if (value === undefined) throw new Error('Missing authored fixture'); return value; }

describe('D14 finite endgame content boundary', () => {
  it('loads the approved finite authored dungeon with real reward consumers', () => {
    expect(endgameDefinition.id).toBe('endgame/worldstone-remnant');
    expect(endgameDefinition.monsterLevel).toBe(90);
    expect(endgameDefinition.entryCost).toEqual({});
    expect(endgameDefinition.lootProfile).toEqual({ act: 5, difficulty: 'normal' });
    expect(endgameDefinition.waves.map(wave => wave.spawns.reduce((sum, row) => sum + row.count, 0)))
      .toEqual([4, 4, 4, 3]);
    expect(endgameDefinition.modifiers.map(row => [row.id, row.completionMaterials])).toEqual([
      ['ashen', { 'gems/ruby/flawless': 1 }], ['glacial', { 'gems/sapphire/flawless': 1 }]
    ]);
    expect(endgameDefinition.achievement.reward).toEqual({ titleId: 'titles/worldstone-adapt',
      materials: { 'gems/ruby/perfect': 1, 'gems/sapphire/perfect': 1 } });
    expect(Object.isFrozen(endgameDefinition.waves[0]?.spawns)).toBe(true);
    expect(Object.isFrozen(endgameDefinition.modifiers[0]?.completionMaterials)).toBe(true);
  });
  it.each([
    ['root extra', (value: typeof definition) => Object.assign(value, { script: 'award' })],
    ['entry currency', (value: typeof definition) => Object.assign(value.entryCost, { shard: 1 })],
    ['duplicate modifier', (value: typeof definition) => { value.modifiers[1] = structuredClone(required(value.modifiers[0])); }],
    ['same modifier archetype', (value: typeof definition) => { required(value.modifiers[1]).archetypeId = required(value.modifiers[0]).archetypeId; }],
    ['unknown modifier', (value: typeof definition) => { required(value.modifiers[0]).id = 'unknown'; }],
    ['duplicate wave', (value: typeof definition) => { required(value.waves[1]).id = required(value.waves[0]).id; }],
    ['nonsequential wave', (value: typeof definition) => { required(value.waves[0]).id = 'worldstone-remnant/w20'; }],
    ['wave overflow', (value: typeof definition) => { required(required(value.waves[0]).spawns[0]).count = 21; }],
    ['zero spawn', (value: typeof definition) => { required(required(value.waves[0]).spawns[0]).count = 0; }],
    ['fractional spawn', (value: typeof definition) => { required(required(value.waves[0]).spawns[0]).count = 1.5; }],
    ['unknown monster', (value: typeof definition) => { required(value.modifiers[0]).archetypeId = 'monsters/act5.unknown'; }],
    ['ineligible boss', (value: typeof definition) => { required(required(value.waves[3]).spawns[0]).archetypeId = 'monsters/act5.succubus'; }],
    ['unknown table', (value: typeof definition) => { value.defaultLootTable = 'loot/missing'; }],
    ['unknown material', (value: typeof definition) => { Reflect.set(required(value.modifiers[0]), 'completionMaterials', { 'gems/missing': 1 }); }],
    ['zero cache', (value: typeof definition) => { required(value.modifiers[0]).completionMaterials = { 'gems/ruby/flawless': 0 }; }],
    ['unsafe cache', (value: typeof definition) => { required(value.modifiers[0]).completionMaterials = { 'gems/ruby/flawless': Number.MAX_SAFE_INTEGER + 1 }; }],
    ['unknown achievement field', (value: typeof definition) => Object.assign(value.achievement.reward, { xp: 10 })]
  ] as const)('refuses %s before returning content', (_name, corrupt) => {
    const value = structuredClone(definition);
    corrupt(value);
    expect(() => parseEndgameDefinition(value)).toThrow();
  });
  it('clones before freezing and leaves rejected or accepted caller-owned data unchanged', () => {
    const input = structuredClone(definition), before = structuredClone(input);
    const parsed = parseEndgameDefinition(input);
    expect(input).toEqual(before);
    expect(Object.isFrozen(input)).toBe(false);
    input.monsterLevel = 1;
    expect(parsed.monsterLevel).toBe(90);
  });
  it.each([
    ['ashen', 'monsters/act5.blood-lord', 'fire', 'monster-fire-breath', 'ignite'],
    ['glacial', 'monsters/act5.frozen-terror', 'cold', 'monster-frost-aura', 'chill']
  ] as const)('%s references a resistant monster with a registered damaging/status skill',
    (id, archetypeId, damageType, skillId, statusId) => {
      expect(endgameDefinition.modifiers.find(row => row.id === id)?.archetypeId).toBe(archetypeId);
      const monster = monsters.find(row => row.id === archetypeId);
      expect(monster?.resistances?.[damageType]).toBe(75);
      expect(monster?.skills).toContain(skillId);
      const damage = getSkill(skillId)?.effects.find(effect => effect.kind === 'damage' && effect.damageType === damageType);
      expect(damage?.kind === 'damage' && damage.applyStatus?.id).toBe(statusId);
    });
  it('resolves all authored display keys in both shipped locales', () => {
    const keys = [endgameDefinition.nameKey, ...endgameDefinition.modifiers.flatMap(row => [row.nameKey, row.descriptionKey]),
      'endgame.achievement.name', 'endgame.achievement.title'];
    for (const locale of [en, zh]) for (const key of keys) {
      expect(Object.hasOwn(locale, key)).toBe(true);
      expect(Reflect.get(locale, key)).toEqual(expect.any(String));
    }
  });
});

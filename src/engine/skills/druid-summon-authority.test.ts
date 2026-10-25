import { describe, expect, it } from 'vitest';
import {
  composeDruidSummonRanks,
  copyDruidSummonRanks,
  isDruidSummonBody,
  qualifyDruidSummon
} from './druid-summon-authority';
import { getSkill } from './registry';
import { buildSummon } from './summons';
import type { CombatUnit } from '../combat/types';

const owner: CombatUnit = {
  id: 'hero',
  name: 'Synthetic owner',
  side: 'player',
  kind: 'hero',
  level: 30,
  tier: 'trash',
  life: 100,
  mana: 100,
  stats: {
    life: 100,
    lifeMax: 100,
    mana: 100,
    manaMax: 100,
    attack: 1,
    defense: 0,
    magicResist: 0,
    attackSpeed: 100,
    critChance: 0,
    critDamage: 2,
    physDodge: 0,
    magicDodge: 0,
    magicFind: 0,
    goldFind: 0,
    resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
  },
  statuses: [],
  cooldowns: {},
  activeBuffIds: [],
  enraged: false,
  skillOrder: ['druid.raven'],
  skillLevels: { 'druid.raven': 1 },
  druidSummonRanks: { raven: 1 }
};
describe('copied native Druid summon authority', () => {
  it('copies and freezes without retaining or freezing caller references', () => {
    const input = { raven: 1 },
      copied = copyDruidSummonRanks(input);
    input.raven = 20;
    expect(copied).toEqual({ raven: 1 });
    expect(Object.isFrozen(copied)).toBe(true);
    expect(Object.isFrozen(input)).toBe(false);
  });
  it.each([
    undefined,
    null,
    [],
    { raven: 0 },
    { raven: 21 },
    { raven: 1.5 },
    { raven: NaN },
    { raven: Infinity },
    { raven: 1, foreign: 1 },
    JSON.parse('{"__proto__":1}') as unknown
  ])('disables the complete malformed projection %#', (input) => {
    expect(copyDruidSummonRanks(input)).toEqual({});
  });
  it('preserves direct rather than transitive D06 prerequisites', () => {
    expect(
      composeDruidSummonRanks({
        class: 'druid',
        level: 30,
        skillLevels: { 'druid.solar_creeper': 1, 'druid.carrion_vine': 1 },
        comboOrder: ['druid.solar_creeper']
      })
    ).toEqual({ solar_creeper: 1 });
  });
  it('qualifies only the exact original registered source and rank', () => {
    const skill = getSkill('druid.raven');
    if (!skill) throw new Error('Missing Raven');
    expect(qualifyDruidSummon(owner, skill, 1)).toBe('raven');
    for (const patch of [
      { manaCost: 0 },
      { id: 'foreign.raven' },
      { archetype: 'monster' },
      { minLevel: 0 },
      { effects: [] },
      { cooldown: 0 }
    ]) {
      expect(qualifyDruidSummon(owner, { ...skill, ...patch }, 1)).toBeUndefined();
    }
    expect(qualifyDruidSummon(owner, skill, 2)).toBeUndefined();
  });
  it.each<Partial<CombatUnit>>([
    { side: 'enemy' },
    { kind: 'merc' },
    { kind: 'summon' },
    { summon: true },
    { ownerId: 'x' },
    { summonOwnerId: 'x' },
    { life: 0 },
    { life: NaN },
    { level: 0 },
    { level: 1.5 },
    { druidSummonRanks: {} },
    { skillOrder: [] },
    { skillLevels: {} }
  ])('rejects ineligible owner %#', (patch) => {
    const skill = getSkill('druid.raven');
    if (!skill) throw new Error('Missing Raven');
    expect(qualifyDruidSummon({ ...owner, ...patch }, skill, 1)).toBeUndefined();
  });
  it('requires actual body ownership, side, kind, template and liveness', () => {
    const body = buildSummon(owner, 'raven');
    if (!body) throw new Error('Missing Raven body');
    expect(isDruidSummonBody(body, owner.id, 'raven')).toBe(true);
    const patches: Partial<CombatUnit>[] = [
      { id: owner.id },
      { side: 'enemy' },
      { kind: 'hero' },
      { summon: false },
      { summonOwnerId: 'x' },
      { ownerId: 'x' },
      { summonTemplateId: 'grizzly' },
      { life: 0 }
    ];
    for (const patch of patches)
      expect(isDruidSummonBody({ ...body, ...patch }, owner.id, 'raven')).toBe(false);
  });
});

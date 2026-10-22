import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/monsters.json';
import monsters from '../../data/monsters/act1.json';
import { resolveBloodRavenSkills } from './blood-raven';

describe('Blood Raven authored action boundary', () => {
  it('copies and deeply freezes exact action and monster definitions', () => {
    const rows = structuredClone(skills), creatures = structuredClone(monsters);
    const before = structuredClone([rows, creatures]);
    const out = resolveBloodRavenSkills(rows, creatures);
    expect([rows, creatures]).toEqual(before);
    const effect = out[0]?.effects[0];
    if (effect?.kind !== 'summon' || !effect.monsterDef) throw new Error('Missing monster summon');
    expect(Object.isFrozen(out)).toBe(true);
    expect(Object.isFrozen(effect.monsterDef.skills)).toBe(true);
    expect(Object.isFrozen(effect.monsterDef.life)).toBe(true);
    expect(effect.monsterDef).not.toBe(creatures.find(m => m.id === 'monsters/act1.zombie'));
    expect(out[1]).toMatchObject({ id: 'monster-blood-raven-fire-arrow', cooldown: 2, manaCost: 0,
      effects: [{ kind: 'damage', base: [35, 55], applyStatus: { id: 'burn', stacksOnApply: 2, durationMs: 3000 } }] });
  });
  it.each(['missing', 'duplicate'] as const)('rejects %s dedicated actions', mode => {
    const rows = skills.filter(r => mode !== 'missing' || r.id !== 'monster-blood-raven-raise-dead');
    if (mode === 'duplicate') {
      const first = skills[0];
      if (!first) throw new Error('Missing authored fixture');
      rows.push(first);
    }
    expect(() => resolveBloodRavenSkills(rows, monsters)).toThrow();
  });
  it.each([
    { count: 7 }, { count: 3, maxCount: 2 }, { refundOnDeath: true }, { archetypeId: 'unknown' }
  ])('rejects unsupported monster batch metadata %j', change => {
    const rows = skills.map(r => r.id === 'monster-blood-raven-raise-dead'
      ? { ...r, monsterSummon: { ...r.monsterSummon, ...change } } : r);
    expect(() => resolveBloodRavenSkills(rows, monsters)).toThrow();
  });
  it('rejects an unsupported Fire Arrow effect and invalid/missing archetypes', () => {
    expect(() => resolveBloodRavenSkills(skills.map(r => r.id === 'monster-blood-raven-fire-arrow'
      ? { ...r, heal: { min: 1, max: 1, target: 'self' } } : r), monsters)).toThrow();
    expect(() => resolveBloodRavenSkills(skills, monsters.filter(m => m.id !== 'monsters/act1.zombie'))).toThrow();
    expect(() => resolveBloodRavenSkills(skills, monsters.map(m => m.id === 'monsters/act1.zombie'
      ? { ...m, unexpected: true } : m))).toThrow();
  });
});

import { afterEach, expect, it } from 'vitest';
import { monsters } from '../../data';
import { createRng } from '../rng';
import type { DamageType } from '../types/attributes';
import type { MonsterDef } from '../types/monsters';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { resolveDamage, resolveRolledDamage, rollDamage, type DamageInput } from './damage';
import { buildMonsterUnit } from './monster-factory';
import { runBattle, runBattleRecorded } from './combat';
import { dotDamageThisTick, statusDotRate } from './status';
import type { CombatUnit } from './types';

afterEach(() => { resetRegistry(); loadDefaultSkills(); });

const resists = { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 100, arcane: 0 };
function input(type: DamageType = 'poison'): DamageInput & { defenderDamageImmunities: readonly DamageType[] } {
  return { baseMin: 900, baseMax: 1100, flatBonus: 20, increasedPct: .5, comboMult: 1.15,
    critChance: .5, critMult: 2, hitChance: 1, type, defenderResistances: resists,
    defenderArmor: 20, defenderMagicResist: 10, defenderDodge: 0,
    defenderDamageImmunities: ['poison'] };
}

it('blocks authored damage immunity without changing hit/crit decisions or RNG consumption', () => {
  const immune = input(), before = structuredClone(immune), rng = createRng(13), controlRng = createRng(13);
  const blocked = resolveDamage(immune, rng);
  const { defenderDamageImmunities: omitted, ...susceptible } = immune;
  expect(omitted).toEqual(['poison']);
  const control = resolveDamage(susceptible, controlRng);
  expect(blocked).toMatchObject({ hit: true, dodged: false, final: 0, raw: 0, mitigated: 0, effectiveResistPct: 100 });
  expect(control.final).toBeGreaterThan(0);
  expect(control.effectiveResistPct).toBe(75);
  expect(blocked.crit).toBe(control.crit);
  expect(rng.next()).toBe(controlRng.next());
  expect(immune).toEqual(before);
});

it('does not break immunity with penetration, negative resistance, higher caps or ignored flat defenses', () => {
  expect(resolveDamage({ ...input(), resistPenalty: 500, resistCap: 90,
    defenderResistances: { ...resists, poison: -100 }, defenderArmor: 0 }, createRng(13)).final).toBe(0);
  expect(resolveDamage({ ...input(), defenderDodge: 1 }, createRng(13)))
    .toMatchObject({ hit: false, dodged: true, crit: false, final: 0 });
});

it('blocks only the immune component of a shared roll and preserves the ordinary one-damage floor', () => {
  const source = input(), roll = rollDamage(source, createRng(13));
  expect(resolveRolledDamage(source, roll, .5).final).toBe(0);
  expect(resolveRolledDamage({ ...source, type: 'physical' }, roll, .5).final).toBeGreaterThan(0);
  expect(resolveRolledDamage({ ...source, type: 'fire', defenderArmor: 100000 }, roll).final).toBe(1);
});

it.each(['monsters/act1.andariel', 'monsters/act3.mephisto'])('%s authors and independently freezes its damage immunity', id => {
  const native = monsters.find(row => row.id === id);
  if (!native) throw new Error('Missing native boss');
  expect(native).toMatchObject({ damageImmunities: ['poison'] });
  const immunities: DamageType[] = ['poison'];
  const def: MonsterDef & { damageImmunities: DamageType[] } = { ...native, damageImmunities: immunities };
  const unit = buildMonsterUnit({ def, level: 32, tier: 'chapter-boss', rng: createRng(13) });
  expect(unit).toMatchObject({ damageImmunities: ['poison'] });
  const metadata = unit.damageImmunities;
  expect(metadata).not.toBe(immunities);
  expect(Object.isFrozen(metadata)).toBe(true);
  immunities.push('fire');
  expect(metadata).toEqual(['poison']);
});

it.each(['physical', 'fire', 'cold', 'lightning', 'poison', 'arcane', 'thorns'] as const)(
  'honors explicit %s immunity in the shared typed pipeline', type => {
    expect(resolveDamage({ ...input(type), defenderDamageImmunities: [type] }, createRng(13)))
      .toMatchObject({ hit: true, final: 0 });
  }
);

it('uses explicit periodic damage types ahead of legacy names and canonicalizes fire aliases', () => {
  const unit: CombatUnit = { ...body('enemy', 'enemy'), damageImmunities: ['poison', 'fire'] };
  const status = { id: 'poison', sourceId: 'hero', stacks: 2, remaining: 3, dotPerStack: 4 };
  expect(statusDotRate(unit, status)).toBe(0);
  expect(statusDotRate(unit, { ...status, damageType: 'cold' })).toBe(8);
  for (const id of ['plague', 'ignite', 'burn']) expect(statusDotRate(unit, { ...status, id })).toBe(0);
  expect(statusDotRate(unit, { ...status, id: 'unknown-legacy' })).toBe(8);
});

function body(id: string, side: 'player' | 'enemy'): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 32,
    life: 100, mana: 0, tier: 'trash', stats: { life: 100, lifeMax: 100, mana: 0, manaMax: 0,
      attack: 0, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0, resistances: resists },
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    skillOrder: [], cooldowns: {}, activeBuffIds: [], enraged: false };
}

it.each([true, false])('keeps immune poison out of periodic damage, lethal prediction and provenance (typed=%s)', typed => {
  const enemy: CombatUnit & { damageImmunities: readonly DamageType[] } = { ...body('enemy', 'enemy'),
    damageImmunities: ['poison'], statuses: [
      ...body('enemy', 'enemy').statuses,
      { id: 'poison', sourceId: 'poison-source', remaining: 3, stacks: 1, dotPerStack: 1000,
        appliedAtMs: 0, expiresAtMs: 3000, ...(typed ? { damageType: 'poison' as const } : {}) },
      { id: 'bleed', sourceId: 'hero', remaining: 3, stacks: 1, dotPerStack: 2,
        appliedAtMs: 0, expiresAtMs: 3000, damageType: 'physical' } ] };
  const snapshot = { seed: 13, maxRounds: 4, playerTeam: [body('hero', 'player')], enemyTeam: [enemy] };
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(dotDamageThisTick(enemy).total).toBe(2);
  expect(out.result.enemyTeam[0]?.life).toBe(94);
  const dots = out.events.flatMap(event => event.kind === 'dot' && event.target === enemy.id ? [event] : []);
  expect(dots.reduce((sum, event) => sum + event.amount, 0)).toBe(6);
  expect(dots.flatMap(event => event.provenance?.contributions ?? []).every(origin => origin.source === 'hero')).toBe(true);
  expect(out.events.some(event => event.kind === 'death' && event.target === enemy.id)).toBe(false);
  expect(runBattle(snapshot)).toEqual(out.result);
  expect(runBattleRecorded(snapshot)).toEqual(out);
  expect(snapshot).toEqual(before);
});

import Ajv2020 from 'ajv/dist/2020';
import { beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import act1 from '@/data/monsters/act1.json';
import monsterSchema from '@/data/schema/monster.schema.json';
import type { MonsterDef } from '@/engine/types/monsters';
import type { CombatUnit } from '@/engine/combat/types';
import { createRng } from '@/engine/rng';
import { buildMonsterUnit } from '@/engine/combat/monster-factory';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from '@/engine/combat/combat';
import { getSkill, loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';

const validate = new Ajv2020({ strict: true }).compile<MonsterDef>(monsterSchema);
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

function fixture(rank: number, archetypeId = 'monsters/act1.zombie') {
  const def = loadMercPool().pool.find(row => row.id === 'mercs/act3-iron-wolf-frozen-armor');
  if (!def) throw new Error('Missing actual Frozen Armor mercenary');
  const owned = createMercFromDef(def, 'frozen-armor-primary');
  const native = mercToCombatUnit(owned);
  const merc: CombatUnit = { ...native, life: 1000000, mana: 0,
    skillLevels: { 'mskill-frozen-armor': rank },
    stats: { ...native.stats, life: 1000000, lifeMax: 1000000, mana: 0, manaMax: 0,
      attack: 1, attackSpeed: 263, defense: 20, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicResist: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const row: unknown = act1.find(value => value.id === archetypeId);
  if (!validate(row)) throw new Error('Missing native primary attacker');
  const body = buildMonsterUnit({ def: row, level: 1, tier: 'trash', rng: createRng(7) });
  const attacker: CombatUnit = { ...body, life: 1000000, mana: 0, skillOrder: [],
    attackRange: [300, 300],
    stats: { ...body.stats, life: 1000000, lifeMax: 1000000, mana: 0, manaMax: 0,
      attack: 300, attackSpeed: 100, defense: 0, magicResist: 0,
      critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const input: CombatSnapshot = { seed: 7, playerTeam: [merc], enemyTeam: [attacker] };
  return { owned, native, merc, attacker, input };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  return out;
}
function incoming(out: ReturnType<typeof record>, source: string) {
  const hit = out.events.find((event): event is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
    event.kind === 'damage' && event.source === source);
  if (!hit) throw new Error('Expected actual incoming hit');
  return hit;
}

it.each([1, 20])('gives actual Frozen Armor flat120 self Defense at rank%i after one ordinary paid cast', rank => {
  const { owned, native, merc, attacker, input } = fixture(rank);
  const before = structuredClone(owned), out = record(input);
  expect(incoming(out, attacker.id)).toMatchObject({ target: merc.id, damageType: 'physical',
    amount: 160, crit: false, dodged: false, simClockMs: 1700 });
  expect(native.skillOrder).toEqual(['mskill-frozen-armor']);
  expect(getSkill('mskill-frozen-armor')).toMatchObject({ trigger: 'active', target: 'self',
    cooldown: 6, manaCost: 0, minLevel: 1, isBuff: true });
  expect(out.events.filter(event => event.kind === 'action' && event.actor === merc.id &&
    event.skillId === 'mskill-frozen-armor')).toEqual([
    expect.objectContaining({ kind: 'action', simClockMs: 400 })
  ]);
  expect(out.events.some(event => event.kind === 'mana' && event.target === merc.id)).toBe(false);
  const final = out.result.playerTeam[0];
  expect(final?.stats).toEqual(merc.stats);
  expect(final?.mana).toBe(0);
  expect(final).toHaveProperty('mercFrozenArmor', { defense: 120 });
  expect(final).not.toHaveProperty('frozenArmor');
  expect(owned).toEqual(before);
  expect(JSON.stringify(owned)).not.toContain('mercFrozenArmor');
});

it.each([1, 20])('chills the actual native melee attacker once at its first landed strike, rank%i', rank => {
  const { merc, attacker, input } = fixture(rank), out = record(input);
  const hit = incoming(out, attacker.id);
  expect(hit).toMatchObject({ target: merc.id, simClockMs: 1700, dodged: false });
  const chills = out.events.filter(event => event.kind === 'status' && event.target === attacker.id &&
    event.statusId === 'chill' && event.simClockMs === 1700);
  expect(chills).toHaveLength(1);
  const view = out.events.find(event => event.kind === 'status-state' && event.target === attacker.id &&
    event.simClockMs === 1700 && event.statuses.some(status => status.id === 'chill'));
  expect(view).toMatchObject({ kind: 'status-state', statuses: [expect.objectContaining({
    id: 'chill', sourceId: merc.id, appliedAtMs: 1700, expiresAtMs: 3700
  })] });
  const chill = chills[0];
  if (!chill) throw new Error('Missing asserted Chill event');
  expect(out.events.indexOf(hit)).toBeLessThan(out.events.indexOf(chill));
});

it('keeps the actual native archer noncontact while preserving the same flat Defense', () => {
  const { attacker, merc, input } = fixture(1, 'monsters/act1.dark-archer'), out = record(input);
  expect(incoming(out, attacker.id)).toMatchObject({ target: merc.id, amount: 160, simClockMs: 1700 });
  expect(attacker.basicAttackDelivery).toBe('ranged');
  expect(out.events.some(event => event.kind === 'status' && event.target === attacker.id &&
    event.statusId === 'chill')).toBe(false);
});

it('keeps a legacy unknown basic noncontact after the actual merc pays for Armor', () => {
  const { attacker, merc, input } = fixture(1);
  const { basicAttackDelivery: _delivery, ...unknown } = attacker;
  const out = record({ ...input, enemyTeam: [unknown] });
  expect(incoming(out, attacker.id)).toMatchObject({ target: merc.id, amount: 160, simClockMs: 1700 });
  expect(out.events.some(event => event.kind === 'status' && event.target === attacker.id &&
    event.statusId === 'chill')).toBe(false);
});

import { createHash } from 'node:crypto';
import { beforeEach, expect, it } from 'vitest';
import { buildDecoy } from '../skills/decoy';
import { buildHydra } from '../skills/hydra';
import { buildSummon } from '../skills/summons';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';

const hold = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 1000000, mana: 1000,
    stats: { life: 1000000, lifeMax: 1000000, mana: 1000, manaMax: 1000,
      attack: 10, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [hold], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function snapshot(body: 'hydra' | 'decoy' | 'spirit_of_barbs'): CombatSnapshot {
  const hero = unit('owner', 'player'), enemy = unit('enemy', 'enemy');
  if (body === 'hydra') return { seed: 7, playerTeam: [{ ...hero, hydraRank: 1,
    skillOrder: ['skills-sorceress-hydra'], skillLevels: { 'sorceress.hydra': 1 } }], enemyTeam: [enemy] };
  if (body === 'decoy') return { seed: 7, playerTeam: [{ ...hero, decoyRank: 1,
    skillOrder: ['skills-amazon-decoy'], skillLevels: { 'amazon.decoy': 1 } }], enemyTeam: [{ ...enemy, statuses: [] }] };
  return { seed: 7, playerTeam: [hero], enemyTeam: [{ ...enemy, statuses: [] }],
    spiritOfBarbs: { sourceHeroId: hero.id, rank: 1 } };
}
/** Remove only the new additive metadata; all other JSON-serialized recorded/terminal fields are frozen. */
function withoutDelivery(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutDelivery);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'basicAttackDelivery')
    .map(([key, child]) => [key, withoutDelivery(child)]));
}
// Freeze literal hashes from the unchanged A runtime before any B runtime edit.
const PRE_B = { hydra: '9431f53491ff46fa473c3505115df02722c16b47c20ad634190408228415f66c', decoy: 'c3c45c5c8e2fc0a479518a06bd1ccd842b6ddbbf5deb1189676dd38a448c04f6', spirit_of_barbs: '97503dd7ae7c391586086f37031a0acf8f745c88eda3828507e92f501364d2d1' };
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each([['hydra', 'spell'], ['decoy', 'none'], ['spirit_of_barbs', 'none']] as const)(
  'classifies only authenticated %s and preserves its complete pre-B recording', (template, delivery) => {
    const input = snapshot(template), before = structuredClone(input), out = runBattleRecorded(input);
    expect(input).toEqual(before);
    expect(runBattle(input)).toEqual(out.result);
    expect(runBattleRecorded(input)).toEqual(out);
    const spawns = out.events.filter(event => event.kind === 'summon' && event.summonId === template);
    expect(spawns).toHaveLength(1);
    const spawn = spawns[0];
    if (spawn?.kind !== 'summon') throw new Error('Missing committed special body');
    expect(spawn).toMatchObject({ simClockMs: 0, owner: 'owner' });
    expect(createHash('sha256').update(JSON.stringify(withoutDelivery(out))).digest('hex')).toBe(PRE_B[template]);
    expect(spawn.unit.basicAttackDelivery).toBe(delivery);
    expect(out.result.playerTeam.find(unit => unit.id === spawn.unit.id)?.basicAttackDelivery).toBe(delivery);
    const actions = out.events.filter(event => event.kind === 'action' && event.actor === spawn.unit.id);
    if (template === 'hydra') expect(actions.length).toBeGreaterThan(0);
    else expect(actions).toEqual([]);
  });

it('keeps provisional special-body factories unknown', () => {
  const owner = unit('owner', 'player');
  for (const body of [buildHydra(owner), buildDecoy(owner, 1), buildSummon(owner, 'spirit_of_barbs')]) {
    expect(body).toBeDefined();
    expect(body).not.toHaveProperty('basicAttackDelivery');
  }
});

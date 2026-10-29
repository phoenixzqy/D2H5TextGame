import { beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { getSkill, loadDefaultSkills } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';

const hold = { id: 'stun', stacks: 1, sourceId: 'fixture', remaining: -1 };
beforeEach(() => { loadDefaultSkills(); });

function actualLoadout(seed: number) {
  const definition = loadMercPool().pool.find(row => row.id === 'mercs/act3-iron-wolf-telekinesis');
  if (!definition) throw new Error('Missing authored Telekinesis mercenary');
  const owned = createMercFromDef(definition, 'telekinesis-primary'), native = mercToCombatUnit(owned);
  // Constructed surviving resources isolate mechanics, not earned recruitment or balance.
  const merc: CombatUnit = { ...native, life: 1000000, mana: 0,
    statuses: [{ ...hold, appliedAtMs: 1701 }],
    stats: { ...native.stats, lifeMax: 1000000, attack: 100, attackSpeed: 100,
      critChance: 0, critDamage: 2 } };
  const player = playerToCombatUnit(createMockPlayer('Telekinesis', 'sorceress'));
  const hero: CombatUnit = { ...player, statuses: [hold] };
  const enemies: CombatUnit[] = ['target', 'bystander', 'dead'].map(id => ({
    ...player, id, side: 'enemy', kind: 'monster', tier: 'trash',
    life: id === 'dead' ? 0 : 1000000, statuses: [], skillOrder: [],
    stats: { ...player.stats, lifeMax: 1000000, attackSpeed: 0, defense: 0, magicResist: 0,
      physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } }
  }));
  return { owned, input: { seed, playerTeam: [hero, merc], enemyTeam: enemies }, merc };
}

// Independently derived mulberry32 hit/base/crit/proc literals. Player-side target
// priority draws no targeting RNG; enemies cannot act before the first1700ms cast.
const cases = [
  { seed: 3, damage: 20, stun: true },
  { seed: 9, damage: 31, stun: false }
];
it.each(cases)('uses the actual Telekinesis loadout with seed$seed damage and landed control', row => {
  const { owned, input, merc } = actualLoadout(row.seed), before = structuredClone({ owned, input });
  expect(merc.skillOrder).toEqual(['mskill-telekinesis']);
  const out = runBattleRecorded(input);
  const actions = out.events.filter((event): event is Extract<RecordedBattleEvent, { kind: 'action' }> =>
    event.kind === 'action' && event.actor === merc.id);
  expect(actions.map(event => [event.skillId, event.simClockMs])).toEqual([['mskill-telekinesis', 1700]]);
  const hits = out.events.filter((event): event is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
    event.kind === 'damage' && event.source === merc.id);
  expect(hits.map(hit => [hit.target, hit.amount, hit.damageType, hit.crit, hit.dodged, hit.simClockMs]))
    .toEqual([['target', row.damage, 'arcane', false, false, 1700]]);
  const applications = out.events.filter((event): event is Extract<RecordedBattleEvent, { kind: 'status-state' }> =>
    event.kind === 'status-state' && event.simClockMs === 1700 &&
      event.statuses.some(status => status.sourceId === merc.id));
  expect(applications.map(event => [event.target, event.statuses.map(status => ({
    id: status.id, sourceId: status.sourceId, stacks: status.stacks,
    appliedAtMs: status.appliedAtMs, expiresAtMs: status.expiresAtMs
  }))])).toEqual(row.stun ? [['target', [{ id: 'stun', sourceId: merc.id, stacks: 1,
    appliedAtMs: 1700, expiresAtMs: 2700 }]]] : []);
  expect(out.result.playerTeam.find(unit => unit.id === merc.id)?.mana).toBe(0);
  expect({ owned, input }).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
});

it('retains authored damage and CD2 with explicit zero MP and fifty-percent finite landed Stun', () => {
  expect(getSkill('mskill-telekinesis')).toMatchObject({ cooldown: 2, manaCost: 0,
    target: 'single-enemy', effects: [{ kind: 'damage', damageType: 'arcane', base: [20, 32],
      applyStatus: { id: 'stun', chance: 0.5, durationMs: 1000 } }] });
});

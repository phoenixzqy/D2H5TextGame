import { beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { getSkill, loadDefaultSkills } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';

const hold = { id: 'stun', stacks: 1, sourceId: 'fixture', remaining: -1 };
beforeEach(() => { loadDefaultSkills(); });

function actualLoadout() {
  const definition = loadMercPool().pool.find(row => row.id === 'mercs/act5-barbarian-war-cry');
  if (!definition) throw new Error('Missing authored War Cry mercenary');
  const owned = createMercFromDef(definition, 'war-cry-primary'), native = mercToCombatUnit(owned);
  // Constructed surviving resources isolate mechanics, not earned recruitment or balance.
  const merc: CombatUnit = { ...native, life: 1000000, mana: 0,
    statuses: [{ ...hold, appliedAtMs: 1701 }],
    stats: { ...native.stats, lifeMax: 1000000, attack: 100, attackSpeed: 100, critChance: 0 } };
  const player = playerToCombatUnit(createMockPlayer('War Cry', 'sorceress'));
  const hero: CombatUnit = { ...player, statuses: [hold] };
  const enemies: CombatUnit[] = ['ordinary', 'boss', 'chapter', 'summon', 'dead'].map(id => ({
    ...player, id, side: 'enemy', kind: id === 'summon' ? 'summon' : 'monster',
    tier: id === 'boss' ? 'boss' : id === 'chapter' ? 'chapter-boss' : 'trash',
    life: id === 'dead' ? 0 : 1000000, statuses: [], skillOrder: [],
    stats: { ...player.stats, lifeMax: 1000000, attackSpeed: 0, defense: 0, magicResist: 0,
      physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } }
  }));
  return { owned, input: { seed: 5, playerTeam: [hero, merc], enemyTeam: enemies }, merc };
}

it('uses the actual loadout for guaranteed finite area control without source damage', () => {
  const { owned, input, merc } = actualLoadout(), before = structuredClone({ owned, input });
  expect(merc.skillOrder).toEqual(['mskill-war-cry', 'mskill-bash', 'mskill-chop']);
  const out = runBattleRecorded(input);
  expect(out.events.filter(event => event.kind === 'action' && event.actor === merc.id))
    .toEqual([expect.objectContaining({ skillId: 'mskill-war-cry', simClockMs: 1700 })]);
  const applications = out.events.filter(event => event.kind === 'status-state')
    .filter(event => event.simClockMs === 1700 && event.statuses.some(status => status.sourceId === merc.id));
  expect(applications).toHaveLength(4);
  expect(applications.map(event => [event.target, event.statuses])).toEqual(expect.arrayContaining([
    ['ordinary', [expect.objectContaining({ id: 'stun', sourceId: merc.id, stacks: 1, appliedAtMs: 1700, expiresAtMs: 7700 })]],
    ['boss', [expect.objectContaining({ id: 'stun', sourceId: merc.id, stacks: 1, appliedAtMs: 1700, expiresAtMs: 4700 })]],
    ['chapter', [expect.objectContaining({ id: 'stun', sourceId: merc.id, stacks: 1, appliedAtMs: 1700, expiresAtMs: 4700 })]],
    ['summon', [expect.objectContaining({ id: 'stun', sourceId: merc.id, stacks: 1, appliedAtMs: 1700, expiresAtMs: 7700 })]]
  ]));
  expect(out.events.filter(event => event.kind === 'damage' && event.source === merc.id)).toEqual([]);
  expect(out.result.playerTeam.find(unit => unit.id === merc.id)?.mana).toBe(0);
  expect({ owned, input }).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
});

it('retains the advertised twelve-second cooldown and zero mana in the default registry', () => {
  expect(getSkill('mskill-war-cry')).toMatchObject({ cooldown: 12, manaCost: 0,
    target: 'all-enemies', effects: [{ kind: 'debuff', statusId: 'stun', durationMs: 6000 }] });
});

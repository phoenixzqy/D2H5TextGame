import { beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded, type RecordedBattleEvent } from '@/engine/combat/combat';
import { loadDefaultSkills } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';

const hold = { id: 'stun', stacks: 1, sourceId: 'fixture', remaining: -1 };
beforeEach(() => { loadDefaultSkills(); });

// Literal first-cast oracles: seed5 hit/base/crit/status draws, ordinary mitigation,
// actual Fire Mastery (+25%), and Chop's effect-only +25 percentage points crit.
const cases = [
  { merc: 'act3-iron-wolf-fire', skill: 'fire-ball', type: 'fire', amounts: [91, 85], targets: ['a', 'b'] },
  { merc: 'act3-iron-wolf-cold', skill: 'glacial-spike', type: 'cold', amounts: [56], targets: ['a'] },
  { merc: 'act3-iron-wolf-lightning', skill: 'charged-bolt', type: 'lightning', amounts: [12, 12, 12, 12, 12],
    targets: ['a', 'b', 'c', 'a', 'b'] },
  { merc: 'act4-paladin-initiate', skill: 'smite', type: 'physical', amounts: [32], targets: ['a'] },
  { merc: 'act3-militia-swordsman', skill: 'chop', type: 'physical', amounts: [48], targets: ['a'] },
  { merc: 'act3-militia-pikeman', skill: 'pierce-thrust', type: 'physical', amounts: [30, 21], targets: ['a', 'b'] },
  { merc: 'act5-barbarian-recruit', skill: 'basic-swing', type: 'physical', amounts: [28], targets: ['a'] }
];

it.each(cases)('executes the real $merc loadout with native $skill recipients and literal damage', row => {
  const definition = loadMercPool().pool.find(candidate => candidate.id === `mercs/${row.merc}`);
  if (!definition) throw new Error('Missing authored mercenary');
  const owned = createMercFromDef(definition, 'direct-regression'), native = mercToCombatUnit(owned);
  // Constructed surviving resources isolate mechanics, not earned recruitment or balance.
  const merc = { ...native, life: 1000000, mana: 0, statuses: [{ ...hold, appliedAtMs: 1701 }],
    stats: { ...native.stats, lifeMax: 1000000, attack: 100, attackSpeed: 100, critChance: 0, critDamage: 2 } };
  const player = playerToCombatUnit(createMockPlayer('Direct skills', 'sorceress'));
  const hero = { ...player, statuses: [hold] };
  const enemies = ['a', 'b', 'c'].map(id => ({ ...player, id, side: 'enemy' as const,
    kind: 'monster' as const, life: 1000000, statuses: [hold], stats: { ...player.stats,
      lifeMax: 1000000, defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } }));
  const input = { seed: 5, playerTeam: [hero, merc], enemyTeam: enemies }, before = structuredClone({ owned, input });
  expect(merc.skillOrder[0]).toBe(`mskill-${row.skill}`);
  if (row.skill === 'fire-ball') {
    expect(merc.skillOrder).toContain('passive-fire-mastery');
    expect(merc.mercFireMastery).toBe(true);
  }
  if (row.skill === 'basic-swing') expect(merc.skillOrder).toContain('mskill-bash');
  const out = runBattleRecorded(input);
  const first = out.events.find(event => event.kind === 'action' && event.actor === merc.id);
  expect(first).toMatchObject({ skillId: `mskill-${row.skill}`, simClockMs: 1700 });
  const hits = out.events.filter((event): event is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
    event.kind === 'damage' && event.source === merc.id && event.simClockMs === 1700);
  expect(hits.map(hit => hit.amount)).toEqual(row.amounts);
  expect(hits.map(hit => hit.target)).toEqual(row.targets);
  for (const hit of hits) expect(hit).toMatchObject({ damageType: row.type, dodged: false,
    crit: row.skill === 'chop' });
  expect(out.events.filter(event => event.kind === 'action' && event.actor === merc.id)).toHaveLength(1);
  expect(out.result.playerTeam.find(unit => unit.id === merc.id)?.mana).toBe(0);
  expect({ owned, input }).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
});

import { beforeEach, expect, it } from 'vitest';
import { eliteConfig, subAreas } from '../data';
import { validateGameData } from '../data/loader';
import eliteSchema from '../data/schema/elite-config.schema.json';
import { resolveChallengeWavePlan } from '../engine/combat/sub-area-run';
import { runBattleRecorded } from '../engine/combat/combat';
import type { CombatUnit, MonsterTier } from '../engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '../engine/skills/registry';
import { buildEnemiesForWave } from './combatHelpers';

const STUN = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 } as const;
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

function native(tier: MonsterTier = 'champion', affixed = true): CombatUnit {
  const fire = eliteConfig.affixes.find(a => a.id === 'elite-affix/fire-enchanted');
  expect(fire, 'The separate Fire Enchanted affix must exist in the live pool').toBeDefined();
  if (!fire) throw new Error('Missing Fire Enchanted affix');
  const [unit] = buildEnemiesForWave({ id: 'fire-native-fixture', waveTier: 'elite',
    spawns: [{ archetypeId: 'monsters/act1.fallen', tier, level: 7, index: 0,
      ...(affixed ? { eliteAffix: fire } : {}) }] }, 7);
  if (!unit) throw new Error('Missing native enemy');
  return unit;
}

function target(id: string, kind: 'hero' | 'merc' | 'summon', base: CombatUnit): CombatUnit {
  return { id, name: id, kind, side: 'player', tier: 'trash', level: 7,
    life: 1000, mana: 0, skillOrder: [], statuses: [STUN], cooldowns: {},
    activeBuffIds: [], enraged: false, ...(kind === 'summon' ? { summonOwnerId: 'hero' } : {}),
    stats: { ...base.stats, life: 1000, lifeMax: 1000, attack: 0, critChance: 0,
      defense: kind === 'hero' ? 2 : 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: kind === 'hero' ? 50 : 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
}

it('constructs native Fire Enchanted resistance without replacing Extra Fire Damage', () => {
  expect(eliteConfig.affixes.find(a => a.id === 'elite-affix/extra-fire-damage'))
    .toEqual({ id: 'elite-affix/extra-fire-damage', nameKey: 'combat.eliteAffix.extraFireDamage', skillId: 'monster-fire-ball' });
  const enemy = native(), plain = native('champion', false);
  expect(enemy.stats.resistances.fire).toBe(50);
  expect(enemy.skillOrder).toEqual([...plain.skillOrder, 'monster-fire-enchanted-explosion']);
  expect({ ...enemy, stats: plain.stats, skillOrder: plain.skillOrder }).toEqual(plain);
  expect({ ...enemy.stats, resistances: plain.stats.resistances }).toEqual(plain.stats);
  expect({ ...enemy.stats.resistances, fire: plain.stats.resistances.fire }).toEqual(plain.stats.resistances);
  expect(native('rare-elite').stats.resistances.fire).toBe(75);
  expect(native('rare-minion').stats.resistances.fire).toBe(50);
});

it('explodes through native settlement once against hero, merc and summon with mitigation', () => {
  const unit = native();
  const enemy = { ...unit, life: 1, stats: { ...unit.stats, critChance: 0 }, statuses: [STUN,
    { id: 'ignite', sourceId: 'hero', stacks: 1, remaining: 0.5, expiresAtMs: 500, dotPerStack: 2 }] };
  const input = { seed: 7, playerTeam: [target('hero', 'hero', unit), target('merc', 'merc', unit),
    target('summon', 'summon', unit)], enemyTeam: [enemy] };
  const before = structuredClone(input), out = runBattleRecorded(input);
  const hits = out.events.filter(e => e.kind === 'damage' && e.source === enemy.id);
  expect(hits).toMatchObject([
    { target: 'hero', damageType: 'fire', amount: 23, simClockMs: 500, crit: false, dodged: false },
    { target: 'merc', damageType: 'fire', amount: 0, simClockMs: 500, crit: false, dodged: true },
    { target: 'summon', damageType: 'fire', amount: 50, simClockMs: 500, crit: false, dodged: false }
  ]);
  expect(hits).toHaveLength(3);
  expect(out.events.some(e => e.kind === 'action')).toBe(false);
  expect(out.events.some(e => e.kind === 'status' && e.statusId === 'ignite')).toBe(false);
  expect(out.result.winner).toBe('player');
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  const control = runBattleRecorded({ ...input, enemyTeam: [{ ...enemy, skillOrder: native('champion', false).skillOrder }] });
  expect(control.events.filter(e => e.kind === 'damage' && e.source === enemy.id)).toEqual([]);
});

it.each(['manual', 'idle'] as const)('builds only %s planner affix carriers with native fire death authority', mode => {
  const fire = eliteConfig.affixes.find(a => a.id === 'elite-affix/fire-enchanted');
  const area = subAreas.find(a => a.id === 'areas/act1-den-of-evil');
  if (!fire || !area) throw new Error('Missing native planning data');
  const config = { ...eliteConfig, affixes: [fire] };
  expect(() => validateGameData(eliteSchema.$id, config)).not.toThrow();
  const plan = resolveChallengeWavePlan({ subArea: area, mode, seed: 7, challengeOrdinal: 0,
    idleEliteMisses: 11, fallbackArchetypeId: 'monsters/act1.fallen', fallbackLevel: area.areaLevel,
    eliteConfig: config });
  const before = structuredClone(plan);
  let carriers = 0, unaffixed = 0;
  for (const wave of plan.waves) {
    const units = buildEnemiesForWave(wave, 7);
    wave.spawns.forEach((spawn, index) => {
      const unit = units[index];
      if (!unit) throw new Error('Missing planned enemy');
      expect(unit.skillOrder.includes(fire.skillId)).toBe(spawn.eliteAffix !== undefined);
      if (spawn.eliteAffix) { carriers++; expect(unit.stats.resistances.fire).toBeGreaterThanOrEqual(50); }
      else unaffixed++;
    });
  }
  expect(carriers).toBeGreaterThan(0);
  expect(unaffixed).toBeGreaterThan(0);
  expect(plan).toEqual(before);
});

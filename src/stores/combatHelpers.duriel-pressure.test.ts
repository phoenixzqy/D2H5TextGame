import { beforeEach, expect, it } from 'vitest';
import { monsters, subAreas } from '../data';
import { resolveRolledDamage, type DamageInput } from '../engine/combat/damage';
import { runBattleRecorded } from '../engine/combat/combat';
import { encountersToSpawns, resolveChallengeWavePlan } from '../engine/combat/sub-area-run';
import { applyReplayProfileToPlan } from '../engine/map/replay-profile';
import { getSkill, loadDefaultSkills, resetRegistry } from '../engine/skills/registry';
import { buildEnemiesForWave } from './combatHelpers';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing native Duriel fixture');
  return value;
}
const area = required(subAreas.find(row => row.id === 'areas/act2-tomb-of-tal-rasha'));
const index = new Map(monsters.map(row => [row.id, row]));
const options = { fallbackArchetypeId: 'monsters/act2.duriel', fallbackLevel: 1,
  seed: 13, challengeOrdinal: 0, idleEliteMisses: 0 };
function plan(mode: 'manual' | 'idle' = 'manual') {
  return resolveChallengeWavePlan({ ...options, subArea: area, mode });
}
function boss() {
  return required(buildEnemiesForWave(required(plan().waves.at(-1)), 13)[0]);
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

it('retains the ordinary Tomb encounter attack growth while using the archetype critical multiplier', () => {
  const encounter = required(area.bossEncounter);
  const unit = required(buildEnemiesForWave({ id: encounter.id, waveTier: 'boss',
    spawns: encountersToSpawns([encounter], 'boss') }, 13)[0]);
  expect(unit).toMatchObject({ monsterArchetypeId: 'monsters/act2.duriel', tier: 'boss',
    level: 27, basicAttackDelivery: 'melee', stats: { attack: 324, critChance: .10, critDamage: 1.25 } });
  expect(unit.attackRange).toEqual([324, 324]);
});

it.each(['manual', 'idle'] as const)('builds paired Duriel tuning in %s without changing prefix, loot or other chapter stats', mode => {
  const before = structuredClone(area), chapter = required(area.chapterBoss);
  const current = plan(mode);
  const previous = resolveChallengeWavePlan({ ...options, mode,
    subArea: { ...area, chapterBoss: { ...chapter, atk: 220 } } });
  expect(current.waves.slice(0, -1)).toEqual(previous.waves.slice(0, -1));
  const wave = required(current.waves.at(-1));
  const built = buildEnemiesForWave(wave, 13), old = buildEnemiesForWave(required(previous.waves.at(-1)), 13);
  const unit = required(built[0]), control = required(old[0]);
  expect(built).toHaveLength(1);
  expect(unit).toMatchObject({ monsterArchetypeId: 'monsters/act2.duriel', level: 32,
    life: 25600, tier: 'chapter-boss', skillOrder: ['monster-charge'], basicAttackDelivery: 'melee',
    stats: { lifeMax: 25600, attack: 350, defense: 280, critChance: .10, critDamage: 1.25 } });
  expect(unit.attackRange).toEqual([350, 350]);
  expect(wave.lootTable).toBe('loot/act2-boss');
  expect({ ...unit, attackRange: control.attackRange, stats: { ...unit.stats, attack: control.stats.attack } }).toEqual(control);
  expect(area).toEqual(before);
});

it.each([
  ['normal', 32, 350], ['nightmare', 52, 537], ['hell', 72, 724]
] as const)('propagates authored critical tuning through %s while retaining native replay level scaling', (profile, level, attack) => {
  const normal = plan(), before = structuredClone(normal);
  const bound = applyReplayProfileToPlan(normal, profile, index);
  const unit = required(buildEnemiesForWave(required(bound.waves.at(-1)), 13)[0]);
  expect(unit).toMatchObject({ level, stats: { attack, critChance: .10, critDamage: 1.25 } });
  expect(bound.waves.at(-1)?.lootTable).toBe('loot/act2-boss');
  expect(normal).toEqual(before);
});

// Literal mitigation projections from retained first-entry records, not injected campaign inputs.
it.each([
  ['Bow hero17', 419, 190, 32, 47, [88, 109], [158, 183]],
  ['Bow Prayer18', 443, 210, 29, 38, [81, 102], [153, 180]],
  ['Swing hero15', 472.77, 170.98000000000002, 57, 1, [5, 18], [49, 65]],
  ['Swing Prayer17', 484, 228, 6, 101, [157, 185], [253, 289]],
  ['Druid hero15', 526, 145, 31, 96, [137, 158], [208, 234]],
  ['Druid Rogue18', 391, 184, 19, 99, [148, 172], [231, 261]]
] as const)('projects ordinary pressure and the critical Charge envelope for %s', (_label, life, defense, physical, basic, ordinary, critical) => {
  const unit = boss();
  const effect = required(getSkill('monster-charge')?.effects[0]);
  if (effect.kind !== 'damage') throw new Error('Expected native Charge damage');
  expect(effect).toMatchObject({ base: [60, 90], attackDamagePct: 100 });
  const input: DamageInput = { baseMin: effect.base[0], baseMax: effect.base[1],
    flatBonus: unit.stats.attack * required(effect.attackDamagePct) / 100,
    increasedPct: 0, comboMult: 1, type: 'physical', critChance: unit.stats.critChance,
    critMult: unit.stats.critDamage, defenderArmor: defense, defenderMagicResist: 0,
    defenderDodge: 0, defenderResistances: { ...unit.stats.resistances, physical } };
  const endpoint = (base: number, crit: boolean, value = input) => resolveRolledDamage(value,
    { hit: true, dodged: false, base, crit, critMultiplier: unit.stats.critDamage }).final;
  expect(endpoint(unit.stats.attack, false, { ...input, flatBonus: 0 })).toBe(basic);
  expect(effect.base.map(base => endpoint(base, false))).toEqual(ordinary);
  expect(effect.base.map(base => endpoint(base, true))).toEqual(critical);
  expect(critical[1]).toBeLessThan(life);
});

it.each([0, 1])('uses the built Duriel multiplier in a bounded constructed native Charge (forced crit chance %i)', critChance => {
  const source = boss();
  const enemy = { ...source, stats: { ...source.stats, critChance } };
  const hero = { ...source, id: 'hero', kind: 'hero' as const, side: 'player' as const, skillOrder: [],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    stats: { ...source.stats, attack: 0, defense: 0, magicResist: 0,
      physDodge: 0, magicDodge: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  const input = { seed: 13, maxRounds: 3, playerTeam: [hero], enemyTeam: [enemy] };
  const before = structuredClone(input), recording = runBattleRecorded(input);
  const hit = recording.events.find(event => event.kind === 'damage' && event.source === enemy.id);
  if (hit?.kind !== 'damage') throw new Error('Missing constructed Charge hit');
  expect(hit).toMatchObject({ crit: critChance === 1, dodged: false, damageType: 'physical' });
  expect(hit.amount).toBeGreaterThanOrEqual(critChance ? 512 : 410);
  expect(hit.amount).toBeLessThanOrEqual(critChance ? 550 : 440);
  expect(recording.events.find(event => event.kind === 'action' && event.actor === enemy.id))
    .toMatchObject({ skillId: 'monster.charge' });
  expect(input).toEqual(before);
});

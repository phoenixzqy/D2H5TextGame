import { beforeEach, expect, it } from 'vitest';
import { eliteConfig, subAreas } from '../data';
import { runBattleRecorded } from '../engine/combat/combat';
import { resolveChallengeWavePlan, type WaveSpec } from '../engine/combat/sub-area-run';
import type { CombatUnit } from '../engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '../engine/skills/registry';
import type { EliteAffixDef } from '../engine/types/elite';
import { buildEnemiesForWave } from './combatHelpers';

const fast = eliteConfig.affixes.find(affix => affix.id === 'elite-affix/fast');
if (!fast) throw new Error('Missing authored Fast affix');
const wave: WaveSpec = {
  id: 'fast-affix-native-fixture', waveTier: 'elite',
  spawns: [{ archetypeId: 'monsters/act1.fallen', tier: 'champion', level: 7,
    index: 0, eliteAffix: fast }]
};
const plainWave: WaveSpec = { ...wave, spawns: wave.spawns.map(({ eliteAffix: _affix, ...spawn }) => spawn) };

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

it('gives the actual Fast affix 50% more native speed while retaining Charge and every other stat', () => {
  const before = structuredClone(wave);
  const [enemy] = buildEnemiesForWave(wave, 7);
  const [plain] = buildEnemiesForWave(plainWave, 7);
  if (!enemy || !plain) throw new Error('Missing native enemy');
  expect(enemy.stats.attackSpeed).toBe(142.5);
  expect(plain.stats.attackSpeed).toBe(95);
  expect(enemy.skillOrder).toEqual([...plain.skillOrder, 'monster-charge']);
  expect({ ...enemy, stats: plain.stats, skillOrder: plain.skillOrder }).toEqual(plain);
  expect({ ...enemy.stats, attackSpeed: plain.stats.attackSpeed }).toEqual(plain.stats);
  expect(buildEnemiesForWave(wave, 7)).toEqual([enemy]);
  expect(wave).toEqual(before);
});

it('makes Fast act sooner in the real scheduler without treating speed as actions per second', () => {
  const [fastEnemy] = buildEnemiesForWave(wave, 7);
  const [plain] = buildEnemiesForWave(plainWave, 7);
  if (!fastEnemy || !plain) throw new Error('Missing native enemy');
  // A durable, inactive constructed target isolates enemy cadence from death/control.
  const target: CombatUnit = { ...plain, id: 'cadence-target', side: 'player', kind: 'hero',
    life: 1000000, stats: { ...plain.stats, life: 1000000, lifeMax: 1000000 },
    skillOrder: [], statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
  const actionTimes = (enemy: CombatUnit) => runBattleRecorded({ seed: 7, maxRounds: 2,
    playerTeam: [target], enemyTeam: [enemy] }).events
    .filter(event => event.kind === 'action' && event.actor === enemy.id)
    .slice(0, 3).map(event => event.simClockMs);
  expect(actionTimes(fastEnemy)).toEqual([1364, 2728, 4092]);
  expect(actionTimes(plain)).toEqual([1740, 3480, 5220]);
});

it('uses authored metadata rather than guessing speed from affix ID, label or Charge', () => {
  const { attackSpeedMultiplier: _multiplier, ...legacyFast } = fast;
  const built = (eliteAffix: EliteAffixDef) => buildEnemiesForWave({ ...wave,
    spawns: wave.spawns.map(spawn => ({ ...spawn, eliteAffix })) }, 7)[0];
  expect(built(legacyFast)?.stats.attackSpeed).toBe(95);
  expect(built({ id: 'elite-affix/custom', nameKey: 'fixture.custom',
    skillId: 'monster-charge', attackSpeedMultiplier: 2 })?.stats.attackSpeed).toBe(190);
  for (const affix of eliteConfig.affixes.filter(affix => affix.id !== fast.id)) {
    expect(built(affix)?.stats.attackSpeed).toBe(95);
  }
  const naturalCharge = buildEnemiesForWave({ ...wave, spawns: [{
    archetypeId: 'monsters/act1.dark-stalker', tier: 'champion', level: 7, index: 0
  }] }, 7)[0];
  expect(naturalCharge?.skillOrder).toContain('monster-charge');
  expect(naturalCharge?.stats.attackSpeed).toBe(120);
});

it.each([
  ['areas/act1-den-of-evil', 'manual'], ['areas/act1-den-of-evil', 'idle'],
  ['areas/act2-rocky-waste', 'manual'], ['areas/act2-rocky-waste', 'idle']
] as const)('speeds up exactly the affix carriers in native %s %s planning', (areaId, mode) => {
  const area = subAreas.find(row => row.id === areaId);
  if (!area) throw new Error('Missing native area');
  // Single-affix constructed config isolates composition; this is no campaign/seed screen.
  const config = { ...eliteConfig, affixes: [fast] };
  const input = { subArea: area, mode, seed: 7, challengeOrdinal: 0, idleEliteMisses: 11,
    fallbackArchetypeId: 'monsters/act1.fallen', fallbackLevel: area.areaLevel, eliteConfig: config };
  const before = structuredClone(input);
  const plan = resolveChallengeWavePlan(input);
  const { attackSpeedMultiplier: _multiplier, ...legacyFast } = fast;
  const legacyPlan = resolveChallengeWavePlan({ ...input, eliteConfig: { ...config, affixes: [legacyFast] } });
  expect({ ...plan, waves: plan.waves.map(row => ({ ...row, spawns: row.spawns.map(spawn =>
    spawn.eliteAffix ? { ...spawn, eliteAffix: legacyFast } : spawn) })) }).toEqual(legacyPlan);
  let affected = 0;
  for (const nativeWave of plan.waves) {
    const units = buildEnemiesForWave(nativeWave, 7);
    const controls = buildEnemiesForWave({ ...nativeWave, spawns: nativeWave.spawns.map(spawn =>
      spawn.eliteAffix ? { ...spawn, eliteAffix: legacyFast } : spawn) }, 7);
    nativeWave.spawns.forEach((spawn, index) => {
      const enemy = units[index], plain = controls[index];
      if (!enemy || !plain) throw new Error('Missing native actor');
      expect(enemy.stats.attackSpeed).toBe(plain.stats.attackSpeed * (spawn.eliteAffix ? 1.5 : 1));
      expect({ ...enemy, stats: plain.stats }).toEqual(plain);
      if (spawn.eliteAffix) affected++;
    });
  }
  expect(affected).toBeGreaterThan(0);
  expect(input).toEqual(before);
});

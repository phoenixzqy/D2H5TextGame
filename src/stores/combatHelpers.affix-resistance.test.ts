import { expect, it } from 'vitest';
import { eliteConfig, subAreas } from '../data';
import { resolveDamage } from '../engine/combat/damage';
import { resolveChallengeWavePlan, type WaveSpec } from '../engine/combat/sub-area-run';
import { createRng } from '../engine/rng';
import { buildEnemiesForWave } from './combatHelpers';

const cold = eliteConfig.affixes.find(affix => affix.id === 'elite-affix/cold-enchanted');
if (!cold) throw new Error('Missing authored Cold Enchanted affix');
const wave: WaveSpec = {
  id: 'cold-affix-native-fixture', waveTier: 'elite',
  spawns: [{ archetypeId: 'monsters/act1.fallen', tier: 'champion', level: 7,
    index: 0, eliteAffix: cold }]
};

it('gives native Cold Enchanted 50 cold resistance while preserving Frost Nova and other stats', () => {
  const before = structuredClone(wave);
  const [enemy] = buildEnemiesForWave(wave, 7);
  const [plain] = buildEnemiesForWave({ ...wave, spawns: wave.spawns.map(
    ({ eliteAffix: _affix, ...spawn }) => spawn) }, 7);
  if (!enemy || !plain) throw new Error('Missing native enemy');
  expect(enemy.stats.resistances.cold).toBe(50);
  expect(plain.stats.resistances.cold).toBe(0);
  expect(enemy.skillOrder).toEqual([...plain.skillOrder, 'monster-frost-nova']);
  expect({ ...enemy.stats.resistances, cold: plain.stats.resistances.cold }).toEqual(plain.stats.resistances);
  expect({ ...enemy.stats, resistances: plain.stats.resistances }).toEqual(plain.stats);
  const { frostAura, ...withoutAura } = enemy;
  expect(frostAura).toEqual({ damage: 15, intervalMs: 5000, chillDurationMs: 2000 });
  expect({ ...withoutAura, stats: plain.stats, skillOrder: plain.skillOrder }).toEqual(plain);
  expect(buildEnemiesForWave(wave, 7)).toEqual([enemy]);
  expect(wave).toEqual(before);
});

it('adds the cold bonus to rare elite resistance before the existing 75 percent cap', () => {
  const [enemy] = buildEnemiesForWave({ ...wave,
    spawns: wave.spawns.map(spawn => ({ ...spawn, tier: 'rare-elite' })) }, 7);
  if (!enemy) throw new Error('Missing native rare elite');
  expect(enemy.stats.resistances.cold).toBe(75);
  expect(enemy.stats.resistances.fire).toBe(eliteConfig.rareEliteResistanceBonus);
});

it('reduces actual cold hit damage through native resistance while preserving physical damage', () => {
  const [enemy] = buildEnemiesForWave(wave, 7);
  const [plain] = buildEnemiesForWave({ ...wave, spawns: wave.spawns.map(
    ({ eliteAffix: _affix, ...spawn }) => spawn) }, 7);
  if (!enemy || !plain) throw new Error('Missing native enemy');
  const hit = (target: typeof enemy, type: 'cold' | 'physical') => resolveDamage({
    baseMin: 1000, baseMax: 1000, flatBonus: 0, increasedPct: 0, comboMult: 1,
    critChance: 0, critMult: 1.5, defenderDodge: 0, hitChance: 1, type,
    defenderResistances: target.stats.resistances,
    defenderArmor: target.stats.defense, defenderMagicResist: target.stats.magicResist
  }, createRng(7));
  expect(hit(enemy, 'cold').effectiveResistPct).toBe(50);
  expect(hit(plain, 'cold').final - hit(enemy, 'cold').final).toBe(500);
  expect(hit(enemy, 'physical')).toEqual(hit(plain, 'physical'));
});

it('uses authored bonuses rather than inferring defense from the affix name or Frost Nova', () => {
  const { resistanceBonuses: _bonuses, ...legacyCold } = cold;
  const built = (eliteAffix: typeof cold) => buildEnemiesForWave({ ...wave,
    spawns: wave.spawns.map(spawn => ({ ...spawn, eliteAffix })) }, 7)[0];
  expect(built(legacyCold)?.stats.resistances.cold).toBe(0);
  expect(built({ id: 'elite-affix/custom', nameKey: 'fixture.custom',
    skillId: 'monster-frost-nova', resistanceBonuses: { cold: 12.5 } })?.stats.resistances.cold).toBe(12.5);
  for (const affix of eliteConfig.affixes.filter(affix => affix.id !== cold.id)) {
    expect(built(affix)?.stats.resistances.cold).toBe(0);
  }
});

it.each([
  ['areas/act1-den-of-evil', 'manual'], ['areas/act1-den-of-evil', 'idle'],
  ['areas/act2-rocky-waste', 'manual'], ['areas/act2-rocky-waste', 'idle']
] as const)('adds resistance to exactly the cold affix carriers in native %s %s plans', (areaId, mode) => {
  const area = subAreas.find(row => row.id === areaId);
  if (!area) throw new Error('Missing native area');
  const input = { subArea: area, mode, seed: 7, challengeOrdinal: 0, idleEliteMisses: 11,
    fallbackArchetypeId: 'monsters/act1.fallen', fallbackLevel: area.areaLevel,
    eliteConfig: { ...eliteConfig, affixes: [cold] } };
  const before = structuredClone(input);
  const { resistanceBonuses: _bonuses, ...legacyCold } = cold;
  const plan = resolveChallengeWavePlan(input);
  let affected = 0;
  for (const row of plan.waves) {
    const units = buildEnemiesForWave(row, 7);
    const controls = buildEnemiesForWave({ ...row, spawns: row.spawns.map(spawn =>
      spawn.eliteAffix ? { ...spawn, eliteAffix: legacyCold } : spawn) }, 7);
    row.spawns.forEach((spawn, index) => {
      const enemy = units[index], plain = controls[index];
      if (!enemy || !plain) throw new Error('Missing native actor');
      expect(enemy.stats.resistances.cold).toBe(Math.min(75,
        plain.stats.resistances.cold + (spawn.eliteAffix ? 50 : 0)));
      expect({ ...enemy, stats: plain.stats }).toEqual(plain);
      expect({ ...enemy.stats, resistances: plain.stats.resistances }).toEqual(plain.stats);
      expect({ ...enemy.stats.resistances, cold: plain.stats.resistances.cold }).toEqual(plain.stats.resistances);
      if (spawn.eliteAffix) affected++;
    });
  }
  expect(affected).toBeGreaterThan(0);
  expect(input).toEqual(before);
});

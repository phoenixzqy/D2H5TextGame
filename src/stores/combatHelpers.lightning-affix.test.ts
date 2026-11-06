import { beforeEach, expect, it } from 'vitest';
import { eliteConfig, subAreas } from '../data';
import { buildEnemiesForWave } from './combatHelpers';
import { resolveChallengeWavePlan } from '../engine/combat/sub-area-run';
import { loadDefaultSkills, resetRegistry } from '../engine/skills/registry';
import type { MonsterTier } from '../engine/combat/types';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
function affix() {
  const row = eliteConfig.affixes.find(a => a.id === 'elite-affix/lightning-enchanted');
  if (!row) throw new Error('Missing standard Lightning affix');
  return row;
}
function native(tier: MonsterTier = 'champion', affixed = true) {
  const [unit] = buildEnemiesForWave({ id: 'lightning-native-fixture', waveTier: 'elite',
    spawns: [{ archetypeId: 'monsters/act2.sand-raider', tier, level: 20, index: 0,
      ...(affixed ? { eliteAffix: affix() } : {}) }] }, 7);
  if (!unit) throw new Error('Missing native enemy');
  return unit;
}
it('constructs the standard native Lightning resistance and receiving-hit reaction', () => {
  const unit = native(), plain = native('champion', false);
  expect(unit.stats.resistances.lightning).toBe(50);
  expect(unit).toHaveProperty('lightningRetaliation', { chance: 0.25, damage: [40, 60] });
  expect(unit.skillOrder).toEqual([...plain.skillOrder, 'monster-lightning']);
  expect(native('rare-elite').stats.resistances.lightning).toBe(75);
  expect(native('rare-minion').stats.resistances.lightning).toBe(50);
});
it.each(['manual', 'idle'] as const)('preserves the ActI %s exception and standard II–V carriers', mode => {
  const pool = { ...eliteConfig, affixes: [affix()] };
  for (const act of [1, 2, 3, 4, 5]) {
    const area = subAreas.find(a => a.actId === `acts/act${String(act)}` && !a.chapterBoss);
    if (!area) throw new Error('Missing authored nonchapter area');
    const plan = resolveChallengeWavePlan({ subArea: area, mode, seed: 7, challengeOrdinal: 0,
      idleEliteMisses: 11, fallbackArchetypeId: 'monsters/act1.fallen', fallbackLevel: area.areaLevel,
      eliteConfig: pool });
    const before = structuredClone(plan);
    let carriers = 0;
    for (const wave of plan.waves) {
      const units = buildEnemiesForWave(wave, 7);
      wave.spawns.forEach((spawn, index) => {
        if (!spawn.eliteAffix) return;
        carriers++;
        const unit = units[index];
        if (!unit) throw new Error('Missing planned enemy');
        if (act === 1) {
          expect(spawn.eliteAffix.skillId).toBe('monster-act1-lightning-affix');
          expect(spawn.eliteAffix.resistanceBonuses?.lightning).toBeUndefined();
          expect(unit.lightningRetaliation).toBeUndefined();
        } else {
          expect(unit.lightningRetaliation).toEqual({ chance: 0.25, damage: [40, 60] });
          expect(unit.stats.resistances.lightning).toBeGreaterThanOrEqual(50);
        }
      });
    }
    expect(carriers).toBeGreaterThan(0);
    expect(plan).toEqual(before);
  }
});

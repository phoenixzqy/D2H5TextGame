import { expect, it } from 'vitest';
import { eliteConfig, subAreas } from '../data';
import { runBattleRecorded } from '../engine/combat/combat';
import type { CombatUnit } from '../engine/combat/types';
import { resolveChallengeWavePlan, type WaveSpec } from '../engine/combat/sub-area-run';
import { loadDefaultSkills } from '../engine/skills/registry';
import { buildEnemiesForWave } from './combatHelpers';

const aura = { damage: 15, intervalMs: 5000, chillDurationMs: 2000 };
const cold = eliteConfig.affixes.find(affix => affix.id === 'elite-affix/cold-enchanted');
if (!cold) throw new Error('Missing authored Cold Enchanted affix');
const wave: WaveSpec = {
  id: 'cold-affix-aura-fixture', waveTier: 'elite',
  spawns: [{ archetypeId: 'monsters/act1.fallen', tier: 'champion', level: 7,
    index: 0, eliteAffix: cold }]
};

it.each(['champion', 'rare-elite'] as const)('builds passive Frost Aura on native %s Cold Enchanted', tier => {
  const input = { ...wave, spawns: wave.spawns.map(spawn => ({ ...spawn, tier })) };
  const before = structuredClone(input);
  const [enemy] = buildEnemiesForWave(input, 7);
  expect(enemy?.frostAura).toEqual(aura);
  expect(enemy?.frostAura).not.toBe(cold.frostAura);
  expect(Object.isFrozen(enemy?.frostAura)).toBe(true);
  expect(enemy?.skillOrder).toContain('monster-frost-nova');
  expect(enemy?.stats.resistances.cold).toBe(tier === 'champion' ? 50 : 75);
  expect(buildEnemiesForWave(input, 7)).toEqual([enemy]);
  expect(input).toEqual(before);
});

it.each(['manual', 'idle'] as const)('applies passive metadata only to cold carriers in native %s plans', mode => {
  const area = subAreas.find(row => row.id === 'areas/act1-den-of-evil');
  if (!area) throw new Error('Missing native Den');
  const input = { subArea: area, mode, seed: 7, challengeOrdinal: 0, idleEliteMisses: 11,
    fallbackArchetypeId: 'monsters/act1.fallen', fallbackLevel: area.areaLevel,
    eliteConfig: { ...eliteConfig, affixes: [cold] } };
  const before = structuredClone(input);
  let carriers = 0, plain = 0;
  for (const row of resolveChallengeWavePlan(input).waves) {
    const units = buildEnemiesForWave(row, 7);
    row.spawns.forEach((spawn, index) => {
      expect(units[index]?.frostAura).toEqual(spawn.eliteAffix ? aura : undefined);
      if (spawn.eliteAffix) carriers++;
      else plain++;
    });
  }
  expect(carriers).toBeGreaterThan(0);
  expect(plain).toBeGreaterThan(0);
  expect(input).toEqual(before);
});

it('does not infer a passive from an affix name or Frost Nova skill', () => {
  const { frostAura: _aura, ...legacy } = cold;
  const built = (eliteAffix: typeof cold) => buildEnemiesForWave({ ...wave,
    spawns: wave.spawns.map(spawn => ({ ...spawn, eliteAffix })) }, 7)[0];
  expect(built(legacy)?.frostAura).toBeUndefined();
  expect(built({ ...legacy, id: 'elite-affix/custom', frostAura: { ...aura, damage: 9 } })?.frostAura)
    .toEqual({ ...aura, damage: 9 });
  for (const affix of eliteConfig.affixes.filter(affix => affix.id !== cold.id)) {
    expect(built(affix)?.frostAura).toBeUndefined();
  }
});

it('pulses through native metadata every elapsed turn against the party, independently of actions', () => {
  loadDefaultSkills();
  const [native] = buildEnemiesForWave(wave, 7);
  if (!native) throw new Error('Missing native enemy');
  const enemy = { ...native, stats: { ...native.stats, attack: 0 }, skillOrder: [] };
  const target = (id: string, kind: 'hero' | 'merc' | 'summon'): CombatUnit => ({
    id, name: id, side: 'player', kind, level: 7, tier: 'trash',
    life: 100_000, mana: 0, skillOrder: [], statuses: [], cooldowns: {},
    activeBuffIds: [], enraged: false,
    ...(kind === 'summon' ? { summonOwnerId: 'hero' } : {}),
    stats: { ...native.stats, life: 100_000, lifeMax: 100_000, attack: 0,
      attackSpeed: 100, magicResist: kind === 'hero' ? 2 : 0,
      resistances: { physical: 0, fire: 0, cold: kind === 'hero' ? 50 : 0,
        lightning: 0, arcane: 0, poison: 0 } }
  });
  const input = { seed: 7, playerTeam: [target('hero', 'hero'), target('merc', 'merc'),
    target('summon', 'summon')], enemyTeam: [enemy] };
  const before = structuredClone(input);
  const out = runBattleRecorded(input);
  const { frostAura: _aura, ...plain } = enemy;
  const control = runBattleRecorded({ ...input, enemyTeam: [plain] });
  for (const unit of input.playerTeam) {
    const pulses = out.events.filter(event => event.kind === 'damage').filter(event =>
      event.source === enemy.id && event.target === unit.id && event.damageType === 'cold');
    expect(pulses.map(event => [event.simClockMs, event.amount, event.crit, event.dodged]))
      .toEqual(Array.from({ length: 12 }, (_, i) => [(i + 1) * 5000,
        unit.kind === 'hero' ? 5 : 15, false, false]));
    expect(out.events.filter(event => event.kind === 'status' && event.target === unit.id &&
      event.statusId === 'chill').map(event => event.simClockMs))
      .toEqual(Array.from({ length: 12 }, (_, i) => (i + 1) * 5000));
  }
  const actions = (events: typeof out.events) => events.filter(event => event.kind === 'action').filter(event =>
    event.actor === enemy.id).map(event => [event.simClockMs, event.skillId]);
  expect(actions(out.events)).toEqual(actions(control.events));
  expect(actions(out.events).length).toBeGreaterThan(0);
  expect(control.events.some(event => event.kind === 'damage' && event.damageType === 'cold')).toBe(false);
  expect(input).toEqual(before);
});

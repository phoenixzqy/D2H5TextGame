import { afterEach, beforeEach, expect, it } from 'vitest';
import { subAreas } from '../data';
import { loadGameData, validateGameData } from '../data/loader';
import monsterSchema from '../data/schema/monster.schema.json';
import { buildMonsterUnit } from '../engine/combat/monster-factory';
import { createRng } from '../engine/rng';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '../engine/combat/combat';
import { resolveChallengeWavePlan } from '../engine/combat/sub-area-run';
import type { CombatUnit } from '../engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '../engine/skills/registry';
import { buildEnemiesForWave } from './combatHelpers';

beforeEach(() => {
  resetRegistry();
  loadDefaultSkills();
});
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});

function target(id: string, kind: 'hero' | 'merc' | 'summon'): CombatUnit {
  return {
    id,
    name: id,
    kind,
    side: 'player',
    level: 32,
    tier: 'trash',
    life: 100_000,
    mana: 0,
    ...(kind === 'summon' ? { summonOwnerId: 'hero' } : {}),
    stats: {
      life: 100_000,
      lifeMax: 100_000,
      mana: 0,
      manaMax: 0,
      attack: 0,
      defense: 0,
      magicResist: 0,
      attackSpeed: 100,
      critChance: 0,
      critDamage: 1.5,
      physDodge: 0,
      magicDodge: 0,
      magicFind: 0,
      goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 }
    },
    statuses: [],
    skillOrder: [],
    activeBuffIds: [],
    cooldowns: {},
    enraged: false
  };
}

it.each(['manual', 'idle'] as const)(
  'native %s Tomb Duriel chills the whole party and retains Charge',
  async (mode) => {
    const data = await loadGameData();
    const area = subAreas.find((row) => row.id === 'areas/act2-tomb-of-tal-rasha');
    if (!area) throw new Error('Missing native Tomb');
    expect(data.subAreas.get(area.id)).toEqual(area);
    const plan = resolveChallengeWavePlan({
      subArea: area,
      mode,
      seed: 13,
      challengeOrdinal: 450,
      fallbackArchetypeId: 'monsters/act2.duriel',
      fallbackLevel: area.areaLevel
    });
    const wave = plan.waves.find((row) =>
      row.spawns.some((spawn) => spawn.tier === 'chapter-boss')
    );
    if (!wave) throw new Error('Missing native chapter boss');
    const beforeWave = structuredClone(wave);
    const enemies = buildEnemiesForWave(wave, 13);
    const duriel = enemies[0];
    if (!duriel) throw new Error('Missing native Duriel');
    expect(duriel.monsterArchetypeId).toBe('monsters/act2.duriel');
    expect(duriel.stats).toMatchObject({ lifeMax: 25_600, attack: 350, defense: 280 });
    const snapshot: CombatSnapshot = {
      seed: 13,
      act: 2,
      playerTeam: [
        target('hero', 'hero'),
        target('merc', 'merc'),
        target('hero-summon-fixture', 'summon')
      ],
      enemyTeam: enemies
    };
    const before = structuredClone(snapshot);
    const recorded = runBattleRecorded(snapshot);
    expect(duriel.skillOrder).toEqual(['monster-charge']);
    expect(duriel.frostAura).toEqual({ damage: 15, intervalMs: 5000, chillDurationMs: 2000 });
    expect(recorded.events.some(event => event.kind === 'action' &&
      event.actor === duriel.id && event.skillId === 'monster.frost_aura')).toBe(false);
    expect(recorded.events.filter(event => event.kind === 'action').filter(event => event.actor === duriel.id)
      .slice(0, 4).map(event => [event.simClockMs, event.skillId]))
      .toEqual([[1500, 'monster.charge'], [3000, null], [4500, null], [6000, 'monster.charge']]);
    expect(
      recorded.events.find((event) => event.kind === 'action' && event.actor === duriel.id)
    ).toMatchObject({ skillId: 'monster.charge' });
    for (const unit of snapshot.playerTeam) {
      const pulses = recorded.events.filter(event => event.kind === 'damage' &&
        event.source === duriel.id && event.target === unit.id && event.damageType === 'cold');
      expect(pulses.map(event => event.simClockMs)).toEqual(
        Array.from({ length: 12 }, (_, index) => (index + 1) * 5000));
      expect(recorded.events).toContainEqual(
        expect.objectContaining({
          kind: 'damage',
          source: duriel.id,
          target: unit.id,
          damageType: 'cold',
          amount: 15,
          crit: false,
          dodged: false,
          simClockMs: 5000
        })
      );
      expect(recorded.events).toContainEqual(
        expect.objectContaining({
          kind: 'status',
          target: unit.id,
          statusId: 'chill',
          simClockMs: 5000
        })
      );
      // Cadence telemetry is hero-only. Actual action times prove that Chill
      // slows every role, preserving pending progress at onset and expiry.
      const actions = recorded.events.filter(
        (event) => event.kind === 'action' && event.actor === unit.id
      );
      expect(actions[0]?.simClockMs).toBe(1700);
      expect(actions[1]?.simClockMs).toBe(3400);
      expect(actions[2]?.simClockMs).toBeCloseTo(
        5000 + ((5100 - 5000) * 2000) / 1700,
        8
      );
      expect(actions[3]?.simClockMs).toBeCloseTo(7100, 8);
      expect(actions[4]?.simClockMs).toBeCloseTo(8800, 8);
    }
    expect(recorded.events).toContainEqual(
      expect.objectContaining({
        kind: 'cadence-state',
        target: 'hero',
        periodMs: 2000,
        simClockMs: 5000
      })
    );
    expect(recorded.events).toContainEqual(
      expect.objectContaining({
        kind: 'cadence-state',
        target: 'hero',
        periodMs: 1700,
        simClockMs: 7000
      })
    );
    expect(snapshot).toEqual(before);
    expect(wave).toEqual(beforeWave);
    expect(buildEnemiesForWave(wave, 13)).toEqual(enemies);
    expect(runBattle(snapshot)).toEqual(recorded.result);
    expect(runBattleRecorded(snapshot)).toEqual(recorded);
  }
);

it('validates passive aura metadata and copies it independently through the factory', async () => {
  const data = await loadGameData();
  const def = data.monsters.get('monsters/act2.duriel');
  if (!def?.frostAura) throw new Error('Missing native passive aura');
  const unit = buildMonsterUnit({ def, level: 32, tier: 'boss', rng: createRng(13) });
  expect(unit.frostAura).toEqual(def.frostAura);
  expect(unit.frostAura).not.toBe(def.frostAura);
  expect(Object.isFrozen(unit.frostAura)).toBe(true);
  expect(() => validateGameData(monsterSchema.$id, def)).not.toThrow();
  for (const invalid of [null, {}, { ...def.frostAura, damage: -1 },
    { ...def.frostAura, intervalMs: 0 }, { ...def.frostAura, intervalMs: 1000.5 },
    { ...def.frostAura, chillDurationMs: 0 }, { ...def.frostAura, extra: true }]) {
    expect(() => validateGameData(monsterSchema.$id, { ...def, frostAura: invalid })).toThrow();
  }
  expect(data.monsters.get('monsters/act5.frozen-terror')?.frostAura).toBeUndefined();
});

import missileRows from '../../data/skills/monsters.json';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import act1Areas from '../../data/maps/sub-areas/act1.json';
import type { SubAreaDef } from '../types/maps';
import type { EliteAffixDef } from '../types/elite';
import type { MonsterDef } from '../types/monsters';
import * as rngModule from '../rng';
import { getSkill, listSkills, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { ACT1_LIGHTNING_AFFIX_SKILL } from '../skills/act1-lightning';
import { DEFAULT_ELITE_CONFIG, resolveChallengeWavePlan, resolveWavePlan } from './sub-area-run';
import { buildMonsterUnit } from './monster-factory';
import { runBattleRecorded, type RecordedBattleEvent } from './combat';
import type { CombatUnit, MonsterTier } from './types';

const id = 'monster-act1-lightning-affix';
const canonical = 'monster.act1_lightning_affix';
const lightning = DEFAULT_ELITE_CONFIG.affixes.find(row => row.skillId === 'monster-lightning');
if (!lightning) throw new Error('Missing built-in Lightning affix');
const area = (act1Areas as SubAreaDef[]).find(row => row.id === 'areas/act1-blood-moor');
if (!area) throw new Error('Missing actual Moor');
const authoredArea = area;
const sourceAffix = lightning;
function plan(affix: EliteAffixDef = sourceAffix, act = 1, mode: 'manual' | 'idle' = 'manual') {
  return resolveChallengeWavePlan({
    subArea: { ...authoredArea, actId: `acts/act${String(act)}` },
    fallbackArchetypeId: 'monsters/act1.fallen', fallbackLevel: 6,
    seed: 1, challengeOrdinal: 40, mode, idleEliteMisses: 11,
    eliteConfig: { ...DEFAULT_ELITE_CONFIG, affixes: [affix] }
  });
}
const definition: MonsterDef = {
  id: 'monsters/test', name: 'Test', life: [100000, 100000], lifeGrowth: [0, 0],
  skills: [], attackSpeed: 100, baseExperience: 1, canBeElite: true, canBeBoss: false
};
function monster(level = 4, tier: MonsterTier = 'champion', extraSkillIds: readonly string[] = [id],
  skillOrderOverride?: readonly string[]) {
  return buildMonsterUnit({ def: definition, level, tier, rng: rngModule.createRng(1),
    extraSkillIds, ...(skillOrderOverride === undefined ? {} : { skillOrderOverride }) });
}
function hero(name = 'hero'): CombatUnit {
  const native = monster(1, 'trash', []);
  return { ...native, id: name, name, side: 'player', kind: name === 'hero' ? 'hero' : 'merc',
    stats: { ...native.stats, attack: 1, defense: 0, magicResist: 0, critChance: 0,
      physDodge: 0, magicDodge: 0, attackSpeed: 10,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function battle(caster: CombatUnit, defenders: readonly CombatUnit[] = [hero()], endpoint: 'min' | 'max' = 'max') {
  const random = rngModule.createRng(1);
  vi.spyOn(random, 'nextInt').mockImplementation((min, max) => endpoint === 'min' ? min : max);
  // Endpoint damage tests control the existing RNG boundary: normal hits pass,
  // guaranteed dodge fails, and crit follows the actor's zero/one probability.
  vi.spyOn(random, 'chance').mockImplementation(probability => probability > 0.05);
  vi.spyOn(rngModule, 'createRng').mockReturnValue(random);
  const snapshot = { seed: 1, playerTeam: defenders, enemyTeam: [caster] };
  const before = structuredClone(snapshot);
  const result = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before);
  return result;
}
function lightningHits(result: ReturnType<typeof runBattleRecorded>) {
  return result.events.filter((event): event is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
    event.kind === 'damage' && event.damageType === 'lightning');
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('Act I Lightning affix integration', () => {
  it('registers both spell identities and preserves every authored native monster skill on repeated default loads', () => {
    const ids = [...listSkills()].sort(), source = structuredClone(missileRows);
    const originals = missileRows.map(row => {
      const skill = getSkill(row.id);
      if (!skill) throw new Error(`Missing authored monster skill ${row.id}`);
      return { authoredId: row.id, skill: structuredClone(skill) };
    });
    expect(getSkill(id)).toBe(ACT1_LIGHTNING_AFFIX_SKILL);
    expect(getSkill(canonical)).toBe(ACT1_LIGHTNING_AFFIX_SKILL);
    registerSkill({ ...ACT1_LIGHTNING_AFFIX_SKILL, manaCost: 99 });
    loadDefaultSkills();
    expect(getSkill(id)).toBe(ACT1_LIGHTNING_AFFIX_SKILL);
    expect([...listSkills()].sort()).toEqual(ids);
    for (const original of originals) {
      expect(getSkill(original.authoredId)).toEqual(original.skill);
      expect(getSkill(original.skill.id)).toEqual(original.skill);
    }
    for (const row of missileRows) {
      if (!('projectileFlightMs' in row)) continue;
      const skill = getSkill(row.id);
      expect(skill?.effects.filter(effect => effect.kind === 'damage')).not.toHaveLength(0);
      for (const effect of skill?.effects ?? []) {
        if (effect.kind === 'damage') expect(effect.projectileFlightMs).toBe(row.projectileFlightMs);
      }
    }
    expect(missileRows).toEqual(source);
    expect(getSkill('monster-lightning')?.effects).toEqual([
      { kind: 'damage', damageType: 'lightning', base: [40, 60],
        applyStatus: { id: 'paralyze', chance: 1, stacksOnApply: 1, durationMs: 1000 } }
    ]);
  });

  it.each(['manual', 'idle'] as const)('specializes actual Act I %s promotions without mutating source', mode => {
    const before = structuredClone([authoredArea, sourceAffix, DEFAULT_ELITE_CONFIG]);
    const result = plan(sourceAffix, 1, mode);
    const promoted = result.waves.flatMap(wave => wave.spawns).filter(spawn => spawn.eliteAffix);
    expect(promoted.length).toBeGreaterThan(0);
    for (const spawn of promoted) expect(spawn.eliteAffix).toEqual({ id: sourceAffix.id, nameKey: sourceAffix.nameKey, skillId: id });
    expect([authoredArea, sourceAffix, DEFAULT_ELITE_CONFIG]).toEqual(before);
  });

  it.each([2, 3, 4, 5])('retains the shared Lightning source for Act%i', act => {
    for (const wave of plan(sourceAffix, act).waves) for (const spawn of wave.spawns) {
      if (spawn.eliteAffix) expect(spawn.eliteAffix).toEqual(sourceAffix);
    }
  });

  it.each([
    { ...sourceAffix, id: 'custom/lightning' },
    { ...sourceAffix, nameKey: 'custom.lightning' },
    { ...sourceAffix, skillId: 'monster-fire-ball' },
    ...DEFAULT_ELITE_CONFIG.affixes.filter(row => row.skillId !== 'monster-lightning')
  ])('preserves unrelated/custom affix %j', affix => {
    for (const wave of plan(affix).waves) for (const spawn of wave.spawns) {
      if (spawn.eliteAffix) expect(spawn.eliteAffix).toEqual(affix);
    }
  });

  it('preserves legacy Lightning promotions and dedicated/chapter boss waves', () => {
    const legacy = resolveWavePlan(authoredArea, definition.id, 6, 1, {
      ...DEFAULT_ELITE_CONFIG, normalRareEliteChance: 1, affixes: [sourceAffix]
    });
    const promoted = legacy.waves.flatMap(wave => wave.spawns).filter(spawn => spawn.eliteAffix);
    expect(promoted.length).toBeGreaterThan(0);
    for (const spawn of promoted) expect(spawn.eliteAffix).toEqual(sourceAffix);
    for (const bossArea of (act1Areas as SubAreaDef[]).filter(row => row.hasBoss || row.chapterBoss)) {
      const args = { subArea: bossArea, fallbackArchetypeId: definition.id, fallbackLevel: 6,
        seed: 1, challengeOrdinal: 40 };
      const a = resolveChallengeWavePlan({ ...args, eliteConfig: { ...DEFAULT_ELITE_CONFIG, affixes: [sourceAffix] } });
      const b = resolveChallengeWavePlan({ ...args, eliteConfig: { ...DEFAULT_ELITE_CONFIG, affixes: [{ ...sourceAffix, id: 'custom/lightning' }] } });
      expect(a.waves.filter(wave => wave.waveTier === 'boss')).toEqual(b.waves.filter(wave => wave.waveTier === 'boss'));
      for (const wave of a.waves.filter(wave => wave.waveTier === 'boss')) {
        expect(wave.spawns.every(spawn => !spawn.eliteAffix)).toBe(true);
      }
    }
  });

  it('binds actor level only for an affix leaf present in the effective order, preserving order and RNG', () => {
    const rng = rngModule.createRng(1);
    const controlRng = rngModule.createRng(1);
    const native = buildMonsterUnit({ def: { ...definition, skills: ['monster-fire-bolt'] },
      level: 6, tier: 'rare-minion', rng, extraSkillIds: [id, id] });
    const control = buildMonsterUnit({ def: { ...definition, skills: ['monster-fire-bolt'] },
      level: 6, tier: 'rare-minion', rng: controlRng, extraSkillIds: ['monster-lightning'] });
    expect(native.skillOrder).toEqual(['monster-fire-bolt', id]);
    expect(native.skillLevels).toEqual({ [canonical]: 6 });
    expect({ ...native, skillOrder: [], skillLevels: undefined })
      .toEqual({ ...control, skillOrder: [], skillLevels: undefined });
    expect(rng.next()).toBe(controlRng.next());
    expect(monster(6, 'rare-minion', [id], []).skillLevels).toBeUndefined();
    expect(monster(6, 'rare-minion', [], [id]).skillLevels).toBeUndefined();
    expect(buildMonsterUnit({ def: { ...definition, skills: [id] }, level: 6,
      tier: 'trash', rng: rngModule.createRng(1) }).skillLevels).toBeUndefined();
    expect(monster(6, 'champion', [id], [id]).skillLevels).toEqual({ [canonical]: 6 });
    expect(monster(6, 'champion', [id], [canonical]).skillLevels).toEqual({ [canonical]: 6 });
    expect(monster(6, 'champion', [canonical]).skillLevels).toEqual({ [canonical]: 6 });
    expect(monster(6, 'champion', ['monster-lightning']).skillLevels).toBeUndefined();
  });

  it.each([1, 3, 4, 6, 8, 15, 16])('uses exact L%i damage endpoints through real combat', level => {
    for (const endpoint of ['min', 'max'] as const) {
      const native = monster(level);
      const caster = { ...native, stats: { ...native.stats, critChance: 0 } };
      const result = battle(caster, [hero()], endpoint);
      const hits = lightningHits(result);
      expect(hits.length).toBeGreaterThan(1);
      const expected = endpoint === 'min' ? 12 + 2 * (level - 1) : 18 + 3 * (level - 1);
      for (const hit of hits) expect(hit).toMatchObject({ amount: expected, crit: false, dodged: false });
      vi.restoreAllMocks();
    }
  });

  it.each(['champion', 'rare-minion', 'rare-elite'] as const)('ignores tier ATK/player level and rank for %s spell power', tier => {
    const native = monster(6, tier);
    const caster = { ...native, stats: { ...native.stats, attack: 999, critChance: 0 },
      skillLevels: { ...native.skillLevels, [id]: 99, 'skills-monster-act1-lightning-affix': 99 } };
    const defender = { ...hero(), level: 99, skillLevels: { [canonical]: 99 } };
    const result = battle(caster, [defender]);
    expect(lightningHits(result).length).toBeGreaterThan(1);
    for (const hit of lightningHits(result)) expect(hit.amount).toBe(33);
  });

  it('uses MR/resistance, ignores physical DEF, and floors the actor critical multiplier', () => {
    const native = monster(4);
    const caster = { ...native, stats: { ...native.stats, critChance: 1, critDamage: 1.5 } };
    const defender = hero();
    const result = battle(caster, [{ ...defender, stats: { ...defender.stats,
      defense: 99999, magicResist: 5, resistances: { ...defender.stats.resistances, lightning: 20 } } }]);
    expect(lightningHits(result).length).toBeGreaterThan(1);
    for (const hit of lightningHits(result)) expect(hit).toMatchObject({ amount: 27, crit: true, dodged: false });
  });

  it('retains magical dodge instead of guaranteeing a hit', () => {
    const native = monster(4);
    const defender = hero();
    const result = battle({ ...native, stats: { ...native.stats, critChance: 0 } },
      [{ ...defender, stats: { ...defender.stats, magicDodge: 1 } }]);
    expect(lightningHits(result).length).toBeGreaterThan(1);
    for (const hit of lightningHits(result)) expect(hit).toMatchObject({ amount: 0, dodged: true });
  });

  it('keeps an ordinary authored leaf at rank one without affix provenance', () => {
    const native = monster(6, 'champion', [], [id]);
    const result = battle({ ...native, stats: { ...native.stats, critChance: 0 } });
    expect(lightningHits(result).length).toBeGreaterThan(1);
    for (const hit of lightningHits(result)) expect(hit.amount).toBe(18);
  });

  it('floors unmitigated L4 maximum crit40 and remains deterministic with the production RNG', () => {
    const native = monster(4);
    const caster = { ...native, stats: { ...native.stats, critChance: 1, critDamage: 1.5 } };
    const endpoint = battle(caster);
    for (const hit of lightningHits(endpoint)) expect(hit.amount).toBe(40);
    expect(lightningHits(endpoint).length).toBeGreaterThan(1);
    vi.restoreAllMocks();
    const snapshot = { seed: 1, enemyTeam: [caster], playerTeam: [hero(), hero('merc')] };
    const before = structuredClone(snapshot);
    const result = runBattleRecorded(snapshot);
    expect(runBattleRecorded(snapshot)).toEqual(result);
    expect(snapshot).toEqual(before);
    const hits = lightningHits(result).filter(hit => !hit.dodged);
    expect(hits.length).toBeGreaterThan(1);
    for (const hit of hits) {
      expect(hit.amount).toBeGreaterThanOrEqual(27);
      expect(hit.amount).toBeLessThanOrEqual(40);
      expect(hit.crit).toBe(true);
    }
  });

  it('casts on one existing target per action, costs zero MP, has no status and keeps at least2s between casts', () => {
    const native = monster(4);
    const result = battle({ ...native, stats: { ...native.stats, attack: 1, critChance: 0 } }, [hero(), hero('merc')]);
    const actions = result.events.filter(event => event.kind === 'action' && event.actor === native.id && event.skillId === canonical);
    expect(actions.length).toBeGreaterThan(2);
    for (let i = 0; i < actions.length; i++) {
      const at = actions[i]?.simClockMs;
      const hits = lightningHits(result).filter(event => event.simClockMs === at);
      expect(hits).toHaveLength(1);
      expect(['hero', 'merc']).toContain(hits[0]?.target);
      if (i > 0) expect((at ?? 0) - (actions[i - 1]?.simClockMs ?? 0)).toBeGreaterThanOrEqual(2000);
    }
    expect(result.events.filter(event => event.kind === 'status')).toEqual([]);
    expect(result.result.enemyTeam[0]?.mana).toBe(0);
  });
});

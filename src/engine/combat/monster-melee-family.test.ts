import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { monsters, subAreas } from '@/data/index';
import { prepareEndgameAttempt } from '../endgame/runtime';
import { emptyEndgameState } from '../endgame/state';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { createRng } from '../rng';
import { getSkill, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import { buildMonsterUnit } from './monster-factory';
import { statusActiveAt } from './status';
import { resolveChallengeWavePlan } from './sub-area-run';
import type { CombatUnit, MonsterTier } from './types';

// Literal adopted curves and action oracles; synthetic probes are not earned play.
const cases = [
  {"id": "monsters/act2.bloodhawk", "act": 2, "base": 27.2, "growth": 4.25, "period": 1380, "skills": ["monster-charge"], "sequence": ["monster.charge", null, null, "monster.charge", null, null], "attacks": [27, 74, 124, 143, 143, 405, 152, 105]},
  {"id": "monsters/act2.sand-leaper", "act": 2, "base": 27.2, "growth": 4.25, "period": 1460, "skills": ["monster-leap-attack"], "sequence": ["monster.leap_attack", null, null, "monster.leap_attack", null, null], "attacks": [27, 74, 124, 143, 143, 405, 152, 105]},
  {"id": "monsters/act1.disfigured", "act": 1, "base": 32, "growth": 5, "period": 1740, "skills": ["monster-rend"], "sequence": ["monster.rend", null, "monster.rend", null, "monster.rend", null], "attacks": [32, 87, 146, 168, 168, 477, 179, 123]},
  {"id": "monsters/act2.vulture-demon", "act": 2, "base": 32, "growth": 5, "period": 1580, "skills": ["monster-charge"], "sequence": ["monster.charge", null, null, "monster.charge", null, null], "attacks": [32, 87, 146, 168, 168, 477, 179, 123]},
  {"id": "monsters/act3.jungle-hunter", "act": 3, "base": 32, "growth": 5, "period": 1620, "skills": ["monster-leap"], "sequence": ["monster.leap", null, "monster.leap", null, "monster.leap", null], "attacks": [32, 87, 146, 168, 168, 477, 179, 123]},
  {"id": "monsters/act5.overseer", "act": 5, "base": 32, "growth": 5, "period": 1660, "skills": ["monster-war-cry"], "sequence": ["monster.war_cry", null, null, "monster.war_cry", null, null], "attacks": [32, 87, 146, 168, 168, 477, 179, 123]},
  {"id": "monsters/act1.vile-hunter", "act": 1, "base": 35.2, "growth": 5.5, "period": 1540, "skills": ["monster-charge"], "sequence": ["monster.charge", null, null, "monster.charge", null, null], "attacks": [35, 96, 160, 185, 185, 525, 197, 136]},
  {"id": "monsters/act1.dark-stalker", "act": 1, "base": 35.2, "growth": 5.5, "period": 1540, "skills": ["monster-charge"], "sequence": ["monster.charge", null, null, "monster.charge", null, null], "attacks": [35, 96, 160, 185, 185, 525, 197, 136]},
  {"id": "monsters/act2.marauder", "act": 2, "base": 35.2, "growth": 5.5, "period": 1700, "skills": ["monster-charge"], "sequence": ["monster.charge", null, null, "monster.charge", null, null], "attacks": [35, 96, 160, 185, 185, 525, 197, 136]},
  {"id": "monsters/act2.invader", "act": 2, "base": 35.2, "growth": 5.5, "period": 1660, "skills": ["monster-rend"], "sequence": ["monster.rend", null, "monster.rend", null, "monster.rend", null], "attacks": [35, 96, 160, 185, 185, 525, 197, 136]},
  {"id": "monsters/act2.cave-leaper", "act": 2, "base": 35.2, "growth": 5.5, "period": 1420, "skills": ["monster-leap-attack", "monster-rend"], "sequence": ["monster.leap_attack", "monster.rend", null, "monster.leap_attack", "monster.rend", null], "attacks": [35, 96, 160, 185, 185, 525, 197, 136]},
  {"id": "monsters/act2.undead-scavenger", "act": 2, "base": 35.2, "growth": 5.5, "period": 1540, "skills": ["monster-charge", "monster-rend"], "sequence": ["monster.charge", "monster.rend", null, "monster.charge", "monster.rend", null], "attacks": [35, 96, 160, 185, 185, 525, 197, 136]},
  {"id": "monsters/act4.abyss-knight", "act": 4, "base": 35.2, "growth": 5.5, "period": 1620, "skills": ["monster-charge"], "sequence": ["monster.charge", null, null, "monster.charge", null, null], "attacks": [35, 96, 160, 185, 185, 525, 197, 136]},
  {"id": "monsters/act1.brute", "act": 1, "base": 40, "growth": 6.25, "period": 1900, "skills": ["monster-charge"], "sequence": ["monster.charge", null, null, "monster.charge", null, null], "attacks": [40, 109, 182, 210, 210, 596, 224, 154]},
  {"id": "monsters/act1.yeti", "act": 1, "base": 40, "growth": 6.25, "period": 1860, "skills": ["monster-rend"], "sequence": ["monster.rend", null, "monster.rend", null, "monster.rend", null], "attacks": [40, 109, 182, 210, 210, 596, 224, 154]},
  {"id": "monsters/act1.crusher", "act": 1, "base": 40, "growth": 6.25, "period": 1860, "skills": ["monster-leap-attack", "monster-rend"], "sequence": ["monster.leap_attack", "monster.rend", "monster.leap_attack", "monster.rend", "monster.leap_attack", "monster.rend"], "attacks": [40, 109, 182, 210, 210, 596, 224, 154]},
  {"id": "monsters/act1.hell-bovine", "act": 1, "base": 40, "growth": 6.25, "period": 1900, "skills": ["monster-charge"], "sequence": ["monster.charge", null, null, "monster.charge", null, null], "attacks": [40, 109, 182, 210, 210, 596, 224, 154]},
  {"id": "monsters/act2.dune-beast", "act": 2, "base": 40, "growth": 6.25, "period": 1860, "skills": ["monster-rend"], "sequence": ["monster.rend", null, "monster.rend", null, "monster.rend", null], "attacks": [40, 109, 182, 210, 210, 596, 224, 154]},
  {"id": "monsters/act3.doom-ape", "act": 3, "base": 40, "growth": 6.25, "period": 1580, "skills": ["monster-charge"], "sequence": ["monster.charge", null, null, "monster.charge", null, null], "attacks": [40, 109, 182, 210, 210, 596, 224, 154]},
  {"id": "monsters/act5.death-mauler", "act": 5, "base": 40, "growth": 6.25, "period": 1620, "skills": ["monster-leap-attack"], "sequence": ["monster.leap_attack", null, "monster.leap_attack", null, "monster.leap_attack", null], "attacks": [40, 109, 182, 210, 210, 596, 224, 154]}
] as const;
function definition(id: string) {
  const value = monsters.find(row => row.id === id);
  if (!value) throw new Error('Missing bundled row: ' + id);
  return value;
}
function build(id: string, level = 12, tier: MonsterTier = 'trash') {
  return buildMonsterUnit({ def: definition(id), level, tier, rng: createRng(7), id: 'enemy' });
}
function input(enemy: CombatUnit, act: 1 | 2 | 3 | 4 | 5): CombatSnapshot {
  const hero: CombatUnit = { ...enemy, id: 'hero', kind: 'hero', side: 'player',
    life: 10_000_000, mana: 0, skillOrder: [], attackRange: [0, 0],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    stats: { ...enemy.stats, attack: 0, life: 10_000_000, lifeMax: 10_000_000,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  return { seed: 13, act, playerTeam: [hero], enemyTeam: [enemy] };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
describe.each(cases)('melee signature family $id', spec => {
  it('selects signatures and real ordinary gaps at native cadence without generic filler', () => {
    const enemy = build(spec.id), snapshot = input(enemy, spec.act), before = structuredClone(snapshot);
    expect(enemy.skillOrder).toEqual(spec.skills);
    expect(enemy.basicAttackDelivery).toBe('melee');
    const output = runBattleRecorded(snapshot);
    expect(runBattleRecorded(snapshot)).toEqual(output);
    expect(runBattle(snapshot)).toEqual(output.result);
    expect(snapshot).toEqual(before);
    const actions = output.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'enemy');
    expect(actions.slice(0, 6)).toEqual(spec.sequence.map((skillId, index): unknown =>
      expect.objectContaining({ skillId, simClockMs: spec.period * (index + 1) })));
    expect(actions.some(e => e.skillId?.includes('melee'))).toBe(false);
    const ordinary = actions.filter(e => e.skillId === null);
    if (spec.id === 'monsters/act1.crusher') expect(ordinary).toEqual([]);
    else {
      expect(ordinary.length).toBeGreaterThan(0);
      const times = new Set(ordinary.map(e => e.simClockMs));
      const hits = output.events.filter(e => e.kind === 'damage' && e.source === 'enemy' &&
        times.has(e.simClockMs) && !e.dodged && !e.crit);
      expect(hits.length).toBeGreaterThan(0);
      for (const hit of hits) {
        const prior = output.events.slice(0, output.events.indexOf(hit)).reverse().find(e =>
          e.kind === 'status-state' && e.target === 'hero');
        const bleeding = prior?.kind === 'status-state' && prior.statuses.some(status =>
          status.id === 'bleed' && statusActiveAt(status, hit.simClockMs));
        // Existing Bleed combos amplify subsequent Physical hits by10%, even for old zero-rate markers.
        expect(hit).toMatchObject({ damageType: 'physical',
          amount: Math.floor(spec.attacks[1] * (bleeding ? 1.1 : 1)) });
      }
    }
  });
  it('authors exact role curves across native levels/tiers without altering spawn RNG', () => {
    const probes: [number, MonsterTier][] = [[1, 'trash'], [12, 'trash'], [17, 'elite'],
      [17, 'champion'], [17, 'rare-elite'], [90, 'trash'], [17, 'boss'], [17, 'rare-minion']];
    expect(definition(spec.id)).toMatchObject({ attack: [spec.base, spec.base],
      attackGrowth: [spec.growth, spec.growth], canBeElite: true, canBeBoss: false });
    expect(probes.map(([level, tier]) => build(spec.id, level, tier).stats.attack)).toEqual(spec.attacks);
    expect(probes.map(([level, tier]) => build(spec.id, level, tier).attackRange))
      .toEqual(spec.attacks.map(value => [value, value]));
    const def = definition(spec.id), legacy = { ...def };
    Reflect.deleteProperty(legacy, 'attack'); Reflect.deleteProperty(legacy, 'attackGrowth');
    const a = createRng(7), b = createRng(7);
    const authored = buildMonsterUnit({ def, level: 12, tier: 'trash', rng: a });
    const old = buildMonsterUnit({ def: legacy, level: 12, tier: 'trash', rng: b });
    expect([authored.id, authored.life, authored.stats.defense, authored.stats.magicResist, a.next()])
      .toEqual([old.id, old.life, old.stats.defense, old.stats.magicResist, b.next()]);
  });
});
it('gives actual Rend a finite damaging Bleed instead of a zero-rate marker', () => {
  const native = getSkill('monster-rend');
  expect(native?.effects[0]).toMatchObject({ kind: 'damage', damageType: 'physical', base: [25, 40],
    applyStatus: { id: 'bleed', dotPctOfDamage: 0.1, durationMs: 3000 } });
  const enemy = { ...build('monsters/act1.disfigured'), skillOrder: ['monster-rend'] };
  const output = runBattleRecorded(input(enemy, 1));
  const landed = output.events.find(e => e.kind === 'damage' && e.source === 'enemy' && !e.dodged);
  if (landed?.kind !== 'damage') throw new Error('Missing actual landed Rend');
  const status = output.events.find(e => e.kind === 'status-state' && e.target === 'hero' &&
    e.statuses.some(s => s.id === 'bleed'));
  expect(status).toMatchObject({ simClockMs: landed.simClockMs, statuses: expect.arrayContaining([
    expect.objectContaining({ id: 'bleed', sourceId: 'enemy', stacks: 1,
      dotPerStack: Math.max(1, Math.floor(landed.amount * 0.1)),
      appliedAtMs: landed.simClockMs, expiresAtMs: landed.simClockMs + 3000 })
  ]) as unknown });
  expect(output.events.some(e => e.kind === 'dot' && e.target === 'hero' && e.amount > 0 &&
    e.simClockMs > landed.simClockMs)).toBe(true);
});

// Declared payload probes isolate one real registered action, without rewriting its payload or RNG.
function payloadInput(id: string, skill: string, period: number, dodge = 0): CombatSnapshot {
  const enemy = build(id);
  const snapshot = input({ ...enemy, skillOrder: [skill],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1, appliedAtMs: period + 1 }] }, 1);
  return { ...snapshot, playerTeam: snapshot.playerTeam.map(hero => ({ ...hero,
    stats: { ...hero.stats, physDodge: dodge } })) };
}
it.each([
  ['monster-charge', 1], ['monster-rend', 1], ['monster-leap', 1],
  ['monster-leap-attack', 1], ['monster-war-cry', 2]
] as const)('uses Physical dodge and the native %s target count independently of contact delivery', (skill, targets) => {
  const base = payloadInput('monsters/act1.disfigured', skill, 1740), hero = base.playerTeam[0];
  if (!hero) throw new Error('Missing target');
  for (const dodging of [true, false]) {
    const target = { ...hero, stats: { ...hero.stats,
      physDodge: dodging ? 1 : 0, magicDodge: dodging ? 0 : 1 } };
    const snapshot: CombatSnapshot = { ...base, playerTeam: [target, { ...target, id: 'ally', kind: 'merc' }] };
    const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
    const hits = out.events.filter(e => e.kind === 'damage' && e.source === 'enemy');
    expect(hits).toHaveLength(targets);
    // All five deal Physical damage. War Cry's spell contact does not change its dodge pool.
    const expected = Array.from({ length: targets }, () => dodging);
    expect(hits.map(e => e.kind === 'damage' ? e.dodged : null)).toEqual(expected);
    expect(hits.every(e => e.kind === 'damage' && (e.dodged ? e.amount === 0 : e.amount > 0))).toBe(true);
    if (dodging) expect(out.events.filter(e => e.kind === 'status')).toEqual([]);
    expect(runBattle(snapshot)).toEqual(out.result);
    expect(snapshot).toEqual(before);
  }
});
it.each(['monsters/act1.pitspawn-fouldog', 'monsters/act1.griswold'])(
  'proves shared registered Rend on %s using an explicitly exposed payload', id => {
    const period = id.endsWith('griswold') ? 1740 : 1460;
    const snapshot = payloadInput(id, 'monster-rend', period), before = structuredClone(snapshot);
    const out = runBattleRecorded(snapshot);
    const hits = out.events.filter(e => e.kind === 'damage' && e.source === 'enemy' && !e.dodged);
    expect(hits).toHaveLength(1);
    const hit = hits[0]; if (hit?.kind !== 'damage') throw new Error('Missing landed Rend');
    const rate = Math.max(1, Math.floor(hit.amount * .1));
    expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.statuses.some(s =>
      s.id === 'bleed' && s.dotPerStack === rate && s.stacks === 1 && s.expiresAtMs === period + 3000))).toBe(true);
    const periodic = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'dot' }> => e.kind === 'dot' && e.target === 'hero');
    expect(periodic.reduce((sum, e) => sum + e.amount, 0)).toBe(rate * 3);
    expect(periodic.every(e => e.simClockMs > period && e.simClockMs <= period + 3000)).toBe(true);
    expect(out.result.playerTeam[0]?.statuses.some(s => s.id === 'bleed')).toBe(false);
    expect(runBattle(snapshot)).toEqual(out.result);
    expect(runBattleRecorded(snapshot)).toEqual(out);
    expect(snapshot).toEqual(before);
    // Natural boss cadence is covered separately; these remain focused Rend payload proofs.
    expect(definition(id).skills).toEqual(id.endsWith('griswold')
      ? ['monster-charge', 'monster-rend']
      : ['monster-poison-spit', 'monster-rend']);
  });

it.each(['monster-leap-attack', 'monster-war-cry'])('%s can apply and decline its actual finite native Stun', skill => {
  let proc = 0, declined = 0;
  for (let seed = 0; seed < 16; seed++) {
    const snapshot = payloadInput('monsters/act1.disfigured', skill, 1740);
    const out = runBattleRecorded({ ...snapshot, seed,
      playerTeam: snapshot.playerTeam.map(hero => ({ ...hero, statuses: [] })) });
    const hit = out.events.find(e => e.kind === 'damage' && e.source === 'enemy');
    if (hit?.kind !== 'damage') throw new Error('Missing native attempt');
    const applied = out.events.find(e => e.kind === 'status-state' && e.target === 'hero' &&
      e.statuses.some(status => status.id === 'stun'));
    if (applied?.kind === 'status-state') {
      expect(hit.dodged).toBe(false);
      expect(applied).toMatchObject({ simClockMs: 1740, statuses: expect.arrayContaining([
        expect.objectContaining({ id: 'stun', sourceId: 'enemy', appliedAtMs: 1740,
          expiresAtMs: 2740, stacks: 1 })]) as unknown });
      expect(out.result.playerTeam[0]?.statuses.some(status => status.id === 'stun')).toBe(false);
      proc++;
    } else if (!hit.dodged) declined++;
  }
  expect(proc).toBeGreaterThan(0);
  expect(declined).toBeGreaterThan(0);
});

it('does not apply Rend or periodic damage when the native physical attempt misses', () => {
  const out = runBattleRecorded(payloadInput('monsters/act1.disfigured', 'monster-rend', 1740, 1));
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'enemy'))
    .toEqual([expect.objectContaining({ dodged: true, amount: 0 })]);
  expect(out.events.filter(e => e.kind === 'dot' || e.kind === 'status' && e.statusId === 'bleed')).toEqual([]);
});

it('derives Bleed from the final mitigated hit and preserves the native minimum rate', () => {
  const snapshot = payloadInput('monsters/act1.disfigured', 'monster-rend', 1740);
  const out = runBattleRecorded({ ...snapshot, playerTeam: snapshot.playerTeam.map(hero => ({ ...hero,
    stats: { ...hero.stats, defense: 10000 } })) });
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'enemy')).toMatchObject({ amount: 1 });
  expect(out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'dot' }> => e.kind === 'dot').reduce((sum, e) => sum + e.amount, 0)).toBe(3);
});

it('refreshes real Rend at cap one while retaining first potency and stopping at finite expiry', () => {
  let landedPairs = 0, distinctRates = 0;
  // Fixed seed grid also proves retention when the later hit implies a different rate.
  for (let seed = 0; seed < 16; seed++) {
    const snapshot = payloadInput('monsters/act1.disfigured', 'monster-rend', 3012);
    // Synthetic1004ms cadence allows two real CD2 casts before the first3s bleed expires.
    const enemy = snapshot.enemyTeam[0]; if (!enemy) throw new Error('Missing actor');
    const out = runBattleRecorded({ ...snapshot, seed, enemyTeam: [{ ...enemy,
      stats: { ...enemy.stats, attackSpeed: 187, critChance: 0 } }] });
    const actions = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'enemy');
    expect(actions.map(e => [e.simClockMs, e.skillId])).toEqual([
      [1004, 'monster.rend'], [2008, null], [3012, 'monster.rend']]);
    const first = out.events.find(e => e.kind === 'damage' && e.source === 'enemy');
    if (first?.kind !== 'damage') throw new Error('Missing first Rend attempt');
    const rate = Math.max(1, Math.floor(first.amount * .1));
    const second = out.events.find(e => e.kind === 'damage' && e.source === 'enemy' && e.simClockMs === 3012);
    if (second?.kind !== 'damage') throw new Error('Missing second Rend attempt');
    if (first.dodged || second.dodged) continue;
    landedPairs++;
    if (Math.max(1, Math.floor(second.amount * .1)) !== rate) distinctRates++;
    const refreshed = out.events.find(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 3012 &&
      e.statuses.some(s => s.id === 'bleed' && s.expiresAtMs === 6012));
    expect(refreshed).toMatchObject({ statuses: expect.arrayContaining([expect.objectContaining({ id: 'bleed',
      stacks: 1, dotPerStack: rate, appliedAtMs: 1004, expiresAtMs: 6012 })]) as unknown });
    const periodic = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'dot' }> => e.kind === 'dot');
    expect(periodic.reduce((sum, e) => sum + e.amount, 0)).toBe(Math.floor(rate * 5.008));
    expect(periodic.every(e => e.simClockMs <= 6012)).toBe(true);
  }
  expect(landedPairs).toBeGreaterThan(0);
  expect(distinctRates).toBeGreaterThan(0);
});

it('retains appended elite signature priority before ordinary fallback', () => {
  const enemy = buildMonsterUnit({ def: definition('monsters/act1.vile-hunter'), level: 12,
    tier: 'elite', id: 'enemy', rng: createRng(7), extraSkillIds: ['monster-fire-ball'] });
  expect(enemy.skillOrder).toEqual(['monster-charge', 'monster-fire-ball']);
  const out = runBattleRecorded(input(enemy, 1));
  expect(out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'enemy').slice(0, 3).map(e => e.skillId))
    .toEqual(['monster.charge', 'monster.fire_ball', null]);
});

it('keeps the native Shenk encounter at one Overseer and three boss-tier Maulers with working signatures', () => {
  const area = subAreas.find(row => row.id === 'areas/act5-bloody-foothills');
  if (!area) throw new Error('Missing native Shenk area');
  const plan = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: 'monsters/act5.overseer',
    fallbackLevel: 55, seed: 7, challengeOrdinal: 0 });
  const wave = plan.waves.find(row => row.source?.kind === 'bossEncounter');
  if (!wave) throw new Error('Missing native Shenk encounter');
  expect(wave.spawns.map(row => [row.archetypeId, row.tier])).toEqual([
    ['monsters/act5.overseer', 'boss'], ['monsters/act5.death-mauler', 'boss'],
    ['monsters/act5.death-mauler', 'boss'], ['monsters/act5.death-mauler', 'boss']]);
  const enemies = wave.spawns.map((spawn, index) => buildMonsterUnit({ def: definition(spawn.archetypeId),
    level: spawn.level, tier: spawn.tier, rng: createRng(index), id: `enemy-${String(index)}` }));
  expect(enemies.map(enemy => [enemy.level, enemy.stats.attack])).toEqual([
    [60, 523], [60, 654], [60, 654], [60, 654]]);
  const hero = input(enemies[0] ?? build('monsters/act5.overseer'), 5).playerTeam;
  const snapshot: CombatSnapshot = { seed: 13, act: 5, playerTeam: hero, enemyTeam: enemies };
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  for (const enemy of enemies) {
    const actions = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === enemy.id);
    expect(actions[0]?.skillId).toBe(enemy.monsterArchetypeId === 'monsters/act5.overseer'
      ? 'monster.war_cry' : 'monster.leap_attack');
    expect(actions.some(e => e.skillId === null)).toBe(true);
    expect(actions.some(e => e.skillId?.includes('melee'))).toBe(false);
  }
  expect(runBattle(snapshot)).toEqual(out.result);
  expect(snapshot).toEqual(before);
});

it('uses the actual endgame roster and its L90 Overseer/Mauler ordinary curves', () => {
  const { progress } = prepareEndgameAttempt({ heroId: 'hero', modifierId: 'ashen',
    state: emptyEndgameState(), campaign: campaignEvidence() });
  const selected = progress.plan.waves.flatMap(wave => wave.spawns).filter(spawn =>
    ['monsters/act5.overseer', 'monsters/act5.death-mauler'].includes(spawn.archetypeId));
  expect(new Set(selected.map(spawn => spawn.archetypeId)).size).toBe(2);
  for (const spawn of selected) {
    expect(spawn.level).toBe(90);
    const enemy = build(spawn.archetypeId, spawn.level, spawn.tier);
    expect(enemy.stats.attack).toBe(spawn.archetypeId === 'monsters/act5.overseer' ? 477 : 596);
    const out = runBattleRecorded(input(enemy, 5));
    expect(out.events.some(e => e.kind === 'action' && e.actor === 'enemy' && e.skillId === null)).toBe(true);
  }
});

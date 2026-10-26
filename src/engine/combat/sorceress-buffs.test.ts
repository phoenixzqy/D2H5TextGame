import { afterEach, beforeEach, expect, it } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { paySorceressBuff, SORCERESS_BUFF_DEFINITIONS, type SorceressBuffId } from '../skills/sorceress-buffs';
import type { DamageEffect } from '../skills/effects';
import { payColdArmor } from '../skills/cold-armors';
import { payPeriodicSpell } from '../skills/periodic-spells';

const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture',
  stacks: 1, remaining: -1, appliedAtMs });
function unit(id: string, side: CombatUnit['side'], patch: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 10000, mana: 100, statuses: [], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false,
    stats: { life: 10000, lifeMax: 10000, mana: 100, manaMax: 100, attack: 100,
      attackSpeed: 100, defense: 0, magicResist: 0, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } }, ...patch };
}
function paid(id: SorceressBuffId, rank = 20, attack = 100, start = 0): ActiveStatus {
  const duration = SORCERESS_BUFF_DEFINITIONS[id].durationMs;
  return { id, sourceId: 'hero', stacks: 1, remaining: duration / 1000,
    appliedAtMs: start, expiresAtMs: start + duration,
    sorceressBuff: paySorceressBuff(id, rank, attack) };
}
function scene(rank = 20, hero: Partial<CombatUnit> = {}, enemy: Partial<CombatUnit> = {}): CombatSnapshot {
  return { seed: 7, playerTeam: [unit('hero', 'player', { statuses: [paid('enchant', rank), hold(1701)],
    basicAttack: { damageType: 'physical', damage: [100, 100] }, ...hero })],
  enemyTeam: [unit('enemy', 'enemy', { statuses: [hold()], ...enemy })] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result); return out;
}
function damages(out: ReturnType<typeof runBattleRecorded>) {
  return out.events.filter(e => e.kind === 'damage');
}
function carrier(effect: DamageEffect) {
  registerSkill({ id: 'fixture.weapon', archetype: 'fixture', target: 'single-enemy',
    minLevel: 1, manaCost: 0, cooldown: 100, effects: [effect] });
  return { skillOrder: ['fixture.weapon'] };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each([1, 2, 20])('paid rank%i Enchant adds exact snapshot Fire once to one physical strike', rank => {
  const out = record(scene(rank));
  expect(damages(out)).toEqual([
    expect.objectContaining({ source: 'hero', damageType: 'physical', amount: 100, simClockMs: 1700 }),
    expect.objectContaining({ source: 'hero', damageType: 'fire', amount: rank * 2, simClockMs: 1700 })]);
  expect(out.result.enemyTeam[0]?.life).toBe(10000 - 100 - rank * 2);
  expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'burn')).toEqual([]);
});
it('uses paid Attack rather than later live Attack and keeps fractional Fire until mitigation', () => {
  for (const [snapshot, expected] of [[12.5, 1], [100, 40], [250, 100]]) {
    const out = record(scene(20, { statuses: [paid('enchant', snapshot === 12.5 ? 1 : 20, snapshot), hold(1701)],
      stats: { ...unit('hero', 'player').stats, attack: 9999 } }));
    expect(damages(out)[1]).toMatchObject({ damageType: 'fire', amount: expected });
  }
});
it.each([0, -10000])('adds no Fire for a zero-power or expired paid snapshot (%i)', start => {
  const out = record(scene(20, { statuses: [paid('enchant', 20, start === 0 ? 0 : 100, start), hold(1701)] }));
  expect(damages(out)).toHaveLength(1);
});
it('expires before an action at the exact paid endpoint', () => {
  for (const end of [1700, 1700.001]) {
    const out = record(scene(20, { statuses: [paid('enchant', 20, 100, end - 10000), hold(1701)] }));
    expect(damages(out).filter(e => e.damageType === 'fire')).toHaveLength(end === 1700 ? 0 : 1);
  }
});
it('shares the original hit/crit/base RNG without changing later physical rolls', () => {
  for (let seed = 1; seed <= 16; seed++) {
    const hero = unit('hero', 'player');
    const input = { ...scene(20, { stats: { ...hero.stats, critChance: .5 },
      basicAttack: { damageType: 'physical' as const, damage: [90, 110] }, statuses: [paid('enchant')] }), seed };
    const actual = record(input), control = record({ ...input,
      playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [] })) });
    const physical = (out: typeof actual) => damages(out).filter(e => e.damageType === 'physical')
      .map(({ uiDelayMs, ...e }) => { void uiDelayMs; return e; });
    expect(physical(actual)).toEqual(physical(control));
    for (const e of damages(actual).filter(e => e.damageType === 'fire')) {
      const parent = damages(actual).find(p => p.simClockMs === e.simClockMs && p.damageType === 'physical');
      expect(parent).toMatchObject({ dodged: false, crit: e.crit });
      expect(e.amount).toBe(e.crit ? 80 : 40);
    }
    expect(damages(actual).some(e => e.damageType === 'fire')).toBe(true);
  }
});
it('never appends Fire to a missed weapon hit', () => {
  const enemy = unit('enemy', 'enemy');
  const out = record({ ...scene(20, {}, { stats: { ...enemy.stats, physDodge: 1 } }), seed: 12345 });
  expect(damages(out)).toEqual([expect.objectContaining({ damageType: 'physical', amount: 0, dodged: true })]);
});
it('uses Fire mastery/resistance/Defense and shared crit without copying physical penetration', () => {
  const hero = unit('hero', 'player'), enemy = unit('enemy', 'enemy');
  const out = record(scene(20, { ...carrier({ kind: 'damage', damageType: 'physical', base: [100, 100], ignoresDefense: true }),
    increasedDamagePct: { fire: 1 }, stats: { ...hero.stats, critChance: 1 } },
  { stats: { ...enemy.stats, defense: 7, magicResist: 999, resistances: { ...enemy.stats.resistances, fire: 50 } } }));
  expect(damages(out)).toEqual([
    expect.objectContaining({ damageType: 'physical', amount: 200, crit: true }),
    expect.objectContaining({ damageType: 'fire', amount: 73, crit: true })]);
});
it('applies a carrier status once and does not inherit it onto the added Fire', () => {
  const out = record(scene(20, carrier({ kind: 'damage', damageType: 'physical', base: [100, 100],
    applyStatus: { id: 'bleed', dotPctOfDamage: .1, damageType: 'physical' } })));
  expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'bleed')).toHaveLength(1);
  expect(out.events.flatMap(e => e.kind === 'status-state' && e.target === 'enemy'
    ? e.statuses.filter(s => s.id === 'bleed').map(s => s.dotPerStack) : [])).toContain(10);
});
it('reflects only actual mitigated Physical HP removed, excluding added Fire', () => {
  const enemy = unit('enemy', 'enemy');
  const out = record(scene(20, {}, { physicalReflectionPct: .5,
    stats: { ...enemy.stats, defense: 3, resistances: { ...enemy.stats.resistances, physical: 50 } } }));
  expect(damages(out)).toEqual([
    expect.objectContaining({ damageType: 'physical', amount: 47 }),
    expect.objectContaining({ damageType: 'fire', amount: 37 }),
    expect.objectContaining({ damageType: 'thorns', amount: 23 })]);
});
it.each([50, 120])('closes lethal combined damage once for a target with %i HP', life => {
  const out = record(scene(20, {}, { life }));
  expect(out.result.winner).toBe('player');
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'enemy')).toHaveLength(1);
  expect(out.result.enemyTeam[0]?.life).toBe(0);
});
it.each(['fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns'] as const)(
  'does not enchant a direct %s hit', damageType => {
    const out = record(scene(20, carrier({ kind: 'damage', damageType, base: [100, 100] })));
    expect(damages(out)).toEqual([expect.objectContaining({ damageType, amount: 100 })]);
  });

for (const id of ['teleport', 'enchant'] as const) {
  it(`${id} suppresses recasts during its paid interval, then pays again after expiry and cooldown`, () => {
    const cost = id === 'teleport' ? 16 : 19;
    const input = scene(20, { mana: cost * 2, statuses: [], skillOrder: ['sorceress.' + id],
      sorceressBuffRanks: { teleport: 20, enchant: 20 } });
    const out = record(input);
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'sorceress.' + id).map(e => e.simClockMs))
      .toEqual(id === 'teleport' ? [1700, 5100] : [1700, 11900]);
    expect(out.events.flatMap(e => e.kind === 'mana' && e.reason === 'cast' ? [e.mana] : [])).toEqual([cost, 0]);
    expect(out.result.playerTeam[0]?.stats).toEqual(input.playerTeam[0]?.stats);
  });
  it.each(['mana', 'cooldown', 'merc', 'summon', 'owner', 'unlock', 'rank'] as const)(
    `${id} refuses %s ineligibility before payment`, reason => {
      const hero = unit('hero', 'player', { skillOrder: ['skills-sorceress-' + id],
        sorceressBuffRanks: { teleport: 20, enchant: 20 }, statuses: [hold(1701)],
        ...(reason === 'mana' ? { mana: 0 } : {}),
        ...(reason === 'cooldown' ? { cooldowns: { ['skills-sorceress-' + id]: 100000 } } : {}),
        ...(reason === 'merc' ? { kind: 'merc' } : {}),
        ...(reason === 'summon' ? { summon: true } : {}),
        ...(reason === 'owner' ? { ownerId: 'other' } : {}),
        ...(reason === 'unlock' ? { level: 17 } : {}),
        ...(reason === 'rank' ? { sorceressBuffRanks: { teleport: 21, enchant: 21 } } : {}) });
      const out = record({ seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy', { statuses: [hold()] })] });
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
      expect(out.events.filter(e => e.kind === 'buff' && e.buffId === id)).toEqual([]);
    });
  it.each([1, 2, 20])(`${id} pays authored rank%i once and uses a finite status instead of old marker authority`, rank => {
    const cost = id === 'teleport' ? (rank === 20 ? 16 : 20) : (rank === 20 ? 19 : 22);
    const hero = unit('hero', 'player', { mana: cost, skillOrder: ['sorceress.' + id],
      sorceressBuffRanks: { teleport: id === 'teleport' ? rank : 0, enchant: id === 'enchant' ? rank : 0 },
      activeBuffIds: [id], statuses: [hold(1701)] });
    const out = record({ seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy', { statuses: [hold()] })] });
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 1700 })]);
    expect(out.result.playerTeam[0]?.mana).toBe(0);
    expect(out.events.filter(e => e.kind === 'buff' && e.buffId === id)).toHaveLength(1);
    expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' &&
      e.statuses.some(s => s.id === id && s.sorceressBuff?.rank === rank &&
        s.expiresAtMs === 1700 + SORCERESS_BUFF_DEFINITIONS[id].durationMs))).toBe(true);
    expect(out.result.playerTeam[0]?.activeBuffIds).not.toContain(id);
  });
  it(`${id} refuses missing native rank and malformed registered body without payment`, () => {
    const original = getSkill('sorceress.' + id); if (!original) throw new Error('Missing buff');
    const hero = unit('hero', 'player', { skillOrder: [original.id], statuses: [hold(1701)] });
    for (const actor of [hero, { ...hero, sorceressBuffRanks: { teleport: 20, enchant: 20 } }]) {
      if (actor.sorceressBuffRanks) registerSkill({ ...original, effects: [{ kind: 'buff', id, duration: -1 }] });
      const out = record({ seed: 7, playerTeam: [actor], enemyTeam: [unit('enemy', 'enemy', { statuses: [hold()] })] });
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
      expect(out.events.filter(e => e.kind === 'buff' && e.buffId === id)).toEqual([]);
    }
  });
}

it('allows both paid buffs to coexist, with independent mana/cooldown and finite status playback', () => {
  const out = record(scene(20, { mana: 62, skillOrder: ['sorceress.teleport', 'sorceress.enchant'],
    sorceressBuffRanks: { teleport: 1, enchant: 1 }, statuses: [hold(5101)] }));
  expect(out.events.flatMap(e => e.kind === 'action' && e.skillId ? [[e.skillId, e.simClockMs]] : []))
    .toEqual([['sorceress.teleport', 1700], ['sorceress.enchant', 3400], ['sorceress.teleport', 5100]]);
  expect(out.events.flatMap(e => e.kind === 'mana' && e.reason === 'cast' ? [e.mana] : [])).toEqual([42, 20, 0]);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 5100 &&
    ['teleport', 'enchant'].every(id => e.statuses.some(s => s.id === id && s.sorceressBuff?.rank === 1)))).toBe(true);
  expect(out.result.playerTeam[0]?.activeBuffIds).toEqual([]);
});
it('does not coat actual paid periodic spells, armor reactions or pre-existing DoT', () => {
  const before = scene(), hero = before.playerTeam[0];
  if (!hero) throw new Error('Missing paid fixture');
  for (const mode of ['periodic', 'armor', 'dot'] as const) {
    let actor: CombatUnit = { ...hero, statuses: [hold(), paid('enchant')] };
    if (mode === 'periodic') actor = payPeriodicSpell({ ...actor,
      periodicSpellRanks: { 'fire-wall': 1, 'thunder-storm': 0 } }, 'fire-wall', 1, 0);
    if (mode === 'armor') actor = payColdArmor({ ...actor,
      coldArmorRanks: { 'shiver-armor': 0, 'chilling-armor': 1 } }, 'chilling-armor', 1);
    const enemy = unit('enemy', 'enemy', { statuses: mode === 'armor' ? [hold(1701)] : [hold(),
      ...(mode === 'dot' ? [{ id: 'poison', sourceId: 'hero', stacks: 1, remaining: 3,
        appliedAtMs: 0, expiresAtMs: 3000, dotPerStack: 10, damageType: 'poison' as const }] : [])] });
    const input = { ...before, seed: mode === 'armor' ? 19 : before.seed, playerTeam: [actor], enemyTeam: [enemy] };
    const actual = record(input), control = record({ ...input, playerTeam: [{ ...actor,
      statuses: actor.statuses.filter(s => s.id !== 'enchant') }] });
    const observed = (out: typeof actual) => out.events.filter(e => e.kind === 'damage' || e.kind === 'dot')
      .map(({ uiDelayMs, ...e }) => { void uiDelayMs; return e; });
    expect(observed(actual)).toEqual(observed(control));
    if (mode === 'dot') expect(actual.events.some(e => e.kind === 'dot' && e.amount > 0)).toBe(true);
    else expect(damages(actual).some(e => e.source === 'hero' && e.amount > 0 &&
      e.damageType === (mode === 'periodic' ? 'fire' : 'cold')), mode).toBe(true);
  }
});
it.each(['physical', 'thorns'] as const)('Teleport leaves incoming %s rolls unchanged', damageType => {
  for (let seed = 1; seed <= 32; seed++) {
    const input = scene(20, { statuses: [hold(), paid('teleport', 20, 0, 1000)] },
      { statuses: [hold(1701)], basicAttack: { damageType, damage: [100, 100] } });
    const actual = record({ ...input, seed }), control = record({ ...input, seed,
      playerTeam: input.playerTeam.map(u => ({ ...u, statuses: u.statuses.filter(s => s.id !== 'teleport') })) });
    const incoming = (out: typeof actual) => damages(out).map(({ uiDelayMs, ...e }) => { void uiDelayMs; return e; });
    expect(incoming(actual)).toEqual(incoming(control));
    expect(incoming(actual)).toHaveLength(1);
  }
});
it('does not add weapon Fire to automatic Holy Fire pulses', () => {
  const input: CombatSnapshot = { ...scene(20, { statuses: [hold(), paid('enchant')] }),
    statAura: { selectedAuraId: 'paladin.holy-fire', sourceHeroId: 'hero', rank: 1, maxRank: 20,
      bonuses: { fireDamagePct: .03 }, pulse: { intervalMs: 1000, damage: 20, damageType: 'fire',
        burn: { durationMs: 3000, dotPctOfDamage: .1 } } } };
  const actual = record(input), control = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, statuses: u.statuses.filter(s => s.id !== 'enchant') })) });
  const pulses = (out: typeof actual) => damages(out).map(({ uiDelayMs, ...e }) => { void uiDelayMs; return e; });
  expect(pulses(actual)).toEqual(pulses(control));
  expect(pulses(actual).length).toBeGreaterThan(0);
});

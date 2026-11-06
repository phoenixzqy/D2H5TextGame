import { afterEach, beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/assassin.json';
import barbarianRows from '@/data/skills/barbarian.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';

const traps = ['shock-web', 'charged-bolt-sentry', 'wake-of-fire', 'blade-sentinel',
  'lightning-sentry', 'wake-of-inferno'] as const;
const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'constructed-hold',
  stacks: 1, remaining: -1, appliedAtMs });
function fixture(slug: string, rank = 1, mana = 100): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic native trap', 'assassin'),
    id: 'hero', level: 30, comboOrder: ['skills-assassin-' + slug], skillLevels: {
      ...Object.fromEntries([...traps, 'fire-blast', 'blade-fury'].map(id => ['skills-assassin-' + id, 1])),
      ['skills-assassin-' + slug]: rank
    } });
  const hero: CombatUnit = { ...native, life: 1000, mana,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 1000, manaMax: 100, attackSpeed: 200, attack: 100,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0, critChance: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [hold(901), { id: 'poison', sourceId: 'constructed-clock', stacks: 1,
      remaining: -1, appliedAtMs: 0, dotPerStack: 200, damageType: 'poison' }] };
  const target: CombatUnit = { id: 'target', name: 'Constructed target', side: 'enemy', kind: 'monster',
    tier: 'trash', level: 30, life: 99999, mana: 0, stats: { ...hero.stats, lifeMax: 99999, manaMax: 0 },
    skillOrder: [], skillLevels: {}, cooldowns: {}, activeBuffIds: [], statuses: [hold()], enraged: false };
  return { seed: 19, maxRounds: 20, playerTeam: [hero], enemyTeam: [target] };
}
function record(input: CombatSnapshot, _slug: string, _rank: number) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  const actions = out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'hero');
  const direct = out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero');
  const payments = out.events.filter(e => e.kind === 'mana').filter(e => e.target === 'hero' && e.reason === 'cast');
  return { out, actions, direct, payments };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each([[1, 1, 1], [7, 83, 109], [20, 317, 343]] as const)(
  'BUG549 Lightning Sentry rank%i retains three paid pulses through ordinary Summoner mitigation',
  (rank, minimum, maximum) => {
    const input = fixture('lightning-sentry', rank), target = input.enemyTeam[0];
    if (!target) throw new Error('Missing native mitigation target');
    const { direct, payments } = record({ ...input, enemyTeam: [{ ...target,
      stats: { ...target.stats, defense: 241, magicResist: 81,
        resistances: { ...target.stats.resistances, lightning: 25 } }
    }] }, 'lightning-sentry-mitigation', rank);
    expect(direct.map(event => event.simClockMs)).toEqual([900, 1900, 2900]);
    expect(payments).toHaveLength(1);
    expect(payments[0]?.mana).toBe(78);
    const hits = direct.filter(event => !event.dodged);
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      expect(hit.damageType).toBe('lightning');
      expect(hit.crit).toBe(false);
      expect(hit.amount).toBeGreaterThanOrEqual(minimum);
      expect(hit.amount).toBeLessThanOrEqual(maximum);
    }
  }
);

it.each([
  { boss: 'Mephisto', defense: 360, magicResist: 138, rank: 1, minimum: 1, maximum: 1 },
  { boss: 'Mephisto', defense: 360, magicResist: 138, rank: 7, minimum: 410, maximum: 435 },
  { boss: 'Mephisto', defense: 360, magicResist: 138, rank: 20, minimum: 1970, maximum: 1995 },
  { boss: 'Baal', defense: 560, magicResist: 243, rank: 1, minimum: 1, maximum: 1 },
  { boss: 'Baal', defense: 560, magicResist: 243, rank: 7, minimum: 210, maximum: 235 },
  { boss: 'Baal', defense: 560, magicResist: 243, rank: 20, minimum: 1770, maximum: 1795 }
] as const)('BUG550 Blade Sentinel rank$rank keeps three paid Physical pulses through $boss armor',
  ({ defense, magicResist, rank, minimum, maximum }) => {
    const input = fixture('blade-sentinel', rank), target = input.enemyTeam[0];
    if (!target) throw new Error('Missing native physical mitigation target');
    const { direct, payments } = record({ ...input, enemyTeam: [{ ...target,
      stats: { ...target.stats, defense, magicResist,
        resistances: { ...target.stats.resistances, physical: 0, lightning: 75 } }
    }] }, 'blade-sentinel-mitigation', rank);
    expect(direct.map(event => event.simClockMs)).toEqual([900, 1900, 2900]);
    expect(payments).toHaveLength(1);
    expect(payments[0]?.mana).toBe(85);
    const hits = direct.filter(event => !event.dodged);
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      expect(hit.damageType).toBe('physical');
      expect(hit.crit).toBe(false);
      expect(hit.amount).toBeGreaterThanOrEqual(minimum);
      expect(hit.amount).toBeLessThanOrEqual(maximum);
    }
  }
);

for (const slug of traps) for (const rank of [1, 2, 20])
  it(`${slug} rank${String(rank)} keeps attacking after one paid native cast while its living caster is held`, () => {
    const skill = getSkill('skills-assassin-' + slug);
    if (!skill) throw new Error('Missing authored trap skill');
    const { out, actions, direct, payments } = record(fixture(slug, rank), slug, rank);
    expect(actions).toEqual([expect.objectContaining({ skillId: 'assassin.' + slug.replaceAll('-', '_'), simClockMs: 900 })]);
    expect(payments).toHaveLength(1);
    expect(out.result.playerTeam[0]?.mana).toBe(100 - skill.manaCost - (rank - 1) * (skill.manaCostPerRank ?? 0));
    expect(out.events.find(e => e.kind === 'death' && e.target === 'hero')?.simClockMs).toBe(5000);
    expect(direct.map(e => e.simClockMs)).toEqual([900, 1900, 2900]);
    expect(direct.some(e => e.amount > 0 && e.simClockMs > 901 && e.simClockMs < 5000)).toBe(true);
  });

for (const slug of traps)
  it(`${slug} with no mana cannot create autonomous damage`, () => {
    const { direct, payments } = record(fixture(slug, 1, 0), slug + '-unpaid', 1);
    expect(payments).toEqual([]);
    expect(direct.filter(e => e.simClockMs > 901)).toEqual([]);
  });

it('ordinary Fire Blast remains a single cast, and its later Burn ticks are not trap pulses', () => {
  const { direct, payments } = record(fixture('fire-blast'), 'fire-blast-control', 1);
  expect(payments).toHaveLength(1);
  expect(direct.map(e => e.simClockMs)).toEqual([900]);
});

it('existing paid Blaze proves the same observer can see autonomous direct hits through caster control', () => {
  const input = fixture('fire-blast'), oldHero = input.playerTeam[0];
  if (!oldHero) throw new Error('Missing fixture hero');
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic recurring control', 'sorceress'),
    id: 'hero', level: 30, comboOrder: ['skills-sorceress-blaze'],
    skillLevels: { 'skills-sorceress-inferno': 1, 'skills-sorceress-blaze': 1 } });
  const { direct, payments } = record({ ...input, playerTeam: [{ ...oldHero, ...native,
    stats: oldHero.stats, statuses: oldHero.statuses, life: 1000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0 }] }, 'blaze-positive-control', 1);
  expect(payments).toHaveLength(1);
  expect(direct.map(e => e.simClockMs)).toEqual([900, 1900, 2900]);
});

it('an active trap yields priority to ordinary actions and a new cast pays only after expiry', () => {
  const input = fixture('shock-web'), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const { out, actions, payments } = record({ ...input, playerTeam: [{ ...hero,
    skillOrder: ['skills-assassin-shock-web', 'assassin.shock_web'],
    statuses: hero.statuses.filter(status => status.id !== 'stun') }] }, 'recast', 1);
  expect(actions.map(e => [e.simClockMs, e.skillId])).toEqual([[900, 'assassin.shock_web'],
    [1800, null], [2700, null], [3600, null], [4500, 'assassin.shock_web']]);
  expect(payments).toHaveLength(2);
  expect(out.result.playerTeam[0]?.mana).toBe(60);
});

it('source death at the exact next pulse closes the source before that pulse', () => {
  const input = fixture('lightning-sentry'), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const { out, direct, payments } = record({ ...input, playerTeam: [{ ...hero, life: 1900,
    stats: { ...hero.stats, lifeMax: 1900 }, statuses: [hold(901), { id: 'poison', sourceId: 'clock',
      stacks: 1, remaining: -1, dotPerStack: 1000, damageType: 'poison' }] }] }, 'death-tie', 1);
  expect(payments).toHaveLength(1);
  expect(out.events.find(e => e.kind === 'death' && e.target === 'hero')?.simClockMs).toBe(1900);
  expect(direct.map(e => e.simClockMs)).toEqual([900]);
});

it('bare imported trap markers are stripped and cannot establish a paid lifetime', () => {
  const input = fixture('blade-sentinel', 1, 0), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const { out, direct, payments } = record({ ...input, playerTeam: [{ ...hero, statuses: [...hero.statuses,
    { id: 'trap-blade-sentinel', sourceId: 'hero', stacks: 20, remaining: -1 }] }] }, 'marker', 1);
  expect(payments).toEqual([]);
  expect(direct.filter(e => e.simClockMs > 901)).toEqual([]);
  expect(out.result.playerTeam[0]?.statuses.some(s => s.id === 'trap-blade-sentinel')).toBe(false);
  expect(out.events.filter(e => e.kind === 'status-state').filter(e => e.target === 'hero')
    .every(e => !e.statuses.some(s => s.id === 'trap-blade-sentinel'))).toBe(true);
});

for (const patch of [
  { assassinTrapRanks: {} }, { assassinTrapRanks: { 'assassin.shock_web': 21 } },
  { assassinTrapRanks: { 'assassin.shock_web': 1.5 } }, { kind: 'merc' as const },
  { kind: 'summon' as const, summon: true, summonOwnerId: 'other' }, { level: 1 },
  { mana: Infinity }, { mana: NaN }, { skillLevels: { 'assassin.shock_web': 1 } },
  { assassinTrapRanks: { 'assassin.shock_web': 1, 'assassin.tiger_strike': 1 } }
]) it(`rejects invalid native trap authority ${JSON.stringify(patch)}`, () => {
  const input = fixture('shock-web'), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const { actions, direct, payments } = record({ ...input, playerTeam: [{ ...hero, ...patch }] }, 'invalid', 1);
  expect(payments).toEqual([]);
  expect(actions.every(e => e.skillId === null)).toBe(true);
  expect(direct.filter(e => e.simClockMs > 901)).toEqual([]);
});

for (const rank of [1, 2, 20])
  it(`Death Sentry rank${String(rank)} shoots Lightning and uses an actual corpse after placement`, () => {
    const input = fixture('death-sentry', rank), target = input.enemyTeam[0];
    if (!target) throw new Error('Missing fixture target');
    const { out, actions, direct, payments } = record({ ...input, enemyTeam: [
      { ...target, id: 'first-body', life: 1 }, { ...target, id: 'survivor' }
    ] }, 'death-sentry', rank);
    expect(actions).toHaveLength(1);
    expect(payments).toHaveLength(1);
    expect(out.events.some(e => e.kind === 'death' && e.target === 'first-body')).toBe(true);
    expect.soft(direct.some(e => e.damageType === 'lightning' && e.amount > 0)).toBe(true);
    expect.soft(out.events.some(e => e.kind === 'message' && e.messageKey === 'combat:corpses.available')).toBe(true);
    expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedDeathSentry'))
      .toEqual([expect.objectContaining({ simClockMs: 1900, params: { count: 0, corpseId: 'first-body' } })]);
    expect(direct.filter(e => e.target === 'survivor').map(e => [e.simClockMs, e.damageType]))
      .toEqual([[900, 'lightning'], [1900, 'fire'], [2900, 'lightning']]);
  });
for (const rank of [1, 2, 20])
  it(`Blade Shield rank${String(rank)} damages a real attacker after payment while its living caster is held`, () => {
    const input = fixture('blade-shield', rank), target = input.enemyTeam[0];
    if (!target) throw new Error('Missing fixture target');
    const { out, actions, direct, payments } = record({ ...input, enemyTeam: [{ ...target,
      stats: { ...target.stats, attackSpeed: 0, attack: 10 }, statuses: [hold(3301)]
    }] }, 'blade-shield', rank);
    expect(actions).toHaveLength(1);
    expect(payments).toHaveLength(1);
    const attack = out.events.find(e => e.kind === 'damage' && e.source === 'target' && e.target === 'hero' && e.amount > 0);
    expect(attack?.simClockMs).toBe(2000);
    expect.soft(direct.filter(e => e.simClockMs === 900)).toEqual([]);
    expect.soft(direct.some(e => e.simClockMs === attack?.simClockMs && e.damageType === 'physical' && e.amount > 0)).toBe(true);
  });

it('Blade Shield ignores damage over time while an actual paid instance is active', () => {
  const { direct, payments } = record(fixture('blade-shield'), 'shield-dot', 1);
  expect(payments).toHaveLength(1);
  expect(direct).toEqual([]);
});

it('Blade Shield reserves its per-attacker interval even when its counterattempt misses', () => {
  const input = fixture('blade-shield'), target = input.enemyTeam[0];
  if (!target) throw new Error('Missing attacker');
  const { out, direct } = record({ ...input, enemyTeam: [{ ...target, statuses: [],
    stats: { ...target.stats, attackSpeed: 300, attack: 10, physDodge: .85 } }] }, 'shield-interval', 1);
  const incoming = out.events.filter(e => e.kind === 'damage' && e.source === 'target' && e.amount > 0);
  expect(direct.length).toBeGreaterThanOrEqual(2);
  expect(direct.length).toBeLessThan(incoming.length);
  expect(direct.some(e => e.dodged && e.amount === 0)).toBe(true);
  for (const [index, counter] of direct.entries()) {
    expect(incoming.some(e => e.simClockMs === counter.simClockMs)).toBe(true);
    if (index > 0) expect(counter.simClockMs - (direct[index - 1]?.simClockMs ?? 0)).toBeGreaterThanOrEqual(1000);
  }
});

for (const patch of [{ manaCost: 0 }, { cooldown: 0 }, { effects: [] }])
  it(`refuses an altered registered trap instead of reverting to scalar damage ${JSON.stringify(patch)}`, () => {
    const skill = getSkill('assassin.shock_web');
    if (!skill) throw new Error('Missing authored trap');
    registerSkill({ ...skill, ...patch });
    const { actions, payments, direct } = record(fixture('shock-web'), 'altered', 1);
    expect(payments).toEqual([]);
    expect(actions.every(e => e.skillId === null)).toBe(true);
    expect(direct.filter(e => e.simClockMs > 901)).toEqual([]);
  });

for (const rank of [1, 20]) it(`paid rank${String(rank)} Command potency stays captured after its grant expires`, () => {
  function commanded(commandRank: number) {
    const input = fixture('wake-of-fire', rank), hero = input.playerTeam[0];
    if (!hero) throw new Error('Missing hero');
    const captain = playerToCombatUnit({ ...createMockPlayer('Constructed paid Commander', 'barbarian'),
      id: 'captain', level: 30, comboOrder: ['skills-barbarian-battle-command'],
      skillLevels: { ...Object.fromEntries(barbarianRows.map(row => [row.id, 1])),
        'skills-barbarian-battle-command': commandRank } });
    const snapshot = { ...input, playerTeam: [{ ...hero, stats: { ...hero.stats, attackSpeed: 100 },
      statuses: [{ ...hold(), expiresAtMs: 8500 }, hold(8501), { id: 'poison', sourceId: 'clock',
        stacks: 1, remaining: -1, appliedAtMs: 11000, dotPerStack: 1000, damageType: 'poison' as const }] },
    { ...captain, life: 1000, mana: 1000, stats: { ...hero.stats, manaMax: 1000 },
      manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, statuses: [hold(1401)] }] };
    const out = runBattleRecorded(snapshot);
    expect(runBattle(snapshot)).toEqual(out.result);
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'captain'))
      .toEqual([expect.objectContaining({ skillId: 'barbarian.battle_command', simClockMs: 900 })]);
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero'))
      .toEqual([expect.objectContaining({ skillId: 'assassin.wake_of_fire', simClockMs: 8500 })]);
    const hits = out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero');
    expect(hits.map(e => e.simClockMs)).toEqual([8500, 9500, 10500]);
    expect(hits.some(e => e.amount > 0)).toBe(true);
    for (const hit of hits.filter(e => e.amount > 0)) {
      expect(hit.amount).toBeGreaterThanOrEqual(60 + 5 * rank);
      expect(hit.amount).toBeLessThanOrEqual(85 + 5 * rank);
    }
    return { out, hits };
  }
  const expired = commanded(1), active = commanded(20);
  expect(expired.hits).toEqual(active.hits);
  expect(expired.out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 8900 &&
    !e.statuses.some(s => s.id === 'battle-command') && e.statuses.some(s => s.id === 'trap-wake-of-fire'))).toBe(true);
});

it('Blade Shield cannot retaliate against a lethal bearer hit', () => {
  const input = fixture('blade-shield'), target = input.enemyTeam[0];
  if (!target) throw new Error('Missing attacker');
  const { out, direct, payments } = record({ ...input, enemyTeam: [{ ...target, statuses: [],
    stats: { ...target.stats, attackSpeed: 0, attack: 10000 } }] }, 'shield-lethal', 1);
  expect(payments).toHaveLength(1);
  expect(out.events.find(e => e.kind === 'death' && e.target === 'hero')?.simClockMs).toBe(2000);
  expect(direct).toEqual([]);
});

it('an absorbed-only Physical hit does not trigger a Blade Shield counterattempt', () => {
  const input = fixture('blade-shield'), hero = input.playerTeam[0], target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing units');
  const { out, direct, payments } = record({ ...input, playerTeam: [{ ...hero, statuses: [...hero.statuses
    .map(status => status.id === 'poison' ? { ...status, appliedAtMs: 2100 } : status),
    { id: 'bone-armor', sourceId: 'hero', stacks: 1, remaining: -1, boneArmor: { rank: 20, remaining: 240 } }] }],
  enemyTeam: [{ ...target, statuses: [hold(3301)], stats: { ...target.stats, attackSpeed: 0, attack: 10 } }] }, 'shield-absorbed', 1);
  expect(payments).toHaveLength(1);
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'target')).toMatchObject({
    simClockMs: 2000, amount: 0, absorbed: 10 });
  expect(direct).toEqual([]);
});

for (const rank of [1, 20]) it(`a real paid Warrior captures and operates rank${String(rank)} Wake of Fire using its own mana`, () => {
  const input = fixture('wake-of-fire', rank), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed paid trap Warrior', 'assassin'),
    id: 'hero', level: 30, comboOrder: ['skills-assassin-shadow-warrior', 'skills-assassin-wake-of-fire'],
    skillLevels: { ...Object.fromEntries(rows.map(row => [row.id, 1])),
      'skills-assassin-shadow-warrior': rank, 'skills-assassin-wake-of-fire': rank } });
  const snapshot = { ...input, playerTeam: [{ ...hero, ...native, life: hero.life, mana: hero.mana,
    stats: hero.stats, statuses: hero.statuses.map(status => status.id === 'stun' ? hold() : status),
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0 }] };
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before); expect(runBattleRecorded(snapshot)).toEqual(out);
  expect(runBattle(snapshot)).toEqual(out.result);
  const spawn = out.events.find(e => e.kind === 'summon' && e.owner === 'hero');
  if (!spawn || spawn.kind !== 'summon') throw new Error('No paid Warrior');
  expect(spawn.summonId).toBe('shadow_warrior');
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero'))
    .toEqual([expect.objectContaining({ skillId: 'assassin.shadow_warrior', simClockMs: 0 })]);
  expect(out.events.filter(e => e.kind === 'action' && e.actor === spawn.unit.id && e.skillId !== null))
    .toEqual([expect.objectContaining({ skillId: 'assassin.wake_of_fire', simClockMs: 1860 })]);
  expect(out.events.filter(e => e.kind === 'damage' && e.source === spawn.unit.id && e.damageType === 'fire')
    .map(e => e.simClockMs)).toEqual([1860, 2860, 3860]);
  const payment = out.events.filter(e => e.kind === 'mana').filter(e => e.target === spawn.unit.id && e.reason === 'cast');
  expect(payment).toHaveLength(1);
  expect(payment[0]?.mana).toBeLessThan(100);
  expect(out.events.find(e => e.kind === 'death' && e.target === spawn.unit.id)?.simClockMs).toBe(5000);
});

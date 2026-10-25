import { afterEach, beforeEach, expect, it } from 'vitest';
import { runBattleRecorded, runBattle } from './combat';
import type { CombatUnit } from './types';
import { activeDruidForm, druidFormBonuses, type DruidForm } from '../skills/druid-shapeshifting';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';

const stun = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return {
    id,
    name: id,
    side,
    kind: side === 'player' ? 'hero' : 'monster',
    level: 30,
    tier: 'trash',
    life: 700,
    mana: 100,
    stats: {
      life: 1000,
      lifeMax: 1000,
      mana: 100,
      manaMax: 100,
      attack: 1,
      attackSpeed: 100,
      defense: 100,
      magicResist: 0,
      critChance: 0,
      critDamage: 2,
      physDodge: 0,
      magicDodge: 0,
      magicFind: 0,
      goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 }
    },
    statuses: [],
    cooldowns: {},
    activeBuffIds: [],
    skillOrder: [],
    enraged: false
  };
}
function scene(form: DruidForm = 'werewolf', rank = 20, lycanthropy = 20) {
  const hero = {
    ...unit('hero', 'player'),
    druidShapeRanks: { werewolf: rank, werebear: rank, lycanthropy },
    skillOrder: ['druid.' + form]
  };
  const target = {
    ...unit('target', 'enemy'),
    life: 100000,
    stats: { ...unit('target', 'enemy').stats, lifeMax: 100000 },
    statuses: [stun]
  };
  return { seed: 7, playerTeam: [hero], enemyTeam: [target] };
}
beforeEach(() => {
  resetRegistry();
  loadDefaultSkills();
});
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});

it.each(['werewolf', 'werebear'] as const)(
  '%s pays once, survives carry without compounding and replays immutable input',
  (form) => {
    const input = scene(form),
      before = structuredClone(input),
      first = runBattleRecorded(input);
    expect(
      first.events.filter((e) => e.kind === 'action' && e.skillId === 'druid.' + form)
    ).toHaveLength(1);
    expect(first.result.playerTeam[0]?.mana).toBe(97);
    expect(first.result.playerTeam[0]?.life).toBe(700);
    const second = runBattleRecorded({ ...input, playerTeam: first.result.playerTeam });
    expect(second.result.playerTeam[0]?.stats).toEqual(first.result.playerTeam[0]?.stats);
    expect(second.result.playerTeam[0]?.mana).toBe(97);
    expect(second.events.some((e) => e.kind === 'action' && e.skillId === 'druid.' + form)).toBe(
      false
    );
    expect(input).toEqual(before);
    expect(runBattleRecorded(input)).toEqual(first);
    expect(runBattle(input)).toEqual(first.result);
  }
);

it('real healing fills temporary capacity, while human removal clamps absolute HP without heal/damage', () => {
  registerSkill({
    id: 'fixture.heal',
    archetype: 'fixture',
    target: 'self',
    cooldown: 60,
    manaCost: 0,
    minLevel: 1,
    effects: [{ kind: 'heal', amount: 10000, target: 'self' }]
  });
  const input = scene(),
    hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const first = runBattleRecorded({
    ...input,
    playerTeam: [{ ...hero, skillOrder: ['druid.werewolf', 'fixture.heal'] }]
  });
  expect(first.result.playerTeam[0]?.life).toBe(1600);
  const removed = runBattleRecorded({
    ...input,
    playerTeam: first.result.playerTeam.map((u) => ({ ...u, skillOrder: [], statuses: [stun] }))
  });
  expect(removed.result.playerTeam[0]).toMatchObject({ life: 1000, stats: { lifeMax: 1000 } });
  expect(removed.result.playerTeam[0]).not.toHaveProperty('druidForm');
  expect(removed.result.playerTeam[0]).not.toHaveProperty('druidFormLife');
  expect(removed.events.some((e) => e.kind === 'heal' || e.kind === 'damage')).toBe(false);
});

it('next-wave rank changes recompose once and reselection requires a new paid form without Lycanthropy in bear', () => {
  const input = scene(),
    first = runBattleRecorded(input);
  const low = runBattleRecorded({
    ...input,
    playerTeam: first.result.playerTeam.map((u) => ({
      ...u,
      life: 1500,
      druidShapeRanks: { werewolf: 1, werebear: 20, lycanthropy: 1 }
    }))
  });
  expect(low.result.playerTeam[0]).toMatchObject({
    life: 1030,
    stats: { lifeMax: 1030 },
    druidForm: { rank: 1, lycanthropyRank: 1 },
    mana: 97
  });
  const bear = runBattleRecorded({
    ...input,
    playerTeam: first.result.playerTeam.map((u) => ({
      ...u,
      life: 1500,
      skillOrder: ['druid.werebear']
    }))
  });
  expect(bear.result.playerTeam[0]).toMatchObject({
    life: 1000,
    stats: { lifeMax: 1500 },
    druidForm: { form: 'werebear', rank: 20, lycanthropyRank: 0 },
    mana: 94
  });
  expect(
    druidFormBonuses(bear.result.playerTeam[0] ?? unit('missing', 'player')).attackSpeedPct
  ).toBe(0);
  expect(
    bear.events.filter((e) => e.kind === 'action' && e.skillId === 'druid.werebear')
  ).toHaveLength(1);
});

it('wolf dodge changes actual physical outcomes while fire remains on the unchanged magical-dodge path', () => {
  const input = scene(),
    paid = runBattleRecorded(input).result.playerTeam[0];
  if (!paid) throw new Error('Missing paid wolf');
  for (const type of ['physical', 'fire'] as const) {
    let withDodge = 0,
      withoutDodge = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const target = {
        ...unit('target', 'enemy'),
        stats: { ...unit('target', 'enemy').stats, attackSpeed: 300 },
        basicAttack: { damage: [1, 1] as const, damageType: type }
      };
      const held = { ...paid, life: 700, statuses: [...paid.statuses, stun] };
      const run = (hero: CombatUnit) =>
        runBattleRecorded({ seed, playerTeam: [hero], enemyTeam: [target] }).events.filter(
          (e) => e.kind === 'damage' && e.target === 'hero' && e.dodged
        ).length;
      withDodge += run(held);
      const { druidForm: _form, druidFormLife: _capacity, ...human } = held;
      withoutDodge += run({ ...human, stats: { ...held.stats, lifeMax: 1000 } });
    }
    if (type === 'physical') expect(withDodge).toBeGreaterThan(withoutDodge);
    else expect(withDodge).toBe(withoutDodge);
  }
});

it('rejects missing/invalid authority, roles, mana, marker-only legacy states and registry overrides before payment', () => {
  const input = scene(),
    hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const { druidShapeRanks: _ranks, ...withoutRanks } = hero;
  const invalid: CombatUnit[] = [
    withoutRanks,
    { ...hero, kind: 'merc' },
    { ...hero, ownerId: 'other' },
    { ...hero, summon: true },
    { ...hero, side: 'enemy' },
    { ...hero, life: 0 },
    { ...hero, mana: 2 },
    { ...hero, mana: NaN },
    { ...hero, mana: Infinity },
    ...[0, -1, 0.5, 21, NaN, Infinity].map((rank) => ({
      ...hero,
      druidShapeRanks: { werewolf: rank, werebear: 0, lycanthropy: 1 }
    }))
  ];
  for (const candidate of invalid) {
    const out = runBattleRecorded({ ...input, playerTeam: [candidate] });
    expect(out.events.some((e) => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
    expect(activeDruidForm(out.result.playerTeam[0] ?? candidate)).toBeUndefined();
  }
  const legacy = runBattleRecorded({
    ...input,
    playerTeam: [
      {
        ...hero,
        activeBuffIds: ['werewolf'],
        statuses: [{ id: 'werewolf', sourceId: 'legacy', stacks: 10, remaining: -1 }]
      }
    ]
  });
  expect(legacy.result.playerTeam[0]?.mana).toBe(97);
  expect(legacy.result.playerTeam[0]?.statuses.filter((s) => s.id === 'werewolf')).toHaveLength(1);
  const skill = getSkill('druid.werewolf');
  if (!skill) throw new Error('Missing registry form');
  for (const patch of [
    { manaCost: 0 },
    { effects: [{ kind: 'buff' as const, id: 'werewolf', duration: -1 }] },
    {
      effects: [
        { kind: 'buff' as const, id: 'werebear', duration: -1, druidForm: 'werewolf' as const }
      ]
    }
  ]) {
    registerSkill({ ...skill, ...patch });
    expect(
      runBattleRecorded(input).events.some((e) => e.kind === 'mana' && e.reason === 'cast')
    ).toBe(false);
  }
});

it('uses exact decimal capacity floors and checks both cooldown aliases before payment', () => {
  const input = scene('werewolf', 1, 19),
    hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const exact = runBattleRecorded({
    ...input,
    playerTeam: [{ ...hero, life: 75, stats: { ...hero.stats, lifeMax: 100 } }]
  });
  expect(exact.result.playerTeam[0]?.stats.lifeMax).toBe(157);
  for (const cooldowns of [
    { 'druid.werewolf': 0, 'skills-druid-werewolf': 60000 },
    { 'druid.werewolf': 60000, 'skills-druid-werewolf': 0 }
  ]) {
    const out = runBattleRecorded({ ...input, playerTeam: [{ ...hero, cooldowns }] });
    expect(out.events.some((e) => e.kind === 'action' && e.skillId === 'druid.werewolf')).toBe(
      false
    );
    expect(out.result.playerTeam[0]?.mana).toBe(100);
  }
});

it('binds paid carry to its original hero and copies allocation authority independently of caller objects', () => {
  const input = scene(),
    first = runBattleRecorded(input),
    paid = first.result.playerTeam[0];
  if (!paid) throw new Error('Missing paid form');
  const renamed = runBattleRecorded({
    ...input,
    playerTeam: [{ ...paid, id: 'another-hero', statuses: [stun] }]
  });
  expect(renamed.result.playerTeam[0]?.druidForm).toBeUndefined();
  expect(renamed.result.playerTeam[0]?.stats.lifeMax).toBe(1000);
  const ranks = { werewolf: 20, werebear: 20, lycanthropy: 20 };
  const frozen = runBattleRecorded({ ...input, playerTeam: [{ ...paid, druidShapeRanks: ranks }] });
  ranks.lycanthropy = 1;
  expect(frozen.result.playerTeam[0]?.druidShapeRanks?.lycanthropy).toBe(20);
  expect(Object.isFrozen(frozen.result.playerTeam[0]?.druidShapeRanks)).toBe(true);
});

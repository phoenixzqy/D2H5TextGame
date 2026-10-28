import { expect, it } from 'vitest';
import { AssassinCharges, ASSASSIN_CHARGE_DEFINITION as rules, resolveAssassinChargeDefinition,
  matchesAssassinMartialSkill, cobraChargeRecovery, composeAssassinMartialRanks, copyAssassinMartialRanks } from '@/engine/skills/assassin-charges';
import { getSkill } from '@/engine/skills/registry';
const tiger = 'assassin.tiger_strike', fire = 'assassin.fists_of_fire';
it('loads the complete finite authored charge contract and refuses malformed data', () => {
  expect(rules).toMatchObject({ maxStacks: 3, durationMs: 15000, damageFractionPerStack: .5 });
  expect(rules.builders).toHaveLength(6); expect(rules.finishers).toHaveLength(4);
  for (const patch of [{ unknown: true }, { maxStacks: 0 }, { maxStacks: 3.5 }, { maxStacks: 9 },
    { durationMs: 0 }, { durationMs: Infinity }, { damageFractionPerStack: NaN },
    { damageFractionPerStack: 0 }, { builders: [tiger] }, { builders: Array(6).fill(tiger) },
    { finishers: ['amazon.jab', ...rules.finishers.slice(1)] }, { lifeFractionPerStack: 1 }])
    expect(() => resolveAssassinChargeDefinition({ ...rules, ...patch })).toThrow();
});
it('captures three independent paid ranks, saturates, and consumes exactly once', () => {
  const state = new AssassinCharges();
  for (const [clock, rank] of [1, 20, 21].entries()) expect(state.gain('hero', tiger, rank, clock)).toBe(true);
  expect(state.saturated('hero', 2)).toBe(true);
  expect(state.gain('hero', tiger, 1, 3)).toBe(false); expect(state.gain('hero', fire, 1, 3)).toBe(false);
  const released = state.consume('hero', 3);
  expect(released).toHaveLength(1); expect(released[0]).toMatchObject({ builder: tiger, ranks: [1,20,21],
    effect: { kind: 'damage', damageType: 'physical', base: [130,160] } });
  expect(released[0]?.effect?.perRank).toBeUndefined();
  expect(state.consume('hero', 3)).toEqual([]); expect(state.saturated('hero', 3)).toBe(false);
});
it('expires at the exact boundary and refreshes the whole pool without changing captured ranks', () => {
  const state = new AssassinCharges(); state.gain('hero', tiger, 1, 0);
  expect(state.peek('hero', 14999)).toHaveLength(1); expect(state.peek('hero', 15000)).toEqual([]);
  state.gain('hero', tiger, 1, 15000); state.gain('hero', tiger, 20, 16000);
  expect(state.peek('hero', 30000)[0]).toMatchObject({ ranks: [1,20], expiresAtMs: 31000 });
  expect(state.peek('hero', 31000)).toEqual([]);
});
it('keeps actors and builder pools independent and discharges in authored order', () => {
  const state = new AssassinCharges(); state.gain('a', fire, 2, 0); state.gain('a', tiger, 1, 0);
  state.gain('b', tiger, 20, 0);
  expect(state.consume('a', 1).map(row => row.builder)).toEqual([tiger, fire]);
  expect(state.peek('b', 1)[0]?.ranks).toEqual([20]); expect(state.peek('a', 1)).toEqual([]);
});
it.each(rules.builders)('%s preserves actual typed payload and statuses at captured rank', id => {
  const state = new AssassinCharges(); state.gain('hero', id, 20, 0);
  const release = state.consume('hero', 1)[0]; expect(release?.builder).toBe(id);
  if (id === 'assassin.cobra_strike') expect(release?.effect).toBeUndefined();
  else {
    expect(release?.effect?.base[0]).toBeGreaterThan(0);
    if (id === 'assassin.phoenix_strike') {
      expect(release?.effect?.components?.map(c => c.damageType)).toEqual(['fire','cold','lightning']);
      expect(release?.effect?.applyStatuses?.map(s => s.id)).toEqual(['burn','chill','paralyze']);
    }
    if (id === fire) expect(release?.effect?.applyStatus).toMatchObject({ id: 'burn', dotPctOfDamage: .1 });
  }
});
it('copies and freezes visible snapshots and discharge payloads without leaking mutable state', () => {
  const state = new AssassinCharges(); state.gain('a', tiger, 1, 0); const view = state.peek('a', 0);
  expect(Object.isFrozen(view)).toBe(true); expect(Object.isFrozen(view[0]?.ranks)).toBe(true);
  const release = state.consume('a', 0); expect(Object.isFrozen(release[0]?.effect?.base)).toBe(true);
  state.gain('a', tiger, 20, 1); expect(view[0]?.ranks).toEqual([1]);
});
it('refuses nonfinite clocks and illegal ranks without corrupting existing paid pools', () => {
  const state = new AssassinCharges(); state.gain('a', tiger, 1, 0);
  for (const rank of [0,-1,1.5,22,NaN,Infinity]) expect(state.gain('a', tiger, rank, 1)).toBe(false);
  for (const clock of [-1,NaN,Infinity]) expect(state.gain('a', tiger, 1, clock)).toBe(false);
  expect(state.peek('a', 1)[0]?.ranks).toEqual([1]);
});
it('computes independent Cobra life and generated mana from actual HP removed', () => {
  for (const stacks of [1, 2, 3]) {
    expect(cobraChargeRecovery(101, stacks, 100, 100)).toEqual({ life: stacks * 10, mana: stacks * 10 });
  }
  expect(cobraChargeRecovery(101, 3, 5, 7)).toEqual({ life: 5, mana: 7 });
  expect(cobraChargeRecovery(101, 3, 0, 100)).toEqual({ life: 0, mana: 30 });
  expect(cobraChargeRecovery(101, 3, 100, 0)).toEqual({ life: 30, mana: 0 });
  expect(cobraChargeRecovery(9, 1, 100, 100)).toEqual({ life: 0, mana: 0 });
  expect(cobraChargeRecovery(9, 2, 100, 100)).toEqual({ life: 1, mana: 1 });
  expect(cobraChargeRecovery(9, 3, 100, 100)).toEqual({ life: 2, mana: 2 });
  expect(cobraChargeRecovery(101, 3, -1, -1)).toEqual({ life: 0, mana: 0 });
  for (const hp of [0, -1, NaN, Infinity]) expect(cobraChargeRecovery(hp, 3, 100, 100)).toEqual({ life: 0, mana: 0 });
  for (const stacks of [0, -1, 1.5, 4, NaN, Infinity])
    expect(cobraChargeRecovery(100, stacks, 100, 100)).toEqual({ life: 0, mana: 0 });
  for (const invalid of [NaN, Infinity, -Infinity]) {
    expect(cobraChargeRecovery(100, 1, invalid, 100)).toEqual({ life: 0, mana: 0 });
    expect(cobraChargeRecovery(100, 1, 100, invalid)).toEqual({ life: 0, mana: 0 });
  }
});
it('requires the complete exact registered martial definition', () => {
  const skill = getSkill(tiger); if (!skill) throw new Error('Missing actual Tiger');
  expect(matchesAssassinMartialSkill(skill)).toBe(true);
  for (const patch of [{ manaCost: 0 }, { cooldown: 0 }, { archetype: 'amazon' }, { effects: [] }, { hiddenAuthority: true }])
    expect(matchesAssassinMartialSkill({ ...skill, ...patch })).toBe(false);
});

it('projects only selected legally learned native Assassin martial ranks', () => {
  const player = { class: 'assassin' as const, level: 30, comboOrder: ['skills-assassin-tiger-strike', 'skills-assassin-dragon-talon'],
    skillLevels: { 'assassin.tiger_strike': 20, 'assassin.dragon_talon': 1 } };
  expect(composeAssassinMartialRanks(player)).toEqual({ 'assassin.tiger_strike': 20, 'assassin.dragon_talon': 1 });
  expect(composeAssassinMartialRanks({ ...player, class: 'amazon' })).toEqual({});
  expect(composeAssassinMartialRanks({ ...player, comboOrder: [] })).toEqual({});
  expect(composeAssassinMartialRanks({ ...player, skillLevels: {} })).toEqual({});
});
it('preserves transitive level/prerequisite authority and maximum legal aliases', () => {
  const player = { class: 'assassin' as const, level: 30, comboOrder: ['skills-assassin-cobra-strike'],
    skillLevels: { 'assassin.cobra_strike': 1, 'skills-assassin-cobra-strike': 20, 'assassin.tiger_strike': 1 } };
  expect(composeAssassinMartialRanks(player)).toEqual({ 'assassin.cobra_strike': 20 });
  expect(composeAssassinMartialRanks({ ...player, level: 11 })).toEqual({});
  expect(composeAssassinMartialRanks({ ...player, skillLevels: { ...player.skillLevels, 'assassin.tiger_strike': 0 } })).toEqual({});
});
it('copies native authority and rejects an expanded or illegal capability as a whole', () => {
  const input = { 'assassin.tiger_strike': 20 };
  const copied = copyAssassinMartialRanks(input); expect(copied).toEqual(input); expect(copied).not.toBe(input);
  for (const bad of [null, [], { ...input, 'amazon.jab': 1 }, { ...input, 'assassin.cobra_strike': 21 }, { ...input, 'assassin.cobra_strike': NaN }])
    expect(copyAssassinMartialRanks(bad)).toEqual({});
});

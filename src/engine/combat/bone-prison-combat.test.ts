import { afterEach, expect, it } from 'vitest';
import { composeBonePrisonRank } from '@/engine/skills/bone-prison';
import { activeBonePrison } from '@/engine/combat/bone-prison-definition';
import { rebaseStatusClock } from '@/engine/combat/status';
import { runBattle, runBattleRecorded } from '@/engine/combat/combat';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import type { RegisteredSkill } from '@/engine/skills/effects';
import type { ActiveStatus, CombatUnit, MonsterTier } from '@/engine/combat/types';
const id = 'necromancer.bone_prison';
const hold: ActiveStatus = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function unit(side: CombatUnit['side'], patch: Partial<CombatUnit> = {}): CombatUnit {
  return { id: side === 'player' ? 'hero' : 'enemy', side, name: 'Synthetic trap unit',
    kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash', life: 100000, mana: 27,
    stats: { life: 100000, lifeMax: 100000, mana: 27, manaMax: 1000, attack: 100, defense: 0,
      magicResist: 0, attackSpeed: 250, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, ...patch };
}
const trap = (patch: Partial<ActiveStatus> = {}): ActiveStatus => ({ id: 'bone-prison', bonePrison: true,
  sourceId: 'absent-paid-caster', stacks: 1, remaining: 2, appliedAtMs: 500, expiresAtMs: 2500, ...patch });
function controlled(status: ActiveStatus, tier: MonsterTier = 'trash') {
  return { seed: 1, playerTeam: [unit('player', { statuses: [hold] })],
    enemyTeam: [unit('enemy', { tier, statuses: [status, { ...hold, appliedAtMs: 2501 }] })] };
}
function scene(patch: Partial<CombatUnit> = {}) {
  return { seed: 7, playerTeam: [unit('player', { bonePrisonRank: 1, skillOrder: [id], ...patch })],
    enemyTeam: [unit('enemy', { statuses: [hold] })] };
}
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
it.each(['trash', 'elite', 'champion', 'rare-elite', 'rare-minion', 'boss', 'chapter-boss'] as const)(
  'blocks real %s actions only inside its paid interval, including exact expiry', tier => {
    const boss = tier === 'boss' || tier === 'chapter-boss';
    const input = controlled(trap({ expiresAtMs: boss ? 1500 : 2500 }), tier), before = structuredClone(input);
    const out = runBattleRecorded(input), baseline = runBattleRecorded(controlled(bareTrap(), tier));
    const times = (r: typeof out) => r.events.flatMap(e => e.kind === 'action' && e.actor === 'enemy' ? [e.simClockMs] : []);
    expect(times(out)).toEqual(boss ? [1500, 2000, 2500] : [2500]);
    expect(times(baseline)).toEqual([500, 1000, 1500, 2000, 2500]);
    expect(out.result.playerTeam[0]?.life).toBeGreaterThan(baseline.result.playerTeam[0]?.life ?? 100000);
    expect(input).toEqual(before); expect(runBattle(input)).toEqual(out.result); expect(runBattleRecorded(input)).toEqual(out);
  });
it.each<Partial<ActiveStatus>>([
  { id: 'dim-vision' }, { stacks: 0 }, { stacks: 2 }, { sourceId: '' },
  { appliedAtMs: NaN }, { appliedAtMs: Infinity }, { expiresAtMs: Infinity }, { expiresAtMs: NaN },
  { expiresAtMs: 500 }, { expiresAtMs: 2500.01 }, { dotPerStack: 100 }
])('a bare or malformed trap does not grant action control %j', patch => {
  const status = trap(patch);
  const out = runBattleRecorded(controlled(status));
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'enemy')).toHaveLength(5);
});
it.each([1, 20])('pays exactly once per cooldown from actual learned rank %i', rank => {
  const out = runBattleRecorded(scene({ bonePrisonRank: rank, mana: 1000 }));
  const casts = out.events.filter(e => e.kind === 'action' && e.actor === 'hero' && e.skillId === id);
  expect(casts.slice(0, 2).map(e => e.simClockMs)).toEqual(rank === 1 ? [500, 4500] : [500, 3500]);
  const debit = out.events.find(e => e.kind === 'mana' && e.reason === 'cast');
  expect(debit).toMatchObject({ mana: rank === 1 ? 973 : 977 });
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'enemy' && e.simClockMs === 500 &&
    e.statuses.some(s => s.id === 'bone-prison' && s.bonePrison === true && s.expiresAtMs === 2500))).toBe(true);
});
it.each<Partial<CombatUnit>>([
  { bonePrisonRank: 0 }, { bonePrisonRank: -1 }, { bonePrisonRank: .5 },
  { bonePrisonRank: NaN }, { bonePrisonRank: Infinity }, { bonePrisonRank: 21 }, { level: 23 },
  { kind: 'merc' }, { kind: 'summon' }, { ownerId: 'other' }, { summonOwnerId: 'other' }, { mana: 26 }, { mana: NaN }
])('rejects ineligible cast without a debit or trap %j', patch => {
  const out = runBattleRecorded(scene(patch));
  expect(out.events.some(e => e.kind === 'action' && e.skillId === id)).toBe(false);
  expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
  expect(out.events.some(e => e.kind === 'status' && e.statusId === 'bone-prison')).toBe(false);
});
it.each<Partial<RegisteredSkill>>([
  { target: 'self' }, { manaCost: 0 }, { cooldown: 1 }, { isBuff: true }, { minLevel: 1 },
  { archetype: 'sorceress' }, { maxTargets: 1 }, { effects: [{ kind: 'debuff', statusId: 'bone-prison' }] }
])('refuses contradictory registered Prison before spending mana %j', patch => {
  const original = getSkill(id); if (!original) throw new Error('Missing registered Prison');
  registerSkill({ ...original, ...patch });
  const out = runBattleRecorded(scene());
  expect(out.events.some(e => e.kind === 'action' && e.skillId === id)).toBe(false);
  expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
});
it.each(['inferno', 'fire-wall'] as const)('interrupts only channelled %s even when the trap ends before its first pulse', spell => {
  const hero = unit('player', { periodicSpellRanks: { 'fire-wall': 0, 'thunder-storm': 0, [spell]: 1 }, statuses: [
    { id: spell, sourceId: 'hero', stacks: 1, remaining: 3, appliedAtMs: 0, expiresAtMs: 3000, periodicSpell: { rank: 1 } },
    trap({ appliedAtMs: 500, expiresAtMs: 700 })
  ] });
  const out = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', { statuses: [hold] })] });
  const fire = out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'fire');
  expect(fire.length === 0).toBe(spell === 'inferno');
  if (spell === 'fire-wall') expect(fire.length).toBeGreaterThan(0);
});

function bareTrap(): ActiveStatus { const { bonePrison, ...bare } = trap(); void bonePrison; return bare; }
it('does not infer control from a marker without paid authority', () => {
  const out = runBattleRecorded(controlled(bareTrap()));
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'enemy')).toHaveLength(5);
});
it('does not infer learned authority from a combo alone', () => {
  const out = runBattleRecorded({ ...scene(), playerTeam: [unit('player', { skillOrder: [id] })] });
  expect(out.events.some(e => e.kind === 'action' && e.skillId === id)).toBe(false);
  expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
});

it('requires native class, unlock and every transitive prerequisite with exact alias MAX', () => {
  const p = { class: 'necromancer', level: 30, skillLevels: { 'necromancer.bone_armor': 1,
    'necromancer.bone_wall': 1, [id]: 1, 'skills-necromancer-bone-prison': 20 } };
  const before = structuredClone(p);
  expect(composeBonePrisonRank(p)).toBe(20);
  expect(composeBonePrisonRank({ ...p, class: 'sorceress' })).toBe(0);
  expect(composeBonePrisonRank({ ...p, level: 23 })).toBe(0);
  expect(composeBonePrisonRank({ ...p, skillLevels: { [id]: 20 } })).toBe(0);
  expect(composeBonePrisonRank({ ...p, skillLevels: { [id]: 20, 'necromancer.bone_wall': 1 } })).toBe(0);
  for (const rank of [0, -1, .5, NaN, Infinity, 21]) expect(composeBonePrisonRank({ ...p,
    skillLevels: { 'necromancer.bone_armor': 1, 'necromancer.bone_wall': 1, [id]: rank } })).toBe(0);
  expect(p).toEqual(before);
});
it('shares alias cooldown, rejects an empty target set and never changes fallback RNG on denial', () => {
  const aliased = scene({ skillOrder: ['skills-necromancer-bone-prison'] });
  expect(runBattleRecorded(aliased).events.some(e => e.kind === 'action' && e.skillId === id)).toBe(true);
  const blocked = scene({ cooldowns: { 'skills-necromancer-bone-prison': 100000 } });
  const hero = blocked.playerTeam[0]; if (!hero) throw new Error('Missing blocked hero');
  expect(runBattleRecorded(blocked).events).toEqual(runBattleRecorded({ ...blocked,
    playerTeam: [{ ...hero, skillOrder: [] }] }).events);
  expect(runBattleRecorded({ ...scene(), enemyTeam: [] }).events.some(e => e.kind === 'action')).toBe(false);
});

it('reads fractional carried intervals without renewal and refuses missing clocks or duplicate traps', () => {
  const target = unit('enemy', { statuses: [trap({ appliedAtMs: 400.1, expiresAtMs: 2400.1 })] });
  const before = structuredClone(target), carried = rebaseStatusClock(target, 500.2);
  expect(activeBonePrison(target, 400.099)).toBe(false);
  expect(activeBonePrison(target, 400.1)).toBe(true);
  expect(activeBonePrison(carried, 0)).toBe(true);
  expect(activeBonePrison(carried, 2400.1 - 500.2)).toBe(false);
  expect(target).toEqual(before);
  const { appliedAtMs, ...noStart } = trap(); void appliedAtMs;
  const { expiresAtMs, ...noEnd } = trap(); void expiresAtMs;
  for (const statuses of [[noStart], [noEnd], [trap(), trap()]])
    expect(activeBonePrison(unit('enemy', { statuses }), 600)).toBe(false);
  for (const clock of [NaN, Infinity, -Infinity]) expect(activeBonePrison(target, clock)).toBe(false);
});
it.each([0, 20])('actual paid party Command preserves learned Prison permission at rank %i', rank => {
  // Trusted synthetic two-source engine diagnostic, not an earned player build.
  const commander = unit('player', { id: 'commander', mana: 1000, battleCommandRank: 1,
    skillOrder: ['barbarian.battle_command'], stats: { ...unit('player').stats, attackSpeed: 400 } });
  const out = runBattleRecorded({ seed: 7, playerTeam: [commander,
    unit('player', { bonePrisonRank: rank, mana: 1000, skillOrder: [id] })],
    enemyTeam: [unit('enemy', { statuses: [hold] })] });
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'commander' &&
    e.skillId === 'barbarian.battle_command' && e.simClockMs === 400)).toBe(true);
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.skillId === id)).toBe(rank > 0);
  if (rank > 0) expect(out.events.find(e => e.kind === 'mana' && e.target === 'hero' && e.reason === 'cast'))
    .toMatchObject({ mana: 977, simClockMs: 500 });
});

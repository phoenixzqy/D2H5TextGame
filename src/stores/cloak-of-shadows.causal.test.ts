import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from './combatPlayback';
import { rebaseStatusClock } from '@/engine/combat/status';

const id = 'skills-assassin-cloak-of-shadows', canonical = 'assassin.cloak_of_shadows';
const hold = (at = 0): ActiveStatus => ({
  id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: at
});
function fixture(rank = 1, seed = 7): { seed: number; playerTeam: readonly CombatUnit[]; enemyTeam: readonly CombatUnit[] } {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic paid Cloak', 'assassin'),
    id: 'hero', level: 30, comboOrder: [id], skillLevels: {
      [id]: rank, 'skills-assassin-psychic-hammer': 1
    } });
  const hero: CombatUnit = { ...native, life: 10000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, statuses: [hold(1701)],
    stats: { ...native.stats, lifeMax: 10000, manaMax: 100, attack: 100,
      attackSpeed: 100, defense: 100, magicResist: 0, physDodge: 0, magicDodge: 0,
      critChance: 0, critDamage: 2,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  return { seed, playerTeam: [hero], enemyTeam: [{ ...hero, id: 'enemy', side: 'enemy',
    kind: 'monster', skillOrder: [], skillLevels: {}, statuses: [hold()],
    stats: { ...hero.stats, defense: 0 } }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  const authority = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(authority ? { statusPlayback: authority } : {}) };
  for (const event of out.events) teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event, teams.statusPlayback);
  const view = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana }));
  expect(view(teams.playerTeam)).toEqual(view(out.result.playerTeam));
  expect(view(teams.enemyTeam)).toEqual(view(out.result.enemyTeam));
  return out;
}
beforeEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset(); useFormationStore.getState().reset();
  resetRegistry(); loadDefaultSkills();
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each([1, 2, 20])('rank%i pays once for finite personal Cloak and all-enemy Blind', rank => {
  const input = fixture(rank);
  const firstEnemy = input.enemyTeam[0];
  if (!firstEnemy) throw new Error('Missing fixture enemy');
  input.enemyTeam = Array.from({ length: 3 }, (_, i) => ({ ...firstEnemy, id: 'enemy-' + String(i) }));
  const out = record(input);
  expect(out.events.filter(e => e.kind === 'action')).toEqual([
    expect.objectContaining({ actor: 'hero', skillId: canonical, simClockMs: 1700 })
  ]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
    expect.objectContaining({ target: 'hero', mana: 100 - Math.round(13 - .1 * (rank - 1)) })
  ]);
  expect.soft(out.events.filter(e => e.kind === 'status').map(e => [e.target, e.statusId]))
    .toEqual([['enemy-0', 'blind'], ['enemy-1', 'blind'], ['enemy-2', 'blind']]);
  const onset = out.events.find(e => e.kind === 'status-state' && e.target === 'hero' &&
    e.statuses.some(s => s.id === 'cloak-of-shadows'));
  expect.soft(onset?.kind === 'status-state' ? onset.statuses.find(s => s.id === 'cloak-of-shadows') : undefined)
    .toMatchObject({ id: 'cloak-of-shadows',
        sourceId: 'hero', appliedAtMs: 1700, expiresAtMs: 9700,
        cloakOfShadows: { rank, defensePct: .03 * rank, critChancePct: .005 * rank, magicDodgePct: .005 * rank }
    });
  expect(out.events.some(e => e.kind === 'damage' || e.kind === 'heal' || e.kind === 'dot')).toBe(false);
  for (const enemy of out.result.enemyTeam) expect(enemy.stats).toEqual(input.enemyTeam[0]?.stats);
  expect(out.result.playerTeam[0]?.stats).toEqual(input.playerTeam[0]?.stats);
});

it.each(['trash', 'boss'] as const)('%s Blind expires after eight seconds without delaying attacks', tier => {
  const input = fixture();
  input.enemyTeam = input.enemyTeam.map(u => ({ ...u, tier, statuses: [], stats: { ...u.stats, attackSpeed: 0 } }));
  const out = record(input);
  const onset = out.events.find(e => e.kind === 'status-state' && e.target === 'enemy' &&
    e.statuses.some(s => s.id === 'blind'));
  expect.soft(onset?.kind === 'status-state' ? onset.statuses.find(s => s.id === 'blind') : undefined)
    .toMatchObject({ id: 'blind', appliedAtMs: 1700, expiresAtMs: 9700 });
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'enemy').slice(0, 5).map(e => e.simClockMs))
    .toEqual([2000, 4000, 6000, 8000, 10000]);
});

/** Capture actual paid state through playback, then rebase it as a qualified next-wave snapshot. */
function carried(): CombatSnapshot {
  const input = fixture(20), out = record(input);
  const authority = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(authority ? { statusPlayback: authority } : {}) };
  for (const event of out.events.filter(e => e.simClockMs <= 1700))
    teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event, teams.statusPlayback);
  const hero = teams.playerTeam[0], enemy = teams.enemyTeam[0];
  if (!hero || !enemy || !hero.statuses.some(s => s.cloakOfShadows) || !enemy.statuses.some(s => s.id === 'blind'))
    throw new Error('Missing actual paid Cloak/Blind');
  return { seed: 7,
    playerTeam: [{ ...rebaseStatusClock(hero, 1700), cloakOfShadowsRank: 0, skillOrder: [],
      statuses: [...rebaseStatusClock(hero, 1700).statuses.filter(s => s.id !== 'stun'), hold()] }],
    enemyTeam: [{ ...rebaseStatusClock(enemy, 1700),
      statuses: [...rebaseStatusClock(enemy, 1700).statuses.filter(s => s.id !== 'stun'), hold(2001)],
      stats: { ...enemy.stats, attackSpeed: 0 } }]
  };
}
it('Blind lowers actual Physical hit probability; paid Defense reduces landed damage by sixty', () => {
  const input = carried();
  let blindHits = 0, ordinaryHits = 0, mitigationComparisons = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const base: CombatSnapshot = { ...input, seed, enemyTeam: input.enemyTeam.map(u => ({ ...u,
      basicAttack: { damageType: 'physical', damage: [300, 300] } })) };
    const hit = (snapshot: CombatSnapshot) => runBattleRecorded(snapshot).events.find(e => e.kind === 'damage' && e.source === 'enemy');
    const actual = hit(base), noBlind = hit({ ...base, enemyTeam: base.enemyTeam.map(u => ({ ...u, statuses: u.statuses.filter(s => s.id !== 'blind') })) }),
      noPaid = hit({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, statuses: u.statuses.filter(s => s.id !== 'cloak-of-shadows') })) });
    if (actual?.kind !== 'damage' || noBlind?.kind !== 'damage' || noPaid?.kind !== 'damage') throw new Error('Missing causal attack');
    blindHits += Number(!actual.dodged); ordinaryHits += Number(!noBlind.dodged);
    expect(actual.dodged).toBe(noPaid.dodged);
    if (!actual.dodged) {
      expect(actual.amount).toBe(140); expect(noPaid.amount).toBe(200); mitigationComparisons++;
    }
  }
  expect(blindHits).toBeLessThan(ordinaryHits);
  expect(mitigationComparisons).toBeGreaterThan(0);
});
it('Blind leaves actual Arcane attacks unchanged; personal Cloak independently increases magical dodge', () => {
  const input = carried();
  let paidHits = 0, ordinaryHits = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const base: CombatSnapshot = { ...input, seed, enemyTeam: input.enemyTeam.map(u => ({ ...u,
      basicAttack: { damageType: 'arcane', damage: [100, 100] } })) };
    const hits = (snapshot: CombatSnapshot) => runBattleRecorded(snapshot).events.flatMap(e => e.kind === 'damage' && e.source === 'enemy' ? [e] : []);
    const actual = hits(base), noBlind = hits({ ...base, enemyTeam: base.enemyTeam.map(u => ({ ...u, statuses: u.statuses.filter(s => s.id !== 'blind') })) }),
      noPaid = hits({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, statuses: u.statuses.filter(s => s.id !== 'cloak-of-shadows') })) });
    expect(actual).toEqual(noBlind);
    paidHits += actual.filter(e => !e.dodged).length;
    ordinaryHits += noPaid.filter(e => !e.dodged).length;
    for (const e of actual) if (!e.dodged) expect(e.amount).toBe(100);
  }
  expect(paidHits).toBeLessThan(ordinaryHits);
});
it('paid critical bonus changes real basic-attack critical outcomes without changing base stats', () => {
  const input = carried();
  let criticals = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const base: CombatSnapshot = { ...input, seed,
      playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [...u.statuses.filter(s => s.id !== 'stun'), hold(1701)] })),
      enemyTeam: input.enemyTeam.map(u => ({ ...u, statuses: [hold()] })) };
    const hits = (snapshot: CombatSnapshot) => runBattleRecorded(snapshot).events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []);
    const actual = hits(base), ordinary = hits({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u,
      statuses: u.statuses.filter(s => s.id !== 'cloak-of-shadows') })) });
    expect(ordinary.every(e => !e.crit)).toBe(true);
    criticals += actual.filter(e => e.crit).length;
  }
  expect(criticals).toBeGreaterThan(0);
});

it.each([
  { mana: 12 }, { cooldowns: { [canonical]: 100000 } },
  { skillOrder: [id], skillLevels: {}, cloakOfShadowsRank: 0 }
])('refuses payment/effects for invalid readiness %j', patch => {
  const input = fixture();
  input.playerTeam = input.playerTeam.map(u => ({ ...u, ...patch }));
  const out = record(input);
  expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
  expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
});

it('cannot refresh an active Cloak, then pays again after its finite expiry', () => {
  const input = fixture();
  input.playerTeam = input.playerTeam.map(u => ({ ...u, statuses: [] }));
  const out = record(input), casts = out.events.filter(e => e.kind === 'action' && e.skillId === canonical);
  expect(casts.slice(0, 3).map(e => e.simClockMs)).toEqual([1700, 10200, 18700]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(casts.length);
});
it('rejects contradictory registry payloads before payment or hostile effects', () => {
  const skill = getSkill(canonical);
  if (!skill) throw new Error('Missing registered Cloak');
  for (const patch of [{ effects: skill.effects.slice(0, 1) }, { target: 'self' as const },
    { manaCost: 0 }, { cooldown: 0 }, { effects: [...skill.effects, { kind: 'damage' as const, damageType: 'physical' as const, base: [1, 1] as const }] }]) {
    registerSkill({ ...skill, ...patch });
    const out = record(fixture());
    expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
    expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
    expect(out.events.some(e => e.kind === 'status' && e.statusId === 'blind')).toBe(false);
  }
});

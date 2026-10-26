import { beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import { composeStatAura } from '@/engine/skills/stat-auras';
import type { CombatUnit } from '@/engine/combat/types';
import { playerToCombatUnit } from './combatHelpers';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from './combatPlayback';
import { statusActiveAt } from '@/engine/combat/status';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
/** Explicit synthetic teams/pools: real native Inferno and Terror still pay and resolve normally. */
function fixture(): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic interrupted stream', 'sorceress'),
    id: 'hero', level: 30, comboOrder: ['skills-sorceress-inferno'], skillLevels: { 'skills-sorceress-inferno': 1 } });
  const stats = { ...native.stats, life: 1000, lifeMax: 1400, mana: 100, manaMax: 100,
    defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0, attackSpeed: 200, critChance: 0,
    resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } };
  const hero: CombatUnit = { ...native, stats, life: 1000, mana: 100, manaRegenPerSecond: 0,
    statuses: [{ id: 'poison', sourceId: 'synthetic-stop', stacks: 1, remaining: -1,
      dotPerStack: 400, damageType: 'poison' }] };
  const caster = playerToCombatUnit({ ...createMockPlayer('Synthetic hostile fear caster', 'necromancer'),
    id: 'caster', level: 30, comboOrder: ['skills-necromancer-terror'],
    skillLevels: { 'skills-necromancer-amplify-damage': 1, 'skills-necromancer-weaken': 1, 'skills-necromancer-terror': 1 } });
  const enemy: CombatUnit = { ...caster, side: 'enemy', kind: 'monster', tier: 'trash', life: 10000, mana: 7,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, stats: { ...stats, life: 10000, lifeMax: 10000, attack: 0, attackSpeed: 150 } };
  return { seed: 19, playerTeam: [hero], enemyTeam: [enemy] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattle(input)).toEqual(out.result); expect(runBattleRecorded(input)).toEqual(out);
  const authority = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(authority ? { statusPlayback: authority } : {}) };
  for (const event of out.events) teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event, teams.statusPlayback);
  const end = out.events.at(-1)?.simClockMs ?? 0;
  const view = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana,
    statuses: u.life > 0 ? u.statuses.filter(s => statusActiveAt(s, end)) : [] }));
  expect(view(teams.playerTeam)).toEqual(view(out.result.playerTeam)); expect(view(teams.enemyTeam)).toEqual(view(out.result.enemyTeam));
  return out;
}
for (const concentration of [false, true]) {
  it(`actual paid Terror cancels the already paid channel between pulses, Concentration=${String(concentration)}`, () => {
    const input = fixture(), statAura = concentration ? composeStatAura({ id: 'hero', class: 'paladin', level: 30,
      selectedAuraId: 'paladin.concentration', skillLevels: { 'paladin.concentration': 1 } }) : undefined;
    if (concentration && !statAura) throw new Error('Missing explicit synthetic Concentration projection');
    const out = record({ ...input, ...(statAura ? { statAura } : {}) });
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'necromancer.terror'))
      .toEqual([expect.objectContaining({ actor: 'caster', simClockMs: 1300 })]);
    expect(out.events.filter(e => e.kind === 'mana' && e.target === 'caster' && e.reason === 'cast'))
      .toEqual([expect.objectContaining({ mana: 0, simClockMs: 1300 })]);
    expect(out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'fire' ? [e.simClockMs] : []))
      .toEqual([900]);
    expect(out.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs === 1800)).toBe(false);
    expect(out.result.playerTeam[0]?.mana).toBe(90);
    expect(out.result.playerTeam[0]?.life).toBe(0);
  });
}
it('the same native paid bare Terror marker cannot cancel a stream or suppress its pulses', () => {
  const original = getSkill('necromancer.terror'); if (!original) throw new Error('Missing native Terror');
  registerSkill({ ...original, effects: [{ kind: 'debuff', statusId: 'terror', durationMs: 1000 }] });
  try {
    const out = record(fixture());
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'necromancer.terror'))
      .toEqual([expect.objectContaining({ actor: 'caster', simClockMs: 1300 })]);
    expect(out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'fire' ? [e.simClockMs] : []))
      .toEqual([900, 1900]);
    expect(out.result.playerTeam[0]?.mana).toBe(90);
  } finally { registerSkill(original); }
});

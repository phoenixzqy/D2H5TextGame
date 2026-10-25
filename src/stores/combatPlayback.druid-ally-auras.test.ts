import { expect, it } from 'vitest';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { refreshDruidForm } from '@/engine/skills/druid-shapeshifting';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from './combatHelpers';
import { applyEventToTeams, stageStatusPlayback } from './combatPlayback';

it('transports rejected paid-form carry removal through the initial status prefix and capacity observation', () => {
  const fresh = {
    ...createMockPlayer('Constructed rejected form carry', 'druid'),
    level: 30,
    skillLevels: { 'druid.werewolf': 20, 'druid.lycanthropy': 20 },
    comboOrder: ['druid.werewolf']
  };
  const paid = refreshDruidForm(playerToCombatUnit(fresh), 'werewolf');
  const hold = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
  // The paid source no longer matches; markers or previous capacity cannot preserve form authority.
  const hero = { ...paid, id: 'replacement', statuses: [hold] };
  const enemy = {
    ...playerToCombatUnit(fresh),
    id: 'target',
    side: 'enemy' as const,
    kind: 'monster' as const,
    statuses: [hold],
    skillOrder: []
  };
  const out = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [enemy] });
  let teams = {
    playerTeam: [hero] as readonly CombatUnit[],
    enemyTeam: [enemy] as readonly CombatUnit[]
  };
  let statuses = stageStatusPlayback(teams.playerTeam, teams.enemyTeam, out.events);
  for (const event of out.events) {
    const next = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event, statuses);
    teams = next;
    statuses = next.statusPlayback ?? statuses;
  }
  expect(out.result.playerTeam[0]?.druidForm).toBeUndefined();
  expect(teams.playerTeam[0]?.druidForm).toBeUndefined();
  expect(
    teams.playerTeam.map((u) => [u.life, u.stats.lifeMax, u.druidFormLife, u.vigorLife])
  ).toEqual(
    out.result.playerTeam.map((u) => [u.life, u.stats.lifeMax, u.druidFormLife, u.vigorLife])
  );
});

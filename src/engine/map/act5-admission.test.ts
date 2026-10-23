import { describe, expect, it } from 'vitest';
import { subAreas, monsters } from '@/data/index';
import { resolveChallengeWavePlan } from '../combat/sub-area-run';
import { buildMonsterUnit } from '../combat/monster-factory';
import { createRng } from '../rng';
import { ACT5_ENCOUNTERS, captureAct5Encounter, hasOriginalAct5Victory } from './act5-admission';
function required<T>(value: T | undefined): T { if (value === undefined) throw new Error('Missing fixture'); return value; }
const throne = required(subAreas.find(area => area.id === 'areas/act5-throne-of-destruction'));
describe('Act V exact source projection', () => {
  it('preserves all seven authored manifests and final real chapter boss at level82', () => {
    const plan = resolveChallengeWavePlan({ subArea: throne, fallbackArchetypeId: 'monsters/act5.baal-minion',
      fallbackLevel: 90, seed: 4, challengeOrdinal: 0, questSourceProjection: 'act5-throne' });
    expect(plan.waves).toHaveLength(8);
    expect(plan.waves.map(wave => wave.spawns.length)).toEqual([4,6,5,6,5,5,5,1]);
    expect(plan.waves.slice(0,7).map(wave => wave.source)).toEqual(Array.from({ length:7 }, (_, index) => ({
      kind:'wave', waveId:`w${String(index+1)}`, encounterIds:[`act5-tod-w${String(index+1)}-e1`] })));
    expect(plan.waves[7]?.source).toEqual({kind:'chapterBoss',archetypeId:'monsters/act5.baal'});
    expect(plan.waves[7]?.spawns[0]?.level).toBe(82);
    expect(plan.waves[7]?.spawns[0]?.encounterId).toBeUndefined();
    expect(plan.waves[1]?.spawns.map(spawn=>spawn.tier)).toEqual(['elite','elite','elite','elite','elite','elite']);
  });
  it('ordinary manual challenge still uses its fitting and guards', () => {
    const plan=resolveChallengeWavePlan({ subArea:throne,fallbackArchetypeId:'monsters/act5.baal-minion',fallbackLevel:75,seed:4,challengeOrdinal:0 });
    expect(plan.waves[0]?.spawns.length).toBe(8);
    expect(plan.waves[6]?.presentation?.isForcedElite).toBe(true);
  });
});
describe.each(ACT5_ENCOUNTERS)('Act V exact original $questId', contract => {
  it('admits exact original member victory and rejects a matching generic source', () => {
    const area=required(subAreas.find(row=>row.id===contract.areaId));
    const plan=resolveChallengeWavePlan({subArea:area,fallbackArchetypeId:required(contract.members[0]).archetypeId,fallbackLevel:area.areaLevel,seed:8,challengeOrdinal:0});
    const wave=required(plan.waves.at(-1));
    const enemies=wave.spawns.map((spawn,index)=>({...buildMonsterUnit({def:required(monsters.find(row=>row.id===spawn.archetypeId)),level:spawn.level,tier:spawn.tier,rng:createRng(index+2)}),id:`original-${String(index)}`}));
    const captured=required(captureAct5Encounter(5,area.id,wave,enemies));
    const hero={...required(enemies[0]),id:'hero',kind:'hero' as const,side:'player' as const,life:1};
    const outcome={winner:'player',finalPlayerTeam:[hero],finalEnemyTeam:enemies.map(unit=>({...unit,life:0}))};
    expect(hasOriginalAct5Victory(captured,hero.id,outcome)).toBe(true);
    expect(captureAct5Encounter(5,area.id,{...wave,source:{kind:'wave',waveId:'copy',encounterIds:[]}},enemies)).toBeUndefined();
    expect(hasOriginalAct5Victory(captured,hero.id,{...outcome,finalEnemyTeam:outcome.finalEnemyTeam.slice(1)})).toBe(false);
    expect(hasOriginalAct5Victory(captured,hero.id,{...outcome,finalPlayerTeam:[{...hero,life:0}]})).toBe(false);
  });
});

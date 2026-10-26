import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter',()=>({hasSave:vi.fn(),loadSave:vi.fn(),saveSave:vi.fn(()=>Promise.resolve()),deleteSave:vi.fn()}));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { startSubAreaRun, abortSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore } from '@/stores/combatStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useMetaStore } from '@/stores/metaStore';
import { __resetPersistenceForTests } from '@/stores/persistence';
import { runBattleRecorded } from '@/engine/combat/combat';
import { rebaseStatusClock } from '@/engine/combat/status';
import type { CombatUnit,ActiveStatus } from '@/engine/combat/types';
const stores=[useCombatStore,usePlayerStore,useInventoryStore,useMapStore,useMercStore,useFormationStore,useMetaStore];
const hold:ActiveStatus={id:'stun',sourceId:'synthetic',stacks:1,remaining:-1};
function reset(){__resetPersistenceForTests();abortSubAreaRun();for(const s of stores)s.getState().reset();}
beforeEach(()=>{reset();useHydrationStore.getState().setStatus('ready');vi.spyOn(Date,'now').mockReturnValue(1792584000055);});
afterEach(()=>{reset();vi.restoreAllMocks();});
function paid(id:'bone-wall'|'bone-prison'){
 const skill='necromancer.'+id.replace('-','_');
 usePlayerStore.getState().setPlayer({...createMockPlayer('Synthetic bones','necromancer'),level:24,skillLevels:{'necromancer.bone_armor':1,'necromancer.bone_wall':1,'necromancer.bone_prison':1},comboOrder:[skill]});
 expect(startSubAreaRun({act:1,subAreaId:'areas/act1-blood-moor',mode:'manual',runSeed:7,challengeOrdinal:0})).not.toBeNull();
 const events=useCombatStore.getState().recordedEvents;
 const ci=events.findIndex(e=>e.kind==='action' && e.skillId===skill);
 expect(ci).toBeGreaterThan(0);
 while(useCombatStore.getState().eventCursor<=ci)useCombatStore.getState().advanceEvent();
 const state=useCombatStore.getState();const event=events[ci];
 if(!event)throw new Error('Missing actual paid action');
 const hero=state.playerTeam.find(u=>u.kind==='hero');const enemy=state.enemyTeam.find(u=>u.life>0);
 if(!hero||!enemy)throw new Error('Missing living paid case');
 return {hero:rebaseStatusClock(hero,event.simClockMs),enemy:rebaseStatusClock(enemy,event.simClockMs),events:events.filter(e=>e.simClockMs===event.simClockMs),at:event.simClockMs};
}
function target(base:CombatUnit):CombatUnit{return {...base,id:'synthetic-hostile',life:100000,skillOrder:[],cooldowns:{},activeBuffIds:[],stats:{...base.stats,life:100000,lifeMax:100000,attack:100,attackSpeed:200,defense:0,critChance:0,physDodge:0,magicDodge:0},statuses:[{...hold,appliedAtMs:1001}]};}
it('a real paid Bone Wall must shield against actual incoming HP damage',()=>{
 const native=paid('bone-wall');expect(native.hero.mana).toBe(native.hero.stats.manaMax-17);
 expect(native.hero.statuses.find(s=>s.id==='bone-wall')?.boneWall).toEqual({rank:1,remaining:40});
 const hero={...native.hero,life:100000,skillOrder:[],stats:{...native.hero.stats,life:100000,lifeMax:100000,defense:0,physDodge:0,magicDodge:0},statuses:[...native.hero.statuses,hold]};
 const enemy=target(native.enemy);
 const withWall=runBattleRecorded({seed:7,playerTeam:[hero],enemyTeam:[enemy]});
 const withoutWall=runBattleRecorded({seed:7,playerTeam:[{...hero,activeBuffIds:hero.activeBuffIds.filter(id=>id!=='bone-wall'),statuses:hero.statuses.filter(s=>s.id!=='bone-wall')}],enemyTeam:[enemy]});
 expect(withoutWall.result.playerTeam[0]?.life).toBeLessThan(100000);
 expect(withWall.result.playerTeam[0]?.life).toBeGreaterThan(withoutWall.result.playerTeam[0]?.life ?? 100000);
});
it('a real paid Bone Prison must prevent actual enemy actions while trapped',()=>{
 const native=paid('bone-prison');expect(native.hero.mana).toBe(native.hero.stats.manaMax-27);
 expect(native.enemy.statuses.some(s=>s.id==='bone-prison')).toBe(true);
 const hero={...native.hero,life:100000,skillOrder:[],stats:{...native.hero.stats,life:100000,lifeMax:100000,defense:0,physDodge:0,magicDodge:0},statuses:[...native.hero.statuses,hold]};
 const enemy={...target(native.enemy),statuses:[...native.enemy.statuses,{...hold,appliedAtMs:1001}]};
 const withPrison=runBattleRecorded({seed:7,playerTeam:[hero],enemyTeam:[enemy]});
 const withoutPrison=runBattleRecorded({seed:7,playerTeam:[hero],enemyTeam:[{...enemy,statuses:enemy.statuses.filter(s=>s.id!=='bone-prison')}]});
 const actions=(out:typeof withPrison)=>out.events.filter(e=>e.kind==='action'&&e.actor===enemy.id);
 expect(actions(withoutPrison).length).toBeGreaterThan(0);
 expect(actions(withPrison).length).toBeLessThan(actions(withoutPrison).length);
});

import { advanceWaveOrFinish, playerToCombatUnit, refreshActivePlayerCombatConfig } from '@/stores/combatHelpers';
import { snapshotStores, importIntoStores } from '@/stores/persistence';
import { toJsonSafe } from '@/engine/save';
import type { Item } from '@/engine/types/items';
function recording() {
 const s=useCombatStore.getState();
 return structuredClone({team:s.playerTeam,events:s.recordedEvents,outcome:s.outcome,cursor:s.eventCursor,rewards:s.runRewards});
}
it('installs native Wall authority from legal allocation, preserves paid power across rank change, and replays without refill',()=>{
 usePlayerStore.getState().setPlayer({...createMockPlayer('Synthetic Wall carry','necromancer'),level:30,skillPoints:2,
  skillLevels:{'necromancer.bone_armor':1,'necromancer.bone_wall':1},comboOrder:['necromancer.bone_wall']});
 const cap:Item={id:'wall-wave-pool-cap',baseId:'items/base/helm-cap',rarity:'rare',level:1,identified:true,equipped:false,socketCapacity:0,
  affixes:[{affixId:'fixture-imported',values:new Map([['statMods.life',100000],['statMods.mana',100000],['statMods.attack',10000]])}]};
 useInventoryStore.getState().addItem(cap);expect(useInventoryStore.getState().equipItem(cap)).toEqual({ok:true});
 expect(startSubAreaRun({act:1,subAreaId:'areas/act1-blood-moor',mode:'manual',runSeed:7,challengeOrdinal:0})).not.toBeNull();
 expect(useCombatStore.getState().playerTeam.find(u=>u.kind==='hero')?.boneWallRank).toBe(1);
 const first=recording();
 const castIndex=first.events.findIndex(e=>e.kind==='action'&&e.skillId==='necromancer.bone_wall');expect(castIndex).toBeGreaterThan(0);
 while(useCombatStore.getState().eventCursor<=castIndex)useCombatStore.getState().advanceEvent();
 const frozen=recording();
 expect(usePlayerStore.getState().allocateSkillPoint('skills-necromancer-bone-wall')).toBe('ok');
 expect(recording()).toEqual(frozen);
 const count=useCombatStore.getState().recordedEvents.length;
 for(let i=0;i<count;i++)useCombatStore.getState().advanceEvent();
 expect(useCombatStore.getState().playbackComplete).toBe(true);expect(useCombatStore.getState().outcome?.winner).toBe('player');
 const final=useCombatStore.getState().outcome?.finalPlayerTeam.find(u=>u.kind==='hero');
 if(!final)throw new Error('Missing native Wall final hero');
 const elapsed=first.events.at(-1)?.simClockMs;if(elapsed===undefined)throw new Error('Missing native elapsed time');
 const carried=rebaseStatusClock(final,elapsed).statuses.find(s=>s.id==='bone-wall');
 expect(carried?.boneWall?.rank).toBe(1);expect(carried?.boneWall?.remaining).toBeGreaterThan(0);
 expect(advanceWaveOrFinish()).toBe('next-wave');
 const next=useCombatStore.getState().playerTeam.find(u=>u.kind==='hero');
 expect(next?.boneWallRank).toBe(2);expect(next?.statuses.find(s=>s.id==='bone-wall')).toEqual(carried);
 const second=recording(),save=toJsonSafe(snapshotStores());
 for(let repeat=0;repeat<2;repeat++) { refreshActivePlayerCombatConfig({replayCurrentWave:true});expect(recording()).toEqual(second); }
 expect(toJsonSafe(snapshotStores())).toEqual(save);
});
it('roundtrips learned allocations without persisting paid Wall or Prison timers or changing base stats',async()=>{
 paid('bone-wall');
 const save=snapshotStores();if(!save)throw new Error('Missing synthetic native save');
 const raw=JSON.stringify(toJsonSafe(save));
 expect(raw).not.toContain('boneWall');expect(raw).not.toContain('bonePrison');
 await importIntoStores(raw);
 expect(usePlayerStore.getState().player).toEqual(save.player);
 expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(toJsonSafe(save.inventory));
 const player=usePlayerStore.getState().player;if(!player)throw new Error('Missing restored player');
 const fresh=playerToCombatUnit(player);
 expect(fresh.boneWallRank).toBe(1);expect(fresh.bonePrisonRank).toBe(1);
 expect(fresh.statuses.some(s=>s.id==='bone-wall'||s.id==='bone-prison')).toBe(false);
 expect(useCombatStore.getState().playerTeam).toEqual([]);
});

it('reinstalls the original Wall recording only under the actual locked Iron Golem publication policy',()=>{
 const p={...createMockPlayer('Synthetic locked Wall','necromancer'),level:30,skillPoints:2,
  skillLevels:{'necromancer.bone_armor':1,'necromancer.bone_wall':1,'necromancer.clay_golem':1,
   'necromancer.golem_mastery':1,'necromancer.blood_golem':1,'necromancer.iron_golem':1},
  comboOrder:['necromancer.bone_wall','necromancer.iron_golem']};
 usePlayerStore.getState().setPlayer(p);
 expect(playerToCombatUnit(p).skillOrder).toContain('necromancer.iron_golem');
 expect(startSubAreaRun({act:1,subAreaId:'areas/act1-blood-moor',mode:'manual',runSeed:7,challengeOrdinal:0})).not.toBeNull();
 const original=recording();
 const cast=original.events.findIndex(e=>e.kind==='action'&&e.skillId==='necromancer.bone_wall');expect(cast).toBeGreaterThan(0);
 while(useCombatStore.getState().eventCursor<=cast)useCombatStore.getState().advanceEvent();
 expect(usePlayerStore.getState().allocateSkillPoint('skills-necromancer-bone-wall')).toBe('ok');
 const persistent=toJsonSafe(snapshotStores());
 refreshActivePlayerCombatConfig({replayCurrentWave:true});
 expect(recording()).toEqual(original);expect(toJsonSafe(snapshotStores())).toEqual(persistent);
});

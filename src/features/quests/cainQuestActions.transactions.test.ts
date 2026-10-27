import { afterEach,beforeEach,describe,it,expect,vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { useHydrationStore,__resetPersistenceForTests,snapshotStores } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { decodeSave } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save/serialize';
import { CAIN_QUEST as MAIN,CAIN_SIDE_QUEST as SIDE,CAIN_SCROLL_SOURCE as SOURCE,CAIN_AREA as AREA } from '@/engine/map/cain-quest';
import { ACT1_QUEST_RECEIPTS as R } from '@/engine/map/act1-quest-sources';
import { recoverQuestTool,interactWithAreaObject } from '@/features/quests/interactObject';
import { giveQuestItem } from '@/features/quests/questDelivery';
import { talkToCain,isCainTownPresent } from '@/features/quests/cainQuestActions';
import { claimQuestReward } from '@/features/quests/claimReward';
const domains=[usePlayerStore,useMapStore,useInventoryStore,useMercStore,useMetaStore,useFormationStore] as const;
function reset(){abortSubAreaRun();__resetPersistenceForTests();useCombatStore.getState().reset();for(const store of domains)store.getState().reset();}
function snapshot(){return structuredClone(domains.map(store=>Object.fromEntries(Object.entries(store.getState()).filter(([,value])=>typeof value!=='function'))));}
function track(claimed=false,legacy=false){
 useMapStore.setState({currentAct:1,currentSubAreaId:AREA,clearedSubAreas:[AREA],questProgress:{
  [MAIN]:{id:MAIN,status:legacy?'completed':'inProgress',rewardClaimed:claimed,objectives:{}},
  [SIDE]:{id:SIDE,status:legacy?'completed':'inProgress',rewardClaimed:claimed,objectives:{}}
 }});
}
const actions={recover:()=>recoverQuestTool(SOURCE),give:()=>giveQuestItem(SOURCE,'npc/akara'),
 rescue:()=>interactWithAreaObject('objects/cain_cage'),talk:()=>talkToCain()};
type Kind=keyof typeof actions;
const kinds=Object.keys(actions) as Kind[];
function prepare(kind:Kind){track();if(kind==='recover')return;expect(actions.recover()).toBe('ok');if(kind==='give')return;
 expect(actions.give()).toBe('ok');if(kind==='rescue')return;expect(actions.rescue()).toBe('ok');}
function durable(){const save=snapshotStores();if(!save)throw new Error('Missing save');expect(decodeSave(toJsonSafe(save))).toEqual(save);return save;}
beforeEach(()=>{reset();useHydrationStore.getState().setStatus('ready');usePlayerStore.getState().setPlayer(createMockPlayer('Cain transaction','sorceress'));});
afterEach(()=>{vi.restoreAllMocks();reset();});
describe('finite Cain transactions and sparse-history durability',()=>{
 it.each([false,true])('earns sparse completed claimed=%s proof in four durable actions without income',claimed=>{
  track(claimed,true);const hero=structuredClone(usePlayerStore.getState().player),mercs=structuredClone(useMercStore.getState().ownedMercs);
  for(const kind of kinds){expect(actions[kind]()).toBe('ok');const save=durable();
   expect(save.map.questProgress[MAIN]).toMatchObject({status:'completed',rewardClaimed:claimed});
   expect(save.map.questProgress[SIDE]).toMatchObject({status:'completed',rewardClaimed:claimed});
   expect(save.player).toEqual(hero);expect(save.mercs.ownedMercs).toEqual(mercs);expect(save.inventory.questServices).toEqual({});
  }
  expect(isCainTownPresent()).toBe(true);expect(useMapStore.getState().questReceipts).toEqual({[R.rescueCain]:true,[R.cainTalk]:true});
  const after=snapshot();for(const kind of kinds)expect(actions[kind]()).toMatch(/already/);expect(snapshot()).toEqual(after);
 });
 it('retains a sparse literal22 journal without manufacturing any proof before explicit repair',()=>{
  track(true,true);const current=durable();const raw={...current,version:22};const before=structuredClone(raw);
  expect(decodeSave(toJsonSafe(raw))).toEqual({...current,version:23});expect(raw).toEqual(before);
  expect(isCainTownPresent()).toBe(false);expect(current.inventory.questItems).toEqual({});expect(current.map.questReceipts).toEqual({});
 });
 it('shows Cain immediately after rescue before any Claim and retains later-act presence',()=>{
  prepare('rescue');expect(isCainTownPresent()).toBe(false);expect(actions.rescue()).toBe('ok');expect(isCainTownPresent()).toBe(true);
  expect(useMapStore.getState().questProgress[MAIN]?.rewardClaimed).toBe(false);
  useMapStore.setState({currentAct:3,clearedSubAreas:['areas/act1-catacombs','areas/act2-tomb-of-tal-rasha']});expect(isCainTownPresent()).toBe(true);
 });
 it('never substitutes generic Talk or object flags for scroll, Give or Rescue proof',()=>{
  track();const before=snapshot();useMapStore.getState().recordNpcTalk('npc/akara');
  useMapStore.getState().recordObjectInteraction({actId:'acts/act1',areaId:AREA,targetId:'objects/cain_cage'});
  expect(snapshot()).toEqual(before);expect(isCainTownPresent()).toBe(false);
 });
 it.each(kinds)('%s refuses replay difficulty without writes',kind=>{
  prepare(kind);useMapStore.setState({selectedDifficulty:'nightmare'});const before=snapshot();expect(actions[kind]()).toBe('not-eligible');expect(snapshot()).toEqual(before);
 });
 it.each(kinds)('%s refuses active combat and unavailable hydration without writes',kind=>{
  prepare(kind);useCombatStore.setState({inCombat:true});let before=snapshot();expect(actions[kind]()).toBe('combat-active');expect(snapshot()).toEqual(before);
  useCombatStore.setState({inCombat:false});useHydrationStore.getState().setStatus('loading');before=snapshot();expect(actions[kind]()).toBe('not-ready');expect(snapshot()).toEqual(before);
 });
 it.each(kinds)('%s holds the shared lease through both publications',kind=>{
  prepare(kind);let observed=false;const results:string[]=[];
  const unsubscribe=useInventoryStore.subscribe(()=>{if(observed)return;observed=true;results.push(actions[kind](),claimQuestReward(MAIN));});
  try{expect(actions[kind]()).toBe('ok');}finally{unsubscribe();}
  expect(observed).toBe(true);expect(results).toEqual(['claim-in-progress','claim-in-progress']);
 });
 it.each(kinds)('%s restores deep input rows after a mutate-then-throw observer and can retry',kind=>{
  prepare(kind);const before=snapshot();let thrown=false;
  const original=useMapStore.getState().questProgress[MAIN];if(!original)throw new Error('Missing main');
  const unsubscribe=useInventoryStore.subscribe(()=>{if(thrown)return;thrown=true;original.objectives['obj-inifuss-tree']=false;throw new Error('mutated observer');});
  try{expect(actions[kind]()).toBe('grant-failed');}finally{unsubscribe();}
  expect(snapshot()).toEqual(before);expect(actions[kind]()).toBe('ok');
 });
 it.each(kinds)('%s verifies postpublication and preserves unrelated source/journal writes in rollback',kind=>{
  prepare(kind);const before=structuredClone(useMapStore.getState().questProgress);let changed=false;
  const unsubscribe=useMapStore.subscribe(()=>{if(changed)return;changed=true;
   const main=useMapStore.getState().questProgress[MAIN];if(!main)throw new Error('Missing main snapshot');
   useMapStore.setState(state=>({questProgress:{...state.questProgress,[MAIN]:{...main,objectives:{}},
    'quests/unrelated-observer':{id:'quests/unrelated-observer',status:'available',objectives:{}}}}));
   useInventoryStore.setState(state=>({questItems:{...state.questItems,'unrelated-source':{itemId:'unrelated-item',state:'owned'}}}));
  });
  try{expect(actions[kind]()).toBe('grant-failed');}finally{unsubscribe();}
  expect(useMapStore.getState().questProgress).toEqual({...before,'quests/unrelated-observer':{id:'quests/unrelated-observer',status:'available',objectives:{}}});
  expect(useInventoryStore.getState().questItems['unrelated-source']).toEqual({itemId:'unrelated-item',state:'owned'});
 });
 it('refuses revoked area-clear context during Recover and preserves unrelated clear-list writes',()=>{
  prepare('recover');const before=structuredClone(useMapStore.getState().questProgress);let changed=false;
  const unsubscribe=useInventoryStore.subscribe(()=>{if(changed)return;changed=true;useMapStore.setState({clearedSubAreas:['areas/act1-blood-moor']});});
  try{expect(actions.recover()).toBe('grant-failed');}finally{unsubscribe();}
  expect(useInventoryStore.getState().questItems).toEqual({});expect(useMapStore.getState().questProgress).toEqual(before);
  expect(useMapStore.getState().clearedSubAreas).toEqual(['areas/act1-blood-moor']);
 });
 it.each(kinds)('%s rejects an observer redirecting location and restores the original context',kind=>{
  prepare(kind);const before=snapshot();let changed=false;
  const unsubscribe=useInventoryStore.subscribe(()=>{if(changed)return;changed=true;useMapStore.setState({currentAct:2,currentSubAreaId:'areas/act2-dry-hills'});});
  try{expect(actions[kind]()).toBe('grant-failed');}finally{unsubscribe();}
  expect(snapshot()).toEqual(before);
 });
 it('attempts both domain restorations and reports every thrown restoration failure',()=>{
  prepare('recover');const before=snapshot();let inventoryCalls=0,mapCalls=0;
  const stopItems=useInventoryStore.subscribe(()=>{inventoryCalls++;throw new Error('inventory subscriber');});
  const stopMap=useMapStore.subscribe(()=>{mapCalls++;throw new Error('map subscriber');});
  try{expect(() => actions.recover()).toThrow(AggregateError);}finally{stopItems();stopMap();}
  expect(inventoryCalls).toBe(2);expect(mapCalls).toBe(1);expect(snapshot()).toEqual(before);
  expect(actions.recover()).toBe('ok');
 });
});

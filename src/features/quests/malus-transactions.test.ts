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
const MAIN='quests/act1-tools-of-the-trade', SOURCE=MAIN+'#objective:obj-recover-malus', AREA='areas/act1-catacombs';
import { recoverQuestTool } from '@/features/quests/interactObject';
import { giveQuestItem } from '@/features/quests/questDelivery';
import { claimQuestReward } from '@/features/quests/claimReward';
const domains=[usePlayerStore,useMapStore,useInventoryStore,useMercStore,useMetaStore,useFormationStore] as const;
function reset(){abortSubAreaRun();__resetPersistenceForTests();useCombatStore.getState().reset();for(const store of domains)store.getState().reset();}
function snapshot(){return structuredClone(domains.map(store=>Object.fromEntries(Object.entries(store.getState()).filter(([,value])=>typeof value!=='function'))));}
function track(claimed=false,legacy=false){
 useMapStore.setState({currentAct:1,currentSubAreaId:AREA,clearedSubAreas:[AREA],questProgress:{
  [MAIN]:{id:MAIN,status:legacy?'completed':'inProgress',rewardClaimed:claimed,objectives:{}}
 }});
}
const actions={recover:()=>recoverQuestTool(SOURCE),give:()=>giveQuestItem(SOURCE,'npc/charsi')};
type Kind=keyof typeof actions;
const kinds=Object.keys(actions) as Kind[];
function prepare(kind:Kind){track();if(kind==='give')expect(actions.recover()).toBe('ok');}
function durable(){const save=snapshotStores();if(!save)throw new Error('Missing save');expect(decodeSave(toJsonSafe(save))).toEqual(save);return save;}
beforeEach(()=>{reset();useHydrationStore.getState().setStatus('ready');usePlayerStore.getState().setPlayer(createMockPlayer('Malus transaction','sorceress'));});
afterEach(()=>{vi.restoreAllMocks();reset();});
describe('finite Malus transactions and sparse-history durability',()=>{
 it.each([false,true])('earns sparse completed claimed=%s proof in two durable actions without income',claimed=>{
  track(claimed,true);const hero=structuredClone(usePlayerStore.getState().player),mercs=structuredClone(useMercStore.getState().ownedMercs);
  for(const kind of kinds){expect(actions[kind]()).toBe('ok');const save=durable();
   expect(save.map.questProgress[MAIN]).toMatchObject({status:'completed',rewardClaimed:claimed});
   expect(save.player).toEqual(hero);expect(save.mercs.ownedMercs).toEqual(mercs);expect(save.inventory.questServices).toEqual({});
  }
  expect(useMapStore.getState().questReceipts).toEqual({});
  const after=snapshot();for(const kind of kinds)expect(actions[kind]()).toMatch(/already/);expect(snapshot()).toEqual(after);
 });
 it('retains a sparse literal22 journal without manufacturing any proof before explicit repair',()=>{
  track(true,true);const current=durable();const raw={...current,version:22};const before=structuredClone(raw);
  expect(decodeSave(toJsonSafe(raw))).toEqual({...current,version:23});expect(raw).toEqual(before);
  expect(current.inventory.questItems).toEqual({});expect(current.map.questReceipts).toEqual({});
 });
 it('generic Charsi Talk never replaces the exact Malus hand-in',()=>{
  track();expect(actions.recover()).toBe('ok');const before=snapshot();useMapStore.getState().recordNpcTalk('npc/charsi');expect(snapshot()).toEqual(before);
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
  const unsubscribe=useInventoryStore.subscribe(()=>{if(thrown)return;thrown=true;original.objectives['obj-recover-malus']=false;throw new Error('mutated observer');});
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
 it.each(kinds)('%s rejects a silently dropped inventory publication and retries once',kind=>{
  prepare(kind);const before=snapshot();let reached=false;
  const lost=vi.spyOn(useInventoryStore,'setState').mockImplementationOnce(()=>{reached=true;});
  try{expect(actions[kind]()).toBe('grant-failed');}finally{lost.mockRestore();}
  expect(reached).toBe(true);expect(snapshot()).toEqual(before);expect(actions[kind]()).toBe('ok');
 });
 it.each(kinds)('%s rejects a silently dropped map publication and retries once',kind=>{
  prepare(kind);const before=snapshot();let reached=false;
  const lost=vi.spyOn(useMapStore,'setState').mockImplementationOnce(()=>{reached=true;});
  try{expect(actions[kind]()).toBe('grant-failed');}finally{lost.mockRestore();}
  expect(reached).toBe(true);expect(snapshot()).toEqual(before);expect(actions[kind]()).toBe('ok');
 });
 it('reports a silently dropped map restoration after attempting inventory restoration',()=>{
  prepare('recover');const beforeItems=structuredClone(useInventoryStore.getState().questItems);
  let fired=false,dropped=false;const restores:(()=>void)[]=[];
  const stop=useMapStore.subscribe(()=>{
   if(fired)return;fired=true;
   const row=useMapStore.getState().questProgress[MAIN];if(!row)throw new Error('Missing published row');
   row.objectives['obj-recover-malus']=false;
   const lost=vi.spyOn(useMapStore,'setState').mockImplementationOnce(()=>{dropped=true;});
   restores.push(()=>{lost.mockRestore();});throw new Error('publication observer');
  });
  let failure:unknown;
  try{actions.recover();}catch(error){failure=error;}finally{stop();for(const restore of restores)restore();}
  expect(fired).toBe(true);expect(dropped).toBe(true);expect(failure).toBeInstanceOf(AggregateError);
  if(!(failure instanceof AggregateError))throw new Error('Missing explicit restoration failure');
  expect(failure.errors.some((error:unknown)=>error instanceof Error&&error.message.includes('restoration postcondition'))).toBe(true);
  expect(useInventoryStore.getState().questItems).toEqual(beforeItems);
 });

});

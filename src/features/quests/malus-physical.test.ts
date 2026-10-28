/** Constructed real-store physical wiring; no earned progression or entitlement. */
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { useHydrationStore, __resetPersistenceForTests, snapshotStores } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { recoverQuestTool, questToolStatus } from '@/features/quests/interactObject';
import { giveQuestItem, questDeliveryStatus } from '@/features/quests/questDelivery';
import { claimQuestReward } from '@/features/quests/claimReward';
import { loadQuests } from '@/data/loaders/quests';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { decodeSave } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save/serialize';
import { withoutV24Fields, withV24Defaults } from '../../../tests/helpers/save-fixtures';
const QUEST='quests/act1-tools-of-the-trade', SOURCE=QUEST+'#objective:obj-recover-malus';
const AREA='areas/act1-catacombs', ITEM='quest/horadric_malus';
const domains=[usePlayerStore,useInventoryStore,useMapStore,useMercStore,useMetaStore,useFormationStore] as const;
function reset(){abortSubAreaRun();__resetPersistenceForTests();useCombatStore.getState().reset();for(const store of domains)store.getState().reset();}
function snapshot(){return structuredClone(domains.map(store=>Object.fromEntries(Object.entries(store.getState()).filter(([,value])=>typeof value!=='function'))));}
function track(mode:'fresh'|'completed'|'claimed'='fresh'){
 useMapStore.setState({currentAct:1,currentSubAreaId:AREA,clearedSubAreas:[AREA],questProgress:{
  [QUEST]:{id:QUEST,status:mode==='fresh'?'inProgress':'completed',rewardClaimed:mode==='claimed',objectives:{}}
 }});
}
function durable(){const save=snapshotStores();if(!save)throw new Error('Missing snapshot');expect(decodeSave(toJsonSafe(save))).toEqual(save);return save;}
beforeEach(()=>{reset();useHydrationStore.getState().setStatus('ready');usePlayerStore.getState().setPlayer(createMockPlayer('Malus physical','sorceress'));});
afterEach(()=>{vi.restoreAllMocks();reset();});
describe('D11 exact Malus physical source',()=>{
 it('authors Catacombs cache→real Charsi Give with the existing IDs',()=>{
  const quest=loadQuests().find(row=>row.id===QUEST);expect(quest?.objectives).toEqual([
   expect.objectContaining({id:'obj-recover-malus',type:'fetch',itemId:ITEM,areaId:AREA,targetId:'objects/horadric_malus_cache'}),
   expect.objectContaining({id:'obj-imbue-ready',type:'give',itemId:ITEM,npcId:'npc/charsi'})
  ]);
  const item=loadQuestItems().find(row=>row.id===ITEM);expect(item).toMatchObject({kind:'delivery',sourceQuestId:QUEST,sourceObjectiveId:'obj-recover-malus',consumeObjectiveId:'obj-imbue-ready'});if(!item)throw new Error('Missing Malus');expect(questItemSource(item)).toBe(SOURCE);
 });
 it.each(['fresh','completed','claimed'] as const)('earns %s physical steps durably without income/charge',mode=>{
  track(mode);const hero=structuredClone(usePlayerStore.getState().player),wallet=structuredClone(useInventoryStore.getState().questServices);
  expect(questToolStatus(SOURCE)).toBe('ready');expect(recoverQuestTool(SOURCE)).toBe('ok');
  expect(useInventoryStore.getState().questItems[SOURCE]).toEqual({itemId:ITEM,state:'owned'});
  let save=durable();expect(save.map.questProgress[QUEST]).toMatchObject({status:mode==='fresh'?'inProgress':'completed',rewardClaimed:mode==='claimed',objectives:{'obj-recover-malus':true}});
  expect(save.player).toEqual(hero);expect(save.inventory.questServices).toEqual(wallet);
  expect(questDeliveryStatus(SOURCE,'npc/charsi')).toBe('ready');expect(giveQuestItem(SOURCE,'npc/charsi')).toBe('ok');
  save=durable();expect(save.inventory.questItems[SOURCE]).toEqual({itemId:ITEM,state:'consumed'});expect(save.map.questProgress[QUEST]).toMatchObject({status:'completed',rewardClaimed:mode==='claimed',objectives:{'obj-recover-malus':true,'obj-imbue-ready':true}});
  expect(save.player).toEqual(hero);expect(save.inventory.questServices).toEqual(wallet);const after=snapshot();
  expect(recoverQuestTool(SOURCE)).toBe('already-owned');expect(giveQuestItem(SOURCE,'npc/charsi')).toBe('already-consumed');expect(snapshot()).toEqual(after);
  if(mode==='claimed'){expect(claimQuestReward(QUEST)).toBe('already-claimed');expect(snapshot()).toEqual(after);}
 });
 it('requires no Smith kill or companion objective',()=>{track();expect(recoverQuestTool(SOURCE)).toBe('ok');expect(giveQuestItem(SOURCE,'npc/charsi')).toBe('ok');expect(Object.keys(useMapStore.getState().questProgress[QUEST]?.objectives??{}).sort()).toEqual(['obj-imbue-ready','obj-recover-malus']);});
 it.each(['untracked','uncleared','wrong-area','wrong-source','nightmare','loading','no-player','combat'] as const)('refuses %s recovery with no writes',condition=>{
  track();if(condition==='untracked')useMapStore.setState({questProgress:{}});if(condition==='uncleared')useMapStore.setState({clearedSubAreas:[]});if(condition==='wrong-area')useMapStore.setState({currentSubAreaId:'areas/act1-dark-wood'});if(condition==='nightmare')useMapStore.setState({selectedDifficulty:'nightmare'});if(condition==='loading')useHydrationStore.getState().setStatus('loading');if(condition==='no-player')usePlayerStore.setState({player:null});if(condition==='combat')useCombatStore.setState({inCombat:true});
  const before=snapshot();expect(recoverQuestTool(condition==='wrong-source'?SOURCE+'x':SOURCE)).toBe(condition==='loading'?'not-ready':condition==='no-player'?'no-player':condition==='combat'?'combat-active':'not-eligible');expect(snapshot()).toEqual(before);
 });
 it('generic Charsi Talk cannot complete a physical hand-in',()=>{track();const before=snapshot();useMapStore.getState().recordNpcTalk('npc/charsi');expect(snapshot()).toEqual(before);});
 it('refuses Give before Recover and wrong NPC/source after real recovery',()=>{
  track();let before=snapshot();expect(giveQuestItem(SOURCE,'npc/charsi')).toBe('not-eligible');expect(snapshot()).toEqual(before);
  expect(recoverQuestTool(SOURCE)).toBe('ok');before=snapshot();expect(giveQuestItem(SOURCE,'npc/akara')).toBe('not-eligible');expect(giveQuestItem(SOURCE+'x','npc/charsi')).toBe('not-eligible');expect(snapshot()).toEqual(before);
 });
 it.each(['owned','consumed'] as const)('native23 %s graph refuses literal22 input without changing the original',state=>{
  track('claimed');expect(recoverQuestTool(SOURCE)).toBe('ok');if(state==='consumed')expect(giveQuestItem(SOURCE,'npc/charsi')).toBe('ok');const current=durable(),predecessor=withoutV24Fields(current),old={...predecessor,version:22};const before=structuredClone(old);expect(old.inventory.questItems[SOURCE]).toEqual({itemId:ITEM,state});expect(()=>decodeSave(toJsonSafe(old))).toThrow('Invalid save: unknown quest item source or item');expect(old).toEqual(before);
 });
 it('migrates sparse claimed22 without manufacturing a physical source',()=>{
  track('claimed');const current=durable(),predecessor=withoutV24Fields(current),old={...predecessor,version:22};expect(decodeSave(toJsonSafe(old))).toEqual(withV24Defaults({...predecessor,version:23}));expect(current.inventory.questItems).toEqual({});expect(current.inventory.questServices).toEqual({});
 });
});

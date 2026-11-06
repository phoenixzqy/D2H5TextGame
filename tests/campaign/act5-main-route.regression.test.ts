/** Disclosed constructed combat prerequisites; native world actions and rewards are real. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { ACT5_ENCOUNTERS } from '@/engine/map/act5-admission';
import { CAGE_PROOFS, INSPECT_PROOF, POTION_SOURCE, THAW_PROOF, READ_PROOF, SCROLL_SOURCE } from '@/engine/save/act5-state';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { captureEarnedRestorers, resetEarnedStores, observeEarnedState } from '../sim/production/earned-state';
import { constructActFivePrefix, publishConstructedActFiveWave } from './act5-fixture';
import { assertActFiveComplete, runActFive } from './act5-route';
import { CampaignStop } from './route';

const siege='quests/act5-siege-on-harrogath', rescue='quests/act5-rescue-on-mount-arreat';
const prison='quests/act5-prison-of-ice', rite='quests/act5-rite-of-passage', eve='quests/act5-eve-of-destruction';
const foothills='areas/act5-bloody-foothills', highlands='areas/act5-frigid-highlands';
const crystalline='areas/act5-crystalline-passage', ancients='areas/act5-ancients-way', throne='areas/act5-throne-of-destruction';
const mainOrder=[['start',siege],['claim',siege],['start',rescue],['visit',highlands],
 ...CAGE_PROOFS.map(source=>['act5',source]),['claim',rescue],['start',prison],['visit',crystalline],
 ['act5',INSPECT_PROOF],['act5',POTION_SOURCE],['act5',THAW_PROOF],['claim',prison],['read',SCROLL_SOURCE],
 ['start',rite],['claim',rite],['start',eve],['claim',eve]];
let restores:(()=>void)[];
beforeEach(()=>{restores=captureEarnedRestorers();resetEarnedStores();vi.spyOn(Date,'now').mockReturnValue(1793304000000);});
afterEach(()=>{vi.restoreAllMocks();for(const restore of restores)restore();});

function publishArea(area:string){
 const map=useMapStore.getState();map.setCurrentLocation(5,area);
 if(area===throne){for(let i=0;i<8;i++)publishConstructedActFiveWave(i);return;}
 const contract=ACT5_ENCOUNTERS.find(row=>row.areaId===area);
 if(contract){
  const row=map.questProgress[contract.questId];assert.ok(row);
  for(const prerequisite of contract.prerequisites)assert.equal(row.objectives[prerequisite],true);
  map.updateQuestProgress(contract.questId,{...row,status:'completed',objectives:{...row.objectives,[contract.objectiveId]:true}});
  useMapStore.setState({questReceipts:{...useMapStore.getState().questReceipts,[contract.proof]:true}});
 }
 map.markCleared(area);
}
function complete(){
 const f=constructActFivePrefix();const entered:string[]=[];
 runActFive(f.profile,f.record,area=>{entered.push(area);publishArea(area);},f.actions,'main-quests');
 return {...f,entered,suffix:f.actions.entries.slice(f.act5Start)};
}

it('runs preparation after earned Siege Claim and before Rescue Start',()=>{
 const f=constructActFivePrefix();let called=false;
 runActFive(f.profile,f.record,publishArea,f.actions,'main-quests',()=>{
  called=true;
  expect(f.actions.entries.slice(f.act5Start).map(row=>[row.action,row.id])).toEqual(mainOrder.slice(0,2));
  expect(useMapStore.getState().questProgress[siege]?.rewardClaimed).toBe(true);
  expect(useMapStore.getState().clearedSubAreas).toContain(foothills);
  expect(useMapStore.getState().questProgress[rescue]).toBeUndefined();
 });
 expect(called).toBe(true);
});

it('retains a preparation failure after Siege without starting later quests',()=>{
 const f=constructActFivePrefix(),failure=new CampaignStop('budget','Preparation stopped');
 let atStop:ReturnType<typeof observeEarnedState>|undefined;
 expect(()=>{runActFive(f.profile,f.record,publishArea,f.actions,'main-quests',()=>{
  atStop=observeEarnedState();throw failure;
 });}).toThrow(failure);
 expect(observeEarnedState()).toEqual(atStop);
 expect(f.actions.entries.slice(f.act5Start).map(row=>[row.action,row.id])).toEqual(mainOrder.slice(0,2));
});

it('keeps the returned preparation profile through every later quest boundary',()=>{
 const f=constructActFivePrefix(),updated={...f.profile,priority:[...f.profile.priority].reverse()};
 const returned=runActFive(f.profile,f.record,area=>{
  if(area!==foothills)expect(usePlayerStore.getState().player?.comboOrder).toEqual(updated.priority);
  publishArea(area);
 },f.actions,'main-quests',()=>updated);
 expect(returned).toBe(updated);
 expect(usePlayerStore.getState().player?.comboOrder).toEqual(updated.priority);
});

it('executes all five main quests with native cage/potion/thaw/scroll actions and once-only rewards',()=>{
 const f=complete();
 expect(f.entered).toEqual([foothills,highlands,crystalline,ancients,throne]);
 expect(f.suffix.map(row=>[row.action,row.id])).toEqual(mainOrder);
 expect(Object.keys(useMapStore.getState().questProgress).filter(id=>id.startsWith('quests/act5-')))
  .toEqual([siege,rescue,prison,rite,eve]);
 expect(useInventoryStore.getState().questItems[POTION_SOURCE]).toEqual({itemId:'quest/malahs_potion',state:'consumed'});
 expect(useInventoryStore.getState().questItems[SCROLL_SOURCE]).toEqual({itemId:'items/scroll_of_resist',state:'consumed'});
 expect(useMapStore.getState().questReceipts[READ_PROOF]).toBe(true);
 const read=f.suffix.find(row=>row.action==='read');assert.ok(read?.before.player&&read.after.player);
 expect(read.after.player.skillPoints).toBe(read.before.player.skillPoints);
 const rescueClaim=f.suffix.find(row=>row.action==='claim'&&row.id===rescue);assert.ok(rescueClaim?.before.player&&rescueClaim.after.player);
 expect(rescueClaim.after.player.skillPoints-rescueClaim.before.player.skillPoints).toBe(1);
 expect(()=>{assertActFiveComplete(f.suffix,'main-quests');}).not.toThrow();
 const before=observeEarnedState();expect(()=>{f.actions.claim(eve);}).toThrow('already-claimed');expect(observeEarnedState()).toEqual(before);
});

it.each([foothills,highlands,crystalline,ancients,throne])('retains a route nonwin at %s without later actions or claims',stop=>{
 const f=constructActFivePrefix(),entered:string[]=[];const failure=new CampaignStop('nonwin','Constructed route nonwin');
 let atStop:ReturnType<typeof observeEarnedState>|undefined;
 expect(()=>{runActFive(f.profile,f.record,area=>{
  entered.push(area);if(area===stop){atStop=observeEarnedState();throw failure;}publishArea(area);
 },f.actions,'main-quests');}).toThrow(failure);
 expect(observeEarnedState()).toEqual(atStop);expect(entered.at(-1)).toBe(stop);
 const target=stop===highlands?rescue:ACT5_ENCOUNTERS.find(row=>row.areaId===stop)?.questId;assert.ok(target);
 expect(f.actions.entries.filter(row=>row.action==='claim'&&row.id===target)).toHaveLength(0);
 expect(useMapStore.getState().questProgress[eve]?.rewardClaimed).not.toBe(true);
});

it.each(['cage','potion','scroll','ancients','unclaimed','extra-quest','extra-clear'] as const)('rejects optional graph corruption: %s',fault=>{
 const f=complete(),map=useMapStore.getState(),inv=useInventoryStore.getState();
 if(fault==='cage'||fault==='ancients'){
  const receipts={...map.questReceipts},id=fault==='cage'?CAGE_PROOFS[0]:`${rite}#action:ancients-victory`;assert.ok(id);
  Reflect.deleteProperty(receipts,id);useMapStore.setState({questReceipts:receipts});
 }
 if(fault==='potion'||fault==='scroll'){
  const source=fault==='potion'?POTION_SOURCE:SCROLL_SOURCE,item=inv.questItems[source];assert.ok(item);
  useInventoryStore.setState({questItems:{...inv.questItems,[source]:{...item,state:'owned'}}});
 }
 if(fault==='unclaimed')map.updateQuestProgress(siege,{...map.questProgress[siege],rewardClaimed:false});
 if(fault==='extra-quest')map.updateQuestProgress('quests/side-act5-anyas-gift',{status:'completed',objectives:{}});
 if(fault==='extra-clear')map.markCleared('areas/act5-worldstone-keep');
 expect(()=>{assertActFiveComplete(f.suffix,'main-quests');}).toThrow();
});

it('rejects omitted or reordered optional actions and rejects main history under the minimum contract',()=>{
 const f=complete();expect(()=>{assertActFiveComplete(f.suffix);}).toThrow();
 const missing=f.suffix.filter(row=>row.id!==POTION_SOURCE);expect(()=>{assertActFiveComplete(missing,'main-quests');}).toThrow();
 expect(()=>{assertActFiveComplete([...f.suffix].reverse(),'main-quests');}).toThrow();
});

it('does not accept an undocumented route mode or mutate the native stores',()=>{
 const f=constructActFivePrefix(),before=observeEarnedState();
 expect(()=>{runActFive(f.profile,f.record,()=>{throw new Error('unexpected admission');},f.actions,
  'unknown' as 'main-quests');}).toThrow('Invalid Act V route');
 expect(observeEarnedState()).toEqual(before);
 expect(usePlayerStore.getState().player?.id).toBe(f.initial.player.id);
});

it('keeps the profile prepared after Rite Claim through Throne and Eve Claim',()=>{
 const f=constructActFivePrefix(),updated={...f.profile,priority:[...f.profile.priority].reverse()};let called=false;
 const returned=runActFive(f.profile,f.record,area=>{
  if(area===throne){expect(called).toBe(true);expect(usePlayerStore.getState().player?.comboOrder).toEqual(updated.priority);}
  publishArea(area);
 },f.actions,'main-quests',undefined,current=>{
  called=true;expect(current).toBe(f.profile);expect(useMapStore.getState().questProgress[rite]?.rewardClaimed).toBe(true);
  expect(useMapStore.getState().questProgress[eve]).toBeUndefined();return updated;
 });
 expect(returned).toBe(updated);expect(usePlayerStore.getState().player?.comboOrder).toEqual(updated.priority);
});

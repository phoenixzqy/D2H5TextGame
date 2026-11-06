/** Constructed original-source publications isolate independent quest/point conservation. */
import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { ACT5_ENCOUNTERS } from '@/engine/map/act5-admission';
import { READ_PROOF, SCROLL_SOURCE } from '@/engine/save/act5-state';
import { useMapStore } from '@/stores/mapStore';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { constructActFivePrefix, publishConstructedActFiveWave, constructedActFiveQuestGraph } from './act5-fixture';
import { fixtureSave } from './act4-fixture';
import { runActFive } from './act5-route';
import { auditCampaignQuests } from './quest-audit';
import { CampaignStop } from './route';

const crystalline='areas/act5-crystalline-passage', throne='areas/act5-throne-of-destruction';
let restores:(()=>void)[];
beforeEach(()=>{restores=captureEarnedRestorers();resetEarnedStores();vi.spyOn(Date,'now').mockReturnValue(1793304000000);});
afterEach(()=>{vi.restoreAllMocks();for(const restore of restores)restore();});
function fixture(stop?:string){
 const f=constructActFivePrefix();let ordinal=Math.max(...f.settlements.map(e=>e.ordinal))+1;
 try{
  runActFive(f.profile,f.record,area=>{
   if(area===stop)throw new CampaignStop('nonwin','Constructed optional nonwin');
   const map=useMapStore.getState();map.setCurrentLocation(5,area);
   const last=area===throne?7:0;
   for(let index=0;index<=last;index++){
    const before=constructedActFiveQuestGraph();
    if(area===throne)publishConstructedActFiveWave(index);
    else{
     const contract=ACT5_ENCOUNTERS.find(e=>e.areaId===area);
     if(contract){const row=map.questProgress[contract.questId];assert.ok(row);
      map.updateQuestProgress(contract.questId,{...row,status:'completed',objectives:{...row.objectives,[contract.objectiveId]:true}});
      useMapStore.setState({questReceipts:{...useMapStore.getState().questReceipts,[contract.proof]:true}});
     }
    }
    const after=constructedActFiveQuestGraph();
    if(!isDeepStrictEqual(before,after))f.settlements.push({act:5,area,ordinal,index,actionIndex:f.actions.entries.length,nativeReturned:true,
     winner:'player',heroLife:1,advance:index===last?'victory':'next-wave',before,after});
   }
   useMapStore.getState().markCleared(area);ordinal++;
  },f.actions,'main-quests');
 }catch(error){if(!(error instanceof CampaignStop)||error.status!=='nonwin')throw error;}
 return {...f,terminal:fixtureSave(),options:{act3Start:f.act3Start,act4Start:f.act4Start,
  act5Start:f.act5Start,act5Route:'main-quests' as const,settlements:f.settlements}};
}
const audit=(f:ReturnType<typeof fixture>)=>auditCampaignQuests(f.initial,f.terminal,f.actions.entries,f.prefixClaims,f.options);

it('reconciles the full64action graph, optional combat proofs and two different Read effects',()=>{
 const f=fixture();expect(f.actions.entries).toHaveLength(64);
 expect(audit(f)).toMatchObject({successfulClaims:15,reads:1,scrollReads:1,shenkProofs:1,nihlathakProofs:1,
  ancientsProofs:1,throneProofs:1,baalProofs:1,explicitSkillPoints:6,explicitStatPoints:0});
 const read=f.actions.entries.find(e=>e.id===SCROLL_SOURCE);assert.ok(read?.before.player&&read.after.player);
 expect(read.after.player.skillPoints).toBe(read.before.player.skillPoints);
 expect(f.terminal.map.questReceipts[READ_PROOF]).toBe(true);
});

it.each([crystalline,throne])('reconciles a legitimate partial optional route stopped before %s',stop=>{
 const f=fixture(stop);expect(audit(f)).toMatchObject({shenkProofs:1,nihlathakProofs:stop===throne?1:0,
  ancientsProofs:stop===throne?1:0,throneProofs:0,baalProofs:0});
 expect(f.terminal.map.questProgress['quests/act5-eve-of-destruction']?.rewardClaimed).not.toBe(true);
});

it.each(['receipt','area','nonwin','action-index'] as const)('rejects corrupted optional encounter evidence: %s',fault=>{
 const f=fixture(),index=f.settlements.findIndex(e=>e.area===crystalline),event=f.settlements[index];assert.ok(event);
 if(fault==='receipt'){const receipts={...event.after.receipts};Reflect.deleteProperty(receipts,'quests/act5-prison-of-ice#action:nihlathak-victory');f.settlements[index]={...event,after:{...event.after,receipts}};}
 if(fault==='area')f.settlements[index]={...event,area:'areas/act5-worldstone-keep'};
 if(fault==='nonwin')f.settlements[index]={...event,winner:'enemy',advance:'defeat'};
 if(fault==='action-index')f.settlements[index]={...event,actionIndex:event.actionIndex-1};
 expect(()=>audit(f)).toThrow();
});

it('rejects an unaccounted scroll point and rejects optional entries without a declared route',()=>{
 const f=fixture();
 expect(()=>auditCampaignQuests(f.initial,f.terminal,f.actions.entries,f.prefixClaims,
  {act3Start:f.act3Start,act4Start:f.act4Start,act5Start:f.act5Start,settlements:f.settlements})).toThrow();
 f.terminal={...f.terminal,player:{...f.terminal.player,skillPoints:f.terminal.player.skillPoints+1}};
 expect(()=>audit(f)).toThrow('skill point conservation');
});

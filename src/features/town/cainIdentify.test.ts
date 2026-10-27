import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore, __resetPersistenceForTests } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { loadItemBases } from '@/data/loaders/loot';
import * as lootDefinitions from '@/data/loaders/loot';
import { createMercFromDef } from '@/stores/mercFactory';
import { loadMercPool } from '@/data/loaders/mercs';
import { projectIronGolemItem } from '@/engine/items/iron-golem';
import { CAIN_QUEST as MAIN, CAIN_SIDE_QUEST as SIDE, CAIN_SCROLL_SOURCE as SOURCE } from '@/engine/map/cain-quest';
import { ACT1_QUEST_RECEIPTS as R } from '@/engine/map/act1-quest-sources';
import type { Item } from '@/engine/types/items';
import { cainIdentifyCandidates, selectCainIdentifyItem, identifyCainItem } from './cainIdentify';

const stores=[usePlayerStore,useMapStore,useInventoryStore,useMercStore] as const;
function reset(){abortSubAreaRun();__resetPersistenceForTests();useCombatStore.getState().reset();for(const store of stores)store.getState().reset();}
function snapshot(){return structuredClone(stores.map(store=>Object.fromEntries(Object.entries(store.getState()).filter(([,v])=>typeof v!=='function'))));}
function item(type='weapon'):Item{
  const base=[...loadItemBases().values()].find(row=>row.type===type&&row.reqLevel>1&&(type!=='weapon'||row.metal===true));
  if(!base)throw new Error('Missing native base');
  return{id:'selected-'+type,baseId:base.id,rarity:'normal',level:50,ilvl:50,identified:false,equipped:false,
    ...(['weapon','armor'].includes(type)?{socketCapacity:0}:{})};
}
function selection(target:Item){const value=selectCainIdentifyItem(target);expect(value).not.toBeNull();if(!value)throw new Error('Missing selection');return value;}
beforeEach(()=>{
  reset();useHydrationStore.getState().setStatus('ready');usePlayerStore.getState().setPlayer(createMockPlayer('Identify','necromancer'));
  useMapStore.setState({currentAct:1,questProgress:{
    [MAIN]:{id:MAIN,status:'completed',rewardClaimed:true,objectives:{'obj-inifuss-tree':true,'obj-decode':true,'obj-rescue-cain':true}},
    [SIDE]:{id:SIDE,status:'completed',rewardClaimed:false,objectives:{'obj-talk':true}}
  },questReceipts:{[R.rescueCain]:true,[R.cainTalk]:true}});
  useInventoryStore.setState({questItems:{[SOURCE]:{itemId:'quest/scroll_of_inifuss',state:'consumed'}}});
});
afterEach(()=>{vi.restoreAllMocks();reset();});

describe('Permanent Cain Identify selected instance',()=>{
  it.each(['weapon','armor','jewelry','charm'])('changes only identified for canonical %s despite unmet wearing level',type=>{
    if(type==='charm') {
      // No authored charm base exists. Verify supported charm semantics against
      // a disclosed test-local canonical catalog, never caller-supplied authority.
      const definitions=new Map(loadItemBases());
      definitions.set('test/charm',{id:'test/charm',name:'test/charm',type:'charm',slot:null,reqLevel:50,maxSockets:0,canHaveAffixes:true});
      vi.spyOn(lootDefinitions,'loadItemBases').mockReturnValue(definitions);
    }
    const target=item(type);useInventoryStore.setState({backpack:[target]});const before=snapshot();
    expect(cainIdentifyCandidates()).toEqual([target]);expect(identifyCainItem(selection(target))).toBe('ok');
    const inventory=before[2];if(!inventory)throw new Error('Missing inventory snapshot');Object.assign(inventory,{backpack:[{...target,identified:true}]});
    expect(snapshot()).toEqual(before);expect(cainIdentifyCandidates()).toEqual([]);
  });
  it('unlocks the real Iron Golem consumer without changing identity or granting income',()=>{
    const target=item();useInventoryStore.setState({backpack:[target]});const selected=selection(target);
    expect(projectIronGolemItem(target)).toEqual({eligible:false,reason:'unidentified'});
    expect(identifyCainItem(selected)).toBe('ok');const actual=useInventoryStore.getState().backpack[0];
    if(!actual)throw new Error('Missing identified instance');expect(actual.id).toBe(target.id);expect(projectIronGolemItem(actual).eligible).toBe(true);
    const after=snapshot();expect(identifyCainItem(selected)).toBe('not-eligible');expect(snapshot()).toEqual(after);
  });
  it('accepts side-only source entitlement and replay difficulty without a charge',()=>{
    const map=useMapStore.getState();const main=map.questProgress[MAIN],side=map.questProgress[SIDE];if(!main||!side)throw new Error('Missing graph');
    useMapStore.setState({selectedDifficulty:'nightmare',questProgress:{[MAIN]:{...main,rewardClaimed:false},[SIDE]:{...side,rewardClaimed:true}}});
    const target=item();useInventoryStore.setState({backpack:[target]});expect(identifyCainItem(selection(target))).toBe('ok');
    expect(useInventoryStore.getState().questServices).toEqual({});
  });
  it('rejects bare legacy claimed flags until physical proof is earned',()=>{
    useMapStore.setState({questProgress:{[MAIN]:{id:MAIN,status:'completed',rewardClaimed:true,objectives:{}}},questReceipts:{}});
    const target=item();useInventoryStore.setState({backpack:[target],questItems:{}});const before=snapshot();
    expect(cainIdentifyCandidates()).toEqual([]);expect(selectCainIdentifyItem(target)).toBeNull();expect(snapshot()).toEqual(before);
  });
  it.each(['identified','equipped','unknown','runeword','duplicate-stash','hero-mirror','detached','socket-quarantine','legacy-quarantine','missing-identified','missing-equipped','malformed-affixes'])('refuses %s without writes',kind=>{
    let target=item();if(kind==='identified')target={...target,identified:true};if(kind==='equipped')target={...target,equipped:true};
    if(kind==='unknown')target={...target,baseId:'missing/base'};if(kind==='runeword')target={...target,rarity:'runeword',runewordId:'missing/word'};
    if(kind==='missing-identified')Reflect.deleteProperty(target,'identified');if(kind==='missing-equipped')Reflect.deleteProperty(target,'equipped');
    if(kind==='malformed-affixes')Object.assign(target,{affixes:{}});
    useInventoryStore.setState({backpack:[target],...(kind==='duplicate-stash'?{stash:[target]}:{})});
    if(kind==='hero-mirror'){const hero=usePlayerStore.getState().player;if(!hero)throw new Error('Missing hero');usePlayerStore.setState({player:{...hero,equipment:[target]}});}
    if(kind==='socket-quarantine')useInventoryStore.setState({socketQuarantine:[{sourceVersion:18,item:target,origin:{container:'backpack',index:0}}]});
    if(kind==='legacy-quarantine')useInventoryStore.setState({legacyGearQuarantine:[{item:target,origin:{container:'backpack',index:0}}]});
    const before=snapshot();expect(selectCainIdentifyItem(kind==='detached'?{...target}:target)).toBeNull();expect(snapshot()).toEqual(before);
  });
  it('refuses same-ID replacements and in-place changes since selection',()=>{
    const target=item();useInventoryStore.setState({backpack:[target]});const chosen=selection(target);
    useInventoryStore.setState({backpack:[{...target}]});const replaced=snapshot();expect(identifyCainItem(chosen)).toBe('not-eligible');expect(snapshot()).toEqual(replaced);
    useInventoryStore.setState({backpack:[target]});Object.assign(target,{level:49});const mutated=snapshot();expect(identifyCainItem(chosen)).toBe('not-eligible');expect(snapshot()).toEqual(mutated);
  });
  it('preserves legacy Map payloads and detects mutation after publication',()=>{
    const target={...item(),rarity:'rare' as const,affixes:[{affixId:'old-save-affix',values:new Map([['statMods.life',2]])}]};
    useInventoryStore.setState({backpack:[target]});const chosen=selection(target),before=snapshot();let fired=false;
    const stop=useInventoryStore.subscribe(()=>{if(fired)return;fired=true;target.affixes[0]?.values.set('statMods.life',999);});
    try{expect(identifyCainItem(chosen)).toBe('grant-failed');}finally{stop();}expect(snapshot()).toEqual(before);
    const restored=useInventoryStore.getState().backpack[0];if(!restored)throw new Error('Missing restored target');expect(identifyCainItem(selection(restored))).toBe('ok');
    expect(useInventoryStore.getState().backpack[0]?.affixes).toEqual([{affixId:'old-save-affix',values:new Map([['statMods.life',2]])}]);
  });
  it('removes an observer-moved target from socket quarantine and restores it while preserving unrelated writes',()=>{
    const target=item(),other={...item('jewelry'),id:'observer-item'};useInventoryStore.setState({backpack:[target]});const chosen=selection(target);let fired=false;
    const stop=useInventoryStore.subscribe(state=>{if(fired)return;fired=true;const moved=state.backpack[0];if(!moved)throw new Error('Missing published target');
      useInventoryStore.setState({backpack:[other],socketQuarantine:[{sourceVersion:18,item:moved,origin:{container:'backpack',index:0}}]});});
    try{expect(identifyCainItem(chosen)).toBe('grant-failed');}finally{stop();}
    expect(useInventoryStore.getState().backpack).toEqual([target,other]);expect(useInventoryStore.getState().socketQuarantine).toEqual([]);
  });
  it('holds the shared lease through publication and all rollback attempts',()=>{
    const target=item();useInventoryStore.setState({backpack:[target]});const chosen=selection(target),results:string[]=[];
    const stop=useInventoryStore.subscribe(()=>results.push(identifyCainItem(chosen)));
    try{expect(identifyCainItem(chosen)).toBe('ok');}finally{stop();}expect(results).toEqual(['claim-in-progress']);
  });
  it.each(['published-id','original-id'])('restores a target whose %s changes during publication without leaving a duplicate',kind=>{
    const target=item();useInventoryStore.setState({backpack:[target]});const chosen=selection(target),before=snapshot();let fired=false;
    const stop=useInventoryStore.subscribe(state=>{if(fired)return;fired=true;const published=state.backpack[0];if(!published)throw new Error('Missing published target');
      Object.assign(kind==='published-id'?published:target,{id:'observer-renamed-target'});throw new Error('rename then throw');});
    try{expect(identifyCainItem(chosen)).toBe('grant-failed');}finally{stop();}expect(snapshot()).toEqual(before);
  });
  it('restores a renamed target moved to quarantine without deleting an unrelated item with that new ID',()=>{
    const target=item(),other={...item('jewelry'),id:'observer-item'};
    useInventoryStore.setState({backpack:[target,other]});const chosen=selection(target),before=snapshot();let fired=false;
    const stop=useInventoryStore.subscribe(state=>{if(fired)return;fired=true;const published=state.backpack[0];if(!published)throw new Error('Missing published target');
      Object.assign(published,{id:other.id});useInventoryStore.setState({backpack:[other],socketQuarantine:[{sourceVersion:18,item:published,origin:{container:'backpack',index:0}}]});throw new Error('moved renamed target');});
    try{expect(identifyCainItem(chosen)).toBe('grant-failed');}finally{stop();}expect(snapshot()).toEqual(before);
    expect(useInventoryStore.getState().backpack[1]).toBe(other);
  });
  it('refuses silent publication that renames and reintroduces the detached original instance',()=>{
    const target=item();useInventoryStore.setState({backpack:[target]});const chosen=selection(target),before=snapshot();let fired=false;
    const stop=useInventoryStore.subscribe(()=>{if(fired)return;fired=true;Object.assign(target,{id:'renamed-original'});useInventoryStore.setState({stash:[target]});});
    try{expect(identifyCainItem(chosen)).toBe('grant-failed');}finally{stop();}expect(snapshot()).toEqual(before);
  });
  it('preserves the remembered field area while using Cain in the current town',()=>{
    const target=item();useInventoryStore.setState({backpack:[target]});
    useMapStore.setState({currentSubAreaId:'areas/act1-dark-wood'});const before=snapshot();
    expect(cainIdentifyCandidates()).toEqual([target]);expect(identifyCainItem(selection(target))).toBe('ok');
    const inv=before[2];if(!inv)throw new Error('Missing inventory');Object.assign(inv,{backpack:[{...target,identified:true}]});expect(snapshot()).toEqual(before);
  });
  it.each([[3,'areas/act2-tomb-of-tal-rasha'],[4,'areas/act3-durance-of-hate'],[5,'areas/act4-chaos-sanctuary']])('uses main-only entitlement in canonical Act %s Cain town, refusing it while locked',(act,gate)=>{
    const main=useMapStore.getState().questProgress[MAIN];if(!main)throw new Error('Missing main');
    useMapStore.setState({questProgress:{[MAIN]:main},questReceipts:{[R.rescueCain]:true},currentAct:Number(act),selectedDifficulty:'nightmare'});
    const target=item();useInventoryStore.setState({backpack:[target]});expect(selectCainIdentifyItem(target)).toBeNull();
    useMapStore.setState({clearedSubAreas:[String(gate)]});const before=snapshot();
    expect(identifyCainItem(selection(target))).toBe('ok');const inv=before[2];if(!inv)throw new Error('Missing inventory');
    Object.assign(inv,{backpack:[{...target,identified:true}]});expect(snapshot()).toEqual(before);
  });
  it.each(['backpack','inventory-gear','merc-gear','merc-mirror'])('refuses duplicate ownership in %s without writes',kind=>{
    const target=item();useInventoryStore.setState({backpack:kind==='backpack'?[target,target]:[target]});
    if(kind==='inventory-gear')useInventoryStore.setState({equipped:{weapon:target}});
    if(kind==='merc-gear')useMercStore.setState({mercEquipment:{'unfielded-merc':{weapon:target}}});
    if(kind==='merc-mirror'){
      const def=loadMercPool().pool[0];if(!def)throw new Error('Missing merc definition');
      useMercStore.setState({ownedMercs:[{...createMercFromDef(def),equipment:[target]}]});
    }
    const before=snapshot();expect(selectCainIdentifyItem(target)).toBeNull();expect(cainIdentifyCandidates()).toEqual([]);expect(snapshot()).toEqual(before);
  });
  it.each(['unknown-unique','unknown-set','unknown-affix','invalid-sockets','quest-object'])('refuses %s identity without writes',kind=>{
    let target=item();
    if(kind==='unknown-unique')target={...target,rarity:'unique',uniqueId:'missing/unique'};
    if(kind==='unknown-set')target={...target,rarity:'set',setPieceId:'missing/set'};
    if(kind==='unknown-affix')target={...target,rarity:'rare',affixes:[{id:'missing/affix',tier:0,rolledValue:1}]};
    if(kind==='invalid-sockets')target={...target,socketContents:[{kind:'rune',id:'runes/el'}]};
    if(kind==='quest-object')target={...target,baseId:'quest/scroll_of_inifuss'};
    useInventoryStore.setState({backpack:[target]});const before=snapshot();expect(selectCainIdentifyItem(target)).toBeNull();expect(snapshot()).toEqual(before);
  });
  it.each(['hydrating','no-player','combat','unclaimed','invalid-graph'])('refuses %s after selection without writes',kind=>{
    const target=item();useInventoryStore.setState({backpack:[target]});const chosen=selection(target);
    if(kind==='hydrating')useHydrationStore.getState().setStatus('loading');
    if(kind==='no-player')usePlayerStore.setState({player:null});
    if(kind==='combat')useCombatStore.setState({inCombat:true});
    if(kind==='unclaimed'){
      const map=useMapStore.getState(),main=map.questProgress[MAIN];if(!main)throw new Error('Missing main');
      useMapStore.setState({questProgress:{...map.questProgress,[MAIN]:{...main,rewardClaimed:false}}});
    }
    if(kind==='invalid-graph')useInventoryStore.setState({questItems:{}});
    const before=snapshot();expect(identifyCainItem(chosen)).toBe(kind==='hydrating'?'not-ready':kind==='no-player'?'no-player':kind==='combat'?'combat-active':'not-eligible');expect(snapshot()).toEqual(before);
  });
  it('restores mutated Cain participants, hero and location while preserving unrelated observer writes',()=>{
    const target=item(),other={...item('jewelry'),id:'observer-item'};useInventoryStore.setState({backpack:[target]});
    const chosen=selection(target),before=snapshot();let fired=false;
    const stop=useInventoryStore.subscribe(()=>{if(fired)return;fired=true;
      const map=useMapStore.getState(),main=map.questProgress[MAIN];if(!main)throw new Error('Missing main');
      main.objectives['obj-decode']=false;
      useMapStore.setState({currentAct:2,questReceipts:{...map.questReceipts,'observer-receipt':true}});
      Object.assign(chosen.hero.coreStats,{strength:999});
      useInventoryStore.setState({stash:[other],currencies:{'observer-currency':7}});
    });
    try{expect(identifyCainItem(chosen)).toBe('grant-failed');}finally{stop();}
    const inv=before[2],map=before[1];if(!inv||!map)throw new Error('Missing snapshots');
    Object.assign(inv,{stash:[other],currencies:{'observer-currency':7}});
    Object.assign(map,{questReceipts:{[R.rescueCain]:true,[R.cainTalk]:true,'observer-receipt':true}});expect(snapshot()).toEqual(before);
  });
  it('attempts every restoration and aggregates observer failures while holding the lease, then permits retry',()=>{
    const target=item();useInventoryStore.setState({backpack:[target]});const chosen=selection(target),before=snapshot();
    let inventoryWrites=0,playerWrites=0,mapWrites=0;const nested:string[]=[];
    const stopInventory=useInventoryStore.subscribe(()=>{inventoryWrites++;nested.push(identifyCainItem(chosen));throw new Error(inventoryWrites===1?'publication observer':'inventory restoration observer');});
    const stopPlayer=usePlayerStore.subscribe(()=>{playerWrites++;nested.push(identifyCainItem(chosen));throw new Error('player restoration observer');});
    const stopMap=useMapStore.subscribe(()=>{mapWrites++;nested.push(identifyCainItem(chosen));throw new Error('map restoration observer');});
    let caught:unknown;try{identifyCainItem(chosen);}catch(error){caught=error;}finally{stopInventory();stopPlayer();stopMap();}
    expect(caught).toBeInstanceOf(AggregateError);if(!(caught instanceof AggregateError))throw new Error('Missing aggregate');
    expect(caught.errors).toHaveLength(3);expect(caught.cause).toEqual(new Error('publication observer'));
    expect(inventoryWrites).toBe(2);expect(playerWrites).toBe(1);expect(mapWrites).toBe(1);expect(nested).toEqual(Array(4).fill('claim-in-progress'));
    expect(snapshot()).toEqual(before);const restored=useInventoryStore.getState().backpack[0];if(!restored)throw new Error('Missing restored item');
    expect(identifyCainItem(selection(restored))).toBe('ok');
  });
});

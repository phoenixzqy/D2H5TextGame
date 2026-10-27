/** Constructed cleared area and tracking; earn rescue/Claim through real APIs. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { TownScreen } from '@/features/town/TownScreen';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore, __resetPersistenceForTests } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { recoverQuestTool, interactWithAreaObject } from '@/features/quests/interactObject';
import { giveQuestItem } from '@/features/quests/questDelivery';
import { claimQuestReward } from '@/features/quests/claimReward';
import { isCainTownPresent } from '@/features/quests/cainQuestActions';
import { loadItemBases } from '@/data/loaders/loot';
import { projectIronGolemItem } from '@/engine/items/iron-golem';
import { hasCainCompletion, CAIN_QUEST as MAIN, CAIN_SIDE_QUEST as SIDE, CAIN_SCROLL_SOURCE as SOURCE, CAIN_AREA as AREA } from '@/engine/map/cain-quest';
import type { Item } from '@/engine/types/items';

const stores = [usePlayerStore,useMapStore,useInventoryStore,useMercStore,useCombatStore] as const;
function reset() {
  cleanup(); abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of stores) store.getState().reset();
}
function earnRescue() {
  useMapStore.setState({currentAct:1,currentSubAreaId:AREA,clearedSubAreas:[AREA],questProgress:{
    [MAIN]:{id:MAIN,status:'inProgress',objectives:{}},
    [SIDE]:{id:SIDE,status:'inProgress',objectives:{}}
  }});
  expect(recoverQuestTool(SOURCE)).toBe('ok');
  expect(giveQuestItem(SOURCE,'npc/akara')).toBe('ok');
  expect(interactWithAreaObject('objects/cain_cage')).toBe('ok');
}
function sourceItem(): Item {
  const base=[...loadItemBases().values()].find(row=>row.type==='weapon' && row.metal===true);
  if(!base) throw new Error('Missing native metal weapon');
  return {id:'identify-selected-native',baseId:base.id,rarity:'normal',level:50,ilvl:50,
    socketCapacity:0,identified:false,equipped:false};
}
function town() {
  render(<I18nextProvider i18n={i18n}><MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}>
    <TownScreen />
  </MemoryRouter></I18nextProvider>);
  fireEvent.click(screen.getByTestId('town-npc-cain'));
}
beforeEach(()=>{
  reset();useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Identify contract','necromancer'));
});
afterEach(reset);

describe('Permanent Identify actual town consumer',()=>{
  it('control: actual source actions earn rescue and main Claim without a finite service charge',()=>{
    earnRescue();expect(isCainTownPresent()).toBe(true);
    expect(claimQuestReward(MAIN)).toBe('ok');
    const map=useMapStore.getState();
    expect(hasCainCompletion(MAIN,map.questProgress,useInventoryStore.getState().questItems,map.questReceipts)).toBe(true);
    expect(map.questProgress[MAIN]?.rewardClaimed).toBe(true);
    expect(useInventoryStore.getState().questServices).toEqual({});
  });
  it('control: a valid unidentified native metal weapon reaches the real Iron Golem refusal',()=>{
    expect(projectIronGolemItem(sourceItem())).toEqual({eligible:false,reason:'unidentified'});
    expect(projectIronGolemItem({...sourceItem(),identified:true}).eligible).toBe(true);
  });
  it.each(['en','zh-CN'])('%s offers an explicit selected-item Identify after earned Claim',async locale=>{
    await i18n.changeLanguage(locale);earnRescue();expect(claimQuestReward(MAIN)).toBe('ok');
    const item=sourceItem();useInventoryStore.setState({backpack:[item]});town();
    expect(screen.getByTestId('cain-identify')).toBeVisible();
    fireEvent.change(screen.getByTestId('cain-identify-target'),{target:{value:item.id}});
    fireEvent.click(screen.getByTestId('cain-identify-use'));
    expect(useInventoryStore.getState().backpack).toEqual([{...item,identified:true}]);
    expect(projectIronGolemItem(useInventoryStore.getState().backpack[0] ?? item).eligible).toBe(true);
    expect(useInventoryStore.getState().questServices).toEqual({});
  });
});

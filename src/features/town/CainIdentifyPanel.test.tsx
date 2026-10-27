import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore, __resetPersistenceForTests } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { loadItemBases } from '@/data/loaders/loot';
import { CAIN_QUEST as MAIN, CAIN_SCROLL_SOURCE as SOURCE } from '@/engine/map/cain-quest';
import { ACT1_QUEST_RECEIPTS as R } from '@/engine/map/act1-quest-sources';
import type { Item } from '@/engine/types/items';
import { CainIdentifyPanel } from './CainIdentifyPanel';

const stores=[usePlayerStore,useMapStore,useInventoryStore,useMercStore,useCombatStore] as const;
function reset(){cleanup();abortSubAreaRun();__resetPersistenceForTests();for(const store of stores)store.getState().reset();}
function target():Item{
  const base=[...loadItemBases().values()].find(row=>row.type==='weapon'&&row.metal===true);
  if(!base)throw new Error('Missing native metal weapon');
  return{id:'ui-identify-native',baseId:base.id,rarity:'normal',level:50,ilvl:50,socketCapacity:0,identified:false,equipped:false};
}
function panel(npcId='npc/cain') { return render(<I18nextProvider i18n={i18n}><CainIdentifyPanel npcId={npcId} /></I18nextProvider>); }
beforeEach(()=>{
  reset();useHydrationStore.getState().setStatus('ready');usePlayerStore.getState().setPlayer(createMockPlayer('Identify UI','necromancer'));
  useMapStore.setState({currentAct:1,questProgress:{[MAIN]:{id:MAIN,status:'completed',rewardClaimed:true,
    objectives:{'obj-inifuss-tree':true,'obj-decode':true,'obj-rescue-cain':true}}},questReceipts:{[R.rescueCain]:true}});
  useInventoryStore.setState({questItems:{[SOURCE]:{itemId:'quest/scroll_of_inifuss',state:'consumed'}}});
});
afterEach(reset);

describe('Cain selected-item Identify UI',()=>{
  it.each(['en','zh-CN'])('%s explicitly identifies the selected item with accessible localized feedback',async locale=>{
    await i18n.changeLanguage(locale);const item=target();useInventoryStore.setState({backpack:[item]});panel();
    const select=screen.getByTestId('cain-identify-target'),button=screen.getByTestId('cain-identify-use');
    expect(select).toHaveAccessibleName(i18n.t('services.chooseItem',{ns:'town'}));expect(button).toBeDisabled();
    fireEvent.change(select,{target:{value:item.id}});expect(button).toBeEnabled();expect(screen.getByTestId('cain-identify-preview')).toBeVisible();
    fireEvent.click(button);expect(useInventoryStore.getState().backpack).toEqual([{...item,identified:true}]);
    expect(screen.getByRole('status')).toHaveTextContent(i18n.t('identify.success',{ns:'town'}));expect(button).toBeDisabled();
  });
  it('requires fresh selection after a same-ID replacement, then allows that actual new item',()=>{
    const item=target();useInventoryStore.setState({backpack:[item]});panel();
    fireEvent.change(screen.getByTestId('cain-identify-target'),{target:{value:item.id}});
    act(()=>{useInventoryStore.setState({backpack:[{...item}]});});expect(screen.getByTestId('cain-identify-use')).toBeDisabled();
    fireEvent.change(screen.getByTestId('cain-identify-target'),{target:{value:item.id}});expect(screen.getByTestId('cain-identify-use')).toBeEnabled();
    fireEvent.click(screen.getByTestId('cain-identify-use'));expect(useInventoryStore.getState().backpack[0]?.identified).toBe(true);
  });
  it('subscribes to socket quarantine collisions and clears preview when the selected target becomes ineligible',()=>{
    const item=target();useInventoryStore.setState({backpack:[item]});panel();
    fireEvent.change(screen.getByTestId('cain-identify-target'),{target:{value:item.id}});expect(screen.getByTestId('cain-identify-use')).toBeEnabled();
    act(()=>{useInventoryStore.setState({socketQuarantine:[{sourceVersion:18,item,origin:{container:'backpack',index:0}}]});});
    expect(screen.getByTestId('cain-identify-use')).toBeDisabled();expect(screen.queryByTestId('cain-identify-preview')).not.toBeInTheDocument();
  });
  it('lists no operation at another NPC or when the preserved Claim has no source proof',()=>{
    const item=target();useInventoryStore.setState({backpack:[item]});const view=panel('npc/akara');expect(screen.queryByTestId('cain-identify')).not.toBeInTheDocument();
    act(()=>{useMapStore.setState({questReceipts:{},questProgress:{[MAIN]:{id:MAIN,status:'completed',rewardClaimed:true,objectives:{}}}});useInventoryStore.setState({questItems:{}});});
    view.rerender(<I18nextProvider i18n={i18n}><CainIdentifyPanel npcId="npc/cain" /></I18nextProvider>);expect(screen.queryByTestId('cain-identify')).not.toBeInTheDocument();
  });
});

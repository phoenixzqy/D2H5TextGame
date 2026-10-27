import { describe, it, expect } from 'vitest';
import type { QuestActionReceipts, QuestItemLedger, QuestProgressData } from '@/engine/types/save';
import { ACT1_QUEST_RECEIPTS as R } from '@/engine/map/act1-quest-sources';
import { CAIN_QUEST as MAIN, CAIN_SIDE_QUEST as SIDE, CAIN_SCROLL_SOURCE as SOURCE,
  CAIN_SCROLL_ITEM as ITEM, validateCainQuestGraph, hasCainCompletion, canEarnCainObjective } from './cain-quest';
function graph() {
  const progress: Record<string, { id:string; status:QuestProgressData['status']; rewardClaimed?:boolean; objectives:Record<string,boolean> }> = {
    [MAIN]: { id: MAIN, status: 'completed', rewardClaimed: false, objectives: {
      'obj-inifuss-tree': true, 'obj-decode': true, 'obj-rescue-cain': true } },
    [SIDE]: { id: SIDE, status: 'completed', rewardClaimed: false, objectives: { 'obj-talk': true } }
  };
  const items: Record<string, QuestItemLedger[string]> = { [SOURCE]: { itemId: ITEM, state: 'consumed' } };
  const receipts: Record<string, true> = { [R.rescueCain]: true, [R.cainTalk]: true };
  return { progress, items, receipts };
}
function row(g: ReturnType<typeof graph>, id: string) {
  const entry = g.progress[id];
  if (!entry) throw new Error('Missing Cain graph fixture row');
  return entry;
}
describe('finite current Cain physical/action graph', () => {
  it('accepts actual source and both complete graphs without a service charge', () => {
    const g = graph(); expect(() => { validateCainQuestGraph(g.items,g.progress,g.receipts); }).not.toThrow();
    expect(hasCainCompletion(MAIN,g.progress,g.items,g.receipts)).toBe(true);
    expect(hasCainCompletion(SIDE,g.progress,g.items,g.receipts)).toBe(true);
  });
  it.each([MAIN,SIDE])('bare historical %s flags provide no entitlement', id => {
    const g = graph(); expect(hasCainCompletion(id,g.progress,{},{})).toBe(false);
    expect(() => { validateCainQuestGraph({},g.progress,{}); }).not.toThrow();
  });
  it.each(['source','fetch','give','rescue','side','talk','rescueReceipt','talkReceipt'])('refuses missing %s in the reciprocal graph', missing => {
    const g=graph();
    if (missing==='source') Reflect.deleteProperty(g.items, SOURCE);
    if (missing==='fetch') Reflect.deleteProperty(row(g, MAIN).objectives, 'obj-inifuss-tree');
    if (missing==='give') Reflect.deleteProperty(row(g, MAIN).objectives, 'obj-decode');
    if (missing==='rescue') Reflect.deleteProperty(row(g, MAIN).objectives, 'obj-rescue-cain');
    if (missing==='side') Reflect.deleteProperty(g.progress, SIDE);
    if (missing==='talk') Reflect.deleteProperty(row(g, SIDE).objectives, 'obj-talk');
    if (missing==='rescueReceipt') Reflect.deleteProperty(g.receipts, R.rescueCain);
    if (missing==='talkReceipt') Reflect.deleteProperty(g.receipts, R.cainTalk);
    expect(hasCainCompletion(SIDE,g.progress,g.items,g.receipts)).toBe(false);
    if (missing!=='talkReceipt') expect(() => { validateCainQuestGraph(g.items,g.progress,g.receipts); }).toThrow('Cain source graph');
  });
  it.each([false,true])('permits sparse completed claimed=%s owned and consumed recovery saves', claimed => {
    const g=graph(); row(g, MAIN).rewardClaimed=claimed; row(g, MAIN).objectives={'obj-inifuss-tree':true};
    g.items[SOURCE]={itemId:ITEM,state:'owned'};
    expect(() => { validateCainQuestGraph(g.items,g.progress,{}); }).not.toThrow();
    expect(canEarnCainObjective(g.progress,MAIN,'obj-decode',g.items,{})).toBe(true);
    expect(canEarnCainObjective(g.progress,MAIN,'obj-rescue-cain',g.items,{})).toBe(false);
    row(g, MAIN).objectives['obj-decode']=true; g.items[SOURCE]={itemId:ITEM,state:'consumed'};
    expect(() => { validateCainQuestGraph(g.items,g.progress,{}); }).not.toThrow();
    expect(canEarnCainObjective(g.progress,MAIN,'obj-rescue-cain',g.items,{})).toBe(true);
    expect(hasCainCompletion(MAIN,g.progress,g.items,{})).toBe(false);
  });
  it.each(['wrong-item','owned','wrong-id','available','locked'])('rejects %s source authority', invalid => {
    const g=graph();
    if(invalid==='wrong-item') g.items[SOURCE]={itemId:'quest/other',state:'consumed'};
    if(invalid==='owned') g.items[SOURCE]={itemId:ITEM,state:'owned'};
    if(invalid==='wrong-id') row(g, MAIN).id=SIDE;
    if(invalid==='available'||invalid==='locked') row(g, MAIN).status=invalid;
    expect(() => { validateCainQuestGraph(g.items,g.progress,g.receipts); }).toThrow();
  });
  it('does not alter old sparse journals or infer receipts', () => {
    const g=graph(); row(g, MAIN).objectives={}; row(g, MAIN).rewardClaimed=true;
    const before=structuredClone(g.progress); const receipts:QuestActionReceipts={};
    validateCainQuestGraph({},g.progress,receipts); expect(g.progress).toEqual(before); expect(receipts).toEqual({});
  });
});

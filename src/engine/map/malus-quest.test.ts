import { describe, expect, it } from 'vitest';
import type { QuestItemLedger, QuestProgressData } from '@/engine/types/save';
import { MALUS_QUEST as QUEST, MALUS_SOURCE as SOURCE, MALUS_ITEM as ITEM,
  canEarnMalusObjective, hasMalusHandIn, validateMalusQuestGraph } from './malus-quest';
interface MutableQuestFixture {
 id: string;
 status: QuestProgressData['status'];
 rewardClaimed: boolean;
 objectives: Record<string, boolean>;
}
function row(claimed=false): Record<string, MutableQuestFixture> {
  return {[QUEST]:{id:QUEST,status:'completed' as QuestProgressData['status'],rewardClaimed:claimed,objectives:{} as Record<string,boolean>}};
}
describe('finite Malus physical graph',()=>{
 it.each([false,true])('earns sparse legacy claimed=%s steps without inferring proof',claimed=>{
  const progress=row(claimed),original=structuredClone(progress);
  expect(canEarnMalusObjective(progress,'obj-recover-malus',{})).toBe(true);
  expect(canEarnMalusObjective(progress,'obj-imbue-ready',{})).toBe(false);
  expect(hasMalusHandIn(progress,{})).toBe(false);validateMalusQuestGraph({},progress);expect(progress).toEqual(original);
 });
 it.each([false,true])('permits owned partial claimed=%s without future Give flag',claimed=>{
  const progress=row(claimed),main=progress[QUEST];if(!main)throw new Error('Missing row');main.objectives['obj-recover-malus']=true;
  const items:QuestItemLedger={[SOURCE]:{itemId:ITEM,state:'owned'}};expect(()=>{validateMalusQuestGraph(items,progress);}).not.toThrow();
  expect(canEarnMalusObjective(progress,'obj-imbue-ready',items)).toBe(true);expect(hasMalusHandIn(progress,items)).toBe(false);
 });
 it.each([false,true])('accepts actual consumed claimed=%s graph',claimed=>{
  const progress=row(claimed),main=progress[QUEST];if(!main)throw new Error('Missing row');main.objectives={'obj-recover-malus':true,'obj-imbue-ready':true};
  const items:QuestItemLedger={[SOURCE]:{itemId:ITEM,state:'consumed'}};expect(hasMalusHandIn(progress,items)).toBe(true);expect(()=>{validateMalusQuestGraph(items,progress);}).not.toThrow();
 });
 it.each(['missingRecover','missingGive','owned','wrongItem','noItem','untracked','wrongId','inProgress'] as const)('refuses %s as completed physical proof',kind=>{
  let progress=row(true);const main=progress[QUEST];if(!main)throw new Error('Missing row');main.objectives={'obj-recover-malus':true,'obj-imbue-ready':true};
  let items:QuestItemLedger={[SOURCE]:{itemId:ITEM,state:'consumed'}};
  if(kind==='missingRecover')delete main.objectives['obj-recover-malus'];if(kind==='missingGive')delete main.objectives['obj-imbue-ready'];
  if(kind==='owned')items={[SOURCE]:{itemId:ITEM,state:'owned'}};if(kind==='wrongItem')items={[SOURCE]:{itemId:'wrong',state:'consumed'}};if(kind==='noItem')items={};if(kind==='untracked')progress={};if(kind==='wrongId')main.id='wrong';if(kind==='inProgress')main.status='inProgress';
  expect(hasMalusHandIn(progress,items)).toBe(false);
 });
 it('refuses unknown objectives and untracked rows without changing values',()=>{
  const progress=row(),before=structuredClone(progress);expect(canEarnMalusObjective(progress,'obj-imbue-ready-near',{})).toBe(false);expect(canEarnMalusObjective({},'obj-recover-malus',{})).toBe(false);expect(progress).toEqual(before);
 });
});

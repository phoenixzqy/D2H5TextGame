/** Constructed proof graphs verify conservation, not earned original-source combat. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import * as nativeClaim from '@/features/quests/claimReward';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { constructActFivePrefix, settleConstructedActFiveWave } from './act5-fixture';
import { fixtureSave } from './act4-fixture';
import { auditCampaignQuests } from './quest-audit';

const eve = 'quests/act5-eve-of-destruction', throne = `${eve}#action:throne-waves-victory`;
let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });
function fixture(stop = 7, claim = true) {
  const f = constructActFivePrefix(); f.actions.start(eve);
  for (let index = 0; index <= stop; index++) settleConstructedActFiveWave(f, index);
  if (claim) f.actions.claim(eve);
  return { ...f, terminal: fixtureSave(), options: { act3Start: f.act3Start, act4Start: f.act4Start,
    act5Start: f.act5Start, settlements: f.settlements } };
}
const audit = (f: ReturnType<typeof fixture>) =>
  auditCampaignQuests(f.initial, f.terminal, f.actions.entries, f.prefixClaims, f.options);

it.each([0, 1, 2, 3, 4, 5, 6, 7])('reconciles partial Act V through wave index%s without Claim', stop => {
  const f = fixture(stop, false);
  expect(audit(f)).toMatchObject({ throneProofs: stop >= 4 ? 1 : 0, baalProofs: stop === 7 ? 1 : 0,
    explicitSkillPoints: 4, explicitStatPoints: 0 });
  expect(f.actions.entries).toHaveLength(46);
});

it('reconciles the47action graph, two same-admission proof transitions and native entitlement Claim', () => {
  const f = fixture();
  expect(audit(f)).toMatchObject({ throneProofs: 1, baalProofs: 1, successfulClaims: 11,
    explicitSkillPoints: 4, explicitStatPoints: 0, resistance: { fire: 30, cold: 30 } });
  expect(f.actions.entries).toHaveLength(47);
  const settlements = f.settlements.filter(row => row.act === 5);
  expect(settlements.map(row => [row.index, row.actionIndex, row.advance]))
    .toEqual([[4, 46, 'next-wave'], [7, 46, 'victory']]);
  expect(new Set(settlements.map(row => row.ordinal)).size).toBe(1);
});

it.each(['title', 'unlock', 'selected-title', 'difficulty', 'replay', 'endgame', 'receipt', 'claimed'] as const)(
  'rejects unaccounted terminal Act V %s corruption', fault => {
    const f = fixture(), map = f.terminal.map;
    if (fault === 'title') f.terminal = { ...f.terminal, map: { ...map, questTitles: {} } };
    if (fault === 'unlock') f.terminal = { ...f.terminal, map: { ...map, questDifficulties: {} } };
    if (fault === 'selected-title') f.terminal = { ...f.terminal, map: { ...map, selectedTitle: 'titles/slayer_of_baal' } };
    if (fault === 'difficulty') f.terminal = { ...f.terminal, map: { ...map, selectedDifficulty: 'nightmare' } };
    if (fault === 'replay') f.terminal = { ...f.terminal, map: { ...map,
      challengeOrdinals: { ...map.challengeOrdinals, nightmare: 1 } } };
    if (fault === 'endgame') f.terminal = { ...f.terminal, endgame: { ...f.terminal.endgame, attemptOrdinal: 1 } };
    if (fault === 'receipt') {
      const receipts = { ...map.questReceipts }; Reflect.deleteProperty(receipts, throne);
      f.terminal = { ...f.terminal, map: { ...map, questReceipts: receipts } };
    }
    if (fault === 'claimed') {
      const row = map.questProgress[eve]; assert.ok(row);
      f.terminal = { ...f.terminal, map: { ...map, questProgress: { ...map.questProgress,
        [eve]: { ...row, rewardClaimed: false } } } };
    }
    expect(() => audit(f)).toThrow();
  });

it.each(['wrong-index', 'wrong-area', 'wrong-act', 'nonwin', 'new-admission', 'combat-title'] as const)(
  'rejects corrupted Act V settlement context: %s', fault => {
    const f = fixture(), index = f.settlements.findIndex(row => row.act === 5 && row.index === 7);
    const row = f.settlements[index]; assert.ok(row);
    if (fault === 'wrong-index') f.settlements[index] = { ...row, index: 6 };
    if (fault === 'wrong-area') f.settlements[index] = { ...row, area: 'areas/act5-worldstone-keep' };
    if (fault === 'wrong-act') f.settlements[index] = { ...row, act: 4 };
    if (fault === 'nonwin') f.settlements[index] = { ...row, winner: 'enemy', advance: 'defeat' };
    if (fault === 'new-admission') f.settlements[index] = { ...row, ordinal: row.ordinal + 1 };
    if (fault === 'combat-title') {
      const campaign = row.after.campaign; assert.ok(campaign);
      f.settlements[index] = { ...row, after: { ...row.after,
        campaign: { ...campaign, questTitles: { 'titles/slayer_of_baal': true } } } };
    }
    expect(() => audit(f)).toThrow();
  });

it('retains the actual native Claim bundle when the native service throws after commitment', () => {
  const f = fixture(7, false), claim = nativeClaim.claimQuestReward;
  const failure = new Error('Constructed postcommit Eve throw');
  vi.spyOn(nativeClaim, 'claimQuestReward').mockImplementation(id => { expect(claim(id)).toBe('ok'); throw failure; });
  expect(() => { f.actions.claim(eve); }).toThrow(failure); f.terminal = fixtureSave();
  expect(audit(f)).toMatchObject({ throneProofs: 1, baalProofs: 1, exceptions: 1, explicitSkillPoints: 4 });
});

it.each(['receipt-only', 'row-only'] as const)('retains bounded %s Throne publication with unknown native outcome', fault => {
  const f = fixture(4, false), index = f.settlements.length - 1, row = f.settlements[index]; assert.ok(row);
  const after = { ...row.after, ...(fault === 'receipt-only' ? { progress: row.before.progress }
    : { receipts: row.before.receipts }) };
  f.settlements[index] = { ...row, nativeReturned: false, winner: null, heroLife: null, advance: null, after };
  f.terminal = { ...f.terminal, map: { ...f.terminal.map, questProgress: after.progress, questReceipts: after.receipts } };
  expect(audit(f)).toMatchObject({ settlementExceptions: 1, throneProofs: fault === 'receipt-only' ? 1 : 0 });
});

function retryFixture() {
  const f=fixture(),index=f.settlements.findIndex(row=>row.act===5&&row.index===7);
  const baal=f.settlements[index];assert.ok(baal);
  const repeated={...baal,index:4,ordinal:baal.ordinal+1,advance:'next-wave' as const,after:baal.before};
  f.settlements.splice(index,0,repeated);f.settlements[index+1]={...baal,ordinal:repeated.ordinal};
  return {...f,retryIndex:index};
}

it('accepts a verified unchanged Throne retry checkpoint without granting a second proof',()=>{
  const f=retryFixture();expect(audit(f)).toMatchObject({throneProofs:1,baalProofs:1,successfulClaims:11});
});

it.each(['missing','defeat','wrong-area','wrong-index','wrong-ordinal'] as const)('rejects an invalid unchanged Throne retry checkpoint: %s',fault=>{
  const f=retryFixture(),row=f.settlements[f.retryIndex];assert.ok(row);
  if(fault==='missing')f.settlements.splice(f.retryIndex,1);
  if(fault==='defeat')f.settlements[f.retryIndex]={...row,winner:'enemy',advance:'defeat'};
  if(fault==='wrong-area')f.settlements[f.retryIndex]={...row,area:'areas/act5-ancients-way'};
  if(fault==='wrong-index')f.settlements[f.retryIndex]={...row,index:6};
  if(fault==='wrong-ordinal')f.settlements[f.retryIndex]={...row,ordinal:row.ordinal-1};
  expect(()=>audit(f)).toThrow();
 });

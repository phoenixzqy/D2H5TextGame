/** Constructed combat proofs isolate resumed native-action accounting, not earned campaign balance. */
import assert from 'node:assert/strict';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {captureEarnedRestorers, resetEarnedStores} from '../sim/production/earned-state';
import {constructActFourPrefix, fixtureSave} from './act4-fixture';
import {settleConstructedActFiveWave} from './act5-fixture';
import {auditCampaignQuests} from './quest-audit';

const fallen = 'quests/act4-fallen-angel', forge = 'quests/act4-hellforge', terror = 'quests/act4-terrors-end';
let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
});
afterEach(() => {vi.restoreAllMocks(); for (const restore of restores) restore();});

function fixture(act5 = false) {
  const f = constructActFourPrefix();
  f.actions.start(fallen); f.actions.start(forge); f.actions.start(terror);
  // The actual Claim service refuses before proof; the retained action changes no state.
  expect(() => {f.actions.claim(fallen);}).toThrow('not-completed');
  const refusalIndex = f.actions.entries.length - 1;
  const refusal = f.actions.entries[refusalIndex]; assert.ok(refusal);
  expect(refusal.result).toBe('not-completed'); expect(refusal.after).toEqual(refusal.before);
  f.enter(4, 'areas/act4-plains-of-despair'); f.actions.claim(fallen);
  f.enter(4, 'areas/act4-river-of-flame'); f.actions.visit('areas/act4-river-of-flame', 4);
  f.actions.recover(`${forge}#objective:obj-kill-hephasto`); f.actions.execute(`${forge}#action:shatter-soulstone`);
  f.actions.claim(forge); f.actions.visit('areas/act4-chaos-sanctuary', 4);
  for (const index of [1, 2, 3]) f.actions.interact(`objects/diablo_seal_${String(index)}`);
  f.enter(4, 'areas/act4-chaos-sanctuary'); f.actions.claim(terror);
  const act5Start = f.actions.entries.length;
  if (act5) {
    const extended = {...f, act4Entries: f.actions.entries.slice(f.act4Start), act5Start};
    f.actions.start('quests/act5-eve-of-destruction');
    for (let index = 0; index < 8; index++) settleConstructedActFiveWave(extended, index);
    f.actions.claim('quests/act5-eve-of-destruction');
  }
  return {...f, refusalIndex, terminal: fixtureSave(), options: {act3Start: f.act3Start, act4Start: f.act4Start,
    ...(act5 ? {act5Start} : {}), settlements: f.settlements}};
}
const audit = (f: ReturnType<typeof fixture>) =>
  auditCampaignQuests(f.initial, f.terminal, f.actions.entries, f.prefixClaims, f.options);

it('retains the native refusal and audits the same successful route step after a new victory', () => {
  const f = fixture();
  expect(f.actions.entries).toHaveLength(46);
  expect(audit(f)).toMatchObject({resumedRefusals: 1, izualProofs: 1, hephastoProofs: 1,
    diabloProofs: 1, explicitSkillPoints: 4, successfulClaims: 10});
  expect(f.settlements.find(row => row.area === 'areas/act4-plains-of-despair')?.actionIndex).toBe(36);
});

it('uses successful route positions while retaining actual Act V entry and settlement indices', () => {
  const f = fixture(true);
  expect(f.options.act5Start).toBe(46); expect(f.actions.entries).toHaveLength(48);
  expect(audit(f)).toMatchObject({resumedRefusals: 1, izualProofs: 1, throneProofs: 1, baalProofs: 1,
    explicitSkillPoints: 4, successfulClaims: 11});
  expect(f.settlements.filter(row => row.act === 5).map(row => row.actionIndex)).toEqual([47, 47]);
});

it.each(['changed-refusal', 'wrong-step', 'skipped-retry', 'resumed-throw', 'missing-proof', 'wrong-settlement-index',
  'extra-point', 'wrong-act5-boundary'] as const)('rejects invalid resumed history: %s', fault => {
  const f = fixture(true), entry = f.actions.entries[f.refusalIndex]; assert.ok(entry);
  if (fault === 'changed-refusal') {
    const player = entry.after.player; assert.ok(player);
    f.actions.entries[f.refusalIndex] = {...entry, after: {...entry.after, player: {...player, skillPoints: player.skillPoints + 1}}};
  }
  if (fault === 'wrong-step') f.actions.entries[f.refusalIndex] = {...entry, id: forge};
  if (fault === 'skipped-retry') {
    const next = f.actions.entries[f.refusalIndex + 1]; assert.ok(next);
    f.actions.entries[f.refusalIndex + 1] = {...next, id: forge};
  }
  if (fault === 'resumed-throw') f.actions.entries[f.refusalIndex] = {...entry, result: 'threw'};
  const proofIndex = f.settlements.findIndex(row => row.area === 'areas/act4-plains-of-despair');
  const proof = f.settlements[proofIndex]; assert.ok(proof);
  if (fault === 'missing-proof') f.settlements.splice(proofIndex, 1);
  if (fault === 'wrong-settlement-index') f.settlements[proofIndex] = {...proof, actionIndex: proof.actionIndex - 1};
  if (fault === 'extra-point') f.terminal = {...f.terminal, player: {...f.terminal.player, skillPoints: f.terminal.player.skillPoints + 1}};
  if (fault === 'wrong-act5-boundary') {
    assert.ok(f.options.act5Start !== undefined); f.options.act5Start--;
  }
  expect(() => audit(f)).toThrow();
});

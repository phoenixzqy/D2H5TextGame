/** Supplied save authority only; constructed graphs do not establish earned clears. */
import { describe, expect, it } from 'vitest';
import type { CampaignValidationDomain } from './quest-domain';
import { FROZEN_V23 } from './frozen-v23';
import { validateNative24CampaignRewards, validateNative24ReplayFields } from './act5-campaign';
import { validateNative24CurrentCampaignRewards } from './current-campaign';
import { campaignEvidence } from '../../../tests/helpers/endgame';

const domain = { ...FROZEN_V23, selectedDifficulties: ['normal', 'nightmare', 'hell'] };
const area = 'areas/act1-blood-moor', privateArea = 'areas/private-historical';
function map() {
  const { questItems: _items, ...evidence } = campaignEvidence();
  return { currentAct: 5, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [],
    ...evidence, questTitles: {}, questDifficulties: { 'difficulty/nightmare': true as const },
    selectedTitle: null, selectedDifficulty: 'hell', nightmareClearedSubAreas: [],
    hellClearedSubAreas: [], challengeOrdinals: { normal: 1, nightmare: 2, hell: 3 } };
}
const endgame = { attemptOrdinal: 2, clearCounts: { ashen: 1, glacial: 1 }, achievementRewardClaimed: true };
// Reflect passes a future optional argument to the old exports during causal RED.
function replay(input: unknown, authority: CampaignValidationDomain = domain, allowMissing = false) {
  Reflect.apply(validateNative24ReplayFields, undefined, [input, allowMissing, authority]);
}
function campaign(input: unknown, authority: CampaignValidationDomain = domain, services: unknown = {}) {
  Reflect.apply(validateNative24CampaignRewards, undefined, [input, {}, services, authority]);
}
function titled(input: unknown, authority: CampaignValidationDomain = domain, state: unknown = endgame) {
  Reflect.apply(validateNative24CurrentCampaignRewards, undefined, [input, {}, {}, state, authority]);
}
function distinctThrone() {
  const save = map(), proof = `${domain.act5.eveQuest}#action:private-throne`;
  const receipts = { ...save.questReceipts };
  Reflect.deleteProperty(receipts, domain.act5.throneProof);
  Reflect.set(receipts, proof, true);
  return { save: { ...save, questReceipts: receipts }, authority: { ...domain,
    act5: { ...domain.act5, throneProof: proof,
      receipts: domain.act5.receipts.map(id => id === domain.act5.throneProof ? proof : id) } } };
}

describe('native24 supplied replay vocabulary', () => {
  it.each(['nightmareClearedSubAreas', 'hellClearedSubAreas'] as const)(
    'uses supplied historical areas for %s while defaults stay live', field => {
      const authority = { ...domain, nightmareAreaIds: [privateArea] };
      const historical = { ...map(), [field]: [privateArea] }, live = { ...map(), [field]: [area] };
      expect(() => { validateNative24CampaignRewards(historical as Parameters<typeof validateNative24CampaignRewards>[0], {}, {}); }).toThrow();
      expect(() => { campaign(historical, authority); }).not.toThrow();
      expect(() => { validateNative24CampaignRewards(live as Parameters<typeof validateNative24CampaignRewards>[0], {}, {}); }).not.toThrow();
      expect(() => { campaign(live, authority); }).toThrow();
    });
  it.each(['normal', 'nightmare', 'hell'] as const)('uses the exclusive ordinal bound for %s', profile => {
    const authority = { ...domain, challengeOrdinalLimit: 17 };
    expect(() => { replay({ ...map(), challengeOrdinals: { normal: 0, nightmare: 0, hell: 0, [profile]: 16 } }, authority); }).not.toThrow();
    expect(() => { replay({ ...map(), challengeOrdinals: { normal: 0, nightmare: 0, hell: 0, [profile]: 17 } }, authority); }).toThrow();
  });
  it('uses the supplied selected profile vocabulary without dropping ordinal namespaces', () => {
    const authority = { ...domain, selectedDifficulties: ['normal'] };
    expect(() => { replay({ ...map(), selectedDifficulty: 'normal' }, authority); }).not.toThrow();
    expect(() => { replay(map(), authority); }).toThrow();
    expect(() => { replay({ ...map(), selectedDifficulty: 'normal', challengeOrdinals: { normal: 0 } }, authority); }).toThrow();
  });
  it('retains allowMissing and refuses supplied undefined/inherited/accessor fields', () => {
    expect(() => { replay({}, domain, true); }).not.toThrow();
    expect(() => { replay({ selectedDifficulty: undefined }, domain, true); }).toThrow();
    expect(() => { replay(Object.assign(Object.create({ selectedDifficulty: 'normal' }) as object, {}), domain, true); }).toThrow();
    let invoked = false;
    const input = Object.defineProperty({}, 'selectedDifficulty', { enumerable: true, get: () => { invoked = true; return 'normal'; } });
    expect(() => { replay(input, domain, true); }).toThrow(); expect(invoked).toBe(false);
  });
});

describe('native24 supplied source, service and title authority', () => {
  it('uses a distinct supplied throne proof for Hell history, without changing input', () => {
    const { save, authority } = distinctThrone(), before = structuredClone(save);
    expect(() => { campaign(save); }).toThrow();
    expect(() => { campaign(save, authority); }).not.toThrow();
    expect(save).toEqual(before);
  });
  it('passes that same supplied source graph into the nested achievement reader', () => {
    const { save, authority } = distinctThrone();
    const input = { ...save, selectedTitle: authority.achievementTitleId };
    expect(() => { titled(input); }).toThrow();
    expect(() => { titled(input, authority); }).not.toThrow();
    expect(() => { titled(input, authority, { ...endgame, achievementRewardClaimed: false }); }).toThrow();
  });
  it('honors distinct campaign and achievement title identities only when owned', () => {
    const authority = { ...domain, campaignTitleId: 'titles/private-baal', achievementTitleId: 'titles/private-rift' };
    expect(() => { titled({ ...map(), selectedTitle: authority.achievementTitleId }, authority); }).not.toThrow();
    const save = { ...map(), selectedTitle: authority.campaignTitleId,
      questTitles: { [authority.campaignTitleId]: true } };
    expect(() => { titled(save, authority); }).not.toThrow();
    expect(() => { titled({ ...save, questTitles: {} }, authority); }).toThrow();
  });
  it('uses the supplied claimed service definition and its actual prerequisite', () => {
    const id = 'quests/private-service', source = `${id}#reward:service`;
    const quest = { id, name: 'Private service', type: 'side' as const, actId: 'acts/act5', giver: 'npc/larzuk',
      description: 'Private compatibility fixture', objectives: [{ id: 'obj-done', type: 'talk' as const,
        npcId: 'npc/larzuk', description: 'Talk' }], rewards: { service: 'socket_item' } };
    const authority = { ...domain, quests: [...domain.quests, quest],
      serviceSources: { ...domain.serviceSources, [source]: 'socket_item' as const },
      servicePrerequisites: { ...domain.servicePrerequisites, [id]: domain.act5.eveQuest } };
    const save = { ...map(), questProgress: { ...map().questProgress,
      [id]: { id, status: 'completed', rewardClaimed: true, objectives: { 'obj-done': true } } } };
    const services = { [source]: { serviceId: 'socket_item', state: 'available' } };
    expect(() => { campaign(save, domain, services); }).toThrow();
    expect(() => { campaign(save, authority, services); }).not.toThrow();
    expect(() => { campaign(save, { ...authority,
      servicePrerequisites: { ...authority.servicePrerequisites, [id]: authority.act5.prisonQuest } }, services); }).toThrow();
    const changed = { ...authority, quests: authority.quests.map(row => row.id === id
      ? { ...row, objectives: [...row.objectives, { id: 'obj-future', type: 'talk' as const,
        npcId: 'npc/larzuk', description: 'Future' }] } : row) };
    expect(() => { campaign(save, changed, services); }).toThrow();
  });
});

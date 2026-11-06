/** Constructed provenance cases exercise candidate classification, never earned balance acceptance. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { useHydrationStore } from '@/stores/hydrationStore';
import { snapshotStores } from '@/stores/persistence';
import type { SaveCurrent } from '@/engine/types/save';
import { loadQuests } from '@/data/loaders/quests';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { decodeObservation, encodeObservation, hashObservation } from '../sim/contracts/observation-codec';
import { createCampaignFirstEntries } from './first-entry';
import { intendedCampaignProfiles } from './intended-profiles';
import policy from './first-entry-policy-v1.json';

type Prefix = Parameters<ReturnType<typeof createCampaignFirstEntries>['capture']>[1];
const questId = 'quests/act1-sisters-to-the-slaughter', area = 'areas/act1-catacombs';
let restores: (() => void)[], created: SaveCurrent;
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('First entry QA', 'sorceress').ok).toBe(true);
  const snapshot = snapshotStores(); assert.ok(snapshot); created = structuredClone(snapshot);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

function prefix(): Prefix {
  return { created, profileId: 'sorceress-cold-intended-v1',
    profile: intendedCampaignProfiles['sorceress-cold-intended-v1'],
    configuration: { execution: 'screen' }, admissions: [], waves: [], unobservedWaves: [], rewards: [] };
}
function checkpoint(ordinal = 0, patch: Partial<SaveCurrent['map']> = {}) {
  const snapshot: SaveCurrent = { ...created, map: { ...created.map,
    questProgress: { [questId]: { id: questId, status: 'inProgress', objectives: {} } },
    challengeOrdinals: { normal: ordinal, nightmare: 0, hell: 0 }, ...patch } };
  return { kind: 'campaign-boss-checkpoint' as const, boundary: 'before-admission' as const,
    act: 1, area, questId, snapshot, exported: JSON.stringify(snapshot) };
}
function history(ms: number, outcome: 'victory' | 'draw' = 'victory'): Prefix {
  return { ...prefix(), admissions: [{ ordinal: 0, area: 'areas/act1-den-of-evil', phase: 'farm', totalWaves: 1 }],
    waves: [{ ordinal: 0, area: 'areas/act1-den-of-evil', phase: 'farm', index: 0,
      outcome, advance: outcome === 'victory' ? 'victory' : 'defeat', logicalMs: ms,
      xp: 0, items: 0, heroLife: 1, heroMana: 1 }] };
}

it('retains the original costly first entry when a cheaper retry or pre-Claim checkpoint follows', () => {
  const records: Readonly<Record<string, unknown>>[] = [], collector = createCampaignFirstEntries(row => { records.push(row); });
  const first = checkpoint(1), input = history(22_500_001, 'draw');
  const entry = collector.capture(first, input, 'farm'); assert.ok(entry);
  expect(entry.disposition).toBe('review');
  expect(entry.reasons).toEqual(['completion-time-ceiling-exceeded']);
  expect(entry.costs).toMatchObject({ admissions: 1, combatMs: 22_500_001, farmMs: 22_500_001,
    nonwinMs: 22_500_001, nonwins: 1, complete: true, decisionAdjustedMs: null });
  expect(entry.saveSha256).toBe(createHash('sha256').update(first.exported).digest('hex'));
  const retained = structuredClone(entry);
  expect(collector.capture(checkpoint(), prefix(), 'route')).toBeUndefined();
  expect(collector.capture({ ...first, boundary: 'before-claim' }, prefix(), 'route')).toBeUndefined();
  expect(collector.entries).toEqual([retained]); expect(records).toEqual([retained]);
});

it('binds configuration and accepts an earned prefix at the ceiling without accepting balance', () => {
  const configuration = { execution: 'screen' }, input = { ...history(22_500_000), configuration };
  const collector = createCampaignFirstEntries(() => undefined);
  const entry = collector.capture(checkpoint(1), input, 'route'); assert.ok(entry);
  expect(entry.disposition).toBe('candidate'); expect(entry.reasons).toEqual([]);
  expect(entry.costs.economyAudit).toEqual({ xp: 0, addedItems: 0 });
  expect(entry.configurationSha256).toBe(hashObservation(entry.configuration));
  configuration.execution = 'changed-after-recording';
  expect(entry.configuration.configuration.execution).toBe('screen');
  expect(entry.limitation).toContain('do not prove');
});

it('preserves reproducible metadata hashes through lossless journal serialization', () => {
  const input = { ...prefix(), configuration: { z: 1, a: 2, optional: undefined } };
  const entry = createCampaignFirstEntries(() => undefined).capture(checkpoint(), input, 'route');
  assert.ok(entry);
  const persisted = decodeObservation(JSON.parse(JSON.stringify(encodeObservation({ entry, input })))) as {
    entry: typeof entry; input: Prefix;
  };
  expect(persisted.entry.metadataHashFormat).toBe('observation-json-v1');
  expect.soft(persisted.entry.configurationSha256).toBe(hashObservation(persisted.entry.configuration));
  expect.soft(persisted.entry.initialSaveSha256).toBe(hashObservation(persisted.input.created));
  expect.soft(persisted.entry.policySha256).toBe(hashObservation(policy));
  expect.soft(persisted.entry.prefixSha256).toBe(hashObservation({ admissions: persisted.input.admissions,
    waves: persisted.input.waves, unobservedWaves: persisted.input.unobservedWaves, rewards: persisted.input.rewards }));
  expect(Object.hasOwn(persisted.entry.configuration.configuration, 'optional')).toBe(true);
});

it.each([
  { name: 'missing admission', reason: 'incomplete-acquisition-history',
    input: () => [checkpoint(1), prefix()] as const },
  { name: 'missing settled wave', reason: 'incomplete-acquisition-history',
    input: () => [checkpoint(1), { ...history(1), waves: [] }] as const },
  { name: 'wave index gap', reason: 'incomplete-acquisition-history',
    input: () => [checkpoint(1), { ...history(1), waves: history(1).waves.map(row => ({ ...row, index: 1 })) }] as const },
  { name: 'unfinished admission', reason: 'incomplete-acquisition-history', input: () => [checkpoint(1), {
    ...history(1), waves: history(1).waves.map(row => ({ ...row, advance: 'next-wave' as const })),
    admissions: history(1).admissions.map(row => ({ ...row, totalWaves: 2 })) }] as const },
  { name: 'unobserved outcome with known time', reason: 'incomplete-acquisition-history',
    input: () => [checkpoint(1), { ...history(1), waves: [], unobservedWaves: history(1).waves }] as const },
  { name: 'boss victory while Claim is pending', reason: 'prior-boss-victory', input: () => [checkpoint(0, {
    questProgress: { [questId]: { id: questId, status: 'inProgress', objectives: { 'obj-kill-andariel': true } } }
  }), prefix()] as const },
  { name: 'legacy cleared-area alias', reason: 'prior-boss-victory',
    input: () => [checkpoint(0, { clearedSubAreas: ['a1-catacombs'] }), prefix()] as const },
  { name: 'future-act clear', reason: 'future-act-progress',
    input: () => [checkpoint(0, { clearedSubAreas: ['areas/act2-far-oasis'] }), prefix()] as const },
  { name: 'future-act receipt', reason: 'future-act-progress', input: () => [checkpoint(0, {
    questReceipts: { 'quests/act2-radaments-lair#read:questItem': true } }), prefix()] as const },
  { name: 'replay history', reason: 'non-normal-history', input: () => [checkpoint(0, {
    challengeOrdinals: { normal: 0, nightmare: 1, hell: 0 } }), prefix()] as const },
  { name: 'historical profile', reason: 'historical-or-modified-profile',
    input: () => [checkpoint(), { ...prefix(), profileId: 'sorceress-cold' }] as const },
  { name: 'modified intended profile', reason: 'historical-or-modified-profile', input: () => [checkpoint(), {
    ...prefix(), profile: { ...prefix().profile, priority: [] } }] as const },
  { name: 'wrong class', reason: 'class-mismatch', input: () => { const cp = checkpoint();
    return [{ ...cp, snapshot: { ...cp.snapshot, player: { ...cp.snapshot.player, class: 'amazon' as const } } }, prefix()] as const; } },
  { name: 'unearned material', reason: 'unreconciled-earned-state', input: () => { const cp = checkpoint();
    return [{ ...cp, snapshot: { ...cp.snapshot, inventory: { ...cp.snapshot.inventory,
      materials: { 'materials/scrap': 1 } } } }, prefix()] as const; } },
  { name: 'nonfresh origin', reason: 'non-fresh-origin', input: () => [checkpoint(), {
    ...prefix(), created: { ...created, map: { ...created.map, clearedSubAreas: [area] } } }] as const },
  { name: 'earlier failed boss admission', reason: 'prior-boss-admission', input: () => [checkpoint(1), {
    ...history(1, 'draw'), admissions: history(1).admissions.map(row => ({ ...row, area })),
    waves: history(1, 'draw').waves.map(row => ({ ...row, area })) }] as const },
  { name: 'malformed native export', reason: 'unbound-native-save',
    input: () => [{ ...checkpoint(), exported: '{' }, prefix()] as const },
  { name: 'wrong act ceiling for the boss', reason: 'mismatched-boss-identity',
    input: () => [{ ...checkpoint(), act: 5 }, prefix()] as const },
  { name: 'unmeasured combat time', reason: 'incomplete-acquisition-history', input: () => [checkpoint(1), {
    ...history(1), waves: [], unobservedWaves: history(1).waves.map(row => ({ ...row, logicalMs: null })) }] as const },
  { name: 'boss quest not started', reason: 'boss-quest-not-active',
    input: () => [checkpoint(0, { questProgress: {} }), prefix()] as const }
])('marks $name for review without changing the source state', ({ input, reason }) => {
  const [cp, data] = input(), before = structuredClone({ cp, data });
  const entry = createCampaignFirstEntries(() => undefined).capture(cp, data, 'route'); assert.ok(entry);
  expect(entry.disposition).toBe('review'); expect(entry.reasons).toContain(reason);
  expect({ cp, data }).toEqual(before);
});

it('counts only the played wave of a recorded flee and preserves its spent combat time', () => {
  const data = history(1234), cp = checkpoint(1);
  const entry = createCampaignFirstEntries(() => undefined).capture(cp, { ...data,
    waves: data.waves.map(row => ({ ...row, advance: 'next-wave' })),
    admissions: data.admissions.map(row => ({ ...row, totalWaves: 2, abandonedAfterIndex: 0 })) }, 'route');
  expect(entry).toMatchObject({ disposition: 'candidate', costs: { combatMs: 1234, complete: true, playedWaves: 1 } });
});

it('retains a separate first entry for every authored chapter boss', () => {
  const collector = createCampaignFirstEntries(() => undefined);
  const bosses = loadQuests().filter(quest => quest.type === 'main' && quest.unlocks &&
    quest.objectives.some(objective => objective.type === 'kill-boss'));
  expect(bosses).toHaveLength(5);
  for (const quest of bosses) {
    const boss = quest.objectives.find(objective => objective.type === 'kill-boss');
    assert.ok(boss && typeof boss.areaId === 'string');
    const cp = { ...checkpoint(), act: Number(quest.actId.replace('acts/act', '')), questId: quest.id, area: boss.areaId };
    collector.capture(cp, prefix(), 'route'); collector.capture(cp, history(5000), 'route');
  }
  expect(collector.entries.map(entry => entry.questId)).toEqual(bosses.map(quest => quest.id));
  expect(collector.entries.every(entry => entry.costs.admissions === 0)).toBe(true);
});

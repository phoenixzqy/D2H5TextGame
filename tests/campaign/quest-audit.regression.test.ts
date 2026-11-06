/** Constructed native quest/XP observations prove accounting, never earned campaign viability. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { useHydrationStore } from '@/stores/hydrationStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { snapshotStores } from '@/stores/persistence';
import { xpTotal } from '@/engine/progression/xp';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { claimCampaignQuest, growCampaignBuild } from './actions';
import { createCampaignQuestActions } from './quest-actions';
import { runActTwo } from './act2-route';
import { campaignProfiles } from './profiles';
import { auditCampaignQuests } from './quest-audit';

let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('Quest audit', 'sorceress').ok).toBe(true);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });
function save() { const current = snapshotStores(); assert.ok(current); return current; }
function fixture(stop?: string, failNative = false) {
  const initial = save(), claims: string[] = [];
  const den = 'quests/act1-den-of-evil';
  useMapStore.getState().updateQuestProgress(den, { status: 'completed',
    objectives: { 'obj-clear-den': true, 'obj-return': true } });
  claimCampaignQuest(den, () => { claims.push(den); }, () => undefined);
  useMapStore.getState().markCleared('areas/act1-catacombs');
  const actions = createCampaignQuestActions(entry => {
    if (failNative && entry.action === 'recover' && entry.id === 'quests/act2-horadric-staff#objective:obj-shaft') {
      // Native XP succeeds, then book publication and hero restoration fail independently.
      vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(() => { throw new Error('Ledger publication'); });
      vi.spyOn(usePlayerStore, 'setState').mockImplementationOnce(() => { throw new Error('Hero restoration'); });
    }
    if (entry.action === 'claim' && entry.id === stop) throw new Error('Constructed recorder stop');
  }, () => undefined);
  const run = () => { runActTwo(campaignProfiles['sorceress-cold'], () => undefined, area => {
    const map = useMapStore.getState(); map.setCurrentLocation(2, area);
    if (area.endsWith('far-oasis')) map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
      archetypeIds: ['monsters/act2.radament'] });
    else if (area.endsWith('arcane-sanctuary')) map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
      archetypeIds: ['monsters/act2.the-summoner'] });
    else map.recordBossKill({ actId: 'acts/act2', areaId: area, bossArchetypeId: 'monsters/act2.duriel' });
    map.markCleared(area);
  }, actions); };
  if (failNative) expect(run).toThrow(AggregateError);
  else if (stop) expect(run).toThrow('Constructed recorder stop'); else run();
  return { initial, terminal: save(), actions, claims };
}

it('reconciles all five tools, XP-derived points, Den, separate Read and explicit Arcane grants', () => {
  const f = fixture();
  expect(auditCampaignQuests(f.initial, f.terminal, f.actions.entries, f.claims)).toMatchObject({
    successfulClaims: 5, reads: 1, explicitSkillPoints: 3, explicitStatPoints: 0,
    resistance: { fire: 30, cold: 30 }
  });
});
it('reconciles a partial route stopped by a logger after actual Sun Claim, including spent native points', () => {
  const f = fixture('quests/act2-tainted-sun');
  expect(auditCampaignQuests(f.initial, f.terminal, f.actions.entries, f.claims)).toMatchObject({
    successfulClaims: 2, reads: 1, explicitSkillPoints: 2, resistance: { fire: 30, cold: 30 }
  });
});
it('accepts native allocations after the final recorded world action without treating them as grants', () => {
  const f = fixture();
  growCampaignBuild(campaignProfiles['sorceress-cold'], () => undefined);
  expect(() => auditCampaignQuests(f.initial, save(), f.actions.entries, f.claims)).not.toThrow();
});
it.each(['skill', 'stat', 'source', 'receipt'] as const)('rejects unaccounted terminal %s mutation', fault => {
  const f = fixture();
  const terminal = fault === 'skill' ? { ...f.terminal, player: { ...f.terminal.player,
    skillPoints: f.terminal.player.skillPoints + 1 } }
    : fault === 'stat' ? { ...f.terminal, player: { ...f.terminal.player, coreStats: {
      ...f.terminal.player.coreStats, energy: f.terminal.player.coreStats.energy + 1 } } }
    : fault === 'source' ? { ...f.terminal, inventory: { ...f.terminal.inventory, questItems: {} } }
    : { ...f.terminal, map: { ...f.terminal.map, questReceipts: { ...f.terminal.map.questReceipts,
      'act2/fabricated': true as const } } };
  expect(() => auditCampaignQuests(f.initial, terminal, f.actions.entries, f.claims)).toThrow();
});
it('rejects reordered or missing source transitions and unearned prefix point declarations', () => {
  const f = fixture(), entries = [...f.actions.entries];
  const first = entries[5], second = entries[6]; assert.ok(first && second);
  entries[5] = second; entries[6] = first;
  expect(() => auditCampaignQuests(f.initial, f.terminal, entries, f.claims)).toThrow();
  expect(() => auditCampaignQuests(f.initial, f.terminal, f.actions.entries.slice(1), f.claims)).toThrow();
  expect(() => auditCampaignQuests(f.initial, f.terminal, f.actions.entries, [...f.claims, 'quests/act1-den-of-evil']))
    .toThrow();
});
it('reconciles no suffix when a prefix grants only XP and spends its actual point pool', () => {
  const initial = save(); usePlayerStore.getState().gainExperience(8000);
  growCampaignBuild(campaignProfiles['sorceress-cold'], () => undefined);
  expect(auditCampaignQuests(initial, save(), [], [])).toMatchObject({
    successfulClaims: 0, reads: 0, explicitSkillPoints: 0, resistance: { fire: 0, cold: 0 }
  });
});
it('counts the native L12 bonus separately from its eleven level-up skill points', () => {
  const initial = save(); usePlayerStore.getState().gainExperience(xpTotal(12));
  growCampaignBuild(campaignProfiles['sorceress-cold'], () => undefined);
  expect(auditCampaignQuests(initial, save(), [], [])).toMatchObject({
    xpSkillPoints: 12, xpStatPoints: 55, explicitSkillPoints: 0, explicitStatPoints: 0
  });
});
it('reconciles actual residual XP and its level grants after native Claim restoration fails', () => {
  const f = fixture(undefined, true);
  expect(f.actions.entries.at(-1)).toMatchObject({ action: 'claim', result: 'threw', delta: { xp: 5000 } });
  expect(auditCampaignQuests(f.initial, f.terminal, f.actions.entries, f.claims)).toMatchObject({
    exceptions: 1, successfulClaims: 0, reads: 0, explicitSkillPoints: 1,
    resistance: { fire: 0, cold: 0 }
  });
});

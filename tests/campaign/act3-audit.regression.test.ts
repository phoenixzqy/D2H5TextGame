/** Constructed maps/settlements isolate accounting; none is earned campaign evidence. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { snapshotStores } from '@/stores/persistence';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { createCampaignQuestActions } from './quest-actions';
import { runActTwo } from './act2-route';
import { campaignProfiles } from './profiles';
import { auditCampaignQuests } from './quest-audit';
import type { CampaignQuestSettlement } from './quest-settlement';

let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('Act3 audit', 'sorceress').ok).toBe(true);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });
const khalim = 'quests/act3-khalims-will', guardian = 'quests/act3-guardian';
const cube = 'quests/act2-horadric-staff#objective:obj-cube';
const will = `${khalim}#objective:obj-transmute`;
const council = `${khalim}#action:council-victory`, orb = `${guardian}#action:break-compelling-orb`;
const travincal = 'areas/act3-travincal', durance = 'areas/act3-durance-of-hate';
const save = () => { const current = snapshotStores(); assert.ok(current); return current; };
const graph = () => structuredClone({ items: useInventoryStore.getState().questItems,
  progress: useMapStore.getState().questProgress, receipts: useMapStore.getState().questReceipts });

function fixture(stop: 'council' | 'assembly' | 'orb' | 'claim' = 'claim') {
  const initial = save(), actions = createCampaignQuestActions(() => undefined, () => undefined);
  // Disclosed constructed Act I clear and Act II encounters; Claims/item operations are native.
  useMapStore.getState().markCleared('areas/act1-catacombs');
  runActTwo(campaignProfiles['sorceress-cold'], () => undefined, area => {
    const map = useMapStore.getState(); map.setCurrentLocation(2, area);
    if (area.endsWith('far-oasis')) map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
      archetypeIds: ['monsters/act2.radament'] });
    else if (area.endsWith('arcane-sanctuary')) map.recordMonsterKills({ actId: 'acts/act2', areaId: area,
      archetypeIds: ['monsters/act2.the-summoner'] });
    else map.recordBossKill({ actId: 'acts/act2', areaId: area, bossArchetypeId: 'monsters/act2.duriel' });
    map.markCleared(area);
  }, actions);
  const act3Start = actions.entries.length, settlements: CampaignQuestSettlement[] = [];
  const result = () => ({ initial, terminal: save(), actions,
    options: { act3Start, settlements }, settlements });
  actions.start(khalim); actions.start(guardian);
  for (const [part, area] of [['brain', 'great-marsh'], ['heart', 'flayer-jungle'], ['eye', 'kurast-bazaar']]) {
    const id = `areas/act3-${String(area)}`;
    useMapStore.getState().setCurrentLocation(3, id); useMapStore.getState().markCleared(id);
    actions.recover(`${khalim}#objective:obj-${String(part)}`);
  }
  const constructedSettlement = (area: string, publish: () => void) => {
    const before = graph(); publish();
    settlements.push({ act: 3, area, ordinal: area === travincal ? 6 : 7, index: 4,
      actionIndex: actions.entries.length, nativeReturned: true, winner: 'player', heroLife: 1,
      advance: 'victory', before, after: graph() });
  };
  useMapStore.getState().setCurrentLocation(3, travincal);
  constructedSettlement(travincal, () => {
    useMapStore.getState().markCleared(travincal);
    useMapStore.setState({ questReceipts: { [council]: true } });
  });
  if (stop === 'council') return result();
  actions.recover(`${khalim}#objective:obj-flail`); actions.assemble(will);
  if (stop === 'assembly') return result();
  actions.claim(khalim); actions.visit(travincal, 3); actions.execute(orb);
  if (stop === 'orb') return result();
  useMapStore.getState().setCurrentLocation(3, durance);
  constructedSettlement(durance, () => {
    useMapStore.getState().markCleared(durance);
    useMapStore.getState().updateQuestProgress(guardian, { status: 'completed',
      objectives: { 'obj-kill-mephisto': true } });
  });
  actions.claim(guardian); return result();
}
const audit = (f: ReturnType<typeof fixture>) =>
  auditCampaignQuests(f.initial, f.terminal, f.actions.entries, [], f.options);

it.each(['council', 'assembly', 'orb', 'claim'] as const)('reconciles the actual constructed partial %s graph', stop => {
  const f = fixture(stop);
  expect(audit(f)).toMatchObject({ successfulClaims: stop === 'claim' ? 7 : stop === 'orb' ? 6 : 5,
    reads: 1, explicitSkillPoints: 2, explicitStatPoints: 0, resistance: { fire: 30, cold: 30 },
    councilProofs: 1, guardianCompletions: stop === 'claim' ? 1 : 0 });
});

it('retains a thrown-helper residual Council publication without qualifying a successful settlement', () => {
  const f = fixture('council'), event = f.settlements[0]; assert.ok(event);
  f.settlements[0] = { ...event, nativeReturned: false, winner: null, heroLife: null, advance: null };
  expect(audit(f)).toMatchObject({ councilProofs: 1, settlementExceptions: 1, successfulClaims: 5 });
});

it.each(['missing-council', 'wrong-area', 'late-proof', 'combat-item', 'missing-guardian', 'nonwin-proof'] as const)(
  'rejects invalid constructed settlement evidence: %s', fault => {
    const f = fixture(), event = f.settlements[0]; assert.ok(event);
    if (fault === 'missing-council') f.settlements.shift();
    if (fault === 'wrong-area') f.settlements[0] = { ...event, area: durance };
    if (fault === 'late-proof') f.settlements[0] = { ...event, actionIndex: event.actionIndex + 1 };
    if (fault === 'combat-item') f.settlements[0] = { ...event, after: { ...event.after,
      items: { ...event.after.items, [cube]: { itemId: 'quest/horadric_cube', state: 'consumed' } } } };
    if (fault === 'missing-guardian') f.settlements.pop();
    if (fault === 'nonwin-proof') f.settlements[0] = { ...event, winner: 'enemy', advance: 'defeat' };
    expect(() => audit(f)).toThrow();
  });

it.each(['point', 'source', 'receipt'] as const)('rejects unaccounted terminal Act III %s changes', fault => {
  const f = fixture();
  if (fault === 'point') f.terminal = { ...f.terminal,
    player: { ...f.terminal.player, skillPoints: f.terminal.player.skillPoints + 1 } };
  if (fault === 'source') {
    const questItems = { ...f.terminal.inventory.questItems }; Reflect.deleteProperty(questItems, will);
    f.terminal = { ...f.terminal, inventory: { ...f.terminal.inventory, questItems } };
  }
  if (fault === 'receipt') f.terminal = { ...f.terminal,
    map: { ...f.terminal.map, questReceipts: { [orb]: true } } };
  expect(() => audit(f)).toThrow();
});

it.each(['receipt', 'guardian', 'source'] as const)('rejects unrelated %s publications attributed to a thrown Orb action', fault => {
  const f = fixture('orb'), last = f.actions.entries.at(-1); assert.ok(last);
  const after = structuredClone(last.after);
  if (fault === 'receipt') after.receipts = { ...after.receipts, 'quests/act3-unrelated#action:wrong': true };
  if (fault === 'guardian') {
    const row = after.progress[guardian]; assert.ok(row);
    row.status = 'completed'; row.objectives['obj-kill-mephisto'] = true;
  }
  if (fault === 'source') after.items = { ...after.items, [cube]: { itemId: 'quest/horadric_cube', state: 'consumed' } };
  f.actions.entries[f.actions.entries.length - 1] = { ...last, result: 'threw', after };
  f.terminal = { ...f.terminal, inventory: { ...f.terminal.inventory, questItems: after.items },
    map: { ...f.terminal.map, questProgress: after.progress, questReceipts: after.receipts } };
  expect(() => audit(f)).toThrow();
});

it('rejects combat continuation after a thrown final explicit action', () => {
  const f = fixture('council'), last = f.actions.entries.at(-1); assert.ok(last);
  f.actions.entries[f.actions.entries.length - 1] = { ...last, result: 'threw' };
  expect(() => audit(f)).toThrow();
});

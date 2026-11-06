/** Constructed initial overflow isolates policy; native first-wave rewards are real, not fresh viability. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as creation from '@/features/character/createCharacter';
import { useInventoryStore } from '@/stores/inventoryStore';
import { BACKPACK_CAPACITY } from '@/stores/inventoryCapacity';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import { campaignInventoryPolicy } from './inventory-policy';
import { runCampaign } from './native-runner';
import * as actOne from './route';

let restores: (() => void)[];
beforeEach(() => { restores = captureEarnedRestorers(); resetEarnedStores(); });
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

it('retains the existing salvage default and accepts only the declared retention diagnostic', () => {
  expect(campaignInventoryPolicy()).toBe('salvage-overflow-normals-v1');
  expect(campaignInventoryPolicy('salvage-overflow-normals-v1')).toBe('salvage-overflow-normals-v1');
  expect(campaignInventoryPolicy('retain-earned-overflow-v1')).toBe('retain-earned-overflow-v1');
  for (const value of ['', 'retain', 'constructor', 'salvage-overflow-normals-v2'])
    expect(() => campaignInventoryPolicy(value)).toThrow('Invalid campaign inventory policy');
});

it('rejects an invalid policy before creation and preserves the surrounding realm', () => {
  const create = vi.spyOn(creation, 'createCharacter'), before = observeEarnedState();
  expect(() => runCampaign('intro', 'sorceress-cold-nova-focus', () => undefined,
    'none', undefined, 'level-training-v1', 'invalid')).toThrow('Invalid campaign inventory policy');
  expect(create).not.toHaveBeenCalled(); expect(observeEarnedState()).toEqual(before);
});

it('conserves retained initial overflow and default native salvage with equal first-wave income', () => {
  const original = creation.createCharacter;
  const fixtureCount = BACKPACK_CAPACITY + 1;
  vi.spyOn(creation, 'createCharacter').mockImplementation((name, classId) => {
    const result = original(name, classId);
    if (result.ok) for (let index = 0; index < fixtureCount; index++) useInventoryStore.getState().addItem({
      id: `constructed-overflow-${String(index)}`, baseId: 'items/base/helm-cap', rarity: 'normal',
      level: 1, ilvl: 1, identified: true, equipped: false, socketCapacity: 0 });
    return result;
  });
  const before = observeEarnedState(), now = Date.now;
  const reports = [undefined, 'retain-earned-overflow-v1'].map(policy => {
    const records: Readonly<Record<string, unknown>>[] = [];
    const report = runCampaign('intro', 'sorceress-cold-nova-focus', row => { records.push(row); },
      'none', undefined, 'level-training-v1', policy);
    expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
    expect(report.waves[0]).toMatchObject({ outcome: 'victory' });
    expect(report.totals.earnings.waves.xp).toBeGreaterThan(0);
    expect(report.exported).not.toBeNull(); expect(report.economyAudit).not.toBeNull();
    expect(records.find(row => row.kind === 'created')).toMatchObject({ inventoryPolicy: report.inventoryPolicy });
    const owned = report.successor?.inventory.backpack ?? [];
    expect(owned.filter(item => item.id.startsWith('constructed-overflow-'))).toHaveLength(policy ? fixtureCount : 0);
    expect(records.filter(row => row.kind === 'campaign-inventory-sink')).toHaveLength(policy ? 0 : 1);
    expect(report.economyAudit?.removedItems ?? 0).toBe(policy ? 0 : fixtureCount);
    expect(observeEarnedState()).toEqual(before); expect(Date.now).toBe(now);
    return report;
  });
  expect(reports[0]?.totals.earnings).toEqual(reports[1]?.totals.earnings);
  expect(reports[0]?.waves).toEqual(reports[1]?.waves);
  expect(reports[0]?.gameplayStatus).toBe(reports[1]?.gameplayStatus);
});

it('offers newly settled loot to the equipment boundary before the next admission salvages leftovers', () => {
  const original = creation.createCharacter, fixtureCount = BACKPACK_CAPACITY - 3;
  vi.spyOn(creation, 'createCharacter').mockImplementation((name, classId) => {
    const result = original(name, classId);
    if (result.ok) for (let index = 0; index < fixtureCount; index++) useInventoryStore.getState().addItem({
      id: `constructed-boundary-${String(index)}`, baseId: 'items/base/helm-cap', rarity: 'normal',
      level: 1, ilvl: 1, identified: true, equipped: false, socketCapacity: 0 });
    return result;
  });
  let availableAtBoundary = 0, expectedRemoved = 0, secondAdmission = false;
  vi.spyOn(actOne, 'runActOne').mockImplementation((_profile, _record, enter) => {
    enter('areas/act1-blood-moor', 'farm', true);
    const inventory = useInventoryStore.getState();
    availableAtBoundary = inventory.backpack.filter(item => item.id.startsWith('constructed-boundary-')).length;
    const candidate = inventory.backpack.find(item => item.id === 'constructed-boundary-0');
    if (!candidate) throw new Error('Loot was salvaged before the equipment boundary');
    expectedRemoved = inventory.backpack.filter(item => item.rarity === 'normal' && item.id !== candidate.id).length;
    expect(inventory.equipItem(candidate, 'head')).toEqual({ ok: true });
    enter('areas/act1-blood-moor', 'farm', true); secondAdmission = true;
  });
  const before = observeEarnedState(), now = Date.now;
  const report = runCampaign('act1', 'sorceress-cold-nova-focus', () => undefined);
  expect(availableAtBoundary).toBe(fixtureCount);
  expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
  expect(secondAdmission).toBe(true);
  expect(report.successor?.inventory.equipped.head?.id).toBe('constructed-boundary-0');
  expect(report.economyAudit?.removedItems).toBe(expectedRemoved);
  expect(report.successor?.inventory.backpack.filter(item => item.id.startsWith('constructed-boundary-'))).toEqual([]);
  expect(report.exported).not.toBeNull(); expect(report.admissions).toBe(2);
  expect(observeEarnedState()).toEqual(before); expect(Date.now).toBe(now);
});

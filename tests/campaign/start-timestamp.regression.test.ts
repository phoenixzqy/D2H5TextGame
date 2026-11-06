/** Transport checks only; two opening admissions are not campaign balance acceptance. */
import assert from 'node:assert/strict';
import { expect, it } from 'vitest';
import { observeEarnedState } from '../sim/production/earned-state';
import { runCampaign } from './native-runner';
import { campaignCreationTimestamp } from './online-clock';

it('preserves the historical default and rejects invalid timestamps before touching stores', () => {
  expect(campaignCreationTimestamp()).toBe(1793304000000);
  expect(campaignCreationTimestamp(1793304001000)).toBe(1793304001000);
  const before = observeEarnedState(), now = Date.now;
  for (const timestamp of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    expect(() => runCampaign('intro', 'amazon-javelin-poison2-impale1', () => undefined,
      'none', 'minimum', 'screen', 'salvage-overflow-normals-v1', timestamp)).toThrow('timestamp');
    expect(Date.now).toBe(now);
    expect(observeEarnedState()).toEqual(before);
  }
});

it('retains explicit creation times and obtains different native admission streams on fresh saves', () => {
  const outside = observeEarnedState(), now = Date.now;
  const seeds: unknown[] = [];
  for (const creationTimestamp of [1793304001000, 1793304002000]) {
    const records: Readonly<Record<string, unknown>>[] = [];
    const report = runCampaign('intro', 'amazon-javelin-poison2-impale1', row => { records.push(row); },
      'none', 'minimum', 'screen', 'salvage-overflow-normals-v1', creationTimestamp);
    expect(report.technicalStatus, report.failure ?? undefined).toBe('completed');
    expect(report.creationTimestamp).toBe(creationTimestamp);
    expect(report.admissions).toBe(1);
    expect(report.waves.length).toBeGreaterThan(0);
    const created = records.find(row => row.kind === 'created'); assert.ok(created);
    expect(created.creationTimestamp).toBe(creationTimestamp);
    const snapshot = created.snapshot as { timestamp: number; player: { level: number; experience: number };
      map: { challengeOrdinals: { normal: number } }; inventory: { backpack: unknown[]; stash: unknown[] } };
    expect(snapshot.timestamp).toBe(creationTimestamp);
    expect(snapshot.player).toMatchObject({ level: 1, experience: 0 });
    expect(snapshot.map.challengeOrdinals.normal).toBe(0);
    expect(snapshot.inventory.backpack).toEqual([]);
    expect(snapshot.inventory.stash).toEqual([]);
    const entry = records.find(row => row.kind === 'admission'); assert.ok(entry);
    const handle = entry.handle as { challengeOrdinal: number; runSeed: number };
    expect(handle.challengeOrdinal).toBe(0);
    expect(entry.startedAt).toBe(creationTimestamp);
    seeds.push(handle.runSeed);
    expect(Date.now).toBe(now);
    expect(observeEarnedState()).toEqual(outside);
  }
  expect(new Set(seeds).size).toBe(2);
});

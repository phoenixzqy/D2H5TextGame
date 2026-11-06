/** Diagnostic recorder failures must not erase independent native settlement audits. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { decodeObservation, encodeObservation } from '../sim/contracts/observation-codec';
import { openCampaignJournal } from './journal';
import { runCampaign } from './native-runner';
import { createCharacter } from '@/features/character/createCharacter';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import { snapshotStores } from '@/stores/persistence';
import { claimCampaignQuest } from './actions';
import { canClaim } from '@/features/quests/claimReward';
import { auditCampaignEconomy, campaignEconomy } from './economy';
import type { CampaignReward } from './economy';

// Node's native namespace is immutable; retain real I/O with replaceable boundary functions.
vi.mock('node:fs', async importOriginal => ({ ...await importOriginal<typeof import('node:fs')>() }));

it.each(['staged-wave', 'settled-wave'])('audits real earned rewards when %s and checkpoint recording fail', trigger => {
  let staged = 0, failed = false, checkpointAttempts = 0;
  const report = runCampaign('intro', 'sorceress-cold', record => {
    if (record.kind === 'staged-wave') staged++;
    if (record.kind === trigger && (trigger !== 'staged-wave' || staged === 2)) failed = true;
    if (record.kind === 'stopped-native-checkpoint') checkpointAttempts++;
    if (failed) throw new Error('Constructed diagnostic recorder capacity failure');
  });
  expect(staged).toBe(trigger === 'staged-wave' ? 2 : 1);
  expect(checkpointAttempts).toBe(1);
  expect(report.technicalStatus).toBe('failed');
  expect(report.gameplayStatus).toBe('incomplete');
  expect(report.failure).toContain('Constructed diagnostic recorder capacity failure');
  expect(report.failure).toContain('Checkpoint:');
  expect(report.waves).toHaveLength(1);
  expect(report.waves[0]?.outcome).toBe('victory');
  expect(report.totals.earnings.allEarned.xp).toBeGreaterThan(0);
  expect(report.totals.earnings.allEarned.items).toBeGreaterThan(0);
  expect(report.economyAudit).toEqual({ xp: report.totals.earnings.allEarned.xp,
    addedItems: report.totals.earnings.allEarned.items });
  expect(report.successor).not.toBeNull();
  expect(report.exported).not.toBeNull();
});


let taskDirectory: string;
beforeEach(() => { taskDirectory = mkdtempSync(path.join(tmpdir(), 'd2-campaign-journal-')); });
afterEach(() => {
  vi.restoreAllMocks();
  rmSync(taskDirectory, { recursive: true });
  expect(existsSync(taskDirectory)).toBe(false);
});
function text(record: Readonly<Record<string, unknown>>) {
  return `${JSON.stringify(encodeObservation(record))}\n`;
}

it('retains every record and native value in concatenated gzip members within a physical budget', () => {
  const file = path.join(taskDirectory, 'lossless.jsonl.gz');
  const records = Array.from({ length: 8 }, (_, index) => ({ kind: 'diagnostic', index,
    payload: 'native-event '.repeat(4096), unicode: '中文\nline',
    values: new Map([['defense', 6], ['mana', Number.NaN]]), ownUndefined: undefined }));
  const journal = openCampaignJournal(file, 4096);
  try { for (const record of records) journal.append(record); }
  finally { journal.close(); }
  const bytes = readFileSync(file), raw = gunzipSync(bytes).toString('utf8');
  expect(raw).toBe(records.map(text).join(''));
  expect(raw.trimEnd().split('\n').map(line => decodeObservation(JSON.parse(line) as unknown)))
    .toEqual(records);
  expect(journal.bytes).toBe(bytes.length);
  expect(journal.bytes).toBe(statSync(file).size);
  expect(journal.bytes).toBeLessThanOrEqual(4096);
  expect(journal.uncompressedBytes).toBe(Buffer.byteLength(raw));
  expect(journal.uncompressedBytes).toBeGreaterThan(4096);
  journal.close();
  expect(() => { journal.append({ kind: 'after-close' }); }).toThrow('closed');
  expect(readFileSync(file)).toEqual(bytes);
});

it('allows exactly the physical cap and refuses the next whole record without changing bytes or counters', () => {
  const file = path.join(taskDirectory, 'bounded.jsonl.gz');
  const first = { kind: 'first', payload: 'retained' };
  const member = gzipSync(Buffer.from(text(first)));
  const journal = openCampaignJournal(file, member.length);
  try {
    journal.append(first);
    expect(journal.bytes).toBe(member.length);
    expect(readFileSync(file)).toEqual(member);
    const before = { bytes: journal.bytes, uncompressedBytes: journal.uncompressedBytes };
    expect(() => { journal.append({ kind: 'refused' }); }).toThrow('budget');
    expect({ bytes: journal.bytes, uncompressedBytes: journal.uncompressedBytes }).toEqual(before);
    expect(readFileSync(file)).toEqual(member);
    expect(gunzipSync(readFileSync(file)).toString('utf8')).toBe(text(first));
  } finally { journal.close(); }
});

it('rejects invalid limits before creating a file and preserves an existing exclusive output', () => {
  const file = path.join(taskDirectory, 'exclusive.jsonl.gz');
  for (const limit of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
    expect(() => openCampaignJournal(file, limit)).toThrow(RangeError);
    expect(existsSync(file)).toBe(false);
  }
  writeFileSync(file, 'prior evidence');
  expect(() => openCampaignJournal(file)).toThrow();
  expect(readFileSync(file, 'utf8')).toBe('prior evidence');
});

it.each(['partial-write', 'flush'])('preserves the committed boundary and refuses further appends after %s failure', failure => {
  const file = path.join(taskDirectory, 'io-failure.jsonl.gz');
  const journal = openCampaignJournal(file);
  try {
    journal.append({ kind: 'committed' });
    const before = readFileSync(file), rawBytes = journal.uncompressedBytes;
    if (failure === 'partial-write') {
      vi.spyOn(fs, 'writeFileSync').mockImplementationOnce((target, data) => {
        if (typeof target !== 'number' || !Buffer.isBuffer(data)) throw new Error('Unexpected journal I/O');
        fs.writeSync(target, data.subarray(0, 7));
        throw new Error('Constructed partial write failure');
      });
    } else {
      vi.spyOn(fs, 'fsyncSync').mockImplementationOnce(() => { throw new Error('Constructed flush failure'); });
    }
    expect(() => { journal.append({ kind: 'uncommitted' }); }).toThrow();
    expect(readFileSync(file)).toEqual(before);
    expect(journal.bytes).toBe(before.length);
    expect(journal.uncompressedBytes).toBe(rawBytes);
    expect(gunzipSync(readFileSync(file)).toString('utf8')).toBe(text({ kind: 'committed' }));
    expect(() => { journal.append({ kind: 'after-io-failure' }); }).toThrow('failed');
    expect(readFileSync(file)).toEqual(before);
  } finally { journal.close(); }
});

it('reports actual physical bytes and prevents further appends when partial-write rollback fails', () => {
  const file = path.join(taskDirectory, 'rollback-failure.jsonl.gz');
  const journal = openCampaignJournal(file);
  try {
    journal.append({ kind: 'committed' });
    const before = readFileSync(file), rawBytes = journal.uncompressedBytes;
    vi.spyOn(fs, 'writeFileSync').mockImplementationOnce((target, data) => {
      if (typeof target !== 'number' || !Buffer.isBuffer(data)) throw new Error('Unexpected journal I/O');
      fs.writeSync(target, data.subarray(0, 7));
      throw new Error('Constructed partial write failure');
    });
    vi.spyOn(fs, 'ftruncateSync').mockImplementationOnce(() => { throw new Error('Constructed rollback failure'); });
    expect(() => { journal.append({ kind: 'uncommitted' }); }).toThrow(AggregateError);
    expect(statSync(file).size).toBe(before.length + 7);
    expect(journal.bytes).toBe(statSync(file).size);
    expect(journal.uncompressedBytes).toBe(rawBytes);
    expect(() => { journal.append({ kind: 'after-rollback-failure' }); }).toThrow('failed');
    expect(statSync(file).size).toBe(before.length + 7);
  } finally { journal.close(); }
});


it('accounts an actual quest reward before its logger can fail', () => {
  const restores = captureEarnedRestorers();
  try {
    resetEarnedStores();
    useHydrationStore.getState().setStatus('ready');
    expect(createCharacter('Recorder', 'sorceress').ok).toBe(true);
    // Constructed completed-objective fixture; this does not prove earned Den reachability.
    const id = 'quests/act1-den-of-evil';
    useMapStore.getState().updateQuestProgress(id, { status: 'completed',
      objectives: { 'obj-clear-den': true, 'obj-return': true } });
    expect(canClaim(id)).toBe(true);
    const before = snapshotStores();
    expect(before).not.toBeNull();
    const tracked: CampaignReward[] = [];
    const claim = () => { claimCampaignQuest(id, () => {
      throw new Error('Constructed quest recorder failure');
    }, delta => { tracked.push(delta); }); };
    expect(claim).toThrow('Constructed quest recorder failure');
    expect(tracked).toHaveLength(1);
    expect(tracked[0]).toMatchObject({ xp: 500, addedItems: [], removedItemIds: [] });
    const after = snapshotStores();
    expect(after).not.toBeNull();
    if (!before || !after) throw new Error('Native quest test lost checkpoint');
    expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), tracked))
      .toEqual({ xp: 500, addedItems: 0 });
    expect(after.player.skillPoints).toBe(before.player.skillPoints + after.player.level - before.player.level + 1);
    expect(canClaim(id)).toBe(false);
    const unchanged = observeEarnedState();
    expect(() => { claimCampaignQuest(id, () => undefined, delta => { tracked.push(delta); }); }).toThrow();
    expect(tracked).toHaveLength(1);
    expect(observeEarnedState()).toEqual(unchanged);
    expect(usePlayerStore.getState().player?.experience).toBe(after.player.experience);
  } finally { for (const restore of restores) restore(); }
});

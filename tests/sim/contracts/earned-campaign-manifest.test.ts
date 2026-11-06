import { expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { collectCampaignManifest } from '../../campaign/manifest';

it('binds campaign tooling and observation helpers, detects edits and rejects symlinks', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'd2-campaign-manifest-'));
  try {
    for (const dir of ['tests/campaign', 'tests/sim/contracts/nested']) mkdirSync(path.join(root, dir), { recursive: true });
    const helper = path.join(root, 'tests/sim/contracts/nested/observe.ts');
    writeFileSync(path.join(root, 'tests/campaign/run.ts'), 'runner'); writeFileSync(helper, 'first');
    const registry = path.join(root, 'tests/campaign/profile-registry.json');
    writeFileSync(registry, JSON.stringify({ 'sorceress-cold': true }));
    const before = collectCampaignManifest(root);
    expect(before.map(row => row.path)).toEqual(['tests/campaign/profile-registry.json', 'tests/campaign/run.ts', 'tests/sim/contracts/nested/observe.ts']);
    writeFileSync(registry, JSON.stringify({ 'sorceress-cold': true, 'amazon-bow': true }));
    const changed = collectCampaignManifest(root);
    expect(changed.find(row => row.path === 'tests/campaign/profile-registry.json')?.sha256)
      .not.toBe(before.find(row => row.path === 'tests/campaign/profile-registry.json')?.sha256);
    writeFileSync(helper, 'second');
    expect(collectCampaignManifest(root)).not.toEqual(before);
    symlinkSync(helper, path.join(root, 'tests/campaign/escape.ts'));
    expect(() => collectCampaignManifest(root)).toThrow('symlink');
  } finally { rmSync(root, { recursive: true }); }
});

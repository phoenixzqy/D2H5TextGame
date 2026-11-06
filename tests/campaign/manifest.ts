import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/** Supplemental freeze; production provenance separately binds src, diagnostics and configs. */
export function collectCampaignManifest(root: string) {
  const entries: { path: string; sha256: string }[] = [];
  const visit = (relative: string) => {
    const absolute = path.join(root, relative), stat = lstatSync(absolute);
    if (stat.isSymbolicLink()) throw new Error(`Campaign source symlink: ${relative}`);
    if (stat.isDirectory()) {
      for (const file of readdirSync(absolute).sort()) visit(`${relative}/${file}`);
    } else if (stat.isFile()) {
      entries.push({ path: relative, sha256: createHash('sha256').update(readFileSync(absolute)).digest('hex') });
    } else throw new Error(`Unsupported campaign input: ${relative}`);
  };
  visit('tests/campaign'); visit('tests/sim/contracts');
  return entries;
}

#!/usr/bin/env node
/** Verify emitted application assets against the actual Workbox precache. */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const directory = resolve(process.argv[2] ?? 'dist');
const worker = readFileSync(resolve(directory, 'sw.js'), 'utf8');
const urls = new Set([...worker.matchAll(/(?:^|[,{])["']?url["']?\s*:\s*["']([^"']+)["']/g)]
  .map(match => match[1].replace(/^\//, '')));
const chunks = readdirSync(resolve(directory, 'assets'))
  .filter(name => /\.(?:js|css)$/.test(name)).map(name => 'assets/' + name);
if (urls.size === 0 || chunks.length === 0) throw new Error('Missing worker entries or application chunks');
const iconSizes = [192, 512];
const icons = iconSizes.map(size => `icons/icon-${size}.png`);
const required = ['index.html', 'registerSW.js', ...chunks, ...icons];
const missing = required.filter(name => !urls.has(name));
if (missing.length > 0) throw new Error('Required application assets absent from precache: ' + missing.join(', '));
for (const size of iconSizes) {
  const name = `icons/icon-${size}.png`;
  const bytes = readFileSync(resolve(directory, name));
  if (bytes.length < 33 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
      bytes.toString('ascii', 12, 16) !== 'IHDR' || bytes.readUInt32BE(8) !== 13 ||
      bytes.readUInt32BE(16) !== size || bytes.readUInt32BE(20) !== size) {
    throw new Error(`Installation icon must be a ${size}x${size} PNG: ${name}`);
  }
}
console.log(JSON.stringify({ directory, precacheUrls: urls.size, required, missing, pngIcons: icons }));

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
const required = ['index.html', 'registerSW.js', ...chunks];
const missing = required.filter(name => !urls.has(name));
if (missing.length > 0) throw new Error('Required application assets absent from precache: ' + missing.join(', '));
console.log(JSON.stringify({ directory, precacheUrls: urls.size, required, missing }));

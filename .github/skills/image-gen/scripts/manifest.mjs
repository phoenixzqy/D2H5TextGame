// Manifest helper: append-only record of every generated image.
// Located alongside image-gen.mjs so the skill is self-contained.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

export function loadManifest(path) {
  if (!existsSync(path)) {
    return { version: 1, service: 'pollinations.ai', entries: [] };
  }
  const raw = readFileSync(path, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data.entries)) data.entries = [];
  return data;
}

export function saveManifest(path, manifest) {
  writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

export function findEntry(manifest, { id, seed, prompt }) {
  return manifest.entries.find(
    (e) => e.id === id && e.seed === seed && e.prompt === prompt,
  );
}

export function appendEntry(manifest, entry) {
  manifest.entries.push(entry);
  return manifest;
}

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

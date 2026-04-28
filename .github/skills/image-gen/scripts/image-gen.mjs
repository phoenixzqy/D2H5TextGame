#!/usr/bin/env node
/**
 * image-gen — call Pollinations.AI to generate a styled image, save it under
 * public/assets/d2/generated/<category>/<id>.png, and append a manifest entry.
 *
 * Style consistency is enforced by docs/art/style-presets.json (categories,
 * model, size, seed-base, style suffix, negative prompt) and the seed registry.
 *
 * Usage:
 *   node image-gen.mjs --category <cat> --id <id> --subject "<...>" \
 *     --descriptors "<...>" [--variant 0] [--subjectId 5] [--dry-run] [--force]
 *
 * If --subjectId is omitted, the skill expects --id to be present in
 * docs/art/seed-registry.md. (For v1 we accept --subjectId on the CLI to
 * avoid parsing the markdown registry; the art-director agent passes it.)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadManifest, saveManifest, findEntry, appendEntry, sha256 } from './manifest.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..');
const PRESETS_PATH = join(REPO_ROOT, 'docs', 'art', 'style-presets.json');
const MANIFEST_PATH = join(REPO_ROOT, 'public', 'assets', 'd2', 'generated', 'manifest.json');

function parseArgs(argv) {
  const out = { variant: 0, dryRun: false, force: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--force') out.force = true;
    else if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[++i];
      if (key === 'variant' || key === 'subjectId') out[key] = Number(val);
      else out[key] = val;
    }
  }
  return out;
}

function die(msg) {
  console.error(`[image-gen] ERROR: ${msg}`);
  process.exit(1);
}

function buildPrompt(presets, category, subject, descriptors) {
  const parts = [
    presets.globalPreamble,
    category.styleSuffix,
    `subject: ${subject}`,
  ];
  if (descriptors && descriptors.trim()) parts.push(descriptors.trim());
  return parts.join(', ');
}

function buildNegative(presets, category) {
  return [presets.globalNegative, category.negativeAdditions]
    .filter(Boolean)
    .join(', ');
}

function buildUrl(presets, category, prompt, negative, seed) {
  const base = presets.service.endpoint + encodeURIComponent(prompt);
  const params = new URLSearchParams({
    model: category.model,
    width: String(category.width),
    height: String(category.height),
    seed: String(seed),
    negative_prompt: negative,
    ...(presets.service.extraQuery || {}),
  });
  return `${base}?${params.toString()}`;
}

async function main() {
  const args = parseArgs(process.argv);
  const required = ['category', 'id', 'subject'];
  for (const r of required) if (!args[r]) die(`missing --${r}`);
  if (args.subjectId === undefined || Number.isNaN(args.subjectId)) {
    die('missing --subjectId (allocate one in docs/art/seed-registry.md)');
  }

  const presets = JSON.parse(readFileSync(PRESETS_PATH, 'utf8'));
  const cat = presets.categories[args.category];
  if (!cat) die(`unknown category "${args.category}". Known: ${Object.keys(presets.categories).join(', ')}`);

  const seed = cat.seedBase + args.subjectId + (args.variant || 0) * 10000;
  const prompt = buildPrompt(presets, cat, args.subject, args.descriptors || '');
  const negative = buildNegative(presets, cat);
  const url = buildUrl(presets, cat, prompt, negative, seed);

  const outDir = resolve(REPO_ROOT, cat.outputDir);
  mkdirSync(outDir, { recursive: true });
  const safeId = args.id.replace(/[^a-zA-Z0-9._-]/g, '_');
  const outFile = join(outDir, `${safeId}${args.variant ? `.v${args.variant}` : ''}.png`);

  const manifest = loadManifest(MANIFEST_PATH);
  const existing = findEntry(manifest, { id: args.id, seed, prompt });
  if (existing && !args.force) {
    console.log(`[image-gen] cache hit for id=${args.id} seed=${seed} → skipping (use --force to override)`);
    console.log(`[image-gen] existing file: ${existing.file}`);
    return;
  }

  console.log(`[image-gen] category=${args.category} id=${args.id} seed=${seed} variant=${args.variant}`);
  console.log(`[image-gen] url:\n  ${url}`);
  if (args.dryRun) {
    console.log('[image-gen] dry-run, not fetching');
    return;
  }

  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) die(`Pollinations.AI returned ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1024) die(`response too small (${buf.length} bytes), likely an error page`);

  writeFileSync(outFile, buf);
  const hash = sha256(buf);
  console.log(`[image-gen] saved ${outFile} (${buf.length} bytes, sha256=${hash.slice(0, 12)}…)`);

  appendEntry(manifest, {
    id: args.id,
    category: args.category,
    subject: args.subject,
    descriptors: args.descriptors || '',
    subjectId: args.subjectId,
    variant: args.variant || 0,
    seed,
    model: cat.model,
    width: cat.width,
    height: cat.height,
    prompt,
    negativePrompt: negative,
    sourceUrl: url,
    file: outFile.replace(REPO_ROOT + (process.platform === 'win32' ? '\\' : '/'), '').replace(/\\/g, '/'),
    bytes: buf.length,
    sha256: hash,
    generatedAt: new Date().toISOString(),
  });
  saveManifest(MANIFEST_PATH, manifest);
  console.log(`[image-gen] manifest updated: ${MANIFEST_PATH}`);
}

main().catch((e) => die(e.stack || e.message));

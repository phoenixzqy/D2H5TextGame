#!/usr/bin/env node
/**
 * i18n-lint — static analysis for untranslated strings and missing i18n keys.
 *
 * Complements `scripts/i18n-check.mjs` (Playwright runtime sweep) by catching
 * issues *before* the app boots:
 *
 *   1. **Raw English literals in game data JSON.** Game data files under
 *      `src/data/` are expected to store i18n references in dotted form
 *      (e.g. `skills.necromancer.poison-mastery.desc`). When a raw English
 *      sentence sits in `description`, `name`, etc., `tDataKey` falls back
 *      to `t(literal)` and the literal renders verbatim regardless of locale.
 *
 *   2. **Dotted keys that do not resolve in a locale bundle.** When a key
 *      like `skills.foo.bar.desc` is referenced (in data JSON or in a
 *      `tDataKey(t, '...')` / `t('ns:...')` source call) but missing from
 *      `src/i18n/locales/<lang>/<ns>.json`, i18next renders the raw key.
 *
 *   3. **Locale parity gaps** between `en` and `zh-CN` (informational).
 *
 * Usage:
 *   node scripts/i18n-lint.mjs           # human report, exit 1 on failures
 *   node scripts/i18n-lint.mjs --json    # machine-readable JSON output
 *   node scripts/i18n-lint.mjs --quiet   # only print summary + failures
 *
 * No production dependencies; pure Node ≥ 20.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(REPO_ROOT, 'src');
const LOCALES_DIR = join(SRC, 'i18n', 'locales');
const DATA_DIR = join(SRC, 'data');
const LOCALES = ['en', 'zh-CN'];

// Fields in data JSON whose string values must be either a valid dotted
// i18n key OR a non-user-facing identifier (slug). Anything else (English
// prose) is flagged as untranslated.
const USER_FACING_FIELDS = new Set([
  'name',
  'description',
  'desc',
  'tagline',
  'flavor',
  'flavorText',
  'lore',
  'text',
  'summary',
  'title',
  'subtitle',
  'objective',
  'nameKey',
  'descKey',
  'displayName',
  'label'
]);

// Skip files that are not user-facing:
//  - JSON Schema files (describe shape, not content)
//  - src/data/loot/* — treasure-class and mf-curve names/descriptions are
//    dev-only labels referenced by id, never displayed to the player.
const DATA_FILE_IGNORE = [/[\\/]schema[\\/]/, /[\\/]data[\\/]loot[\\/]/];

// Slug-like values pass through unflagged in `name`-like fields (e.g.
// internal tree ids). Heuristic: ≤32 chars, only [a-z0-9_-].
const SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/;

// Known namespace set must match `src/i18n/index.ts` and `src/ui/i18nKey.ts`.
const KNOWN_NAMESPACES = new Set([
  'common',
  'character',
  'combat',
  'inventory',
  'skills',
  'settings',
  'town',
  'map',
  'mercs',
  'gacha',
  'quests',
  'monsters',
  'items',
  'maps',
  'rarity',
  'damage-types',
  'card',
  'affixes'
]);

function walk(dir, predicate, out = []) {
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) walk(abs, predicate, out);
    else if (predicate(abs)) out.push(abs);
  }
  return out;
}

function relPath(abs) {
  return relative(REPO_ROOT, abs).split(sep).join(posix.sep);
}

function loadLocaleBundle(locale) {
  const localeDir = join(LOCALES_DIR, locale);
  const bundle = {};
  for (const file of readdirSync(localeDir)) {
    if (!file.endsWith('.json')) continue;
    const ns = file.slice(0, -'.json'.length);
    bundle[ns] = JSON.parse(readFileSync(join(localeDir, file), 'utf8'));
  }
  return bundle;
}

function collectKeys(obj, prefix = '', out = new Set()) {
  if (obj == null || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v != null && typeof v === 'object' && !Array.isArray(v)) {
      collectKeys(v, path, out);
    } else if (typeof v === 'string' || Array.isArray(v)) {
      out.add(path);
    }
  }
  return out;
}

function resolveKey(bundle, ns, dotted) {
  const root = bundle[ns];
  if (!root) return undefined;
  let node = root;
  for (const p of dotted.split('.')) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[p];
  }
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.join('|');
  return undefined;
}

function classifyValue(raw) {
  const v = raw.trim();
  if (!v) return { kind: 'empty' };
  if (/^[A-Za-z][A-Za-z0-9_-]*(\.[A-Za-z0-9_-]+)+$/.test(v)) {
    const dot = v.indexOf('.');
    const ns = v.slice(0, dot);
    if (KNOWN_NAMESPACES.has(ns)) {
      return { kind: 'dotted-key', ns, sub: v.slice(dot + 1) };
    }
  }
  if (SLUG_RE.test(v)) return { kind: 'slug' };
  if (/[A-Za-z]/.test(v) && /[\s.!?,;:'"()-]/.test(v)) return { kind: 'literal' };
  if (/^[A-Z][a-zA-Z]+$/.test(v)) return { kind: 'literal' };
  return { kind: 'unknown' };
}

function makeLineLookup(text) {
  const lineStarts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) lineStarts.push(i + 1);
  }
  return (idx) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >>> 1;
      if (lineStarts[mid] <= idx) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function scanDataFile(absPath, findings) {
  const text = readFileSync(absPath, 'utf8');
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    findings.parseErrors.push({ file: relPath(absPath), error: String(e) });
    return;
  }
  const lineOf = makeLineLookup(text);

  function visit(node, jsonPointer) {
    if (node == null) return;
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) visit(node[i], `${jsonPointer}[${String(i)}]`);
      return;
    }
    if (typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      const childPath = `${jsonPointer}.${k}`;
      if (typeof v === 'string' && USER_FACING_FIELDS.has(k)) {
        const cls = classifyValue(v);
        // Find a "<key>": "<value>" occurrence for line number.
        const re = new RegExp(`"${escapeRe(k)}"\\s*:\\s*"${escapeRe(v).replace(/\\\\/g, '\\\\\\\\')}"`);
        const m = re.exec(text);
        const line = m ? lineOf(m.index) : 0;
        const loc = { file: relPath(absPath), line, jsonPath: childPath, field: k, value: v };
        if (cls.kind === 'dotted-key') {
          for (const locale of LOCALES) {
            if (resolveKey(findings._bundles[locale], cls.ns, cls.sub) == null) {
              findings.dataMissingKey.push({ ...loc, locale, ns: cls.ns, key: cls.sub });
            }
          }
        } else if (cls.kind === 'literal') {
          findings.dataLiteral.push(loc);
        }
      } else if (typeof v === 'object') {
        visit(v, childPath);
      }
    }
  }
  visit(json, '$');
}

const TX_CALL_RE = /\bt\(\s*(['"`])([^'"`\n]+?)\1(?=\s*[,)])/g;
const TDATAKEY_CALL_RE = /\btDataKey\s*\(\s*[a-zA-Z_$][\w$]*\s*,\s*(['"`])([^'"`\n]+?)\1\s*\)/g;

function scanSourceFile(absPath, findings) {
  const text = readFileSync(absPath, 'utf8');
  const lineOf = makeLineLookup(text);

  TX_CALL_RE.lastIndex = 0;
  let m;
  while ((m = TX_CALL_RE.exec(text)) !== null) {
    const key = m[2];
    if (!key.includes(':')) continue; // ns-relative — needs runtime context
    const colon = key.indexOf(':');
    const ns = key.slice(0, colon);
    const sub = key.slice(colon + 1);
    if (!KNOWN_NAMESPACES.has(ns)) continue;
    if (sub.includes('${') || sub.includes('{{')) continue;
    const line = lineOf(m.index);
    for (const locale of LOCALES) {
      if (resolveKey(findings._bundles[locale], ns, sub) == null) {
        findings.sourceMissingKey.push({
          file: relPath(absPath),
          line,
          locale,
          ns,
          key: sub,
          call: `t('${key}')`
        });
      }
    }
  }

  TDATAKEY_CALL_RE.lastIndex = 0;
  while ((m = TDATAKEY_CALL_RE.exec(text)) !== null) {
    const key = m[2];
    if (key.includes('${') || key.includes('{{')) continue;
    const cls = classifyValue(key);
    if (cls.kind !== 'dotted-key') continue;
    const line = lineOf(m.index);
    for (const locale of LOCALES) {
      if (resolveKey(findings._bundles[locale], cls.ns, cls.sub) == null) {
        findings.sourceMissingKey.push({
          file: relPath(absPath),
          line,
          locale,
          ns: cls.ns,
          key: cls.sub,
          call: `tDataKey(t, '${key}')`
        });
      }
    }
  }
}

function checkParity(findings) {
  const enKeys = new Map();
  const zhKeys = new Map();
  for (const ns of Object.keys(findings._bundles.en)) {
    enKeys.set(ns, collectKeys(findings._bundles.en[ns]));
  }
  for (const ns of Object.keys(findings._bundles['zh-CN'])) {
    zhKeys.set(ns, collectKeys(findings._bundles['zh-CN'][ns]));
  }
  const allNs = new Set([...enKeys.keys(), ...zhKeys.keys()]);
  for (const ns of allNs) {
    const en = enKeys.get(ns) ?? new Set();
    const zh = zhKeys.get(ns) ?? new Set();
    for (const k of en) {
      if (!zh.has(k)) findings.parityMissing.push({ ns, key: k, presentIn: 'en', missingIn: 'zh-CN' });
    }
    for (const k of zh) {
      if (!en.has(k)) findings.parityMissing.push({ ns, key: k, presentIn: 'zh-CN', missingIn: 'en' });
    }
  }
}

function truncate(s, n) {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

function main() {
  const args = new Set(process.argv.slice(2));
  const asJson = args.has('--json');
  const quiet = args.has('--quiet');

  const findings = {
    parseErrors: [],
    dataLiteral: [],
    dataMissingKey: [],
    sourceMissingKey: [],
    parityMissing: [],
    _bundles: {}
  };

  for (const locale of LOCALES) findings._bundles[locale] = loadLocaleBundle(locale);

  const dataFiles = walk(DATA_DIR, (p) => p.endsWith('.json') && !DATA_FILE_IGNORE.some((re) => re.test(p)));
  for (const f of dataFiles) scanDataFile(f, findings);

  const srcFiles = walk(SRC, (p) =>
    /\.(ts|tsx)$/.test(p) && !p.endsWith('.d.ts') && !p.includes(`${sep}i18n${sep}`)
  );
  for (const f of srcFiles) scanSourceFile(f, findings);

  checkParity(findings);

  delete findings._bundles;

  const totals = {
    parseErrors: findings.parseErrors.length,
    dataLiteral: findings.dataLiteral.length,
    dataMissingKey: findings.dataMissingKey.length,
    sourceMissingKey: findings.sourceMissingKey.length,
    parityMissing: findings.parityMissing.length
  };
  const failed =
    totals.parseErrors > 0 ||
    totals.dataLiteral > 0 ||
    totals.dataMissingKey > 0 ||
    totals.sourceMissingKey > 0;

  if (asJson) {
    process.stdout.write(JSON.stringify({ totals, failed, ...findings }, null, 2) + '\n');
    process.exit(failed ? 1 : 0);
  }

  const out = [];
  out.push('═══ i18n-lint report ═══');
  out.push('');
  out.push(`  parse errors:                            ${totals.parseErrors}`);
  out.push(`  data literals (untranslated game data):  ${totals.dataLiteral}`);
  out.push(`  data → missing key in locale bundle:     ${totals.dataMissingKey}`);
  out.push(`  source → missing key in locale bundle:   ${totals.sourceMissingKey}`);
  out.push(`  locale parity gaps (en ↔ zh-CN):         ${totals.parityMissing}`);
  out.push('');

  if (findings.parseErrors.length > 0) {
    out.push('── parse errors ──');
    for (const x of findings.parseErrors) out.push(`  ${x.file}: ${x.error}`);
    out.push('');
  }

  if (findings.dataLiteral.length > 0) {
    out.push('── data literals (raw English in game data; should be a dotted i18n key) ──');
    for (const x of findings.dataLiteral) {
      out.push(`  ${x.file}:${String(x.line)}  [${x.field}]  "${truncate(x.value, 80)}"`);
    }
    out.push('');
  }

  if (findings.dataMissingKey.length > 0) {
    out.push('── data references key missing in locale bundle ──');
    for (const x of findings.dataMissingKey) {
      out.push(`  ${x.file}:${String(x.line)}  [${x.locale}]  ${x.ns}:${x.key}`);
    }
    out.push('');
  }

  if (findings.sourceMissingKey.length > 0) {
    out.push('── source references key missing in locale bundle ──');
    for (const x of findings.sourceMissingKey) {
      out.push(`  ${x.file}:${String(x.line)}  [${x.locale}]  ${x.call}`);
    }
    out.push('');
  }

  if (!quiet && findings.parityMissing.length > 0) {
    out.push('── locale parity gaps (informational) ──');
    const limit = 50;
    for (const x of findings.parityMissing.slice(0, limit)) {
      out.push(`  [${x.missingIn}] missing  ${x.ns}:${x.key}  (present in ${x.presentIn})`);
    }
    if (findings.parityMissing.length > limit) {
      out.push(`  … and ${String(findings.parityMissing.length - limit)} more`);
    }
    out.push('');
  }

  out.push(failed ? '✗ FAIL — i18n issues detected' : '✓ PASS — no untranslated strings or missing keys');
  process.stdout.write(out.join('\n') + '\n');
  process.exit(failed ? 1 : 0);
}

main();

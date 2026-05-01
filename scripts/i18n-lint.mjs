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
 *   node scripts/i18n-lint.mjs --scope devui
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
  'affixes',
  'dev'
]);

const DEVUI_DIR = join(SRC, 'features', 'dev');
const DEVUI_VISIBLE_ATTR_RE = /\b(aria-label|title|placeholder|alt)\s*=\s*(['"])([^'"\n]*[A-Za-z][^'"\n]*)\2/g;
const DEVUI_VISIBLE_PROP_RE = /\b(label|title|description|placeholder|ariaLabel|emptyText|invalidHint)\s*:\s*(['"`])([^'"`\n]*[A-Za-z][^'"`\n]*)\2/g;
const DEVUI_JSX_TEXT_RE = />\s*([^<>{}\n]*[A-Za-z][^<>{}\n]*)\s*</g;

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

function isDevUiFile(absPath) {
  return absPath.startsWith(DEVUI_DIR + sep);
}

function parseScope(argv) {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--scope') return argv[i + 1] ?? 'all';
    if (arg?.startsWith('--scope=')) return arg.slice('--scope='.length);
  }
  return 'all';
}

function isRawDevUiLiteral(value) {
  const v = value.replace(/\s+/g, ' ').trim();
  if (!v) return false;
  if (!/[A-Za-z]/.test(v)) return false;
  if (/^[A-Za-z0-9_.:-]+$/.test(v) && !/\s/.test(v) && v.length > 32) return false;
  if (/^(--|true|false|null|undefined)$/i.test(v)) return false;
  if (/^https?:\/\//i.test(v)) return false;
  if (v.startsWith('/')) return false;
  if (/^[a-z]+:[A-Za-z0-9_.-]+$/.test(v)) return false;
  return true;
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
const USE_TRANSLATION_RE = /\buseTranslation\s*\(\s*(?:(['"`])([^'"`\n]+?)\1|\[\s*(['"`])([^'"`\n]+?)\3)/;

function inferDefaultTranslationNamespace(text) {
  const m = USE_TRANSLATION_RE.exec(text);
  const ns = m?.[2] ?? m?.[4];
  return ns && KNOWN_NAMESPACES.has(ns) ? ns : undefined;
}

function scanSourceFile(absPath, findings) {
  const text = readFileSync(absPath, 'utf8');
  const lineOf = makeLineLookup(text);
  const defaultNs = inferDefaultTranslationNamespace(text);

  TX_CALL_RE.lastIndex = 0;
  let m;
  while ((m = TX_CALL_RE.exec(text)) !== null) {
    const key = m[2];
    const colon = key.indexOf(':');
    const ns = colon === -1 ? defaultNs : key.slice(0, colon);
    const sub = colon === -1 ? key : key.slice(colon + 1);
    if (!ns) continue;
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
          call: colon === -1 ? `t('${key}') [default ns: ${ns}]` : `t('${key}')`
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

  if (isDevUiFile(absPath)) scanDevUiRawLiterals(absPath, text, lineOf, findings);
}

function addDevUiLiteralFinding(findings, absPath, line, kind, value) {
  if (!isRawDevUiLiteral(value)) return;
  findings.sourceLiteral.push({
    file: relPath(absPath),
    line,
    kind,
    value: value.replace(/\s+/g, ' ').trim()
  });
}

function scanDevUiRawLiterals(absPath, text, lineOf, findings) {
  if (!absPath.endsWith('.tsx')) return;

  DEVUI_VISIBLE_ATTR_RE.lastIndex = 0;
  let m;
  while ((m = DEVUI_VISIBLE_ATTR_RE.exec(text)) !== null) {
    addDevUiLiteralFinding(findings, absPath, lineOf(m.index), `attr:${m[1]}`, m[3]);
  }

  DEVUI_VISIBLE_PROP_RE.lastIndex = 0;
  while ((m = DEVUI_VISIBLE_PROP_RE.exec(text)) !== null) {
    addDevUiLiteralFinding(findings, absPath, lineOf(m.index), `prop:${m[1]}`, m[3]);
  }

  DEVUI_JSX_TEXT_RE.lastIndex = 0;
  while ((m = DEVUI_JSX_TEXT_RE.exec(text)) !== null) {
    addDevUiLiteralFinding(findings, absPath, lineOf(m.index), 'jsx-text', m[1]);
  }
}

function checkParity(findings, nsFilter = undefined) {
  const enKeys = new Map();
  const zhKeys = new Map();
  for (const ns of Object.keys(findings._bundles.en)) {
    if (nsFilter && !nsFilter.has(ns)) continue;
    enKeys.set(ns, collectKeys(findings._bundles.en[ns]));
  }
  for (const ns of Object.keys(findings._bundles['zh-CN'])) {
    if (nsFilter && !nsFilter.has(ns)) continue;
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
  const argv = process.argv.slice(2);
  const args = new Set(argv);
  const asJson = args.has('--json');
  const quiet = args.has('--quiet');
  const scope = parseScope(argv);
  const devUiOnly = scope === 'devui';
  if (scope !== 'all' && scope !== 'devui') {
    process.stderr.write(`Unknown i18n-lint scope "${scope}". Expected "all" or "devui".\n`);
    process.exit(2);
  }

  const findings = {
    parseErrors: [],
    dataLiteral: [],
    dataMissingKey: [],
    sourceMissingKey: [],
    sourceLiteral: [],
    parityMissing: [],
    _bundles: {}
  };

  for (const locale of LOCALES) findings._bundles[locale] = loadLocaleBundle(locale);

  if (!devUiOnly) {
    const dataFiles = walk(DATA_DIR, (p) => p.endsWith('.json') && !DATA_FILE_IGNORE.some((re) => re.test(p)));
    for (const f of dataFiles) scanDataFile(f, findings);
  }

  const srcFiles = walk(SRC, (p) =>
    /\.(ts|tsx)$/.test(p) &&
      !p.endsWith('.d.ts') &&
      !p.includes(`${sep}i18n${sep}`) &&
      (!devUiOnly || isDevUiFile(p))
  );
  for (const f of srcFiles) scanSourceFile(f, findings);

  checkParity(findings, devUiOnly ? new Set(['dev']) : undefined);

  delete findings._bundles;

  const totals = {
    parseErrors: findings.parseErrors.length,
    dataLiteral: findings.dataLiteral.length,
    dataMissingKey: findings.dataMissingKey.length,
    sourceMissingKey: findings.sourceMissingKey.length,
    sourceLiteral: findings.sourceLiteral.length,
    parityMissing: findings.parityMissing.length
  };
  const failed =
    totals.parseErrors > 0 ||
    totals.dataLiteral > 0 ||
    totals.dataMissingKey > 0 ||
    totals.sourceMissingKey > 0 ||
    totals.sourceLiteral > 0 ||
    (devUiOnly && totals.parityMissing > 0);

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
  out.push(`  source literals (raw DevUI strings):     ${totals.sourceLiteral}`);
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

  if (findings.sourceLiteral.length > 0) {
    out.push('── source literals (raw visible DevUI strings; should use dev namespace keys) ──');
    for (const x of findings.sourceLiteral) {
      out.push(`  ${x.file}:${String(x.line)}  [${x.kind}]  "${truncate(x.value, 80)}"`);
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

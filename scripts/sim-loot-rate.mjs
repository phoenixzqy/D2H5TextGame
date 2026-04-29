import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const acts = [{ act: 1, level: 1 }, { act: 2, level: 21 }, { act: 3, level: 35 }, { act: 4, level: 48 }, { act: 5, level: 65 }];
const rarityOrder = ['normal', 'magic', 'rare', 'set', 'unique'];
const baseWeights = { white: 1000, magic: 300, rare: 80, set: 8, unique: 4 };
function readJson(p) { return JSON.parse(fs.readFileSync(path.join(root, p), 'utf8')); }
function rng(seed) { let s = seed >>> 0; const next = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; return { next, chance: (p) => next() < p }; }
const pct = (n, d) => d ? n / d * 100 : 0;
const fmt = (n, d = 2) => n.toFixed(d);
function std(v) { const m = v.reduce((s, x) => s + x, 0) / v.length; return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length); }
function hist(items, key) { const m = new Map(); for (const item of items) m.set(key(item), (m.get(key(item)) ?? 0) + 1); return m; }
function loadTcs() { const map = new Map(); for (const raw of readJson('src/data/loot/treasure-classes.json')) map.set(raw.id, { id: raw.id, picks: raw.entries.filter((e) => e.type === 'item').map((e) => ({ baseId: e.itemBase, weight: e.weight, qlvlMin: e.minLevel, qlvlMax: e.maxLevel })), numPicks: raw.numPicks, noDropChance: raw.noDropChance }); return map; }
function loadUniques() { const map = new Map(); for (const u of readJson('src/data/items/uniques.json')) { const list = map.get(u.baseId) ?? []; list.push(u); map.set(u.baseId, list); } return map; }
function pick(tc, mlvl, r) { const ok = tc.picks.filter((p) => mlvl >= p.qlvlMin && mlvl <= p.qlvlMax); const total = ok.reduce((s, p) => s + p.weight, 0); if (total <= 0) return undefined; let roll = r.next() * total; for (const p of ok) { roll -= p.weight; if (roll <= 0) return p.baseId; } return ok.at(-1)?.baseId; }
function rollRarity(r) { let roll = r.next() * 1392; if ((roll -= baseWeights.white) <= 0) return 'normal'; if ((roll -= baseWeights.magic) <= 0) return 'magic'; if ((roll -= baseWeights.rare) <= 0) return 'rare'; if ((roll -= baseWeights.set) <= 0) return 'set'; return 'unique'; }
function materialize(rarity, baseId, ilvl, uniques) { if (rarity === 'set') return 'rare'; if (rarity === 'unique') return (uniques.get(baseId) ?? []).some((u) => u.reqLevel <= ilvl + 5) ? 'unique' : 'rare'; return rarity; }
function rollKill(tc, mlvl, r, uniques) { const items = []; for (let i = 0; i < (tc.numPicks ?? 1); i++) { if (r.chance(tc.noDropChance ?? 0.6)) continue; const baseId = pick(tc, mlvl, r); if (baseId) items.push({ baseId, rarity: materialize(rollRarity(r), baseId, mlvl, uniques), ilvl: mlvl }); } return items; }
function raritySummary(items) { const h = hist(items, (i) => i.rarity); return Object.fromEntries(rarityOrder.map((rarity) => { const count = h.get(rarity) ?? 0; return [rarity, { count, percent: pct(count, items.length) }]; })); }
function baseSummary(items) { return [...hist(items, (i) => i.baseId).entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([baseId, count]) => ({ baseId, count, percent: pct(count, items.length) })); }
const tcs = loadTcs(); const uniques = loadUniques(); const results = [];
for (const { act, level } of acts) { const tc = tcs.get(`loot/trash-act${act}`); const perFight = []; const all = []; for (let seed = 1; seed <= 1000; seed++) { const r = rng(seed); let n = 0; for (let mob = 0; mob < 3; mob++) { const items = rollKill(tc, level, r, uniques); n += items.length; all.push(...items); } perFight.push(n); } const withDrop = perFight.filter((n) => n >= 1).length; results.push({ act, monsterLevel: level, fights: 1000, kills: 3000, itemCount: all.length, itemsPerFightMean: perFight.reduce((s, n) => s + n, 0) / perFight.length, itemsPerFightStd: std(perFight), pFightHasDrop: pct(withDrop, perFight.length), pTenFightSampleHasDrop: (1 - (1 - withDrop / perFight.length) ** 10) * 100, rarity: raritySummary(all), topBases: baseSummary(all) }); }
const header = '| TC | mlvl | items/fight mean | std | fights ≥1 drop | 10-fight sample ≥1 drop | normal | magic | rare | set | unique | top bases |';
const rows = results.map((x) => `| loot/trash-act${x.act} | ${x.monsterLevel} | ${fmt(x.itemsPerFightMean, 3)} | ${fmt(x.itemsPerFightStd, 3)} | ${fmt(x.pFightHasDrop)}% | ${fmt(x.pTenFightSampleHasDrop, 5)}% | ${rarityOrder.map((r) => `${x.rarity[r].count} (${fmt(x.rarity[r].percent)}%)`).join(' | ')} | ${x.topBases.map((b) => `${b.baseId.replace('items/base/', '')}: ${b.count}`).join('<br>')} |`);
const md = ['# Loot Rate Simulation — Trash Acts', '', 'Simulation: 1000 fights per act, 3 trash mobs per fight, MF=0, GF=0, seeds 1..1000. The script mirrors `loadTreasureClasses()` item-entry filtering and `rollDrops()` rarity/no-drop semantics without a TS runtime.', '', header, '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|', ...rows, '', '```json', JSON.stringify(results, null, 2), '```', ''].join('\n');
console.log(md); fs.mkdirSync(path.join(root, 'docs', 'balance'), { recursive: true }); fs.writeFileSync(path.join(root, 'docs', 'balance', 'loot-rate-act1.md'), md);

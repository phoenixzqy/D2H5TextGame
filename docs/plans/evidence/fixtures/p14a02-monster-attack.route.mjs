import { createServer } from '/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-2/node_modules/vite/dist/node/index.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wt = '/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-2';
const root = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.join(wt, 'docs/plans/evidence/fixtures/p01-act1-earned-l12.service.json');
const encode = value => JSON.stringify(value, (_key, v) => v instanceof Map ? [...v.entries()] : v instanceof Set ? [...v] : v, 2) + '\n';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const input = await readFile(inputPath);
assert.equal(sha(input), '8c46c4f4026116360356a2d17dcde3d723310969a25664f85bc291a1886d2afc');
const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z', 'src', 'tests/sim/production', 'package.json', 'package-lock.json', 'vite.config.ts'], { cwd: wt, encoding: 'utf8' }).split('\0').filter(Boolean).concat('tests/sim/production/earned-state.test.ts'))];
const sources = async () => Object.fromEntries(await Promise.all(files.map(async rel => [rel, sha(await readFile(path.join(wt, rel)))])));
const beforeSources = await sources();
const report = { kind: 'one original earned L12 four-map to Catacombs route after authored monster attack progression; not browser or campaign proof',
  head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: wt, encoding: 'utf8' }).trim(),
  inputSha: sha(input), scriptSha: sha(await readFile(fileURLToPath(import.meta.url))),
  node: process.version, pid: process.pid, seed: 2223645302, bonus: 1,
  rules: ['same predeclared existing weapon it-7is2r-10i; no further gear selection/farming/tuning/respec/allocation/refill/direct XP/idle ticker',
    'Blood Moor102/Cold Plains103/Burial Grounds104/Dark Wood105/Catacombs106 once, stop first nonwin',
    'restore original unique L12 only; no corrupt later export'], sources: beforeSources, runs: [] };
let server, restorers = [], helpers, state, pity, oldPity;
const originalNow = Date.now;
try {
  await mkdir(path.join(root, 'route-tmp'), { recursive: true });
  server = await createServer({ configFile: false, root: wt, cacheDir: path.join(root, 'route-cache'),
    server: { middlewareMode: true, hmr: false, ws: false }, resolve: { alias: { '@': path.join(wt, 'src') } } });
  const load = rel => server.ssrLoadModule('/' + rel);
  state = await load('tests/sim/production/earned-state.ts');
  const playback = await load('tests/sim/production/earned-playback.ts');
  helpers = await load('src/stores/combatHelpers.ts');
  pity = await load('src/stores/idleElitePity.ts'); oldPity = pity.getIdleEliteMisses();
  const { decodeSave } = await load('src/engine/save/validate.ts');
  const { toJsonSafe } = await load('src/engine/save/serialize.ts');
  const { usePlayerStore: player } = await load('src/stores/playerStore.ts');
  const { useMercStore: merc } = await load('src/stores/mercStore.ts');
  const { useMapStore: map } = await load('src/stores/mapStore.ts');
  const { default: i18n } = await load('src/i18n/index.ts'); await i18n.changeLanguage('en');
  const save = decodeSave(JSON.parse(input));
  restorers = state.captureEarnedRestorers();
  Date.now = () => 1792497600000;
  state.restoreEarnedSave(save, Date.now());
  const exportSave = () => {
    const o = state.observeEarnedState();
    return toJsonSafe({ version: save.version, timestamp: save.timestamp,
      player: o.player.player, inventory: o.inventory, mercs: o.merc, map: o.map,
      meta: { settings: o.meta.settings, idleState: o.meta.idleState, gachaState: o.meta.gachaState },
      formation: o.formation });
  };
  const itemIds = s => [...s.inventory.backpack, ...s.inventory.stash,
    ...Object.values(s.inventory.equipped).filter(Boolean),
    ...Object.values(s.mercs.mercEquipment).flatMap(e => Object.values(e).filter(Boolean))].map(i => i.id);
  assert.deepEqual(exportSave(), toJsonSafe(save)); report.initialFullSaveEquality = true;
  report.initialItems = itemIds(exportSave()).length;
  player.getState().setComboOrder(['skills-sorceress-frost-nova', 'skills-sorceress-ice-blast']);
  assert.deepEqual(player.getState().player.comboOrder, ['skills-sorceress-frost-nova', 'skills-sorceress-ice-blast']);
  const fielded = merc.getState().getFieldedMerc(); assert.ok(fielded);
  const { useInventoryStore: inventory } = await load('src/stores/inventoryStore.ts');
  const { loadItemBases } = await load('src/data/loaders/loot.ts');
  const { mercToCombatUnit } = await load('src/stores/mercToCombatUnit.ts');
  const equipment = merc.getState().mercEquipment[fielded.id] ?? {};
  const bases = loadItemBases();
  const currentAttack = mercToCombatUnit(fielded, undefined, equipment).stats.attack;
  const item = inventory.getState().backpack.find(candidate => candidate.id === 'it-7is2r-10i');
  assert.ok(item); assert.equal(bases.get(item.baseId)?.slot, 'weapon');
  const attack = mercToCombatUnit(fielded, undefined, { ...equipment, weapon: item }).stats.attack;
  assert.equal(attack, 43);
  report.weaponChoice = { currentAttack, selected: { item, attack }, predeclaredId: 'it-7is2r-10i' };
  report.weaponChoice.transfer = merc.getState().equipOnMerc(fielded.id, 'weapon', item);
  assert.deepEqual(report.weaponChoice.transfer, { ok: true });
  assert.equal(mercToCombatUnit(fielded, undefined, merc.getState().mercEquipment[fielded.id]).stats.attack, 43);
  report.preRouteSave = exportSave();
  const priority = ['mskill-inner-sight', 'mskill-pierce-arrow', 'mskill-basic-arrow'];
  assert.equal(merc.getState().setSkillOrder(fielded.id, priority), true);
  assert.deepEqual(merc.getState().getFieldedMerc().comboOrder, priority);
  for (const [area, ordinal] of [['areas/act1-blood-moor', 102], ['areas/act1-cold-plains', 103], ['areas/act1-burial-grounds', 104], ['areas/act1-dark-wood', 105], ['areas/act1-catacombs', 106]]) {
    assert.equal(helpers.hasActiveSubAreaRun(), false);
    map.getState().setCurrentLocation(1, area);
    const handle = playback.startEarnedRun({ act: 1, subAreaId: area, mode: 'manual', runSeed: report.seed, challengeOrdinal: ordinal });
    const run = { area, ordinal, handle, waves: [] }; report.runs.push(run);
    for (let index = 0; index < handle.totalWaves; index++) {
      const w = playback.playEarnedWave(handle, index);
      assert.deepEqual(w.actualDelta.addedItems, w.rawRewardDelta.items);
      const ids = itemIds(exportSave()); assert.equal(new Set(ids).size, ids.length);
      run.waves.push({ index, terminalMs: w.terminalSimClockMs, result: w.advanceResult,
        opening: w.opening, finalAllies: w.played.playerTeam, finalEnemies: w.played.enemyTeam,
        rawRewardDelta: w.rawRewardDelta, actualDelta: w.actualDelta, itemObjects: ids.length, uniqueItemIds: new Set(ids).size });
      if (w.opening.outcome.winner !== 'player') {
        assert.equal(w.actualDelta.xp, 0); assert.equal(w.actualDelta.addedItems.length, 0);
        assert.ok(Object.values(w.actualDelta.mercXp).every(x => x === 0));
        assert.ok(Object.values(w.actualDelta.currencies).every(x => x === 0));
      }
      if (w.advanceResult !== 'next-wave') { run.result = w.advanceResult; break; }
    }
    console.log(JSON.stringify({ area, ordinal, result: run.result, waves: run.waves.length }));
    if (run.result !== 'victory') { report.stopReason = 'first route nonwin'; break; }
  }
  report.routeComplete = report.runs.length === 5 && report.runs.every(run => run.result === 'victory');
  report.finalSave = exportSave(); report.finalSaveSha = sha(Buffer.from(encode(report.finalSave)));
  report.finalItems = itemIds(report.finalSave).length;
  assert.equal(report.finalItems - report.initialItems,
    report.runs.flatMap(r => r.waves).reduce((n, w) => n + w.actualDelta.addedItems.length, 0));
  report.itemCountsReconcile = true;
  await writeFile(path.join(root, 'attack-route-final.json'), encode(report.finalSave));
  assert.deepEqual(await sources(), beforeSources); report.sourceHashesUnchanged = true;
} catch (error) {
  report.error = { message: error.message, stack: error.stack }; process.exitCode = 1;
} finally {
  try { helpers?.abortSubAreaRun(); } catch (error) { report.abortError = String(error); }
  if (pity && oldPity !== undefined) pity.setIdleEliteMisses(oldPity);
  for (const restore of restorers.reverse()) restore();
  Date.now = originalNow;
  if (server) await server.close();
  await writeFile(path.join(root, 'attack-route-report.json'), encode(report));
  console.log(JSON.stringify({ stopReason: report.stopReason, error: report.error,
    routeComplete: report.routeComplete, itemCountsReconcile: report.itemCountsReconcile }));
}

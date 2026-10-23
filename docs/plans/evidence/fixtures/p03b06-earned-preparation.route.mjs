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
const report = { kind: 'one original earned L12 equipment-prepared four-map to Catacombs route; not browser or campaign proof',
  head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: wt, encoding: 'utf8' }).trim(),
  inputSha: sha(input), scriptSha: sha(await readFile(fileURLToPath(import.meta.url))),
  node: process.version, pid: process.pid, seed: 2223645302, bonus: 1,
  rules: ['predeclared highest displayed Attack/Defense equipment preparation once; hero before Rogue; no farming/tuning/respec/allocation/harness resource commands/direct XP/idle ticker; automatic production entry intended',
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
  const { aggregateEquipmentMods } = await load('src/engine/progression/equipment-mods.ts');
  const { checkEligibility } = await load('src/features/inventory/compareEquip.ts');
  const score = (item, slot) => aggregateEquipmentMods({ [slot]: item })[slot === 'weapon' ? 'attack' : 'defense'] ?? 0;
  const prep = [];
  const prepare = (owner, slot) => {
    const current = owner === 'hero' ? inventory.getState().equipped[slot] : merc.getState().mercEquipment[fielded.id]?.[slot];
    const allowed = item => {
      const base = bases.get(item.baseId);
      if (base?.slot !== slot) return false;
      if (owner === 'hero') {
        if (slot === 'weapon' && base.handedness !== 'oneHanded') return false;
        const p = player.getState().player;
        if (!checkEligibility(item, { level: p.level, coreStats: p.coreStats, derivedStats: p.derivedStats }, bases).eligible) return false;
      }
      return true;
    };
    const pool = [...inventory.getState().backpack, ...(current ? [current] : [])].filter(allowed);
    assert.ok(pool.length, `No legal ${owner} ${slot} candidate`);
    pool.sort((x, y) => score(y, slot) - score(x, slot) ||
      (x.id === current?.id ? -1 : y.id === current?.id ? 1 : x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
    const chosen = pool[0];
    assert.ok(chosen); assert.equal(chosen.rarity, 'normal'); assert.equal(chosen.affixes?.length ?? 0, 0);
    if (chosen.id !== current?.id) {
      const result = owner === 'hero' ? inventory.getState().equipItem(chosen) : merc.getState().equipOnMerc(fielded.id, slot, chosen);
      assert.deepEqual(result, { ok: true });
    }
    prep.push({ owner, slot, previousId: current?.id ?? null, selectedId: chosen.id,
      baseId: chosen.baseId, previousScore: current ? score(current, slot) : 0, score: score(chosen, slot) });
  };
  for (const slot of ['weapon', 'offhand', 'head', 'chest', 'belt', 'gloves', 'boots']) prepare('hero', slot);
  for (const slot of ['weapon', 'head', 'chest', 'belt', 'gloves', 'boots']) prepare('merc', slot);
  const preparedIds = itemIds(exportSave());
  assert.equal(new Set(preparedIds).size, preparedIds.length); assert.equal(preparedIds.length, report.initialItems);
  assert.deepEqual([...preparedIds].sort(), [...itemIds(toJsonSafe(save))].sort());
  assert.equal(merc.getState().mercEquipment[fielded.id]?.offhand ?? null, null);
  report.preparation = prep;
  report.heroDefense = player.getState().player.derivedStats.defense;
  report.mercStats = mercToCombatUnit(fielded, undefined, merc.getState().mercEquipment[fielded.id]).stats;
  const priority = ['mskill-inner-sight', 'mskill-pierce-arrow', 'mskill-basic-arrow'];
  assert.equal(merc.getState().setSkillOrder(fielded.id, priority), true);
  assert.deepEqual(merc.getState().getFieldedMerc().comboOrder, priority);
  report.preRouteSave = exportSave();
  await writeFile(path.join(root, 'prepared-input.json'), encode({ preparation: report.preparation, save: exportSave() }));
  for (const [area, ordinal] of [['areas/act1-blood-moor', 102], ['areas/act1-cold-plains', 103], ['areas/act1-burial-grounds', 104], ['areas/act1-dark-wood', 105], ['areas/act1-catacombs', 106]]) {
    assert.equal(helpers.hasActiveSubAreaRun(), false);
    map.getState().setCurrentLocation(1, area);
    const handle = playback.startEarnedRun({ act: 1, subAreaId: area, mode: 'manual', runSeed: report.seed, challengeOrdinal: ordinal });
    const run = { area, ordinal, handle, waves: [] }; report.runs.push(run);
    for (let index = 0; index < handle.totalWaves; index++) {
      const w = playback.playEarnedWave(handle, index);
      const hero = w.opening.playerTeam.find(unit => unit.id === player.getState().player.id);
      assert.ok(hero);
      if (index === 0) {
        for (const unit of w.opening.playerTeam) {
          assert.equal(unit.life, unit.stats.lifeMax);
          assert.equal(unit.mana, unit.stats.manaMax);
        }
        assert.equal(hero.manaRegenCarry ?? 0, 0);
        assert.equal(hero.manaRegenCompensation ?? 0, 0);
      } else {
        const previousHero = run.waves.at(-1).finalAllies.find(unit => unit.id === hero.id);
        assert.ok(previousHero);
        assert.equal(hero.life, Math.min(previousHero.life, hero.stats.lifeMax));
        assert.equal(hero.mana, Math.min(previousHero.mana, hero.stats.manaMax));
        assert.equal(hero.manaRegenCarry ?? 0,
          hero.mana >= hero.stats.manaMax ? 0 : previousHero.manaRegenCarry ?? 0);
      }
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
  report.itemCountsReconcile = true; report.entryAndHeroWaveCarryVerified = true;
  await writeFile(path.join(root, 'prepared-route-final.json'), encode(report.finalSave));
  assert.deepEqual(await sources(), beforeSources); report.sourceHashesUnchanged = true;
} catch (error) {
  report.error = { message: error.message, stack: error.stack }; process.exitCode = 1;
} finally {
  try { helpers?.abortSubAreaRun(); } catch (error) { report.abortError = String(error); }
  if (pity && oldPity !== undefined) pity.setIdleEliteMisses(oldPity);
  for (const restore of restorers.reverse()) restore();
  Date.now = originalNow;
  if (server) await server.close();
  await writeFile(path.join(root, 'prepared-route-report.json'), encode(report));
  console.log(JSON.stringify({ stopReason: report.stopReason, error: report.error,
    routeComplete: report.routeComplete, itemCountsReconcile: report.itemCountsReconcile }));
}

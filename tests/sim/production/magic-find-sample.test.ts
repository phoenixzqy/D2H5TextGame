/** Explicit constructed loot sample; no combat, earned campaign or pacing credit. */
import { writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { subAreas } from '@/data/index';
import { loadAwardPools } from '@/data/loaders/loot';
import policy from '../../fixtures/magic-find-rarity-v1.json';
import { createRng, hashSeed } from '@/engine/rng';
import { rollKillRewards, type AwardDataPools, type KillRewardInput } from '@/engine/loot/award';
import { __resetRollItemSeqForTests } from '@/engine/loot/rollItem';
import type { Rarity } from '@/engine/types/items';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing authored MF sample context');
  return value;
}
// Freeze this diagnostic to its MF-only scope. Later guarantee policy changes
// must not contaminate either side of the historical rarity comparison.
const current: AwardDataPools = { ...loadAwardPools(), equipmentGuarantees: new Map() };
const historical: AwardDataPools = { ...current, treasureClasses: new Map(
  [...current.treasureClasses].map(([id, table]) => [id, { ...table, picks: table.picks.map((pick, index) => {
    const band = policy.tables.find(row => row.id === id)?.bands.find(row => row.indices.includes(index));
    return band ? { ...pick, rarity: band.previousRarity as Rarity } : pick;
  }) }])
) };

function sample(input: KillRewardInput, pools: AwardDataPools) {
  const result = { items: 0, rarities: { normal: 0, magic: 0, rare: 0, set: 0, unique: 0, runeword: 0 },
    runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} as Record<string, number> };
  __resetRollItemSeqForTests();
  for (let kill = 0; kill < 1000; kill++) {
    // Paired kill seeds isolate within-kill stream changes, including currencies.
    const rng = createRng(hashSeed(`MF-v1|${input.treasureClassId}|${String(kill)}`));
    const reward = rollKillRewards(input, pools, rng, rng.fork('wishstone:constructed'));
    result.items += reward.items.length;
    for (const item of reward.items) result.rarities[item.rarity]++;
    for (const key of ['runeShards', 'runes', 'gems', 'wishstones'] as const) result[key] += reward[key];
    for (const [id, amount] of Object.entries(reward.materials)) result.materials[id] = (result.materials[id] ?? 0) + amount;
  }
  return result;
}

it('measures six paired real-loot variants in fifteen authored Normal contexts', () => {
  const rows = ([1, 2, 3, 4, 5] as const).flatMap(act => {
    const areas = subAreas.filter(area => area.actId === `acts/act${String(act)}`);
    return (['trash', 'mini', 'boss'] as const).map(kind => {
      const table = kind === 'boss' ? `loot/act${String(act)}-boss` : `loot/${kind}-act${String(act)}`;
      const area = required(areas.find(area => kind === 'trash' ? area.lootTable === table
        : area.waves.some(wave => wave.lootTable === table)));
      const wave = required(area.waves.find(wave => kind === 'trash' ? wave.type === 'trash' : wave.lootTable === table));
      const level = required(wave.encounters?.[0]).level;
      const base = { act, monsterLevel: level, treasureClassId: table, goldFind: 0,
        tier: kind === 'trash' ? 'trash' : kind === 'mini' ? 'boss' : 'chapter-boss' } as const;
      const variants = [[0, 1], [300, 1], [300, 1.5]] as const;
      const before = variants.map(([magicFind, magicFindMultiplier]) => sample({ ...base, magicFind, magicFindMultiplier }, historical));
      const after = variants.map(([magicFind, magicFindMultiplier]) => sample({ ...base, magicFind, magicFindMultiplier }, current));
      expect(before[1]).toEqual(before[0]); expect(before[2]).toEqual(before[0]);
      for (const value of [...before, ...after]) {
        expect(Object.values(value.rarities).reduce((a, b) => a + b, 0)).toBe(value.items);
      }
      const eligibleEquipmentChoices = required(current.treasureClasses.get(table)).picks
        .filter(pick => pick.type === 'item' && pick.qlvlMin <= level && level <= pick.qlvlMax).length;
      // Some actual authored contexts precede their table's first equipment band.
      if (eligibleEquipmentChoices === 0) for (const value of [...before, ...after]) expect(value.items).toBe(0);
      else for (const value of [...before, ...after]) expect(value.items).toBeGreaterThan(0);
      return { area: area.id, ...base, eligibleEquipmentChoices, variants, before, after };
    });
  });
  expect(rows).toHaveLength(15);
  const totals = [0, 1, 2].map(index => rows.reduce((sum, row) => sum + required(row.after[index]).rarities.normal, 0));
  expect(required(totals[1])).toBeLessThan(required(totals[0]));
  expect(required(totals[2])).toBeLessThan(required(totals[1]));
  const output = process.env.MF_SAMPLE_OUTPUT;
  if (output) writeFileSync(output, JSON.stringify({ scope: 'constructed loot-only; no campaign/balance/pacing acceptance',
    killsPerContextVariant: 1000, totalRollKillRewardsCalls: 90000, seedPolicy: 'hashSeed(MF-v1|table|killIndex)', rows }, null, 2) + '\n');
}, 60_000);

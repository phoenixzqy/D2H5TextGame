import { describe, expect, it } from 'vitest';
import { monsters, subAreas } from '@/data';
import { resolveChallengeWavePlan } from '@/engine/combat/sub-area-run';
import { matchRuneword, recipeFromData } from '@/engine/loot/runeword';
import { loadItemBases, loadTreasureClasses } from './loot';
import { socketRunewords } from './socket-effects';

describe('shipped runeword base availability', () => {
  it('gives every recipe a compatible authored base with a reachable normal-item source', () => {
    const bases = loadItemBases(), tables = loadTreasureClasses();
    const fallback = monsters[0];
    if (!fallback) throw new Error('Missing authored campaign monsters');
    const normalSources = new Set<string>();
    for (const subArea of subAreas) for (let challengeOrdinal = 0; challengeOrdinal < 13; challengeOrdinal++) {
      const plan = resolveChallengeWavePlan({ subArea, fallbackArchetypeId: fallback.id,
        fallbackLevel: subArea.areaLevel, seed: 0, challengeOrdinal, mode: 'manual' });
      for (const wave of plan.waves) {
        const table = tables.get(wave.lootTable ?? plan.defaultLootTable);
        for (const spawn of wave.spawns) for (const pick of table?.picks ?? []) {
          if (pick.type === 'item' && pick.rarity === 'normal' && pick.weight > 0 && pick.baseId
            && spawn.level >= pick.qlvlMin && spawn.level <= pick.qlvlMax) normalSources.add(pick.baseId);
        }
      }
    }
    const unavailable = socketRunewords.flatMap(word => {
      const recipe = recipeFromData(word);
      const compatible = [...bases.values()].filter(base => (base.maxSockets ?? 0) >= word.sockets
        && matchRuneword({ baseType: base.type, slot: base.slot,
          ...(base.weaponType ? { weaponType: base.weaponType } : {}),
          sockets: word.sockets, runes: word.runes, isWhiteBase: true }, [recipe]) === word.id);
      return compatible.some(base => normalSources.has(base.id)) ? [] : [{
        word: word.id, compatibleBases: compatible.map(base => base.id)
      }];
    });
    expect(socketRunewords).toHaveLength(35);
    expect(unavailable).toEqual([]);
  });
});

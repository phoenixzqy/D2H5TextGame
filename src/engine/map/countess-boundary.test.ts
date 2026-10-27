/** Constructed malformed-final regressions from independent review; no earned gameplay. */
import { describe, expect, it } from 'vitest';
import { monsters } from '@/data/index';
import { createRng } from '@/engine/rng';
import { buildMonsterUnit } from '@/engine/combat/monster-factory';
import type { WaveSpec } from '@/engine/combat/sub-area-run';
import type { CombatUnit } from '@/engine/combat/types';
import { captureCountessEncounter, hasOriginalCountessVictory } from '@/engine/map/countess-admission';
function fixture() {
  const def = monsters.find(row => row.id === 'monsters/act1.the-countess');
  if (!def) throw new Error('Missing authored Countess');
  const countess = buildMonsterUnit({ def, level: 13, tier: 'boss', rng: createRng(7), id: 'original-countess' });
  const { monsterArchetypeId: _archetype, ...heroBase } = countess;
  const hero: CombatUnit = { ...heroBase, id: 'original-hero', kind: 'hero', side: 'player', life: 7 };
  const wave: WaveSpec = { id: 'constructed-countess', source: { kind: 'questEncounter', encounterId: 'act1-dw-countess' },
    waveTier: 'boss', lootTable: 'loot/act1-boss', spawns: [{ archetypeId: def.id, encounterId: 'act1-dw-countess', tier: 'boss', level: 13, index: 0 }] };
  const encounter = captureCountessEncounter(1, 'areas/act1-dark-wood', wave, [hero], [countess]);
  if (!encounter) throw new Error('Expected canonical capture');
  return { hero, dead: { ...countess, life: 0 }, encounter };
}
describe('Countess final team membership', () => {
  it.each(['hero-wrong-team', 'countess-wrong-team', 'swapped-teams'] as const)('rejects %s despite unchanged side tags', mode => {
    const { hero, dead, encounter } = fixture();
    const finalPlayerTeam = mode === 'hero-wrong-team' ? [] : mode === 'countess-wrong-team' ? [hero, dead] : [dead];
    const finalEnemyTeam = mode === 'hero-wrong-team' ? [hero, dead] : mode === 'countess-wrong-team' ? [] : [hero];
    expect(hasOriginalCountessVictory(encounter, { winner: 'player', finalPlayerTeam, finalEnemyTeam })).toBe(false);
  });
  it('still rejects cross-team duplicates when each original also belongs to its correct team', () => {
    const { hero, dead, encounter } = fixture();
    expect(hasOriginalCountessVictory(encounter, { winner: 'player', finalPlayerTeam: [hero, dead], finalEnemyTeam: [dead] })).toBe(false);
    expect(hasOriginalCountessVictory(encounter, { winner: 'player', finalPlayerTeam: [hero], finalEnemyTeam: [dead, hero] })).toBe(false);
  });
});

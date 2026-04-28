/**
 * Mock player factory used until full character generation lives in the engine.
 * Returns a Player that satisfies the strict types in `engine/types/entities.ts`.
 */
import type { Player } from '@/engine/types/entities';
import type { CoreStats } from '@/engine/types/attributes';
import { deriveStats } from '@/engine/progression/stats';

export type CharacterClass =
  | 'barbarian'
  | 'sorceress'
  | 'necromancer'
  | 'paladin'
  | 'amazon'
  | 'druid'
  | 'assassin';

export interface StatPreview {
  readonly strength: number;
  readonly dexterity: number;
  readonly vitality: number;
  readonly energy: number;
  readonly life: number;
  readonly mana: number;
}

const CLASS_STATS: Record<CharacterClass, StatPreview> = {
  barbarian: { strength: 30, dexterity: 20, vitality: 25, energy: 10, life: 55, mana: 10 },
  // L1 caster nudge — see docs/design/level1-balance.md §4.2.
  // Vitality 10→13 (life 120→126), Energy 35→32 (mana 102→98) to give
  // Sorceress a 5% eHP cushion vs the Blood Moor opening pull.
  sorceress: { strength: 10, dexterity: 25, vitality: 13, energy: 32, life: 40, mana: 35 },
  // Necromancer Vit 15→17 (life 130→134) for the same reason.
  necromancer: { strength: 15, dexterity: 25, vitality: 17, energy: 25, life: 45, mana: 25 },
  paladin: { strength: 25, dexterity: 20, vitality: 25, energy: 15, life: 55, mana: 15 },
  amazon: { strength: 20, dexterity: 25, vitality: 20, energy: 15, life: 50, mana: 15 },
  druid: { strength: 15, dexterity: 20, vitality: 25, energy: 20, life: 55, mana: 20 },
  assassin: { strength: 20, dexterity: 20, vitality: 20, energy: 25, life: 50, mana: 25 },
};

export function getStartingStatPreview(cls: CharacterClass): StatPreview {
  return CLASS_STATS[cls];
}

export const CHARACTER_CLASSES: readonly CharacterClass[] = [
  'barbarian',
  'sorceress',
  'necromancer',
  'paladin',
  'amazon',
  'druid',
  'assassin',
] as const;

export function createMockPlayer(name: string, cls: CharacterClass): Player {
  const stats = CLASS_STATS[cls];
  const coreStats: CoreStats = {
    strength: stats.strength,
    dexterity: stats.dexterity,
    vitality: stats.vitality,
    energy: stats.energy,
  };
  const derivedStats = deriveStats(coreStats, 1);

  return {
    id: `player-${String(Date.now())}`,
    name,
    type: 'player',
    team: 'player',
    level: 1,
    coreStats,
    derivedStats,
    statusEffects: [],
    cooldowns: [],
    skills: [],
    comboOrder: [],
    alive: true,
    turnOrder: 0,
    class: cls,
    experience: 0,
    experienceToNextLevel: 100,
    statPoints: 0,
    skillPoints: 0,
    equipment: [],
  };
}

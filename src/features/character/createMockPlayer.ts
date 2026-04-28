/**
 * Mock player factory used until full character generation lives in the engine.
 * Returns a Player that satisfies the strict types in `engine/types/entities.ts`.
 */
import type { Player } from '@/engine/types/entities';
import type { CoreStats, DerivedStats } from '@/engine/types/attributes';

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
  sorceress: { strength: 10, dexterity: 25, vitality: 10, energy: 35, life: 40, mana: 35 },
  necromancer: { strength: 15, dexterity: 25, vitality: 15, energy: 25, life: 45, mana: 25 },
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
  const derivedStats: DerivedStats = {
    life: stats.life,
    lifeMax: stats.life,
    mana: stats.mana,
    manaMax: stats.mana,
    attack: 10 + stats.dexterity,
    defense: 10 + stats.dexterity,
    attackSpeed: 100,
    castSpeed: 100,
    moveSpeed: 100,
    critChance: 5,
    critDamage: 150,
    physDodge: 0,
    magicDodge: 0,
    blockChance: 0,
    lifeRegen: 0,
    manaRegen: 1,
    magicFind: 0,
    goldFind: 0,
    resistances: {
      fire: 0,
      cold: 0,
      lightning: 0,
      poison: 0,
      arcane: 0,
      physical: 0,
    },
  } as unknown as DerivedStats;

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
  } as Player;
}

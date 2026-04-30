/**
 * Mock player factory used until full character generation lives in the engine.
 * Returns a Player that satisfies the strict types in `engine/types/entities.ts`.
 */
import type { Player } from '@/engine/types/entities';
import type { CoreStats } from '@/engine/types/attributes';
import type { Item } from '@/engine/types/items';
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

const STARTER_COMBO: Record<CharacterClass, readonly string[]> = {
  barbarian: ['barbarian.bash'],
  paladin: ['paladin.holy_fire', 'paladin.zeal'],
  sorceress: ['sorceress.frost_nova', 'sorceress.ice_bolt'],
  amazon: ['amazon.magic_arrow'],
  necromancer: ['necromancer.raise_skeleton'],
  druid: ['druid.summon_dire_wolf', 'druid.firestorm'],
  assassin: ['assassin.shock_web']
};

function createStarterEquipment(cls: CharacterClass): readonly Item[] {
  if (cls !== 'amazon') return [];
  return [{
    id: `starter-amazon-bow-${String(Date.now())}`,
    baseId: 'items/base/weapon-bow',
    rarity: 'normal',
    level: 1,
    identified: true,
    equipped: true,
    equipSlot: 'weapon'
  }];
}

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
    comboOrder: STARTER_COMBO[cls],
    skillLevels: Object.fromEntries(STARTER_COMBO[cls].map((id) => [id, 1])) as Readonly<Record<string, number>>,
    alive: true,
    turnOrder: 0,
    class: cls,
    experience: 0,
    experienceToNextLevel: 100,
    statPoints: 0,
    skillPoints: 1,
    equipment: createStarterEquipment(cls),
  };
}

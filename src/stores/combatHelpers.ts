/**
 * Combat integration helpers
 * Bridge between engine and stores for playability
 */

import { runBattle, type BattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { Player } from '@/engine/types/entities';
import { useCombatStore, type CombatLogEntry } from './combatStore';
import { usePlayerStore } from './playerStore';

/**
 * Convert a Player to a CombatUnit for battle
 */
export function playerToCombatUnit(player: Player): CombatUnit {
  return {
    id: player.id,
    name: player.name,
    side: 'player',
    level: player.level,
    tier: 'trash',
    stats: player.derivedStats,
    life: player.derivedStats.life,
    mana: player.derivedStats.mana,
    statuses: [],
    cooldowns: {},
    skillOrder: player.comboOrder,
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false
  };
}

/**
 * Create a simple enemy unit for testing
 */
export function createSimpleEnemy(level: number): CombatUnit {
  const baseHp = 50 + level * 20;
  const enemyId = `enemy-${String(Date.now())}-${String(Math.random())}`;
  const enemyName = `Fallen Lv${String(level)}`;
  return {
    id: enemyId,
    name: enemyName,
    side: 'enemy',
    level,
    tier: 'trash',
    stats: {
      life: baseHp,
      lifeMax: baseHp,
      mana: 0,
      manaMax: 0,
      attack: 100 + level * 10,
      defense: level * 5,
      attackSpeed: 80,
      critChance: 0.05,
      critDamage: 2,
      physDodge: 0.05,
      magicDodge: 0.05,
      magicFind: 0,
      goldFind: 0,
      resistances: {
        fire: 0,
        cold: 0,
        lightning: 0,
        poison: 0,
        arcane: 0,
        physical: 0
      }
    },
    life: baseHp,
    mana: 0,
    statuses: [],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false
  };
}

/**
 * Convert battle events to combat log entries
 */
export function battleEventToLogEntry(event: BattleEvent): Omit<CombatLogEntry, 'id' | 'timestamp'> | null {
  switch (event.kind) {
    case 'turn-start':
      return {
        type: 'system',
        actorId: 'system',
        actorName: 'System',
        message: `Turn ${String(event.turn)} starts`
      };
    case 'action':
      return {
        type: 'skill',
        actorId: event.actor,
        actorName: event.actor,
        message: `${event.actor} uses ${event.skillId ?? 'basic attack'}`
      };
    case 'damage':
      return {
        type: 'damage',
        actorId: event.source,
        actorName: event.source,
        targetId: event.target,
        targetName: event.target,
        message: `${event.source} deals ${String(event.amount)} ${event.damageType} damage to ${event.target}${event.crit ? ' (CRIT!)' : ''}${event.dodged ? ' (DODGED)' : ''}`,
        value: event.amount
      };
    case 'death':
      return {
        type: 'death',
        actorId: event.target,
        actorName: event.target,
        message: `${event.target} has died`
      };
    case 'heal':
      return {
        type: 'heal',
        actorId: event.target,
        actorName: event.target,
        message: `${event.target} heals for ${String(event.amount)}`,
        value: event.amount
      };
    case 'buff':
      return {
        type: 'buff',
        actorId: event.target,
        actorName: event.target,
        message: `${event.target} gains ${event.buffId}`
      };
    case 'status':
      return {
        type: 'debuff',
        actorId: event.target,
        actorName: event.target,
        message: `${event.target} is afflicted with ${event.statusId}`
      };
    case 'stunned':
      return {
        type: 'system',
        actorId: event.target,
        actorName: event.target,
        message: `${event.target} is stunned and cannot act`
      };
    case 'dot':
      return {
        type: 'damage',
        actorId: event.target,
        actorName: event.target,
        message: `${event.target} takes ${String(event.amount)} DoT damage`,
        value: event.amount
      };
    case 'end':
      return {
        type: 'system',
        actorId: 'system',
        actorName: 'System',
        message: event.winner ? `${event.winner} side wins!` : 'Battle ended in a draw'
      };
    default:
      return null;
  }
}

/**
 * Start a simple battle for testing/demo
 */
export function startSimpleBattle(enemyLevel = 1, enemyCount = 3) {
  const playerState = usePlayerStore.getState();
  const combatState = useCombatStore.getState();
  
  if (!playerState.player) {
    console.warn('No player to start battle');
    return;
  }

  const playerUnit = playerToCombatUnit(playerState.player);
  const enemies: CombatUnit[] = [];
  
  for (let i = 0; i < enemyCount; i++) {
    enemies.push(createSimpleEnemy(enemyLevel));
  }

  // Start combat in the store
  combatState.startCombat([playerUnit], enemies, 1);

  // Run the battle
  const seed = Date.now();
  const result = runBattle({
    seed,
    playerTeam: [playerUnit],
    enemyTeam: enemies
  });

  // Process events into the log
  result.events.forEach((event) => {
    const logEntry = battleEventToLogEntry(event);
    if (logEntry) {
      combatState.addLogEntry(logEntry);
    }
  });

  // Update final unit states from result
  result.playerTeam.forEach((unit: CombatUnit) => {
    combatState.updateUnit(unit.id, () => unit);
  });
  result.enemyTeam.forEach((unit: CombatUnit) => {
    combatState.updateUnit(unit.id, () => unit);
  });

  return result;
}

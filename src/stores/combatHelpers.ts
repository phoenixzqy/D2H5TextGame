/**
 * Combat integration helpers
 * Bridge between engine and stores for playability
 */

import { runBattleRecorded, type BattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { rollKillRewards, type KillRewards } from '@/engine/loot/award';
import { loadAwardPools } from '@/data/loaders/loot';
import { useCombatStore, type CombatLogEntry } from './combatStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { usePlayerStore } from './playerStore';
import { createRng } from '@/engine/rng';

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
    summonedAdds: false,
    kind: 'hero'
  };
}

const ENEMY_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Create a simple enemy unit for testing.
 * @param level monster level
 * @param index optional 0-based index for naming uniqueness ("Fallen A", …)
 */
export function createSimpleEnemy(level: number, index?: number): CombatUnit {
  // Numbers per docs/balance/early-game-spec.md §4 (trash baseline).
  const lvlAbove1 = Math.max(0, level - 1);
  const life = 50 + lvlAbove1 * 16;
  const attack = 32 + lvlAbove1 * 5;
  const defense = 4 + Math.floor(lvlAbove1 * 1.5);
  const enemyId = `enemy-${String(Date.now())}-${String(index ?? 0)}-${String(Math.random())}`;
  const suffix =
    index === undefined
      ? ''
      : ` ${ENEMY_ALPHABET[index] ?? `#${String(index + 1)}`}`;
  const enemyName = `Fallen Lv${String(level)}${suffix}`;
  return {
    id: enemyId,
    name: enemyName,
    side: 'enemy',
    level,
    tier: 'trash',
    stats: {
      life,
      lifeMax: life,
      mana: 0,
      manaMax: 0,
      attack,
      defense,
      attackSpeed: 95,
      critChance: 0.05,
      critDamage: 1.5,
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
    life,
    mana: 0,
    statuses: [],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false,
    kind: 'monster'
  };
}

/**
 * Convert battle events to combat log entries
 * @param event - The battle event to convert
 * @param unitMap - Optional map of unit IDs to names for display
 */
export function battleEventToLogEntry(
  event: BattleEvent,
  unitMap?: ReadonlyMap<string, string>
): Omit<CombatLogEntry, 'id' | 'timestamp'> | null {
  const getName = (id: string): string => unitMap?.get(id) ?? id;

  switch (event.kind) {
    case 'turn-start':
      return {
        type: 'system',
        actorId: 'system',
        actorName: 'System',
        message: `Turn ${String(event.turn)} starts`
      };
    case 'action': {
      const actorName = getName(event.actor);
      return {
        type: 'skill',
        actorId: event.actor,
        actorName,
        message: `${actorName} uses ${event.skillId ?? 'basic attack'}`
      };
    }
    case 'damage': {
      const sourceName = getName(event.source);
      const targetName = getName(event.target);
      return {
        type: 'damage',
        actorId: event.source,
        actorName: sourceName,
        targetId: event.target,
        targetName,
        message: `${sourceName} deals ${String(event.amount)} ${event.damageType} damage to ${targetName}${event.crit ? ' (CRIT!)' : ''}${event.dodged ? ' (DODGED)' : ''}`,
        value: event.amount
      };
    }
    case 'death': {
      const targetName = getName(event.target);
      return {
        type: 'death',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} has died`
      };
    }
    case 'heal': {
      const targetName = getName(event.target);
      return {
        type: 'heal',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} heals for ${String(event.amount)}`,
        value: event.amount
      };
    }
    case 'buff': {
      const targetName = getName(event.target);
      return {
        type: 'buff',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} gains ${event.buffId}`
      };
    }
    case 'status': {
      const targetName = getName(event.target);
      return {
        type: 'debuff',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} is afflicted with ${event.statusId}`
      };
    }
    case 'stunned': {
      const targetName = getName(event.target);
      return {
        type: 'system',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} is stunned and cannot act`
      };
    }
    case 'dot': {
      const targetName = getName(event.target);
      return {
        type: 'damage',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} takes ${String(event.amount)} DoT damage`,
        value: event.amount
      };
    }
    case 'summon': {
      const ownerName = getName(event.owner);
      return {
        type: 'system',
        actorId: event.owner,
        actorName: ownerName,
        message: `${ownerName} summons ${event.unit.name}`
      };
    }
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
 * Award post-victory loot for a list of slain enemies. Pure dispatcher:
 * rolls items + currencies via the engine and pushes them into the
 * inventory store. Returns the aggregated rewards so the UI can render a
 * loot summary panel.
 */
export function awardLootForVictory(opts: {
  readonly slainEnemies: readonly CombatUnit[];
  readonly act: 1 | 2 | 3 | 4 | 5;
  readonly treasureClassId: string;
  readonly seed: number;
}): KillRewards {
  const player = usePlayerStore.getState().player;
  const magicFind = player?.derivedStats.magicFind ?? 0;
  const goldFind = player?.derivedStats.goldFind ?? 0;
  const pools = loadAwardPools();
  const rng = createRng(opts.seed >>> 0);
  const inv = useInventoryStore.getState();

  const items: Item[] = [];
  let runeShards = 0;
  let runes = 0;
  let gems = 0;
  let wishstones = 0;

  for (const enemy of opts.slainEnemies) {
    const r = rollKillRewards(
      {
        tier: enemy.tier,
        monsterLevel: enemy.level,
        treasureClassId: opts.treasureClassId,
        magicFind,
        goldFind,
        act: opts.act,
        difficulty: 'normal'
      },
      pools,
      rng
    );
    for (const it of r.items) {
      items.push(it);
      inv.addItem(it);
    }
    runeShards += r.runeShards;
    runes += r.runes;
    gems += r.gems;
    wishstones += r.wishstones;
  }

  const totalRuneShards = runeShards + runes;
  if (totalRuneShards > 0) inv.addCurrency('rune-shard', totalRuneShards);
  if (gems > 0) inv.addCurrency('gem-shard', gems);
  if (wishstones > 0) inv.addCurrency('wishstone', wishstones);

  return { items, runeShards, runes, gems, wishstones };
}

/**
 * Start a simple battle for testing/demo. Uses the recorded-event API so
 * the UI can animate playback over time. Returns the engine's
 * {@link CombatResult}-shaped object plus rolled rewards (if any).
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
    enemies.push(createSimpleEnemy(enemyLevel, enemyCount > 1 ? i : undefined));
  }

  // Run the battle — fully resolved synchronously.
  const seed = Date.now();
  const { events, result } = runBattleRecorded({
    seed,
    playerTeam: [playerUnit],
    enemyTeam: enemies
  });

  // On victory, roll loot for every slain enemy and dispatch into inventory.
  let rewards: KillRewards | undefined;
  if (result.winner === 'player') {
    const slain = result.enemyTeam.filter(
      (u) => u.life <= 0 && u.kind !== 'summon'
    );
    const mapState = useMapStore.getState();
    const act = (Math.min(5, Math.max(1, mapState.currentAct)) as 1 | 2 | 3 | 4 | 5);
    const treasureClassId = `loot/trash-act${String(act)}`;
    rewards = awardLootForVictory({
      slainEnemies: slain,
      act,
      treasureClassId,
      seed: seed ^ 0x9e3779b1
    });
  }

  // Build unit ID → name map from result units (final names; ids are stable).
  const unitMap = new Map<string, string>();
  [...result.playerTeam, ...result.enemyTeam].forEach((unit) => {
    unitMap.set(unit.id, unit.name);
  });

  // Hand the recorded battle to the store; UI will tick playback.
  combatState.setRecordedBattle({
    initialPlayerTeam: [playerUnit],
    initialEnemyTeam: enemies,
    events,
    unitNameMap: unitMap,
    outcome: {
      winner: result.winner,
      finalPlayerTeam: result.playerTeam,
      finalEnemyTeam: result.enemyTeam,
      ...(rewards ? { rewards } : {})
    }
  });

  return { ...result, rewards };
}

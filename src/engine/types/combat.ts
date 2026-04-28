/**
 * Combat system types
 * @module engine/types/combat
 */

import type { Unit } from './entities';
import type { Item } from './items';
import type { DamageType } from './attributes';

/**
 * Combat state - immutable snapshot of an ongoing battle
 */
export interface CombatState {
  readonly turn: number;
  readonly phase: 'ongoing' | 'victory' | 'defeat';
  
  /** Player team units */
  readonly playerUnits: readonly Unit[];
  
  /** Enemy team units */
  readonly enemyUnits: readonly Unit[];
  
  /** Turn order - unit IDs in order of action this turn */
  readonly turnOrder: readonly string[];
  
  /** Current actor index in turn order */
  readonly currentActorIndex: number;
  
  /** Combat log */
  readonly events: readonly CombatEvent[];
  
  /** Random seed for this combat */
  readonly seed: number;
}

/**
 * Combat event - typed union for all combat log events
 */
export type CombatEvent =
  | TurnStartEvent
  | AttackEvent
  | DamageEvent
  | CritEvent
  | DodgeEvent
  | StatusAppliedEvent
  | StatusTickEvent
  | StatusExpiredEvent
  | HealEvent
  | ManaEvent
  | DeathEvent
  | LootEvent
  | VictoryEvent
  | DefeatEvent
  | SkillCastEvent
  | SummonEvent;

/**
 * Base event properties
 */
interface BaseEvent {
  readonly type: string;
  readonly turn: number;
  readonly timestamp: number;
}

/**
 * Turn start event
 */
export interface TurnStartEvent extends BaseEvent {
  readonly type: 'turn-start';
  readonly turn: number;
}

/**
 * Attack event
 */
export interface AttackEvent extends BaseEvent {
  readonly type: 'attack';
  readonly attackerId: string;
  readonly targetId: string;
  readonly skillId?: string; // undefined = basic attack
  readonly hit: boolean;
}

/**
 * Damage event
 */
export interface DamageEvent extends BaseEvent {
  readonly type: 'damage';
  readonly targetId: string;
  readonly sourceId: string;
  readonly damage: number;
  readonly damageType: DamageType;
  readonly mitigated: number; // damage reduced by resist/armor
  readonly overkill: number; // damage beyond 0 HP
}

/**
 * Critical hit event
 */
export interface CritEvent extends BaseEvent {
  readonly type: 'crit';
  readonly attackerId: string;
  readonly targetId: string;
  readonly multiplier: number;
}

/**
 * Dodge event
 */
export interface DodgeEvent extends BaseEvent {
  readonly type: 'dodge';
  readonly dodgerId: string;
  readonly attackerId: string;
  readonly dodgeType: 'physical' | 'magic';
}

/**
 * Status applied event
 */
export interface StatusAppliedEvent extends BaseEvent {
  readonly type: 'status-applied';
  readonly targetId: string;
  readonly sourceId: string;
  readonly statusId: string;
  readonly stacks: number;
  readonly duration: number;
}

/**
 * Status tick event (DoT damage)
 */
export interface StatusTickEvent extends BaseEvent {
  readonly type: 'status-tick';
  readonly targetId: string;
  readonly statusId: string;
  readonly damage?: number;
}

/**
 * Status expired event
 */
export interface StatusExpiredEvent extends BaseEvent {
  readonly type: 'status-expired';
  readonly targetId: string;
  readonly statusId: string;
}

/**
 * Heal event
 */
export interface HealEvent extends BaseEvent {
  readonly type: 'heal';
  readonly targetId: string;
  readonly sourceId: string;
  readonly amount: number;
  readonly overheal: number; // healing beyond max HP
}

/**
 * Mana event
 */
export interface ManaEvent extends BaseEvent {
  readonly type: 'mana';
  readonly targetId: string;
  readonly sourceId: string;
  readonly amount: number; // positive = restore, negative = consume
}

/**
 * Death event
 */
export interface DeathEvent extends BaseEvent {
  readonly type: 'death';
  readonly unitId: string;
  readonly killerId?: string;
}

/**
 * Loot event
 */
export interface LootEvent extends BaseEvent {
  readonly type: 'loot';
  readonly items: readonly Item[];
  readonly gold?: number;
}

/**
 * Victory event
 */
export interface VictoryEvent extends BaseEvent {
  readonly type: 'victory';
  readonly experience: number;
  readonly loot: readonly Item[];
}

/**
 * Defeat event
 */
export interface DefeatEvent extends BaseEvent {
  readonly type: 'defeat';
}

/**
 * Skill cast event
 */
export interface SkillCastEvent extends BaseEvent {
  readonly type: 'skill-cast';
  readonly casterId: string;
  readonly skillId: string;
  readonly targetIds: readonly string[];
  readonly cost?: {
    readonly mana?: number;
    readonly life?: number;
  };
}

/**
 * Summon event
 */
export interface SummonEvent extends BaseEvent {
  readonly type: 'summon';
  readonly summonerId: string;
  readonly summonId: string;
  readonly summonUnitId: string;
}

import rows from '../../data/skills/mercenary.json';
import type { CombatUnit } from '../combat/types';
import type { SkillDef } from '../types/skills';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();

/** Copy validated authored party capacity tuning without retaining caller-owned data. */
export function resolveMercBattleOrders(source: readonly unknown[]): {
  readonly definition: { readonly minLevel: number; readonly maxRank: number; readonly lifePct: number; readonly manaPct: number };
  readonly skill: RegisteredSkill;
} {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'aura-battle-orders');
  if (matches.length !== 1) throw new Error('Expected exactly one native mercenary Battle Orders');
  const row = matches[0];
  if (!validate(row) || !row.mercBattleOrders) throw new Error('Invalid native mercenary Battle Orders');
  return Object.freeze({
    definition: Object.freeze({ minLevel: row.minLevel, maxRank: row.maxLevel,
      lifePct: row.mercBattleOrders.lifePct / 100, manaPct: row.mercBattleOrders.manaPct / 100 }),
    skill: Object.freeze({ id: row.id, archetype: 'mercenary', trigger: 'passive',
      target: row.target, minLevel: row.minLevel, manaCost: 0, cooldown: row.cooldown,
      effects: Object.freeze([]) })
  });
}
const authored = resolveMercBattleOrders(rows);
/** Percent additions over fresh personal capacity, converted once from authored JSON. */
export const MERC_BATTLE_ORDERS_DEFINITION = authored.definition;
/** Living presence consumes no action, mana or cooldown. */
export const MERC_BATTLE_ORDERS_SKILL = authored.skill;

/** Require factory qualification and live canonical original-party mercenary identity. */
export function isMercBattleOrdersSource(unit: CombatUnit): boolean {
  return unit.mercBattleOrders === true && unit.id.split('#')[0] === 'merc-mercs/act5-barbarian-battle-orders' &&
    unit.side === 'player' && unit.kind === 'merc' && unit.summon !== true &&
    unit.ownerId === undefined && unit.summonOwnerId === undefined && unit.summonTemplateId === undefined &&
    Number.isFinite(unit.life) && unit.life > 0 && Number.isInteger(unit.level) &&
    unit.level >= MERC_BATTLE_ORDERS_DEFINITION.minLevel && unit.skillOrder.includes('aura-battle-orders');
}

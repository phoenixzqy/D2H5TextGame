import Ajv2020 from 'ajv/dist/2020';
import tuning from '@/data/combat/assassin-flight.json';
import { compileAuthoredValidator } from '../../data/authored-validators';
import rows from '@/data/skills/assassin.json';
import type { SkillDef } from '../types/skills';
import { createSkillValidator } from './skill-validator';
import { matchesAssassinMartialSkill } from './assassin-charges';
import { registeredSkillFromJson } from './dataCatalog';
import { validCapturedSkillRank } from './effective-rank';

/** Exact registered Flight identity; aliases never create paid state. */
export const ASSASSIN_FLIGHT_ID = 'assassin.dragon_flight';
/** Presentation-only identity for a privately paid blink. */
export const ASSASSIN_FLIGHT_STATUS_ID = 'dragon-flight';
const DATA_ID = 'skills-assassin-dragon-flight';
const validateSource = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
const candidates = rows.filter(row => row.id === DATA_ID), source = candidates[0];
if (candidates.length !== 1 || !validateSource(source) || source.trigger !== 'active' ||
  source.target !== 'single-enemy') throw new Error('Invalid authored Assassin Flight source');
const maxRank = source.maxLevel, requiredLevel = source.requiredLevel;
interface FlightTuning {
  readonly id: 'combat/assassin-flight';
  readonly durationMs: number;
  readonly magicDodgePerRank: number;
}
const validate = compileAuthoredValidator<FlightTuning>(new Ajv2020({ strict: true, allErrors: true }), 'flight');
/** Validate finite closed tuning, including the maximum genuine paid Command rank. */
export function resolveAssassinFlightTuning(input: unknown): FlightTuning {
  if (!validate(input) || input.magicDodgePerRank * (maxRank + 1) > 1)
    throw new Error('Invalid authored Assassin Flight');
  return Object.freeze({ ...input });
}
/** Immutable JSON-owned evasion; importing this definition grants no paid window. */
export const ASSASSIN_FLIGHT_DEFINITION = Object.freeze({
  ...resolveAssassinFlightTuning(tuning), maxRank, requiredLevel
});
/** Recognize only the authored data alias and complete canonical runtime identity. */
export function isAssassinFlightId(id: string): boolean {
  return id === ASSASSIN_FLIGHT_ID || id === DATA_ID;
}
/** Additive magical dodge from a captured paid rank; bare effective21 needs provenance. */
export function assassinFlightDodge(rank: number, rankBonus?: 1): number {
  return validCapturedSkillRank(rank, maxRank, rankBonus)
    ? rank * ASSASSIN_FLIGHT_DEFINITION.magicDodgePerRank : 0;
}
/** Read-only blink values shared by actual combat tuning and localized rank previews. */
export interface AssassinFlightDisplay {
  readonly durationSeconds: number;
  readonly magicDodgePercent: number;
}
/** Reject incomplete or altered templates before showing an implemented blink promise. */
export function resolveAssassinFlightDisplay(input: unknown, rank: number): AssassinFlightDisplay | undefined {
  if (!validateSource(input) || input.id !== DATA_ID || input.trigger !== 'active' ||
    input.target !== 'single-enemy' || input.maxLevel !== maxRank || !validCapturedSkillRank(rank, maxRank) ||
    !matchesAssassinMartialSkill(registeredSkillFromJson({ ...input, trigger: 'active', target: 'single-enemy' })))
    return undefined;
  return Object.freeze({ durationSeconds: ASSASSIN_FLIGHT_DEFINITION.durationMs / 1000,
    magicDodgePercent: Number((assassinFlightDodge(rank) * 100).toFixed(4)) });
}

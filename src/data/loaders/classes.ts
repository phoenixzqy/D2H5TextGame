/** Schema-validated class starter recipes; preparation never grants inventory. */
import Ajv2020 from 'ajv/dist/2020';
import classSchema from '@/data/schema/class.schema.json';
import amazon from '@/data/classes/amazon.json';
import assassin from '@/data/classes/assassin.json';
import barbarian from '@/data/classes/barbarian.json';
import druid from '@/data/classes/druid.json';
import necromancer from '@/data/classes/necromancer.json';
import paladin from '@/data/classes/paladin.json';
import sorceress from '@/data/classes/sorceress.json';
import { loadItemBases } from './loot';

/** Authored fixed roll for a fresh normal weapon. No rarity or template overrides. */
export interface StarterWeaponRecipe {
  readonly baseId: string;
  readonly baseRolls: { readonly attack: number };
}

interface ClassStarterDocument {
  readonly id: string;
  readonly starterWeapon?: StarterWeaponRecipe;
}

const documents = { amazon, assassin, barbarian, druid, necromancer, paladin, sorceress };
const ajv = new Ajv2020({ strict: true, allErrors: true });
const validateClass = ajv.compile<ClassStarterDocument>(classSchema);

/**
 * Validate the complete requested class document and weapon reference.
 * Omission is an empty kit; malformed authored data throws with field context.
 */
export function loadClassStarterWeapon(cls: keyof typeof documents): StarterWeaponRecipe | undefined {
  const document: unknown = documents[cls];
  const context = `classes/${cls}.json`;
  if (!validateClass(document)) {
    throw new Error(`${context}: ${ajv.errorsText(validateClass.errors, { dataVar: context })}`);
  }
  if (document.id !== `classes/${cls}`) {
    throw new Error(`${context} id: expected classes/${cls}, received ${document.id}`);
  }
  const recipe = document.starterWeapon;
  if (!recipe) return undefined;

  const base = loadItemBases().get(recipe.baseId);
  const field = `${context} starterWeapon`;
  if (!base || base.type !== 'weapon' || base.slot !== 'weapon' || base.reqLevel !== 1 || !base.baseDamage) {
    throw new Error(`${field}.baseId: ${recipe.baseId} must resolve to a level-1 weapon with base damage`);
  }
  if (recipe.baseRolls.attack < base.baseDamage.min || recipe.baseRolls.attack > base.baseDamage.max) {
    throw new Error(`${field}.baseRolls.attack: must be within ${String(base.baseDamage.min)}–${String(base.baseDamage.max)}`);
  }
  return recipe;
}

/** Canonical schema-validated starting core for refunds; unknown classes refuse. */
export function loadClassStartingStats(cls: string) {
  if (!Object.hasOwn(documents, cls)) throw new Error('Unknown reset class');
  const key = cls as keyof typeof documents;
  loadClassStarterWeapon(key);
  return { ...documents[key].startingStats };
}

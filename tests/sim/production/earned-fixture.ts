import Ajv from 'ajv';
import { canonicalJson, fingerprintEntries } from './fixture';

/** Explicit attribute spending, never replacement character statistics. */
export type EarnedStatDeltas = Readonly<
  Record<'strength' | 'dexterity' | 'vitality' | 'energy', number>
>;

/** Select an original earned item by meaning and acquisition order. */
export interface EarnedItemSelector {
  readonly baseId: string;
  readonly rarity: 'normal';
  readonly defense: number;
  readonly selection: 'first-acquired';
}

/** Closed recipe commands; production execution must still prove eligibility and success. */
export type EarnedAction =
  | { readonly kind: 'hire-merc'; readonly mercId: string }
  | { readonly kind: 'allocate-skill'; readonly skillId: string; readonly points: number }
  | { readonly kind: 'set-combo'; readonly skillIds: readonly string[] }
  | {
      readonly kind: 'farm-first-waves';
      readonly subAreaId: 'areas/act1-blood-moor';
      readonly count: number;
      readonly firstChallengeOrdinal: 0;
    }
  | { readonly kind: 'allocate-stats'; readonly deltas: EarnedStatDeltas }
  | {
      readonly kind: 'equip-earned';
      readonly owner: 'hero';
      readonly slot: 'gloves' | 'boots';
      readonly selector: EarnedItemSelector;
    }
  | {
      readonly kind: 'equip-earned';
      readonly owner: 'merc';
      readonly mercId: string;
      readonly slot: 'gloves' | 'boots';
      readonly selector: EarnedItemSelector;
    }
  | { readonly kind: 'accept-quest'; readonly questId: 'quests/act1-den-of-evil' }
  | { readonly kind: 'checkpoint'; readonly id: string };

/** Fresh creation plus bounded ordered acquisition actions, without supplied state. */
export interface EarnedFixture {
  readonly fixtureVersion: 2;
  readonly id: string;
  readonly origin: {
    readonly kind: 'new-character';
    readonly classId: 'sorceress';
    readonly name: string;
    readonly policy: 'production-creation-defaults';
  };
  readonly clockEpochMs: number;
  readonly seeds: readonly number[];
  readonly acquisitionSeedPolicy: 'production-clock';
  readonly actions: readonly EarnedAction[];
  readonly scenario: {
    readonly act: 1;
    readonly subAreaId: 'areas/act1-den-of-evil';
    readonly mode: 'manual';
    readonly challengeOrdinal: number;
    readonly idleEliteMisses: 0;
  };
  readonly mercPolicy: 'recipe-actions';
  readonly summonPolicy: 'production-default';
}

/** Current catalogs; mercs must be flattened loadMercHireRoster rows, not the gacha pool. */
export interface EarnedFixtureReferences {
  readonly classes: readonly { readonly id: string }[];
  readonly areas: readonly { readonly id: string; readonly actId: string }[];
  readonly skills: readonly { readonly id: string; readonly trigger: string }[];
  readonly mercs: readonly { readonly id: string }[];
  readonly bases: readonly { readonly id: string; readonly slot: string }[];
  readonly quests: readonly { readonly id: string; readonly actId: string }[];
}

const ajv = new Ajv({ strict: true, strictNumbers: true });
const text = { type: 'string', minLength: 1 };
const slug = { type: 'string', pattern: '^[a-z0-9][a-z0-9-]*$' };
const integer = (minimum: number, maximum: number) => ({ type: 'integer', minimum, maximum });
const strictObject = (properties: Record<string, object>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false
});
const equipment = {
  kind: { const: 'equip-earned' },
  slot: { enum: ['gloves', 'boots'] },
  selector: strictObject({
    baseId: text,
    rarity: { const: 'normal' },
    defense: integer(0, 1000),
    selection: { const: 'first-acquired' }
  })
};
const validateFixture = ajv.compile<EarnedFixture>(
  strictObject({
    fixtureVersion: { const: 2 },
    id: slug,
    origin: strictObject({
      kind: { const: 'new-character' },
      classId: { const: 'sorceress' },
      name: { ...text, maxLength: 40 },
      policy: { const: 'production-creation-defaults' }
    }),
    clockEpochMs: integer(0, Number.MAX_SAFE_INTEGER),
    seeds: {
      type: 'array',
      minItems: 1,
      maxItems: 8,
      uniqueItems: true,
      items: integer(0, 4294967295)
    },
    acquisitionSeedPolicy: { const: 'production-clock' },
    actions: {
      type: 'array',
      minItems: 1,
      maxItems: 32,
      items: {
        oneOf: [
          strictObject({ kind: { const: 'hire-merc' }, mercId: text }),
          strictObject({
            kind: { const: 'allocate-skill' },
            skillId: text,
            points: integer(1, 20)
          }),
          strictObject({
            kind: { const: 'set-combo' },
            skillIds: {
              type: 'array',
              minItems: 0,
              maxItems: 9,
              uniqueItems: true,
              items: text
            }
          }),
          strictObject({
            kind: { const: 'farm-first-waves' },
            subAreaId: { const: 'areas/act1-blood-moor' },
            count: integer(1, 40),
            firstChallengeOrdinal: { const: 0 }
          }),
          strictObject({
            kind: { const: 'allocate-stats' },
            deltas: strictObject({
              strength: integer(0, 25),
              dexterity: integer(0, 25),
              vitality: integer(0, 25),
              energy: integer(0, 25)
            })
          }),
          strictObject({ ...equipment, owner: { const: 'hero' } }),
          strictObject({ ...equipment, owner: { const: 'merc' }, mercId: text }),
          strictObject({
            kind: { const: 'accept-quest' },
            questId: { const: 'quests/act1-den-of-evil' }
          }),
          strictObject({ kind: { const: 'checkpoint' }, id: slug })
        ]
      }
    },
    scenario: strictObject({
      act: { const: 1 },
      subAreaId: { const: 'areas/act1-den-of-evil' },
      mode: { const: 'manual' },
      challengeOrdinal: integer(1, 40),
      idleEliteMisses: { const: 0 }
    }),
    mercPolicy: { const: 'recipe-actions' },
    summonPolicy: { const: 'production-default' }
  })
);

/** Parse structure and current references only; never grant state or claim affordability. */
export function parseEarnedFixture(
  input: unknown,
  references: EarnedFixtureReferences
): EarnedFixture {
  if (!validateFixture(input)) {
    throw new Error(`Invalid earned fixture: ${ajv.errorsText(validateFixture.errors)}`);
  }
  if (!references.classes.some((entry) => entry.id === `classes/${input.origin.classId}`)) {
    throw new Error('Missing production Sorceress class');
  }
  for (const id of ['areas/act1-blood-moor', input.scenario.subAreaId]) {
    if (!references.areas.some((entry) => entry.id === id && entry.actId === 'acts/act1')) {
      throw new Error(`Unknown production area or mismatched act: ${id}`);
    }
  }
  const farmActions = input.actions.filter((action) => action.kind === 'farm-first-waves');
  if (farmActions.length !== 1 || farmActions[0]?.count !== input.scenario.challengeOrdinal) {
    throw new Error('Exactly one farm count must match the target challenge ordinal');
  }
  const checkpoints = new Set<string>();
  const requireMerc = (id: string): void => {
    if (!references.mercs.some((entry) => entry.id === id))
      throw new Error(`Unknown hire-roster merc: ${id}`);
  };
  const requireSkill = (id: string, active: boolean): void => {
    const skill = references.skills.find((entry) => entry.id === id);
    if (!id.startsWith('skills-sorceress-') || !skill || (active && skill.trigger !== 'active')) {
      throw new Error(`Unknown or unsupported Sorceress skill: ${id}`);
    }
  };
  for (const action of input.actions) {
    switch (action.kind) {
      case 'hire-merc':
        requireMerc(action.mercId);
        break;
      case 'allocate-skill':
        requireSkill(action.skillId, false);
        break;
      case 'set-combo':
        action.skillIds.forEach((id) => requireSkill(id, true));
        break;
      case 'allocate-stats': {
        const sum = Object.values(action.deltas).reduce((total, value) => total + value, 0);
        if (sum < 1 || sum > 25) throw new Error('Attribute spending must total 1–25 points');
        break;
      }
      case 'equip-earned': {
        if (action.owner === 'merc') requireMerc(action.mercId);
        if (
          !references.bases.some(
            (base) => base.id === action.selector.baseId && base.slot === action.slot
          )
        ) {
          throw new Error('Unknown item base or mismatched equipment slot');
        }
        break;
      }
      case 'accept-quest':
        if (
          !references.quests.some(
            (quest) => quest.id === action.questId && quest.actId === 'acts/act1'
          )
        ) {
          throw new Error('Unknown production quest or mismatched act');
        }
        break;
      case 'checkpoint':
        if (checkpoints.has(action.id)) throw new Error(`Duplicate checkpoint: ${action.id}`);
        checkpoints.add(action.id);
        break;
      case 'farm-first-waves':
        break;
    }
  }
  return structuredClone(input);
}

/** Hash the entire validated recipe with the existing canonical path/byte protocol. */
export function fingerprintEarnedFixture(fixture: EarnedFixture): string {
  return fingerprintEntries([
    { path: 'fixture.json', bytes: new TextEncoder().encode(canonicalJson(fixture)) }
  ]);
}

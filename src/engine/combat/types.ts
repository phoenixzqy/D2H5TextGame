/**
 * Combat-internal types used by the deterministic combat resolver.
 *
 * These are **runtime** combat units distinct from the persistent {@link import('../types/entities').Unit}
 * type, because combat needs mutable HP/mana/buff state per turn.
 *
 * @module engine/combat/types
 */

import type { DamageType, DerivedStats, Resistances } from '../types/attributes';
import type { ComboTag } from '../types/skills';
import type { WeaponType, Handedness } from '../types/items';
import type { GovernedActiveRanks } from '../skills/runeword-actives';

/** Tag a unit's "side" in combat. */
export type CombatSide = 'player' | 'enemy';

/** Tier of a monster — drives loot/affix/enrage rules. */
export type MonsterTier = 'trash' | 'elite' | 'champion' | 'rare-elite' | 'rare-minion' | 'boss' | 'chapter-boss';

/** Integer battle-grid position. Used for presentation and AOE targeting only. */
export interface GridPosition {
  readonly row: number;
  readonly col: number;
}

/** Active status effect on a combat unit. */
export interface ActiveStatus {
  /** Paid finite target-redirection authority; valid only under its own exact status identity. */
  readonly targetCurse?: 'confuse' | 'attract';
  /** Copied paid finite Dim Vision accuracy potency; bare markers grant no blindness. */
  readonly dimVision?: { readonly physicalHitChanceReductionPct: number };
  /** Paid finite Terror fear; transient and bounded by authored tier timing. */
  readonly terror?: true;
  /** Copied paid finite damage-curse potency; transient and exact-identity checked. */
  readonly damageCurse?: { readonly id: 'iron-maiden' | 'life-tap' | 'lower-resist'; readonly percent: number };
  /** Complete paid finite Decrepify potency; never persisted or inferred from a marker. */
  readonly decrepify?: { readonly attackSpeedReductionPct: number; readonly damageReductionPct: number };
  /** Immutable paid finite Weaken potency; bare markers grant no damage reduction. */
  readonly weaken?: { readonly damageReductionPct: number };
  /** Paid personal Teleport/Enchant; Enchant also captures normal Attack at cast. */
  readonly sorceressBuff?: { readonly rank: number; readonly attack?: number };
  /** Paid rank of a finite persistent spell; source and phase use this status's standard fields. */
  readonly periodicSpell?: { readonly rank: number };
  /** Copied finite enemy debuff potency, captured by one paid Battle Cry. */
  readonly battleCry?: { readonly rank: number; readonly rankBonus?: 1; readonly damageReductionPct: number; readonly defenseReductionPct: number };
  /** Source-bound paid finite Concentrate Defense; never persisted. */
  readonly concentrate?: { readonly rank: number; readonly rankBonus?: 1; readonly defensePct: number };
  /** Source-bound paid Leap potency; finite, personal and never persisted. */
  readonly leap?: { readonly rank: number; readonly rankBonus?: 1; readonly physicalDamagePct: number };
  /** Source-bound finite personal Cloak potency, independent of Burst's paid payload. */
  readonly cloakOfShadows?: { readonly rank: number; readonly defensePct: number;
    readonly critChancePct: number; readonly magicDodgePct: number };
  /** Authenticated finite self Feral speed; bare enemy markers confer no power. */
  readonly feralRage?: true;
  /** Authenticated finite self Frenzy speed; never persisted. */
  readonly frenzy?: true;
  /** Transient one-time Cleansing reduction; follows this record across waves, never saved. */
  readonly cleansingShortened?: true;
  readonly id: string;
  readonly stacks: number;
  /**
   * Remaining duration in turns (legacy turn-based callers); -1 = permanent.
   * The combat engine now drives expiry via {@link expiresAtMs}; the `remaining`
   * field is preserved for non-combat callers (analyzers, tests) using the
   * round-based {@link tickStatuses} helper.
   */
  readonly remaining: number;
  /**
   * Absolute simulation-time (ms) at which the status expires. When set, the
   * combat engine drops the status as soon as `simClockMs >= expiresAtMs`.
   * Undefined for legacy turn-based statuses or permanent statuses.
   */
  readonly expiresAtMs?: number;
  /** Inclusive simulation-time start; omitted legacy records start at battle entry. */
  readonly appliedAtMs?: number;
  /** Amplify Damage's physical resistance reduction in percentage points. */
  readonly physicalResistReductionPct?: number;
  /**
   * Damage per stack per **second** (for DoTs).
   *
   * NOTE: historically this was "per round/tick". With the timeline scheduler,
   * DoT chunks are computed proportionally to elapsed sim-time, so this value
   * is now interpreted as damage-per-second. Existing data values stay
   * numerically the same — they just represent a slower per-second rate.
   */
  readonly dotPerStack?: number;
  /** Damage type for DoT damage. */
  readonly damageType?: DamageType;
  /** Source unit ID. */
  readonly sourceId: string;
  /** Tags relevant to combo lookup. */
  readonly tags?: readonly ComboTag[];
  /** Immutable paid stat potency; only its exact skill/status consumer may use it. */
  readonly statBuff?: { readonly rank: number; readonly attackSpeedPct: number; readonly physDodgePct: number };
  /** Finite personal Bone Armor pool, captured once at fresh run entry; never persisted. */
  readonly boneArmor?: { readonly rank: number; readonly remaining: number };
}

/** Combat-time unit. Immutable; updates produce new instances. */
export interface CombatUnit {
  /** Same fresh native composition at baseline/+1; only actual paid Command selects a profile. */
  readonly battleCommandPassives?: {
    readonly baseline: import('../skills/battle-command').BattleCommandPassiveProfile;
    readonly boosted: import('../skills/battle-command').BattleCommandPassiveProfile;
  };
  /** Native learned Command authority, independent of temporary paid recipient state. */
  readonly battleCommandRank?: number;
  /** Fresh learned native Hydra eligibility; paid bodies are bound privately inside each battle. */
  readonly hydraRank?: number;
  /** Fresh legal native allocations, independent of carried paid buff potency. */
  readonly sorceressBuffRanks?: Readonly<Record<import('../skills/sorceress-buffs').SorceressBuffId, number>>;
  /** Fresh legal learned authority; governed equipment/native Blaze has its separate projection. */
  readonly periodicSpellRanks?: Readonly<Record<'fire-wall' | 'thunder-storm', number> & { readonly inferno?: number }>;
  /** Fresh native Concentrate authority, independent of carried paid potency. */
  readonly concentrateRank?: number;
  /** Fresh native learned Leap authority, independent of carried paid potency. */
  readonly leapRank?: number;
  /** Fresh native learned Cloak authority; its paid status is run-local and never saved. */
  readonly cloakOfShadowsRank?: number;
  /** Fresh native legal Conversion rank; paid bindings exist only inside each battle. */
  readonly conversionRank?: number;
  /** Selected native Druid summon ranks, copied at registration; never persisted. */
  readonly druidSummonRanks?: import('../skills/druid-summon-authority').DruidSummonRanks;
  /** Fresh selected native Fire Golem authority; paid body bindings remain battle-local. */
  readonly fireGolemRank?: number;
  /** Fresh selected native Blood Golem authority; paid aura bindings remain battle-local. */
  readonly bloodGolemRank?: number;
  /** Fresh native configured Feral authority, captured per wave; never persisted. */
  readonly feralRageRank?: number;
  /** Fresh native configured Frenzy authority, captured per wave; never persisted. */
  readonly frenzyRank?: number;
  /** Fresh native Holy Shield eligibility and source-bound paid run-local power; never persisted. */
  readonly holyShieldRank?: number;
  readonly holyShield?: { readonly sourceHeroId: string; readonly rank: number };
  /** Fresh native Cyclone eligibility and source-bound paid run-local power; never persisted. */
  readonly cycloneArmorRank?: number;
  readonly cycloneArmor?: { readonly sourceHeroId: string; readonly rank: number };
  /** Native Druid allocation authority and paid run-local form; never persisted. */
  readonly druidShapeRanks?: import('../skills/druid-shapeshifting').DruidShapeRanks;
  readonly druidForm?: import('../skills/druid-shapeshifting').PaidDruidForm;
  /** Exact temporary capacity baseline, removed before fresh wave projection. */
  readonly druidFormLife?: { readonly baseLifeMax: number; readonly appliedLifeMax: number };
  /** Factory-copied literal authored undead identity; names/IDs never grant this marker. */
  readonly undead?: true;
  /** Transient combined ambient (Vigor/Oak) capacity wrapping paid form capacity; never persisted. */
  readonly vigorLife?: { readonly baseLifeMax: number; readonly appliedLifeMax: number };
  /** Native mercenary factory-owned Holy Freeze presence; wave-local, never persisted. */
  readonly holyFreezeAura?: true;
  /** Eligible learned Static Field rank captured per wave; explicit zero disables legacy fallback. */
  readonly staticFieldRank?: number;
  /** Eligible personal Energy Shield allocation captured per wave; never persisted. */
  readonly energyShieldRank?: number;
  /** Current Player-composed paid Burst eligibility; no implicit active-skill rank. */
  readonly burstOfSpeedRank?: number;
  /** Frozen equipment/learned active availability captured at the wave boundary; never persisted. */
  readonly governedActiveRanks?: GovernedActiveRanks;
  readonly id: string;
  readonly name: string;
  readonly side: CombatSide;
  readonly level: number;
  readonly tier: MonsterTier;
  /** Actual resolved monster catalog identity, captured by the builder; transient, never inferred from names/IDs. */
  readonly monsterArchetypeId?: string;
  readonly stats: DerivedStats;
  readonly life: number;
  readonly mana: number;
  /** Continuous battle-time MP recovery; absent means zero (never wall-clock recovery). */
  readonly manaRegenPerSecond?: number;
  /** Ordinary pre-item recovery, used only as the selected Meditation source baseline. */
  readonly manaRegenBaselinePerSecond?: number;
  /** Fractional MP and compensated integration carry across qualified next waves; absent means zero. */
  readonly manaRegenCarry?: number;
  readonly manaRegenCompensation?: number;
  /** Canonical decimal fractional MP in [0,1); authoritative over legacy numeric carry views. */
  readonly manaRegenExactCarry?: string;
  /** Per-type increased direct damage, composed once for a frozen wave; absent means zero. */
  readonly increasedDamagePct?: Readonly<Partial<Record<DamageType, number>>>;
  /** Bearer-only direct cold resistance penetration in percentage points; never persisted. */
  readonly coldResistanceReductionPct?: number;
  /** Bearer-only fraction of actual HP lost reflected after a surviving hostile physical hit. */
  readonly physicalReflectionPct?: number;
  readonly statuses: readonly ActiveStatus[];
  /** Cooldowns: skillId → remaining turns. */
  readonly cooldowns: Readonly<Record<string, number>>;
  /** Combo skill priority (player) or AI priority (monster). */
  readonly skillOrder: readonly string[];
  /**
   * Effective hard/soft skill levels keyed by either canonical engine id
   * (`necromancer.raise_skeleton`) or data id
   * (`skills-necromancer-raise-skeleton`). Absent active skills cast at level 1.
   */
  readonly skillLevels?: Readonly<Record<string, number>>;
  /** Buffs already applied this combat (don't recast). */
  readonly activeBuffIds: readonly string[];
  /** Native class/unlock/prerequisite authority, refreshed at configuration boundaries. */
  readonly coldArmorRanks?: Readonly<Record<import('../skills/cold-armors').ColdArmorId, number>>;
  /** Paid source/rank snapshots; temporary run state, never part of the durable save. */
  readonly coldArmors?: Readonly<Partial<Record<import('../skills/cold-armors').ColdArmorId, {
    readonly sourceId: string;
    readonly rank: number;
  }>>>;
  /** Paid player Frozen Armor potency, retained only within its native combat run. */
  readonly frozenArmor?: {
    readonly rank: number;
    /** Fractional bonus captured from authored coefficient times allocated cast rank. */
    readonly defensePct: number;
  };
  /** Boss enrage activated? */
  readonly enraged: boolean;
  /** Level/tier-resolved ordinary damage; fixed basicAttack takes precedence. */
  readonly attackRange?: readonly [number, number];
  /** Authored monster base action and optional sticky enrage; absent preserves legacy behavior. */
  readonly basicAttack?: import('../types/monsters').MonsterDef['basicAttack'];
  readonly enrage?: import('../types/monsters').MonsterDef['enrage'];
  /**
   * Has summon-on-start been cast for this unit?
   *
   * @deprecated Optional and ignored by the combat engine. Summon caps are
   * now enforced via per-owner counts in {@link CombatUnit.summonOwnerId}.
   * Field kept optional for back-compat with legacy unit factories.
   */
  readonly summonedAdds?: boolean;
  /** Cached resistance penalty from Act IV/V (subtracted from each resist). */
  readonly resistPenalty?: number;
  /** Owner unit id (for summons). */
  readonly ownerId?: string;
  /** Is this a summon? */
  readonly summon?: boolean;
  /**
   * Combat role of this unit. When omitted the engine infers it from
   * `side`/`id`/`summonOwnerId`. Used by targeting (taunt prefers `summon`)
   * and victory checks (hero death = enemy victory).
   *
   * `merc` is an ally that fights alongside the hero but whose death does
   * NOT end the run (Bug #2). For threat/aggro purposes mercs are treated
   * the same as heroes.
   */
  readonly kind?: 'hero' | 'merc' | 'summon' | 'monster';
  /** Owner id of a summon. Set by the engine when summons are spawned. */
  readonly summonOwnerId?: string;
  /** Summon template id used for per-template caps and UI localization. */
  readonly summonTemplateId?: string;
  /** Explicit false keeps a periodic summon's cooldown/cost when its minions die. */
  readonly summonRefundOnDeath?: boolean;
  /**
   * Snapshot of the unit's currently equipped weapon, used by
   * {@link import('../ai/policy').chooseSkill} to gate skills with
   * {@link import('../types/skills').SkillRequirement}.
   *
   * `undefined` ⇒ no weapon information was plumbed through (legacy
   * factories); skill-eligibility gating is then **disabled** for that
   * unit. To model an unarmed unit explicitly, pass an empty object.
   */
  readonly equippedWeapon?: {
    readonly weaponType?: WeaponType;
    readonly handedness?: Handedness;
  };
  /**
   * Optional 3-column battle-grid position.
   *
   * This is not range or movement. The engine uses it only to resolve
   * position-aware AOE shapes and the UI uses it to render formation.
   */
  readonly gridPosition?: GridPosition;
  /** Preferred summon spawn positions for this unit's summon skills. */
  readonly summonGridPositions?: readonly GridPosition[];
}

/**
 * Infer a combat unit's role when {@link CombatUnit.kind} is not set.
 * - explicit `kind` wins
 * - any unit with `summonOwnerId` is a summon
 * - player-side units whose id begins with `merc-` are mercenaries
 * - player-side units whose id begins with `player-` are heroes
 * - everything else is a monster
 */
export function inferKind(u: CombatUnit): 'hero' | 'merc' | 'summon' | 'monster' {
  if (u.kind) return u.kind;
  if (u.summonOwnerId !== undefined || u.summon === true) return 'summon';
  if (u.side === 'player' && u.id.startsWith('merc-')) return 'merc';
  if (u.side === 'player' && u.id.startsWith('player-')) return 'hero';
  return 'monster';
}

/**
 * Apply a Resistance pierce (penalty) to a Resistances object.
 * Used for Act IV (-20) / Act V (-40) per combat-formulas §8.2.
 * Values are clamped to [-100, 75].
 */
export function applyPenalty(res: Resistances, penalty: number): Resistances {
  const clamp = (v: number): number => Math.min(75, Math.max(-100, v - penalty));
  return {
    fire: clamp(res.fire),
    cold: clamp(res.cold),
    lightning: clamp(res.lightning),
    poison: clamp(res.poison),
    arcane: clamp(res.arcane),
    physical: clamp(res.physical)
  };
}

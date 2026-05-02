/**
 * Mercenary pool loader
 * Loads mercenary definitions and banner configuration for gacha system
 * @module data/loaders/mercs
 */

import mercenariesData from '../gacha/mercenaries.json';
import bannerConfigData from '../gacha/banner-config.json';

export interface MercBaseStats {
  strength: number;
  dexterity: number;
  vitality: number;
  energy: number;
}

export interface MercStarCurve {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  '6': number;
}

export interface MercDef {
  id: string;
  name: string;
  classRef: string;
  archetype: string;
  rarity: 'R' | 'SR' | 'SSR';
  signatureSkillId: string;
  baseStats: MercBaseStats;
  starUpgradeCurve: MercStarCurve;
  portraitAsset: string;
  iconAsset: string;
  skills: string[];
  comboOrder?: string[];
  reqLevel: number;
  flavor?: string;
}

export interface BannerRates {
  SSR: number;
  SR: number;
  R: number;
}

export interface BannerPity {
  sr: {
    threshold: number;
    guaranteedTier: string;
    description: string;
  };
  ssr: {
    threshold: number;
    guaranteedTier: string;
    description: string;
  };
  carryAcrossSessions: boolean;
  resetRules: Record<string, string[]>;
}

export interface BannerConfig {
  bannerId: string;
  name: string;
  currency: string;
  cost: {
    single: number;
    tenPull: number;
  };
  rates: BannerRates;
  pity: BannerPity;
  pool: {
    SSR: string[];
    SR: string[];
    R: string[];
  };
  shardConversion: Record<string, unknown>;
  uiHistoryCap: number;
}

export interface MercPool {
  pool: readonly MercDef[];
  rates: BannerRates;
  pity: BannerPity;
  banner: BannerConfig;
}

export interface MercHireAct {
  readonly act: 1 | 2 | 3 | 5;
  readonly id: string;
  readonly labelKey: string;
  readonly unlockReqLevel: number;
  readonly mercs: readonly MercDef[];
}

const HIRE_ROSTER: readonly Omit<MercHireAct, 'mercs'>[] = [
  {
    act: 1,
    id: 'act1',
    labelKey: 'hireActs.act1',
    unlockReqLevel: 1,
  },
  {
    act: 2,
    id: 'act2',
    labelKey: 'hireActs.act2',
    unlockReqLevel: 12,
  },
  {
    act: 3,
    id: 'act3',
    labelKey: 'hireActs.act3',
    unlockReqLevel: 18,
  },
  {
    act: 5,
    id: 'act5',
    labelKey: 'hireActs.act5',
    unlockReqLevel: 35,
  },
] as const;

const HIREABLE_IDS_BY_ACT: Readonly<Record<MercHireAct['id'], readonly string[]>> = {
  act1: [
    'mercs/act1-rogue-fire',
    'mercs/act1-rogue-cold',
    'mercs/act1-rogue-inner-sight',
  ],
  act2: [
    'mercs/act2-prayer',
    'mercs/act2-might',
    'mercs/act2-holy-freeze',
  ],
  act3: [
    'mercs/act3-iron-wolf-fire',
    'mercs/act3-iron-wolf-cold',
    'mercs/act3-iron-wolf-lightning',
  ],
  act5: [
    'mercs/act5-barbarian-recruit',
    'mercs/act5-barbarian-battle-orders',
    'mercs/act5-barbarian-war-cry',
  ],
};

const MERC_SKILL_LOADOUTS: Readonly<Record<string, readonly string[]>> = {
  'mercs/act1-rogue-fire': ['mskill-fire-arrow', 'mskill-basic-arrow', 'mskill-inner-sight'],
  'mercs/act1-rogue-cold': ['mskill-cold-arrow', 'mskill-basic-arrow', 'mskill-inner-sight'],
  'mercs/act1-rogue-inner-sight': ['mskill-inner-sight', 'mskill-basic-arrow', 'mskill-pierce-arrow'],
  'mercs/act2-prayer': ['aura-prayer', 'mskill-jab', 'mskill-pierce-thrust'],
  'mercs/act2-might': ['aura-might', 'mskill-jab', 'mskill-pierce-thrust'],
  'mercs/act2-holy-freeze': ['aura-holy-freeze', 'mskill-jab', 'mskill-pierce-thrust'],
  'mercs/act3-iron-wolf-fire': ['mskill-fire-ball', 'mskill-telekinesis', 'passive-fire-mastery'],
  'mercs/act3-iron-wolf-cold': ['mskill-glacial-spike', 'mskill-frozen-armor', 'mskill-telekinesis'],
  'mercs/act3-iron-wolf-lightning': ['mskill-charged-bolt', 'mskill-telekinesis', 'mskill-frozen-armor'],
  'mercs/act5-barbarian-recruit': ['mskill-bash', 'mskill-basic-swing', 'mskill-chop'],
  'mercs/act5-barbarian-battle-orders': ['aura-battle-orders', 'mskill-bash', 'mskill-basic-swing'],
  'mercs/act5-barbarian-war-cry': ['mskill-war-cry', 'mskill-bash', 'mskill-chop'],
};

/**
 * Load mercenary pool with banner configuration
 */
export function loadMercPool(): MercPool {
  const pool = mercenariesData as MercDef[];
  const banner = bannerConfigData as BannerConfig;

  return {
    pool: Object.freeze(pool),
    rates: banner.rates,
    pity: banner.pity,
    banner
  };
}

export function loadMercHireRoster(): readonly MercHireAct[] {
  const byId = new Map(loadMercPool().pool.map((def) => [def.id, def]));
  return HIRE_ROSTER.map((act) => ({
    ...act,
    mercs: (HIREABLE_IDS_BY_ACT[act.id] ?? [])
      .map((id) => byId.get(id))
      .filter((def): def is MercDef => def !== undefined),
  }));
}

export function resolveMercSkillLoadout(def: MercDef): readonly string[] {
  const authored = MERC_SKILL_LOADOUTS[def.id];
  if (authored) return authored;
  const seen = new Set<string>();
  const ordered: string[] = [];
  const push = (id: string | undefined): void => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    ordered.push(id);
  };
  push(def.signatureSkillId);
  for (const id of def.comboOrder ?? []) push(id);
  for (const id of def.skills) push(id);
  return ordered;
}

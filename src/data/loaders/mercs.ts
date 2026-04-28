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

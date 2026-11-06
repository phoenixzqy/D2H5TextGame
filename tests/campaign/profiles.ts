import type { CampaignProfile } from './policy';
import profileRegistry from './profile-registry.json';
import { intendedCampaignProfiles } from './intended-profiles';

const statsPerLevel = { strength: 0, dexterity: 0, vitality: 2, energy: 3 } as const;

const amazonBowProfile = {
  // Continuous-growth candidate from the earned volley clear. Fresh viability
  // and later-act passive growth still need earned campaign acceptance.
  classId: 'amazon', statsPerLevel: { strength: 0, dexterity: 4, vitality: 1, energy: 0 },
  weaponPolicy: 'preserve-bow-fallback',
  mercEquipmentPolicy: 'monotone-fielded-v1',
  targets: [
    { id: 'amazon.magic_arrow', rank: 1, level: 1 },
    { id: 'amazon.critical_strike', rank: 1, level: 1 },
    { id: 'amazon.multiple_shot', rank: 1, level: 6 },
    { id: 'amazon.dodge', rank: 1, level: 6 },
    { id: 'amazon.multiple_shot', rank: 20, level: 6 },
    { id: 'amazon.critical_strike', rank: 20, level: 20 },
    { id: 'amazon.dodge', rank: 20, level: 20 },
    { id: 'amazon.magic_arrow', rank: 20, level: 20 }
  ],
  priority: ['amazon.multiple_shot', 'amazon.magic_arrow']
} as const satisfies CampaignProfile;

const amazonBowSurvivalProfile = {
    ...amazonBowProfile,
    statsPerLevel: { strength: 0, dexterity: 2, vitality: 3, energy: 0 },
    targets: [
      ...amazonBowProfile.targets.slice(0, 4),
      { id: 'amazon.inner_sight', rank: 1, level: 12 },
      { id: 'amazon.slow_missiles', rank: 1, level: 12 },
      ...amazonBowProfile.targets.slice(4)
    ],
    comboPolicy: 'bow-volley-once-learned-v1',
    priority: ['amazon.slow_missiles', 'amazon.multiple_shot']
  } as const satisfies CampaignProfile;

/** Frozen evaluation policies; native starter grants are retained, never injected. */
export const campaignProfiles = {
  'sorceress-cold': {
    classId: 'sorceress', statsPerLevel,
    targets: [
      { id: 'sorceress.warmth', rank: 1, level: 1 },
      { id: 'sorceress.ice_blast', rank: 20, level: 6 },
      { id: 'sorceress.frost_nova', rank: 5, level: 6 }
    ],
    priority: ['sorceress.frost_nova', 'sorceress.ice_blast', 'sorceress.ice_bolt']
  },
  'sorceress-cold-nova5': {
    classId: 'sorceress', statsPerLevel,
    targets: [
      { id: 'sorceress.warmth', rank: 1, level: 1 },
      { id: 'sorceress.frost_nova', rank: 5, level: 6 },
      { id: 'sorceress.ice_blast', rank: 20, level: 6 }
    ],
    priority: ['sorceress.frost_nova', 'sorceress.ice_blast', 'sorceress.ice_bolt']
  },
  // Separately named diagnostic policy reproduces the proved native Act I preparation.
  'sorceress-cold-nova-focus': {
    classId: 'sorceress', statsPerLevel,
    targets: [
      { id: 'sorceress.warmth', rank: 1, level: 1 },
      { id: 'sorceress.ice_blast', rank: 1, level: 6 },
      { id: 'sorceress.frost_nova', rank: 20, level: 6 }
    ],
    priority: ['sorceress.frost_nova', 'sorceress.ice_blast', 'sorceress.ice_bolt']
  },
  'sorceress-fire': {
    classId: 'sorceress', statsPerLevel,
    targets: [
      { id: 'sorceress.fire_bolt', rank: 1, level: 1 },
      { id: 'sorceress.warmth', rank: 1, level: 1 },
      { id: 'sorceress.fire_ball', rank: 20, level: 12 },
      { id: 'sorceress.fire_bolt', rank: 20, level: 1 }
    ],
    priority: ['sorceress.fire_ball', 'sorceress.fire_bolt']
  },
  'amazon-bow': amazonBowProfile,
  'amazon-bow-volley-v1': {
    ...amazonBowProfile,
    comboPolicy: 'bow-volley-once-learned-v1',
    priority: ['amazon.multiple_shot']
  },
  'amazon-bow-survival-v1': amazonBowSurvivalProfile,
  'amazon-bow-survival-owned-v1': {
    ...amazonBowSurvivalProfile, survivalEquipmentPolicy: 'act2-owned-v1'
  },
  'amazon-bow-survival-managed-v1': {
    ...amazonBowSurvivalProfile, survivalEquipmentPolicy: 'act2-owned-v1',
    survivalRetrievalPolicy: 'stash-room-v1'
  },
  'amazon-javelin': {
    classId: 'amazon', statsPerLevel: { strength: 0, dexterity: 2, vitality: 2, energy: 1 },
    weaponPolicy: 'preserve-bow-fallback',
    targets: [
      { id: 'amazon.jab', rank: 1, level: 1 },
      { id: 'amazon.critical_strike', rank: 1, level: 1 },
      { id: 'amazon.jab', rank: 4, level: 1 },
      { id: 'amazon.power_strike', rank: 1, level: 6 },
      { id: 'amazon.poison_javelin', rank: 1, level: 6 },
      { id: 'amazon.dodge', rank: 1, level: 6 },
      { id: 'amazon.power_strike', rank: 20, level: 6 }
    ],
    priority: ['amazon.poison_javelin', 'amazon.power_strike', 'amazon.jab', 'amazon.magic_arrow']
  },
  'amazon-javelin-poison2': {
    classId: 'amazon', statsPerLevel: { strength: 0, dexterity: 2, vitality: 2, energy: 1 },
    weaponPolicy: 'preserve-bow-fallback',
    targets: [
      { id: 'amazon.jab', rank: 1, level: 1 },
      { id: 'amazon.critical_strike', rank: 1, level: 1 },
      { id: 'amazon.jab', rank: 3, level: 1 },
      { id: 'amazon.power_strike', rank: 1, level: 6 },
      { id: 'amazon.poison_javelin', rank: 2, level: 6 },
      { id: 'amazon.dodge', rank: 1, level: 6 },
      { id: 'amazon.power_strike', rank: 20, level: 6 }
    ],
    priority: ['amazon.poison_javelin', 'amazon.power_strike', 'amazon.jab', 'amazon.magic_arrow']
  },
  'amazon-javelin-poison2-impale1': {
    classId: 'amazon', statsPerLevel: { strength: 0, dexterity: 2, vitality: 2, energy: 1 },
    weaponPolicy: 'preserve-bow-fallback',
    targets: [
      { id: 'amazon.jab', rank: 1, level: 1 },
      { id: 'amazon.critical_strike', rank: 1, level: 1 },
      { id: 'amazon.jab', rank: 3, level: 1 },
      { id: 'amazon.power_strike', rank: 1, level: 6 },
      { id: 'amazon.poison_javelin', rank: 2, level: 6 },
      { id: 'amazon.dodge', rank: 1, level: 6 },
      { id: 'amazon.impale', rank: 1, level: 12 },
      { id: 'amazon.power_strike', rank: 20, level: 6 }
    ],
    priority: ['amazon.poison_javelin', 'amazon.impale', 'amazon.power_strike', 'amazon.jab', 'amazon.magic_arrow']
  },
  'assassin-martial': {
    classId: 'assassin', statsPerLevel: { strength: 1, dexterity: 1, vitality: 2, energy: 1 },
    targets: [
      { id: 'assassin.dragon_talon', rank: 1, level: 1 },
      { id: 'assassin.tiger_strike', rank: 1, level: 1 },
      { id: 'assassin.cobra_strike', rank: 1, level: 12 },
      { id: 'assassin.dragon_talon', rank: 20, level: 1 }
    ],
    priority: ['assassin.cobra_strike', 'assassin.tiger_strike', 'assassin.dragon_talon']
  },
  'assassin-traps': {
    classId: 'assassin', statsPerLevel: { strength: 0, dexterity: 0, vitality: 2, energy: 3 },
    targets: [
      { id: 'assassin.fire_blast', rank: 1, level: 1 },
      { id: 'assassin.shock_web', rank: 6, level: 6 },
      { id: 'assassin.charged_bolt_sentry', rank: 20, level: 12 }
    ],
    priority: ['assassin.charged_bolt_sentry', 'assassin.shock_web', 'assassin.fire_blast']
  },
  'necromancer-summon': {
    // Continuous growth candidate derived from earned Act V; fresh-route acceptance remains open.
    classId: 'necromancer', statsPerLevel: { strength: 0, dexterity: 1, vitality: 3, energy: 1 },
    mercEquipmentPolicy: 'monotone-fielded-v1',
    targets: [
      { id: 'necromancer.raise_skeleton', rank: 1, level: 1 },
      { id: 'necromancer.skeleton_mastery', rank: 1, level: 1 },
      { id: 'necromancer.clay_golem', rank: 1, level: 6 },
      { id: 'necromancer.raise_skeletal_mage', rank: 1, level: 12 },
      { id: 'necromancer.amplify_damage', rank: 1, level: 1 },
      { id: 'necromancer.raise_skeleton', rank: 12, level: 1 },
      { id: 'necromancer.skeleton_mastery', rank: 20, level: 1 },
      { id: 'necromancer.iron_maiden', rank: 1, level: 12 },
      { id: 'necromancer.life_tap', rank: 1, level: 18 },
      { id: 'necromancer.weaken', rank: 1, level: 6 },
      { id: 'necromancer.terror', rank: 1, level: 12 },
      { id: 'necromancer.decrepify', rank: 1, level: 24 },
      { id: 'necromancer.dim_vision', rank: 1, level: 6 },
      { id: 'necromancer.confuse', rank: 1, level: 18 },
      { id: 'necromancer.summon_mastery', rank: 20, level: 30 },
      { id: 'necromancer.raise_skeletal_mage', rank: 6, level: 12 }
    ],
    priority: ['necromancer.raise_skeleton', 'necromancer.clay_golem', 'necromancer.raise_skeletal_mage',
      'necromancer.confuse', 'necromancer.iron_maiden', 'necromancer.amplify_damage']
  },
  'necromancer-bone': {
    classId: 'necromancer', statsPerLevel: { strength: 0, dexterity: 0, vitality: 2, energy: 3 },
    targets: [
      { id: 'necromancer.teeth', rank: 1, level: 1 },
      { id: 'necromancer.bone_armor', rank: 1, level: 1 },
      { id: 'necromancer.corpse_explosion', rank: 1, level: 6 },
      { id: 'necromancer.bone_wall', rank: 1, level: 12 },
      { id: 'necromancer.teeth', rank: 20, level: 1 }
    ],
    priority: ['necromancer.bone_wall', 'necromancer.corpse_explosion', 'necromancer.teeth']
  },
  'barbarian-double-swing': {
    classId: 'barbarian', statsPerLevel: { strength: 1, dexterity: 1, vitality: 2, energy: 1 },
    targets: [
      { id: 'barbarian.howl', rank: 1, level: 1 },
      { id: 'barbarian.shout', rank: 1, level: 6 },
      { id: 'barbarian.increased_stamina', rank: 1, level: 12 },
      { id: 'barbarian.double_swing', rank: 20, level: 6 },
      { id: 'barbarian.bash', rank: 3, level: 1 }
    ],
    priority: ['barbarian.howl', 'barbarian.double_swing', 'barbarian.bash']
  },
  'barbarian-double-throw': {
    classId: 'barbarian', statsPerLevel: { strength: 1, dexterity: 1, vitality: 2, energy: 1 },
    targets: [
      { id: 'barbarian.howl', rank: 1, level: 1 },
      { id: 'barbarian.shout', rank: 1, level: 6 },
      { id: 'barbarian.increased_stamina', rank: 1, level: 12 },
      { id: 'barbarian.double_swing', rank: 1, level: 6 },
      { id: 'barbarian.double_throw', rank: 20, level: 12 },
      { id: 'barbarian.bash', rank: 3, level: 1 }
    ],
    priority: ['barbarian.howl', 'barbarian.double_throw', 'barbarian.double_swing', 'barbarian.bash']
  },
  'paladin-zeal': {
    classId: 'paladin', statsPerLevel: { strength: 1, dexterity: 1, vitality: 2, energy: 1 },
    auraSelection: { id: 'paladin.might', level: 2 },
    targets: [
      { id: 'paladin.sacrifice', rank: 1, level: 1 },
      { id: 'paladin.might', rank: 1, level: 1 },
      { id: 'paladin.zeal', rank: 20, level: 12 },
      { id: 'paladin.sacrifice', rank: 5, level: 1 }
    ],
    priority: ['paladin.zeal', 'paladin.sacrifice']
  },
  'paladin-holy-bolt': {
    classId: 'paladin', statsPerLevel: { strength: 0, dexterity: 0, vitality: 2, energy: 3 },
    auraSelection: { id: 'paladin.prayer', level: 2 },
    targets: [
      { id: 'paladin.sacrifice', rank: 1, level: 1 },
      { id: 'paladin.prayer', rank: 1, level: 1 },
      { id: 'paladin.holy_bolt', rank: 20, level: 6 }
    ],
    priority: ['paladin.holy_bolt', 'paladin.sacrifice']
  },
  'druid-fire': {
    classId: 'druid', statsPerLevel: { strength: 0, dexterity: 0, vitality: 2, energy: 3 },
    targets: [
      { id: 'druid.oak_sage', rank: 1, level: 6 },
      { id: 'druid.molten_boulder', rank: 1, level: 6 },
      { id: 'druid.fissure', rank: 20, level: 12 },
      { id: 'druid.firestorm', rank: 5, level: 1 }
    ],
    priority: ['druid.fissure', 'druid.molten_boulder', 'druid.firestorm']
  },
  'druid-summon': {
    classId: 'druid', statsPerLevel: { strength: 0, dexterity: 0, vitality: 3, energy: 2 },
    targets: [
      { id: 'druid.raven', rank: 3, level: 1 },
      { id: 'druid.poison_creeper', rank: 1, level: 1 },
      { id: 'druid.oak_sage', rank: 1, level: 6 },
      { id: 'druid.carrion_vine', rank: 1, level: 12 },
      { id: 'druid.summon_spirit_wolf', rank: 20, level: 6 }
    ],
    priority: ['druid.raven', 'druid.poison_creeper', 'druid.summon_spirit_wolf', 'druid.carrion_vine']
  },
  ...intendedCampaignProfiles
} as const satisfies Readonly<Record<keyof typeof profileRegistry, CampaignProfile>>;

import type { CampaignProfile } from './policy';
import growth from './intended-growth-v1.json';
import corpseDecoy from './corpse-decoy-v1.json';
import corpseWeapon from './corpse-weapon-v1.json';
import barbarianWeapon from './barbarian-weapon-v1.json';
import martialWeapon from './martial-weapon-v1.json';
import javelinWeapon from './javelin-weapon-v1.json';

/** Versioned allocation candidates; all points, grants and equipment remain native. */
function profile(classId: CampaignProfile['classId'],
  definition: Pick<CampaignProfile, 'statsPerLevel' | 'statStages' | 'targets' | 'priority' | 'priorityByArea' | 'cursePreferenceByArea'>): CampaignProfile {
  return { classId, ...definition, capacityPolicy: 'owned-shortlist-v2', mercEquipmentPolicy: 'monotone-fielded-v1',
    mercWeaponPolicy: 'physical-offense-v1', mercWeaponSocketPolicy: 'owned-physical-offense-v1',
    ownedEquipmentPolicy: 'owned-build-v1', recoveryTrainingPolicy: 'cleared-level-margin-v1',
    acquisitionTrainingPolicy: 'den-bounded-v1',
    companionPolicy: 'act2-prayer-v1', survivalEquipmentPolicy: 'act2-owned-v1',
    survivalRetrievalPolicy: 'stash-room-v1', socketPreparationPolicy: 'owned-act2-defense-v1' };
}

export const intendedCampaignProfiles = {
  'sorceress-cold-intended-v1': profile('sorceress', growth.profiles['sorceress-cold-intended-v1']),
  'sorceress-fire-intended-v1': {
    ...profile('sorceress', growth.profiles['sorceress-fire-intended-v1']),
    comboPolicy: 'fire-meteor-ball-v1'
  },
  'amazon-bow-intended-v1': {
    ...profile('amazon', growth.profiles['amazon-bow-intended-v1']),
    heroWeaponPolicy: { kind: 'physical-offense-v1', level: 1 },
    weaponPolicy: 'preserve-bow-fallback', comboPolicy: 'bow-volley-at-target-v1'
  },
  'amazon-javelin-intended-v1': {
    ...profile('amazon', growth.profiles['amazon-javelin-intended-v1']),
    heroWeaponPolicy: { kind: 'physical-offense-v1', level: javelinWeapon.level },
    comboPolicy: 'javelin-pair-at-target-v1'
  },
  'necromancer-summon-intended-v1': profile('necromancer', growth.profiles['necromancer-summon-intended-v1']),
  'necromancer-bone-intended-v1': {
    ...profile('necromancer', growth.profiles['necromancer-bone-intended-v1']),
    heroWeaponPolicy: { kind: 'physical-offense-v1', level: corpseWeapon.level },
    comboPolicy: 'bone-survival-curse-v1', drawRecoveryPolicy: 'learned-offensive-curse-v1',
    trainingDrawRecoveryPolicy: 'learned-offensive-curse-v1'
  },
  'barbarian-double-swing-intended-v1': {
    ...profile('barbarian', growth.profiles['barbarian-double-swing-intended-v1']), weaponAffinity: 'sword',
    heroWeaponPolicy: { kind: 'physical-offense-v1', level: barbarianWeapon.swing.level }
  },
  'barbarian-double-throw-intended-v1': {
    ...profile('barbarian', growth.profiles['barbarian-double-throw-intended-v1']), weaponAffinity: 'throwing',
    heroWeaponPolicy: { kind: 'physical-offense-v1', level: barbarianWeapon.throw.level },
    skillResetPolicy: 'double-throw-unlock-v1'
  },
  'paladin-zeal-intended-v1': {
    ...profile('paladin', growth.profiles['paladin-zeal-intended-v1']),
    auraSelection: { id: 'paladin.might', level: 2 },
    auraStages: [{ id: 'paladin.holy-fire', level: 6 }, { id: 'paladin.might', level: 12 }]
  },
  'paladin-holy-bolt-intended-v1': {
    ...profile('paladin', growth.profiles['paladin-holy-bolt-intended-v1']),
    auraSelection: { id: 'paladin.prayer', level: 2 },
    auraStages: [{ id: 'paladin.conviction', level: 40 }],
    comboPolicy: 'holy-bolt-at-target-v1'
  },
  'druid-fire-intended-v1': profile('druid', growth.profiles['druid-fire-intended-v1']),
  'druid-summon-intended-v1': profile('druid', growth.profiles['druid-summon-intended-v1']),
  'assassin-martial-intended-v1': {
    ...profile('assassin', growth.profiles['assassin-martial-intended-v1']), weaponAffinity: 'claw',
    heroWeaponPolicy: { kind: 'physical-offense-v1', level: martialWeapon.level }
  },
  'assassin-traps-intended-v1': profile('assassin', growth.profiles['assassin-traps-intended-v1'])
} as const satisfies Readonly<Record<string, CampaignProfile>>;

/** Opt-in paid curse preparation; excluded from the canonical fourteen-build registry. */
export const corpseDecoyCampaignProfile: CampaignProfile = {
  ...intendedCampaignProfiles['necromancer-bone-intended-v1'],
  targets: [...intendedCampaignProfiles['necromancer-bone-intended-v1'].targets, ...corpseDecoy.additionalTargets],
  priorityByArea: {
    ...intendedCampaignProfiles['necromancer-bone-intended-v1'].priorityByArea,
    ...corpseDecoy.priorityByArea
  }
};

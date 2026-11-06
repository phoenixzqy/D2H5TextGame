import type { CampaignProfile, CampaignWave, TrainingCurseRecovery } from './policy';

/** Recovery may use learned Amplify declared globally or in the current area's order. */
export function hasLearnedOffensiveCurse(profile: CampaignProfile, levels: Readonly<Record<string, number>>,
  area: string | undefined): boolean {
  const amplify = 'necromancer.amplify_damage';
  return (levels[amplify] ?? 0) > 0 && (profile.priority.includes(amplify) ||
    (area !== undefined && profile.priorityByArea?.[area]?.includes(amplify) === true));
}

/** Share the declared area's learned curse selection with preparation and recovery. */
export function boneCursePriority(profile: CampaignProfile, levels: Readonly<Record<string, number>>,
  area: string | undefined, offensive = false): string[] {
  const priority = area === undefined ? profile.priority : profile.priorityByArea?.[area] ?? profile.priority;
  const amplify = 'necromancer.amplify_damage';
  const curses = new Set(['necromancer.decrepify', 'necromancer.weaken', amplify]);
  const preferences = offensive ? [amplify] : area === undefined ? [] : profile.cursePreferenceByArea?.[area] ?? [];
  const selected = offensive && hasLearnedOffensiveCurse(profile, levels, area) ? amplify
    : [...preferences, ...priority].find(skill =>
    curses.has(skill) && priority.includes(skill) && (levels[skill] ?? 0) > 0);
  const order = priority.filter(skill => !curses.has(skill) || skill === selected);
  return offensive && selected === amplify ? [amplify, ...order.filter(skill => skill !== amplify)] : order;
}

/** Select a changed learned order from settled history; a failed retry ends the stance. */
export function trainingCurseRecovery(profile: CampaignProfile, levels: Readonly<Record<string, number>>,
  area: string, nextOrdinal: number, previous: CampaignWave | undefined,
  stance: TrainingCurseRecovery | undefined): TrainingCurseRecovery | undefined {
  if (profile.trainingDrawRecoveryPolicy !== 'learned-offensive-curse-v1' ||
    profile.comboPolicy !== 'bone-survival-curse-v1' || profile.classId !== 'necromancer' ||
    !hasLearnedOffensiveCurse(profile, levels, area) ||
    previous?.phase !== 'farm' || previous.area !== area || previous.ordinal + 1 !== nextOrdinal ||
    !(previous.heroLife > 0)) return undefined;
  const ordinary = boneCursePriority(profile, levels, area).filter(skill => (levels[skill] ?? 0) > 0);
  const recovered = boneCursePriority(profile, levels, area, true).filter(skill => (levels[skill] ?? 0) > 0);
  if (ordinary.length === recovered.length && ordinary.every((skill, index) => skill === recovered[index])) return undefined;
  if (stance) return stance.area === area &&
    Number.isSafeInteger(stance.triggerOrdinal) && stance.triggerOrdinal >= 0 &&
    stance.triggerOrdinal < previous.ordinal && previous.outcome === 'victory' && previous.advance === 'victory'
    ? { ...stance } : undefined;
  return previous.outcome === 'draw' && previous.advance === 'defeat'
    ? { policy: profile.trainingDrawRecoveryPolicy, area, triggerOrdinal: previous.ordinal } : undefined;
}

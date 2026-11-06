import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { loadQuests } from '@/data/loaders/quests';
import type { SaveCurrent } from '@/engine/types/save';
import { decodeSave } from '@/engine/save/validate';
import { hashObservation } from '../sim/contracts/observation-codec';
import type { CampaignRecord, recordCampaignBossCheckpoint } from './actions';
import { auditCampaignEconomy, campaignEconomy, type CampaignReward } from './economy';
import { intendedCampaignProfiles } from './intended-profiles';
import { campaignTotals, type CampaignProfile, type CampaignUnobservedWave, type CampaignWave } from './policy';
import policy from './first-entry-policy-v1.json';

export interface CampaignEntryAdmission {
  readonly ordinal: number;
  readonly area: string;
  readonly phase: 'farm' | 'route';
  readonly totalWaves: number;
  abandonedAfterIndex?: number;
}
interface FirstEntryPrefix {
  readonly created: SaveCurrent;
  readonly profileId: string;
  readonly profile: CampaignProfile;
  readonly configuration: Readonly<Record<string, unknown>>;
  readonly admissions: readonly CampaignEntryAdmission[];
  readonly waves: readonly CampaignWave[];
  readonly unobservedWaves: readonly CampaignUnobservedWave[];
  readonly rewards: readonly CampaignReward[];
}
type BossCheckpoint = NonNullable<ReturnType<typeof recordCampaignBossCheckpoint>>;
const digest = (value: string) => createHash('sha256').update(value).digest('hex');

/** Each paid admission must account for its entire played prefix, including a recorded flee. */
function completeHistory(prefix: FirstEntryPrefix, ordinal: number) {
  if (prefix.unobservedWaves.length || prefix.admissions.length !== ordinal ||
    prefix.waves.some(wave => !prefix.admissions.some(admission => admission.ordinal === wave.ordinal))) return false;
  return prefix.admissions.every((admission, index) => {
    const waves = prefix.waves.filter(wave => wave.ordinal === admission.ordinal), last = waves.at(-1);
    if (admission.ordinal !== index || !Number.isSafeInteger(admission.totalWaves) || admission.totalWaves < 1 ||
      !last || waves.length > admission.totalWaves || waves.some((wave, i) => wave.index !== i ||
        wave.area !== admission.area || wave.phase !== admission.phase ||
        i < waves.length - 1 && (wave.advance !== 'next-wave' || wave.outcome !== 'victory'))) return false;
    if (admission.abandonedAfterIndex !== undefined)
      return admission.abandonedAfterIndex === last.index && last.advance === 'next-wave' &&
        last.outcome === 'victory' && waves.length < admission.totalWaves;
    return last.advance === 'victory' && last.outcome === 'victory' && waves.length === admission.totalWaves ||
      last.advance === 'defeat' && last.outcome !== 'victory';
  });
}

function firstEntry(checkpoint: BossCheckpoint, prefix: FirstEntryPrefix, phase: 'farm' | 'route') {
  const { snapshot, act, area, questId } = checkpoint, { created } = prefix;
  const ceiling = policy.acts.find(row => row.act === act); assert.ok(ceiling);
  const totals = campaignTotals(prefix.waves, [], prefix.unobservedWaves);
  const reasons: string[] = [];
  try { assert.deepEqual(decodeSave(JSON.parse(checkpoint.exported) as unknown), snapshot); }
  catch { reasons.push('unbound-native-save'); }
  const canonical = Object.entries(intendedCampaignProfiles).find(([id]) => id === prefix.profileId)?.[1];
  if (!canonical || !isDeepStrictEqual(canonical, prefix.profile)) reasons.push('historical-or-modified-profile');
  if (snapshot.player.class !== prefix.profile.classId) reasons.push('class-mismatch');
  if (snapshot.map.selectedDifficulty !== 'normal' || snapshot.map.challengeOrdinals.nightmare !== 0 ||
    snapshot.map.challengeOrdinals.hell !== 0 || snapshot.map.nightmareClearedSubAreas.length ||
    snapshot.map.hellClearedSubAreas.length) reasons.push('non-normal-history');
  if (created.player.level !== 1 || created.player.experience !== 0 || created.map.clearedSubAreas.length ||
    created.player.class !== prefix.profile.classId || created.map.selectedDifficulty !== 'normal' ||
    Object.values(created.map.challengeOrdinals).some(value => value !== 0) ||
    Object.keys(created.map.questProgress).length || Object.keys(created.map.questReceipts).length)
    reasons.push('non-fresh-origin');
  if (!completeHistory(prefix, snapshot.map.challengeOrdinals.normal)) reasons.push('incomplete-acquisition-history');
  if (prefix.admissions.some(admission => admission.area === area)) reasons.push('prior-boss-admission');
  const quest = loadQuests().find(row => row.id === questId); assert.ok(quest);
  if (Number(quest.actId.replace('acts/act', '')) !== act ||
    !quest.objectives.some(objective => objective.type === 'kill-boss' && objective.areaId === area))
    reasons.push('mismatched-boss-identity');
  const progress = snapshot.map.questProgress[questId];
  if (snapshot.map.clearedSubAreas.some(id => id === area || id === area.replace(/^areas\/act([1-5])-/, 'a$1-')) ||
    progress?.status === 'completed' || progress?.rewardClaimed === true ||
    quest.objectives.some(objective => objective.type === 'kill-boss' && progress?.objectives[objective.id]))
    reasons.push('prior-boss-victory');
  if (progress?.status !== 'inProgress') reasons.push('boss-quest-not-active');
  const laterAct = (id: string) => Number(/^(?:areas\/act|a|quests\/act)([1-5])[-/]/.exec(id)?.[1] ?? 0) > act;
  if (snapshot.map.currentAct > act || snapshot.map.clearedSubAreas.some(laterAct) ||
    Object.entries(snapshot.map.questProgress).some(([id, row]) => laterAct(id) &&
      (row.status === 'inProgress' || row.status === 'completed' || row.rewardClaimed === true ||
        Object.values(row.objectives).some(Boolean))) ||
    Object.keys(snapshot.map.questReceipts).some(laterAct)) reasons.push('future-act-progress');
  if (totals.combatMs > ceiling.combatMsCeiling) reasons.push('completion-time-ceiling-exceeded');
  let economyAudit: ReturnType<typeof auditCampaignEconomy> | null = null, economyError: string | null = null;
  try { economyAudit = auditCampaignEconomy(campaignEconomy(created), campaignEconomy(snapshot), prefix.rewards); }
  catch (error) { reasons.push('unreconciled-earned-state'); economyError = String(error); }
  const spends = (key: 'materials' | 'currencies') => {
    const spent: Record<string, number> = {};
    for (const reward of prefix.rewards) for (const [id, quantity] of Object.entries(reward[key]))
      if (quantity < 0) spent[id] = (spent[id] ?? 0) - quantity;
    return spent;
  };
  const configuration = structuredClone({ profileId: prefix.profileId, profile: prefix.profile,
    configuration: prefix.configuration });
  return {
    kind: 'campaign-first-boss-entry' as const, policyId: policy.id, act, area, questId, phase,
    ordinal: snapshot.map.challengeOrdinals.normal, level: snapshot.player.level,
    saveSha256: digest(checkpoint.exported), metadataHashFormat: 'observation-json-v1' as const,
    initialSaveSha256: hashObservation(created), policySha256: hashObservation(policy),
    configuration, configurationSha256: hashObservation(configuration),
    prefixSha256: hashObservation({ admissions: prefix.admissions, waves: prefix.waves,
      unobservedWaves: prefix.unobservedWaves, rewards: prefix.rewards }),
    costs: { admissions: prefix.admissions.length, playedWaves: totals.playedWaves,
      combatMs: totals.combatMs, farmMs: totals.farmMs, routeMs: totals.routeMs,
      nonwinMs: totals.nonwinMs, nonwins: totals.nonwins, complete: !reasons.includes('incomplete-acquisition-history'),
      combatMsCeiling: ceiling.combatMsCeiling, decisionAdjustedMs: null,
      spentMaterials: spends('materials'), spentCurrencies: spends('currencies'), economyAudit, economyError },
    disposition: reasons.length ? 'review' as const : 'candidate' as const, reasons,
    limitation: policy.limitation
  };
}

/** Retain the earliest admission, even when it fails, is too expensive, or is used for farming. */
export function createCampaignFirstEntries(record: CampaignRecord) {
  const entries: ReturnType<typeof firstEntry>[] = [];
  return { entries, capture(checkpoint: BossCheckpoint, prefix: FirstEntryPrefix, phase: 'farm' | 'route') {
    if (checkpoint.boundary !== 'before-admission' || entries.some(entry => entry.questId === checkpoint.questId)) return;
    const entry = firstEntry(checkpoint, prefix, phase);
    entries.push(entry);
    record(entry);
    return entry;
  } };
}

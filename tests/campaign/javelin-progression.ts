import assert from 'node:assert/strict';
import { RESPEC_POLICY } from '@/data/loaders/respec';
import { LEVEL_CAP } from '@/engine/progression/xp';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { prepareTownRespec, executeTownRespec } from '@/stores/respecActions';
import { snapshotStores } from '@/stores/persistence';
import { campaignProfiles } from './profiles';
import type { CampaignProfile } from './policy';
import type { CampaignRecord } from './actions';
import type { CampaignTrainingRequest } from './training';
import type { CampaignThreat } from './survival-gear';
import { equipCampaignMercGear } from './merc-gear';

/** Native unlocked crowd control, at the authored hire level; keep the original merc and gear. */
export function prepareJavelinCompanion(record: CampaignRecord): void {
  assert.ok(!useCombatStore.getState().inCombat && !hasActiveSubAreaRun(),
    'Javelin companion preparation requires an idle boundary');
  const player = usePlayerStore.getState().player; assert.ok(player);
  const roster = loadMercHireRoster().find(row => row.act === 2); assert.ok(roster);
  const definition = roster.mercs.find(row => row.id === 'mercs/act2-holy-freeze'); assert.ok(definition);
  assert.ok(player.level >= roster.unlockReqLevel && useMapStore.getState().isActUnlocked(2),
    'Javelin companion requires earned Act II access');
  const state = useMercStore.getState();
  const owned = state.ownedMercs.find(merc => merc.id.split('#')[0] === definition.id);
  if (!owned || state.fieldedMercId !== owned.id) {
    const before = snapshotStores(); assert.ok(before);
    if (owned) state.setFieldedMerc(owned.id);
    else assert.equal(state.hireMerc(definition).ok, true, 'Native Holy Freeze hire refused');
    const after = snapshotStores(); assert.ok(after);
    record({ kind: 'javelin-act2-companion', definition, reused: !!owned, before, after });
    for (const key of ['player', 'inventory', 'map', 'formation', 'meta', 'endgame'] as const)
      assert.deepEqual(after[key], before[key]);
    if (!owned) {
      assert.deepEqual(after.mercs.ownedMercs.slice(0, -1), before.mercs.ownedMercs);
      const hired = after.mercs.ownedMercs.at(-1); assert.ok(hired);
      assert.equal(hired.level, definition.reqLevel);
      assert.deepEqual(after.mercs.mercEquipment, { ...before.mercs.mercEquipment, [hired.id]: {} });
    }
  }
  equipCampaignMercGear(record, true);
}

const target = (id: string, rank: number, level: number) => ({ id: `amazon.${id}`, rank, level });

/** Versioned targets from the retained route; missing earned points remain missing. */
export function earnedJavelinProfile(initial: CampaignProfile, level: number): CampaignProfile {
  assert.equal(initial.classId, 'amazon');
  assert.ok(Number.isSafeInteger(level) && level >= 1 && level <= LEVEL_CAP, 'Invalid Javelin level');
  if (level < 12) return { ...campaignProfiles['amazon-javelin-poison2-impale1'],
    progressionPolicy: 'javelin-earned-v1' };
  const { weaponPolicy: _oldWeaponPolicy, ...base } = initial;
  const common = [target('jab', 1, 1), target('critical_strike', 1, 1),
    target('power_strike', 1, 6), target('dodge', 1, 6)];
  if (level < 24) return { ...base, targets: [...common, target('impale', 1, 12),
    target('poison_javelin', 20, 6)], priority: ['amazon.poison_javelin'] };
  return { ...base, targets: [...common, target('lightning_bolt', 1, 12),
    target('charged_strike', 1, 18), target('lightning_strike', 20, 24),
    ...(level >= 28 ? [target('impale', 8, 12)] : []),
    ...(level >= 40 ? [target('impale', 20, 12), target('critical_strike', 8, 1)] : []),
    ...(level >= 30 ? [target('inner_sight', 1, 1), target('slow_missiles', 1, 12),
      target('decoy', 1, 24), target('avoid', 1, 12), target('evade', 1, 24),
      target('valkyrie', 1, 30), target('dodge', 2, 6)] : [])],
    priority: level >= 30 ? ['amazon.valkyrie', 'amazon.decoy', 'amazon.lightning_strike', 'amazon.impale']
      : level >= 28 ? ['amazon.lightning_strike', 'amazon.impale'] : ['amazon.lightning_strike'] };
}

/** Native free resets only; an interrupted empty post-reset state resumes without paying twice. */
export function prepareEarnedJavelinProfile(initial: CampaignProfile, record: CampaignRecord): CampaignProfile {
  const player = usePlayerStore.getState().player; assert.ok(player && player.class === 'amazon');
  const profile = earnedJavelinProfile(initial, player.level);
  if (player.level < 12) return profile;
  const caps = new Map(profile.targets.map(row => [row.id, row.rank]));
  const incompatible = Object.entries(player.skillLevels ?? {}).some(([id, rank]) => rank > (caps.get(id) ?? 0));
  if (!incompatible) return profile;
  assert.ok(player.respecsRemaining && player.respecsRemaining.skill > 0, 'Javelin policy requires an unused free skill reset');
  const before = snapshotStores(); assert.ok(before);
  const key = String(useMapStore.getState().currentAct) as keyof typeof RESPEC_POLICY.townNpcs;
  const npcId = RESPEC_POLICY.townNpcs[key]; assert.ok(npcId);
  const quote = prepareTownRespec(npcId, 'skill');
  assert.equal(quote.kind, 'ok', 'Javelin native skill reset refused');
  assert.equal(quote.cost, 0);
  const result = executeTownRespec(quote.request); assert.equal(result, 'ok');
  const after = snapshotStores(); assert.ok(after);
  record({ kind: 'javelin-native-skill-reset', level: player.level, npcId,
    refund: quote.refund, before, after, profile });
  assert.equal(after.player.skillPoints, before.player.skillPoints + quote.refund);
  assert.deepEqual(after.player.skillLevels, {});
  assert.equal(after.player.respecsRemaining.skill, before.player.respecsRemaining.skill - 1);
  for (const key of ['coreStats', 'statPoints'] as const) assert.deepEqual(after.player[key], before.player[key]);
  for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    assert.deepEqual(after[key], before[key]);
  return profile;
}

/** Ordered earned preparation boundaries; each invocation freezes the complete policy. */
export const javelinTrainingStages = [
    { entryAct: 2, entry: 'areas/act2-far-oasis', act: 1, area: 'areas/act1-dark-wood', targetLevel: 20,
      maxAdmissions: 100, maxCombatMs: 7_200_000 },
    { entryAct: 2, entry: 'areas/act2-arcane-sanctuary', act: 2, area: 'areas/act2-dry-hills', targetLevel: 24,
      maxAdmissions: 160, maxCombatMs: 3_600_000 },
    { entryAct: 3, entry: 'areas/act3-flayer-jungle', act: 3, area: 'areas/act3-great-marsh', targetLevel: 28,
      maxAdmissions: 120, maxCombatMs: 8_000_000 },
    // Split the original later800/28.8M allowance across the authored power gates.
    { entryAct: 3, entry: 'areas/act3-kurast-bazaar', act: 3, area: 'areas/act3-great-marsh', targetLevel: 35,
      maxAdmissions: 200, maxCombatMs: 7_200_000 },
    { entryAct: 3, entry: 'areas/act3-travincal', act: 3, area: 'areas/act3-flayer-jungle', targetLevel: 40,
      maxAdmissions: 200, maxCombatMs: 9_000_000 },
    { entryAct: 4, entry: 'areas/act4-plains-of-despair', act: 3, area: 'areas/act3-kurast-bazaar', targetLevel: 46,
      maxAdmissions: 400, maxCombatMs: 12_600_000 },
    { entryAct: 5, entry: 'areas/act5-crystalline-passage', act: 5, area: 'areas/act5-bloody-foothills', targetLevel: 55,
      maxAdmissions: 600, maxCombatMs: 43_200_000 }
] as const;

/** Post-Den acquisition uses the earlier native farm instead of repeating Den elites. */
export function javelinAcquisitionRequest(): CampaignTrainingRequest & { maxCombatMs: number } {
  return { act: 1, area: 'areas/act1-blood-moor', targetLevel: 12, maxAdmissions: 120,
    maxConsecutiveNonwins: 3, maxTotalNonwins: 10, maxCombatMs: 7_200_000 };
}

/** Declared upper bounds before new campaign seeds; no retry-until-success or rare-item farming. */
export function javelinTrainingRequest(act: number, area: string): (CampaignTrainingRequest & { maxCombatMs: number }) | null {
  const row = javelinTrainingStages.find(row => row.entryAct === act && row.entry === area);
  if (!row) return null;
  const { entryAct: _entryAct, entry: _entry, ...request } = row;
  return { ...request, maxConsecutiveNonwins: 3, maxTotalNonwins: 10 };
}

/** Fixed direct-hit probes, including observed elite bursts and Act II's curse; no control forecast. */
export function javelinGearThreats(act: number): readonly CampaignThreat[] {
  const raw = [60, 120, 240, 551.25, 800][act - 1];
  assert.ok(Number.isSafeInteger(act) && raw !== undefined, 'Invalid Javelin threat act');
  if (act === 2 || act === 3) return [
    { type: 'physical', rawDamage: act === 2 ? 225 : 379, dodge: 'physical', weight: .95,
      ...(act === 2 ? { resistPenalty: 50 } : {}) },
    { type: 'physical', rawDamage: act === 2 ? 337.5 : 568.5, dodge: 'physical', weight: .05,
      ...(act === 2 ? { resistPenalty: 50 } : {}) },
    ...(['fire', 'cold', 'lightning', 'arcane', 'poison'] as const)
      .map(type => ({ type, rawDamage: raw, dodge: 'magical' as const, weight: 1 }))
  ];
  return [{ type: 'physical', rawDamage: raw, dodge: 'physical', weight: 1 },
    { type: 'arcane', rawDamage: act === 4 ? 400 : raw, dodge: 'magical', weight: 1 }];
}

/** Supplied XP verifies native allocation only; never an earned-route or balance claim. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { xpTotal } from '@/engine/progression/xp';
import { getSkillsForClass, getSkillRequiredLevel } from '@/stores/skillsHelpers';
import { canonicalSkillIdFromData } from '@/engine/skills/dataCatalog';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { snapshotStores } from '@/stores/persistence';
import { abortSubAreaRun, playerToCombatUnit } from '@/stores/combatHelpers';
import { useCombatStore } from '@/stores/combatStore';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { growCampaignBuild, prepareCampaignCombo } from './actions';
import { campaignRequest, type CampaignProfile, type CampaignWave } from './policy';
import { useMapStore } from '@/stores/mapStore';
import { corpseDecoyCampaignProfile, intendedCampaignProfiles } from './intended-profiles';
import growth from './intended-growth-v1.json';
import { startCampaignAdmission } from './admission';
import { runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { composeAssassinTrapRanks } from '@/engine/skills/assassin-traps';
import { composeCorpseExplosion } from '@/engine/skills/corpse-explosion';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { useMercStore } from '@/stores/mercStore';
import { mercToCombatUnit } from '@/stores/mercToCombatUnit';
import { inspectRecordedWaves } from '@/stores/recordedWaveReceipt';
import { useInventoryStore } from '@/stores/inventoryStore';
import { trainingCurseRecovery } from './training-draw-recovery';
import { prepareTownRespec, executeTownRespec } from '@/stores/respecActions';
import { claimQuestReward } from '@/features/quests/claimReward';
import { prepareEarnedDoubleThrowProfile } from './throw-progression';
import { composeFindPotion } from '@/engine/skills/find-potion';
import { getSkill } from '@/engine/skills/registry';
import { composeDruidAllyAuras } from '@/engine/skills/druid-ally-auras';
import { composeStatAura } from '@/engine/skills/stat-auras';

it.each([false, true])('Holy Bolt invests in learned late Conviction with native budgets (batched: %s)', batched => {
  expect(createCharacter('Late Conviction', 'paladin').ok).toBe(true);
  const profile = intendedCampaignProfiles['paladin-holy-bolt-intended-v1'];
  const created = snapshotStores(); assert.ok(created);
  for (const level of batched ? [2, 39, 40, 44, 45, 80] : Array.from({ length: 80 }, (_, i) => i + 1)) {
    const previous = usePlayerStore.getState().player; assert.ok(previous);
    const missingXp = xpTotal(level) - xpTotal(previous.level) - previous.experience;
    if (missingXp > 0) usePlayerStore.getState().gainExperience(missingXp);
    const before = snapshotStores(); assert.ok(before);
    growCampaignBuild(profile, row => {
      if (row.kind === 'allocate-skill' || row.kind === 'select-aura') expect(row.result).toBe('ok');
    });
    const after = snapshotStores(); assert.ok(after);
    const ranks = after.player.skillLevels ?? {};
    const spent = Object.entries(ranks).reduce((sum, [id, rank]) =>
      sum + rank - (before.player.skillLevels?.[id] ?? 0), 0);
    expect(after.player.skillPoints).toBe(before.player.skillPoints - spent);
    expect(after.player.skillPoints).toBeGreaterThanOrEqual(0);
    expect(after.player.respecsRemaining).toEqual(created.player.respecsRemaining);
    expect(after.player.experience).toBe(before.player.experience);
    for (const [id, rank] of Object.entries(before.player.skillLevels ?? {}))
      expect(ranks[id]).toBeGreaterThanOrEqual(rank);
    for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
      expect(after[key]).toEqual(created[key]);
    const conviction = ranks['paladin.conviction'] ?? 0;
    expect(after.player.selectedAuraId).toBe(level < 2 ? undefined : conviction > 0
      ? 'paladin.conviction' : 'paladin.prayer');
    if (level < 40) expect(conviction).toBe(0);
    if (conviction > 0) {
      expect(ranks).toMatchObject({ 'paladin.holy_bolt': 20, 'paladin.blessed_hammer': 20,
        'paladin.thorns': 1, 'paladin.sanctuary': 1 });
      expect(composeStatAura(after.player)).toMatchObject({ selectedAuraId: 'paladin.conviction',
        rank: conviction, enemyResistReductionPct: 25, bonuses: { arcaneDamagePct: conviction * .01 } });
    }
    if (level === 80) expect(conviction).toBe(20);
    growCampaignBuild(profile, () => undefined);
    expect(snapshotStores()).toEqual(after);
  }
});

it('Holy Bolt funds late Conviction only through an explicit native skill reset', () => {
  expect(createCharacter('Conviction reset', 'paladin').ok).toBe(true);
  const profile = intendedCampaignProfiles['paladin-holy-bolt-intended-v1'];
  const legacy: CampaignProfile = { ...profile, targets: profile.targets.filter(target =>
    !['paladin.thorns', 'paladin.sanctuary', 'paladin.conviction'].includes(target.id)) };
  // Supplied XP verifies the actual checkpoint's 63-rank budget without touching that save.
  usePlayerStore.getState().gainExperience(xpTotal(58));
  growCampaignBuild(legacy, () => undefined);
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillPoints).toBe(0);
  expect(before.player.skillLevels).toEqual({ 'paladin.holy_fire': 1, 'paladin.zeal': 1,
    'paladin.sacrifice': 1, 'paladin.prayer': 20, 'paladin.holy_bolt': 20, 'paladin.blessed_hammer': 20 });
  growCampaignBuild(profile, () => undefined);
  expect(snapshotStores()).toEqual(before);
  const quote = prepareTownRespec('npc/akara', 'skill'); assert.equal(quote.kind, 'ok');
  expect({ refund: quote.refund, cost: quote.cost }).toEqual({ refund: 63, cost: 0 });
  expect(executeTownRespec(quote.request)).toBe('ok');
  growCampaignBuild(profile, () => undefined);
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.skillPoints).toBe(0);
  expect(after.player.skillLevels).toEqual({ 'paladin.sacrifice': 1, 'paladin.prayer': 1,
    'paladin.holy_bolt': 20, 'paladin.blessed_hammer': 20, 'paladin.thorns': 1,
    'paladin.sanctuary': 1, 'paladin.conviction': 19 });
  expect(after.player.selectedAuraId).toBe('paladin.conviction');
  expect(after.player.respecsRemaining).toEqual({ ...before.player.respecsRemaining,
    skill: before.player.respecsRemaining.skill - 1 });
  for (const key of ['coreStats', 'statPoints', 'level', 'experience', 'comboOrder'] as const)
    expect(after.player[key]).toEqual(before.player[key]);
  for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(before[key]);
  growCampaignBuild(profile, () => undefined);
  expect(snapshotStores()).toEqual(after);
});

it.each([false, true])('Druid invests late Heart with native budgets and no implicit reset (batched: %s)', batched => {
  expect(createCharacter('Late Heart', 'druid').ok).toBe(true);
  const profile = intendedCampaignProfiles['druid-summon-intended-v1'];
  const created = snapshotStores(); assert.ok(created);
  const levels = batched ? [40, 80] : Array.from({ length: 80 }, (_, i) => i + 1);
  for (const level of levels) {
    const previous = usePlayerStore.getState().player; assert.ok(previous);
    if (level > previous.level)
      usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(previous.level));
    const before = snapshotStores(); assert.ok(before);
    growCampaignBuild(profile, row => {
      if (row.kind === 'allocate-skill' || row.kind === 'allocate-stats') expect(row.result).toBe('ok');
    });
    const after = snapshotStores(); assert.ok(after);
    const ranks = after.player.skillLevels ?? {};
    const spent = Object.entries(ranks).reduce((sum, [id, rank]) =>
      sum + rank - (before.player.skillLevels?.[id] ?? 0), 0);
    expect(after.player.skillPoints).toBe(before.player.skillPoints - spent);
    expect(after.player.skillPoints).toBeGreaterThanOrEqual(0);
    expect(after.player.experience).toBe(before.player.experience);
    expect(after.player.respecsRemaining).toEqual(created.player.respecsRemaining);
    for (const [id, rank] of Object.entries(before.player.skillLevels ?? {}))
      expect(ranks[id]).toBeGreaterThanOrEqual(rank);
    for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
      expect(after[key]).toEqual(created[key]);
    expect(composeDruidAllyAuras(after.player)?.heartRank ?? 0)
      .toBe(ranks['druid.heart_of_wolverine'] ?? 0);
    if (level >= 18 && level < 40) expect(ranks['druid.heart_of_wolverine']).toBe(1);
    if (level === 40) {
      expect(ranks['druid.summon_grizzly']).toBe(batched ? 20 : 12);
      expect(ranks['druid.summon_dire_wolf']).toBe(10);
      expect(ranks['druid.heart_of_wolverine']).toBe(batched ? 8 : 1);
    }
    if ((ranks['druid.heart_of_wolverine'] ?? 0) > 1) {
      expect(ranks['druid.summon_grizzly']).toBe(20);
      expect(ranks['druid.summon_dire_wolf']).toBe(10);
    }
    if (level === 80) expect(ranks['druid.heart_of_wolverine']).toBe(20);
    growCampaignBuild(profile, () => undefined);
    expect(snapshotStores()).toEqual(after);
  }
});

it('Druid preserves spent legacy ranks until an explicit native skill reset funds late Heart', () => {
  expect(createCharacter('Heart reset', 'druid').ok).toBe(true);
  const profile = intendedCampaignProfiles['druid-summon-intended-v1'];
  // Supplied XP produces 61 native ranks, matching the retained allocation budget,
  // without importing, resetting or advancing the actual earned level50 save.
  const legacy: CampaignProfile = { ...profile, targets: profile.targets.filter(target =>
    !(target.id === 'druid.heart_of_wolverine' && target.rank > 1)) };
  usePlayerStore.getState().gainExperience(xpTotal(56));
  growCampaignBuild(legacy, () => undefined);
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillPoints).toBe(0);
  expect(before.player.skillLevels).toEqual({ 'druid.firestorm': 1, 'druid.raven': 6,
    'druid.poison_creeper': 1, 'druid.oak_sage': 10, 'druid.summon_spirit_wolf': 10,
    'druid.carrion_vine': 1, 'druid.summon_dire_wolf': 10, 'druid.heart_of_wolverine': 1,
    'druid.solar_creeper': 1, 'druid.summon_grizzly': 20 });
  growCampaignBuild(profile, () => undefined);
  expect(snapshotStores()).toEqual(before);
  const quote = prepareTownRespec('npc/akara', 'skill');
  assert.equal(quote.kind, 'ok');
  expect({ refund: quote.refund, cost: quote.cost }).toEqual({ refund: 61, cost: 0 });
  expect(executeTownRespec(quote.request)).toBe('ok');
  const reset = snapshotStores(); assert.ok(reset);
  expect(reset.player.skillLevels).toEqual({});
  expect(reset.player.skillPoints).toBe(61);
  expect(reset.player.respecsRemaining).toEqual({ ...before.player.respecsRemaining,
    skill: before.player.respecsRemaining.skill - 1 });
  growCampaignBuild(profile, () => undefined);
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.skillPoints).toBe(0);
  expect(after.player.skillLevels).toEqual({ 'druid.raven': 1, 'druid.poison_creeper': 1,
    'druid.oak_sage': 1, 'druid.summon_spirit_wolf': 6, 'druid.carrion_vine': 1,
    'druid.summon_dire_wolf': 10, 'druid.heart_of_wolverine': 20,
    'druid.solar_creeper': 1, 'druid.summon_grizzly': 20 });
  expect(composeDruidAllyAuras(after.player)).toMatchObject({ oakRank: 1, heartRank: 20 });
  for (const key of ['coreStats', 'statPoints', 'level', 'experience'] as const)
    expect(after.player[key]).toEqual(before.player[key]);
  expect(after.player.respecsRemaining).toEqual(reset.player.respecsRemaining);
  for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(before[key]);
  growCampaignBuild(profile, () => undefined);
  expect(snapshotStores()).toEqual(after);
});

it.each([false, true])('Zeal stages learned auras without changing paid growth (batched: %s)', batched => {
  expect(createCharacter('Zeal aura growth', 'paladin').ok).toBe(true);
  const profile = intendedCampaignProfiles['paladin-zeal-intended-v1'];
  const created = snapshotStores(); assert.ok(created);
  for (const level of batched ? [1, 2, 5, 6, 11, 12, 80] : Array.from({ length: 80 }, (_, i) => i + 1)) {
    const previous = usePlayerStore.getState().player; assert.ok(previous);
    const missingXp = xpTotal(level) - xpTotal(previous.level) - previous.experience;
    if (missingXp > 0) usePlayerStore.getState().gainExperience(missingXp);
    const before = snapshotStores(); assert.ok(before);
    growCampaignBuild(profile, row => {
      if (row.kind === 'allocate-skill' || row.kind === 'allocate-stats') expect(row.result).toBe('ok');
      if (row.kind === 'select-aura') {
        expect(row.result).toBe('ok');
        expect(row.after).toEqual({ ...(row.before as object), selectedAuraId: row.id });
      }
    });
    const after = snapshotStores(); assert.ok(after);
    expect(after.player.selectedAuraId).toBe(level < 2 ? undefined :
      level >= 6 && level < 12 ? 'paladin.holy-fire' : 'paladin.might');
    const ranks = after.player.skillLevels ?? {};
    const spent = Object.entries(ranks).reduce((sum, [id, rank]) =>
      sum + rank - (before.player.skillLevels?.[id] ?? 0), 0);
    expect(after.player.skillPoints).toBe(before.player.skillPoints - spent);
    expect(after.player.skillPoints).toBeGreaterThanOrEqual(0);
    expect(ranks['paladin.holy_fire']).toBe(1);
    expect(after.player.experience).toBe(before.player.experience);
    expect(after.player.respecsRemaining).toEqual(created.player.respecsRemaining);
    for (const [id, rank] of Object.entries(before.player.skillLevels ?? {}))
      expect(ranks[id]).toBeGreaterThanOrEqual(rank);
    for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
      expect(after[key]).toEqual(created[key]);
    for (const stat of ['strength', 'dexterity', 'vitality', 'energy'] as const)
      expect(after.player.coreStats[stat]).toBe(before.player.coreStats[stat] +
        Math.floor(before.player.statPoints / 5) * profile.statsPerLevel[stat]);
    if (level === 80) expect(ranks).toEqual({ 'paladin.holy_fire': 1, 'paladin.zeal': 20,
      'paladin.sacrifice': 5, 'paladin.might': 20 });
    growCampaignBuild(profile, () => undefined);
    expect(snapshotStores()).toEqual(after);
  }
});

it.each([6, 12])('Zeal projects only its selected learned aura into native admission at level %s', level => {
  expect(createCharacter('Zeal projection', 'paladin').ok).toBe(true);
  const profile = intendedCampaignProfiles['paladin-zeal-intended-v1'];
  for (let earned = 1; earned <= level; earned++) {
    if (earned > 1) usePlayerStore.getState().gainExperience(xpTotal(earned) - xpTotal(earned - 1));
    growCampaignBuild(profile, () => undefined);
  }
  startCampaignAdmission(1, 'areas/act1-blood-moor');
  const native = inspectRecordedWaves().currentPublished?.binding.engineInput; assert.ok(native);
  const hero = native.playerTeam.find(unit => unit.kind === 'hero'); assert.ok(hero);
  if (level === 6) {
    expect(native.statAura).toMatchObject({ selectedAuraId: 'paladin.holy-fire', rank: 1 });
    expect(native.mightAura).toBeUndefined();
    expect(hero.skillOrder).toContain('paladin.sacrifice');
    expect(hero.skillOrder).not.toContain('paladin.zeal');
  } else {
    expect(native.statAura).toBeUndefined();
    expect(native.mightAura).toBeDefined();
    expect(hero.skillOrder[0]).toBe('paladin.zeal');
  }
});

it('Zeal stops on native refusal of an unlearned staged aura without granting ranks', () => {
  expect(createCharacter('Zeal refusal', 'paladin').ok).toBe(true);
  usePlayerStore.getState().gainExperience(xpTotal(6));
  const profile: CampaignProfile = { ...intendedCampaignProfiles['paladin-zeal-intended-v1'], targets: [],
    auraStages: [{ id: 'paladin.prayer', level: 6 }] };
  const before = snapshotStores(); assert.ok(before);
  const records: Readonly<Record<string, unknown>>[] = [];
  expect(() => { growCampaignBuild(profile, row => { records.push(row); }); })
    .toThrow('Campaign aura selection refused');
  expect(snapshotStores()).toEqual(before);
  expect(records).toMatchObject([{ kind: 'select-aura', id: 'paladin.prayer', result: 'ineligible',
    before: before.player, after: before.player }]);
});

function prepareLateCorpseDecoy() {
  expect(createCharacter('Decoy QA', 'necromancer').ok).toBe(true);
  const original = intendedCampaignProfiles['necromancer-bone-intended-v1'];
  for (let level = 1; level <= 80; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(original, () => undefined);
  }
  const before = snapshotStores(); assert.ok(before);
  const records: Readonly<Record<string, unknown>>[] = [];
  growCampaignBuild(corpseDecoyCampaignProfile, row => { records.push(row); });
  return { before, records };
}

it.each([false, true])('Double Swing invests late points in sword offense without granting points (batched: %s)', batched => {
  expect(createCharacter('Swing investment', 'barbarian').ok).toBe(true);
  const profile = intendedCampaignProfiles['barbarian-double-swing-intended-v1'];
  const created = snapshotStores(); assert.ok(created);
  for (const level of batched ? [6, 12, 18, 24, 30, 49, 80] : Array.from({ length: 80 }, (_, i) => i + 1)) {
    const previous = usePlayerStore.getState().player; assert.ok(previous);
    const missingXp = xpTotal(level) - xpTotal(previous.level) - previous.experience;
    if (missingXp > 0) usePlayerStore.getState().gainExperience(missingXp);
    const before = snapshotStores(); assert.ok(before);
    growCampaignBuild(profile, row => {
      if (row.kind === 'allocate-skill' || row.kind === 'allocate-stats') expect(row.result).toBe('ok');
    });
    const after = snapshotStores(); assert.ok(after);
    const ranks = after.player.skillLevels ?? {};
    const spent = Object.entries(ranks).reduce((sum, [id, rank]) =>
      sum + rank - (before.player.skillLevels?.[id] ?? 0), 0);
    expect(after.player.skillPoints).toBe(before.player.skillPoints - spent);
    expect(after.player.skillPoints).toBeGreaterThanOrEqual(0);
    expect(after.player.respecsRemaining).toEqual(created.player.respecsRemaining);
    expect(after.player.experience).toBe(before.player.experience);
    for (const [id, rank] of Object.entries(before.player.skillLevels ?? {}))
      expect(ranks[id]).toBeGreaterThanOrEqual(rank);
    if (level >= 18) expect(ranks['barbarian.iron_skin']).toBe(1);
    if (level === 49) expect(ranks['barbarian.sword_mastery']).toBeGreaterThan(0);
    if (level === 80) expect(ranks).toEqual({ 'barbarian.bash': 5, 'barbarian.howl': 1,
      'barbarian.double_swing': 20, 'barbarian.shout': 1, 'barbarian.increased_stamina': 1,
      'barbarian.iron_skin': 1, 'barbarian.battle_orders': 10, 'barbarian.battle_command': 1,
      'barbarian.natural_resistance': 1, 'barbarian.sword_mastery': 20 });
    for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
      expect(after[key]).toEqual(created[key]);
    growCampaignBuild(profile, () => undefined);
    expect(snapshotStores()).toEqual(after);
  }
});

// Constructed target and supplied XP verify native skill delivery, not earned viability.
it('Double Swing uses its sword investment and attacks before Howl', () => {
  expect(createCharacter('Swing priority', 'barbarian').ok).toBe(true);
  const profile = intendedCampaignProfiles['barbarian-double-swing-intended-v1'];
  for (let level = 1; level <= 49; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, () => undefined);
  }
  const sword = { id: 'swing-regression-sword', baseId: 'items/base/wp1h-scimitar',
    rarity: 'normal' as const, level: 1, ilvl: 1, identified: true, equipped: false };
  useInventoryStore.getState().addItem(sword);
  expect(useInventoryStore.getState().equipItem(sword).ok).toBe(true);
  const player = usePlayerStore.getState().player; assert.ok(player);
  const projected = playerToCombatUnit(player);
  const mastery = player.skillLevels?.['barbarian.sword_mastery'] ?? 0;
  expect(mastery).toBeGreaterThan(0);
  expect(projected.increasedDamagePct?.physical).toBeCloseTo(mastery * 0.03);
  const hero = { ...projected, life: projected.stats.lifeMax, mana: projected.stats.manaMax };
  const target: CombatUnit = { ...hero, id: 'swing-stationary-target', side: 'enemy', kind: 'monster',
    life: 100000, battleCommandRank: 0, skillOrder: [], skillLevels: {},
    stats: { ...hero.stats, lifeMax: 100000, defense: 0, physDodge: 0 },
    statuses: [{ id: 'stun', sourceId: hero.id, stacks: 1, remaining: -1 }] };
  const saved = snapshotStores();
  const battle = runBattleRecorded({ seed: 11, act: 4, maxRounds: 1, playerTeam: [hero], enemyTeam: [target] });
  const attacks = battle.events.flatMap(event => event.kind === 'action' && event.actor === hero.id &&
    event.skillId !== 'barbarian.battle_command' ? [event.skillId] : []);
  expect(attacks[0]).toBe('barbarian.double_swing');
  expect(snapshotStores()).toEqual(saved);
});

it.each([false, true])('Traps invests early and late in Blade while retaining both fields (batched: %s)', batched => {
  expect(createCharacter('Traps investment', 'assassin').ok).toBe(true);
  const profile = intendedCampaignProfiles['assassin-traps-intended-v1'];
  const created = snapshotStores(); assert.ok(created);
  const finalRanks = { 'assassin.fire_blast': 5, 'assassin.shock_web': 6,
    'assassin.charged_bolt_sentry': 12, 'assassin.blade_sentinel': 20, 'assassin.lightning_sentry': 20 };
  for (const level of batched ? [5, 6, 11, 12, 14, 24, 32, 80] : Array.from({ length: 80 }, (_, i) => i + 1)) {
    const previous = usePlayerStore.getState().player; assert.ok(previous);
    const missingXp = xpTotal(level) - xpTotal(previous.level) - previous.experience;
    if (missingXp > 0) usePlayerStore.getState().gainExperience(missingXp);
    const before = snapshotStores(); assert.ok(before);
    growCampaignBuild(profile, row => {
      if (row.kind === 'allocate-skill' || row.kind === 'allocate-stats') expect(row.result).toBe('ok');
    });
    const after = snapshotStores(); assert.ok(after);
    const ranks = after.player.skillLevels ?? {};
    const spent = Object.entries(ranks).reduce((sum, [id, rank]) =>
      sum + rank - (before.player.skillLevels?.[id] ?? 0), 0);
    expect(after.player.skillPoints).toBe(before.player.skillPoints - spent);
    expect(after.player.skillPoints).toBeGreaterThanOrEqual(0);
    expect(after.player.respecsRemaining).toEqual(created.player.respecsRemaining);
    expect(after.player.experience).toBe(before.player.experience);
    for (const [id, rank] of Object.entries(before.player.skillLevels ?? {}))
      expect(ranks[id]).toBeGreaterThanOrEqual(rank);
    for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
      expect(after[key]).toEqual(created[key]);
    for (const stat of ['strength', 'dexterity', 'vitality', 'energy'] as const)
      expect(after.player.coreStats[stat]).toBe(before.player.coreStats[stat] +
        Math.floor(before.player.statPoints / 5) * profile.statsPerLevel[stat]);
    if (level < 12) {
      expect(ranks['assassin.blade_sentinel'] ?? 0).toBe(0);
      expect(ranks['assassin.charged_bolt_sentry'] ?? 0).toBe(0);
    }
    if (level === 14) {
      expect(ranks['assassin.blade_sentinel']).toBe(4);
      expect(ranks['assassin.charged_bolt_sentry']).toBe(1);
      expect(ranks['assassin.shock_web']).toBe(6);
      expect(ranks['assassin.fire_blast']).toBe(5);
      expect(after.player.skillPoints).toBe(0);
    }
    if (level === 80) expect(ranks).toEqual(finalRanks);
    growCampaignBuild(profile, () => undefined);
    expect(snapshotStores()).toEqual(after);
  }
});

it('Traps spends five held points on late Blade investment without resetting its checkpoint', () => {
  expect(createCharacter('Traps late', 'assassin').ok).toBe(true);
  const profile = intendedCampaignProfiles['assassin-traps-intended-v1'];
  // Supplied XP produces the old capped ranks and five held points without quest grants.
  usePlayerStore.getState().gainExperience(xpTotal(52));
  growCampaignBuild({ ...profile, targets: profile.targets.filter(target =>
    target.id !== 'assassin.blade_sentinel' || target.rank <= 8) }, () => undefined);
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillLevels?.['assassin.blade_sentinel']).toBe(8);
  expect(before.player.skillPoints).toBe(5);
  const purchases: Readonly<Record<string, unknown>>[] = [];
  growCampaignBuild(profile, row => { if (row.kind === 'allocate-skill') purchases.push(row); });
  const after = snapshotStores(); assert.ok(after);
  expect(after.player).toEqual({ ...before.player, skillPoints: 0,
    skillLevels: { ...before.player.skillLevels, 'assassin.blade_sentinel': 13 } });
  expect(purchases).toHaveLength(5);
  for (const purchase of purchases) expect(purchase).toMatchObject({
    kind: 'allocate-skill', target: { id: 'assassin.blade_sentinel' }, result: 'ok' });
  for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(before[key]);
  growCampaignBuild(profile, () => undefined);
  expect(snapshotStores()).toEqual(after);
});

// Supplied XP/stationary target verify paid field delivery, not earned viability.
it('Traps delivers the invested physical field and its lightning companion', () => {
  const profile = intendedCampaignProfiles['assassin-traps-intended-v1'];
  expect(createCharacter('Traps delivery', 'assassin').ok).toBe(true);
  for (let level = 1; level <= 14; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, () => undefined);
  }
  startCampaignAdmission(1, 'areas/act1-blood-moor');
  const native = inspectRecordedWaves().currentPublished?.binding.engineInput; assert.ok(native);
  const hero = native.playerTeam.find(unit => unit.kind === 'hero'); assert.ok(hero);
  expect(hero.assassinTrapRanks).toEqual({ 'assassin.blade_sentinel': 4,
    'assassin.charged_bolt_sentry': 1, 'assassin.shock_web': 6 });
  const enemy: CombatUnit = { id: 'traps-investment-target', name: 'Traps target', side: 'enemy', kind: 'monster',
    tier: 'trash', level: 14, life: 100000, mana: 0,
    stats: { ...hero.stats, life: 100000, lifeMax: 100000, mana: 0, manaMax: 0, defense: 0,
      magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'traps-investment-fixture', stacks: 1, remaining: -1 }],
    cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
  const out = runBattleRecorded({ ...native, seed: 7, enemyTeam: [enemy], maxRounds: 40 });
  for (const skillId of ['assassin.blade_sentinel', 'assassin.charged_bolt_sentry']) {
    const casts = out.events.filter(event => event.kind === 'action' && event.actor === hero.id && event.skillId === skillId);
    expect(casts.length).toBeGreaterThan(1);
    for (const cast of casts) expect(out.events.some(event => event.kind === 'mana' && event.target === hero.id &&
      event.reason === 'cast' && event.simClockMs === cast.simClockMs), `${skillId} pays mana`).toBe(true);
  }
  for (const damageType of ['physical', 'lightning']) expect(out.events.filter(event => event.kind === 'damage' &&
    event.source === hero.id && event.target === enemy.id && event.damageType === damageType && event.amount > 0).length)
    .toBeGreaterThan(2);
});

it('Martial late Cobra target preserves every native state through level39', () => {
  const profile = intendedCampaignProfiles['assassin-martial-intended-v1'];
  const legacy: CampaignProfile = { ...profile, targets: profile.targets.filter(target =>
    !(target.id === 'assassin.cobra_strike' && target.rank > 6)) };
  const histories = [legacy, profile].map(policy => {
    resetEarnedStores(); useHydrationStore.getState().setStatus('ready');
    expect(createCharacter('Early Martial', 'assassin').ok).toBe(true);
    return Array.from({ length: 39 }, (_, i) => {
      const level = i + 1;
      if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
      growCampaignBuild(policy, () => undefined);
      return snapshotStores();
    });
  });
  expect(histories[1]).toEqual(histories[0]);
});

it('Martial retains spent legacy ranks until an explicit reset funds late Cobra and removes untargeted Web', () => {
  expect(createCharacter('Cobra reset', 'assassin').ok).toBe(true);
  const profile = intendedCampaignProfiles['assassin-martial-intended-v1'];
  const legacy: CampaignProfile = { ...profile, targets: profile.targets.filter(target =>
    !(target.id === 'assassin.cobra_strike' && target.rank > 6)) };
  // Supplied XP verifies the retained 56-rank budget without touching earned saves.
  usePlayerStore.getState().gainExperience(xpTotal(52));
  growCampaignBuild(legacy, () => undefined);
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillPoints).toBe(0);
  expect(before.player.skillLevels).toEqual({ 'assassin.shock_web': 1,
    'assassin.tiger_strike': 6, 'assassin.dragon_talon': 12, 'assassin.claw_mastery': 1,
    'assassin.fire_blast': 1, 'assassin.fists_of_fire': 8, 'assassin.burst_of_speed': 1,
    'assassin.cobra_strike': 6, 'assassin.dragon_tail': 20 });
  growCampaignBuild(profile, () => undefined);
  expect(snapshotStores()).toEqual(before);
  const quote = prepareTownRespec('npc/akara', 'skill'); assert.equal(quote.kind, 'ok');
  expect({ refund: quote.refund, cost: quote.cost }).toEqual({ refund: 56, cost: 0 });
  expect(executeTownRespec(quote.request)).toBe('ok');
  const reset = snapshotStores(); assert.ok(reset);
  expect(reset.player.skillLevels).toEqual({});
  expect(reset.player.skillPoints).toBe(56);
  expect(reset.player.respecsRemaining).toEqual({ ...before.player.respecsRemaining,
    skill: before.player.respecsRemaining.skill - 1 });
  growCampaignBuild(profile, () => undefined);
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.skillPoints).toBe(0);
  expect(after.player.skillLevels).toEqual({ 'assassin.tiger_strike': 1,
    'assassin.dragon_talon': 12, 'assassin.claw_mastery': 1, 'assassin.fire_blast': 1,
    'assassin.fists_of_fire': 8, 'assassin.burst_of_speed': 1,
    'assassin.cobra_strike': 12, 'assassin.dragon_tail': 20 });
  expect(after.player.comboOrder).toEqual(profile.priority);
  expect(playerToCombatUnit(after.player).skillOrder)
    .toEqual(profile.priority.filter(id => id !== 'assassin.shock_web'));
  expect(composeAssassinTrapRanks(after.player)).toEqual({});
  expect(after.player.respecsRemaining).toEqual(reset.player.respecsRemaining);
  for (const key of Object.keys(before.player) as (keyof typeof before.player)[])
    if (!['skillLevels', 'skillPoints', 'respecsRemaining', 'comboOrder'].includes(key))
      expect(after.player[key]).toEqual(before.player[key]);
  for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(before[key]);
  growCampaignBuild(profile, () => undefined);
  expect(snapshotStores()).toEqual(after);
});

it.each([false, true])('Martial funds Web prerequisites and reserves level-six unlocks (batched: %s)', batched => {
  expect(createCharacter('Martial points', 'assassin').ok).toBe(true);
  const profile = intendedCampaignProfiles['assassin-martial-intended-v1'];
  const created = snapshotStores(); assert.ok(created);
  const finalRanks = { 'assassin.tiger_strike': 8, 'assassin.dragon_talon': 12,
    'assassin.claw_mastery': 1, 'assassin.fire_blast': 1, 'assassin.fists_of_fire': 8,
    'assassin.burst_of_speed': 1, 'assassin.cobra_strike': 20, 'assassin.dragon_tail': 20,
    'assassin.shock_web': 1 };
  for (const level of batched ? [5, 6, 12, 18, 32, 80] : Array.from({ length: 80 }, (_, i) => i + 1)) {
    const previous = usePlayerStore.getState().player; assert.ok(previous);
    const missingXp = xpTotal(level) - xpTotal(previous.level) - previous.experience;
    if (missingXp > 0) usePlayerStore.getState().gainExperience(missingXp);
    const before = snapshotStores(); assert.ok(before);
    growCampaignBuild(profile, row => {
      if (row.kind === 'allocate-skill' || row.kind === 'allocate-stats') expect(row.result).toBe('ok');
    });
    const after = snapshotStores(); assert.ok(after);
    const ranks = after.player.skillLevels ?? {};
    const spent = Object.entries(ranks).reduce((sum, [id, rank]) =>
      sum + rank - (before.player.skillLevels?.[id] ?? 0), 0);
    expect(after.player.skillPoints).toBe(before.player.skillPoints - spent);
    expect(after.player.skillPoints).toBeGreaterThanOrEqual(0);
    expect(after.player.respecsRemaining).toEqual(created.player.respecsRemaining);
    expect(after.player.experience).toBe(before.player.experience);
    for (const [id, rank] of Object.entries(before.player.skillLevels ?? {}))
      expect(ranks[id]).toBeGreaterThanOrEqual(rank);
    for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
      expect(after[key]).toEqual(created[key]);
    for (const stat of ['strength', 'dexterity', 'vitality', 'energy'] as const)
      expect(after.player.coreStats[stat]).toBe(before.player.coreStats[stat] +
        Math.floor(before.player.statPoints / 5) * profile.statsPerLevel[stat]);
    if (level === 5) {
      expect(ranks['assassin.fire_blast']).toBe(1);
      expect(ranks['assassin.dragon_talon']).toBe(1);
      expect(ranks['assassin.tiger_strike']).toBe(1);
      expect(after.player.skillPoints).toBe(1);
      expect(composeAssassinTrapRanks(after.player)).toEqual({});
    }
    if (level === 6) {
      expect(ranks['assassin.fists_of_fire']).toBe(1);
      expect(ranks['assassin.burst_of_speed']).toBe(1);
      expect(after.player.skillPoints).toBe(0);
      expect(composeAssassinTrapRanks(after.player)).toEqual({ 'assassin.shock_web': 1 });
    }
    if (level === 80) expect(ranks).toEqual(finalRanks);
    growCampaignBuild(profile, () => undefined);
    expect(snapshotStores()).toEqual(after);
  }
});

// Supplied XP and a stationary target prove native skill delivery, not earned viability.
it('Martial executes paid Web and builders/finishers at level six', () => {
  const profile = intendedCampaignProfiles['assassin-martial-intended-v1'];
  expect(createCharacter('Martial delivery', 'assassin').ok).toBe(true);
  for (let level = 1; level <= 6; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, () => undefined);
  }
  startCampaignAdmission(1, 'areas/act1-blood-moor');
  const native = inspectRecordedWaves().currentPublished?.binding.engineInput; assert.ok(native);
  const hero = native.playerTeam.find(unit => unit.kind === 'hero'); assert.ok(hero);
  expect(hero.assassinTrapRanks).toEqual({ 'assassin.shock_web': 1 });
  const enemy: CombatUnit = { id: 'martial-web-target', name: 'Martial target', side: 'enemy', kind: 'monster',
    tier: 'trash', level: 6, life: 100000, mana: 0,
    stats: { ...hero.stats, life: 100000, lifeMax: 100000, mana: 0, manaMax: 0, defense: 0,
      magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'martial-web-fixture', stacks: 1, remaining: -1 }],
    cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
  const out = runBattleRecorded({ ...native, seed: 7, enemyTeam: [enemy], maxRounds: 40 });
  for (const skillId of ['assassin.burst_of_speed', 'assassin.shock_web', 'assassin.fists_of_fire', 'assassin.dragon_talon']) {
    const cast = out.events.find(event => event.kind === 'action' && event.actor === hero.id && event.skillId === skillId);
    assert.ok(cast, `${skillId} must execute`);
    expect(out.events.some(event => event.kind === 'mana' && event.target === hero.id && event.reason === 'cast' &&
      event.simClockMs === cast.simClockMs), `${skillId} pays mana`).toBe(true);
  }
  expect(out.events.some(event => event.kind === 'damage' && event.source === hero.id &&
    event.target === enemy.id && event.damageType === 'lightning' && event.amount > 0)).toBe(true);
});

// Supplied XP verifies point investment and paid delivery, not earned reachability.
it('Martial invests early points in its finisher while retaining recovery and Web', () => {
  const profile = intendedCampaignProfiles['assassin-martial-intended-v1'];
  expect(createCharacter('Martial finisher', 'assassin').ok).toBe(true);
  for (let level = 1; level <= 12; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, () => undefined);
  }
  const player = usePlayerStore.getState().player; assert.ok(player);
  expect(player.skillLevels?.['assassin.fists_of_fire']).toBe(1);
  expect(player.skillLevels?.['assassin.dragon_talon']).toBeGreaterThanOrEqual(6);
  expect(player.skillLevels?.['assassin.cobra_strike']).toBe(1);
  expect(player.skillPoints).toBe(0);
  startCampaignAdmission(1, 'areas/act1-blood-moor');
  const native = inspectRecordedWaves().currentPublished?.binding.engineInput; assert.ok(native);
  const hero = native.playerTeam.find(unit => unit.kind === 'hero'); assert.ok(hero);
  const enemy: CombatUnit = { id: 'martial-finisher-target', name: 'Martial target', side: 'enemy', kind: 'monster',
    tier: 'trash', level: 12, life: 100000, mana: 0,
    stats: { ...hero.stats, life: 100000, lifeMax: 100000, mana: 0, manaMax: 0, defense: 0,
      magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'martial-finisher-fixture', stacks: 1, remaining: -1 }],
    cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
  const out = runBattleRecorded({ ...native, seed: 7, enemyTeam: [enemy], maxRounds: 40 });
  for (const skillId of ['assassin.burst_of_speed', 'assassin.cobra_strike', 'assassin.shock_web',
    'assassin.fists_of_fire', 'assassin.dragon_talon']) {
    const cast = out.events.find(event => event.kind === 'action' && event.actor === hero.id && event.skillId === skillId);
    assert.ok(cast, `${skillId} must execute`);
    expect(out.events.some(event => event.kind === 'mana' && event.target === hero.id && event.reason === 'cast' &&
      event.simClockMs === cast.simClockMs), `${skillId} pays mana`).toBe(true);
  }
  const talon = out.events.find(event => event.kind === 'action' && event.actor === hero.id &&
    event.skillId === 'assassin.dragon_talon'); assert.ok(talon);
  expect(out.events.some(event => event.kind === 'damage' && event.source === hero.id && event.amount > 0 &&
    event.damageType === 'physical' && event.simClockMs === talon.simClockMs)).toBe(true);
});

it.each([false, true])('Bow preserves unlock investment before maximizing criticals (batched: %s)', batched => {
  expect(createCharacter('Bow unlocks', 'amazon').ok).toBe(true);
  const profile = intendedCampaignProfiles['amazon-bow-intended-v1'];
  const created = snapshotStores(); assert.ok(created);
  const finalRanks = { 'amazon.magic_arrow': 1, 'amazon.critical_strike': 20,
    'amazon.inner_sight': 1, 'amazon.multiple_shot': 20, 'amazon.dodge': 20,
    'amazon.slow_missiles': 1, 'amazon.penetrate': 1, 'amazon.decoy': 1 };
  for (const level of batched ? [5, 6, 12, 20, 32, 80] : Array.from({ length: 80 }, (_, i) => i + 1)) {
    const previous = usePlayerStore.getState().player; assert.ok(previous);
    const missingXp = xpTotal(level) - xpTotal(previous.level) - previous.experience;
    if (missingXp > 0) usePlayerStore.getState().gainExperience(missingXp);
    const before = snapshotStores(); assert.ok(before);
    growCampaignBuild(profile, row => {
      if (row.kind === 'allocate-skill' || row.kind === 'allocate-stats') expect(row.result).toBe('ok');
    });
    const after = snapshotStores(); assert.ok(after);
    const spent = Object.entries(after.player.skillLevels ?? {}).reduce((sum, [id, rank]) =>
      sum + rank - (before.player.skillLevels?.[id] ?? 0), 0);
    expect(after.player.skillPoints).toBe(before.player.skillPoints - spent);
    expect(after.player.skillPoints).toBeGreaterThanOrEqual(0);
    expect(after.player.respecsRemaining).toEqual(created.player.respecsRemaining);
    expect(after.player.experience).toBe(before.player.experience);
    for (const [id, rank] of Object.entries(before.player.skillLevels ?? {}))
      expect(after.player.skillLevels?.[id]).toBeGreaterThanOrEqual(rank);
    for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
      expect(after[key]).toEqual(created[key]);
    if (level < 20) expect(after.player.skillLevels?.['amazon.critical_strike']).toBe(1);
    if (level === 5) {
      expect(after.player.skillPoints).toBe(3);
      expect(after.player.skillLevels?.['amazon.multiple_shot'] ?? 0).toBe(0);
      expect(after.player.skillLevels?.['amazon.dodge'] ?? 0).toBe(0);
    }
    if (level === 6) {
      expect(after.player.skillLevels?.['amazon.multiple_shot']).toBe(3);
      expect(after.player.skillLevels?.['amazon.dodge']).toBe(1);
      expect(after.player.skillPoints).toBe(0);
      const hero = playerToCombatUnit(after.player);
      expect(hero.skillOrder).toContain('amazon.multiple_shot');
      expect(hero.stats.critChance).toBeGreaterThan(after.player.derivedStats.critChance);
      expect(hero.stats.physDodge).toBeGreaterThan(after.player.derivedStats.physDodge);
    }
    if (level === 80) expect(after.player.skillLevels).toEqual(finalRanks);
    growCampaignBuild(profile, () => undefined);
    expect(snapshotStores()).toEqual(after);
  }
});

it.each([32, 51])('Bow prioritizes its fully invested volley while preparing Decoy at level %i', level => {
  expect(createCharacter('Bow signature', 'amazon').ok).toBe(true);
  const profile = intendedCampaignProfiles['amazon-bow-intended-v1'];
  for (let earned = 1; earned <= level; earned++) {
    if (earned > 1) usePlayerStore.getState().gainExperience(xpTotal(earned) - xpTotal(earned - 1));
    growCampaignBuild(profile, () => undefined);
  }
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillLevels?.['amazon.multiple_shot']).toBe(20);
  prepareCampaignCombo(profile, () => undefined);
  const player = usePlayerStore.getState().player; assert.ok(player);
  const hero = playerToCombatUnit(player);
  expect(hero.skillOrder).toEqual(['amazon.multiple_shot', 'amazon.decoy', 'amazon.slow_missiles']);
  // Supplied XP and this stationary target prove rotation, not earned viability.
  const target: CombatUnit = { id: 'bow-signature-target', name: 'Durable target',
    side: 'enemy', kind: 'monster', tier: 'boss', level, life: 100000, mana: 0,
    gridPosition: { row: 0, col: 2 },
    stats: { ...hero.stats, life: 100000, lifeMax: 100000, mana: 0, manaMax: 0,
      defense: 363, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 50, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [{ id: 'stun', sourceId: 'bow-volley-fixture', stacks: 1, remaining: -1 }],
    skillOrder: [], cooldowns: {}, activeBuffIds: [], enraged: false };
  const out = runBattleRecorded({ seed: 1164890233, act: 4, playerTeam: [hero], enemyTeam: [target], maxRounds: 8 });
  const preparation = out.events.filter(event => event.kind === 'action' && event.actor === hero.id &&
    event.skillId === 'amazon.decoy');
  expect(preparation).toHaveLength(1);
  expect(preparation[0]).toMatchObject({ simClockMs: 0 });
  const action = out.events.find(event => event.kind === 'action' && event.actor === hero.id && event.simClockMs > 0);
  expect(action).toMatchObject({ skillId: 'amazon.multiple_shot' }); assert.ok(action);
  expect(out.events.some(event => event.kind === 'damage' && event.source === hero.id &&
    event.target === target.id && event.simClockMs === action.simClockMs &&
    event.damageType === 'physical' && event.amount > 0)).toBe(true);
  const previous = out.events.slice(0, out.events.indexOf(action))
    .filter(event => event.kind === 'mana' && event.target === hero.id).at(-1);
  expect(out.events.find(event => event.kind === 'mana' && event.target === hero.id &&
    event.reason === 'cast' && event.simClockMs === action.simClockMs)).toMatchObject({
    mana: (previous?.kind === 'mana' ? previous.mana : hero.mana) - 15
  });
  expect(snapshotStores()).toEqual(before);
});

it.each([1, 5, 6, 12, 18])('Bow retains its starter or declared support before full volley investment at level %i', level => {
  expect(createCharacter('Early Bow order', 'amazon').ok).toBe(true);
  const profile = intendedCampaignProfiles['amazon-bow-intended-v1'];
  for (let earned = 1; earned <= level; earned++) {
    if (earned > 1) usePlayerStore.getState().gainExperience(xpTotal(earned) - xpTotal(earned - 1));
    growCampaignBuild(profile, () => undefined);
  }
  const player = usePlayerStore.getState().player; assert.ok(player);
  expect(player.skillLevels?.['amazon.multiple_shot'] ?? 0).toBeLessThan(20);
  expect(playerToCombatUnit(player).skillOrder).toEqual(level < 6 ? ['amazon.magic_arrow'] :
    profile.priority.filter(id => (player.skillLevels?.[id] ?? 0) > 0));
});

it('Bow bases volley priority on actual investment and the highest declared target, preserving all other state', () => {
  expect(createCharacter('Held Bow ranks', 'amazon').ok).toBe(true);
  const profile = intendedCampaignProfiles['amazon-bow-intended-v1'];
  usePlayerStore.getState().gainExperience(xpTotal(51));
  growCampaignBuild({ ...profile, targets: profile.targets.map(target => target.id === 'amazon.multiple_shot'
    ? { ...target, rank: Math.min(target.rank, 19) } : target) }, () => undefined);
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillLevels?.['amazon.multiple_shot']).toBe(19);
  prepareCampaignCombo(profile, () => undefined);
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.comboOrder).toEqual(['amazon.decoy', 'amazon.slow_missiles', 'amazon.multiple_shot']);
  expect({ ...after, player: { ...after.player, comboOrder: before.player.comboOrder } }).toEqual(before);
});

it.each(['omitted', 'legacy', 'no-target'] as const)('Bow keeps declared support without target-rank opt-in: %s', mode => {
  expect(createCharacter('Declared Bow', 'amazon').ok).toBe(true);
  const selected: CampaignProfile = intendedCampaignProfiles['amazon-bow-intended-v1'];
  usePlayerStore.getState().gainExperience(xpTotal(51));
  growCampaignBuild(selected, () => undefined);
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillLevels?.['amazon.multiple_shot']).toBe(20);
  const { comboPolicy: omitted, ...withoutPolicy } = selected; void omitted;
  const profile: CampaignProfile = mode === 'omitted' ? withoutPolicy : mode === 'legacy'
    ? { ...selected, comboPolicy: 'bow-volley-once-learned-v1' } : { ...selected, targets: [] };
  prepareCampaignCombo(profile, () => undefined);
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.comboOrder).toEqual(['amazon.decoy', 'amazon.slow_missiles', 'amazon.multiple_shot']);
  expect({ ...after, player: { ...after.player, comboOrder: before.player.comboOrder } }).toEqual(before);
});

it.each([false, true])('Fire invests spare early points while preserving later targets (batched: %s)', batched => {
  expect(createCharacter('Fire investment', 'sorceress').ok).toBe(true);
  const profile = intendedCampaignProfiles['sorceress-fire-intended-v1'];
  const created = snapshotStores(); assert.ok(created);
  const originalTargets = { 'sorceress.fire_bolt': 5, 'sorceress.warmth': 1,
    'sorceress.blaze': 1, 'sorceress.fire_ball': 20, 'sorceress.fire_wall': 8,
    'sorceress.meteor': 20, 'sorceress.fire_mastery': 1 };
  for (const level of batched ? [8, 12, 32, 80] : Array.from({ length: 80 }, (_, i) => i + 1)) {
    const previous = usePlayerStore.getState().player; assert.ok(previous);
    const missingXp = xpTotal(level) - xpTotal(previous.level) - previous.experience;
    if (missingXp > 0) usePlayerStore.getState().gainExperience(missingXp);
    const before = snapshotStores(); assert.ok(before);
    growCampaignBuild(profile, row => {
      if (row.kind === 'allocate-skill' || row.kind === 'allocate-stats') expect(row.result).toBe('ok');
    });
    const after = snapshotStores(); assert.ok(after);
    const spent = Object.entries(after.player.skillLevels ?? {}).reduce((sum, [id, rank]) =>
      sum + rank - (before.player.skillLevels?.[id] ?? 0), 0);
    expect(after.player.skillPoints).toBe(before.player.skillPoints - spent);
    expect(after.player.skillPoints).toBeGreaterThanOrEqual(0);
    expect(after.player.respecsRemaining).toEqual(created.player.respecsRemaining);
    expect(after.player.experience).toBe(before.player.experience);
    for (const [id, rank] of Object.entries(before.player.skillLevels ?? {}))
      expect(after.player.skillLevels?.[id]).toBeGreaterThanOrEqual(rank);
    for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
      expect(after[key]).toEqual(created[key]);
    if (level === 8) {
      expect(after.player.skillLevels?.['sorceress.inferno']).toBeGreaterThan(1);
      expect(after.player.skillPoints).toBe(0);
      const player = usePlayerStore.getState().player; assert.ok(player);
      expect(playerToCombatUnit(player).periodicSpellRanks?.inferno)
        .toBe(after.player.skillLevels?.['sorceress.inferno']);
    }
    if (level >= 12) for (const id of ['sorceress.blaze', 'sorceress.fire_ball'])
      expect(after.player.skillLevels?.[id]).toBeGreaterThanOrEqual(1);
    if (level === 80) for (const [id, rank] of Object.entries({ ...originalTargets, 'sorceress.inferno': 5 }))
      expect(after.player.skillLevels?.[id]).toBe(rank);
    growCampaignBuild(profile, () => undefined);
    expect(snapshotStores()).toEqual(after);
  }
});

it.each([42, 51])('Holy Bolt gives its fully invested signature the first paid cast at level %i', level => {
  expect(createCharacter('Bolt signature', 'paladin').ok).toBe(true);
  const profile = intendedCampaignProfiles['paladin-holy-bolt-intended-v1'];
  for (let earned = 1; earned <= level; earned++) {
    if (earned > 1) usePlayerStore.getState().gainExperience(xpTotal(earned) - xpTotal(earned - 1));
    growCampaignBuild(profile, () => undefined);
  }
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillLevels?.['paladin.holy_bolt']).toBe(20);
  expect(before.player.skillLevels?.['paladin.blessed_hammer']).toBe(20);
  prepareCampaignCombo(profile, () => undefined);
  const player = usePlayerStore.getState().player; assert.ok(player);
  const hero = playerToCombatUnit(player);
  expect(hero.skillOrder).toEqual(['paladin.holy_bolt', 'paladin.blessed_hammer', 'paladin.sacrifice']);
  // Supplied XP and this stationary target verify rotation, never earned viability.
  const target: CombatUnit = { id: 'holy-bolt-signature-target', name: 'Durable target',
    side: 'enemy', kind: 'monster', tier: 'boss', level, life: 100000, mana: 0,
    stats: { ...hero.stats, life: 100000, lifeMax: 100000, mana: 0, manaMax: 0,
      defense: 363, magicResist: 144, physDodge: 0, magicDodge: 0,
      resistances: { physical: 50, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [{ id: 'stun', sourceId: 'holy-bolt-fixture', stacks: 1, remaining: -1 }],
    skillOrder: [], cooldowns: {}, activeBuffIds: [], enraged: false };
  const out = runBattleRecorded({ seed: 2827552856, act: 4, playerTeam: [hero], enemyTeam: [target], maxRounds: 8 });
  const action = out.events.find(event => event.kind === 'action' && event.actor === hero.id);
  expect(action).toMatchObject({ skillId: 'paladin.holy_bolt' }); assert.ok(action);
  expect(out.events.some(event => event.kind === 'damage' && event.source === hero.id &&
    event.target === target.id && event.simClockMs === action.simClockMs &&
    event.damageType === 'arcane' && event.amount > 1)).toBe(true);
  const previous = out.events.slice(0, out.events.indexOf(action))
    .filter(event => event.kind === 'mana' && event.target === hero.id).at(-1);
  expect(out.events.find(event => event.kind === 'mana' && event.target === hero.id &&
    event.reason === 'cast' && event.simClockMs === action.simClockMs)).toMatchObject({
    mana: (previous?.kind === 'mana' ? previous.mana : hero.mana) - 15
  });
  expect(snapshotStores()).toEqual(before);
});

it.each([6, 18, 24, 32, 41])('Holy Bolt preserves the declared bridge before full investment at level %i', level => {
  expect(createCharacter('Early Bolt order', 'paladin').ok).toBe(true);
  const profile = intendedCampaignProfiles['paladin-holy-bolt-intended-v1'];
  for (let earned = 1; earned <= level; earned++) {
    if (earned > 1) usePlayerStore.getState().gainExperience(xpTotal(earned) - xpTotal(earned - 1));
    growCampaignBuild(profile, () => undefined);
  }
  const player = usePlayerStore.getState().player; assert.ok(player);
  expect(player.skillLevels?.['paladin.holy_bolt']).toBeLessThan(20);
  if (level === 41) expect(player.skillLevels?.['paladin.holy_bolt']).toBe(19);
  expect(playerToCombatUnit(player).skillOrder).toEqual(profile.priority.filter(id =>
    (player.skillLevels?.[id] ?? 0) > 0));
});

it('Holy Bolt signature promotion requires explicit profile selection', () => {
  expect(createCharacter('Declared Bolt', 'paladin').ok).toBe(true);
  const selected: CampaignProfile = intendedCampaignProfiles['paladin-holy-bolt-intended-v1'];
  const { comboPolicy: omitted, ...profile } = selected; void omitted;
  usePlayerStore.getState().gainExperience(xpTotal(51));
  growCampaignBuild(profile, () => undefined);
  const player = usePlayerStore.getState().player; assert.ok(player);
  expect(player.skillLevels?.['paladin.holy_bolt']).toBe(20);
  expect(playerToCombatUnit(player).skillOrder).toEqual(profile.priority.filter(id =>
    (player.skillLevels?.[id] ?? 0) > 0));
});

it.each([24, 51])('Fire delivers its learned Meteor and Fire Ball pair before periodic support at level %i', level => {
  expect(createCharacter('Fire pair', 'sorceress').ok).toBe(true);
  const profile = intendedCampaignProfiles['sorceress-fire-intended-v1'];
  for (let earned = 2; earned <= level; earned++) {
    usePlayerStore.getState().gainExperience(xpTotal(earned) - xpTotal(earned - 1));
    growCampaignBuild(profile, () => undefined);
  }
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillLevels?.['sorceress.meteor']).toBeGreaterThan(0);
  expect(before.player.skillLevels?.['sorceress.fire_ball']).toBeGreaterThan(0);
  const pair = ['sorceress.meteor', 'sorceress.fire_ball'];
  const learnedSupport = profile.priority.filter(id => !pair.includes(id) &&
    (before.player.skillLevels?.[id] ?? 0) > 0);
  prepareCampaignCombo(profile, () => undefined);
  const player = usePlayerStore.getState().player; assert.ok(player);
  const hero = playerToCombatUnit(player);
  expect(hero.skillOrder).toEqual([...pair, ...learnedSupport]);
  // Constructed durable target checks real delivery and costs, not earned viability.
  const target: CombatUnit = { id: 'fire-signature-target', name: 'Durable target',
    side: 'enemy', kind: 'monster', tier: 'boss', level, life: 100000, mana: 0,
    stats: { ...hero.stats, life: 100000, lifeMax: 100000, mana: 0, manaMax: 0,
      attack: 1, defense: 100, magicResist: 100, attackSpeed: 100, critChance: 0,
      physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 25, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    skillOrder: [], cooldowns: {}, statuses: [], activeBuffIds: [], enraged: false };
  const out = runBattleRecorded({ seed: 37806114, act: 4, playerTeam: [hero], enemyTeam: [target] });
  const actions = out.events.flatMap(event => event.kind === 'action' && event.actor === hero.id ? [event] : []);
  expect(actions.slice(0, 2).map(event => event.skillId)).toEqual(pair);
  for (const [index, cost] of [50, 20].entries()) {
    const action = actions[index]; assert.ok(action);
    expect(out.events.some(event => event.kind === 'damage' && event.source === hero.id &&
      event.target === target.id && event.simClockMs === action.simClockMs &&
      event.damageType === 'fire' && event.amount > 1)).toBe(true);
    const previous = out.events.slice(0, out.events.indexOf(action))
      .filter(event => event.kind === 'mana' && event.target === hero.id).at(-1);
    expect(out.events.find(event => event.kind === 'mana' && event.target === hero.id &&
      event.reason === 'cast' && event.simClockMs === action.simClockMs)).toMatchObject({
      mana: (previous?.kind === 'mana' ? previous.mana : hero.mana) - cost
    });
  }
  expect(snapshotStores()).toEqual(before);
});

it.each([6, 12, 18, 23])('Fire preserves its declared rotation before Meteor at level %i', level => {
  expect(createCharacter('Early Fire order', 'sorceress').ok).toBe(true);
  const profile = intendedCampaignProfiles['sorceress-fire-intended-v1'];
  usePlayerStore.getState().gainExperience(xpTotal(level));
  growCampaignBuild(profile, () => undefined);
  const player = usePlayerStore.getState().player; assert.ok(player);
  expect(player.skillLevels?.['sorceress.meteor'] ?? 0).toBe(0);
  expect(playerToCombatUnit(player).skillOrder).toEqual(profile.priority.filter(id =>
    (player.skillLevels?.[id] ?? 0) > 0));
});

it('Fire signature promotion requires explicit profile selection', () => {
  expect(createCharacter('Declared Fire', 'sorceress').ok).toBe(true);
  const selected: CampaignProfile = intendedCampaignProfiles['sorceress-fire-intended-v1'];
  const { comboPolicy: omitted, ...profile } = selected; void omitted;
  usePlayerStore.getState().gainExperience(xpTotal(51));
  growCampaignBuild(profile, () => undefined);
  const player = usePlayerStore.getState().player; assert.ok(player);
  expect(player.skillLevels?.['sorceress.meteor']).toBeGreaterThan(0);
  expect(playerToCombatUnit(player).skillOrder).toEqual(profile.priority.filter(id =>
    (player.skillLevels?.[id] ?? 0) > 0));
});

it.each([11, 12, 49])('Double Throw keeps its primary ahead of recovery after unlock at level %i', level => {
  expect(createCharacter('Throw order', 'barbarian').ok).toBe(true);
  const profile = intendedCampaignProfiles['barbarian-double-throw-intended-v1'];
  usePlayerStore.getState().gainExperience(xpTotal(level));
  const before = snapshotStores(); assert.ok(before);
  growCampaignBuild(profile, () => undefined);
  const grown = snapshotStores(); assert.ok(grown);
  const order = playerToCombatUnit(grown.player).skillOrder;
  expect(order.indexOf('barbarian.find_potion')).toBeLessThan(order.indexOf('barbarian.double_swing'));
  if (level >= 12) {
    expect(order.indexOf('barbarian.double_throw')).toBeGreaterThanOrEqual(0);
    expect(order.indexOf('barbarian.double_throw')).toBeLessThan(order.indexOf('barbarian.find_potion'));
  } else expect(order).not.toContain('barbarian.double_throw');
  prepareCampaignCombo(profile, () => undefined, 'areas/act5-crystalline-passage');
  expect(snapshotStores()).toEqual(grown);
  expect(grown.player.respecsRemaining).toEqual(before.player.respecsRemaining);
  for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(grown[key]).toEqual(before[key]);
});

// Supplied XP/resources and stationary targets isolate priority, not earned viability.
it.each(['ready', 'cooldown', 'mana'] as const)(
  'Double Throw delivers attacks and retains useful recovery when primary is %s', availability => {
  expect(createCharacter('Throw recovery', 'barbarian').ok).toBe(true);
  const profile = intendedCampaignProfiles['barbarian-double-throw-intended-v1'];
  usePlayerStore.getState().gainExperience(xpTotal(12));
  growCampaignBuild(profile, () => undefined);
  prepareCampaignCombo(profile, () => undefined, 'areas/act5-crystalline-passage');
  const player = usePlayerStore.getState().player; assert.ok(player);
  const projected = playerToCombatUnit(player), recovery = composeFindPotion(player);
  const primary = getSkill('barbarian.double_throw'); assert.ok(recovery && primary?.manaCost);
  const weapon = { id: 'throw-priority-knife', baseId: 'items/base/weapon-throwing-knife',
    rarity: 'normal' as const, level: 1, ilvl: 1, identified: true, equipped: false };
  useInventoryStore.getState().addItem(weapon);
  expect(useInventoryStore.getState().equipItem(weapon).ok).toBe(true);
  const equipped = usePlayerStore.getState().player; assert.ok(equipped);
  const nativeHero = playerToCombatUnit(equipped);
  const hero = { ...nativeHero, life: projected.stats.lifeMax - 1,
    mana: availability === 'mana' ? primary.manaCost + 2 : projected.stats.manaMax,
    manaRegenPerSecond: availability === 'mana' ? 0 : nativeHero.manaRegenPerSecond ?? 0,
    stats: { ...nativeHero.stats, attackSpeed: availability === 'cooldown' ? 400 : 100 } };
  const enemy = (id: string, life: number): CombatUnit => ({
    id, name: id, side: 'enemy', kind: 'monster', tier: 'trash', level: 12, life, mana: 0,
    stats: { ...hero.stats, life, lifeMax: life, mana: 0, manaMax: 0, defense: 0, physDodge: 0 },
    statuses: [{ id: 'stun', sourceId: hero.id, stacks: 1, remaining: -1 }],
    cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false
  });
  const saved = snapshotStores();
  const battle = runBattleRecorded({ seed: 11, maxRounds: 4, playerTeam: [hero],
    enemyTeam: [enemy('throw-first-body', 1), enemy('throw-survivor', 100000)], findPotion: [recovery] });
  const death = battle.events.findIndex(event => event.kind === 'death' && event.target === 'throw-first-body');
  expect(death).toBeGreaterThanOrEqual(0);
  const next = battle.events.slice(death + 1).find(event => event.kind === 'action' && event.actor === hero.id);
  expect(next).toMatchObject({ skillId: availability === 'ready' ? 'barbarian.double_throw' : 'barbarian.find_potion' });
  if (availability !== 'ready') {
    expect(battle.events.some(event => event.kind === 'mana' && event.target === hero.id &&
      event.reason === 'find-potion' && event.mana > 2)).toBe(true);
  }
  expect(snapshotStores()).toEqual(saved);
});

it.each([false, true])('Double Throw transfers the starter bridge with one native reset (Den: %s)', denReward => {
  expect(createCharacter('Throw transition', 'barbarian').ok).toBe(true);
  const profile = intendedCampaignProfiles['barbarian-double-throw-intended-v1'];
  const initial = snapshotStores(); assert.ok(initial);
  const resets: Readonly<Record<string, unknown>>[] = [];
  for (let level = 1; level <= 12; level++) {
    const current = usePlayerStore.getState().player; assert.ok(current);
    const missingXp = xpTotal(level) - xpTotal(current.level) - current.experience;
    if (missingXp > 0) usePlayerStore.getState().gainExperience(missingXp);
    if (denReward && level === 6) {
      // Constructed completion checks the native one-time grant, not earned reachability.
      useMapStore.getState().updateQuestProgress('quests/act1-den-of-evil', {
        status: 'completed', objectives: { 'obj-clear-den': true, 'obj-return': true }
      });
      expect(claimQuestReward('quests/act1-den-of-evil')).toBe('ok');
      expect(claimQuestReward('quests/act1-den-of-evil')).not.toBe('ok');
    }
    const before = snapshotStores(); assert.ok(before);
    growCampaignBuild(profile, row => {
      if (row.kind === 'double-throw-native-skill-reset') resets.push(row);
    });
    const after = snapshotStores(); assert.ok(after);
    for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
      expect(after[key]).toEqual(before[key]);
    const points = Object.values(after.player.skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0)
      + after.player.skillPoints;
    const initialPoints = Object.values(initial.player.skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0)
      + initial.player.skillPoints;
    expect(points).toBe(initialPoints + level - 1 + (level >= 12 ? 1 : 0) + (denReward && level >= 6 ? 1 : 0));
    if (level < 12) expect(after.player.respecsRemaining).toEqual(initial.player.respecsRemaining);
    if (level === 11) expect(after.player.skillLevels?.['barbarian.double_swing']).toBe(5);
  }
  const after = snapshotStores(); assert.ok(after);
  expect(resets).toHaveLength(1);
  expect(after.player.respecsRemaining).toEqual({ stat: initial.player.respecsRemaining.stat,
    skill: initial.player.respecsRemaining.skill - 1 });
  expect(after.player.skillLevels).toEqual({ 'barbarian.bash': 1, 'barbarian.howl': 1,
    'barbarian.find_potion': 1, 'barbarian.double_swing': 1, 'barbarian.shout': 1,
    'barbarian.throwing_mastery': 1, 'barbarian.double_throw': denReward ? 9 : 8 });
  expect(after.player.skillPoints).toBe(0);
  growCampaignBuild(profile, () => undefined);
  expect(snapshotStores()).toEqual(after);
});

it.each(['no-free-reset', 'combat-active', 'wrong-town'] as const)('Double Throw refuses %s before changing native state', refusal => {
  expect(createCharacter('Refused reset', 'barbarian').ok).toBe(true);
  const profile = intendedCampaignProfiles['barbarian-double-throw-intended-v1'];
  for (let level = 1; level <= 11; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, () => undefined);
  }
  usePlayerStore.getState().gainExperience(xpTotal(12) - xpTotal(11));
  const player = usePlayerStore.getState().player; assert.ok(player?.respecsRemaining);
  if (refusal === 'no-free-reset') usePlayerStore.setState({ player: {
    ...player, respecsRemaining: { ...player.respecsRemaining, skill: 0 }
  } });
  if (refusal === 'combat-active') useCombatStore.setState({ inCombat: true });
  if (refusal === 'wrong-town') useMapStore.getState().setCurrentLocation(2, 'a2-lut-gholein');
  const before = snapshotStores(); assert.ok(before);
  expect(() => prepareEarnedDoubleThrowProfile(profile, () => undefined))
    .toThrow(refusal === 'no-free-reset' ? 'free skill reset' : 'native skill reset refused');
  expect(snapshotStores()).toEqual(before);
});

it('Double Throw resumes a committed reset after recorder failure without paying twice', () => {
  expect(createCharacter('Reset resume', 'barbarian').ok).toBe(true);
  const profile = intendedCampaignProfiles['barbarian-double-throw-intended-v1'];
  for (let level = 1; level <= 11; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, () => undefined);
  }
  usePlayerStore.getState().gainExperience(xpTotal(12) - xpTotal(11));
  const before = snapshotStores(); assert.ok(before);
  expect(() => {
    growCampaignBuild(profile, row => {
      if (row.kind === 'double-throw-native-skill-reset') throw new Error('Recorder failed');
    });
  }).toThrow('Recorder failed');
  const reset = snapshotStores(); assert.ok(reset);
  expect(reset.player.skillLevels).toEqual({});
  expect(reset.player.respecsRemaining.skill).toBe(before.player.respecsRemaining.skill - 1);
  growCampaignBuild(profile, () => undefined);
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.skillLevels?.['barbarian.double_throw']).toBe(8);
  expect(after.player.respecsRemaining).toEqual(reset.player.respecsRemaining);
  for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(before[key]);
  // Route-boundary combo preparation must preserve the same declared priority.
  prepareCampaignCombo(profile, () => undefined, 'areas/act1-cold-plains');
  expect(snapshotStores()).toEqual(after);
});

it('staged corpse stats retain early mana and switch to physical support at Decrepify unlock', () => {
  expect(createCharacter('Hybrid stats', 'necromancer').ok).toBe(true);
  const profile = intendedCampaignProfiles['necromancer-bone-intended-v1'];
  const initial = snapshotStores(); assert.ok(initial);
  for (let level = 1; level <= 71; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    const earned = snapshotStores(); assert.ok(earned);
    growCampaignBuild(profile, row => {
      if (row.kind === 'allocate-stats') expect(row.result).toBe('ok');
    });
    const after = snapshotStores(); assert.ok(after);
    const lateLevels = Math.max(0, level - 23);
    expect(after.player.coreStats).toEqual({ strength: 15, dexterity: 25 + lateLevels * 3,
      vitality: 15 + (level - 1) * 2, energy: 25 + Math.min(level - 1, 22) * 3 });
    expect(after.player.statPoints).toBe(0);
    expect(after.player.experience).toBe(earned.player.experience);
    expect(after.player.respecsRemaining).toEqual(initial.player.respecsRemaining);
    for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
      expect(after[key]).toEqual(earned[key]);
  }
  const prepared = snapshotStores(); assert.ok(prepared);
  expect(prepared.player.coreStats).toEqual({ strength: 15, dexterity: 169, vitality: 155, energy: 91 });
  expect(playerToCombatUnit(prepared.player).stats.attackSpeed).toBeGreaterThanOrEqual(263);
  growCampaignBuild(profile, () => undefined);
  expect(snapshotStores()).toEqual(prepared);
});

it('staged corpse stats produce the same core investment for batched and sequential earned levels', () => {
  const profile = intendedCampaignProfiles['necromancer-bone-intended-v1'];
  const outcomes = [];
  for (const batched of [false, true]) {
    resetEarnedStores(); useHydrationStore.getState().setStatus('ready');
    expect(createCharacter('Batched hybrid', 'necromancer').ok).toBe(true);
    if (batched) {
      usePlayerStore.getState().gainExperience(xpTotal(71));
      growCampaignBuild(profile, () => undefined);
    } else for (let level = 1; level <= 71; level++) {
      if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
      growCampaignBuild(profile, () => undefined);
    }
    const player = usePlayerStore.getState().player; assert.ok(player);
    outcomes.push({ core: player.coreStats, statPoints: player.statPoints, experience: player.experience });
  }
  expect(outcomes[0]?.core).toEqual({ strength: 15, dexterity: 169, vitality: 155, energy: 91 });
  expect(outcomes[1]).toEqual(outcomes[0]);
});

it('staged corpse stats preserve old investment until an actual town stat reset is paid', () => {
  expect(createCharacter('Paid hybrid', 'necromancer').ok).toBe(true);
  const profile: CampaignProfile = intendedCampaignProfiles['necromancer-bone-intended-v1'];
  const { statStages: _stages, ...oldProfile } = profile;
  usePlayerStore.getState().gainExperience(xpTotal(71));
  growCampaignBuild(oldProfile, () => undefined);
  const old = snapshotStores(); assert.ok(old);
  expect(old.player.coreStats).toEqual({ strength: 15, dexterity: 25, vitality: 155, energy: 235 });
  growCampaignBuild(profile, () => undefined);
  expect(snapshotStores()).toEqual(old);
  const quote = prepareTownRespec('npc/akara', 'stat'); assert.equal(quote.kind, 'ok');
  expect(quote.refund).toBe(350); expect(quote.cost).toBe(0);
  expect(snapshotStores()).toEqual(old);
  expect(executeTownRespec(quote.request)).toBe('ok');
  const reset = snapshotStores(); assert.ok(reset);
  expect(reset.player.statPoints).toBe(350);
  growCampaignBuild(profile, () => undefined);
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.coreStats).toEqual({ strength: 15, dexterity: 169, vitality: 155, energy: 91 });
  expect(after.player.statPoints).toBe(0);
  expect(after.player.respecsRemaining).toEqual({ stat: 2, skill: 3 });
  expect({ ...after, player: { ...after.player, coreStats: old.player.coreStats,
    derivedStats: old.player.derivedStats, respecsRemaining: old.player.respecsRemaining } }).toEqual(old);
  expect(after.player.derivedStats.life).toBeLessThanOrEqual(old.player.derivedStats.life);
  expect(after.player.derivedStats.mana).toBeLessThanOrEqual(old.player.derivedStats.mana);
  growCampaignBuild(profile, () => undefined);
  expect(snapshotStores()).toEqual(after);
});

it('staged corpse stats leave other identities and all skill and rotation targets unchanged', () => {
  const profile: CampaignProfile = intendedCampaignProfiles['necromancer-bone-intended-v1'];
  expect(profile.statStages).toEqual([{ level: 24,
    statsPerLevel: { strength: 0, dexterity: 3, vitality: 2, energy: 0 } }]);
  expect(corpseDecoyCampaignProfile.statStages).toEqual(profile.statStages);
  for (const [id, other] of Object.entries(intendedCampaignProfiles))
    if (id !== 'necromancer-bone-intended-v1') expect(other).not.toHaveProperty('statStages');
  expect(profile.statsPerLevel).toEqual({ strength: 0, dexterity: 0, vitality: 2, energy: 3 });
  expect(profile.targets.at(-1)).toEqual({ id: 'necromancer.corpse_explosion', rank: 20, level: 6 });
});

// Independent identity expectations, rather than deriving signatures from the candidate.
const builds = [
  ['sorceress-cold', ['blizzard', 'cold_mastery', 'static_field'], 'blizzard'],
  ['sorceress-fire', ['fire_ball', 'meteor', 'fire_wall', 'fire_mastery'], 'meteor'],
  ['amazon-bow', ['multiple_shot', 'decoy'], 'multiple_shot'],
  ['amazon-javelin', ['power_strike', 'poison_javelin', 'lightning_strike', 'impale'], 'lightning_strike'],
  ['necromancer-summon', ['raise_skeleton', 'skeleton_mastery', 'raise_skeletal_mage', 'clay_golem', 'summon_mastery'], 'raise_skeleton'],
  ['necromancer-bone', ['teeth', 'corpse_explosion', 'amplify_damage', 'decrepify'], 'corpse_explosion'],
  ['barbarian-double-swing', ['double_swing', 'battle_orders', 'battle_command'], 'double_swing'],
  ['barbarian-double-throw', ['double_throw', 'throwing_mastery', 'battle_orders', 'battle_command'], 'double_throw'],
  ['paladin-zeal', ['zeal', 'might'], 'zeal'],
  ['paladin-holy-bolt', ['holy_bolt', 'blessed_hammer', 'prayer'], 'blessed_hammer'],
  ['druid-fire', ['firestorm', 'fissure', 'elemental_mastery'], 'fissure'],
  ['druid-summon', ['summon_spirit_wolf', 'summon_dire_wolf', 'summon_grizzly', 'oak_sage'], 'summon_grizzly'],
  ['assassin-martial', ['fists_of_fire', 'cobra_strike', 'dragon_talon', 'dragon_tail'], 'dragon_tail'],
  ['assassin-traps', ['shock_web', 'charged_bolt_sentry', 'lightning_sentry', 'blade_sentinel'], 'lightning_sentry']
] as const;

let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
});
afterEach(() => { abortSubAreaRun(); vi.restoreAllMocks(); for (const restore of restores) restore(); });

// Rotation fixtures preserve the native admission's complete hero/passive/aura
// projection. Constructed stationary targets allow repeated casts; supplied XP
// and the throwing weapon do not establish earned acquisition or role viability.
it.each([
  ['sorceress-fire', 'sorceress.inferno'],
  ['barbarian-double-swing', 'barbarian.double_swing'],
  ['barbarian-double-throw', 'barbarian.double_swing']
] as const)('executes the early %s signature at its level-six unlock', (id, signature) => {
  const { profile } = campaignRequest('act1', `${id}-intended-v1`);
  expect(createCharacter('Early signature', profile.classId).ok).toBe(true);
  for (let level = 1; level <= 6; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, () => undefined);
    if (level === 5) {
      const player = usePlayerStore.getState().player; assert.ok(player);
      expect(player.skillLevels?.[signature] ?? 0).toBe(0);
      expect(playerToCombatUnit(player).skillOrder).not.toContain(signature);
    }
  }
  const player = usePlayerStore.getState().player; assert.ok(player);
  expect(player.skillLevels?.[signature], 'signature receives the unlock point').toBe(1);
  expect(player.skillPoints).toBe(0);
  startCampaignAdmission(1, 'areas/act1-blood-moor');
  const native = inspectRecordedWaves().currentPublished?.binding.engineInput; assert.ok(native);
  const hero = native.playerTeam.find(unit => unit.kind === 'hero'); assert.ok(hero);
  expect(hero.skillOrder).toContain(signature);
  const enemy: CombatUnit = { id: 'early-signature-target', name: 'Early signature target', side: 'enemy', kind: 'monster',
    tier: 'trash', level: 6, life: 100000, mana: 0,
    stats: { ...hero.stats, life: 100000, lifeMax: 100000, mana: 0, manaMax: 0, defense: 0,
      magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'early-signature-fixture', stacks: 1, remaining: -1 }],
    cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
  const out = runBattleRecorded({ ...native, seed: 7, enemyTeam: [enemy], maxRounds: 40 });
  const cast = out.events.find(event => event.kind === 'action' && event.actor === hero.id && event.skillId === signature);
  assert.ok(cast);
  expect(out.events.some(event => event.kind === 'mana' && event.target === hero.id && event.reason === 'cast' &&
    event.simClockMs === cast.simClockMs)).toBe(true);
  expect(out.events.some(event => event.kind === 'damage' && event.source === hero.id &&
    event.target === enemy.id && event.amount > 0 && event.simClockMs === cast.simClockMs)).toBe(true);
});

it.each([
  ['sorceress-cold', 'sorceress.frost_nova', 'sorceress.blizzard', null],
  ['sorceress-fire', 'sorceress.fire_ball', 'sorceress.meteor', null],
  ['amazon-bow', 'amazon.multiple_shot', 'amazon.multiple_shot', null],
  ['necromancer-summon', 'necromancer.raise_skeleton', 'necromancer.raise_skeleton', 'skeleton'],
  ['barbarian-double-swing', 'barbarian.double_swing', 'barbarian.double_swing', null],
  ['barbarian-double-throw', 'barbarian.double_throw', 'barbarian.double_throw', null],
  ['paladin-zeal', 'paladin.zeal', 'paladin.zeal', null],
  ['paladin-holy-bolt', 'paladin.holy_bolt', 'paladin.blessed_hammer', null],
  ['druid-fire', 'druid.fissure', 'druid.fissure', null],
  ['druid-summon', 'druid.summon_spirit_wolf', 'druid.summon_grizzly', 'druid'],
  ['assassin-martial', 'assassin.dragon_talon', 'assassin.dragon_tail', null],
  ['assassin-traps', 'assassin.charged_bolt_sentry', 'assassin.lightning_sentry', null]
] as const)('executes the intended %s signatures with native allocation and projection', (id, early, later, summon) => {
  for (const level of [12, 32]) {
    abortSubAreaRun(); resetEarnedStores(); useHydrationStore.getState().setStatus('ready');
    const { profile } = campaignRequest('act1', `${id}-intended-v1`);
    expect(createCharacter('Rotation fixture', profile.classId).ok).toBe(true);
    // Sequential grants exercise acquisition order rather than only final ranks.
    for (let earnedLevel = 1; earnedLevel <= level; earnedLevel++) {
      if (earnedLevel > 1) usePlayerStore.getState().gainExperience(xpTotal(earnedLevel) - xpTotal(earnedLevel - 1));
      growCampaignBuild(profile, () => undefined);
    }
    if (id === 'barbarian-double-throw') {
      const weapon = { id: 'rotation-throwing-knife', baseId: 'items/base/weapon-throwing-knife',
        rarity: 'normal' as const, level: 1, ilvl: 1, identified: true, equipped: false };
      useInventoryStore.getState().addItem(weapon);
      expect(useInventoryStore.getState().equipItem(weapon).ok).toBe(true);
    }
    const signature = level === 12 ? early : later;
    const player = usePlayerStore.getState().player; assert.ok(player);
    expect(player.skillLevels?.[signature], `${signature} learned at ${String(level)}`).toBeGreaterThanOrEqual(1);
    startCampaignAdmission(1, 'areas/act1-blood-moor');
    const native = inspectRecordedWaves().currentPublished?.binding.engineInput; assert.ok(native);
    const hero = native.playerTeam.find(unit => unit.kind === 'hero'); assert.ok(hero);
    const enemy: CombatUnit = { id: 'rotation-target', name: 'Rotation target', side: 'enemy', kind: 'monster',
      tier: 'trash', level, life: 100000, mana: 0,
      stats: { ...hero.stats, life: 100000, lifeMax: 100000, mana: 0, manaMax: 0, defense: 0,
        magicResist: 0, physDodge: 0, magicDodge: 0,
        resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
      statuses: [{ id: 'stun', sourceId: 'rotation-fixture', stacks: 1, remaining: -1 }],
      cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
    const out = runBattleRecorded({ ...native, seed: 7, enemyTeam: [enemy], maxRounds: 40 });
    const actions = out.events.flatMap(event => event.kind === 'action' && event.actor === hero.id ? [event] : []);
    expect(actions.map(event => event.skillId), `${signature} casts at ${String(level)}`).toContain(signature);
    expect(out.events.some(event => event.kind === 'mana' && event.target === hero.id && event.reason === 'cast')).toBe(true);
    const template = summon === 'druid' ? level === 12 ? 'spirit_wolf' : 'grizzly' : summon;
    const sources = template === null ? [hero.id] : out.events.flatMap(event =>
      event.kind === 'summon' && event.owner === hero.id && event.summonId === template ? [event.unit.id] : []);
    expect(sources.length).toBeGreaterThan(0);
    expect(out.events.some(event => event.kind === 'damage' && sources.includes(event.source) &&
      event.target === enemy.id && event.amount > 0), `${signature} damage at ${String(level)}`).toBe(true);
  }
});

it.each([[20, 'weaken', 6], [24, 'decrepify', 20]] as const)(
  'pays for one learned survival curse at native level %i: %s, then earns and consumes a corpse', (level, curse, cost) => {
  expect(createCharacter('Paid defense', 'necromancer').ok).toBe(true);
  const profile = intendedCampaignProfiles['necromancer-bone-intended-v1'];
  for (let earnedLevel = 1; earnedLevel <= level; earnedLevel++) {
    if (earnedLevel > 1) usePlayerStore.getState().gainExperience(xpTotal(earnedLevel) - xpTotal(earnedLevel - 1));
    growCampaignBuild(profile, () => undefined);
  }
  const player = usePlayerStore.getState().player; assert.ok(player);
  const signature = `necromancer.${curse}`;
  expect(player.skillLevels?.[signature]).toBe(1);
  const hero = playerToCombatUnit(player), authority = composeCorpseExplosion(player); assert.ok(authority);
  // Supplied XP and stationary targets isolate native rotation; no paid curse or corpse is supplied.
  const enemy = (id: string, life: number): CombatUnit => ({
    id, name: id, side: 'enemy', kind: 'monster', tier: 'trash', level,
    life, mana: 0, stats: { ...hero.stats, life, lifeMax: life, mana: 0, manaMax: 0,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'constructed-policy', stacks: 1, remaining: -1 }],
    cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false
  });
  const enemies = [enemy('first-body', 1), enemy('survivor', 10000)];
  const out = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: enemies, corpseExplosion: [authority] });
  const actions = out.events.flatMap(event => event.kind === 'action' && event.actor === hero.id ? [event] : []);
  const paidCurse = actions.find(event => event.skillId === signature);
  expect(paidCurse, `${signature} must actually cast`).toBeDefined(); assert.ok(paidCurse);
  // Incoming caster pressure requires protection before spending turns on Wall or CE.
  expect(actions[0]).toMatchObject({ skillId: signature });
  expect(actions.some(event => event.skillId !== null && ['necromancer.amplify_damage', 'necromancer.weaken', 'necromancer.decrepify']
    .includes(event.skillId) && event.skillId !== signature)).toBe(false);
  const filler = actions.find(event => event.skillId === 'necromancer.teeth');
  assert.ok(filler);
  expect(paidCurse.simClockMs).toBeLessThan(filler.simClockMs);
  const actionIndex = out.events.indexOf(paidCurse);
  const previousMana = out.events.slice(0, actionIndex).filter(event => event.kind === 'mana' && event.target === hero.id).at(-1);
  expect(out.events.find(event => event.kind === 'mana' && event.target === hero.id &&
    event.reason === 'cast' && event.simClockMs === paidCurse.simClockMs)).toMatchObject({
    mana: (previousMana?.kind === 'mana' ? previousMana.mana : hero.mana) - cost
  });
  for (const target of enemies) {
    const paid = out.events.find(event => event.kind === 'status-state' && event.target === target.id &&
      event.simClockMs === paidCurse.simClockMs && event.statuses.some(status => status.id === curse));
    expect(paid?.kind === 'status-state' ? paid.statuses.find(status => status.id === curse) : undefined)
      .toMatchObject({ sourceId: hero.id, appliedAtMs: paidCurse.simClockMs,
        expiresAtMs: paidCurse.simClockMs + 3000, [curse]: { damageReductionPct: 33 } });
  }
  const killIndex = out.events.findIndex(event => event.kind === 'death' && event.target === 'first-body');
  expect(killIndex, JSON.stringify(actions.map(event => [event.simClockMs, event.skillId]))).toBeGreaterThan(actionIndex);
  expect(out.events.slice(0, killIndex).some(event => event.kind === 'damage' &&
    event.source === hero.id && event.target === 'first-body' && event.amount > 0)).toBe(true);
  const afterKill = out.events.flatMap((event, index) => index > killIndex &&
    event.kind === 'action' && event.actor === hero.id ? [event] : []);
  const defensive = ['necromancer.decrepify', 'necromancer.weaken'].find(skill => hero.skillOrder.includes(skill));
  // Only the selected defensive curse may precede CE, once; Wall/offensive curses must wait.
  const renewal = defensive !== undefined && afterKill[0]?.skillId === defensive;
  const next = afterKill[renewal ? 1 : 0];
  expect(next).toMatchObject({ skillId: 'necromancer.corpse_explosion' }); assert.ok(next);
  expect(out.events.some(event => event.kind === 'message' && event.messageKey === 'combat:corpses.consumed' &&
    event.simClockMs === next.simClockMs && event.params?.count === 0)).toBe(true);
  expect(out.events.some(event => event.kind === 'damage' && event.source === hero.id &&
    event.target === 'survivor' && event.damageType === 'fire' && event.amount > 0 &&
    event.simClockMs === next.simClockMs)).toBe(true);
});

it.each([6, 12, 24])('uses an earned-in-battle corpse after at most one defensive renewal at native level %i', level => {
  expect(createCharacter('Corpse policy', 'necromancer')).toMatchObject({ ok: true });
  usePlayerStore.getState().gainExperience(xpTotal(level));
  growCampaignBuild(intendedCampaignProfiles['necromancer-bone-intended-v1'], () => undefined);
  const player = usePlayerStore.getState().player; assert.ok(player);
  const hero = playerToCombatUnit(player), authority = composeCorpseExplosion(player); assert.ok(authority);
  const party: CombatUnit[] = [hero];
  if (level === 24) {
    // Same native initial companion as intended campaigns; no level/gear grant.
    const definition = loadMercHireRoster().find(row => row.act === 1)?.mercs
      .find(row => row.id === 'mercs/act1-rogue-inner-sight'); assert.ok(definition);
    expect(useMercStore.getState().hireMerc(definition).ok).toBe(true);
    const merc = useMercStore.getState().getFieldedMerc(); assert.ok(merc);
    party.push(mercToCombatUnit(merc));
  }
  // Constructed unequal-health enemies isolate rotation; neither fixture supplies a corpse.
  const enemy = (id: string, life: number): CombatUnit => ({
    id, name: id, side: 'enemy', kind: 'monster', tier: 'trash', level,
    life, mana: 0, stats: { ...hero.stats, life, lifeMax: life, mana: 0, manaMax: 0,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'constructed-policy', stacks: 1, remaining: -1 }],
    cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false
  });
  const out = runBattleRecorded({ seed: 7, playerTeam: party,
    enemyTeam: [enemy('first-body', 1), enemy('survivor', 10000)], corpseExplosion: [authority] });
  const killIndex = out.events.findIndex(event => event.kind === 'death' && event.target === 'first-body');
  expect(killIndex).toBeGreaterThanOrEqual(0);
  expect(out.events.slice(0, killIndex).some(event => event.kind === 'damage' &&
    party.some(unit => unit.id === event.source) && event.target === 'first-body' && event.amount > 0)).toBe(true);
  expect(out.events.slice(0, killIndex).some(event => event.kind === 'action' &&
    event.actor === hero.id && event.skillId === 'necromancer.corpse_explosion')).toBe(false);
  const afterKill = out.events.flatMap((event, index) => index > killIndex &&
    event.kind === 'action' && event.actor === hero.id ? [event] : []);
  const defensive = ['necromancer.decrepify', 'necromancer.weaken'].find(skill => hero.skillOrder.includes(skill));
  // Only the selected defensive curse may precede CE, once; Wall/offensive curses must wait.
  const renewal = defensive !== undefined && afterKill[0]?.skillId === defensive;
  const next = afterKill[renewal ? 1 : 0];
  expect(next).toMatchObject({ skillId: 'necromancer.corpse_explosion' });
  assert.ok(next);
  expect(out.events.filter(event => event.kind === 'message' && event.messageKey === 'combat:corpses.consumed'))
    .toEqual([expect.objectContaining({ simClockMs: next.simClockMs, params: { count: 0 } })]);
  expect(out.events.some(event => event.kind === 'damage' && event.source === hero.id &&
    event.target === 'survivor' && event.simClockMs === next.simClockMs &&
    event.damageType === 'fire' && event.amount > 0)).toBe(true);
  const actionIndex = out.events.indexOf(next);
  const previousMana = out.events.slice(0, actionIndex).filter(event => event.kind === 'mana' && event.target === hero.id).at(-1);
  expect(out.events.find(event => event.kind === 'mana' && event.target === hero.id &&
    event.reason === 'cast' && event.simClockMs === next.simClockMs)).toMatchObject({
    mana: (previousMana?.kind === 'mana' ? previousMana.mana : hero.mana) - 20
  });
});

it.each([
  [6, 'amazon.poison_javelin'], [12, 'amazon.poison_javelin'],
  [18, 'amazon.charged_strike'], [24, 'amazon.lightning_strike']
] as const)('uses the intended Javelin unlock at native level %i: %s', (level, signature) => {
  expect(createCharacter('Lightning order', 'amazon')).toMatchObject({ ok: true });
  usePlayerStore.getState().gainExperience(xpTotal(level));
  growCampaignBuild(intendedCampaignProfiles['amazon-javelin-intended-v1'], () => undefined);
  const player = usePlayerStore.getState().player; assert.ok(player);
  expect(player.skillLevels?.[signature]).toBeGreaterThanOrEqual(1);
  const hero = playerToCombatUnit(player);
  expect(hero.skillOrder[0]).toBe(signature);
  startCampaignAdmission(1, 'areas/act1-blood-moor');
  const events = useCombatStore.getState().recordedEvents;
  const first = events.find(event => event.kind === 'action' && event.actor === hero.id);
  expect(first).toMatchObject({ kind: 'action', skillId: signature });
  expect(events.some(event => event.kind === 'damage' && event.source === hero.id && event.amount > 0)).toBe(true);
  expect(events.some(event => event.kind === 'mana' && event.target === hero.id && event.reason === 'cast')).toBe(true);
});

it.each([24, 49])('Javelin uses its learned physical alternative before weak lightning fillers at level %i', level => {
  expect(createCharacter('Spear pair', 'amazon').ok).toBe(true);
  const profile = intendedCampaignProfiles['amazon-javelin-intended-v1'];
  for (let earned = 2; earned <= level; earned++) {
    usePlayerStore.getState().gainExperience(xpTotal(earned) - xpTotal(earned - 1));
    growCampaignBuild(profile, () => undefined);
  }
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillLevels?.['amazon.lightning_strike']).toBeGreaterThan(0);
  expect(before.player.skillLevels?.['amazon.impale']).toBeGreaterThan(0);
  prepareCampaignCombo(profile, () => undefined);
  const player = usePlayerStore.getState().player; assert.ok(player);
  const hero = playerToCombatUnit(player);
  const target: CombatUnit = { id: 'javelin-mitigated-target', name: 'Mitigated target',
    side: 'enemy', kind: 'monster', tier: 'boss', level, life: 100000, mana: 0,
    stats: { ...hero.stats, life: 100000, lifeMax: 100000, mana: 0, manaMax: 0,
      attack: 1, defense: 363, magicResist: 144, attackSpeed: 100, critChance: 0,
      physDodge: 0, magicDodge: 0,
      resistances: { physical: 50, fire: 0, cold: 75, lightning: 0, poison: 0, arcane: 0 } },
    skillOrder: [], cooldowns: {}, statuses: [], activeBuffIds: [], enraged: false };
  const out = runBattleRecorded({ seed: 185349965, act: 4, playerTeam: [hero], enemyTeam: [target] });
  const actions = out.events.flatMap(event => event.kind === 'action' && event.actor === hero.id ? [event] : []);
  expect(actions.slice(0, 2).map(event => event.skillId)).toEqual([
    'amazon.lightning_strike', 'amazon.impale'
  ]);
  const impale = actions[1]; assert.ok(impale);
  expect(out.events.some(event => event.kind === 'damage' && event.source === hero.id &&
    event.target === target.id && event.simClockMs === impale.simClockMs &&
    event.damageType === 'physical' && event.amount > 1)).toBe(true);
  for (const [index, cost] of [25, 10].entries()) {
    const action = actions[index]; assert.ok(action);
    const eventIndex = out.events.indexOf(action);
    const previous = out.events.slice(0, eventIndex).filter(event => event.kind === 'mana' && event.target === hero.id).at(-1);
    expect(out.events.find(event => event.kind === 'mana' && event.target === hero.id &&
      event.reason === 'cast' && event.simClockMs === action.simClockMs)).toMatchObject({
      mana: (previous?.kind === 'mana' ? previous.mana : hero.mana) - cost
    });
  }
  expect(snapshotStores()).toEqual(before);
});

it.each([false, true])('Javelin uses only its fully invested pair without changing paid state (batched: %s)', batched => {
  expect(createCharacter('Invested pair', 'amazon').ok).toBe(true);
  const profile = intendedCampaignProfiles['amazon-javelin-intended-v1'];
  for (const level of batched ? [80] : Array.from({ length: 80 }, (_, i) => i + 1)) {
    const player = usePlayerStore.getState().player; assert.ok(player);
    const missing = xpTotal(level) - xpTotal(player.level) - player.experience;
    if (missing > 0) usePlayerStore.getState().gainExperience(missing);
    growCampaignBuild(profile, () => undefined);
  }
  // Supplied XP verifies native investment/rotation only, never earned viability.
  const invested = snapshotStores(); assert.ok(invested);
  expect(invested.player.skillLevels?.['amazon.lightning_strike']).toBe(20);
  expect(invested.player.skillLevels?.['amazon.impale']).toBe(20);
  usePlayerStore.getState().setComboOrder([...profile.priority]);
  const before = snapshotStores(); assert.ok(before);
  prepareCampaignCombo(profile, () => undefined);
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.comboOrder).toEqual(['amazon.lightning_strike', 'amazon.impale']);
  expect({ ...after, player: { ...after.player, comboOrder: before.player.comboOrder } }).toEqual(before);
  prepareCampaignCombo(profile, () => undefined);
  expect(snapshotStores()).toEqual(after);
});

it.each(['lightning', 'physical', 'both'] as const)('Javelin keeps fillers while signature investment is incomplete: %s', missing => {
  expect(createCharacter('Incomplete pair', 'amazon').ok).toBe(true);
  const profile = intendedCampaignProfiles['amazon-javelin-intended-v1'];
  usePlayerStore.getState().gainExperience(xpTotal(80));
  growCampaignBuild({ ...profile, targets: profile.targets.map(target =>
    (target.id === 'amazon.lightning_strike' && missing !== 'physical') ||
    (target.id === 'amazon.impale' && missing !== 'lightning')
      ? { ...target, rank: Math.min(target.rank, 19) } : target) }, () => undefined);
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillLevels?.['amazon.lightning_strike']).toBe(missing === 'physical' ? 20 : 19);
  expect(before.player.skillLevels?.['amazon.impale']).toBe(missing === 'lightning' ? 20 : 19);
  prepareCampaignCombo(profile, () => undefined);
  const after = snapshotStores(); assert.ok(after);
  const pair = ['amazon.lightning_strike', 'amazon.impale'];
  expect(after.player.comboOrder).toEqual([...pair, ...profile.priority.filter(id => !pair.includes(id))]);
  expect({ ...after, player: { ...after.player, comboOrder: before.player.comboOrder } }).toEqual(before);
});

it.each(['omitted', 'legacy', 'missing-lightning-target', 'missing-physical-target',
  'zero-target', 'undeclared-lightning', 'undeclared-physical', 'area-override', 'highest-target'] as const)(
  'Javelin requires explicit declared investment before removing fillers: %s', mode => {
    expect(createCharacter('Declared pair', 'amazon').ok).toBe(true);
    const selected: CampaignProfile = intendedCampaignProfiles['amazon-javelin-intended-v1'];
    usePlayerStore.getState().gainExperience(xpTotal(80));
    growCampaignBuild(selected, () => undefined);
    const { comboPolicy: omitted, ...withoutPolicy } = selected; void omitted;
    const excluded = mode === 'undeclared-lightning' ? 'amazon.lightning_strike' : 'amazon.impale';
    const priority = selected.priority.filter(id => id !== excluded);
    const profile: CampaignProfile = mode === 'omitted' ? withoutPolicy
      : mode === 'legacy' ? { ...selected, comboPolicy: 'javelin-lightning-impale-v1' }
      : mode.startsWith('missing-') ? { ...selected, targets: selected.targets.filter(target =>
        target.id !== (mode === 'missing-lightning-target' ? 'amazon.lightning_strike' : 'amazon.impale')) }
      : mode === 'zero-target' ? { ...selected, targets: selected.targets.map(target =>
        target.id === 'amazon.impale' ? { ...target, rank: 0 } : target) }
      : mode === 'highest-target' ? { ...selected,
        targets: [...selected.targets, { id: 'amazon.impale', rank: 21, level: 80 }] }
      : mode === 'area-override' ? { ...selected, priorityByArea: { 'areas/act4-chaos-sanctuary': priority } }
      : { ...selected, priority };
    const before = snapshotStores(); assert.ok(before);
    prepareCampaignCombo(profile, () => undefined, 'areas/act4-chaos-sanctuary');
    const after = snapshotStores(); assert.ok(after);
    const pair = ['amazon.lightning_strike', 'amazon.impale'];
    expect(after.player.comboOrder).toEqual(mode === 'omitted' ? selected.priority
      : mode.startsWith('undeclared-') || mode === 'area-override' ? priority
      : [...pair, ...selected.priority.filter(id => !pair.includes(id))]);
    expect({ ...after, player: { ...after.player, comboOrder: before.player.comboOrder } }).toEqual(before);
  });

it('Javelin invested pair pays native mana costs and uses basic fallback between cooldowns', () => {
  expect(createCharacter('Pair fallback', 'amazon').ok).toBe(true);
  usePlayerStore.getState().gainExperience(xpTotal(80));
  growCampaignBuild(intendedCampaignProfiles['amazon-javelin-intended-v1'], () => undefined);
  const before = snapshotStores(); assert.ok(before);
  const nativeHero = playerToCombatUnit(before.player);
  const hero = { ...nativeHero, stats: { ...nativeHero.stats, attackSpeed: 300 } };
  const target: CombatUnit = { id: 'pair-fallback-target', name: 'Durable target',
    side: 'enemy', kind: 'monster', tier: 'boss', level: 80, life: 1000000, mana: 0,
    stats: { ...hero.stats, life: 1000000, lifeMax: 1000000, mana: 0, manaMax: 0,
      physDodge: 0, magicDodge: 0 },
    statuses: [{ id: 'stun', sourceId: 'pair-fixture', stacks: 1, remaining: -1 }],
    skillOrder: [], cooldowns: {}, activeBuffIds: [], enraged: false };
  const out = runBattleRecorded({ seed: 185349965, act: 4, playerTeam: [hero], enemyTeam: [target], maxRounds: 8 });
  const actions = out.events.flatMap(event => event.kind === 'action' && event.actor === hero.id ? [event] : []);
  expect(actions.slice(0, 3).map(event => event.skillId)).toEqual([
    'amazon.lightning_strike', 'amazon.impale', null
  ]);
  expect(actions.every(event => event.skillId === null || hero.skillOrder.includes(event.skillId))).toBe(true);
  for (const [index, cost] of [25, 10].entries()) {
    const action = actions[index]; assert.ok(action);
    const previous = out.events.slice(0, out.events.indexOf(action))
      .filter(event => event.kind === 'mana' && event.target === hero.id).at(-1);
    expect(out.events.find(event => event.kind === 'mana' && event.target === hero.id &&
      event.reason === 'cast' && event.simClockMs === action.simClockMs)).toMatchObject({
      mana: (previous?.kind === 'mana' ? previous.mana : hero.mana) - cost
    });
  }
  expect(snapshotStores()).toEqual(before);
});

it.each([false, true])('Javelin invests late points in Impale before more critical ranks (batched: %s)', batched => {
  expect(createCharacter('Late Impale', 'amazon').ok).toBe(true);
  const profile = intendedCampaignProfiles['amazon-javelin-intended-v1'];
  const created = snapshotStores(); assert.ok(created);
  let earlyCriticalRank = 1;
  for (const level of batched ? [12, 24, 39, 40, 50, 80] : Array.from({ length: 80 }, (_, i) => i + 1)) {
    const previous = usePlayerStore.getState().player; assert.ok(previous);
    const missingXp = xpTotal(level) - xpTotal(previous.level) - previous.experience;
    if (missingXp > 0) usePlayerStore.getState().gainExperience(missingXp);
    const before = snapshotStores(); assert.ok(before);
    growCampaignBuild(profile, row => {
      if (row.kind === 'allocate-skill' || row.kind === 'allocate-stats') expect(row.result).toBe('ok');
    });
    const after = snapshotStores(); assert.ok(after);
    const ranks = after.player.skillLevels ?? {};
    const spent = Object.entries(ranks).reduce((sum, [id, rank]) =>
      sum + rank - (before.player.skillLevels?.[id] ?? 0), 0);
    expect(after.player.skillPoints).toBe(before.player.skillPoints - spent);
    expect(after.player.skillPoints).toBeGreaterThanOrEqual(0);
    expect(after.player.respecsRemaining).toEqual(created.player.respecsRemaining);
    expect(after.player.experience).toBe(before.player.experience);
    for (const [id, rank] of Object.entries(before.player.skillLevels ?? {}))
      expect(ranks[id]).toBeGreaterThanOrEqual(rank);
    for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
      expect(after[key]).toEqual(created[key]);
    if (level < 40) expect(ranks['amazon.impale'] ?? 0).toBeLessThanOrEqual(8);
    if (level === 39) earlyCriticalRank = ranks['amazon.critical_strike'] ?? 1;
    if (level === 50) {
      expect(ranks['amazon.lightning_strike']).toBe(20);
      expect(ranks['amazon.impale']).toBeGreaterThan(8);
      expect(ranks['amazon.critical_strike']).toBe(earlyCriticalRank);
    }
    if (level === 80) {
      expect(ranks['amazon.impale']).toBe(20);
      expect(ranks['amazon.critical_strike']).toBe(20);
    }
    growCampaignBuild(profile, () => undefined);
    expect(snapshotStores()).toEqual(after);
  }
});

it('Javelin preserves pack and physical delivery before the learned level-twelve Bolt', () => {
  expect(createCharacter('Pack bridge', 'amazon').ok).toBe(true);
  usePlayerStore.getState().gainExperience(xpTotal(12));
  growCampaignBuild(intendedCampaignProfiles['amazon-javelin-intended-v1'], () => undefined);
  const player = usePlayerStore.getState().player; assert.ok(player);
  expect(player.skillLevels?.['amazon.lightning_bolt']).toBe(1);
  startCampaignAdmission(1, 'areas/act1-blood-moor');
  const native = inspectRecordedWaves().currentPublished?.binding.engineInput; assert.ok(native);
  const hero = native.playerTeam.find(unit => unit.kind === 'hero'); assert.ok(hero);
  expect(hero.skillOrder.slice(0, 3)).toEqual([
    'amazon.poison_javelin', 'amazon.impale', 'amazon.lightning_bolt'
  ]);
  const enemy = native.enemyTeam[0]; assert.ok(enemy);
  // A durable constructed target isolates cooldown delivery from an early trash kill.
  const events = runBattleRecorded({ ...native, playerTeam: [hero], enemyTeam: [{ ...enemy,
    life: 10000, stats: { ...enemy.stats, life: 10000, lifeMax: 10000 }
  }] }).events;
  const actions = events.flatMap(event => event.kind === 'action' && event.actor === hero.id ? [event] : []);
  expect(actions.slice(0, 2).map(event => event.skillId)).toEqual([
    'amazon.poison_javelin', 'amazon.impale'
  ]);
  for (const action of actions.slice(0, 2)) {
    expect(events.some(event => event.kind === 'mana' && event.target === hero.id &&
      event.reason === 'cast' && event.simClockMs === action.simClockMs)).toBe(true);
  }
  for (const damageType of ['poison', 'physical']) {
    expect(events.some(event => event.kind === 'damage' && event.source === hero.id &&
      event.damageType === damageType && event.amount > 0)).toBe(true);
  }
});

it('holds Javelin filler points for both level-six attacks and Dodge during sequential growth', () => {
  expect(createCharacter('Held Javelin', 'amazon')).toMatchObject({ ok: true });
  const profile = intendedCampaignProfiles['amazon-javelin-intended-v1'];
  for (let level = 1; level <= 5; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, () => undefined);
  }
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillPoints).toBe(3);
  expect(before.player.skillLevels?.['amazon.critical_strike']).toBe(1);
  usePlayerStore.getState().gainExperience(xpTotal(6) - xpTotal(5));
  const earned = snapshotStores(); assert.ok(earned);
  growCampaignBuild(profile, () => undefined);
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.skillPoints).toBe(0);
  expect(after.player.skillLevels).toEqual({ ...before.player.skillLevels,
    'amazon.power_strike': 1, 'amazon.poison_javelin': 2, 'amazon.dodge': 1 });
  expect(after.player.experience).toBe(earned.player.experience);
  expect(after.player.respecsRemaining).toEqual(before.player.respecsRemaining);
  for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(before[key]);
});

it('finishes the corpse signature with earned late-growth points before leaving them unused', () => {
  expect(createCharacter('Late corpse', 'necromancer').ok).toBe(true);
  const profile = intendedCampaignProfiles['necromancer-bone-intended-v1'];
  // Supplied sequential XP isolates allocation; no battles, quest rewards or points are injected.
  for (let level = 2; level <= 80; level++) {
    usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    const before = snapshotStores(); assert.ok(before);
    growCampaignBuild(profile, row => {
      if (row.kind === 'allocate-skill') expect(row.result).toBe('ok');
    });
    const after = snapshotStores(); assert.ok(after);
    const spent = Object.entries(after.player.skillLevels ?? {}).reduce((sum, [skill, rank]) =>
      sum + rank - (before.player.skillLevels?.[skill] ?? 0), 0);
    expect(after.player.skillPoints).toBe(before.player.skillPoints - spent);
    expect(after.player.skillPoints).toBeGreaterThanOrEqual(0);
    expect(after.player.respecsRemaining).toEqual(before.player.respecsRemaining);
    expect(after.player.experience).toBe(before.player.experience);
    for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
      expect(after[key]).toEqual(before[key]);
  }
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillLevels?.['necromancer.corpse_explosion']).toBe(20);
  expect(composeCorpseExplosion(before.player)?.rank).toBe(20);
  growCampaignBuild(profile, () => undefined);
  expect(snapshotStores()).toEqual(before);
});

for (const [id, signatures, active] of builds) {
  for (const batched of [false, true]) {
    it(`${id} grows ${batched ? 'batched' : 'sequentially'} with native budgets, prerequisites and projected signatures`, () => {
      const { profile } = campaignRequest('act5', `${id}-intended-v1`);
      expect(createCharacter('Intended growth', profile.classId).ok).toBe(true);
      const created = snapshotStores(); assert.ok(created);
      const catalog = getSkillsForClass(profile.classId);
      const terminalLevel = id === 'barbarian-double-throw' ? 80 : 50;
      let resetCount = 0;
      for (const level of batched ? [terminalLevel] : Array.from({ length: terminalLevel }, (_, index) => index + 1)) {
        const previous = usePlayerStore.getState().player; assert.ok(previous);
        if (previous.level < level)
          usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(previous.level));
        const before = snapshotStores(); assert.ok(before);
        const resets: Readonly<Record<string, unknown>>[] = [];
        growCampaignBuild(profile, row => {
          if (row.kind === 'allocate-skill' || row.kind === 'allocate-stats') expect(row.result).toBe('ok');
          if (row.kind === 'double-throw-native-skill-reset') resets.push(row);
        });
        const after = snapshotStores(); assert.ok(after);
        const resetExpected = id === 'barbarian-double-throw' && !batched && level === 12;
        expect(resets).toHaveLength(resetExpected ? 1 : 0);
        resetCount += resets.length;
        if (resetExpected) {
          const reset = resets[0]; assert.ok(reset);
          expect(reset.before).toEqual(before);
          const refunded = Object.values(before.player.skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0);
          expect(reset.refund).toBe(refunded);
          const resetAfter = reset.after as NonNullable<ReturnType<typeof snapshotStores>>;
          expect({ ...resetAfter, player: { ...resetAfter.player, derivedStats: before.player.derivedStats } }).toEqual({
            ...before, player: { ...before.player, skills: [], skillLevels: {}, comboOrder: [],
              skillPoints: before.player.skillPoints + refunded,
              respecsRemaining: { ...before.player.respecsRemaining, skill: before.player.respecsRemaining.skill - 1 } }
          });
          expect(after.player.skillLevels?.['barbarian.double_throw']).toBe(8);
        }
        const ranks = after.player.skillLevels ?? {};
        if (id === 'necromancer-bone' && level === 6)
          expect(ranks['necromancer.corpse_explosion'], 'Corpse Explosion at its level-six unlock').toBe(1);
        const spent = Object.entries(ranks).reduce((sum, [skill, rank]) =>
          sum + rank - (before.player.skillLevels?.[skill] ?? 0), 0);
        expect(after.player.skillPoints).toBe(before.player.skillPoints - spent);
        expect(after.player.statPoints).toBe(before.player.statPoints % 5);
        if (id === 'necromancer-bone') {
          expect(after.player.coreStats).toEqual({ strength: 15,
            dexterity: 25 + Math.max(0, level - 23) * 3,
            vitality: 15 + (level - 1) * 2, energy: 25 + Math.min(level - 1, 22) * 3 });
        } else for (const stat of ['strength', 'dexterity', 'vitality', 'energy'] as const)
          expect(after.player.coreStats[stat]).toBe(before.player.coreStats[stat] +
            Math.floor(before.player.statPoints / 5) * profile.statsPerLevel[stat]);
        if (!resetExpected) for (const [skill, rank] of Object.entries(before.player.skillLevels ?? {}))
          expect(ranks[skill]).toBeGreaterThanOrEqual(rank);
        expect(after.player.experience).toBe(before.player.experience);
        expect(after.player.respecsRemaining).toEqual({ ...created.player.respecsRemaining,
          skill: created.player.respecsRemaining.skill - resetCount });
        for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
          expect(after[key]).toEqual(created[key]);
        // Eligible signatures must enter growth promptly, even while early ranks can still grow.
        for (const signature of signatures) {
          const skill = `${profile.classId}.${signature}`;
          const source = catalog.find(row => canonicalSkillIdFromData(row.id) === skill); assert.ok(source);
          // This paid bridge explicitly defers mastery to 13, then refunds its Swing ranks at 12.
          const deadline = id === 'barbarian-double-throw' && signature === 'throwing_mastery'
            ? 13 : getSkillRequiredLevel(source) + 2;
          if (level >= deadline)
            expect(ranks[skill], `${skill} at ${String(level)}`).toBeGreaterThanOrEqual(1);
        }
        growCampaignBuild(profile, () => undefined);
        expect(snapshotStores()).toEqual(after);
      }
      const player = usePlayerStore.getState().player; assert.ok(player);
      if (id === 'barbarian-double-throw') {
        expect(resetCount).toBe(batched ? 0 : 1);
        const finalTargets = Object.fromEntries(profile.targets.map(target => [target.id, target.rank]));
        expect(player.skillLevels).toEqual({ ...finalTargets, 'barbarian.find_potion': 1 });
      }
      expect(playerToCombatUnit(player).skillOrder).toContain(`${profile.classId}.${active}`);
      expect(player.skillLevels?.[`${profile.classId}.${active}`]).toBeGreaterThan(1);
    });
  }
}

it('registers exactly two intended identities per class with valid ordered native prerequisites', () => {
  expect(growth.version).toBe(1);
  expect(Object.keys(intendedCampaignProfiles).sort()).toEqual(builds.map(([id]) => `${id}-intended-v1`).sort());
  expect(Object.keys(growth.profiles).sort()).toEqual(Object.keys(intendedCampaignProfiles).sort());
  const counts = new Map<string, number>();
  for (const [id, profile] of Object.entries(intendedCampaignProfiles)) {
    expect(campaignRequest('act1', id).profile).toEqual(profile);
    expect(profile.socketPreparationPolicy).toBe('owned-act2-defense-v1');
    expect(profile.mercWeaponPolicy).toBe('physical-offense-v1');
    expect(profile.capacityPolicy).toBe('owned-shortlist-v2');
    expect(campaignRequest('act1', id.replace('-intended-v1', '')).profile).not.toHaveProperty('capacityPolicy');
    expect(profile.mercWeaponSocketPolicy).toBe('owned-physical-offense-v1');
    expect(campaignRequest('act1', id.replace('-intended-v1', '')).profile).not.toHaveProperty('mercWeaponSocketPolicy');
    expect(campaignRequest('act1', id.replace('-intended-v1', '')).profile).not.toHaveProperty('mercWeaponPolicy');
    expect(campaignRequest('act1', id.replace('-intended-v1', '')).profile).not.toHaveProperty('socketPreparationPolicy');
    counts.set(profile.classId, (counts.get(profile.classId) ?? 0) + 1);
    const catalog = getSkillsForClass(profile.classId);
    const planned = new Map<string, { rank: number; level: number }>();
    for (const target of profile.targets) {
      const source = catalog.find(skill => canonicalSkillIdFromData(skill.id) === target.id); assert.ok(source);
      expect(Number.isInteger(target.rank) && target.rank > 0 && target.rank <= source.maxLevel).toBe(true);
      expect(Number.isInteger(target.level) && target.level >= getSkillRequiredLevel(source)).toBe(true);
      for (const prerequisite of source.prerequisites ?? []) {
        const canonical = canonicalSkillIdFromData(prerequisite); assert.ok(canonical);
        const earlier = planned.get(canonical); assert.ok(earlier, `${target.id} requires ${canonical}`);
        expect(earlier.level).toBeLessThanOrEqual(target.level);
      }
      expect(target.rank).toBeGreaterThanOrEqual(planned.get(target.id)?.rank ?? 0);
      planned.set(target.id, target);
    }
    const stats = profile.statsPerLevel;
    expect(stats.strength + stats.dexterity + stats.vitality + stats.energy).toBe(5);
    for (const skill of profile.priority)
      expect(catalog.some(source => canonicalSkillIdFromData(source.id) === skill)).toBe(true);
  }
  expect(counts.size).toBe(7);
  expect([...counts.values()]).toEqual(Array<number>(7).fill(2));
});

it('holds unused Cold points and spends them on unlocks without a reset or extra grant', () => {
  const { profile } = campaignRequest('act1', 'sorceress-cold-intended-v1');
  expect(createCharacter('Held cold points', 'sorceress').ok).toBe(true);
  for (let level = 1; level <= 5; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, () => undefined);
  }
  const held = snapshotStores(); assert.ok(held);
  expect(held.player.skillPoints).toBe(3);
  expect(held.player.skillLevels).toEqual({ 'sorceress.ice_bolt': 1, 'sorceress.frost_nova': 1,
    'sorceress.warmth': 1, 'sorceress.frozen_armor': 1 });
  usePlayerStore.getState().gainExperience(xpTotal(6) - xpTotal(5));
  const earned = snapshotStores(); assert.ok(earned);
  growCampaignBuild(profile, () => undefined);
  const prepared = snapshotStores(); assert.ok(prepared);
  expect(prepared.player.skillPoints).toBe(0);
  expect(prepared.player.skillLevels).toEqual({ ...held.player.skillLevels,
    'sorceress.ice_blast': 1, 'sorceress.static_field': 1, 'sorceress.frost_nova': 3 });
  expect(prepared.player.experience).toBe(earned.player.experience);
  expect(prepared.player.respecsRemaining).toEqual(held.player.respecsRemaining);
  for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(prepared[key]).toEqual(held[key]);
});


it('prepares an area-aware learned curse without allocating held points or changing any other save state', () => {
  expect(createCharacter('Area curse', 'necromancer').ok).toBe(true);
  const profile = intendedCampaignProfiles['necromancer-bone-intended-v1'];
  for (let level = 1; level <= 22; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, () => undefined);
  }
  // Unspent native level grants must remain unspent when only a combo is prepared.
  usePlayerStore.getState().gainExperience(xpTotal(23) - xpTotal(22));
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillPoints).toBeGreaterThan(0);
  expect(before.player.comboOrder).toContain('necromancer.weaken');
  prepareCampaignCombo(profile, () => undefined, 'areas/act2-far-oasis');
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.comboOrder).toEqual(['necromancer.corpse_explosion', 'necromancer.bone_armor',
    'necromancer.bone_wall', 'necromancer.amplify_damage', 'necromancer.teeth']);
  expect({ ...after, player: { ...after.player, comboOrder: before.player.comboOrder } }).toEqual(before);
  const projected = playerToCombatUnit(after.player);
  expect(projected.skillOrder).toContain('necromancer.amplify_damage');
  expect(projected.skillOrder).not.toContain('necromancer.weaken');
  expect(projected.skillOrder).not.toContain('necromancer.bone_armor');
  // Returning to a training destination or a default boundary restores defense.
  for (const area of ['areas/act2-dry-hills', undefined]) {
    prepareCampaignCombo(profile, () => undefined, 'areas/act2-far-oasis');
    prepareCampaignCombo(profile, () => undefined, area);
    expect(snapshotStores()).toEqual(before);
  }
});

it('uses only learned and declared curses for area-aware preparation', () => {
  expect(createCharacter('Learned curse', 'necromancer').ok).toBe(true);
  usePlayerStore.getState().gainExperience(xpTotal(5) - xpTotal(1));
  const profile = intendedCampaignProfiles['necromancer-bone-intended-v1'];
  growCampaignBuild(profile, () => undefined);
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillLevels?.['necromancer.amplify_damage']).toBe(1);
  // Decrepify is declared but unlearned; Weaken is learned later. Both fall back to Amplify.
  prepareCampaignCombo({ ...profile, cursePreferenceByArea: {
    'areas/act2-far-oasis': ['necromancer.decrepify', 'necromancer.weaken']
  } }, () => undefined, 'areas/act2-far-oasis');
  expect(snapshotStores()).toEqual(before);
  expect(before.player.comboOrder).toContain('necromancer.amplify_damage');
  expect(before.player.comboOrder).not.toContain('necromancer.weaken');
  expect(before.player.comboOrder).not.toContain('necromancer.decrepify');
});


it('pays for the area-aware offensive curse and applies its finite native effect', () => {
  expect(createCharacter('Paid area curse', 'necromancer').ok).toBe(true);
  const profile = intendedCampaignProfiles['necromancer-bone-intended-v1'];
  for (let level = 1; level <= 22; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, () => undefined);
  }
  prepareCampaignCombo(profile, () => undefined, 'areas/act2-far-oasis');
  const player = usePlayerStore.getState().player; assert.ok(player);
  const hero = playerToCombatUnit(player);
  const target: CombatUnit = { id: 'offensive-curse-target', name: 'Curse target', side: 'enemy', kind: 'monster',
    tier: 'trash', level: 22, life: 100000, mana: 0,
    stats: { ...hero.stats, life: 100000, lifeMax: 100000, mana: 0, manaMax: 0, defense: 0,
      magicResist: 0, physDodge: 0, magicDodge: 0 },
    statuses: [{ id: 'stun', sourceId: 'constructed-policy', stacks: 1, remaining: -1 }],
    cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
  const out = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [target], maxRounds: 20 });
  const casts = out.events.flatMap(event => event.kind === 'action' && event.actor === hero.id ? [event] : []);
  const paid = casts.find(event => event.skillId === 'necromancer.amplify_damage'); assert.ok(paid);
  expect(casts.some(event => event.skillId === 'necromancer.weaken' || event.skillId === 'necromancer.decrepify')).toBe(false);
  const previous = out.events.slice(0, out.events.indexOf(paid))
    .filter(event => event.kind === 'mana' && event.target === hero.id).at(-1);
  expect(out.events.find(event => event.kind === 'mana' && event.target === hero.id &&
    event.reason === 'cast' && event.simClockMs === paid.simClockMs)).toMatchObject({
    mana: (previous?.kind === 'mana' ? previous.mana : hero.mana) - 15
  });
  const applied = out.events.find(event => event.kind === 'status-state' && event.target === target.id &&
    event.simClockMs === paid.simClockMs && event.statuses.some(status => status.id === 'amplify-damage'));
  expect(applied?.kind === 'status-state' ? applied.statuses.find(status => status.id === 'amplify-damage') : undefined)
    .toMatchObject({ sourceId: hero.id, physicalResistReductionPct: 50,
      appliedAtMs: paid.simClockMs, expiresAtMs: paid.simClockMs + 3000 });
});


// Constructed native point/ordinal fixtures verify policy, never earned evidence.
const arcane = 'areas/act2-arcane-sanctuary';
function drawRecoveryFixture() {
  expect(createCharacter('Draw recovery', 'necromancer').ok).toBe(true);
  const profile: CampaignProfile = intendedCampaignProfiles['necromancer-bone-intended-v1'];
  for (let level = 1; level <= 28; level++) {
    if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
    growCampaignBuild(profile, () => undefined);
  }
  useMapStore.setState({ challengeOrdinals: { normal: 404, nightmare: 0, hell: 0 } });
  const previousWave: CampaignWave = { phase: 'route', area: arcane, ordinal: 403, index: 5,
    outcome: 'draw', advance: 'defeat', logicalMs: 60000, xp: 0, items: 0, heroLife: 600, heroMana: 347 };
  return { profile, previousWave };
}

it('draw recovery selects the learned offensive curse first, conserves the save and pays its native finite effect', () => {
  const { profile, previousWave } = drawRecoveryFixture();
  const before = snapshotStores(); assert.ok(before);
  const records: Readonly<Record<string, unknown>>[] = [];
  prepareCampaignCombo(profile, row => { records.push(row); }, arcane, { phase: 'route', previousWave });
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.comboOrder).toEqual(['necromancer.amplify_damage', 'necromancer.corpse_explosion',
    'necromancer.bone_armor', 'necromancer.bone_wall', 'necromancer.teeth']);
  expect({ ...after, player: { ...after.player, comboOrder: before.player.comboOrder } }).toEqual(before);
  expect(records).toEqual([
    { kind: 'campaign-draw-recovery', policy: 'learned-offensive-curse-v1', area: arcane,
      previousWave, nextOrdinal: 404, selectedCurse: 'necromancer.amplify_damage' },
    { kind: 'priority', order: after.player.comboOrder }
  ]);
  const hero = playerToCombatUnit(after.player);
  expect(hero.skillOrder).toEqual(['necromancer.amplify_damage', 'necromancer.corpse_explosion',
    'necromancer.bone_wall', 'necromancer.teeth']);
  const target: CombatUnit = { id: 'draw-recovery-target', name: 'Curse target', side: 'enemy', kind: 'monster',
    tier: 'trash', level: 28, life: 100000, mana: 0,
    stats: { ...hero.stats, life: 100000, lifeMax: 100000, mana: 0, manaMax: 0, defense: 0,
      magicResist: 0, physDodge: 0, magicDodge: 0 },
    statuses: [{ id: 'stun', sourceId: 'constructed-policy', stacks: 1, remaining: -1 }],
    cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
  const out = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [target], maxRounds: 20 });
  const first = out.events.find(event => event.kind === 'action' && event.actor === hero.id);
  expect(first).toMatchObject({ skillId: 'necromancer.amplify_damage' }); assert.ok(first);
  const previousMana = out.events.slice(0, out.events.indexOf(first))
    .filter(event => event.kind === 'mana' && event.target === hero.id).at(-1);
  expect(out.events.find(event => event.kind === 'mana' && event.target === hero.id && event.reason === 'cast'))
    .toMatchObject({ mana: (previousMana?.kind === 'mana' ? previousMana.mana : hero.mana) - 15,
      simClockMs: first.simClockMs });
  const applied = out.events.find(event => event.kind === 'status-state' && event.target === target.id &&
    event.simClockMs === first.simClockMs && event.statuses.some(status => status.id === 'amplify-damage'));
  expect(applied?.kind === 'status-state' ? applied.statuses.find(status => status.id === 'amplify-damage') : undefined)
    .toMatchObject({ sourceId: hero.id, physicalResistReductionPct: 50,
      appliedAtMs: first.simClockMs, expiresAtMs: first.simClockMs + 3000 });
});

it.each(['disabled', 'no-combo-policy', 'unlearned', 'undeclared', 'current-farm', 'prior-farm',
  'victory', 'defeat', 'dead-hero', 'foreign-area', 'stale-ordinal', 'missing-wave', 'not-terminal'] as const)(
  'draw recovery does not trigger for %s', invalid => {
  const fixture = drawRecoveryFixture();
  let profile: CampaignProfile = fixture.profile;
  let previousWave: CampaignWave | undefined = fixture.previousWave;
  if (invalid === 'disabled') { const disabled = { ...profile }; delete disabled.drawRecoveryPolicy; profile = disabled; }
  if (invalid === 'no-combo-policy') { const disabled = { ...profile }; delete disabled.comboPolicy; profile = disabled; }
  if (invalid === 'undeclared') profile = { ...profile,
    priority: profile.priority.filter(skill => skill !== 'necromancer.amplify_damage') };
  if (invalid === 'unlearned') {
    const player = usePlayerStore.getState().player; assert.ok(player);
    usePlayerStore.setState({ player: { ...player,
      skillLevels: { ...player.skillLevels, 'necromancer.amplify_damage': 0 } } });
  }
  if (invalid === 'prior-farm') previousWave = { ...previousWave, phase: 'farm' };
  if (invalid === 'victory' || invalid === 'defeat') previousWave = { ...previousWave, outcome: invalid };
  if (invalid === 'dead-hero') previousWave = { ...previousWave, heroLife: 0 };
  if (invalid === 'foreign-area') previousWave = { ...previousWave, area: 'areas/act2-lost-city' };
  if (invalid === 'stale-ordinal') previousWave = { ...previousWave, ordinal: 402 };
  if (invalid === 'not-terminal') previousWave = { ...previousWave, advance: 'next-wave' };
  if (invalid === 'missing-wave') previousWave = undefined;
  prepareCampaignCombo(profile, () => undefined, arcane);
  const baseline = snapshotStores();
  const records: Readonly<Record<string, unknown>>[] = [];
  prepareCampaignCombo(profile, row => { records.push(row); }, arcane,
    { phase: invalid === 'current-farm' ? 'farm' : 'route', previousWave });
  expect(snapshotStores()).toEqual(baseline);
  expect(records.map(row => row.kind)).toEqual(['priority']);
});

it('draw recovery resets at the next area or default boundary and preserves the Far Oasis preference', () => {
  const { profile, previousWave } = drawRecoveryFixture();
  const before = snapshotStores();
  for (const area of [undefined, 'areas/act2-tomb-of-tal-rasha']) {
    prepareCampaignCombo(profile, () => undefined, arcane, { phase: 'route', previousWave });
    expect(usePlayerStore.getState().player?.comboOrder[0]).toBe('necromancer.amplify_damage');
    prepareCampaignCombo(profile, () => undefined, area, { phase: 'route', previousWave });
    expect(snapshotStores()).toEqual(before);
  }
  prepareCampaignCombo(profile, () => undefined, 'areas/act2-far-oasis', { phase: 'route', previousWave });
  expect(usePlayerStore.getState().player?.comboOrder).toEqual(['necromancer.corpse_explosion',
    'necromancer.bone_armor', 'necromancer.bone_wall', 'necromancer.amplify_damage', 'necromancer.teeth']);
});

it('draw recovery is enabled only on intended Bone and leaves historical and other intended profiles unchanged', () => {
  for (const [id, profile] of Object.entries(intendedCampaignProfiles)) {
    expect((profile as CampaignProfile).drawRecoveryPolicy)
      .toBe(id === 'necromancer-bone-intended-v1' ? 'learned-offensive-curse-v1' : undefined);
    expect((profile as CampaignProfile).trainingDrawRecoveryPolicy)
      .toBe(id === 'necromancer-bone-intended-v1' ? 'learned-offensive-curse-v1' : undefined);
    expect(campaignRequest('act1', id.replace('-intended-v1', '')).profile).not.toHaveProperty('drawRecoveryPolicy');
    expect(campaignRequest('act1', id.replace('-intended-v1', '')).profile).not.toHaveProperty('trainingDrawRecoveryPolicy');
  }
});


it('training recovery submits the learned curse without spending points and carries only successful same-source history', () => {
  const { profile, previousWave: routeDraw } = drawRecoveryFixture();
  const previousWave: CampaignWave = { ...routeDraw, phase: 'farm' };
  const recovery = { policy: 'learned-offensive-curse-v1', area: arcane, triggerOrdinal: 403 } as const;
  const before = snapshotStores(); assert.ok(before);
  const records: Readonly<Record<string, unknown>>[] = [];
  prepareCampaignCombo(profile, row => { records.push(row); }, arcane,
    { phase: 'farm', previousWave, trainingRecovery: recovery });
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.comboOrder[0]).toBe('necromancer.amplify_damage');
  expect({ ...after, player: { ...after.player, comboOrder: before.player.comboOrder } }).toEqual(before);
  expect(records[0]).toEqual({ kind: 'campaign-training-draw-recovery', recovery,
    previousWave, nextOrdinal: 404, selectedCurse: 'necromancer.amplify_damage' });
  expect(playerToCombatUnit(after.player).skillOrder).toEqual(['necromancer.amplify_damage',
    'necromancer.corpse_explosion', 'necromancer.bone_wall', 'necromancer.teeth']);
  useMapStore.setState({ challengeOrdinals: { normal: 405, nightmare: 0, hell: 0 } });
  prepareCampaignCombo(profile, () => undefined, arcane, { phase: 'farm', trainingRecovery: recovery,
    previousWave: { ...previousWave, ordinal: 404, outcome: 'victory', advance: 'victory' } });
  expect(usePlayerStore.getState().player?.comboOrder).toEqual(after.player.comboOrder);
  prepareCampaignCombo(profile, () => undefined);
  expect(usePlayerStore.getState().player?.comboOrder).toEqual(before.player.comboOrder);
});

it.each(['disabled', 'unlearned', 'undeclared', 'no-combo-policy', 'no-proof', 'dead-hero',
  'wrong-trigger', 'foreign-source', 'stale-ordinal', 'failed-retry', 'route'] as const)(
  'training recovery rejects %s and retains the defensive selection', invalid => {
    const fixture = drawRecoveryFixture();
    let profile: CampaignProfile = fixture.profile;
    let previousWave: CampaignWave = { ...fixture.previousWave, phase: 'farm' };
    let recovery: { policy: 'learned-offensive-curse-v1'; area: string; triggerOrdinal: number } | undefined =
      { policy: 'learned-offensive-curse-v1', area: arcane, triggerOrdinal: 403 };
    if (invalid === 'disabled') {
      const { trainingDrawRecoveryPolicy: omitted, ...withoutPolicy } = profile; void omitted;
      profile = withoutPolicy;
    }
    if (invalid === 'no-combo-policy') {
      const { comboPolicy: omitted, ...withoutPolicy } = profile; void omitted;
      profile = withoutPolicy;
    }
    if (invalid === 'undeclared') profile = { ...profile, priority: profile.priority.filter(id => id !== 'necromancer.amplify_damage') };
    if (invalid === 'unlearned') usePlayerStore.setState(state => ({ player: state.player ? {
      ...state.player, skillLevels: { ...state.player.skillLevels, 'necromancer.amplify_damage': 0 }
    } : state.player }));
    if (invalid === 'no-proof') recovery = undefined;
    if (invalid === 'wrong-trigger') { assert.ok(recovery); recovery.triggerOrdinal--; }
    if (invalid === 'foreign-source') { assert.ok(recovery); recovery.area = 'areas/act2-lost-city'; }
    if (invalid === 'dead-hero') previousWave = { ...previousWave, heroLife: 0 };
    if (invalid === 'stale-ordinal') previousWave = { ...previousWave, ordinal: 402 };
    if (invalid === 'failed-retry') {
      previousWave = { ...previousWave, ordinal: 404 };
      useMapStore.setState({ challengeOrdinals: { normal: 405, nightmare: 0, hell: 0 } });
    }
    prepareCampaignCombo(profile, () => undefined, arcane);
    const before = snapshotStores();
    const records: Readonly<Record<string, unknown>>[] = [];
    prepareCampaignCombo(profile, row => { records.push(row); }, arcane,
      { phase: invalid === 'route' ? 'route' : 'farm', previousWave, trainingRecovery: recovery });
    expect(snapshotStores()).toEqual(before);
    expect(records.map(row => row.kind)).toEqual(['priority']);
  });


it.each(['areas/act5-bloody-foothills', 'areas/act5-frigid-highlands',
  'areas/act5-crystalline-passage', 'areas/act5-ancients-way', 'areas/act5-throne-of-destruction'])(
  'Act V corpse recipe prepares learned pack actions and conserves native state in %s', area => {
    expect(createCharacter('Act V corpse', 'necromancer').ok).toBe(true);
    const profile = intendedCampaignProfiles['necromancer-bone-intended-v1'];
    for (let level = 1; level <= 63; level++) {
      if (level > 1) usePlayerStore.getState().gainExperience(xpTotal(level) - xpTotal(level - 1));
      growCampaignBuild(profile, () => undefined);
    }
    const before = snapshotStores(); assert.ok(before);
    prepareCampaignCombo(profile, () => undefined, area, { phase: 'route' });
    const after = snapshotStores(); assert.ok(after);
    expect(after.player.comboOrder).toEqual(area === 'areas/act5-crystalline-passage'
      ? ['necromancer.dim_vision', 'necromancer.decrepify', 'necromancer.corpse_explosion']
      : ['necromancer.amplify_damage', 'necromancer.corpse_explosion']);
    expect(playerToCombatUnit(after.player).skillOrder).toEqual(after.player.comboOrder);
    expect({ ...after, player: { ...after.player, comboOrder: before.player.comboOrder } }).toEqual(before);
    // A previous Act V order must not leak into another area or an idle boundary.
    for (const other of ['areas/act4-plains-of-despair', undefined]) {
      prepareCampaignCombo(profile, () => undefined, area);
      prepareCampaignCombo(profile, () => undefined, other);
      expect(snapshotStores()).toEqual(before);
    }
  });

it.each(['route', 'farm'] as const)('declared recovery retains Crystalline control during %s draw recovery', phase => {
  const { profile, previousWave: fixture } = drawRecoveryFixture();
  const area = 'areas/act5-crystalline-passage';
  const previousWave: CampaignWave = { ...fixture, phase, area };
  const before = snapshotStores(); assert.ok(before);
  const records: Readonly<Record<string, unknown>>[] = [];
  const supplied = { policy: 'learned-offensive-curse-v1', area, triggerOrdinal: previousWave.ordinal } as const;
  expect(trainingCurseRecovery(profile, before.player.skillLevels ?? {}, area, 404,
    { ...previousWave, phase: 'farm' }, undefined)).toEqual(supplied);
  prepareCampaignCombo(profile, row => { records.push(row); }, area,
    { phase, previousWave, trainingRecovery: supplied });
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.comboOrder).toEqual(['necromancer.amplify_damage', 'necromancer.dim_vision',
    'necromancer.corpse_explosion']);
  expect(playerToCombatUnit(after.player).skillOrder).toEqual(after.player.comboOrder);
  expect(records).toEqual([
    phase === 'route'
      ? { kind: 'campaign-draw-recovery', policy: 'learned-offensive-curse-v1', area,
        previousWave, nextOrdinal: 404, selectedCurse: 'necromancer.amplify_damage' }
      : { kind: 'campaign-training-draw-recovery', recovery: supplied,
        previousWave, nextOrdinal: 404, selectedCurse: 'necromancer.amplify_damage' },
    { kind: 'priority', order: after.player.comboOrder }
  ]);
  expect({ ...after, player: { ...after.player, comboOrder: before.player.comboOrder } }).toEqual(before);
  prepareCampaignCombo(profile, () => undefined, area);
  expect(usePlayerStore.getState().player?.comboOrder).toEqual(['necromancer.dim_vision',
    'necromancer.decrepify', 'necromancer.corpse_explosion']);
});

it.each(['route', 'farm'] as const)('declared recovery is independent of area identity for %s', phase => {
  const { profile, previousWave: fixture } = drawRecoveryFixture();
  const area = 'areas/constructed-recovery-policy';
  const candidate: CampaignProfile = { ...profile, priorityByArea: { [area]:
    ['necromancer.dim_vision', 'necromancer.decrepify', 'necromancer.corpse_explosion'] } };
  const before = snapshotStores(); assert.ok(before);
  prepareCampaignCombo(candidate, () => undefined, area, { phase,
    previousWave: { ...fixture, phase, area },
    trainingRecovery: { policy: 'learned-offensive-curse-v1', area, triggerOrdinal: fixture.ordinal } });
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.comboOrder).toEqual(['necromancer.amplify_damage', 'necromancer.dim_vision',
    'necromancer.corpse_explosion']);
  expect(playerToCombatUnit(after.player).skillOrder).toEqual(after.player.comboOrder);
  expect({ ...after, player: { ...after.player, comboOrder: before.player.comboOrder } }).toEqual(before);
});

it.each(['undeclared', 'unlearned', 'missing-history', 'stale-history', 'dead-hero', 'missing-proof',
  'forged-proof', 'failed-retry'] as const)('declared recovery retains Crystalline guards: %s', invalid => {
  const { profile, previousWave: fixture } = drawRecoveryFixture();
  const area = 'areas/act5-crystalline-passage';
  const candidate: CampaignProfile = invalid === 'undeclared' ? { ...profile,
    priority: profile.priority.filter(skill => skill !== 'necromancer.amplify_damage') } : profile;
  if (invalid === 'unlearned') usePlayerStore.setState(state => ({ player: state.player ? {
    ...state.player, skillLevels: { ...state.player.skillLevels, 'necromancer.amplify_damage': 0 }
  } : state.player }));
  const phases = ['missing-proof', 'forged-proof', 'failed-retry'].includes(invalid)
    ? ['farm'] as const : ['route', 'farm'] as const;
  for (const phase of phases) {
    const previousWave: CampaignWave | undefined = invalid === 'missing-history' ? undefined
      : { ...fixture, area, phase, ordinal: invalid === 'stale-history' ? 402 : fixture.ordinal,
        heroLife: invalid === 'dead-hero' ? 0 : fixture.heroLife };
    prepareCampaignCombo(candidate, () => undefined, area);
    const before = snapshotStores(); assert.ok(before);
    const records: Readonly<Record<string, unknown>>[] = [];
    prepareCampaignCombo(candidate, row => { records.push(row); }, area, { phase, previousWave,
      trainingRecovery: invalid === 'missing-proof' ? undefined : {
        policy: 'learned-offensive-curse-v1', area,
        triggerOrdinal: invalid === 'forged-proof' ? 404 : invalid === 'failed-retry' ? 402 : fixture.ordinal } });
    expect(snapshotStores()).toEqual(before);
    expect(records).toEqual([{ kind: 'priority', order: before.player.comboOrder }]);
  }
});

it.each(['areas/act5-frigid-highlands', 'areas/act5-crystalline-passage'])(
  'Act V corpse recipe never grants unlearned skills or spends points in %s', area => {
  expect(createCharacter('Unlearned corpse', 'necromancer').ok).toBe(true);
  const before = snapshotStores(); assert.ok(before);
  expect(before.player.skillLevels?.['necromancer.amplify_damage'] ?? 0).toBe(0);
  expect(before.player.skillLevels?.['necromancer.corpse_explosion'] ?? 0).toBe(0);
  expect(before.player.skillLevels?.['necromancer.dim_vision'] ?? 0).toBe(0);
  expect(before.player.skillLevels?.['necromancer.decrepify'] ?? 0).toBe(0);
  prepareCampaignCombo(intendedCampaignProfiles['necromancer-bone-intended-v1'], () => undefined,
    area);
  const after = snapshotStores(); assert.ok(after);
  // The setter stores priorities; native projection owns learned-active authority.
  expect(after.player.comboOrder).toEqual(area === 'areas/act5-crystalline-passage'
    ? ['necromancer.dim_vision', 'necromancer.corpse_explosion'] : ['necromancer.corpse_explosion']);
  expect(playerToCombatUnit(after.player).skillOrder).toEqual(['necromancer.corpse_explosion']);
  expect(composeCorpseExplosion(after.player)).toBeUndefined();
  expect({ ...after, player: { ...after.player, comboOrder: before.player.comboOrder } }).toEqual(before);
});

it.each(['areas/act5-frigid-highlands', 'areas/act5-crystalline-passage'])(
  'Act V corpse recipe leaves legacy profiles on their declared learned order in %s', area => {
  expect(createCharacter('Legacy corpse', 'necromancer').ok).toBe(true);
  const { profile } = campaignRequest('act5', 'necromancer-bone');
  growCampaignBuild(profile, () => undefined);
  const before = snapshotStores(); assert.ok(before);
  prepareCampaignCombo(profile, () => undefined, area);
  expect(snapshotStores()).toEqual(before);
});

it('corpse decoy preparation pays two late skill points and preserves all earlier allocations and save domains', () => {
  const { before, records } = prepareLateCorpseDecoy();
  const after = snapshotStores(); assert.ok(after);
  expect(records.filter(row => row.kind === 'allocate-skill')).toEqual([
    expect.objectContaining({ target: { id: 'necromancer.confuse', rank: 1, level: 18 }, result: 'ok' }),
    expect.objectContaining({ target: { id: 'necromancer.attract', rank: 1, level: 24 }, result: 'ok' })
  ]);
  expect(after.player.skillPoints).toBe(before.player.skillPoints - 2);
  expect(after.player.skillLevels).toEqual({ ...before.player.skillLevels,
    'necromancer.confuse': 1, 'necromancer.attract': 1 });
  expect({ ...after, player: { ...after.player, skillPoints: before.player.skillPoints,
    skillLevels: before.player.skillLevels } }).toEqual(before);
  growCampaignBuild(corpseDecoyCampaignProfile, () => undefined);
  expect(snapshotStores()).toEqual(after);
});

it('corpse decoy preparation changes only the explicit Crystalline priority and retains canonical profiles', () => {
  prepareLateCorpseDecoy();
  const candidate = corpseDecoyCampaignProfile, original = intendedCampaignProfiles['necromancer-bone-intended-v1'];
  expect(candidate.targets.slice(0, original.targets.length)).toEqual(original.targets);
  expect(candidate).toEqual({ ...original, targets: [...original.targets,
    { id: 'necromancer.confuse', rank: 1, level: 18 }, { id: 'necromancer.attract', rank: 1, level: 24 }],
    priorityByArea: { ...original.priorityByArea, 'areas/act5-crystalline-passage':
      ['necromancer.attract', 'necromancer.corpse_explosion', 'necromancer.confuse'] } });
  expect(Object.keys(intendedCampaignProfiles)).toHaveLength(14);
  expect(original.targets.some(target => target.id === 'necromancer.attract')).toBe(false);
  const area = 'areas/act5-crystalline-passage', before = snapshotStores(); assert.ok(before);
  prepareCampaignCombo(candidate, () => undefined, area);
  const after = snapshotStores(); assert.ok(after);
  expect(after.player.comboOrder).toEqual(['necromancer.attract', 'necromancer.corpse_explosion', 'necromancer.confuse']);
  expect(playerToCombatUnit(after.player).skillOrder).toEqual(after.player.comboOrder);
  expect({ ...after, player: { ...after.player, comboOrder: before.player.comboOrder } }).toEqual(before);
  for (const other of [undefined, 'areas/act4-plains-of-despair', 'areas/act5-frigid-highlands']) {
    prepareCampaignCombo(candidate, () => undefined, other);
    const selected = snapshotStores(); assert.ok(selected);
    prepareCampaignCombo(original, () => undefined, other);
    expect(snapshotStores()).toEqual(selected);
  }
});

it('corpse decoy preparation grants no unlearned curse, corpse authority or resources', () => {
  expect(createCharacter('Unlearned decoy', 'necromancer').ok).toBe(true);
  const before = snapshotStores(); assert.ok(before);
  prepareCampaignCombo(corpseDecoyCampaignProfile, () => undefined, 'areas/act5-crystalline-passage');
  const after = snapshotStores(); assert.ok(after);
  const hero = playerToCombatUnit(after.player);
  expect(hero.skillOrder).not.toContain('necromancer.attract');
  expect(hero.skillOrder).not.toContain('necromancer.confuse');
  expect(composeCorpseExplosion(after.player)).toBeUndefined();
  expect({ ...after, player: { ...after.player, comboOrder: before.player.comboOrder } }).toEqual(before);
});

it('corpse decoy preparation creates its first corpse through an enemy attack before a paid explosion', () => {
  prepareLateCorpseDecoy();
  prepareCampaignCombo(corpseDecoyCampaignProfile, () => undefined, 'areas/act5-crystalline-passage');
  const player = usePlayerStore.getState().player; assert.ok(player);
  const authority = composeCorpseExplosion(player); assert.ok(authority);
  const hero = playerToCombatUnit(player);
  // Both paid curses precede the 900 ms enemy turn; the faster staged-Dexterity
  // hero would otherwise kill this 120-Life bait with its 1200 ms fallback.
  const enemies: CombatUnit[] = ['bait', 'comrade-a', 'comrade-b'].map(id => ({
    id, name: id, side: 'enemy', kind: 'monster', tier: 'trash', level: hero.level, enraged: false,
    life: 120, mana: 0, skillOrder: [], skillLevels: {}, cooldowns: {}, statuses: [], activeBuffIds: [],
    stats: { ...hero.stats, life: 120, lifeMax: 120, mana: 0, manaMax: 0, attack: 150,
      attackSpeed: 200, defense: 0, magicResist: 0, critChance: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } }
  }));
  const input: CombatSnapshot = { seed: 17171, playerTeam: [hero], enemyTeam: enemies, corpseExplosion: [authority] };
  const before = structuredClone(input), saved = snapshotStores();
  const out = runBattleRecorded(input);
  expect(out.events.at(-1)?.simClockMs).toBeLessThanOrEqual(12000);
  expect(input).toEqual(before);
  expect(snapshotStores()).toEqual(saved);
  const firstDeath = out.events.find(event => event.kind === 'death');
  assert.ok(firstDeath?.kind === 'death');
  for (const skillId of ['necromancer.attract', 'necromancer.confuse']) {
    const cast = out.events.find(event => event.kind === 'action' && event.actor === hero.id && event.skillId === skillId);
    assert.ok(cast);
    expect(cast.simClockMs).toBeLessThan(firstDeath.simClockMs);
    expect(out.events.some(event => event.kind === 'mana' && event.target === hero.id && event.reason === 'cast' &&
      event.simClockMs === cast.simClockMs)).toBe(true);
  }
  expect(out.events.some(event => event.kind === 'damage' && event.source === hero.id &&
    event.simClockMs <= firstDeath.simClockMs)).toBe(false);
  const killingHit = out.events.find(event => event.kind === 'damage' && event.target === firstDeath.target &&
    event.simClockMs === firstDeath.simClockMs && event.amount >= 120);
  expect(killingHit).toMatchObject({ damageType: 'physical' });
  assert.ok(killingHit?.kind === 'damage');
  expect(enemies.map(enemy => enemy.id)).toContain(killingHit.source);
  const explosion = out.events.find(event => event.kind === 'action' && event.skillId === 'necromancer.corpse_explosion');
  assert.ok(explosion);
  expect(explosion.simClockMs).toBeGreaterThanOrEqual(firstDeath.simClockMs);
  expect(out.events.some(event => event.kind === 'message' && event.messageKey === 'combat:corpses.consumed')).toBe(true);
  expect(out.events.some(event => event.kind === 'mana' && event.target === hero.id && event.reason === 'cast' &&
    event.simClockMs === explosion.simClockMs)).toBe(true);
});

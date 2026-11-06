import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { campaignRequest, campaignTotals, type CampaignWave } from '../../campaign/policy';
import { campaignProfiles } from '../../campaign/profiles';

const wave = (patch: Partial<CampaignWave> = {}): CampaignWave => ({
  phase: 'route', area: 'areas/act1-blood-moor', ordinal: 0, index: 0,
  outcome: 'victory', advance: 'next-wave', logicalMs: 2000, xp: 60,
  items: 1, heroLife: 50, heroMana: 20, ...patch
});

describe('fresh earned campaign request boundary', () => {
  it('requires an explicitly named implemented profile and finite phase', () => {
    expect(campaignRequest('intro', 'sorceress-cold')).toEqual({
      phase: 'intro', profile: campaignProfiles['sorceress-cold']
    });
    for (const id of [undefined, '', 'all', 'barbarian-cold', 'sorceress-fire,sorceress-cold'])
      expect(() => campaignRequest('intro', id)).toThrow('profile');
    for (const phase of [undefined, '', 'retry-until-win', 'act6'])
      expect(() => campaignRequest(phase, 'sorceress-fire')).toThrow('phase');
  });

  it('keeps element policies distinct, preserves native grants and spends only earned points', () => {
    const cold = campaignProfiles['sorceress-cold'];
    const fire = campaignProfiles['sorceress-fire'];
    expect(cold.classId).toBe('sorceress');
    expect(fire.classId).toBe('sorceress');
    expect(cold.priority).not.toEqual(fire.priority);
    expect(cold.statsPerLevel).toEqual({ strength: 0, dexterity: 0, vitality: 2, energy: 3 });
    expect(fire.statsPerLevel).toEqual(cold.statsPerLevel);
    expect(cold.targets[0]).toMatchObject({ id: 'sorceress.warmth', rank: 1 });
    expect(fire.targets[0]).toMatchObject({ id: 'sorceress.fire_bolt', rank: 1 });
  });
});

describe('native combat-time campaign accounting', () => {
  it('includes farming and failed battle time in throughput while keeping them separate', () => {
    const rows = [wave({ phase: 'farm', logicalMs: 3000 }), wave(),
      wave({ outcome: 'draw', advance: 'defeat', logicalMs: 5000, xp: 0, items: 0 })];
    expect(campaignTotals(rows)).toMatchObject({
      playedWaves: 3, wonWaves: 2, nonwins: 1, combatMs: 10_000,
      unobservedWaves: 0,
      unmeasuredWaves: 0,
      farmMs: 3000, routeMs: 7000, nonwinMs: 5000,
      earnings: { waves: { xp: 120, items: 2 }, quests: { xp: 0, items: 0 },
        allEarned: { xp: 120, items: 2 } },
      allEarnedXpPerCombatHour: 43_200, completedChallenges: 0
    });
  });

  it('counts only final settled living-hero wins as challenge clears', () => {
    expect(campaignTotals([wave(), wave({ advance: 'victory' })]).completedChallenges).toBe(1);
    expect(campaignTotals([wave({ outcome: 'defeat', advance: 'defeat' })]).completedChallenges).toBe(0);
    expect(campaignTotals([]).allEarnedXpPerCombatHour).toBeNull();
  });

  it('includes quest claims in all-earned throughput with failed combat time in the denominator', () => {
    const rows = [wave(), wave({ outcome: 'defeat', advance: 'defeat', logicalMs: 3000, xp: 0, items: 0 })];
    expect(campaignTotals(rows, [{ xp: 500, items: 1 }])).toMatchObject({
      combatMs: 5000, earnings: { waves: { xp: 60, items: 1 }, quests: { xp: 500, items: 1 },
        allEarned: { xp: 560, items: 2 } }, allEarnedXpPerCombatHour: 403_200
    });
  });

  it('rejects invalid elapsed time instead of manufacturing pacing', () => {
    for (const logicalMs of [-1, Number.NaN, Number.POSITIVE_INFINITY])
      expect(() => campaignTotals([wave({ logicalMs })])).toThrow('time');
  });

  it('retains native time and income before an observation failure without inventing a classification', () => {
    const classified = [wave({ phase: 'farm', logicalMs: 3000 }), wave({ advance: 'victory' }),
      wave({ outcome: 'draw', advance: 'defeat', logicalMs: 5000, xp: 0, items: 0 })];
    const unobserved = [
      { phase: 'farm' as const, area: 'areas/act1-blood-moor', ordinal: 3, index: 0,
        logicalMs: 7000, xp: 120, items: 2 },
      { phase: 'route' as const, area: 'areas/act3-travincal', ordinal: 4, index: 0,
        logicalMs: 11000, xp: 200, items: 3 }
    ];
    const totals = campaignTotals(classified, [{ xp: 500, items: 1 }], unobserved);
    expect(totals).toMatchObject({
      playedWaves: 5, unobservedWaves: 2, unmeasuredWaves: 0, wonWaves: 2, nonwins: 1, completedChallenges: 1,
      combatMs: 28000, farmMs: 10000, routeMs: 18000, nonwinMs: 5000,
      earnings: { waves: { xp: 440, items: 7 }, quests: { xp: 500, items: 1 },
        allEarned: { xp: 940, items: 8 } }
    });
    expect(totals.allEarnedXpPerCombatHour).toBeCloseTo(940 * 3_600_000 / 28000);
  });

  it('rejects invalid unobserved native elapsed time before reporting financial throughput', () => {
    for (const logicalMs of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const { phase, area, ordinal, index, xp, items } = wave();
      expect(() => campaignTotals([], [], [{ phase, area, ordinal, index, xp, items, logicalMs }])).toThrow('time');
    }
  });

  it('retains exceptional native income with unknown time and withholds financial throughput', () => {
    const totals = campaignTotals([wave({ advance: 'victory' })], [{ xp: 500, items: 1 }], [
      { phase: 'route', area: 'areas/act3-travincal', ordinal: 1, index: 0,
        logicalMs: null, xp: 250, items: 2 }
    ]);
    expect(totals).toMatchObject({
      playedWaves: 2, unobservedWaves: 1, unmeasuredWaves: 1,
      wonWaves: 1, nonwins: 0, completedChallenges: 1,
      combatMs: 2000, farmMs: 0, routeMs: 2000, nonwinMs: 0,
      earnings: { waves: { xp: 310, items: 3 }, quests: { xp: 500, items: 1 },
        allEarned: { xp: 810, items: 4 } },
      allEarnedXpPerCombatHour: null
    });
  });
});

// Reviewed policy rows: id, ordered targets, priority, Str/Dex/Vit/Eng.
const reviewedRows = [
  ["amazon-bow", "critical_strike1@1, magic_arrow5@1, multiple_shot1@6, dodge1@6, multiple_shot20@6", "multiple_shot, magic_arrow", "0/2/2/1"],
  ["amazon-javelin", "jab1@1, critical_strike1@1, jab4@1, power_strike1@6, poison_javelin1@6, dodge1@6, power_strike20@6", "poison_javelin, power_strike, jab, magic_arrow", "0/2/2/1"],
  ["assassin-martial", "dragon_talon1@1, tiger_strike1@1, cobra_strike1@12, dragon_talon20@1", "cobra_strike, tiger_strike, dragon_talon", "1/1/2/1"],
  ["assassin-traps", "fire_blast1@1, shock_web6@6, charged_bolt_sentry20@12", "charged_bolt_sentry, shock_web, fire_blast", "0/0/2/3"],
  ["necromancer-summon", "skeleton_mastery1@1, clay_golem1@6, raise_skeletal_mage1@12, amplify_damage1@1, raise_skeleton12@1, skeleton_mastery20@1", "raise_skeleton, clay_golem, raise_skeletal_mage, amplify_damage", "0/0/3/2"],
  ["necromancer-bone", "teeth1@1, bone_armor1@1, corpse_explosion1@6, bone_wall1@12, teeth20@1", "bone_wall, corpse_explosion, teeth", "0/0/2/3"],
  ["barbarian-double-swing", "howl1@1, shout1@6, increased_stamina1@12, double_swing20@6, bash3@1", "howl, double_swing, bash", "1/1/2/1"],
  ["barbarian-double-throw", "howl1@1, shout1@6, increased_stamina1@12, double_swing1@6, double_throw20@12, bash3@1", "howl, double_throw, double_swing, bash", "1/1/2/1"],
  ["paladin-zeal", "sacrifice1@1, might1@1, zeal20@12, sacrifice5@1", "zeal, sacrifice", "1/1/2/1"],
  ["paladin-holy-bolt", "sacrifice1@1, prayer1@1, holy_bolt20@6", "holy_bolt, sacrifice", "0/0/2/3"],
  ["druid-fire", "oak_sage1@6, molten_boulder1@6, fissure20@12, firestorm5@1", "fissure, molten_boulder, firestorm", "0/0/2/3"],
  ["druid-summon", "raven3@1, poison_creeper1@1, oak_sage1@6, carrion_vine1@12, summon_spirit_wolf20@6", "raven, poison_creeper, summon_spirit_wolf, carrion_vine", "0/0/3/2"],
 ] as const;
const baselineIds = ['sorceress-cold', 'sorceress-fire', ...reviewedRows.map(row => row[0])];
const allIds = ['sorceress-cold', 'sorceress-cold-nova5', ...baselineIds.slice(1, 4), 'amazon-javelin-poison2',
  'amazon-javelin-poison2-impale1', ...baselineIds.slice(4)];

it('publishes fourteen exact baseline policies and separate Nova5, Poison2 and Impale1 diagnostics', () => {
  expect(allIds).toHaveLength(17);
  expect(Object.keys(campaignProfiles)).toEqual(allIds);
  const registry: unknown = JSON.parse(readFileSync(new URL('../../campaign/profile-registry.json', import.meta.url), 'utf8'));
  expect(registry).toEqual(Object.fromEntries(allIds.map(id => [id, true])));
  expect(baselineIds).toHaveLength(14);
  const counts = baselineIds.map(id => campaignProfiles[id as keyof typeof campaignProfiles].classId);
  expect(Object.fromEntries([...new Set(counts)].map(id => [id, counts.filter(value => value === id).length])))
    .toEqual({ sorceress: 2, amazon: 2, assassin: 2, necromancer: 2, barbarian: 2, paladin: 2, druid: 2 });
  for (const [id, targets, priority, stats] of reviewedRows) {
    const classId = id.split('-')[0];
    if (!classId) throw new Error('Invalid reviewed class fixture');
    const [strength, dexterity, vitality, energy] = stats.split('/').map(Number);
    expect(campaignProfiles[id as keyof typeof campaignProfiles]).toEqual({
      classId, statsPerLevel: { strength, dexterity, vitality, energy },
      targets: targets.split(', ').map(target => {
        const parts = /^([a-z_]+)([0-9]+)@([0-9]+)$/u.exec(target);
        if (!parts?.[1] || !parts[2] || !parts[3]) throw new Error('Invalid reviewed target fixture');
        return { id: `${classId}.${parts[1]}`, rank: Number(parts[2]), level: Number(parts[3]) };
      }),
      priority: priority.split(', ').map(skill => `${classId}.${skill}`),
      ...(classId === 'amazon' ? { weaponPolicy: 'preserve-bow-fallback' } : {}),
      ...(classId === 'paladin' ? { auraSelection: { id: id === 'paladin-zeal' ? 'paladin.might' : 'paladin.prayer', level: 2 } } : {})
    });
  }
});

it('declares Nova5 before Blast investment without changing the original cold policy', () => {
  expect(campaignProfiles['sorceress-cold-nova5']).toEqual({
    ...campaignProfiles['sorceress-cold'], targets: [
      { id: 'sorceress.warmth', rank: 1, level: 1 },
      { id: 'sorceress.frost_nova', rank: 5, level: 6 },
      { id: 'sorceress.ice_blast', rank: 20, level: 6 }
    ]
  });
});

it('pins the complete separate Poison2 diagnostic without changing the original Javelin policy', () => {
  const baseline = campaignProfiles['amazon-javelin'];
  expect(campaignProfiles['amazon-javelin-poison2']).toEqual({
    ...baseline, targets: [
      { id: 'amazon.jab', rank: 1, level: 1 },
      { id: 'amazon.critical_strike', rank: 1, level: 1 },
      { id: 'amazon.jab', rank: 3, level: 1 },
      { id: 'amazon.power_strike', rank: 1, level: 6 },
      { id: 'amazon.poison_javelin', rank: 2, level: 6 },
      { id: 'amazon.dodge', rank: 1, level: 6 },
      { id: 'amazon.power_strike', rank: 20, level: 6 }
    ]
  });
});

it('pins the complete separate Impale1 diagnostic while retaining the Poison2 policy', () => {
  expect(campaignProfiles['amazon-javelin-poison2-impale1']).toEqual({
    ...campaignProfiles['amazon-javelin-poison2'], targets: [
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
  });
});

it('preserves both complete original Sorceress objects', () => {
  const statsPerLevel = { strength: 0, dexterity: 0, vitality: 2, energy: 3 };
  expect(campaignProfiles['sorceress-cold']).toEqual({ classId: 'sorceress', statsPerLevel,
    targets: [{ id: 'sorceress.warmth', rank: 1, level: 1 },
      { id: 'sorceress.ice_blast', rank: 20, level: 6 }, { id: 'sorceress.frost_nova', rank: 5, level: 6 }],
    priority: ['sorceress.frost_nova', 'sorceress.ice_blast', 'sorceress.ice_bolt'] });
  expect(campaignProfiles['sorceress-fire']).toEqual({ classId: 'sorceress', statsPerLevel,
    targets: [{ id: 'sorceress.fire_bolt', rank: 1, level: 1 }, { id: 'sorceress.warmth', rank: 1, level: 1 },
      { id: 'sorceress.fire_ball', rank: 20, level: 12 }, { id: 'sorceress.fire_bolt', rank: 20, level: 1 }],
    priority: ['sorceress.fire_ball', 'sorceress.fire_bolt'] });
});

it('accepts each single profile and rejects unknown, composite and inherited names', () => {
  for (const id of allIds) for (const phase of ['intro', 'act1', 'act2', 'act3', 'act4', 'act5'])
    expect(campaignRequest(phase, id)).toEqual({ phase, profile: campaignProfiles[id as keyof typeof campaignProfiles] });
  for (const phase of ['intro', 'act3', 'act4', 'act5']) {
    for (const id of ['', '*', 'all', 'amazon-unknown', 'constructor', 'toString', '__proto__', 'amazon-bow,amazon-javelin'])
      expect(() => campaignRequest(phase, id)).toThrow('profile');
  }
});

it('preflights explicit CLI lists before the output guard without starting campaigns', () => {
  const cli = fileURLToPath(new URL('../../campaign/run.mjs', import.meta.url));
  const invoke = (selection: string | undefined, phase = 'intro') => {
    const env: NodeJS.ProcessEnv = { ...process.env, CAMPAIGN_PHASE: phase, CAMPAIGN_OUTPUT: '' };
    delete env.CAMPAIGN_PROFILES;
    if (selection !== undefined) env.CAMPAIGN_PROFILES = selection;
    const result = spawnSync(process.execPath, [cli], { env, encoding: 'utf8', timeout: 5000 });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    return result.stderr;
  };
  for (const selection of [undefined, ...allIds, 'amazon-javelin,amazon-bow', allIds.join(',')])
    expect(invoke(selection)).toContain('Specify new absolute external CAMPAIGN_OUTPUT');
  for (const phase of ['act1', 'act2', 'act3', 'act4', 'act5'])
    expect(invoke('sorceress-cold', phase)).toContain('Specify new absolute external CAMPAIGN_OUTPUT');
  for (const phase of ['act6', '', 'retry-until-win'])
    expect(invoke('sorceress-cold', phase)).toContain('Specify CAMPAIGN_PHASE=intro|act1|act2|act3|act4|act5');
  for (const selection of ['', '*', 'all', 'constructor', 'toString', '__proto__', 'amazon-bow,',
    ',amazon-bow', 'amazon-bow,,amazon-javelin', 'amazon-bow,amazon-bow', 'amazon-bow,unknown', ' amazon-bow'])
    expect(invoke(selection)).toContain('Specify distinct implemented CAMPAIGN_PROFILES');
  expect(readFileSync(cli, 'utf8')).toContain("process.env.CAMPAIGN_PROFILES ?? 'sorceress-cold,sorceress-fire'");
}, 30_000);

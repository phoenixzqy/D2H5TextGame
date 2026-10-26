import { mockSyntheticEntryPools } from '@/test/fixtures/synthetic-entry-pools';
// Imported levels, points, ranks and survival gear are unearned integration
// scaffolding. Real stores, production Dagger/PE, wave staging and monster data;
// only disk I/O is mocked.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import type { Item } from '@/engine/types/items';
import type { Player } from '@/engine/types/entities';
import type { CombatUnit } from '@/engine/combat/types';
import { createRng } from '@/engine/rng';
import { runBattle, runBattleRecorded } from '@/engine/combat/combat';
import { rollKillRewards } from '@/engine/loot/award';
import { loadAwardPools } from '@/data/loaders/loot';
import { toJsonSafe } from '@/engine/save';
import { abortSubAreaRun, advanceWaveOrFinish, hasActiveSubAreaRun, refreshActivePlayerCombatConfig,
  resetIdleElitePity, startSubAreaRun } from './combatHelpers';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { __resetPersistenceForTests, importIntoStores, snapshotStores } from './persistence';
import { armIronGolemSelection, useIronGolemSelectionStore } from './ironGolemSelectionStore';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
const PE = 'necromancer.poison_explosion', DAGGER = 'necromancer.poison_dagger';
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function required<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) throw new Error('Missing native PE fixture');
  return value;
}
const player = () => required(usePlayerStore.getState().player);
const published = () => required(inspectRecordedWaves().currentPublished);
function reset(): void {
  __resetPersistenceForTests(); abortSubAreaRun(); resetIdleElitePity();
  for (const store of stores) store.getState().reset();
}
function arrange(): void {
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Unearned PE waves', 'necromancer'),
    id: 'corpse-native-hero', level: 18, skillPoints: 2,
    skillLevels: { [DAGGER]: 1, [PE]: 1 }, comboOrder: [PE, DAGGER] });
  const cap: Item = { id: 'fixture-corpse-native-cap', baseId: 'items/base/helm-cap', socketCapacity: 0,
    rarity: 'rare', level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'fixture-imported-corpse-survival', values: new Map([
      ['statMods.life', 1000000], ['statMods.defense', 1000000], ['statMods.mana', 10000]
    ]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  usePlayerStore.getState().setPlayer({ ...player(), derivedStats: {
    ...player().derivedStats, life: 1000, mana: 100 } });
}
function start(): void {
  expect(startSubAreaRun({ act: 1, subAreaId: 'areas/act1-blood-moor', mode: 'manual',
    runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(published().binding.recording.outcome.winner).toBe('player');
}
function drain(): void {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
const pools = (hero: CombatUnit) => [hero.life, hero.mana,
  hero.manaRegenCarry, hero.manaRegenCompensation, hero.manaRegenExactCarry];
function evidence(binding: ReturnType<typeof published>['binding']) {
  return { input: binding.engineInput, recording: binding.recording, publication: binding.publication };
}
function persistent() {
  return { player: player(), backpack: useInventoryStore.getState().backpack,
    currencies: useInventoryStore.getState().currencies, rewards: useCombatStore.getState().runRewards,
    cleared: useMapStore.getState().clearedSubAreas };
}
beforeEach(() => {
  mockSyntheticEntryPools();
  reset(); resetRegistry(); loadDefaultSkills(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset(); useHydrationStore.getState().setStatus('idle');
  resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks();
});
it('uses a real first kill before the first native Poison Explosion and pays ordinary MP', () => {
  arrange(); start();
  const { engineInput, recording } = published().binding, events = recording.events;
  const plain = runBattle(engineInput), recorded = runBattleRecorded(engineInput);
  expect(plain).toEqual(recorded.result); expect(recorded.events).toEqual(events);
  expect(recording.outcome).toEqual({ winner: plain.winner, finalPlayerTeam: plain.playerTeam, finalEnemyTeam: plain.enemyTeam });
  expect(engineInput.enemyTeam.length).toBeGreaterThan(1);
  expect(engineInput.enemyTeam.every(enemy => enemy.life > 0)).toBe(true);
  const deaths = events.filter(e => e.kind === 'death' && engineInput.enemyTeam.some(u => u.id === e.target));
  expect(deaths).toHaveLength(engineInput.enemyTeam.length);
  expect(engineInput.poisonExplosion).toEqual([{ sourceHeroId: player().id, rank: 1 }]);
  const cast = required(events.find(e => e.kind === 'action' && e.actor === player().id && e.skillId === PE));
  const castIndex = events.indexOf(cast), firstDeath = required(deaths[0]);
  if (firstDeath.kind !== 'death') throw new Error('Missing first native death');
  expect(events.indexOf(firstDeath)).toBeLessThan(castIndex);
  expect(deaths.filter(e => events.indexOf(e) < castIndex).length).toBeLessThan(engineInput.enemyTeam.length);
  expect(events.filter(e => e.kind === 'action' && e.actor === player().id)[0])
    .toMatchObject({ skillId: DAGGER });
  expect(events.find(e => e.kind === 'message' && e.messageKey === 'combat:corpses.available'))
    .toMatchObject({ params: { count: 1 } });
  const priorMana = required(events.slice(0, castIndex).filter(e => e.kind === 'mana' && e.target === player().id).at(-1));
  if (priorMana.kind !== 'mana') throw new Error('Missing preceding native mana event');
  const paid = required(events.slice(castIndex + 1).find(e => e.kind === 'mana' && e.target === player().id));
  expect(paid).toMatchObject({ reason: 'cast', mana: priorMana.mana - 15, simClockMs: cast.simClockMs });
  expect(events.slice(castIndex + 1).find(e => e.kind === 'message'))
    .toMatchObject({ messageKey: 'combat:corpses.consumedPoison', params: { count: 0 } });
  expect(events.some(e => e.kind === 'status' && e.statusId === 'poison' && e.simClockMs === cast.simClockMs)).toBe(true);
  // Dagger's damaging Poison spreads on the first kill at6000ms. Its1HP/s
  // settles1HP at7500ms before PE's dodged direct hit and further death spread.
  const recipient = required(events.find(e => e.kind === 'damage' && e.source === player().id &&
    e.simClockMs === cast.simClockMs && e.dodged));
  if (recipient.kind !== 'damage') throw new Error('Missing native spread recipient');
  expect(events.slice(0, castIndex).find(e => e.kind === 'status-state' && e.target === recipient.target &&
    e.statuses.some(status => status.id === 'poison' && (status.dotPerStack ?? 0) > 0)))
    .toMatchObject({ simClockMs: 6000, statuses: [{ id: 'poison', stacks: 1,
      sourceId: firstDeath.target, dotPerStack: 1, appliedAtMs: 6000, expiresAtMs: 11000 }] });
  expect(events.slice(0, castIndex).filter(e => e.kind === 'dot' && e.target === recipient.target))
    .toEqual([expect.objectContaining({ simClockMs: 7500, amount: 1 })]);
  expect(events.filter(e => e.kind === 'dot' && e.target === recipient.target)
    .map(e => e.kind === 'dot' ? [e.simClockMs, e.amount] : null)).toEqual([[7500, 1], [7700, 2], [9000, 13]]);
  expect(recording.outcome.finalEnemyTeam.map(u => u.id)).toEqual(engineInput.enemyTeam.map(u => u.id));
  expect(recording.outcome.finalEnemyTeam.every(u => u.life === 0)).toBe(true);
  expect(events.some(e => e.kind === 'damage' && e.source === player().id &&
    e.damageType === 'poison' && e.amount > 0 && e.simClockMs === cast.simClockMs)).toBe(true);
});

it('preserves the recording on allocation refresh, then recomposes rank and resets leftover corpses in the next wave', () => {
  arrange(); start();
  const original = published().binding, before = structuredClone(evidence(original));
  expect(Object.isFrozen(original.engineInput.poisonExplosion)).toBe(true);
  expect(Object.isFrozen(original.engineInput.poisonExplosion?.[0])).toBe(true);
  const available = original.recording.events.filter(e => e.kind === 'message' &&
    e.messageKey === 'combat:corpses.available').length;
  const consumed = original.recording.events.filter(e => e.kind === 'message' &&
    e.messageKey === 'combat:corpses.consumedPoison').length;
  expect(available - consumed).toBeGreaterThan(0);
  expect(usePlayerStore.getState().allocateSkillPoint(PE)).toBe('ok');
  refreshActivePlayerCombatConfig();
  const unchanged = published().binding;
  expect(unchanged.engineInput).toBe(original.engineInput);
  expect(unchanged.recording).toBe(original.recording);
  expect(unchanged.publication).toBe(original.publication);
  expect(evidence(original)).toEqual(before);
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  const next = published().binding, events = next.recording.events;
  expect(next.engineInput.poisonExplosion).toEqual([{ sourceHeroId: player().id, rank: 2 }]);
  expect(pools(required(next.engineInput.playerTeam[0])))
    .toEqual(pools(required(original.recording.outcome.finalPlayerTeam[0])));
  expect(next.engineInput.enemyTeam.every(e => e.life > 0)).toBe(true);
  const firstDeath = events.findIndex(e => e.kind === 'death');
  const firstCast = events.findIndex(e => e.kind === 'action' && e.skillId === PE);
  expect(firstDeath).toBeGreaterThan(-1); expect(firstCast).toBeGreaterThan(firstDeath);
  expect(events.filter(e => e.kind === 'action' && e.actor === player().id)[0]).toMatchObject({ skillId: DAGGER });
  expect(events.find(e => e.kind === 'message' && e.messageKey === 'combat:corpses.available'))
    .toMatchObject({ params: { count: 1 } });
  expect(evidence(original)).toEqual(before);
});

it('replays unlocked with current eligible rank and captured fractional resources twice without settling or drifting', () => {
  arrange();
  // Imported energy26 gives5.2MP/s; the real9s opening wave carries0.8MP.
  usePlayerStore.getState().setPlayer({ ...player(), coreStats: { ...player().coreStats, energy: 26 } });
  start(); drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  const original = published(), before = structuredClone(evidence(original.binding));
  const baseline = pools(required(original.binding.engineInput.playerTeam[0]));
  expect(Number(baseline[2])).toBeGreaterThan(0); expect(baseline[4]).not.toBe('0');
  expect(original.binding.publication.ironGolemReplayLocked).toBe(false);
  expect(usePlayerStore.getState().allocateSkillPoint(PE)).toBe('ok');
  const progress = structuredClone(persistent());
  let replay: ReturnType<typeof evidence> | undefined;
  for (let repeat = 0; repeat < 2; repeat++) {
    drain(); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    const current = published();
    expect(current.binding.engineInput.poisonExplosion).toEqual([{ sourceHeroId: player().id, rank: 2 }]);
    expect(pools(required(current.binding.engineInput.playerTeam[0]))).toEqual(baseline);
    expect(current.binding.recording.events.some(e => e.kind === 'action' && e.skillId === PE)).toBe(true);
    expect(current.installation?.settlement.identity).toBe(original.installation?.settlement.identity);
    expect(current.installation?.settlement.progress.phase).toBe('unsettled');
    expect(persistent()).toEqual(progress); expect(evidence(original.binding)).toEqual(before);
    if (replay) expect(evidence(current.binding)).toEqual(replay);
    replay = structuredClone(evidence(current.binding));
  }
  // Synthetic respec of the current Player, leaving PE slotted. The old carried
  // unit and recording still contain valid allocation; neither grants authority.
  usePlayerStore.setState({ player: { ...player(), skillLevels: { [PE]: 2 } } });
  const revokedProgress = structuredClone(persistent());
  const lastEligible = published().binding;
  refreshActivePlayerCombatConfig();
  expect(published().binding.engineInput).toBe(lastEligible.engineInput);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  const revoked = published();
  expect(revoked.binding.engineInput.playerTeam[0]?.skillOrder).toContain(PE);
  expect(revoked.binding.engineInput).not.toHaveProperty('poisonExplosion');
  expect(pools(required(revoked.binding.engineInput.playerTeam[0]))).toEqual(baseline);
  expect(revoked.binding.recording.events.some(e => e.kind === 'death')).toBe(true);
  expect(revoked.binding.recording.events.filter(e => e.kind === 'action' && e.skillId === PE)).toEqual([]);
  expect(revoked.installation?.settlement.identity).toBe(original.installation?.settlement.identity);
  expect(persistent()).toEqual(revokedProgress);
  usePlayerStore.setState({ player: { ...player(), skillLevels: { [PE]: 2, [DAGGER]: 1 } } });
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(evidence(published().binding)).toEqual(replay);
  expect(persistent()).toEqual(progress);
});

const invalidPlayers: { name: string; fields: Partial<Player> }[] = [
  { name: 'missing Dagger', fields: { skillLevels: { [PE]: 1 } } },
  { name: 'missing PE', fields: { skillLevels: { [DAGGER]: 1 } } },
  { name: 'over-cap PE', fields: { skillLevels: { [DAGGER]: 1, [PE]: 21 } } },
  { name: 'below unlock', fields: { level: 17 } },
  { name: 'over-cap Dagger', fields: { skillLevels: { [DAGGER]: 21, [PE]: 1 } } },
  { name: 'fractional PE', fields: { skillLevels: { [DAGGER]: 1, [PE]: 1.5 } } },
  { name: 'wrong class', fields: { class: 'sorceress' } }
];
it.each(invalidPlayers)('keeps slotted PE inactive for $name while ordinary combat still kills actual monsters', ({ fields }) => {
  arrange();
  usePlayerStore.getState().setPlayer({ ...player(), ...fields });
  start();
  const { engineInput, recording } = published().binding;
  expect(engineInput.playerTeam[0]?.skillOrder).toContain(PE);
  expect(engineInput).not.toHaveProperty('poisonExplosion');
  expect(recording.events.some(e => e.kind === 'death' && engineInput.enemyTeam.some(u => u.id === e.target))).toBe(true);
  expect(recording.events.filter(e => e.kind === 'action' && e.skillId === PE)).toEqual([]);
  expect(recording.events.filter(e => e.kind === 'message' && e.messageKey.startsWith('combat:corpses.'))).toEqual([]);
});

it.each([1, 21])('projects the maximum valid alias rank with canonical rank%s through native staging', canonicalRank => {
  arrange();
  usePlayerStore.getState().setPlayer({ ...player(), skillLevels: {
    [PE]: canonicalRank, 'skills-necromancer-poison-explosion': 2, 'skills-necromancer-poison-dagger': 1
  }, comboOrder: ['skills-necromancer-poison-explosion', 'skills-necromancer-poison-dagger'] });
  start();
  const { engineInput, recording } = published().binding;
  expect(engineInput.poisonExplosion).toEqual([{ sourceHeroId: player().id, rank: 2 }]);
  expect(engineInput.playerTeam[0]?.skillOrder).toContain('skills-necromancer-poison-explosion');
  expect(recording.events.some(e => e.kind === 'action' && e.skillId === PE)).toBe(true);
  expect(recording.events.some(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedPoison')).toBe(true);
});

it('requires a combo slot as well as eligible allocation to cast PE', () => {
  arrange(); usePlayerStore.getState().setComboOrder([DAGGER]); start();
  const { engineInput, recording } = published().binding;
  expect(engineInput.poisonExplosion).toEqual([{ sourceHeroId: player().id, rank: 1 }]);
  expect(recording.events.some(e => e.kind === 'death')).toBe(true);
  expect(recording.events.filter(e => e.kind === 'action' && e.skillId === PE)).toEqual([]);
  expect(recording.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedPoison')).toEqual([]);
});

it('keeps independent CE and PE projections in the same native frozen input', () => {
  arrange(); const CE = 'necromancer.corpse_explosion';
  usePlayerStore.getState().setPlayer({ ...player(), skillLevels: { ...player().skillLevels,
    'necromancer.teeth': 1, [CE]: 3 }, comboOrder: [PE, CE, DAGGER] });
  start(); const { engineInput, recording } = published().binding;
  expect(engineInput.poisonExplosion).toEqual([{ sourceHeroId: player().id, rank: 1 }]);
  expect(engineInput.corpseExplosion).toEqual([{ sourceHeroId: player().id, rank: 3 }]);
  expect(engineInput.poisonExplosion).not.toBe(engineInput.corpseExplosion);
  expect(Object.isFrozen(engineInput.poisonExplosion)).toBe(true);
  expect(Object.isFrozen(engineInput.corpseExplosion)).toBe(true);
  expect(recording.events.some(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedPoison')).toBe(true);
});

it('rejects another current Player identity before replacing native authority or recording', () => {
  arrange(); start(); const original = published().binding, before = structuredClone(evidence(original));
  usePlayerStore.setState({ player: { ...player(), id: 'different-current-player' } });
  const progress = structuredClone(persistent());
  expect(() => { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); }).toThrow('bindingMismatch');
  expect(published().binding).toBe(original);
  expect(evidence(original)).toEqual(before); expect(persistent()).toEqual(progress);
});

it('settles nonzero XP and loot for every slain enemy including consumed bodies exactly once', () => {
  arrange(); start();
  const original = published(), binding = original.binding, run = binding.candidateRun;
  const slain = binding.recording.outcome.finalEnemyTeam;
  expect(slain.every(e => e.life === 0)).toBe(true);
  expect(binding.recording.events.some(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedPoison')).toBe(true);
  const xp = slain.reduce((sum, enemy) => sum + Math.max(5, Math.round(10 * enemy.level)), 0);
  expect(xp).toBeGreaterThan(0);
  // Pure per-kill roller is the independent settlement oracle: include the full
  // frozen enemy identity set, rather than filtering it by remaining corpses.
  const rng = createRng((run.seed ^ 0x9e3779b1 ^ binding.targetWaveIdx) >>> 0);
  const rolled = slain.map(enemy => rollKillRewards({ tier: enemy.tier, monsterLevel: enemy.level,
    treasureClassId: run.plan.waves[binding.targetWaveIdx]?.lootTable ?? run.plan.defaultLootTable,
    magicFind: player().derivedStats.magicFind, goldFind: player().derivedStats.goldFind,
    act: 1, difficulty: 'normal' }, loadAwardPools(), rng));
  const materials: Record<string, number> = {};
  for (const reward of rolled) {
    for (const [id, count] of Object.entries(reward.materials)) materials[id] = (materials[id] ?? 0) + count;
  }
  const expected = { items: rolled.flatMap(r => r.items), materials,
    runeShards: rolled.reduce((n, r) => n + r.runeShards, 0), runes: rolled.reduce((n, r) => n + r.runes, 0),
    gems: rolled.reduce((n, r) => n + r.gems, 0), wishstones: rolled.reduce((n, r) => n + r.wishstones, 0) };
  expect(expected.items.length).toBeGreaterThan(0); expect(expected.runeShards + expected.runes).toBeGreaterThan(0);
  const before = structuredClone(persistent());
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(player().experience).toBe(before.player.experience + xp);
  // Item instance IDs use an independent process counter. Compare the oracle's
  // rolled contents, then require exact actual IDs in inventory and on retries.
  const withoutIds = (items: readonly Item[]) => items.map(({ id, ...item }) => { void id; return item; });
  const actual = useCombatStore.getState().runRewards;
  expect({ ...actual, items: withoutIds(actual.items) }).toEqual({ ...expected, items: withoutIds(expected.items) });
  expect(new Set(actual.items.map(item => item.id)).size).toBe(actual.items.length);
  expect(actual.items.every(item => !before.backpack.some(old => old.id === item.id))).toBe(true);
  expect(useInventoryStore.getState().backpack).toEqual([...before.backpack, ...actual.items]);
  expect(useInventoryStore.getState().currencies['rune-shard'])
    .toBe((before.currencies['rune-shard'] ?? 0) + expected.runeShards);
  expect(useInventoryStore.getState().materials).toEqual(expected.materials);
  const after = structuredClone(persistent());
  const next = published();
  expect(next.installation?.settlement.identity).not.toBe(original.installation?.settlement.identity);
  expect(useCombatStore.getState().playbackComplete).toBe(false);
  expect(advanceWaveOrFinish()).toBe('idle'); expect(advanceWaveOrFinish()).toBe('idle');
  expect(persistent()).toEqual(after);
  expect(binding.recording.outcome.finalEnemyTeam).toEqual(slain);
});

it('reinstalls Iron-locked PE input and recording twice without another item, corpse or resource debit', () => {
  arrange();
  const IRON = 'necromancer.iron_golem';
  // Iron qualification uses a separate imported, unearned L30 fixture.
  usePlayerStore.getState().setPlayer({ ...player(), level: 30, skillLevels: { ...player().skillLevels,
    'necromancer.clay_golem': 1, 'necromancer.blood_golem': 1, [IRON]: 1 },
  comboOrder: [IRON, PE, DAGGER] });
  const sacrifice: Item = { id: 'fixture-corpse-sacrifice', baseId: 'items/base/wp1h-short-sword', socketCapacity: 0,
    rarity: 'normal', level: 1, identified: true, equipped: false, affixes: [] };
  const reserve: Item = { ...sacrifice, id: 'fixture-corpse-reserve' };
  useInventoryStore.getState().addItem(sacrifice); useInventoryStore.getState().addItem(reserve);
  expect(armIronGolemSelection(player().id, sacrifice.id, true)).not.toBeNull();
  start(); const original = published(), binding = original.binding, before = structuredClone(evidence(binding));
  expect(binding.publication.ironGolemReplayLocked).toBe(true);
  expect(binding.attestation).toMatchObject({ sourceItemId: sacrifice.id, paidMp: 35 });
  expect(binding.engineInput.poisonExplosion).toEqual([{ sourceHeroId: player().id, rank: 1 }]);
  expect(binding.recording.events.some(e => e.kind === 'action' && e.skillId === PE)).toBe(true);
  expect(useInventoryStore.getState().backpack.some(item => item.id === sacrifice.id)).toBe(false);
  expect(usePlayerStore.getState().allocateSkillPoint(PE)).toBe('ok');
  usePlayerStore.getState().setComboOrder([DAGGER]);
  const rearmed = armIronGolemSelection(player().id, reserve.id, true);
  expect(rearmed).not.toBeNull(); const progress = structuredClone(persistent());
  for (let repeat = 0; repeat < 2; repeat++) {
    drain(); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    const current = published();
    expect(current.binding.engineInput).toBe(binding.engineInput);
    expect(current.binding.recording).toBe(binding.recording);
    expect(current.binding.publication).toBe(binding.publication);
    expect(current.binding.engineInput.poisonExplosion?.[0]?.rank).toBe(1);
    expect(current.binding.attestation).toBeNull(); expect(current.binding.debitIntent).toBeNull();
    expect(current.installation?.settlement.identity).toBe(original.installation?.settlement.identity);
    expect(current.installation?.settlement.progress.phase).toBe('unsettled');
    expect(pools(required(current.binding.engineInput.playerTeam[0]))).toEqual([1000, 100, 0, 0, '0']);
    expect(useIronGolemSelectionStore.getState().selection).toBe(rearmed);
    expect(persistent()).toEqual(progress); expect(evidence(binding)).toEqual(before);
  }
});

it('roundtrips allocation, combo and inventory through validated save import, then starts with no old corpse', async () => {
  arrange(); start();
  const original = published().binding;
  expect(original.recording.events.some(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedPoison')).toBe(true);
  const save = required(snapshotStores()), before = structuredClone(save);
  const json = JSON.stringify(toJsonSafe(save));
  function noTransient(value: unknown): void {
    if (typeof value !== 'object' || value === null) return;
    for (const key of ['poisonExplosion', 'corpseExplosion', 'corpses', 'corpsePool', 'corpseCount', 'availableCorpses']) {
      expect(value).not.toHaveProperty(key);
    }
    for (const child of Object.values(value)) noTransient(child);
  }
  noTransient(JSON.parse(json)); expect(save).not.toHaveProperty('combat');
  await importIntoStores(json);
  expect(hasActiveSubAreaRun()).toBe(false); expect(inspectRecordedWaves().currentPublished).toBeNull();
  expect(useCombatStore.getState().recordedEvents).toEqual([]); expect(useCombatStore.getState().outcome).toBeNull();
  expect(useCombatStore.getState().playerTeam).toEqual([]);
  expect(player()).toEqual(before.player); expect(snapshotStores()?.inventory).toEqual(before.inventory);
  expect(player().skillLevels).toEqual({ [DAGGER]: 1, [PE]: 1 }); expect(player().comboOrder).toEqual([PE, DAGGER]);
  noTransient(player()); start();
  const fresh = published().binding, events = fresh.recording.events;
  expect(fresh.engineInput.poisonExplosion).toEqual([{ sourceHeroId: player().id, rank: 1 }]);
  expect(fresh.engineInput.enemyTeam.every(e => e.life > 0)).toBe(true);
  expect(events.filter(e => e.kind === 'action' && e.actor === player().id)[0]).toMatchObject({ skillId: DAGGER });
  const firstDeath = events.findIndex(e => e.kind === 'death');
  expect(firstDeath).toBeGreaterThan(-1);
  expect(events.findIndex(e => e.kind === 'action' && e.skillId === PE)).toBeGreaterThan(firstDeath);
  expect(events.find(e => e.kind === 'message' && e.messageKey === 'combat:corpses.available'))
    .toMatchObject({ params: { count: 1 } });
});

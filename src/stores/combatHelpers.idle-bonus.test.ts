import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHydrationStore } from './hydrationStore';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadAwardPools } from '@/data/loaders/loot';
import * as lootData from '@/data/loaders/loot';
import * as combatEngine from '@/engine/combat/combat';
import { rollBatchRewards, rollKillRewards, type KillRewardInput } from '@/engine/loot/award';
import { effectiveMagicFind, rollDrops, type TreasureClass } from '@/engine/loot/drop-roller';
import { __resetRollItemSeqForTests } from '@/engine/loot/rollItem';
import { createRng } from '@/engine/rng';
import { xpForKill, xpRequired } from '@/engine/progression/xp';
import type { Item } from '@/engine/types/items';
import type { Mercenary } from '@/engine/types/entities';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore, mercXpForLevel } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { resolveSubArea } from './subAreaResolver';

const AREA = 'areas/act1-blood-moor';
const ANCHOR = 1_792_454_400_000;
const SEED = 7;
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing idle reward fixture value');
  return value;
}

function reset(): void {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  __resetRollItemSeqForTests();
}

function start(attack = 100_000): void {
  const fresh = createMockPlayer('Idle rewards fixture', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, comboOrder: [] });
  // Deliberate imported/high-power integration fixture, not earned-progression evidence.
  const gear: Item = {
    id: 'idle-reward-helm', baseId: 'items/base/helm-cap', rarity: 'magic',
    level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'reward-fixture', values: new Map([
      ['statMods.magicFind', 300], ['statMods.goldFind', 19],
      ['statMods.attack', attack], ['statMods.defense', 100_000], ['statMods.life', 1_000_000]
    ]) }]
  };
  useInventoryStore.getState().addItem(gear);
  expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
  const player = required(usePlayerStore.getState().player);
  usePlayerStore.getState().setPlayer({ ...player, derivedStats: {
    ...player.derivedStats, attack, life: player.derivedStats.lifeMax
  } });
  const merc: Mercenary = {
    ...fresh, id: 'idle-reward-merc', type: 'mercenary', archetype: 'back',
    rarity: 'R', equipment: [], comboOrder: []
  };
  useMercStore.getState().addMerc(merc);
  useMercStore.getState().setFieldedMerc(merc.id);
  useMapStore.getState().setCurrentLocation(1, AREA);
  expect(startSubAreaRun({ runSeed: SEED, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(1);
}

function drain(): void {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
}

function totalPlayerXP(): number {
  const player = required(usePlayerStore.getState().player);
  let total = player.experience;
  for (let level = 1; level < player.level; level++) total += xpRequired(level);
  return total;
}

function totalMercXP(): number {
  const merc = required(useMercStore.getState().getFieldedMerc());
  let total = useMercStore.getState().getMercProgress(merc.id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}

function rewardsSnapshot() {
  return structuredClone({ player: usePlayerStore.getState().player,
    mercs: useMercStore.getState().ownedMercs, progress: useMercStore.getState().mercProgress,
    backpack: useInventoryStore.getState().backpack, currencies: useInventoryStore.getState().currencies,
    rewards: useCombatStore.getState().runRewards });
}

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(ANCHOR);
  reset();
  useHydrationStore.getState().setStatus('ready');
  useMetaStore.getState().updateIdleState({
    lastOnline: ANCHOR, activeMultiplier: 1.5, multiplierSecondsRemaining: 1000
  });
});
afterEach(() => { vi.restoreAllMocks(); reset(); useHydrationStore.getState().setStatus('idle'); });

describe('production award-time idle XP/MF bonus (BUG-025)', () => {
  it('samples one decaying multiplier per won wave, floors XP per kill and shares boosted XP with mercs', () => {
    const tcId = required(resolveSubArea(1, AREA)).lootTable;
    // Real shipped tables: substituting an unforced fixture hid BUG678.
    start();
    const raw = useMetaStore.getState().idleState;
    const rawCopy = structuredClone(raw);
    const anchor = useMetaStore.getState().idleBonusAnchor;
    const read = vi.spyOn(useMetaStore.getState(), 'readIdleBonus');
    const expectedRarities: string[] = [];
    const baselineRarities: string[] = [];
    for (let wave = 0; wave < 2; wave++) {
      const now = ANCHOR + 70_000 + wave * 200_000;
      const multiplier = wave === 0 ? 1.465 : 1.365;
      const outcome = required(useCombatStore.getState().outcome);
      expect(outcome.winner).toBe('player');
      const slain = outcome.finalEnemyTeam.filter((enemy) => enemy.life <= 0 && enemy.kind !== 'summon');
      const expectedXP = slain.reduce((sum, enemy) => sum + Math.floor(xpForKill(enemy.level) * multiplier), 0);
      expect(expectedXP).toBeLessThan(Math.floor(slain.reduce((sum, enemy) => sum + xpForKill(enemy.level), 0) * multiplier));
      const playerBefore = totalPlayerXP();
      const mercBefore = totalMercXP();
      const itemsBefore = useInventoryStore.getState().backpack.length;
      const expectedStart = expectedRarities.length;
      for (const bonus of [multiplier, 1]) {
        const rng = createRng((SEED ^ 0x9e3779b1 ^ wave) >>> 0);
        for (const enemy of slain) {
          const input = { tier: enemy.tier, monsterLevel: enemy.level,
            treasureClassId: tcId, magicFind: 300, goldFind: 19, act: 1 as const,
            magicFindMultiplier: bonus };
          const rewards = rollKillRewards(input, loadAwardPools(), rng, rng.fork(`wishstone:${enemy.id}`));
          (bonus === 1 ? baselineRarities : expectedRarities).push(...rewards.items.map((item) => item.rarity));
        }
      }
      drain();
      vi.mocked(Date.now).mockReturnValue(now);
      // Advance the wall clock during XP publication: loot must retain the already sampled value.
      const unsubscribe = usePlayerStore.subscribe(() => {
        vi.mocked(Date.now).mockReturnValue(ANCHOR + 2_000_000);
      });
      try { expect(advanceWaveOrFinish()).toBe('next-wave'); }
      finally { unsubscribe(); }
      expect(totalPlayerXP() - playerBefore).toBe(expectedXP);
      expect(totalMercXP() - mercBefore).toBe(Math.floor(expectedXP * 0.75));
      expect(read).toHaveBeenCalledTimes(wave + 1);
      expect(read).toHaveBeenNthCalledWith(wave + 1, now);
      expect(usePlayerStore.getState().player?.derivedStats).toMatchObject({ magicFind: 300, goldFind: 19 });
      expect(useInventoryStore.getState().backpack.slice(itemsBefore).map((item) => item.rarity))
        .toEqual(expectedRarities.slice(expectedStart));
      expect(useMetaStore.getState().idleState).toBe(raw);
      expect(raw).toEqual(rawCopy);
      expect(useMetaStore.getState().idleBonusAnchor).toBe(anchor);
    }
    expect(expectedRarities).not.toEqual(baselineRarities);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('preserves explicit forced-rarity loot and currencies while XP receives the bonus', () => {
    // An intentional fixed-rarity control, distinct from ordinary random loot.
    const realPools = loadAwardPools();
    const tcId = required(resolveSubArea(1, AREA)).lootTable;
    const tc = required(realPools.treasureClasses.get(tcId));
    const fixed: TreasureClass = { ...tc, picks: tc.picks.map(pick =>
      pick.type === 'item' ? { ...pick, rarity: 'normal' as const } : pick) };
    vi.spyOn(lootData, 'loadAwardPools').mockReturnValue({ ...realPools,
      treasureClasses: new Map([[tcId, fixed]]) });
    start(); drain();
    const slain = required(useCombatStore.getState().outcome).finalEnemyTeam.filter((enemy) => enemy.life <= 0);
    __resetRollItemSeqForTests();
    const baseline = rollBatchRewards(slain.map((enemy) => ({ tier: enemy.tier,
      monsterLevel: enemy.level, treasureClassId: tcId, magicFind: 300, goldFind: 19, act: 1 })),
    loadAwardPools(), createRng((SEED ^ 0x9e3779b1) >>> 0));
    expect(baseline.items.length).toBeGreaterThan(0);
    expect(baseline.items.every((item) => item.rarity === 'normal')).toBe(true);
    __resetRollItemSeqForTests();
    const before = totalPlayerXP();
    advanceWaveOrFinish();
    expect(useCombatStore.getState().runRewards).toEqual(baseline);
    expect(totalPlayerXP() - before).toBe(slain.reduce((sum, enemy) => sum + Math.floor(xpForKill(enemy.level) * 1.5), 0));
  });

  it('uses multiplier one after expiry without changing the stored tuple', () => {
    start(); drain();
    const raw = useMetaStore.getState().idleState;
    const anchor = useMetaStore.getState().idleBonusAnchor;
    const before = totalPlayerXP();
    const xp = required(useCombatStore.getState().outcome).finalEnemyTeam
      .filter((enemy) => enemy.life <= 0 && enemy.kind !== 'summon')
      .reduce((sum, enemy) => sum + xpForKill(enemy.level), 0);
    vi.mocked(Date.now).mockReturnValue(ANCHOR + 1_000_000);
    const read = vi.spyOn(useMetaStore.getState(), 'readIdleBonus');
    advanceWaveOrFinish();
    expect(read).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledWith(ANCHOR + 1_000_000);
    expect(totalPlayerXP() - before).toBe(xp);
    expect(useMetaStore.getState().idleState).toBe(raw);
    expect(useMetaStore.getState().idleBonusAnchor).toBe(anchor);
  });

  it('does not sample or award before playback or on a duplicate finalization', () => {
    start();
    const read = vi.spyOn(useMetaStore.getState(), 'readIdleBonus');
    const before = rewardsSnapshot();
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(rewardsSnapshot()).toEqual(before);
    expect(read).not.toHaveBeenCalled();
    drain(); advanceWaveOrFinish();
    const after = rewardsSnapshot();
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(rewardsSnapshot()).toEqual(after);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it.each(['draw', 'loss', 'dead-original-hero', 'no-slain'] as const)(
    'does not sample or award for %s', (failure) => {
      const original = combatEngine.runBattleRecorded;
      vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementationOnce(input => {
        const actual = original(input);
        const heroId = required(input.playerTeam.find(unit => unit.kind === 'hero')).id;
        return { ...actual, result: { ...actual.result,
          winner: failure === 'draw' ? null : failure === 'loss' ? 'enemy' : 'player',
          playerTeam: actual.result.playerTeam.map(unit => ({ ...unit,
            life: failure === 'dead-original-hero' && unit.id === heroId ? 0 : unit.life })),
          enemyTeam: failure === 'no-slain'
            ? actual.result.enemyTeam.map(unit => ({ ...unit, kind: 'summon' as const }))
            : actual.result.enemyTeam
        } };
      });
      start(); drain();
      const read = vi.spyOn(useMetaStore.getState(), 'readIdleBonus');
      const before = rewardsSnapshot();
      expect(advanceWaveOrFinish()).toBe(failure === 'no-slain' ? 'next-wave' : 'defeat');
      expect(rewardsSnapshot()).toEqual(before);
      expect(read).not.toHaveBeenCalled();
    }
  );
});

// Independent weight boundary: raw MF300 gives eff327; 1.5× gives490.5, with no outer floor.
function whiteBoundary(eff: number, rareElite = false): number {
  const white = 1000 * (1 - eff / 1200);
  const total = white + 300 * (1 + eff / 600) + 80 * (1 + eff / 400) * (rareElite ? 4 : 1)
    + 8 * (1 + eff / 200) * (rareElite ? 6 : 1)
    + 4 * (1 + eff / 180) * (rareElite ? 12 : 1);
  return white / total;
}

const tc: TreasureClass = { id: 'bonus-boundary', numPicks: 1, noDropChance: 0,
  picks: [{ baseId: 'bonus-base', weight: 1, qlvlMin: 1, qlvlMax: 99 }] };
const pools = { bases: new Map([['bonus-base', { id: 'bonus-base', name: 'Bonus base',
  type: 'armor' as const, slot: 'head' as const, reqLevel: 1, maxSockets: 0, canHaveAffixes: false }]]),
  affixes: [], treasureClasses: new Map([[tc.id, tc]]) };
const kill: KillRewardInput = { tier: 'trash', monsterLevel: 5, treasureClassId: tc.id,
  magicFind: 300, goldFind: 19, act: 1 };

function boundaryRng(roll: number) {
  const rng = createRng(1);
  const next = vi.spyOn(rng, 'next').mockReturnValueOnce(0.5).mockReturnValueOnce(roll);
  return { rng, next };
}

describe('effective MF multiplier boundaries', () => {
  it('keeps fractional effective MF after scaling, rather than flooring or scaling raw MF', () => {
    expect(effectiveMagicFind(300)).toBe(327);
    const roll = (whiteBoundary(490.5) + whiteBoundary(490)) / 2;
    const { rng, next } = boundaryRng(roll);
    const context = { tc, tier: 'trash' as const, monsterLevel: 5,
      magicFind: 300, magicFindMultiplier: 1.5 };
    expect(rollDrops(context, rng)).toMatchObject([{ rarity: 'magic' }]);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it.each(['unboosted', 'bonus-after-curve'] as const)('adds rare-elite MF50 before the curve (%s control)', (control) => {
    const correct = effectiveMagicFind(350) * 1.5;
    const wrong = control === 'unboosted' ? effectiveMagicFind(350) : effectiveMagicFind(300) * 1.5 + 50;
    const { rng } = boundaryRng((whiteBoundary(correct, true) + whiteBoundary(wrong, true)) / 2);
    const input = { ...kill, tier: 'rare-elite' as const, magicFindMultiplier: 1.5 };
    expect(rollKillRewards(input, pools, rng).items[0]?.rarity).toBe(control === 'unboosted' ? 'magic' : 'normal');
  });

  it('preserves exact rewards and following RNG state for omitted versus explicit one', () => {
    const a = createRng(42); const b = createRng(42);
    __resetRollItemSeqForTests();
    const original = rollKillRewards(kill, pools, a);
    expect(original).toEqual({
      items: [{ id: 'it-6otyo-1', baseId: 'bonus-base', rarity: 'magic', level: 5, ilvl: 5,
        baseRolls: {}, affixes: [], generatedName: {}, identified: true, equipped: false, socketCapacity: 0 }],
      runeShards: 25, wishstones: 0, runes: 0, gems: 0, materials: {}
    });
    __resetRollItemSeqForTests();
    const input = { ...kill, magicFindMultiplier: 1 };
    expect(rollKillRewards(input, pools, b)).toEqual(original);
    expect(a.next()).toBe(0.6247446539346129);
    expect(b.next()).toBe(0.6247446539346129);
  });

  it.each(['forced', 'rune', 'gem', 'wishstone', 'gold', 'no-drop', 'missing'] as const)(
    'keeps %s rewards, GF/materials/pick count and RNG state unchanged', (path) => {
      const entry: TreasureClass['picks'][number] = path === 'forced' ? { ...required(tc.picks[0]), rarity: 'magic' as const }
        : { type: path === 'wishstone' ? 'currency' : path === 'gold' ? 'gold' : path === 'gem' ? 'gem' : 'rune',
          itemId: path === 'wishstone' ? 'currency/wishstone' : path === 'gem' ? 'gems/ruby/chipped' : 'runes/tal',
          weight: 1, qlvlMin: 1, qlvlMax: 99, quantityMin: 2, quantityMax: 4 };
      const selectedTc = { ...tc, numPicks: 5, noDropChance: path === 'no-drop' ? 1 : 0.4,
        picks: [entry] };
      const selectedPools = { ...pools, treasureClasses: path === 'missing'
        ? new Map<string, TreasureClass>() : new Map([[tc.id, selectedTc]]) };
      const a = createRng(2024); const b = createRng(2024);
      __resetRollItemSeqForTests();
      const baseline = rollKillRewards({ ...kill, tier: 'boss' }, selectedPools, a);
      __resetRollItemSeqForTests();
      const boosted = { ...kill, tier: 'boss' as const, magicFindMultiplier: 1.5 };
      expect(rollKillRewards(boosted, selectedPools, b)).toEqual(baseline);
      expect(b.next()).toBe(a.next());
    }
  );
});

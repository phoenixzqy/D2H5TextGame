/** Unearned fixture: real planner/engine and native event playback, no injected events. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { RecordedBattleEvent } from '@/engine/combat/combat';
import i18n from '@/i18n';
import type { Item } from '@/engine/types/items';
import { deriveStats } from '@/engine/progression/stats';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, startSubAreaRun } from './combatHelpers';
import { inspectRecordedWaves, type RecordedWaveBinding } from './recordedWaveReceipt';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';
const AREA = 'areas/act1-blood-moor';
const HERO = 'mage-wave-hero';
const MAGE = 'necromancer.raise_skeletal_mage';
const WAIT = 'fixture.mage-wait', FINISH = 'fixture.mage-finisher';
function published() {
  const value = inspectRecordedWaves().currentPublished;
  if (!value) throw new Error('Missing real published wave');
  return value;
}
let originalLanguage: string;
beforeEach(() => {
  originalLanguage = i18n.language;
  abortSubAreaRun();
  for (const store of [useCombatStore, usePlayerStore, useInventoryStore, useMercStore,
    useMapStore, useMetaStore, useFormationStore]) store.getState().reset();
  resetRegistry(); loadDefaultSkills(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
  registerSkill({ id: WAIT, archetype: 'fixture', target: 'self', isBuff: false,
    cooldown: 4, manaCost: 0, minLevel: 1,
    effects: [{ kind: 'buff', id: 'fixture.mage-wait', duration: -1 }] });
  registerSkill({ id: FINISH, archetype: 'fixture', target: 'all-enemies', cooldown: 1,
    manaCost: 0, minLevel: 1,
    effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
  const coreStats = { strength: 15, dexterity: 25, vitality: 20, energy: 21 };
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Unearned Mage wave', 'necromancer'),
    id: HERO, level: 30, coreStats, derivedStats: deriveStats(coreStats, 30),
    skillLevels: { [MAGE]: 6, 'necromancer.raise_skeleton': 1, 'necromancer.skeleton_mastery': 20 },
    comboOrder: [MAGE, WAIT, FINISH] });
  const cap: Item = { id: 'fixture-mage-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
    level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'fixture-mage-survival', values: new Map([
      ['statMods.life', 1000000], ['statMods.defense', 1000000], ['statMods.mana', 1000],
      ['statMods.attackSpeed', -63], ['statMods.attack', -79], ['statMods.critChance', -0.05]
    ]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  const equipped = usePlayerStore.getState().player;
  if (!equipped) throw new Error('Missing equipped hero');
  usePlayerStore.getState().setPlayer({ ...equipped, derivedStats: { ...equipped.derivedStats,
    life: equipped.derivedStats.lifeMax, mana: 100 } });
});
afterEach(async () => {
  vi.restoreAllMocks(); abortSubAreaRun();
  for (const store of [useCombatStore, usePlayerStore, useInventoryStore, useMercStore,
    useMapStore, useMetaStore, useFormationStore]) store.getState().reset();
  useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills();
  await i18n.changeLanguage(originalLanguage);
});

function start() {
  const run = startSubAreaRun({ act: 1, subAreaId: AREA, mode: 'manual', runSeed: 7, challengeOrdinal: 0 });
  expect(run?.totalWaves).toBeGreaterThan(1);
  return published();
}
function mageSummons(binding: RecordedWaveBinding) {
  return binding.recording.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'summon' }> =>
    e.kind === 'summon');
}
function durable() {
  const inventory = useInventoryStore.getState();
  return { player: usePlayerStore.getState().player,
    backpack: inventory.backpack, stash: inventory.stash, equipped: inventory.equipped,
    currencies: inventory.currencies, rewards: useCombatStore.getState().runRewards,
    cleared: useMapStore.getState().clearedSubAreas, quests: useMapStore.getState().questProgress,
    gacha: useMetaStore.getState().gachaState,
    playerPosition: useFormationStore.getState().playerPosition,
    summonPositions: useFormationStore.getState().summonPositions };
}
const COPY = {
  en: { mage: 'Skeletal Mage', targets: ['Fallen B', 'Fallen A', 'Quill Rat A', 'Fallen C'],
    hits: ['Skeletal Mage attacks Fallen B for 50 fire damage.',
      'Skeletal Mage attacks Fallen A for 61 cold damage.',
      'Skeletal Mage attacks Quill Rat A for 61 lightning damage.',
      'Skeletal Mage attacks Fallen C for 50 poison damage.'],
    coldTarget: 'Fallen D', coldHit: 'Skeletal Mage attacks Fallen D for 61 cold damage.',
    dodgeTarget: 'Fallen E', dodge: "Fallen E dodges Skeletal Mage's attack!" },
  'zh-CN': { mage: '骷髅法师', targets: ['堕落者 B', '堕落者 A', '尖刺鼠 A', '堕落者 C'],
    hits: ['骷髅法师 普攻 堕落者 B，造成 50 点火焰伤害。',
      '骷髅法师 普攻 堕落者 A，造成 61 点冰冷伤害。',
      '骷髅法师 普攻 尖刺鼠 A，造成 61 点闪电伤害。',
      '骷髅法师 普攻 堕落者 C，造成 50 点毒素伤害。'],
    coldTarget: '堕落者 D', coldHit: '骷髅法师 普攻 堕落者 D，造成 61 点冰冷伤害。',
    dodgeTarget: '堕落者 E', dodge: '堕落者 E 闪避了 骷髅法师 的攻击！' }
} as const;

it.each(['zh-CN', 'en'] as const)('transports real Mage spawn, MP, hit and dodge events into live teams and %s logs', async locale => {
  await i18n.changeLanguage(locale);
  const copy = COPY[locale], before = structuredClone(durable());
  const { binding } = start();
  const baseline = structuredClone({ input: binding.engineInput, recording: binding.recording });
  const events = binding.recording.events, summons = mageSummons(binding);
  expect(summons).toHaveLength(4);
  const bySource = new Map(summons.map((s, index) => [s.unit.id, index]));
  const initial = useCombatStore.getState();
  expect(initial.playerTeam).toHaveLength(1);
  expect(initial.playerTeam[0]).toMatchObject({ id: HERO, mana: 100 });
  // Publication adds display grid positions; all engine-input fields remain equal.
  expect(initial.enemyTeam).toMatchObject(binding.engineInput.enemyTeam);
  expect(initial.log).toEqual([]); expect(initial.eventCursor).toBe(0);
  expect(initial.playbackComplete).toBe(false);
  expect(events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
    .toEqual([expect.objectContaining({ target: HERO, mana: 78, simClockMs: 0 })]);
  expect(events.find(e => e.kind === 'action' && e.skillId === FINISH)?.simClockMs).toBe(4000);
  let spawned = 0, paid = 0, secondCold = 0;
  const hitElements: string[] = [], dodgeElements: string[] = [];
  for (const [idx, event] of events.entries()) {
    if (event.simClockMs > 3880) break; // Before FINISH/end and the final-outcome snap.
    const previous = useCombatStore.getState();
    expect(previous.eventCursor).toBe(idx);
    if (event.kind === 'summon') {
      expect(previous.playerTeam.some(u => u.id === event.unit.id)).toBe(false);
    }
    const targetBefore = event.kind === 'damage'
      ? previous.enemyTeam.find(u => u.id === event.target) : undefined;
    useCombatStore.getState().advanceEvent();
    const next = useCombatStore.getState();
    expect(next.eventCursor).toBe(idx + 1); expect(next.playbackComplete).toBe(false);
    if (event.kind === 'summon') {
      spawned++;
      expect(next.playerTeam.filter(u => u.kind === 'summon')).toHaveLength(spawned);
      expect(next.playerTeam.filter(u => u.id === event.unit.id)).toEqual([event.unit]);
      expect(next.playerTeam.find(u => u.id === event.unit.id)?.gridPosition).toEqual(event.unit.gridPosition);
      expect(next.unitNameMap.get(event.unit.id)).toBe(copy.mage);
    }
    if (event.kind === 'mana' && event.reason === 'cast') {
      paid++;
      expect(previous.playerTeam.find(u => u.id === HERO)?.mana).toBe(100);
      expect(next.playerTeam.find(u => u.id === HERO)?.mana).toBe(78);
      expect(next.log).toBe(previous.log); // Mana playback changes MP without a visible log.
    }
    if (event.kind !== 'damage' || !bySource.has(event.source)) continue;
    const index = bySource.get(event.source);
    if (index === undefined || !targetBefore) throw new Error('Missing real Mage/target');
    const targetAfter = next.enemyTeam.find(u => u.id === event.target);
    const entry = next.log.at(-1);
    expect(next.log).toHaveLength(previous.log.length + 1);
    expect(entry).toMatchObject({ id: `${String(idx)}-damage`, timestamp: 1792454400000,
      type: 'damage', actorId: event.source, actorName: copy.mage,
      targetId: event.target, targetName: previous.unitNameMap.get(event.target), value: event.amount });
    if (event.simClockMs === 1940) {
      expect(event).toMatchObject({ damageType: ['fire', 'cold', 'lightning', 'poison'][index],
        amount: [50, 61, 61, 50][index], crit: false, dodged: false });
      expect(targetBefore.life).toBe([35, 46, 34, 35][index]);
      expect(previous.unitNameMap.get(event.target)).toBe(copy.targets[index]);
      expect(targetAfter?.life).toBe(0); // Assert immediately after damage, before death.
      expect(events.slice(0, idx).some(e => e.kind === 'death' && e.target === event.target)).toBe(false);
      expect(entry?.message).toBe(copy.hits[index]);
      hitElements.push(event.damageType);
    } else if (event.damageType === 'cold') {
      secondCold++;
      expect(event).toMatchObject({ simClockMs: 3880, damageType: 'cold', amount: 61,
        dodged: false, crit: false });
      expect(targetBefore.life).toBe(41);
      expect(previous.unitNameMap.get(event.target)).toBe(copy.coldTarget);
      expect(targetAfter?.life).toBe(0);
      expect(events.slice(0, idx).some(e => e.kind === 'death' && e.target === event.target)).toBe(false);
      expect(entry?.message).toBe(copy.coldHit);
    } else {
      expect(event.simClockMs).toBe(3880);
      expect(event).toMatchObject({ dodged: true, amount: 0 });
      expect(previous.unitNameMap.get(event.target)).toBe(copy.dodgeTarget);
      expect(targetBefore.life).toBeGreaterThan(0);
      expect(targetAfter?.life).toBe(targetBefore.life);
      expect(entry?.message).toBe(copy.dodge);
      dodgeElements.push(event.damageType);
    }
  }
  expect(spawned).toBe(4); expect(paid).toBe(1); expect(secondCold).toBe(1);
  expect(hitElements).toHaveLength(4);
  expect([...hitElements].sort()).toEqual(['cold', 'fire', 'lightning', 'poison']);
  expect(dodgeElements).toHaveLength(3);
  expect([...dodgeElements].sort()).toEqual(['fire', 'lightning', 'poison']);
  const stopped = useCombatStore.getState();
  expect(events[stopped.eventCursor]?.simClockMs).toBe(4000);
  expect(stopped.playbackComplete).toBe(false);
  expect(stopped.log.some(e => e.message.includes(FINISH))).toBe(false);
  expect(published().binding).toBe(binding);
  expect(published().installation?.settlement.progress.phase).toBe('unsettled');
  expect({ input: binding.engineInput, recording: binding.recording }).toEqual(baseline);
  expect(durable()).toEqual(before);
});

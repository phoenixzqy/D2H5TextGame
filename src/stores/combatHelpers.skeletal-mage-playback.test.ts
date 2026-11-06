import { mockSyntheticEntryPools } from '@/test/fixtures/synthetic-entry-pools';
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
  mockSyntheticEntryPools();
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
  en: { mage: 'Skeletal Mage', targets: ['Fallen A', 'Fallen A', 'Fallen C', 'Fallen B'],
    hits: ['Skeletal Mage attacks Fallen A for 50 fire damage.',
      "Fallen A dodges Skeletal Mage's attack!",
      'Skeletal Mage attacks Fallen C for 61 lightning damage.',
      'Skeletal Mage attacks Fallen B for 50 poison damage.'],
    laterTargets: ['Fallen D', 'Quill Rat A', 'Fallen F', 'Fallen E'],
    laterHits: ['Skeletal Mage attacks Fallen D for 50 fire damage.',
      'Skeletal Mage attacks Quill Rat A for 61 cold damage.',
      'Skeletal Mage attacks Fallen F for 61 lightning damage.',
      'Skeletal Mage attacks Fallen E for 87 poison damage.'],
    dodge: "Fallen A dodges Skeletal Mage's attack!" },
  'zh-CN': { mage: '骷髅法师', targets: ['堕落者 A', '堕落者 A', '堕落者 C', '堕落者 B'],
    hits: ['骷髅法师 普攻 堕落者 A，造成 50 点火焰伤害。',
      '堕落者 A 闪避了 骷髅法师 的攻击！',
      '骷髅法师 普攻 堕落者 C，造成 61 点闪电伤害。',
      '骷髅法师 普攻 堕落者 B，造成 50 点毒素伤害。'],
    laterTargets: ['堕落者 D', '尖刺鼠 A', '堕落者 F', '堕落者 E'],
    laterHits: ['骷髅法师 普攻 堕落者 D，造成 50 点火焰伤害。',
      '骷髅法师 普攻 尖刺鼠 A，造成 61 点冰冷伤害。',
      '骷髅法师 普攻 堕落者 F，造成 61 点闪电伤害。',
      '骷髅法师 普攻 堕落者 E，造成 87 点毒素伤害。'],
    dodge: '堕落者 A 闪避了 骷髅法师 的攻击！' }
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
  let spawned = 0, paid = 0, laterHits = 0, firstAttempts = 0, poisonLoss = 0;
  const hitElements: string[] = [], dodgeElements: string[] = [];
  for (let remaining = events.length; remaining > 0; remaining--) {
    const previous = useCombatStore.getState();
    const pending = events[previous.eventCursor];
    if (!pending || pending.simClockMs > 3880) break; // Before FINISH/end and final snap.
    const expected = new Map([...previous.playerTeam, ...previous.enemyTeam]
      .map(unit => [unit.id, { life: unit.life, mana: unit.mana, lifeMax: unit.stats.lifeMax }]));
    useCombatStore.getState().advanceEvent();
    const next = useCombatStore.getState();
    expect(next.eventCursor).toBeGreaterThan(previous.eventCursor);
    expect(next.eventCursor).toBeLessThanOrEqual(events.length);
    expect(next.playbackComplete).toBe(false);
    for (let idx = previous.eventCursor; idx < next.eventCursor; idx++) {
      const event = events[idx];
      if (!event) throw new Error('Missing consumed Mage event');
      expect(event.simClockMs).toBeLessThanOrEqual(3880);
      if (event.kind === 'summon') {
        expect(expected.has(event.unit.id)).toBe(false);
        expected.set(event.unit.id, { life: event.unit.life, mana: event.unit.mana, lifeMax: event.unit.stats.lifeMax });
        spawned++;
        expect(next.playerTeam.filter(u => u.id === event.unit.id)).toEqual([event.unit]);
        expect(next.playerTeam.find(u => u.id === event.unit.id)?.gridPosition).toEqual(event.unit.gridPosition);
        expect(next.unitNameMap.get(event.unit.id)).toBe(copy.mage);
      }
      const targetBefore = 'target' in event ? expected.get(event.target) : undefined;
      if (event.kind === 'mana' && event.reason === 'cast') {
        paid++;
        expect(targetBefore?.mana).toBe(100);
        expect(event.mana).toBe(78);
        expect(next.log.some(entry => entry.id === `${String(idx)}-mana`)).toBe(false);
      }
      if (event.kind === 'damage' && bySource.has(event.source)) {
        const index = bySource.get(event.source);
        if (index === undefined || !targetBefore) throw new Error('Missing real Mage/target');
        const targetAfter = next.enemyTeam.find(u => u.id === event.target);
        const entry = next.log.find(entry => entry.id === `${String(idx)}-damage`);
        expect(entry).toMatchObject({ timestamp: 1792454400000,
          type: 'damage', actorId: event.source, actorName: copy.mage,
          targetId: event.target, targetName: next.unitNameMap.get(event.target), value: event.amount });
        if (event.simClockMs === 1940) {
          expect(event).toMatchObject({ damageType: ['fire', 'cold', 'lightning', 'poison'][index],
            amount: [50, 0, 61, 50][index], crit: false, dodged: index === 1 });
          expect(targetBefore.life).toBe([46, 46, 35, 35][index]);
          expect(next.unitNameMap.get(event.target)).toBe(copy.targets[index]);
          if (!event.dodged) expect(targetAfter?.life).toBe(0);
          expect(events.slice(0, idx).some(e => e.kind === 'death' && e.target === event.target)).toBe(false);
          expect(entry?.message).toBe(copy.hits[index]);
          firstAttempts++;
          (event.dodged ? dodgeElements : hitElements).push(event.damageType);
        } else {
          laterHits++; hitElements.push(event.damageType);
          expect(event).toMatchObject({ simClockMs: 3880,
            damageType: ['fire', 'cold', 'lightning', 'poison'][index],
            amount: [50, 61, 61, 87][index], dodged: false, crit: false });
          expect(targetBefore.life).toBe([34, 27, 43, 32][index]);
          expect(next.unitNameMap.get(event.target)).toBe(copy.laterTargets[index]);
          expect(targetAfter?.life).toBe(0);
          expect(events.slice(0, idx).some(e => e.kind === 'death' && e.target === event.target)).toBe(false);
          expect(entry?.message).toBe(copy.laterHits[index]);
        }
      }
      if (event.kind === 'dot' && event.target === 'enemy-act1.quill-rat-0-a0ad') {
        expect(event.amount).toBe(event.simClockMs === 3080 ? 4 : event.simClockMs === 3480 ? 2 : 1);
        poisonLoss += event.amount;
        expect(next.log.find(entry => entry.id === `${String(idx)}-dot`)?.message).toBe(locale === 'en'
          ? `Quill Rat A takes ${String(event.amount)} damage over time.`
          : `尖刺鼠 A 因持续伤害受到 ${String(event.amount)} 点伤害。`);
      }
      // Independent resource fold across every consumed event, including non-Mage hits.
      if (targetBefore) {
        if (event.kind === 'mana') targetBefore.mana = event.mana;
        if (event.kind === 'dot' || (event.kind === 'damage' && !event.dodged)) {
          targetBefore.life = Math.max(0, targetBefore.life - event.amount);
        }
        if (event.kind === 'heal') targetBefore.life = Math.min(targetBefore.lifeMax, targetBefore.life + event.amount);
        if (event.kind === 'death') targetBefore.life = 0;
      }
    }
    expect(next.playerTeam.filter(u => u.kind === 'summon')).toHaveLength(spawned);
    for (const unit of [...next.playerTeam, ...next.enemyTeam]) {
      expect({ life: unit.life, mana: unit.mana }).toEqual({
        life: expected.get(unit.id)?.life, mana: expected.get(unit.id)?.mana
      });
    }
    expect(next.log.filter(entry => entry.type === 'damage' && bySource.has(entry.actorId)).map(entry => entry.id))
      .toEqual(events.slice(0, next.eventCursor).flatMap((event, idx) =>
        event.kind === 'damage' && bySource.has(event.source) ? [`${String(idx)}-damage`] : []));
  }
  expect(spawned).toBe(4); expect(paid).toBe(1); expect(laterHits).toBe(4);
  expect(firstAttempts).toBe(4); expect(poisonLoss).toBe(7);
  expect(hitElements).toHaveLength(7);
  expect([...hitElements].sort()).toEqual(['cold', 'fire', 'fire', 'lightning', 'lightning', 'poison', 'poison']);
  expect(dodgeElements).toHaveLength(1);
  expect([...dodgeElements].sort()).toEqual(['cold']);
  const stopped = useCombatStore.getState();
  expect(events[stopped.eventCursor]?.simClockMs).toBe(4000);
  expect(stopped.playbackComplete).toBe(false);
  expect(stopped.log.some(e => e.message.includes(FINISH))).toBe(false);
  expect(published().binding).toBe(binding);
  expect(published().installation?.settlement.progress.phase).toBe('unsettled');
  expect({ input: binding.engineInput, recording: binding.recording }).toEqual(baseline);
  expect(durable()).toEqual(before);
});

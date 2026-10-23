import { mockSyntheticEntryPools } from '@/test/fixtures/synthetic-entry-pools';
/** Unearned fixture: real planner/engine and native event playback, no injected events. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { RecordedBattleEvent } from '@/engine/combat/combat';
import i18n from '@/i18n';
import { Suspense } from 'react';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { CombatScreen } from '@/features/combat/CombatScreen';
import type { Item } from '@/engine/types/items';
import { deriveStats } from '@/engine/progression/stats';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { inspectRecordedWaves, type RecordedWaveBinding } from '@/stores/recordedWaveReceipt';
import { useCombatStore } from '@/stores/combatStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { useHydrationStore } from '@/stores/hydrationStore';
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
  cleanup(); // Unmount native playback timers before abort/reset; never drain timers.
  abortSubAreaRun();
  for (const store of [useCombatStore, usePlayerStore, useInventoryStore, useMercStore,
    useMapStore, useMetaStore, useFormationStore]) store.getState().reset();
  useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills();
  vi.restoreAllMocks(); vi.useRealTimers();
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

function hpBar(id: string): HTMLElement {
  const bar = screen.getByTestId(`unit-card-${id}`).querySelector<HTMLElement>('.bg-red-600');
  if (!bar) throw new Error('Missing live unit HP bar');
  return bar;
}
it.each(['zh-CN', 'en'] as const)('renders real scheduled Mage playback and elemental logs in %s', async locale => {
  await i18n.changeLanguage(locale);
  const copy = COPY[locale], before = structuredClone(durable());
  const { binding } = start();
  const baseline = structuredClone({ input: binding.engineInput, recording: binding.recording });
  const events = binding.recording.events, summons = mageSummons(binding);
  const bySource = new Map(summons.map((event, index) => [event.unit.id, index]));
  expect(summons).toHaveLength(4);
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CombatScreen />
    </MemoryRouter>
  </Suspense></I18nextProvider>);
  const log = screen.getByTestId('combat-log');
  expect(log).toHaveAttribute('role', 'log'); expect(log).toHaveAttribute('aria-live', 'polite');
  expect(log).toHaveTextContent(locale === 'en' ? 'Battle starting…' : '战斗即将开始…');
  const mp = () => within(screen.getByRole('group', { name: locale === 'en' ? 'MP' : '法力' }));
  expect(mp().getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  expect(mp().getByText('100 / 1197', { exact: true })).toBeVisible();
  summons.forEach(event => { expect(screen.queryByTestId(`unit-card-${event.unit.id}`)).not.toBeInTheDocument(); });
  let spawned = 0, paid = 0, hits = 0, cold = 0, dodges = 0;
  for (let remaining = events.length; remaining > 0; remaining--) {
    const previous = useCombatStore.getState();
    const pending = events[previous.eventCursor];
    if (!pending || pending.simClockMs > 3880) break;
    const priorLife = new Map(previous.enemyTeam.map(unit => [unit.id, unit.life]));
    const hpStyles = new Map(previous.enemyTeam.map(unit => [unit.id, hpBar(unit.id).getAttribute('style')]));
    for (let timer = 0; timer < events.length && useCombatStore.getState().eventCursor === previous.eventCursor; timer++) {
      expect(vi.getTimerCount()).toBeGreaterThan(0);
      await act(async () => { await vi.advanceTimersToNextTimerAsync(); });
    } // Native component timers drive each consumed range; no direct store stepping.
    const next = useCombatStore.getState();
    expect(next.eventCursor).toBeGreaterThan(previous.eventCursor);
    expect(next.eventCursor).toBeLessThanOrEqual(events.length);
    expect(next.playbackComplete).toBe(false);
    for (let idx = previous.eventCursor; idx < next.eventCursor; idx++) {
      const event = events[idx];
      if (!event) throw new Error('Missing consumed Mage event');
      expect(event.simClockMs).toBeLessThanOrEqual(3880);
      if (event.kind === 'summon') {
        spawned++;
        const position = event.unit.gridPosition;
        if (!position) throw new Error('Missing real summon position');
        const card = screen.getByTestId(`unit-card-${event.unit.id}`);
        expect(card).toBeVisible(); expect(card).toHaveTextContent(copy.mage);
        expect(within(screen.getByTestId(`player-grid-cell-${String(position.row)}-${String(position.col)}`))
          .getByTestId(`unit-card-${event.unit.id}`)).toBe(card);
      }
      if (event.kind === 'mana' && event.reason === 'cast') {
        paid++;
        expect(mp().getByRole('progressbar')).toHaveAttribute('aria-valuenow', '78');
        expect(mp().getByText('78 / 1197', { exact: true })).toBeVisible();
        expect(next.log.some(entry => entry.id === `${String(idx)}-mana`)).toBe(false);
      }
      if (event.kind === 'damage' && bySource.has(event.source)) {
        const index = bySource.get(event.source);
        const life = priorLife.get(event.target);
        if (index === undefined || life === undefined) throw new Error('Missing real Mage target');
        const message = next.log.find(entry => entry.id === `${String(idx)}-damage`)?.message;
        if (event.simClockMs === 1940) {
          hits++;
          expect(life).toBe([35, 46, 34, 35][index]);
          expect(message).toBe(copy.hits[index]);
          expect(hpBar(event.target)).toHaveStyle({ width: '0%' });
          expect(within(log).getByText(copy.hits[index] ?? '', { exact: true })).toBeVisible();
        } else if (event.damageType === 'cold') {
          cold++;
          expect(event).toMatchObject({ simClockMs: 3880, amount: 61, dodged: false });
          expect(life).toBe(41); expect(message).toBe(copy.coldHit);
          expect(hpBar(event.target)).toHaveStyle({ width: '0%' });
          expect(within(log).getByText(copy.coldHit, { exact: true })).toBeVisible();
        } else {
          dodges++;
          expect(event).toMatchObject({ simClockMs: 3880, amount: 0, dodged: true });
          expect(life).toBeGreaterThan(0); expect(message).toBe(copy.dodge);
          expect(hpBar(event.target).getAttribute('style')).toBe(hpStyles.get(event.target));
        }
      }
      if ('target' in event) {
        const life = priorLife.get(event.target);
        if (life !== undefined) {
          if (event.kind === 'dot' || (event.kind === 'damage' && !event.dodged)) priorLife.set(event.target, Math.max(0, life - event.amount));
          if (event.kind === 'death') priorLife.set(event.target, 0);
        }
      }
    }
    // The DOM presents the complete consumed group, including every same-time dodge.
    expect(within(log).queryAllByText(copy.dodge, { exact: true })).toHaveLength(dodges);
    expect(next.log.filter(entry => entry.type === 'damage' && bySource.has(entry.actorId)).map(entry => entry.id))
      .toEqual(events.slice(0, next.eventCursor).flatMap((event, idx) =>
        event.kind === 'damage' && bySource.has(event.source) ? [`${String(idx)}-damage`] : []));
  }
  expect({ spawned, paid, hits, cold, dodges }).toEqual({ spawned: 4, paid: 1, hits: 4, cold: 1, dodges: 3 });
  const stopped = useCombatStore.getState();
  expect(events[stopped.eventCursor]?.simClockMs).toBe(4000);
  expect(stopped.playbackComplete).toBe(false);
  expect(published().binding).toBe(binding);
  expect(published().installation?.settlement.progress.phase).toBe('unsettled');
  expect({ input: binding.engineInput, recording: binding.recording }).toEqual(baseline);
  expect(durable()).toEqual(before);
  cleanup(); // Release this component's timers before switching back to the real clock.
  expect(vi.getTimerCount()).toBe(0);
});

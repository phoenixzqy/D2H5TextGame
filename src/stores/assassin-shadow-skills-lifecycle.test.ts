import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Persistence I/O only is faked; save validation, allocation and combat are real.
vi.mock('@/stores/save-adapter', () => ({
  hasSave: vi.fn(),
  loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)),
  deleteSave: vi.fn()
}));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import type { Item } from '@/engine/types/items';
import {
  abortSubAreaRun,
  advanceWaveOrFinish,
  playerToCombatUnit,
  startSubAreaRun
} from '@/stores/combatHelpers';
import { snapshotStores, importIntoStores, __resetPersistenceForTests } from '@/stores/persistence';
import { useCombatStore } from '@/stores/combatStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useMetaStore } from '@/stores/metaStore';
import { useHydrationStore } from '@/stores/hydrationStore';

const stores = [
  useCombatStore,
  usePlayerStore,
  useInventoryStore,
  useMapStore,
  useMercStore,
  useFormationStore,
  useMetaStore
] as const;
function reset() {
  __resetPersistenceForTests();
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
function player() {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing functional Assassin');
  return value;
}
function hero() {
  const value = useCombatStore.getState().playerTeam[0];
  if (!value) throw new Error('Missing native wave');
  return value;
}
function recording() {
  const s = useCombatStore.getState();
  return structuredClone({
    team: s.playerTeam,
    events: s.recordedEvents,
    outcome: s.outcome,
    cursor: s.eventCursor,
    rewards: s.runRewards
  });
}
/** Constructed level/pool/Attack/critical equipment; never earned balance. */
function arrange() {
  const fresh = createMockPlayer('Synthetic shadow lifecycle fixture', 'assassin');
  usePlayerStore.getState().setPlayer({
    ...fresh,
    level: 30,
    skillPoints: 29,
    comboOrder: [],
    skillLevels: {}
  });
  const cap: Item = {
    id: 'shadow-fixture-pool-cap',
    baseId: 'items/base/helm-cap',
    rarity: 'rare',
    level: 1,
    identified: true,
    equipped: false,
    socketCapacity: 0,
    affixes: [
      {
        affixId: 'fixture-imported',
        values: new Map([
          ['statMods.life', 999000],
          ['statMods.mana', 999000],
          ['statMods.attack', 1000],
          ['statMods.attackSpeed', -100],
          ['statMods.critChance', 1000]
        ])
      }
    ]
  };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
}
beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
  resetRegistry();
  loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset();
  useHydrationStore.getState().setStatus('idle');
  resetRegistry();
  loadDefaultSkills();
  vi.restoreAllMocks();
});
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function finalHero() {
  const value = useCombatStore.getState().outcome?.finalPlayerTeam[0];
  if (!value) throw new Error('Missing native attack outcome');
  return value;
}
import rows from '@/data/skills/assassin.json';
import { prepareTownRespec, executeTownRespec } from '@/stores/respecActions';
type Slug = 'shadow-warrior' | 'shadow-master';
function learn(slug: Slug) {
  const learned = new Set<string>();
  function add(id: string) {
    if (learned.has(id)) return;
    const source = rows.find(row => row.id === id);
    if (!source) throw new Error('Missing actual Assassin prerequisite');
    for (const prerequisite of source.prerequisites ?? []) add(prerequisite);
    expect(usePlayerStore.getState().allocateSkillPoint(id)).toBe('ok');
    learned.add(id);
  }
  const id = 'skills-assassin-' + slug;
  add(id);
  if (slug === 'shadow-warrior') add('skills-assassin-fire-blast');
  usePlayerStore.getState().setComboOrder(slug === 'shadow-warrior' ? [id, 'skills-assassin-fire-blast'] : [id]);
}
function assertPaidBody(slug: Slug, rank: number, hasWarriorAttack = true) {
  const state = useCombatStore.getState(), template = slug.replaceAll('-', '_');
  const spawns = state.recordedEvents.filter(event => event.kind === 'summon' && event.summonId === template);
  expect(spawns).toHaveLength(1);
  const event = spawns[0];
  if (event?.kind !== 'summon') throw new Error('Missing real paid native shadow');
  expect(event).toMatchObject({ owner: hero().id, simClockMs: 0 });
  const ownMana = slug === 'shadow-warrior' ? 100 : 150;
  expect(event.unit).toMatchObject({ kind: 'summon', summonOwnerId: hero().id, summonTemplateId: template,
    mana: ownMana, stats: { manaMax: ownMana },
    skillLevels: slug === 'shadow-warrior' ? (hasWarriorAttack ? { 'assassin.fire_blast': rank } : {}) : {
      'assassin.mind_blast': rank, 'assassin.fire_blast': rank, 'assassin.blade_fury': rank, 'assassin.dragon_talon': rank
    }
  });
  const runtime = 'assassin.' + template;
  expect(state.recordedEvents.filter(event => event.kind === 'action' && event.skillId === runtime))
    .toEqual([expect.objectContaining({ actor: hero().id, simClockMs: 0 })]);
  const cost = Math.round((slug === 'shadow-warrior' ? 22 : 35) - (slug === 'shadow-warrior' ? .2 : .25) * (rank - 1));
  expect(state.recordedEvents.filter(event => event.kind === 'mana' && event.reason === 'cast' && event.target === hero().id && event.simClockMs === 0))
    .toEqual([expect.objectContaining({ mana: hero().mana - cost })]);
  if (slug === 'shadow-master' || hasWarriorAttack) {
    const attack = slug === 'shadow-warrior' ? 'assassin.fire_blast' : 'assassin.mind_blast';
    expect(state.recordedEvents.some(action => action.kind === 'action' && action.actor === event.unit.id && action.skillId === attack)).toBe(true);
    expect(state.recordedEvents.some(hit => hit.kind === 'damage' && hit.source === event.unit.id && hit.amount > 0 && hit.damageType === (slug === 'shadow-warrior' ? 'fire' : 'arcane'))).toBe(true);
  } else {
    expect(state.recordedEvents.some(action => action.kind === 'action' && action.actor === event.unit.id && action.skillId !== null)).toBe(false);
  }
  return event.unit;
}
for (const slug of ['shadow-warrior', 'shadow-master'] as const) {
  it(`${slug} freezes current captured ranks and refreshes selection, rank and own resources only for a later paid wave`, () => {
    arrange(); learn(slug);
    expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
    const body = structuredClone(assertPaidBody(slug, 1)), first = recording(), firstFinal = structuredClone(finalHero());
    expect(usePlayerStore.getState().allocateSkillPoint('skills-assassin-' + slug)).toBe('ok');
    if (slug === 'shadow-warrior') expect(usePlayerStore.getState().allocateSkillPoint('skills-assassin-fire-blast')).toBe('ok');
    expect(recording()).toEqual(first);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect([hero().life, hero().mana]).toEqual([firstFinal.life, firstFinal.mana]);
    const secondBody = assertPaidBody(slug, 2);
    expect(body.skillLevels).toEqual(slug === 'shadow-warrior' ? { 'assassin.fire_blast': 1 } : {
      'assassin.mind_blast': 1, 'assassin.fire_blast': 1, 'assassin.blade_fury': 1, 'assassin.dragon_talon': 1 });
    expect(secondBody.skillLevels).not.toEqual(body.skillLevels);
    const second = recording(), secondFinal = structuredClone(finalHero());
    usePlayerStore.getState().setComboOrder(['skills-assassin-' + slug]);
    expect(recording()).toEqual(second);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect([hero().life, hero().mana]).toEqual([secondFinal.life, secondFinal.mana]);
    assertPaidBody(slug, 2, false);
  });
  it(`${slug} preserves learned setup across native import while discarding body, mana, cooldown and captured-plan authority`, async () => {
    arrange(); learn(slug);
    expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
    assertPaidBody(slug, 1);
    const save = snapshotStores(); if (!save) throw new Error('Missing native shadow save');
    const expected = playerToCombatUnit(player()), json = JSON.stringify(toJsonSafe(save));
    for (const key of ['assassinShadowSkills', 'summonTemplateId', 'summonOwnerId', 'skillCooldowns'])
      expect(json).not.toContain(JSON.stringify(key) + ':');
    await importIntoStores(json);
    expect(player()).toEqual(save.player);
    expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(toJsonSafe(save.inventory));
    expect(playerToCombatUnit(player())).toEqual(expected);
    expect(useCombatStore.getState().playerTeam).toEqual([]);
    expect(useCombatStore.getState().enemyTeam).toEqual([]);
    expect(useCombatStore.getState().recordedEvents).toEqual([]);
    expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
    assertPaidBody(slug, 1);
  });
  it(`${slug} refuses active-wave respec, then real town respec removes fresh copied-skill authority`, () => {
    arrange(); learn(slug);
    expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
    assertPaidBody(slug, 1);
    const existing = recording();
    expect(prepareTownRespec('npc/akara', 'skill').kind).toBe('combat-active');
    expect(recording()).toEqual(existing);
    abortSubAreaRun();
    useCombatStore.getState().endCombat();
    const quote = prepareTownRespec('npc/akara', 'skill');
    expect(quote.kind).toBe('ok'); if (quote.kind !== 'ok') throw new Error(quote.kind);
    expect(executeTownRespec(quote.request)).toBe('ok');
    expect(player().skillLevels).toEqual({}); expect(player().comboOrder).toEqual([]);
    expect(playerToCombatUnit(player()).assassinShadowSkills).toEqual({});
    expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
    expect(useCombatStore.getState().recordedEvents.some(event => event.kind === 'summon')).toBe(false);
    expect(useCombatStore.getState().recordedEvents.some(event => event.kind === 'action' &&
      (event.skillId === 'assassin.shadow_warrior' || event.skillId === 'assassin.shadow_master'))).toBe(false);
  });
}

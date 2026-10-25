import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('./save-adapter', () => ({
  hasSave: vi.fn(),
  loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve()),
  deleteSave: vi.fn()
}));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, startSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';

const stores = [
  useCombatStore,
  usePlayerStore,
  useInventoryStore,
  useMapStore,
  useMercStore,
  useFormationStore,
  useMetaStore
];
function reset() {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  reset();
  useHydrationStore.getState().setStatus('idle');
});

/** Constructed class/level/allocations only; no earned progression or balance claim. */
function native(rank: number, level = 30, heart = 1, classId: 'druid' | 'sorceress' = 'druid') {
  const fresh = createMockPlayer('Constructed passive spirit', classId);
  usePlayerStore.getState().setPlayer({
    ...fresh,
    level,
    comboOrder: [],
    skillLevels: {
      'druid.oak_sage': 1,
      'druid.heart_of_wolverine': heart,
      'druid.spirit_of_barbs': rank
    }
  });
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  return { sourceId: fresh.id, state: useCombatStore.getState() };
}

it.each([1, 20])(
  'learned unslotted rank%s creates one real passive spirit at wave entry',
  (rank) => {
    const { sourceId, state } = native(rank);
    const spirits = state.recordedEvents.filter(
      (e) => e.kind === 'summon' && e.summonId === 'spirit_of_barbs'
    );
    expect(spirits).toHaveLength(1);
    const spawn = spirits[0];
    if (spawn?.kind !== 'summon') throw new Error('Missing actual Spirit of Barbs summon');
    expect(spawn).toMatchObject({
      owner: sourceId,
      simClockMs: 0,
      unit: {
        summon: true,
        kind: 'summon',
        summonOwnerId: sourceId,
        summonTemplateId: 'spirit_of_barbs'
      }
    });
    expect(spawn.unit.life).toBeGreaterThan(0);
    expect(state.recordedEvents.some((e) => e.kind === 'action' && e.actor === spawn.unit.id)).toBe(
      false
    );
    expect(
      state.recordedEvents.some((e) => e.kind === 'action' && e.skillId === 'druid.spirit_of_barbs')
    ).toBe(false);
  }
);

it.each([
  [0, 30, 1, 'druid'],
  [20, 29, 1, 'druid'],
  [20, 30, 0, 'druid'],
  [20, 30, 1, 'sorceress']
] as const)(
  'rejects unlearned/locked/missing-prerequisite/foreign spirit: %s/%s/%s/%s',
  (rank, level, heart, classId) => {
    const { state } = native(rank, level, heart, classId);
    expect(
      state.recordedEvents.some((e) => e.kind === 'summon' && e.summonId === 'spirit_of_barbs')
    ).toBe(false);
  }
);

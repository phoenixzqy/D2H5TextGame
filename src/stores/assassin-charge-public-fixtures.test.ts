import { afterEach, beforeEach, it, expect, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({
  hasSave: vi.fn(),
  loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)),
  deleteSave: vi.fn()
}));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { startSubAreaRun, abortSubAreaRun, advanceWaveOrFinish } from '@/stores/combatHelpers';
import { useCombatStore } from '@/stores/combatStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useMetaStore } from '@/stores/metaStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { __resetPersistenceForTests } from '@/stores/persistence';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import type { Item } from '@/engine/types/items';
const families = [
  'tiger-strike',
  'fists-of-fire',
  'cobra-strike',
  'claws-of-thunder',
  'blades-of-ice',
  'phoenix-strike'
] as const;
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
  __resetPersistenceForTests();
  abortSubAreaRun();
  for (const s of stores) s.getState().reset();
}
beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
  resetRegistry();
  loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-27T12:00:00Z'));
});
afterEach(() => {
  reset();
  useHydrationStore.getState().setStatus('idle');
  resetRegistry();
  loadDefaultSkills();
  vi.restoreAllMocks();
});
for (const slug of families)
  for (const rank of [1, 20])
    it(slug + ' rank' + String(rank) + ' native public fixture', () => {
      const id = 'skills-assassin-' + slug,
        runtime = 'assassin.' + slug.replaceAll('-', '_');
      const player = {
        ...createMockPlayer('Charge Test', 'assassin'),
        level: 30,
        skillPoints: 20,
        comboOrder: [],
        skillLevels: Object.fromEntries(
          families.filter((s) => s !== slug).map((s) => ['assassin.' + s.replaceAll('-', '_'), 1])
        )
      };
      usePlayerStore.getState().setPlayer(player);
      const cap: Item = {
        id: 'synthetic-charge-cap',
        baseId: 'items/base/helm-cap',
        rarity: 'rare',
        level: 1,
        identified: true,
        equipped: false,
        socketCapacity: 0,
        socketContents: [],
        affixes: [
          {
            affixId: 'synthetic-import',
            values: new Map([
              ['statMods.life', 999880],
              ['statMods.mana', 999000],
              ['statMods.attack', 25],
              ['statMods.attackSpeed', -100]
            ])
          }
        ]
      };
      useInventoryStore.getState().addItem(cap);
      expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
      for (let i = 0; i < rank; i++)
        expect(usePlayerStore.getState().allocateSkillPoint(id)).toBe('ok');
      usePlayerStore
        .getState()
        .setComboOrder(slug === 'phoenix-strike' ? [id, 'skills-assassin-tiger-strike'] : [id]);
      expect(usePlayerStore.getState().player?.skillLevels?.[runtime]).toBe(rank);
      expect(startSubAreaRun({ subAreaId: 'areas/act1-catacombs' })).not.toBeNull();
      const proofs = [];
      for (let wave = 0; wave < 6; wave++) {
        const state = useCombatStore.getState(),
          hero = state.playerTeam[0];
        if (!hero) throw new Error('Missing hero');
        const events = state.recordedEvents,
          states = events
            .filter((e) => e.kind === 'status-state')
            .filter((e) => e.target === hero.id);
        for (let i = 0; i < states.length; i++) {
          const full = states[i];
          if (!full?.statuses.some((s) => s.id === 'charge-' + slug && s.stacks === 3)) continue;
          const consumed = states
            .slice(i + 1)
            .find((e) => !e.statuses.some((s) => s.id === 'charge-' + slug));
          if (!consumed) continue;
          const hits = events
            .filter((e) => e.kind === 'damage')
            .filter((e) => e.source === hero.id && e.simClockMs === consumed.simClockMs);
          const heal = events
            .filter((e) => e.kind === 'heal')
            .filter((e) => e.target === hero.id && e.simClockMs === consumed.simClockMs);
          const types =
            slug === 'tiger-strike'
              ? ['physical']
              : slug === 'fists-of-fire'
                ? ['fire']
                : slug === 'claws-of-thunder'
                  ? ['lightning']
                  : slug === 'blades-of-ice'
                    ? ['cold']
                    : slug === 'phoenix-strike'
                      ? ['fire', 'cold', 'lightning']
                      : [];
          const success =
            slug === 'cobra-strike'
              ? heal.some((e) => e.amount > 0)
              : types.every((type) =>
                  hits.slice(1).some((e) => e.damageType === type && e.amount > 0)
                );
          if (success) {
            proofs.push({
              slug,
              rank,
              wave: wave + 1,
              full: full.simClockMs,
              consume: consumed.simClockMs,
              hits,
              heal
            });
            break;
          }
        }
        if (proofs.length) break;
        state.recordedEvents.forEach(() => {
          useCombatStore.getState().advanceEvent();
        });
        if (advanceWaveOrFinish() !== 'next-wave') break;
      }
      expect(proofs).toHaveLength(1);
    });

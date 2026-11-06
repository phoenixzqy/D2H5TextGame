/** Constructed native combat transport; no earned-route or settlement claim. */
import { afterEach, beforeEach, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import monsterRows from '@/data/monsters/act1.json';
import monsterSchema from '@/data/schema/monster.schema.json';
import type { MonsterDef } from '@/engine/types/monsters';
import type { CombatUnit } from '@/engine/combat/types';
import { runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import { buildMonsterUnit } from '@/engine/combat/monster-factory';
import { createRng } from '@/engine/rng';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, startSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMapStore } from './mapStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { createIdlePlaybackClock } from './idlePlaybackClock';

const AREA = 'areas/act1-blood-moor';
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMercStore,
  useFormationStore, useMapStore, useMetaStore];
const validate = new Ajv2020({ strict: true }).compile<MonsterDef>(monsterSchema);
function monster(slug: string, id: string): CombatUnit {
  const row: unknown = monsterRows.find(row => row.id === `monsters/act1.${slug}`);
  if (!validate(row)) throw new Error('Invalid production resurrection fixture');
  return buildMonsterUnit({ def: row, id, tier: 'trash', level: 1, rng: createRng(7) });
}
function nativeRecording() {
  const base = monster('fallen', 'hero');
  const hero: CombatUnit = { ...base, side: 'player', kind: 'hero', life: 100_000, mana: 100,
    stats: { ...base.stats, life: 100_000, lifeMax: 100_000, mana: 100, manaMax: 100,
      attack: 100, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0,
      physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    skillOrder: [], statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: 8, expiresAtMs: 8000 }] };
  const original = monster('fallen', 'body');
  const body: CombatUnit = { ...original, life: 1, mana: 3,
    stats: { ...original.stats, life: 100, lifeMax: 100, mana: 20, manaMax: 20,
      defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0 },
    skillOrder: [], statuses: [
      { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 },
      { id: 'ignite', sourceId: 'hero', stacks: 1, remaining: 1, expiresAtMs: 1000, dotPerStack: 1 }
    ] };
  const shaman = monster('fallen-shaman', 'shaman');
  const source = { ...shaman, life: 100_000, stats: { ...shaman.stats, life: 100_000, lifeMax: 100_000 } };
  const snapshot: CombatSnapshot = { seed: 7, act: 1, playerTeam: [hero], enemyTeam: [body, source] };
  return { snapshot, recorded: runBattleRecorded(snapshot) };
}
beforeEach(() => {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Native resurrection transport', 'sorceress'));
  useMapStore.getState().setCurrentLocation(1, AREA);
  useMetaStore.getState().setIdleTarget('a1-blood-moor');
});
afterEach(() => {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('idle');
  resetRegistry(); loadDefaultSkills();
});

it.each(['manual', 'idle'] as const)('plays native first death, resurrection and second death before terminal snap through %s', mode => {
  // Establish ordinary idle ownership with the native entry point; replace only
  // the public recording with this factory-derived lifecycle fixture. No payout runs.
  if (mode === 'idle') startSubAreaRun({ mode: 'idle', runSeed: 7, challengeOrdinal: 0 });
  const { snapshot, recorded } = nativeRecording();
  const frozen = structuredClone(recorded);
  const revival = recorded.events.find(event => event.kind === 'revive');
  if (!revival) throw new Error('Native factory/registry produced no resurrection');
  expect(recorded.events.filter(event => event.kind === 'death' && event.target === 'body')).toHaveLength(2);
  useCombatStore.getState().setRecordedBattle({
    initialPlayerTeam: snapshot.playerTeam, initialEnemyTeam: snapshot.enemyTeam,
    events: recorded.events, unitNameMap: new Map([['hero', 'Hero'], ['body', 'Fallen'], ['shaman', 'Shaman']]),
    outcome: { winner: recorded.result.winner, finalPlayerTeam: recorded.result.playerTeam,
      finalEnemyTeam: recorded.result.enemyTeam }, subAreaRunId: mode === 'idle' ? AREA : null
  });
  const clock = mode === 'idle' ? createIdlePlaybackClock({
    readContext: () => ({ enabled: true, speed: 1, exiting: false })
  }) : null;
  let now = 0;
  let plan = clock?.wake(now);
  let deathCount = 0, sawRevive = false;
  try {
    for (let calls = 0; calls < recorded.events.length && deathCount < 2; calls++) {
      const previous = useCombatStore.getState().eventCursor;
      if (clock) {
        if (plan?.waitMs == null) throw new Error('Native idle clock failed to schedule a recorded batch');
        now += plan.waitMs;
        plan = clock.wake(now);
        expect(plan.transitionFailed).toBe(false);
      } else useCombatStore.getState().tick();
      const state = useCombatStore.getState();
      expect(state.eventCursor).toBeGreaterThan(previous);
      const consumed = recorded.events.slice(previous, state.eventCursor);
      deathCount += consumed.filter(event => event.kind === 'death' && event.target === 'body').length;
      const row = state.enemyTeam.find(unit => unit.id === 'body');
      expect(state.enemyTeam.map(unit => unit.id)).toEqual(['body', 'shaman']);
      if (consumed.includes(revival)) {
        sawRevive = true;
        expect(state.playbackComplete).toBe(false);
        expect(row).toMatchObject({ life: revival.unit.life, mana: revival.unit.mana, statuses: [] });
        expect(row).not.toBe(revival.unit);
        expect(row?.stats).not.toBe(revival.unit.stats);
        expect(state.statusPlayback?.deadIds).not.toContain('body');
        expect(state.log.some(entry => entry.actorId === 'shaman' && entry.targetId === 'body')).toBe(true);
      }
      if (consumed.some(event => event.kind === 'death' && event.target === 'body')) {
        expect(state.playbackComplete).toBe(false);
        expect(row).toMatchObject({ life: 0, statuses: [] });
        expect(state.statusPlayback?.deadIds).toContain('body');
      }
    }
    expect(sawRevive).toBe(true);
    expect(deathCount).toBe(2);
    expect(useCombatStore.getState().playbackComplete).toBe(false);
    expect(recorded).toEqual(frozen);
  } finally { clock?.dispose(); }
});

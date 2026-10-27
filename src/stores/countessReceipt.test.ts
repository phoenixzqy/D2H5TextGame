/** Constructed receipt boundary tests; no gameplay or persistent quest proof. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { subAreas, monsters } from '@/data/index';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { buildMonsterUnit } from '@/engine/combat/monster-factory';
import { createRng } from '@/engine/rng';
import { resolveQuestEncounterPlan } from '@/engine/combat/sub-area-run';
import { captureCountessEncounter, COUNTESS } from '@/engine/map/countess-admission';
import { useCombatStore } from '@/stores/combatStore';
import { stageRecordedBattle } from '@/stores/recordedBattlePublication';
import { prepareRecordedWave, abandonRecordedWaves, inspectRecordedWaves, type RecordedWaveBinding } from '@/stores/recordedWaveReceipt';
import { beginWaveTransition, endWaveTransition, type WaveTransitionLease } from '@/stores/waveTransitionGuard';
import type { ActiveRun } from '@/stores/combatRunLifecycle';
function required<T>(value: T | undefined): T { if (value === undefined) throw new Error('Missing receipt fixture'); return value; }
function fixture(questEncounter?: string) {
  const hero = playerToCombatUnit(createMockPlayer('Countess receipt fixture', 'sorceress'));
  const enemy = buildMonsterUnit({ def: required(monsters.find(row => row.id === COUNTESS.archetype)),
    level: 13, tier: 'boss', id: 'original-countess', rng: createRng(7) });
  const plan = resolveQuestEncounterPlan({ subArea: required(subAreas.find(row => row.id === COUNTESS.area)),
    encounterId: COUNTESS.encounter, seed: 7 });
  const origin = Object.freeze({ kind: 'area' as const, replayProfileId: 'normal' as const,
    ...(questEncounter === undefined ? {} : { questEncounter }) }) as ActiveRun['origin'];
  const candidateRun: ActiveRun = { origin, plan, act: 1, seed: 7, mode: 'manual',
    playerUnit: hero, waveIdx: 0, carryPlayerTeam: [hero], waveElapsedMs: 1200 };
  const events = [{ kind: 'end' as const, winner: 'player' as const, simClockMs: 1200, uiDelayMs: 0 }];
  const outcome = { winner: 'player' as const, finalPlayerTeam: [hero], finalEnemyTeam: [{ ...enemy, life: 0 }] };
  const recording = { events, outcome };
  const publication = stageRecordedBattle({ initialPlayerTeam: [hero], initialEnemyTeam: [enemy],
    events, outcome, unitNameMap: new Map(), currentWave: 1, totalWaves: 1,
    subAreaRunId: COUNTESS.area, resetRunRewards: true, ironGolemReplayLocked: false }, useCombatStore.getState());
  const encounter = { ...required(captureCountessEncounter(1, COUNTESS.area, required(plan.waves[0]), [hero], [enemy])) };
  const binding: RecordedWaveBinding = { origin, candidateRun, expectedActiveRun: null,
    heroId: hero.id, targetWaveIdx: 0, waveElapsedMs: 1200, selection: null,
    ownership: { backpack: [], stash: [], equipped: {}, mercEquipment: {} }, debitIntent: null,
    engineInput: { seed: 7, playerTeam: [hero], enemyTeam: [enemy] }, attestation: null, recording, publication };
  return { binding, encounter };
}
let lease: WaveTransitionLease;
beforeEach(() => { abandonRecordedWaves(); lease = beginWaveTransition(true); });
afterEach(() => { endWaveTransition(lease); abandonRecordedWaves(); });
describe('Countess trusted receipt source', () => {
  it('control leaves the existing ordinary area receipt path available', () => {
    const { binding } = fixture();
    expect(() => prepareRecordedWave(binding, lease)).not.toThrow();
    expect(inspectRecordedWaves().pending?.binding.origin).toBe(binding.origin);
  });
  it('privately copies and freezes the captured original identities', () => {
    const { binding, encounter } = fixture(COUNTESS.encounter);
    prepareRecordedWave({ ...binding, countessEncounter: encounter } as RecordedWaveBinding, lease);
    const captured = inspectRecordedWaves().pending?.binding as RecordedWaveBinding & { countessEncounter?: typeof encounter };
    expect(captured.countessEncounter).toEqual(encounter);
    expect(captured.countessEncounter).not.toBe(encounter);
    expect(Object.isFrozen(captured.countessEncounter)).toBe(true);
    encounter.originalCountessId = 'caller-mutated-id';
    expect(captured.countessEncounter?.originalCountessId).toBe('original-countess');
  });
  it('refuses captured Countess admission without its trusted quest-run origin', () => {
    const { binding, encounter } = fixture();
    expect(() => prepareRecordedWave({ ...binding, countessEncounter: encounter } as RecordedWaveBinding, lease)).toThrow('bindingMismatch');
    expect(inspectRecordedWaves().pending).toBeNull();
  });
  it('refuses an unknown quest encounter origin even when all other wrappers agree', () => {
    const { binding } = fixture('unknown-quest-encounter');
    expect(() => prepareRecordedWave(binding, lease)).toThrow('bindingMismatch');
    expect(inspectRecordedWaves().pending).toBeNull();
  });
});

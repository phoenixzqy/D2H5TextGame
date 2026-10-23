import { afterEach, beforeEach, expect, it } from 'vitest';
import { synthDefaultPlan } from '@/engine/combat';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { useHydrationStore } from './hydrationStore';
import { useCombatStore } from './combatStore';
import { createSimpleEnemy, playerToCombatUnit } from './combatHelpers';
import type { ActiveRun } from './combatRunLifecycle';
import { stageRecordedBattle } from './recordedBattlePublication';
import { beginWaveTransition, endWaveTransition } from './waveTransitionGuard';
import { abandonRecordedWaves, prepareRecordedWaveInstallation, commitPreparedRecordedWave,
  markRecordedWaveMetadataInstalled, recognizeRecordedWavePublication, beginRecordedWaveSettlement,
  failRecordedWaveSettlement, inspectRecordedWaves } from './recordedWaveReceipt';
import { RecordedWaveAccessError } from './recordedWaveAccess';
import { prepareLiveMaterialAction, previewLiveMaterialAction, executeLiveMaterialAction } from './materialActions';

beforeEach(() => {
  abandonRecordedWaves();
  useCombatStore.getState().reset(); usePlayerStore.getState().reset();
  useInventoryStore.getState().reset(); useMercStore.getState().reset(); useMapStore.getState().reset();
  usePlayerStore.getState().setPlayer(createMockPlayer('Material guard', 'sorceress'));
  useInventoryStore.setState({ materials: { 'runes/el': 3 } });
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  abandonRecordedWaves();
  useCombatStore.getState().reset(); usePlayerStore.getState().reset();
  useInventoryStore.getState().reset(); useMercStore.getState().reset(); useMapStore.getState().reset();
  useHydrationStore.getState().setStatus('idle');
});

/** Install protocol phases without running combat or awarding any rewards. */
function installPhase(phase: 'preparedPending' | 'publicationPending' | 'settling' | 'settlementFailed') {
  const hero = playerToCombatUnit(createMockPlayer('Protocol fixture', 'sorceress'));
  const enemy = createSimpleEnemy(1);
  const plan = synthDefaultPlan({ id: 'guard-area', lootTable: 'loot/trash-act1', areaLevel: 1 },
    'monsters/act1.fallen', 1, 7);
  const run: ActiveRun = { origin: Object.freeze({ kind: 'area', replayProfileId: 'normal' }), plan, act: 1, seed: 7, mode: 'manual', playerUnit: hero,
    waveIdx: 0, carryPlayerTeam: [hero], waveElapsedMs: 0 };
  const events = [{ kind: 'end' as const, winner: 'player' as const, simClockMs: 1200, uiDelayMs: 0 }];
  const outcome = { winner: 'player' as const, finalPlayerTeam: [hero], finalEnemyTeam: [enemy] };
  const recording = { events, outcome };
  const publication = stageRecordedBattle({ initialPlayerTeam: [hero], initialEnemyTeam: [enemy],
    events, outcome, unitNameMap: new Map() }, { currentWave: 1, totalWaves: plan.waves.length,
    subAreaRunId: plan.subAreaId, runRewards: { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} } });
  const ownership = { backpack: [], stash: [], equipped: {}, mercEquipment: {} };
  const binding = { origin: run.origin, candidateRun: run, expectedActiveRun: null, heroId: hero.id, targetWaveIdx: 0,
    waveElapsedMs: 1200, selection: null, ownership, debitIntent: null,
    engineInput: { seed: 7, playerTeam: [hero], enemyTeam: [enemy] }, attestation: null, recording, publication };
  const lease = beginWaveTransition(true);
  try {
    const token = prepareRecordedWaveInstallation(binding, { kind: 'newRun', nextDefaultChallengeOrdinal: null }, lease);
    if (phase === 'preparedPending') return;
    commitPreparedRecordedWave(token, lease, { activeRun: null, heroId: hero.id, selection: null, ownership });
    markRecordedWaveMetadataInstalled(token, lease);
    if (phase === 'publicationPending') return;
    Object.assign(run, { recording, waveElapsedMs: 1200 });
    expect(recognizeRecordedWavePublication(token, lease, { activeRun: run, heroId: hero.id, combat: publication })).toBe(true);
    beginRecordedWaveSettlement(token, lease, { activeRun: run, heroId: hero.id,
      combat: { ...publication, playbackComplete: true } });
    if (phase === 'settlementFailed') failRecordedWaveSettlement(token, lease, { error: new Error('Retained payout failure') });
  } finally { endWaveTransition(lease); }
}

it.each(['preparedPending', 'publicationPending', 'settling', 'settlementFailed'] as const)(
  'refuses prepare, preview and execute in real %s receipt phase without losing evidence or materials', phase => {
    const selection = { recipeId: 'recipes/rune-fusion/el' };
    const request = prepareLiveMaterialAction(selection);
    installPhase(phase);
    const receipt = inspectRecordedWaves();
    const inventory = useInventoryStore.getState(), player = usePlayerStore.getState();
    expect(() => prepareLiveMaterialAction(selection)).toThrow(new RecordedWaveAccessError(phase));
    expect(() => previewLiveMaterialAction(request)).toThrow(new RecordedWaveAccessError(phase));
    expect(() => executeLiveMaterialAction(request)).toThrow(new RecordedWaveAccessError(phase));
    expect(inspectRecordedWaves()).toBe(receipt);
    expect(useInventoryStore.getState()).toBe(inventory); expect(usePlayerStore.getState()).toBe(player);
    expect(inventory.materials).toEqual({ 'runes/el': 3 });
    expect(inventory.materialActionOrdinal).toBe(0); expect(inventory.latestMaterialAction).toBeNull();
  });

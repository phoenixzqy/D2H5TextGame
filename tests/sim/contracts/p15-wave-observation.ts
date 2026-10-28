import assert from 'node:assert/strict';
import type { EarnedWave } from '../production/earned-playback';

/** Only the settled fields read by the classifier; full native waves also qualify. */
export type P15WaveInput = Pick<EarnedWave,
  'index' | 'advanceResult' | 'terminalSimClockMs' | 'rawRewardDelta' | 'actualDelta'> & {
  opening: Pick<EarnedWave['opening'], 'playerTeam' | 'enemyTeam' | 'recordedEvents' | 'currentWavePresentation'>;
  played: Pick<EarnedWave['played'], 'outcome'>;
};

/** Project a settled native wave without retaining repeated inventory snapshots. */
export function observeP15Wave(wave: P15WaveInput) {
  const outcome = wave.played.outcome;
  assert.ok(outcome);
  const hero = wave.opening.playerTeam.find((unit) => unit.kind === 'hero');
  assert.ok(hero);
  const finalHero = outcome.finalPlayerTeam.find((unit) => unit.id === hero.id);
  assert.ok(finalHero);
  const won =
    outcome.winner === 'player' &&
    finalHero.life > 0 &&
    (wave.advanceResult === 'next-wave' || wave.advanceResult === 'victory');
  const mana = wave.opening.recordedEvents.flatMap((event) =>
    event.kind === 'mana' && event.target === hero.id ? [event.mana] : []
  );
  const directDamageBySource: Record<string, number> = {};
  const periodicDamageByTarget: Record<string, number> = {};
  for (const event of wave.opening.recordedEvents) {
    if (event.kind === 'damage' && !event.dodged)
      directDamageBySource[event.source] = (directDamageBySource[event.source] ?? 0) + event.amount;
    if (event.kind === 'dot')
      periodicDamageByTarget[event.target] =
        (periodicDamageByTarget[event.target] ?? 0) + event.amount;
  }
  return {
    index: wave.index,
    presentation: wave.opening.currentWavePresentation,
    initialPlayerTeam: wave.opening.playerTeam,
    initialEnemyTeam: wave.opening.enemyTeam,
    events: wave.opening.recordedEvents,
    outcome,
    advanceResult: wave.advanceResult,
    rawRewardDelta: wave.rawRewardDelta,
    actualDelta: wave.actualDelta,
    metrics: {
      engineWinner: outcome.winner,
      outcome:
        outcome.winner === 'player'
          ? won
            ? 'victory'
            : 'defeat'
          : outcome.winner === 'enemy'
            ? 'defeat'
            : 'draw',
      logicalMs: wave.terminalSimClockMs,
      victoryOnlyTtkMs: won ? wave.terminalSimClockMs : null,
      heroDied: finalHero.life <= 0,
      heroLife: finalHero.life,
      heroMana: finalHero.mana,
      heroEntryLife: hero.life,
      heroEntryMana: hero.mana,
      minimumObservedMana: Math.min(hero.mana, finalHero.mana, ...mana),
      zeroManaObserved: Math.min(hero.mana, finalHero.mana, ...mana) === 0,
      livingEnemies: outcome.finalEnemyTeam
        .filter((unit) => unit.life > 0)
        .map((unit) => ({ id: unit.id, life: unit.life })),
      directDamageBySource,
      periodicDamageByTarget
    }
  };
}
export type P15Wave = ReturnType<typeof observeP15Wave>;

/** Require all planned living-hero wins and final native victory settlement. */
export function isP15CompleteVictory(waves: readonly P15Wave[], totalWaves: number) {
  return (
    totalWaves > 0 &&
    waves.length === totalWaves &&
    waves.at(-1)?.advanceResult === 'victory' &&
    waves.every((wave) => wave.metrics.outcome === 'victory' && !wave.metrics.heroDied)
  );
}


import { expect, it } from 'vitest';
import type { CombatUnit } from '@/engine/combat/types';
import { observeP15Wave, isP15CompleteVictory, type P15WaveInput } from './p15-wave-observation';

/** Constructed classifier controls; no saved fixture, realm or gameplay run. */
function unit(id: string, side: 'player' | 'enemy', kind: NonNullable<CombatUnit['kind']>): CombatUnit {
  return {
    id, name: id, side, kind, level: 1, tier: 'trash',
    stats: {
      life: 100, lifeMax: 100, mana: 50, manaMax: 50, attack: 10, defense: 0, magicResist: 0,
      attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    },
    life: 100, mana: 50, statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [],
    enraged: false, summonedAdds: false
  };
}

function wave(): P15WaveInput {
  const hero = unit('hero', 'player', 'hero');
  const merc = unit('merc', 'player', 'merc');
  const enemy = unit('enemy', 'enemy', 'monster');
  return {
    index: 0, terminalSimClockMs: 2000, advanceResult: 'victory',
    opening: { playerTeam: [hero, merc], enemyTeam: [enemy], recordedEvents: [], currentWavePresentation: null },
    played: { outcome: { winner: 'player', finalPlayerTeam: [hero, merc], finalEnemyTeam: [{ ...enemy, life: 0 }] } },
    rawRewardDelta: { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} },
    actualDelta: { xp: 0, mercXp: {}, materials: {}, currencies: {}, addedItems: [], removedItemIds: [], addedClears: [] }
  };
}

it('does not count a mercenary team win with the original hero dead as a victory or TTK', () => {
  const input = wave();
  const outcome = input.played.outcome;
  if (!outcome) throw new Error('Missing constructed outcome');
  input.played.outcome = {
    ...outcome,
    winner: 'player',
    finalPlayerTeam: outcome.finalPlayerTeam.map(actor => actor.kind === 'hero' ? { ...actor, life: 0 } : actor)
  };
  expect(outcome.finalPlayerTeam.some(actor => actor.kind === 'merc' && actor.life > 0)).toBe(true);
  input.advanceResult = 'defeat';
  const observed = observeP15Wave(input);
  expect(observed.outcome.winner).toBe('player');
  expect(observed.metrics.heroDied).toBe(true);
  expect(observed.metrics.outcome).toBe('defeat');
  expect(observed.metrics.victoryOnlyTtkMs).toBeNull();
  expect(isP15CompleteVictory([observed], 1)).toBe(false);
});

it('requires final native victory even when all observed waves have living-hero team wins', () => {
  const input = wave();
  const won = observeP15Wave(input);
  expect(won.metrics.outcome).toBe('victory');
  expect(won.metrics.victoryOnlyTtkMs).toBe(input.terminalSimClockMs);
  expect(isP15CompleteVictory([won], 1)).toBe(true);
  expect(isP15CompleteVictory([{ ...won, advanceResult: 'defeat' }], 1)).toBe(false);
  expect(isP15CompleteVictory([{ ...won, advanceResult: 'next-wave' }], 1)).toBe(false);
  expect(isP15CompleteVictory([won], 2)).toBe(false);
});

it('retains engine draws separately from native defeat settlement and never awards draw TTK', () => {
  const input = wave();
  const outcome = input.played.outcome;
  if (!outcome) throw new Error('Missing constructed outcome');
  input.played.outcome = { ...outcome, winner: null };
  input.advanceResult = 'defeat';
  const observed = observeP15Wave(input);
  expect(observed.outcome.winner).toBeNull();
  expect(observed.advanceResult).toBe('defeat');
  expect(observed.metrics.outcome).toBe('draw');
  expect(observed.metrics.victoryOnlyTtkMs).toBeNull();
});

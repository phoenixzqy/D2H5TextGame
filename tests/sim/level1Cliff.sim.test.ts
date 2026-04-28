/**
 * Level-1 cliff sim — verifies docs/design/level1-balance.md acceptance gates.
 *
 * 200 seeds × 7 classes vs 3 × L1 Fallen using the new spawn path
 * (`buildMonster`) and the tick scheduler. Pure auto-attack; no skills.
 *
 * Targets:
 *   • Overall win rate ≥ 80 %
 *   • Mean HP remaining (winners) ≥ 30 %
 *   • Median fight virtual-time 8 000–22 000 ms
 *   • Per-class win rate ≥ 70 %
 */
import { describe, it, expect } from 'vitest';
import { runBattle } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { buildMonster } from '@/engine/spawn/buildMonster';
import {
  CHARACTER_CLASSES,
  createMockPlayer,
  type CharacterClass
} from '@/features/character/createMockPlayer';

function playerToCombatUnit(cls: CharacterClass): CombatUnit {
  const p = createMockPlayer(`Test-${cls}`, cls);
  return {
    id: 'player',
    name: p.name,
    side: 'player',
    level: p.level,
    tier: 'trash',
    stats: p.derivedStats,
    life: p.derivedStats.lifeMax,
    mana: p.derivedStats.manaMax,
    statuses: [],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false
  };
}

interface RunStat {
  readonly winner: 'player' | 'enemy' | null;
  readonly hpPctRemaining: number;
  readonly virtualTimeMs: number;
}

function runOne(cls: CharacterClass, seed: number): RunStat {
  const player = playerToCombatUnit(cls);
  const enemies = [0, 1, 2].map((i) =>
    buildMonster('monsters/act1.fallen', 1, 'trash', `e${String(i)}`)
  );
  const result = runBattle({
    seed,
    playerTeam: [player],
    enemyTeam: enemies,
    maxVirtualMs: 60_000
  });
  const finalPlayer = result.playerTeam[0];
  const hpPct = finalPlayer ? finalPlayer.life / finalPlayer.stats.lifeMax : 0;
  return {
    winner: result.winner,
    hpPctRemaining: hpPct,
    virtualTimeMs: result.virtualTimeMs
  };
}

interface ClassReport {
  readonly cls: CharacterClass;
  readonly winRate: number;
  readonly meanHpPct: number;
  readonly medianMs: number;
  readonly p95Ms: number;
  readonly nWins: number;
  readonly n: number;
}

function median(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? 0;
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

function quantile(xs: readonly number[], q: number): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * q));
  return sorted[idx] ?? 0;
}

function aggregate(cls: CharacterClass, runs: readonly RunStat[]): ClassReport {
  const wins = runs.filter((r) => r.winner === 'player');
  const meanHp =
    wins.length === 0
      ? 0
      : wins.reduce((s, r) => s + r.hpPctRemaining, 0) / wins.length;
  const ms = runs.map((r) => r.virtualTimeMs);
  return {
    cls,
    winRate: wins.length / runs.length,
    meanHpPct: meanHp,
    medianMs: median(ms),
    p95Ms: quantile(ms, 0.95),
    nWins: wins.length,
    n: runs.length
  };
}

const N_SEEDS = 200;

describe('L1 cliff fix sim (spec: docs/design/level1-balance.md)', () => {
  it('hits all acceptance gates', () => {
    const reports: ClassReport[] = [];
    for (const cls of CHARACTER_CLASSES) {
      const runs: RunStat[] = [];
      for (let s = 0; s < N_SEEDS; s++) {
        runs.push(runOne(cls, 0xC0FFEE + s));
      }
      reports.push(aggregate(cls, runs));
    }

    const lines = [
      '\n=== L1 CLIFF SIM ===',
      '| Class | WinRate | MeanHP%(W) | MedianMs | P95Ms |',
      '|---|---|---|---|---|',
      ...reports.map(
        (r) =>
          `| ${r.cls} | ${(r.winRate * 100).toFixed(1)}% | ${(r.meanHpPct * 100).toFixed(1)}% | ${String(Math.round(r.medianMs))} | ${String(Math.round(r.p95Ms))} |`
      )
    ];
    // eslint-disable-next-line no-console
    console.log(lines.join('\n'));

    const overallWinRate =
      reports.reduce((s, r) => s + r.nWins, 0) /
      reports.reduce((s, r) => s + r.n, 0);
    const meanHpAcrossClasses =
      reports.reduce((s, r) => s + r.meanHpPct, 0) / reports.length;
    const medianMsOverall = median(reports.map((r) => r.medianMs));
    const minClassWinRate = Math.min(...reports.map((r) => r.winRate));

    expect(overallWinRate).toBeGreaterThanOrEqual(0.8);
    expect(meanHpAcrossClasses).toBeGreaterThanOrEqual(0.3);
    expect(medianMsOverall).toBeGreaterThanOrEqual(8000);
    expect(medianMsOverall).toBeLessThanOrEqual(22000);
    expect(minClassWinRate).toBeGreaterThanOrEqual(0.7);
  });
});

/**
 * Balance simulation: L1 character vs Blood Moor (Map 1, Act 1).
 *
 * Deterministic, seeded. Pure auto-attack only — no skills, no potions.
 * Carries player HP/mana between waves.
 *
 * Run with:  npx vitest run tests/sim/bloodMoor.sim.test.ts
 */
import { describe, it, expect } from 'vitest';
import { runBattle } from '@/engine/combat/combat';
import type { CombatUnit, MonsterTier } from '@/engine/combat/types';
import type { DerivedStats } from '@/engine/types/attributes';
import { createRng } from '@/engine/rng';
import {
  createMockPlayer,
  CHARACTER_CLASSES,
  type CharacterClass
} from '@/features/character/createMockPlayer';
import act1Monsters from '@/data/monsters/act1.json';

interface MonsterArchetype {
  readonly id: string;
  readonly name: string;
  readonly life: readonly number[];
  readonly attackSpeed: number;
  readonly defense: number;
  readonly resistances: Partial<Record<string, number>>;
  readonly skills: readonly string[];
}

function findArchetype(id: string): MonsterArchetype {
  const list = act1Monsters as unknown as readonly MonsterArchetype[];
  const found = list.find((m) => m.id === id);
  if (!found) throw new Error(`monster archetype not found: ${id}`);
  return found;
}

/** Build an enemy CombatUnit. Uses skill `monster-weak-melee` avg (10-15 → 12) for attack;
 * since the monster skill registry isn't loaded in this sim, monsters fall back to basic
 * attack which uses `stats.attack` as a fixed-damage hit. */
function buildMonster(
  archetypeId: string,
  index: number,
  tier: MonsterTier = 'trash'
): CombatUnit {
  const a = findArchetype(archetypeId);
  const lo = a.life[0] ?? 0;
  const hi = a.life[1] ?? lo;
  const lifeAvg = Math.floor((lo + hi) / 2);
  // Use weak-melee average (10-15 = 12) for trash; strong-melee (30-50 = 40) for elites/bosses with strong-melee.
  const useStrong = a.skills.includes('monster-strong-melee');
  const baseAttack = useStrong ? 40 : 12;
  const stats: DerivedStats = {
    life: lifeAvg,
    lifeMax: lifeAvg,
    mana: 0,
    manaMax: 0,
    attack: baseAttack,
    defense: a.defense,
    attackSpeed: a.attackSpeed,
    critChance: 0.05,
    critDamage: 1.5,
    physDodge: 0,
    magicDodge: 0,
    magicFind: 0,
    goldFind: 0,
    resistances: {
      fire: a.resistances.fire ?? 0,
      cold: a.resistances.cold ?? 0,
      lightning: a.resistances.lightning ?? 0,
      poison: a.resistances.poison ?? 0,
      arcane: a.resistances.arcane ?? 0,
      physical: a.resistances.physical ?? 0
    }
  };
  return {
    id: `${archetypeId}-${String(index)}`,
    name: a.name,
    side: 'enemy',
    level: 2,
    tier,
    stats,
    life: lifeAvg,
    mana: 0,
    statuses: [],
    cooldowns: {},
    skillOrder: [], // empty — fallback to basic attack
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false
  };
}

interface Wave {
  readonly id: string;
  readonly enemies: readonly CombatUnit[];
}

function buildBloodMoorWaves(): readonly Wave[] {
  return [
    {
      id: 'w1',
      enemies: [
        buildMonster('monsters/act1.fallen', 0),
        buildMonster('monsters/act1.fallen', 1),
        buildMonster('monsters/act1.fallen', 2),
        buildMonster('monsters/act1.quill-rat', 0)
      ]
    },
    {
      id: 'w2',
      enemies: [
        buildMonster('monsters/act1.fallen', 0),
        buildMonster('monsters/act1.fallen', 1),
        buildMonster('monsters/act1.fallen-shaman', 0),
        buildMonster('monsters/act1.zombie', 0)
      ]
    },
    {
      id: 'w3',
      enemies: [
        buildMonster('monsters/act1.zombie', 0),
        buildMonster('monsters/act1.zombie', 1),
        buildMonster('monsters/act1.quill-rat', 0),
        buildMonster('monsters/act1.quill-rat', 1)
      ]
    }
  ] as const;
}

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
    skillOrder: [], // pure auto-attack
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false
  };
}

interface RunStats {
  readonly survivedW1: boolean;
  readonly survivedW3: boolean;
  readonly turnsW1: number;
  readonly finalLifePct: number;
  /** enemy-attack actions targeting player */
  readonly enemyAttackActions: number;
  /** dodge events where target=player */
  readonly playerDodges: number;
}

function runOneSeed(cls: CharacterClass, seed: number): RunStats {
  let player = playerToCombatUnit(cls);
  const waves = buildBloodMoorWaves();

  let survivedW1 = false;
  let survivedW3 = false;
  let turnsW1 = 0;
  let enemyAttackActions = 0;
  let playerDodges = 0;

  for (let i = 0; i < waves.length; i++) {
    const wave = waves[i];
    if (!wave) break;
    const result = runBattle({
      seed: seed + i * 7919, // distinct per-wave seeds derived deterministically
      playerTeam: [player],
      enemyTeam: wave.enemies,
      maxRounds: 200
    });

    // Tally events
    let lastActor: string | null = null;
    for (const ev of result.events) {
      if (ev.kind === 'action') {
        lastActor = ev.actor;
        if (lastActor !== 'player') enemyAttackActions++;
      } else if (ev.kind === 'damage') {
        if (ev.target === 'player' && ev.dodged) playerDodges++;
      }
    }

    if (i === 0) {
      turnsW1 = result.rounds;
      survivedW1 = result.winner === 'player';
    }
    if (i === 2) {
      survivedW3 = result.winner === 'player';
    }

    if (result.winner !== 'player') {
      // dead; bail on remaining waves
      const finalPlayer = result.playerTeam[0];
      const lifePct = finalPlayer
        ? finalPlayer.life / finalPlayer.stats.lifeMax
        : 0;
      return {
        survivedW1,
        survivedW3,
        turnsW1,
        finalLifePct: lifePct,
        enemyAttackActions,
        playerDodges
      };
    }

    // Carry HP/mana to next wave
    const finalPlayer = result.playerTeam[0];
    if (!finalPlayer) break;
    player = {
      ...player,
      life: finalPlayer.life,
      mana: finalPlayer.mana
    };
  }

  const lifePct = player.life / player.stats.lifeMax;
  return {
    survivedW1,
    survivedW3,
    turnsW1,
    finalLifePct: lifePct,
    enemyAttackActions,
    playerDodges
  };
}

interface Aggregate {
  readonly cls: CharacterClass;
  readonly w1Survival: number;
  readonly w3Survival: number;
  readonly avgTurnsW1: number;
  readonly avgFinalLifePct: number;
  readonly playerDodgeRate: number;
  readonly startHP: number;
  readonly startAttack: number;
  readonly startPhysDodge: number;
}

function aggregate(cls: CharacterClass, runs: readonly RunStats[]): Aggregate {
  const n = runs.length;
  const w1 = runs.filter((r) => r.survivedW1).length / n;
  const w3 = runs.filter((r) => r.survivedW3).length / n;
  const turns =
    runs.reduce((s, r) => s + r.turnsW1, 0) / n;
  const lifePct =
    runs.reduce((s, r) => s + r.finalLifePct, 0) / n;
  const totalEnemyActions = runs.reduce((s, r) => s + r.enemyAttackActions, 0);
  const totalDodges = runs.reduce((s, r) => s + r.playerDodges, 0);
  const dodgeRate = totalEnemyActions > 0 ? totalDodges / totalEnemyActions : 0;

  const sample = playerToCombatUnit(cls);
  return {
    cls,
    w1Survival: w1,
    w3Survival: w3,
    avgTurnsW1: turns,
    avgFinalLifePct: lifePct,
    playerDodgeRate: dodgeRate,
    startHP: sample.stats.lifeMax,
    startAttack: sample.stats.attack,
    startPhysDodge: sample.stats.physDodge
  };
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function tableMd(rows: readonly Aggregate[]): string {
  const header =
    '| Class | HP | Atk | PhysDodge | W1 Survive | W3 Survive | AvgTurns W1 | AvgFinal HP% | ObsDodgeRate |';
  const sep =
    '|---|---|---|---|---|---|---|---|---|';
  const body = rows
    .map(
      (r) =>
        `| ${r.cls} | ${String(r.startHP)} | ${String(r.startAttack)} | ${fmtPct(r.startPhysDodge)} | ${fmtPct(r.w1Survival)} | ${fmtPct(r.w3Survival)} | ${r.avgTurnsW1.toFixed(2)} | ${fmtPct(r.avgFinalLifePct)} | ${fmtPct(r.playerDodgeRate)} |`
    )
    .join('\n');
  return [header, sep, body].join('\n');
}

const N_SEEDS = 200;

describe('Blood Moor balance sim (L1, pure auto-attack)', () => {
  it('runs 200 seeds × 7 classes and emits markdown table', () => {
    // Touch RNG once to confirm seeded path is exercised.
    expect(typeof createRng(1).next()).toBe('number');

    const rows: Aggregate[] = [];
    for (const cls of CHARACTER_CLASSES) {
      const runs: RunStats[] = [];
      for (let s = 1; s <= N_SEEDS; s++) {
        runs.push(runOneSeed(cls, s));
      }
      rows.push(aggregate(cls, runs));
    }

    // eslint-disable-next-line no-console
    console.log('\n=== BLOOD MOOR L1 SIM ===\n' + tableMd(rows) + '\n');

    // We don't fail the test here; sim is observational. Acceptance bar is
    // evaluated by the runner / report.
    expect(rows.length).toBe(7);
  });

  it('Andariel L14 spot check (rough scaling x1.5)', () => {
    const andariel = (() => {
      const a = findArchetype('monsters/act1.andariel');
      const lo = a.life[0] ?? 0;
      const hi = a.life[1] ?? lo;
      const lifeAvg = Math.floor((lo + hi) / 2);
      const stats: DerivedStats = {
        life: lifeAvg,
        lifeMax: lifeAvg,
        mana: 0,
        manaMax: 0,
        attack: 40, // strong-melee avg
        defense: a.defense,
        attackSpeed: a.attackSpeed,
        critChance: 0.05,
        critDamage: 1.5,
        physDodge: 0,
        magicDodge: 0,
        magicFind: 0,
        goldFind: 0,
        resistances: {
          fire: a.resistances.fire ?? 0,
          cold: a.resistances.cold ?? 0,
          lightning: a.resistances.lightning ?? 0,
          poison: a.resistances.poison ?? 0,
          arcane: a.resistances.arcane ?? 0,
          physical: a.resistances.physical ?? 0
        }
      };
      const u: CombatUnit = {
        id: 'andariel',
        name: a.name,
        side: 'enemy',
        level: 14,
        tier: 'boss',
        stats,
        life: lifeAvg,
        mana: 0,
        statuses: [],
        cooldowns: {},
        skillOrder: [],
        activeBuffIds: [],
        enraged: false,
        summonedAdds: false
      };
      return u;
    })();

    const ttks: Record<string, number> = {};
    for (const cls of CHARACTER_CLASSES) {
      const baseP = playerToCombatUnit(cls);
      // Rough x1.5 stat scaling proxy for L14.
      const scaledStats: DerivedStats = {
        ...baseP.stats,
        life: Math.floor(baseP.stats.lifeMax * 1.5),
        lifeMax: Math.floor(baseP.stats.lifeMax * 1.5),
        attack: Math.floor(baseP.stats.attack * 1.5)
      };
      const player: CombatUnit = {
        ...baseP,
        level: 14,
        stats: scaledStats,
        life: scaledStats.lifeMax,
        mana: scaledStats.manaMax
      };

      let total = 0;
      const trials = 20;
      const winners: Record<string, number> = {};
      for (let s = 1; s <= trials; s++) {
        const r = runBattle({
          seed: s,
          playerTeam: [player],
          enemyTeam: [andariel],
          maxRounds: 500
        });
        total += r.rounds;
        const w = r.winner ?? 'draw';
        winners[w] = (winners[w] ?? 0) + 1;
      }
      ttks[cls] = total / trials;
      // eslint-disable-next-line no-console
      console.log(`  ${cls}: avgRounds=${(total / trials).toFixed(1)}  winners=${JSON.stringify(winners)}`);
      ttks[cls] = total / trials;
      // eslint-disable-next-line no-console
      console.log(`  ${cls}: avgRounds=${(total / trials).toFixed(1)}  winners=${JSON.stringify(winners)}`);
    }

    // eslint-disable-next-line no-console
    console.log(
      '\n=== ANDARIEL L14 spot check (avg rounds, x1.5 stat proxy) ===\n' +
        Object.entries(ttks)
          .map(([k, v]) => `${k}: ${v.toFixed(1)}`)
          .join('\n')
    );

    // sanity: combat must not insta-end
    for (const v of Object.values(ttks)) {
      expect(v).toBeGreaterThan(0);
    }
  });
});

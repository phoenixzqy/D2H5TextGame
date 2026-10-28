// UNEXECUTED candidate. Native paid authority/engine; constructed hero resources and timing.
// A failed FIXTURE assertion is not evidence of the proposed Cobra MP regression.
import { afterEach, beforeEach, expect, it } from 'vitest';
import { monsters } from '@/data/index';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import { buildMonsterUnit } from '@/engine/combat/monster-factory';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { deriveStats } from '@/engine/progression/stats';
import { awardXp, xpRequired, xpTotal } from '@/engine/progression/xp';
import { createRng } from '@/engine/rng';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { useFormationStore } from '@/stores/formationStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';

const HERO = 'cobra-native-hero';
const ZOMBIE = 'cobra-native-zombie';
const TIGER = 'skills-assassin-tiger-strike';
const COBRA = 'skills-assassin-cobra-strike';
const CHARGE = 'charge-cobra-strike';
const BUILDER_MS = 1700;
const BASIC_MS = 3400;

function resetStores(): void {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useFormationStore.getState().reset();
  usePlayerStore.getState().reset();
}
beforeEach(() => { resetStores(); resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetStores(); resetRegistry(); loadDefaultSkills(); });

function fixture(): CombatSnapshot {
  const base = createMockPlayer('Constructed Cobra recovery', 'assassin');
  const rewards = awardXp(0, xpTotal(30));
  expect(rewards).toMatchObject({ level: 30, levelsGained: 29,
    statPointsGranted: 145, skillPointsGranted: 31 });
  usePlayerStore.getState().setPlayer({ ...base, id: HERO, level: 30,
    experience: 0, experienceToNextLevel: xpRequired(30),
    derivedStats: deriveStats(base.coreStats, 30),
    statPoints: rewards.statPointsGranted, skillPoints: base.skillPoints + rewards.skillPointsGranted,
    skills: [], skillLevels: {}, comboOrder: [], equipment: [] });
  expect(usePlayerStore.getState().allocateSkillPoint(COBRA)).toBe('prereq-missing');
  expect(usePlayerStore.getState().allocateSkillPoint(TIGER)).toBe('ok');
  expect(usePlayerStore.getState().allocateSkillPoint(COBRA)).toBe('ok');
  usePlayerStore.getState().setComboOrder([COBRA]);
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('FIXTURE: real player store lost player');
  expect(player.skillLevels).toEqual({ 'assassin.tiger_strike': 1, 'assassin.cobra_strike': 1 });
  expect(player.skillPoints).toBe(30);
  expect(player.comboOrder).toEqual([COBRA]);
  expect(player.equipment).toEqual([]);
  const native = playerToCombatUnit(player);
  expect(native.kind).toBe('hero');
  expect(native.assassinMartialRanks).toEqual({ 'assassin.cobra_strike': 1 });
  expect(native.skillOrder).toEqual([COBRA]);
  expect(native.basicAttack).toBeUndefined();
  expect(native.attackRange).toBeUndefined();

  // Deliberately constructed observation layer, not an earned/public character.
  // Native authority above is unchanged. Future self-Stun stops actions after two attempts;
  // the ordinary simulator still runs to its native end/cap, and the enemy stays untouched.
  const stop: ActiveStatus = { id: 'stun', sourceId: 'constructed-observation-stop',
    stacks: 1, remaining: -1, appliedAtMs: BASIC_MS + 1 };
  const hero: CombatUnit = { ...native, life: 10000, mana: 9,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    manaRegenCarry: 0, manaRegenCompensation: 0, manaRegenExactCarry: '0',
    statuses: [stop], stats: { ...native.stats, life: 10000, lifeMax: 20000, mana: 9, manaMax: 100,
      attack: 100, attackSpeed: 100, defense: 0, magicResist: 0,
      physDodge: 0, magicDodge: 0, critChance: 0, critDamage: 2,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };

  const def = monsters.find(row => row.id === 'monsters/act1.zombie');
  if (!def) throw new Error('FIXTURE: authored zombie missing');
  const authoredBefore = structuredClone(def);
  const zombie = buildMonsterUnit({ def, level: 30, tier: 'trash', rng: createRng(7), id: ZOMBIE });
  expect(def).toEqual(authoredBefore);
  expect(zombie).toMatchObject({ id: ZOMBIE, monsterArchetypeId: def.id,
    kind: 'monster', tier: 'trash', level: 30, mana: 0,
    stats: { mana: 0, manaMax: 0 }, statuses: [] });
  expect(zombie.skillOrder).toEqual(def.skills);
  // Pass the factory result directly: no enemy resource/stat/skill/status overrides.
  return { seed: 7, playerTeam: [hero], enemyTeam: [zombie] };
}

function observeFixedFixture() {
  const input = fixture();
  const hero = input.playerTeam[0], zombie = input.enemyTeam[0];
  if (!hero || !zombie) throw new Error('FIXTURE: missing combatant');
  const before = structuredClone(input);
  const out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(input).toEqual(before);
  const actions = out.events.filter(e => e.kind === 'action').filter(e => e.actor === HERO);
  expect(actions.map(e => [e.skillId, e.simClockMs])).toEqual([
    ['assassin.cobra_strike', BUILDER_MS], [null, BASIC_MS]
  ]);
  // Both insufficient MP and the native 2s cooldown apply at the second action.
  // This proves paid builder -> basic consumption, not the exclusive cause of fallback.
  const paid = out.events.filter(e => e.kind === 'mana').filter(e => e.reason === 'cast');
  expect(paid).toEqual([expect.objectContaining({ target: HERO, mana: 0, simClockMs: BUILDER_MS })]);
  const hits = out.events.filter(e => e.kind === 'damage').filter(e => e.target === ZOMBIE);
  expect(hits).toHaveLength(2); // No extra Cobra damage.
  const builder = hits[0], basic = hits[1];
  if (!builder || !basic) throw new Error('FIXTURE: missing builder/basic hit');
  expect(builder).toMatchObject({ source: HERO, simClockMs: BUILDER_MS, damageType: 'physical', dodged: false });
  expect(basic).toMatchObject({ source: HERO, simClockMs: BASIC_MS, damageType: 'physical', dodged: false });
  expect(builder.amount).toBeGreaterThan(0);
  expect(basic.amount).toBeGreaterThan(0);
  expect(out.events.some(e => e.kind === 'heal' && e.target === ZOMBIE)).toBe(false);
  expect(out.events.some(e => e.kind === 'dot' && e.target === ZOMBIE)).toBe(false);
  expect(out.events.some(e => e.kind === 'life-capacity' && e.target === ZOMBIE)).toBe(false);
  const builderRemoved = Math.min(zombie.life, builder.amount);
  const victimLifeBeforeBasic = zombie.life - builderRemoved;
  expect(victimLifeBeforeBasic).toBeGreaterThan(0);
  // Damage amounts may include overkill: H is capped by actual pre-hit hostile life.
  const hpRemoved = Math.min(victimLifeBeforeBasic, basic.amount);
  expect(hpRemoved).toBeGreaterThanOrEqual(10);
  const finalZombie = out.result.enemyTeam.find(unit => unit.id === ZOMBIE);
  const finalHero = out.result.playerTeam.find(unit => unit.id === HERO);
  if (!finalZombie || !finalHero) throw new Error('FIXTURE: missing result combatant');
  expect(finalZombie.life).toBe(victimLifeBeforeBasic - hpRemoved);
  expect(finalZombie.life).toBeGreaterThan(0); // Keep this primary case free of orb closure.
  expect(finalHero.life).toBeGreaterThan(0);
  expect(out.events.some(e => e.kind === 'death' && e.target === HERO)).toBe(false);
  expect(out.events.some(e => e.kind === 'orb')).toBe(false);
  expect(finalZombie).toMatchObject({ mana: 0, stats: { mana: 0, manaMax: 0 } });
  expect(out.events.filter(e => e.kind === 'mana').filter(e => e.target === ZOMBIE)).toEqual([]);
  const gainIndex = out.events.findIndex(e => e.kind === 'status-state' && e.target === HERO &&
    e.simClockMs === BUILDER_MS && e.statuses.some(s => s.id === CHARGE && s.stacks === 1));
  const basicIndex = out.events.indexOf(basic);
  expect(gainIndex).toBeGreaterThan(out.events.indexOf(builder));
  expect(gainIndex).toBeLessThan(basicIndex);
  expect(out.events.slice(basicIndex + 1).some(e => e.kind === 'status-state' && e.target === HERO &&
    e.simClockMs === BASIC_MS && !e.statuses.some(s => s.id === CHARGE))).toBe(true);
  expect(out.events.filter(e => e.kind === 'heal').filter(e => e.target === HERO)).toEqual([
    expect.objectContaining({ amount: Math.floor(hpRemoved * 0.1), simClockMs: BASIC_MS })
  ]); // Existing HP recovery corroborates actual one-stack consumption independently of new MP.
  const otherMana = out.events.filter(e => e.kind === 'mana').filter(e => e.reason !== 'cobra-strike');
  expect(otherMana).toEqual(paid); // Zero regen; no orb/refund/other restoration.
  const prefix = out.events.slice(0, basicIndex);
  expect(prefix.some(e => e.kind === 'heal' && e.target === HERO)).toBe(false);
  expect(prefix.some(e => e.kind === 'mana' && e.reason === 'cobra-strike')).toBe(false);
  const manaBeforeBasic = paid[0]?.mana;
  expect(manaBeforeBasic).toBe(0);
  if (manaBeforeBasic === undefined) throw new Error('FIXTURE: missing paid mana observation');
  const missingMana = hero.stats.manaMax - manaBeforeBasic;
  expect(missingMana).toBeGreaterThan(0);
  const expectedRecovery = Math.max(0, Math.min(missingMana, Math.floor(hpRemoved * 0.1 * 1)));
  expect(expectedRecovery).toBeGreaterThan(0);
  return { out, finalHero, hpRemoved, manaBeforeBasic, expectedRecovery };
}

it('FIXTURE: fixed authored factory zombie supports native paid Cobra and one consumed basic pool', () => {
  observeFixedFixture();
});

it('RED: generates caster-only absolute Cobra MP from actual HP removed against an authored mana-free zombie', () => {
  const { out, finalHero, manaBeforeBasic, expectedRecovery } = observeFixedFixture();
  const recovery = out.events.filter(e => e.kind === 'mana').filter(e => e.reason === 'cobra-strike');
  // FIRST new-policy assertion. Current victim-capped code is expected to emit [], not this one credit.
  // Count as genuine RED only if every preceding FIXTURE assertion passed unchanged.
  expect(recovery).toEqual([expect.objectContaining({ target: HERO,
    mana: manaBeforeBasic + expectedRecovery, simClockMs: BASIC_MS })]);
  expect(finalHero.mana).toBe(manaBeforeBasic + expectedRecovery);
});

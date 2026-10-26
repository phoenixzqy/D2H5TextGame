import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { playerToCombatUnit } from '@/stores/combatHelpers';

beforeEach(() => {
  resetRegistry();
  loadDefaultSkills();
});
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});
/** Unearned pools and cadence isolate the original paid native targeting reproduction. */
function fixture(slug: 'confuse' | 'attract', rank: number): CombatSnapshot {
  const id = 'skills-necromancer-' + slug;
  const native = playerToCombatUnit({
    ...createMockPlayer('Synthetic native target curse', 'necromancer'),
    level: 30,
    skillLevels: {
      'skills-necromancer-dim-vision': 1,
      'skills-necromancer-confuse': 1,
      [id]: rank
    },
    comboOrder: [id]
  });
  const hero: CombatUnit = {
    ...native,
    id: 'hero',
    life: 100000,
    mana: slug === 'attract' ? 17 : rank === 20 ? 8 : 13,
    manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0,
    statuses: [{ id: 'stun', sourceId: 'hold', stacks: 1, remaining: -1, appliedAtMs: 401 }],
    stats: {
      ...native.stats,
      life: 100000,
      lifeMax: 100000,
      mana: 100,
      manaMax: 100,
      attack: 0,
      attackSpeed: 263,
      defense: 0,
      magicResist: 0,
      critChance: 0,
      critDamage: 1.5,
      physDodge: 0,
      magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 }
    }
  };
  const enemy = (id: string): CombatUnit => ({
    ...hero,
    id,
    side: 'enemy',
    kind: 'monster',
    tier: 'trash',
    mana: 0,
    skillOrder: [],
    skillLevels: {},
    activeBuffIds: [],
    statuses: [{ id: 'stun', sourceId: 'hold', stacks: 1, remaining: -1, appliedAtMs: 4501 }],
    stats: { ...hero.stats, attackSpeed: 250, attack: 100 }
  });
  return { seed: 1, playerTeam: [hero], enemyTeam: [enemy('monster-a'), enemy('monster-b')] };
}
for (const slug of ['confuse', 'attract'] as const)
  it.each([1, 20])(
    'native paid ' + slug + ' rank%i redirects real monster attacks to other monsters',
    (rank) => {
      const input = fixture(slug, rank),
        before = structuredClone(input),
        paid = runBattleRecorded(input);
      const control = runBattleRecorded({
        ...input,
        playerTeam: input.playerTeam.map((hero) => ({
          ...hero,
          statuses: [{ id: 'stun', sourceId: 'hold', stacks: 1, remaining: -1 }]
        }))
      });
      expect(paid.events.filter((e) => e.kind === 'action' && e.actor === 'hero')).toEqual([
        expect.objectContaining({ skillId: 'necromancer.' + slug, simClockMs: 400 })
      ]);
      expect(paid.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([
        expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 400 })
      ]);
      const applications = paid.events.filter((e) => e.kind === 'status' && e.statusId === slug);
      expect(applications).toHaveLength(slug === 'confuse' ? 2 : 1);
      expect(applications.every((e) => e.simClockMs === 400)).toBe(true);
      const friendly = paid.events.filter(
        (e) =>
          e.kind === 'damage' && e.source.startsWith('monster-') && e.target.startsWith('monster-')
      );
      const loss = (out: typeof paid) => 100000 - (out.result.playerTeam[0]?.life ?? 0);
      expect(loss(control)).toBe(1600);
      expect(loss(paid)).toBe(slug === 'confuse' ? 600 : 1100);
      expect(friendly).toHaveLength(slug === 'confuse' ? 12 : 6);
      expect(friendly.reduce((sum, e) => sum + (e.kind === 'damage' ? e.amount : 0), 0)).toBe(
        slug === 'confuse' ? 1000 : 500
      );
      expect(paid.result.enemyTeam.reduce((sum, enemy) => sum + 100000 - enemy.life, 0)).toBe(
        slug === 'confuse' ? 1000 : 500
      );
      const cadence = (out: typeof paid) =>
        out.events
          .filter((e) => e.kind === 'action' && e.actor.startsWith('monster-'))
          .map((e) => [e.kind === 'action' ? e.actor : '', e.simClockMs]);
      expect(cadence(paid)).toEqual(cadence(control));
      for (const actor of ['monster-a', 'monster-b'])
        expect(
          paid.events.flatMap((e) =>
            e.kind === 'action' && e.actor === actor ? [e.simClockMs] : []
          )
        ).toEqual([500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500]);
      expect(input).toEqual(before);
      expect(runBattle(input)).toEqual(paid.result);
      expect(runBattleRecorded(input)).toEqual(paid);
    }
  );
it('refuses unavailable native class/level/prerequisite/rank ownership', () => {
  for (const slug of ['confuse', 'attract'] as const) {
    const id = 'skills-necromancer-' + slug;
    const owner = {
      ...createMockPlayer('Authority control', 'necromancer'),
      level: 30,
      skillLevels: { 'skills-necromancer-dim-vision': 1, 'skills-necromancer-confuse': 1, [id]: 1 },
      comboOrder: [id]
    };
    expect(playerToCombatUnit(owner).skillOrder).toEqual([id]);
    for (const patch of [
      { class: 'barbarian' as const },
      { level: 1 },
      { skillLevels: {} },
      ...[0, -1, 1.5, 21, NaN, Infinity].map((rank) => ({
        skillLevels: { ...owner.skillLevels, [id]: rank }
      }))
    ])
      expect(playerToCombatUnit({ ...owner, ...patch }).skillOrder).toEqual([]);
  }
});
it('poor-MP control cannot pay or apply either target curse', () => {
  for (const slug of ['confuse', 'attract'] as const) {
    const input = fixture(slug, 1),
      out = runBattleRecorded({
        ...input,
        playerTeam: input.playerTeam.map((hero) => ({ ...hero, mana: 0 }))
      });
    expect(out.events.some((e) => e.kind === 'action' && e.skillId === 'necromancer.' + slug)).toBe(
      false
    );
    expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    expect(out.events.filter((e) => e.kind === 'status' && e.statusId === slug)).toEqual([]);
  }
});

for (const slug of ['confuse', 'attract'] as const)
  it('native paid ' + slug + ' keeps a lone enemy attacking ordinary hostiles', () => {
    const input = fixture(slug, 1),
      single = { ...input, enemyTeam: input.enemyTeam.slice(0, 1) },
      before = structuredClone(single);
    const paid = runBattleRecorded(single);
    expect(paid.events.filter((e) => e.kind === 'action' && e.actor === 'hero')).toEqual([
      expect.objectContaining({ skillId: 'necromancer.' + slug, simClockMs: 400 })
    ]);
    expect(paid.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 400 })
    ]);
    expect(paid.events.filter((e) => e.kind === 'status' && e.statusId === slug)).toEqual([
      expect.objectContaining({ target: 'monster-a', simClockMs: 400 })
    ]);
    const attacks = paid.events.filter((e) => e.kind === 'action' && e.actor === 'monster-a');
    expect(attacks.map((e) => e.simClockMs)).toEqual([
      500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500
    ]);
    const damage = paid.events.filter((e) => e.kind === 'damage' && e.source === 'monster-a');
    expect(damage).toHaveLength(9);
    expect(damage.every((e) => e.kind === 'damage' && e.target === 'hero')).toBe(true);
    expect(paid.result.playerTeam[0]?.life).toBeLessThan(100000);
    expect(paid.result.enemyTeam[0]?.life).toBe(100000);
    expect(single).toEqual(before);
    expect(runBattle(single)).toEqual(paid.result);
    expect(runBattleRecorded(single)).toEqual(paid);
  });

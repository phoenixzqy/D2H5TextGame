import { afterEach, beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/amazon.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import {
  loadDefaultSkills,
  resetRegistry,
  getSkill,
  registerSkill
} from '@/engine/skills/registry';
import type { Item } from '@/engine/types/items';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useFormationStore } from '@/stores/formationStore';

const hold = (appliedAtMs = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'synthetic-hold',
  stacks: 1,
  remaining: -1,
  appliedAtMs
});
function owner(slug: string, rank = 1) {
  const levels: Record<string, number> = {};
  function add(id: string) {
    const row = rows.find((row) => row.id === id);
    if (!row) throw new Error('Missing Amazon prerequisite');
    for (const prerequisite of row.prerequisites ?? []) add(prerequisite);
    levels[id] = 1;
  }
  const id = 'skills-amazon-' + slug;
  add(id);
  levels[id] = rank;
  return {
    ...createMockPlayer('Synthetic native Decoy body regression', 'amazon'),
    id: 'hero',
    level: 30,
    skillLevels: levels,
    comboOrder: [id]
  };
}
/** Real canonical equip/projection; isolated pools and cadence are not earned balance. */
function fixture(slug: string, rank = 1): CombatSnapshot {
  const player = owner(slug, rank);
  usePlayerStore.getState().setPlayer({ ...player, skillLevels: {}, skillPoints: 29 });
  for (const [id, points] of Object.entries(player.skillLevels))
    for (let point = 0; point < points; point++)
      expect(usePlayerStore.getState().allocateSkillPoint(id)).toBe('ok');
  expect(usePlayerStore.getState().player?.skillPoints).toBe(
    29 - Object.values(player.skillLevels).reduce((a, b) => a + b, 0)
  );
  const bow: Item = {
    id: 'support-diagnostic-bow',
    baseId: 'items/base/weapon-bow-training',
    rarity: 'normal',
    level: 1,
    ilvl: 1,
    baseRolls: { attack: 13 },
    identified: true,
    equipped: false
  };
  useInventoryStore.getState().addItem(bow);
  expect(useInventoryStore.getState().equipItem(bow)).toEqual({ ok: true });
  const current = usePlayerStore.getState().player;
  if (!current) throw new Error('Missing native Amazon');
  const native = playerToCombatUnit(current);
  expect(native.equippedWeapon?.weaponType).toBe('bow');
  const hero: CombatUnit = {
    ...native,
    life: 2000,
    mana: 100,
    manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0,
    statuses: [hold(1701)],
    stats: {
      ...native.stats,
      life: 2000,
      lifeMax: 2000,
      mana: 100,
      manaMax: 100,
      attack: 1,
      attackSpeed: 100,
      defense: 0,
      magicResist: 0,
      critChance: 0,
      critDamage: 1.5,
      physDodge: 0,
      magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    }
  };
  const target: CombatUnit = {
    ...hero,
    id: 'target',
    side: 'enemy',
    kind: 'monster',
    tier: 'trash',
    mana: 0,
    skillOrder: [],
    skillLevels: {},
    statuses: [hold()],
    gridPosition: { row: 0, col: 0 }
  };
  return {
    seed: 7,
    playerTeam: [hero],
    enemyTeam: [target, { ...target, id: 'reserve', gridPosition: { row: 2, col: 2 } }]
  };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input),
    out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  return out;
}
beforeEach(() => {
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useFormationStore])
    store.getState().reset();
  resetRegistry();
  loadDefaultSkills();
});
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});

const canonical = 'amazon.decoy';
function damageEvents(out: ReturnType<typeof record>) {
  return out.events.filter((e): e is Extract<typeof e, { kind: 'damage' }> => e.kind === 'damage');
}
function bodies(out: ReturnType<typeof record>) {
  return out.result.playerTeam.filter((unit) => unit.summonTemplateId === 'decoy');
}
function prepared(input: CombatSnapshot) {
  const out = record(input),
    body = bodies(out).find((unit) => unit.id !== 'hero-summon-decoy-1-preloaded');
  if (!body) throw new Error('Missing actual paid Decoy');
  return { out, body };
}
for (const rank of [1, 20]) {
  it(`native paid rank${String(rank)} Decoy is inert and expires exactly once without replacement/refund`, () => {
    const { out, body } = prepared(fixture('decoy', rank)),
      cost = rank === 1 ? 15 : 13,
      deadline = rank === 1 ? 8000 : 17500;
    expect(bodies(out)).toHaveLength(1);
    const spawns = out.events.filter((e) => e.kind === 'summon' && e.summonId === 'decoy');
    expect(spawns).toHaveLength(1);
    expect(spawns[0]).toMatchObject({
      owner: 'hero',
      simClockMs: 0,
      unit: { id: body.id, life: rank === 1 ? 200 : 580 }
    });
    expect(out.events.filter((e) => e.kind === 'action' && e.skillId === canonical)).toEqual([
      expect.objectContaining({ actor: 'hero', simClockMs: 0 })
    ]);
    expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 100 - cost, simClockMs: 0 })
    ]);
    expect(out.events.filter((e) => e.kind === 'action' && e.actor === body.id)).toEqual([]);
    expect(out.events.filter((e) => e.kind === 'damage' && e.source === body.id)).toEqual([]);
    expect(out.events.filter((e) => e.kind === 'death' && e.target === body.id)).toEqual([
      expect.objectContaining({ simClockMs: deadline })
    ]);
    expect(out.result.playerTeam[0]?.mana).toBe(100 - cost);
  });
  it(`rank${String(rank)} insufficient preparation never retries after real mana recovery`, () => {
    const input = fixture('decoy', rank),
      hero = input.playerTeam[0];
    if (!hero) throw new Error('Missing owner');
    const out = record({
      ...input,
      playerTeam: [{ ...hero, mana: (rank === 1 ? 15 : 13) - 1, manaRegenPerSecond: 20 }]
    });
    expect(bodies(out)).toEqual([]);
    expect(out.events.some((e) => e.kind === 'action' && e.skillId === canonical)).toBe(false);
    expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    expect(out.result.playerTeam[0]?.mana).toBe(100);
  });
}
it('draws real hostile hits until body death, then returns targeting to the hero', () => {
  const input = fixture('decoy'),
    hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing owner');
  const active = {
    ...input,
    playerTeam: [{ ...hero, statuses: [hold()] }],
    enemyTeam: input.enemyTeam.map((unit) => ({
      ...unit,
      statuses: [],
      stats: { ...unit.stats, attack: 100 }
    }))
  };
  const { out, body } = prepared(active),
    death = out.events.find((e) => e.kind === 'death' && e.target === body.id);
  if (!death) throw new Error('Missing Decoy death');
  const hits = damageEvents(out).filter((e) => ['target', 'reserve'].includes(e.source));
  expect(hits.length).toBeGreaterThan(3);
  expect(
    hits.filter((e) => e.simClockMs < death.simClockMs).every((e) => e.target === body.id)
  ).toBe(true);
  expect(hits.some((e) => e.target === 'hero' && e.simClockMs >= death.simClockMs)).toBe(true);
  expect(out.events.filter((e) => e.kind === 'summon' && e.summonId === 'decoy')).toHaveLength(1);
});
it('respects explicit valid Taunt ahead of Decoy distraction', () => {
  const input = fixture('decoy');
  const first = input.enemyTeam[0];
  if (!first) throw new Error('Missing enemy');
  const { out, body } = prepared({
    ...input,
    enemyTeam: [
      {
        ...first,
        statuses: [
          {
            id: 'taunt',
            sourceId: 'hero',
            stacks: 1,
            remaining: 10,
            appliedAtMs: 0,
            expiresAtMs: 10000
          }
        ],
        stats: { ...first.stats, attack: 1 }
      }
    ]
  });
  const hit = damageEvents(out).find((e) => e.source === first.id);
  expect(hit).toMatchObject({ target: 'hero' });
  expect(hit?.target).not.toBe(body.id);
});
it('deduplicates aliases and overwrites only its carried cooldown for paid new-wave preparation', () => {
  const input = fixture('decoy'),
    hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing owner');
  const { out } = prepared({
    ...input,
    playerTeam: [
      {
        ...hero,
        skillOrder: ['skills-amazon-decoy', canonical],
        cooldowns: { [canonical]: 99000, other: 99000 }
      }
    ]
  });
  expect(bodies(out)).toHaveLength(1);
  expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  expect(out.result.playerTeam[0]?.cooldowns.other).toBeGreaterThan(0);
});
it('bare/preloaded body markers do not block preparation or receive paid lifetime authority', () => {
  const input = fixture('decoy'),
    hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing owner');
  const preloaded = {
    ...hero,
    id: 'hero-summon-decoy-1',
    kind: 'summon' as const,
    summon: true,
    summonOwnerId: hero.id,
    summonTemplateId: 'decoy',
    summonRefundOnDeath: false,
    skillOrder: [],
    statuses: [hold()]
  };
  const out = record({ ...input, playerTeam: [hero, preloaded] });
  expect(bodies(out)).toHaveLength(2);
  const spawns = out.events.filter((e) => e.kind === 'summon' && e.summonId === 'decoy');
  expect(spawns).toHaveLength(1);
  expect(spawns[0]).toMatchObject({ unit: { id: 'hero-summon-decoy-2' } });
  expect(out.events.filter((e) => e.kind === 'death' && e.target === preloaded.id)).toEqual([]);
});
it('refuses malformed paid registry sources without falling back to an ordinary marker cast', () => {
  const input = fixture('decoy'),
    source = getSkill(canonical);
  if (!source) throw new Error('Missing Decoy');
  registerSkill({ ...source, manaCost: 0 });
  const out = record(input);
  expect(bodies(out)).toEqual([]);
  expect(out.events.filter((e) => e.kind === 'action' && e.skillId === canonical)).toEqual([]);
});
it('unselected,unlearned,borrowed and terminal native sources never prepare', () => {
  const input = fixture('decoy'),
    hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing owner');
  for (const patch of [
    { skillOrder: [] },
    { decoyRank: 0 },
    { skillLevels: {} },
    { kind: 'merc' as const },
    { side: 'enemy' as const },
    { life: 0 }
  ]) {
    const out = record({ ...input, playerTeam: [{ ...hero, ...patch }] });
    expect(bodies(out)).toEqual([]);
    expect(out.events.filter((e) => e.kind === 'action' && e.skillId === canonical)).toEqual([]);
  }
  const out = record({ ...input, enemyTeam: [] });
  expect(bodies(out)).toEqual([]);
});

it('expires before an enemy attack at the exact half-open lifetime endpoint', () => {
  const input = fixture('decoy'),
    hero = input.playerTeam[0],
    enemy = input.enemyTeam[0];
  if (!hero || !enemy) throw new Error('Missing native fixture');
  const { out, body } = prepared({
    ...input,
    playerTeam: [{ ...hero, statuses: [hold()] }],
    enemyTeam: [{ ...enemy, statuses: [], stats: { ...enemy.stats, attack: 1, attackSpeed: 0 } }]
  });
  const hits = damageEvents(out).filter((e) => e.source === enemy.id);
  expect(hits.slice(0, 4).map((e) => [e.simClockMs, e.target])).toEqual([
    [2000, body.id],
    [4000, body.id],
    [6000, body.id],
    [8000, 'hero']
  ]);
  const death = out.events.findIndex((e) => e.kind === 'death' && e.target === body.id);
  const hit = out.events.findIndex(
    (e) => e.kind === 'damage' && e.source === enemy.id && e.simClockMs === 8000
  );
  expect(death).toBeGreaterThanOrEqual(0);
  expect(death).toBeLessThan(hit);
});
it('does not redirect all-enemy attacks away from the hero and closes owner-death orphans once', () => {
  const input = fixture('decoy', 20),
    hero = input.playerTeam[0],
    enemy = input.enemyTeam[0];
  if (!hero || !enemy) throw new Error('Missing native fixture');
  registerSkill({
    id: 'synthetic-decoy-aoe',
    archetype: 'monster',
    trigger: 'active',
    target: 'all-enemies',
    minLevel: 1,
    manaCost: 0,
    cooldown: 1,
    effects: [{ kind: 'damage', damageType: 'physical', alwaysHits: true, base: [100, 100] }]
  });
  const { out, body } = prepared({
    ...input,
    playerTeam: [{ ...hero, life: 1, statuses: [hold()] }],
    enemyTeam: [{ ...enemy, statuses: [], skillOrder: ['synthetic-decoy-aoe'] }]
  });
  expect(
    out.events.some(
      (e) => e.kind === 'damage' && e.source === enemy.id && e.target === 'hero' && e.amount > 0
    )
  ).toBe(true);
  expect(out.events.filter((e) => e.kind === 'death' && e.target === body.id)).toEqual([
    expect.objectContaining({ simClockMs: 1700 })
  ]);
  expect(out.events.filter((e) => e.kind === 'death' && e.target === 'hero')).toEqual([
    expect.objectContaining({ simClockMs: 1700 })
  ]);
  expect(out.result.winner).toBe('enemy');
});
it('keeps A-B-A recordings identical with immutable inputs and separate paid body identity', () => {
  const input = fixture('decoy'),
    first = record(input);
  record({ ...input, seed: 88 });
  expect(record(input)).toEqual(first);
});

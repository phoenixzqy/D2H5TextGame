import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import skills from '@/data/skills/assassin.json';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const cases = [
  { slug: 'fire-blast', first: 51, growth: 5 },
  { slug: 'fists-of-fire', first: 46, growth: 5 },
  { slug: 'dragon-tail', first: 71, growth: 120 },
  { slug: 'wake-of-fire', first: 61, growth: 5 },
  { slug: 'wake-of-inferno', first: 92, growth: 7 },
  { slug: 'phoenix-strike', first: 123, growth: 12 }
] as const;
const targetLife = (slug: string) => slug === 'dragon-tail' ? 10000 : 2000;
const id = (slug: string) => 'skills-assassin-' + slug;
const canonical = (slug: string) => 'assassin.' + slug.replaceAll('-', '_');
const hold = (at = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'synthetic-hold',
  stacks: 1,
  remaining: -1,
  appliedAtMs: at
});
function fixture(slug: string, rank = 1, seed = 7) {
  const selected = skills.find((s) => s.id === id(slug));
  if (!selected) throw new Error('Missing actual Assassin Fire source');
  const mana = selected.cost?.mana;
  if (mana === undefined) throw new Error('Missing authored Assassin Fire mana');
  const levels: Record<string, number> = {};
  const add = (key: string) => {
    const s = skills.find((row) => row.id === key);
    if (!s) throw new Error('Missing actual prerequisite');
    levels[key] = key === selected.id ? rank : 1;
    for (const prerequisite of s.prerequisites ?? []) add(prerequisite);
  };
  add(selected.id);
  const player = {
    ...createMockPlayer('Synthetic Assassin Fire', 'assassin'),
    id: 'hero',
    level: 30,
    comboOrder: [selected.id],
    skillLevels: levels
  };
  const native = playerToCombatUnit(player);
  const hero: CombatUnit = {
    ...native,
    life: 2000,
    mana,
    manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0,
    statuses: [hold(1701)],
    stats: {
      ...native.stats,
      lifeMax: 2000,
      manaMax: 100,
      attackSpeed: 100,
      attack: 100,
      defense: 0,
      magicResist: 0,
      physDodge: 0,
      magicDodge: 0,
      critChance: 0,
      critDamage: 2,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    }
  };
  const target: CombatUnit = {
    ...hero,
    id: 'target',
    life: targetLife(slug),
    stats: { ...hero.stats, lifeMax: targetLife(slug) },
    side: 'enemy',
    kind: 'monster',
    tier: 'trash',
    mana: 0,
    skillOrder: [],
    skillLevels: {},
    assassinMartialRanks: {},
    assassinTrapRanks: {},
    activeBuffIds: [],
    statuses: [hold()]
  };
  return {
    player,
    native,
    selected,
    mana,
    input: { seed, playerTeam: [hero], enemyTeam: [target] } satisfies CombatSnapshot
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
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useFormationStore.getState().reset();
  resetRegistry();
  loadDefaultSkills();
});
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});

for (const s of cases) {
  const trap = s.slug === 'wake-of-fire' || s.slug === 'wake-of-inferno';
  it.each([1, 2, 20])(
    `BUG205 actual native ${s.slug} rank%i removes exact periodic HP from its Fire hit`,
    (rank) => {
      const f = fixture(s.slug, rank),
        before = structuredClone(f.player),
        out = record(f.input);
      expect(f.native.skillOrder).toEqual([id(s.slug)]);
      expect(f.native.skillLevels?.[canonical(s.slug)]).toBe(rank);
      const hits = out.events.filter((e) => e.kind === 'damage');
      const total = s.first + s.growth * (rank - 1),
        phoenix = s.slug === 'phoenix-strike';
      const pulseBases = s.slug === 'wake-of-fire' ? [61, 70, 78] : [92, 106, 119];
      const expectedDirect = trap
        ? pulseBases.map(base => ['fire', base + s.growth * (rank - 1)])
        : phoenix
          ? [['fire', total / 3], ['cold', total / 3], ['lightning', total / 3]]
          : [['fire', total]];
      expect(hits.map((e) => [e.damageType, e.amount])).toEqual(
        expectedDirect
      );
      if (trap) expect(hits.map(e => e.simClockMs)).toEqual([1700, 2700, 3700]);
      const fire = phoenix ? total / 3 : total,
        // Existing Ignite keeps first-hit potency and refreshes the entire stack.
        // Three pulses give 5 + 4 + 3 stack-seconds through the last expiry.
        periodic = (trap ? 12 : 3) * Math.max(1, Math.floor(fire * 0.1));
      const dots = out.events.filter((e) => e.kind === 'dot');
      expect(dots.reduce((n, e) => n + e.amount, 0)).toBe(periodic);
      expect(dots.every((e) => e.target === 'target')).toBe(true);
      expect(
        out.events.some(
          (e) =>
            e.kind === 'status-state' &&
            e.target === 'target' &&
            e.statuses.some(
              (status) =>
                status.id === 'ignite' &&
                status.sourceId === 'hero' &&
                status.dotPerStack === Math.max(1, Math.floor(fire * 0.1))
            )
        )
      ).toBe(true);
      const directTotal = trap ? pulseBases.reduce((sum, base) => sum + base + s.growth * (rank - 1), 0) : total;
      expect(out.result.enemyTeam[0]?.life).toBe(targetLife(s.slug) - directTotal - periodic);
      expect(out.events.filter((e) => e.kind === 'status').map((e) => e.statusId)).toEqual(
        trap ? ['burn', 'burn', 'burn'] : phoenix ? ['burn', 'chill', 'paralyze'] : ['burn']
      );
      expect(out.events.filter((e) => e.kind === 'action')).toEqual([
        expect.objectContaining({ actor: 'hero', skillId: canonical(s.slug), simClockMs: 1700 })
      ]);
      expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
      expect(out.result.playerTeam[0]?.mana).toBe(0);
      expect(f.player).toEqual(before);
    }
  );
  it(`${s.slug} ${trap ? 'missed first pulse grants no Burn before later independently rolled pulses' : 'miss pays once but grants no Burn or periodic HP loss'}`, () => {
    const f = fixture(s.slug, 20, 41),
      out = record(f.input);
    const hits = out.events.filter(e => e.kind === 'damage');
    expect(hits[0]).toMatchObject({ simClockMs: 1700, dodged: true, amount: 0 });
    if (trap) {
      const landed = s.slug === 'wake-of-fire' ? [171, 178] : [249, 260];
      expect(hits.map(e => [e.simClockMs, e.amount, e.dodged])).toEqual([
        [1700, 0, true], [2700, landed[0], false], [3700, landed[1], false]
      ]);
      expect(out.events.filter(e => e.simClockMs < 2700 && (e.kind === 'status' || e.kind === 'dot'))).toEqual([]);
      expect(out.events.filter(e => e.kind === 'status').map(e => [e.simClockMs, e.statusId])).toEqual([
        [2700, 'burn'], [3700, 'burn']
      ]);
      const periodic = 7 * (s.slug === 'wake-of-fire' ? 17 : 24);
      expect(out.events.filter(e => e.kind === 'dot').reduce((sum, e) => sum + e.amount, 0)).toBe(periodic);
      expect(out.result.enemyTeam[0]?.life).toBe(2000 - landed.reduce((sum, amount) => sum + amount, 0) - periodic);
    } else {
      expect(hits.every(e => e.dodged && e.amount === 0)).toBe(true);
      expect(out.events.filter((e) => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
      expect(out.result.enemyTeam[0]?.life).toBe(targetLife(s.slug));
    }
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
    expect(out.result.playerTeam[0]?.mana).toBe(0);
  });
  it(`${s.slug} requires real class, unlock, rank and every prerequisite`, () => {
    const f = fixture(s.slug);
    const patches = [
      { class: 'sorceress' as const },
      { level: f.selected.requiredLevel - 1 },
      { skillLevels: {} },
      ...Object.keys(f.player.skillLevels)
        .filter((key) => key !== f.selected.id)
        .map((key) => ({
          skillLevels: Object.fromEntries(
            Object.entries(f.player.skillLevels).filter(([k]) => k !== key)
          )
        }))
    ];
    for (const patch of patches)
      expect(playerToCombatUnit({ ...f.player, ...patch }).skillOrder).toEqual([]);
  });
  it(`${s.slug} refuses an unaffordable or cooling cast without a powered status`, () => {
    const f = fixture(s.slug);
    for (const patch of [{ mana: f.mana - 1 }, { cooldowns: { [canonical(s.slug)]: 10000 } }]) {
      const out = record({
        ...f.input,
        playerTeam: f.input.playerTeam.map((u) => ({ ...u, ...patch }))
      });
      expect(out.events.filter((e) => e.kind === 'action')).toEqual([
        expect.objectContaining({ skillId: null })
      ]);
      expect(
        out.events.filter(
          (e) =>
            e.kind === 'status' || e.kind === 'dot' || (e.kind === 'mana' && e.reason === 'cast')
        )
      ).toEqual([]);
    }
  });
}

it('Phoenix mitigates Fire separately and captures only final Fire potency without repeating resistance', () => {
  const f = fixture('phoenix-strike'),
    out = record({
      ...f.input,
      enemyTeam: f.input.enemyTeam.map((u) => ({
        ...u,
        stats: {
          ...u.stats,
          magicResist: 1,
          resistances: { ...u.stats.resistances, fire: 50, cold: 25, lightning: 0 }
        }
      }))
    });
  expect(
    out.events.filter((e) => e.kind === 'damage').map((e) => [e.damageType, e.amount])
  ).toEqual([
    ['fire', 20],
    ['cold', 29],
    ['lightning', 40]
  ]);
  expect(out.events.filter((e) => e.kind === 'dot').reduce((n, e) => n + e.amount, 0)).toBe(6);
  expect(out.result.enemyTeam[0]?.life).toBe(1905);
});
it('Phoenix shares one critical roll across three components and derives Burn from critical Fire only', () => {
  const f = fixture('phoenix-strike'),
    out = record({
      ...f.input,
      playerTeam: f.input.playerTeam.map((u) => ({ ...u, stats: { ...u.stats, critChance: 1 } }))
    });
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => [e.amount, e.crit])).toEqual([
    [82, true],
    [82, true],
    [82, true]
  ]);
  expect(out.events.filter((e) => e.kind === 'dot').reduce((n, e) => n + e.amount, 0)).toBe(24);
  expect(out.result.enemyTeam[0]?.life).toBe(1730);
});
it('Phoenix finishes the complete compound strike before settling one death and no later DoT', () => {
  const f = fixture('phoenix-strike'),
    out = record({ ...f.input, enemyTeam: f.input.enemyTeam.map((u) => ({ ...u, life: 1 })) });
  expect(out.result.enemyTeam[0]?.life).toBe(0);
  expect(out.events.filter((e) => e.kind === 'death')).toEqual([
    expect.objectContaining({ target: 'target' })
  ]);
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => e.damageType)).toEqual([
    'fire',
    'cold',
    'lightning'
  ]);
  const deathIndex = out.events.findIndex((e) => e.kind === 'death');
  expect(
    out.events.slice(deathIndex + 1).filter((e) => e.kind === 'damage' || e.kind === 'dot')
  ).toEqual([]);
  expect(out.events.filter((e) => e.kind === 'dot')).toEqual([]);
});

for (const s of cases) {
  it(`${s.slug} preserves native targeting and actual HP for every selected target`, () => {
    const f = fixture(s.slug),
      template = f.input.enemyTeam[0];
    if (!template) throw new Error('Missing target');
    const targets = Array.from({ length: 9 }, (_, i) => ({
      ...template,
      id: 'target-' + String(i),
      gridPosition: { row: Math.floor(i / 3), col: i % 3 }
    }));
    const out = record({ ...f.input, enemyTeam: targets });
    const hits = out.events.filter((e) => e.kind === 'damage');
    const hitTargets = new Set(hits.map((e) => e.target));
    expect(hitTargets.size).toBe(
      s.slug === 'fire-blast' ? 4 : ['fists-of-fire', 'phoenix-strike'].includes(s.slug) ? 1 : 9
    );
    for (const target of out.result.enemyTeam) {
      const direct = hits.filter((e) => e.target === target.id).reduce((n, e) => n + e.amount, 0);
      const periodic = out.events.reduce(
        (n, e) => n + (e.kind === 'dot' && e.target === target.id ? e.amount : 0),
        0
      );
      expect(target.life).toBe(targetLife(s.slug) - direct - periodic);
      expect(periodic > 0).toBe(hitTargets.has(target.id));
    }
  });
  it(`${s.slug} remains independent of weapon Attack`, () => {
    const f = fixture(s.slug),
      normal = record(f.input),
      high = record({
        ...f.input,
        playerTeam: f.input.playerTeam.map((u) => ({ ...u, stats: { ...u.stats, attack: 999999 } }))
      });
    expect(high.events).toEqual(normal.events);
    expect(high.result.enemyTeam).toEqual(normal.result.enemyTeam);
  });
  it(`${s.slug} resolves legal rank aliases by MAX without mutating captured allocation`, () => {
    const f = fixture(s.slug),
      levels = { ...f.player.skillLevels, [canonical(s.slug)]: 20 },
      player = { ...f.player, skillLevels: levels },
      before = structuredClone(player),
      native = playerToCombatUnit(player);
    expect(native.skillLevels?.[canonical(s.slug)]).toBe(20);
    const capturedLevels = native.skillLevels,
      capturedMartialRanks = native.assassinMartialRanks;
    if (!capturedLevels || !capturedMartialRanks) throw new Error('Missing captured native allocation');
    expect(player).toEqual(before);
    const expected = record(fixture(s.slug, 20).input),
      out = record({
        ...f.input,
        playerTeam: f.input.playerTeam.map((u) => ({
          ...u,
          skillLevels: capturedLevels,
          assassinMartialRanks: capturedMartialRanks,
          ...(native.assassinTrapRanks === undefined ? {} : { assassinTrapRanks: native.assassinTrapRanks })
        }))
      });
    expect(out).toEqual(expected);
    playerToCombatUnit({ ...player, skillLevels: { [id(s.slug)]: 1 } });
    expect(native.skillLevels[canonical(s.slug)]).toBe(20);
  });
}

// BUG548: paid Fire growth must survive real late-chapter mitigation.
it('Dragon Tail cap rank damages every target through ordinary Defense and Fire resistance', () => {
  const f = fixture('dragon-tail', 20);
  const template = f.input.enemyTeam[0];
  if (!template) throw new Error('Missing native target');
  const out = record({ ...f.input, enemyTeam: [190, 363].map((defense, index) => ({
    ...template, id: 'warded-' + String(index),
    stats: { ...template.stats, defense, magicResist: 999999,
      resistances: { ...template.stats.resistances, fire: index === 0 ? 0 : 50 } }
  })) });
  const hits = out.events.filter(e => e.kind === 'damage');
  expect(hits).toHaveLength(2);
  expect(hits[0]).toMatchObject({ target: 'warded-0', damageType: 'fire', dodged: false, crit: false });
  expect(hits[1]).toMatchObject({ target: 'warded-1', damageType: 'fire', dodged: false, crit: false });
  expect(hits[0]?.amount).toBeGreaterThan(2100);
  expect(hits[1]?.amount).toBeGreaterThan(800);
  for (const target of out.result.enemyTeam) {
    const direct = hits.filter(e => e.target === target.id).reduce((sum, e) => sum + e.amount, 0);
    const burn = out.events.reduce((sum, e) => sum + (e.kind === 'dot' && e.target === target.id ? e.amount : 0), 0);
    expect(burn).toBe(3 * Math.floor(direct * 0.1));
    expect(target.life).toBe(10000 - direct - burn);
  }
  expect(out.events.filter(e => e.kind === 'action')).toEqual([expect.objectContaining({ skillId: 'assassin.dragon_tail' })]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
});

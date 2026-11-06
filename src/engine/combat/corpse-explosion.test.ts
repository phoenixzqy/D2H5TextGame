import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import type { CombatUnit } from './types';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';

const CE = 'necromancer.corpse_explosion', ALIAS = 'skills-necromancer-corpse-explosion';
function unit(id: string, side: 'player' | 'enemy' = 'player'): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 6, tier: 'trash',
    life: 1_000_000, mana: 20,
    stats: { life: 1_000_000, lifeMax: 1_000_000, mana: 20, manaMax: 20,
      attack: 1, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
const stun = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function body(id = 'body'): CombatUnit {
  return { ...unit(id, 'enemy'), life: 1, statuses: [stun,
    { id: 'ignite', sourceId: 'hero', stacks: 1, remaining: 1, expiresAtMs: 1000, dotPerStack: 1 }] };
}
// Exercise malformed external snapshots at the public validation boundary.
type Input = Omit<CombatSnapshot, 'corpseExplosion'> & { readonly corpseExplosion?: unknown };
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing fixture value');
  return value;
}
function input(): Input {
  return { seed: 7, playerTeam: [{ ...unit('hero'), skillOrder: [CE] }],
    enemyTeam: [body(), { ...unit('target', 'enemy'), statuses: [stun] }],
    corpseExplosion: [{ sourceHeroId: 'hero', rank: 1 }] };
}
function record(snapshot: Input) {
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot as CombatSnapshot);
  expect(snapshot).toEqual(before);
  expect(runBattle(snapshot as CombatSnapshot)).toEqual(out.result);
  return out;
}
function casts(events: readonly RecordedBattleEvent[]) {
  return events.filter(e => e.kind === 'action' && (e.skillId === CE || e.skillId === ALIAS));
}
function feedback(events: readonly RecordedBattleEvent[]) {
  return events.filter(e => e.kind === 'message' && e.messageKey.startsWith('combat:corpses.'));
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('D06 finite wave-local player Corpse Explosion', () => {
  it('requires an actual primary kill, consumes once, and retains dead outcome identity', () => {
    const out = record(input());
    expect(casts(out.events)).toHaveLength(1);
    expect(casts(out.events)[0]?.simClockMs).toBe(1700);
    expect(out.events.filter(e => e.kind === 'death' && e.target === 'body')).toHaveLength(1);
    expect(out.result.enemyTeam.map(u => [u.id, u.life === 0])).toEqual([['body', true], ['target', false]]);
    expect(feedback(out.events).map(e => e.kind === 'message' ? [e.messageKey, e.params] : null)).toEqual([
      ['combat:corpses.available', { count: 1 }], ['combat:corpses.consumed', { count: 0 }]
    ]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  });

  it('empty pool uses the identical basic fallback RNG and result', () => {
    const base = input(), enemy = { ...unit('target', 'enemy'), statuses: [stun] };
    const out = record({ ...base, enemyTeam: [enemy] });
    const control = record({ ...base, enemyTeam: [enemy], playerTeam: base.playerTeam.map(u => ({ ...u, skillOrder: [] })) });
    expect(out.events).toEqual(control.events);
    expect(out.result.enemyTeam).toEqual(control.result.enemyTeam);
    expect(casts(out.events)).toEqual([]);
    expect(feedback(out.events)).toEqual([]);
  });

  it.each([undefined, null, {}, [{ sourceHeroId: 'hero', rank: 0 }], [{ sourceHeroId: 'hero', rank: 1.5 }],
    [{ sourceHeroId: 'hero', rank: 21 }], [{ sourceHeroId: 'hero', rank: NaN }],
    [{ sourceHeroId: 'hero', rank: 1 }, { sourceHeroId: 'hero', rank: 1 }],
    [{ sourceHeroId: 'hero', rank: 1 }, { sourceHeroId: '', rank: 1 }]])('invalid authority %j grants no cast or feedback', projection => {
    const out = record({ ...input(), corpseExplosion: projection });
    expect(casts(out.events)).toEqual([]);
    expect(feedback(out.events)).toEqual([]);
  });

  it('initial-dead input cannot supply an opening cast', () => {
    const base = input();
    const out = record({ ...base, enemyTeam: [{ ...body(), life: 0 }, required(base.enemyTeam[1])] });
    expect(casts(out.events)).toEqual([]);
    expect(feedback(out.events)).toEqual([]);
  });

  it.each([CE, ALIAS])('gates both exact order aliases: %s', id => {
    const base = input();
    const out = record({ ...base, corpseExplosion: undefined, playerTeam: base.playerTeam.map(u => ({ ...u, skillOrder: [id] })) });
    expect(casts(out.events)).toEqual([]);
  });

  it('rejects a changed CE registry effect before payment', () => {
    const skill = required(getSkill(CE));
    registerSkill({ ...skill, effects: [...skill.effects, { kind: 'heal', amount: 1, target: 'self' }] });
    const out = record(input());
    expect(casts(out.events)).toEqual([]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  });

  it.each(['trash', 'elite', 'champion', 'rare-elite', 'rare-minion', 'boss', 'chapter-boss'] as const)(
    'credits one primary %s death and retains its ordinary orb behavior', tier => {
      const base = input(), enemyTeam = [{ ...body(), tier }, required(base.enemyTeam[1])];
      const out = record({ ...base, enemyTeam });
      const control = record({ ...base, enemyTeam, corpseExplosion: undefined,
        playerTeam: base.playerTeam.map(u => ({ ...u, skillOrder: [] })) });
      expect(casts(out.events)).toHaveLength(1);
      expect(out.events.filter(e => e.kind === 'orb')).toEqual(control.events.filter(e => e.kind === 'orb'));
      expect(out.events.filter(e => e.kind === 'death')).toEqual(control.events.filter(e => e.kind === 'death'));
    }
  );

  it.each(['hero', 'merc', 'summon'] as const)('a direct %s kill funds a later hero cast', kind => {
    const base = input(), killer = unit('killer');
    const out = record({ ...base, playerTeam: [...base.playerTeam, { ...killer, kind,
      ...(kind === 'summon' ? { summon: true, summonOwnerId: 'hero' } : {}),
      stats: { ...killer.stats, attackSpeed: 263 } }],
      enemyTeam: [{ ...body(), statuses: [stun] }, required(base.enemyTeam[1])] });
    const kill = out.events.find(e => e.kind === 'damage' && e.source === 'killer' && e.target === 'body' && !e.dodged);
    expect(kill).toMatchObject({ amount: 1, simClockMs: 400 });
    expect(casts(out.events)).toHaveLength(1);
    expect(casts(out.events)[0]?.simClockMs).toBe(1700);
  });

  it('a primary Shatter execute supplies a corpse', () => {
    const base = input(), killer = unit('killer'), victim = body();
    const out = record({ ...base, playerTeam: [...base.playerTeam,
      { ...killer, kind: 'merc', stats: { ...killer.stats, attackSpeed: 263 } }],
      enemyTeam: [{ ...victim, life: 19, stats: { ...victim.stats, lifeMax: 100 },
        statuses: [stun, { id: 'freeze', sourceId: 'killer', stacks: 1, remaining: -1 }] }, required(base.enemyTeam[1])] });
    expect(out.events.find(e => e.kind === 'damage' && e.source === 'killer')).toMatchObject({ amount: 19, simClockMs: 400 });
    expect(casts(out.events)).toHaveLength(1);
  });

  it.each([
    { kind: 'summon' as const }, { kind: 'merc' as const }, { kind: 'hero' as const }, { summon: true }, { ownerId: '' },
    { summonOwnerId: 'enemy-owner' }
  ])('does not credit an excluded primary victim %j', fields => {
    const base = input(), out = record({ ...base, enemyTeam: [{ ...body(), ...fields }, required(base.enemyTeam[1])] });
    expect(out.events.filter(e => e.kind === 'death' && e.target === 'body')).toHaveLength(1);
    expect(casts(out.events)).toEqual([]);
    expect(feedback(out.events)).toEqual([]);
  });

  it('orphan closure adds no corpse and no duplicate credit for its primary owner', () => {
    const base = input(), child = { ...unit('child', 'enemy'), summonOwnerId: 'body', statuses: [stun] };
    const out = record({ ...base, enemyTeam: [body(), child, required(base.enemyTeam[1])] });
    expect(out.events.filter(e => e.kind === 'death').map(e => e.target)).toEqual(['body', 'child']);
    expect(feedback(out.events)).toHaveLength(2);
    expect(casts(out.events)).toHaveLength(1);
  });

  it.each([{ side: 'enemy' as const }, { kind: 'merc' as const }, { kind: 'monster' as const },
    { summon: true }, { ownerId: '' }, { summonOwnerId: 'owner' }, { life: 0 }, { level: 5 }, { level: 6.5 }])(
    'invalid runtime source %j cannot grant cast or feedback', fields => {
      const base = input(), actor = { ...required(base.playerTeam[0]), ...fields };
      const out = record({ ...base, playerTeam: [actor, { ...unit('unprojected-control'), statuses: [stun] }] });
      expect(out.events.filter(e => e.kind === 'death' && e.target === 'body')).toHaveLength(1);
      expect(casts(out.events)).toEqual([]);
      expect(feedback(out.events)).toEqual([]);
    }
  );

  it.each([[1, 50, 80], [6, 450, 480], [20, 1570, 1600]])(
    'projected rank%s supplies damage%s–%s despite conflicting generic ranks', (rank, min, max) => {
      const base = input(), out = record({ ...base, seed: 1, corpseExplosion: [{ sourceHeroId: 'hero', rank }],
        playerTeam: base.playerTeam.map(u => ({ ...u, skillOrder: [ALIAS], skillLevels: { [CE]: 99, [ALIAS]: 0 } })) });
      const hit = required(out.events.find((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
        e.kind === 'damage' && e.damageType === 'fire'));
      expect(hit.dodged).toBe(false);
      expect(hit.amount).toBeGreaterThanOrEqual(min);
      expect(hit.amount).toBeLessThanOrEqual(max);
      expect(hit.amount).toBe(max); // Independent seed1 hits:80/480/1600, not overlapping rank ranges.
      const totalDot = out.events.reduce((n, e) => n + (e.kind === 'dot' && e.target === 'target' ? e.amount : 0), 0);
      expect(totalDot).toBe(3 * Math.max(1, Math.floor(hit.amount * 0.1)));
      expect(casts(out.events)).toHaveLength(1);
    }
  );

  it.each([[1, 199, 0, 80], [6, 115, 50, 240], [20, 199, 0, 1600],
    [20, 304, 25, 1200], [20, 454, 75, 400]])(
    'rank%s blast bypasses Defense%s but retains Fire resistance%s', (rank, defense, fire, expected) => {
      const base = input(), target = required(base.enemyTeam[1]);
      const out = record({ ...base, seed: 1, corpseExplosion: [{ sourceHeroId: 'hero', rank }],
        enemyTeam: [body(), { ...target, stats: { ...target.stats, defense,
          magicResist: 10_000, resistances: { ...target.stats.resistances, fire } } }] });
      const hit = required(out.events.find(e => e.kind === 'damage' && e.damageType === 'fire'));
      expect(hit).toMatchObject({ amount: expected, dodged: false, crit: false });
      expect(out.events.reduce((sum, e) => sum + (e.kind === 'dot' && e.target === 'target' ? e.amount : 0), 0))
        .toBe(3 * Math.max(1, Math.floor(expected * 0.1)));
      expect(casts(out.events)).toHaveLength(1);
      expect(feedback(out.events).at(-1)).toMatchObject({ messageKey: 'combat:corpses.consumed', params: { count: 0 } });
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
        .toEqual([expect.objectContaining({ target: 'hero', mana: 0 })]);
      expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'physical'))
        .toEqual(expect.arrayContaining([expect.objectContaining({ amount: 1, dodged: false })]));
    }
  );

  it('all targets dodging still spends one body and20MP', () => {
    const out = record(input()); // Seed7's sole CE hit naturally dodges.
    expect(out.events.find(e => e.kind === 'damage' && e.damageType === 'fire'))
      .toMatchObject({ dodged: true, amount: 0, simClockMs: 1700 });
    expect(casts(out.events)).toHaveLength(1);
    expect(feedback(out.events).at(-1)).toMatchObject({ messageKey: 'combat:corpses.consumed', params: { count: 0 } });
    expect(out.events.find(e => e.kind === 'mana' && e.reason === 'cast')).toMatchObject({ mana: 0 });
  });

  it('two available bodies and400ms actions prove the ordinary2s cooldown', () => {
    const base = input(), out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u,
      mana: 40, statuses: [{ ...stun, expiresAtMs: 1000 }],
      stats: { ...u.stats, manaMax: 40, attackSpeed: 263 } })),
      enemyTeam: [body('z-first'), body('a-second'), required(base.enemyTeam[1])] });
    expect(casts(out.events).map(e => e.simClockMs)).toEqual([1200, 3200]);
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero' &&
      e.simClockMs > 1200 && e.simClockMs < 3200).every(e => e.kind === 'action' && e.skillId === null)).toBe(true);
  });

  it('19MP leaves the body available;20MP commits the ordinary payment', () => {
    const base = input();
    const poor = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, mana: 19,
      stats: { ...u.stats, mana: 19, manaMax: 19 } })) });
    expect(casts(poor.events)).toEqual([]);
    expect(feedback(poor.events)).toHaveLength(1);
    expect(poor.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    expect(required(poor.result.playerTeam[0]).mana).toBe(19);
    expect(required(record(base).events.find(e => e.kind === 'mana' && e.reason === 'cast')))
      .toMatchObject({ mana: 0, simClockMs: 1700 });
  });

  it('a19MP hero leaves the same token for a later affordable teammate', () => {
    const base = input(), hero = required(base.playerTeam[0]);
    const poor = { ...hero, mana: 19, statuses: [{ ...stun, expiresAtMs: 1000 }],
      stats: { ...hero.stats, mana: 19, manaMax: 19, attackSpeed: 263 } };
    const other = { ...unit('other'), skillOrder: [ALIAS] };
    const out = record({ ...base, playerTeam: [poor, other],
      corpseExplosion: [{ sourceHeroId: 'hero', rank: 1 }, { sourceHeroId: 'other', rank: 1 }] });
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero' &&
      (e.simClockMs === 1200 || e.simClockMs === 1600))).toEqual([
      expect.objectContaining({ skillId: null, simClockMs: 1200 }),
      expect.objectContaining({ skillId: null, simClockMs: 1600 })
    ]);
    expect(casts(out.events)).toEqual([expect.objectContaining({ actor: 'other', simClockMs: 1700 })]);
    expect(feedback(out.events).map(e => e.kind === 'message' ? e.params?.count : undefined)).toEqual([1, 0]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
      .toEqual([expect.objectContaining({ target: 'other', mana: 0, simClockMs: 1700 })]);
  });

  it.each([CE, ALIAS])('honors carried cooldown under%s independently of the other alias', id => {
    const base = input(), out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u,
      cooldowns: { [CE]: 0, [ALIAS]: 0, [id]: 3400 } })) });
    expect(casts(out.events).map(e => e.simClockMs)).toEqual([3400]);
    expect(out.events.find(e => e.kind === 'action')).toMatchObject({ skillId: null, simClockMs: 1700 });
    expect(feedback(out.events)).toHaveLength(2);
  });

  it('the last enemy death supplies no post-terminal action or payment', () => {
    const base = input(), out = record({ ...base, enemyTeam: [body()] });
    expect(casts(out.events)).toEqual([]);
    expect(feedback(out.events)).toHaveLength(1);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    expect(out.result.winner).toBe('player');
  });

  it('empty CE falls through to the next legal combo with identical RNG and costs', () => {
    const id = 'fixture.fallback';
    registerSkill({ id, archetype: 'fixture', target: 'single-enemy', minLevel: 1, manaCost: 1, cooldown: 1,
      effects: [{ kind: 'damage', damageType: 'arcane', base: [1, 3] }] });
    const base = input(), enemyTeam = [required(base.enemyTeam[1])];
    const make = (order: readonly string[]) => ({ ...base, enemyTeam,
      playerTeam: base.playerTeam.map(u => ({ ...u, skillOrder: order })) });
    expect(record(make([CE, id])).events).toEqual(record(make([id])).events);
  });

  it('CE direct kills supply later paid actions, with no free recursion', () => {
    const base = input(), out = record({ ...base, seed: 1,
      corpseExplosion: [{ sourceHeroId: 'hero', rank: 20 }],
      playerTeam: base.playerTeam.map(u => ({ ...u, mana: 40, stats: { ...u.stats, manaMax: 40 } })),
      enemyTeam: [body(), { ...unit('second', 'enemy'), life: 100, statuses: [stun] }, required(base.enemyTeam[1])] });
    expect(casts(out.events).map(e => e.simClockMs)).toEqual([1700, 5100]);
    expect(out.events.filter(e => e.kind === 'death').map(e => e.target))
      .toEqual(['body', 'second']);
    expect(feedback(out.events).map(e => e.kind === 'message' ? [e.messageKey, e.params?.count] : null)).toEqual([
      ['combat:corpses.available', 1], ['combat:corpses.consumed', 0],
      ['combat:corpses.available', 1], ['combat:corpses.consumed', 0]
    ]);
    expect(out.result.enemyTeam.map(u => u.id)).toEqual(['body', 'second', 'target']);
  });

  it('CE ignite death can supply a later cast after the periodic closure', () => {
    const base = input(), out = record({ ...base, seed: 1,
      playerTeam: base.playerTeam.map(u => ({ ...u, mana: 40, stats: { ...u.stats, manaMax: 40 } })),
      enemyTeam: [body(), { ...unit('second', 'enemy'), life: 81, statuses: [stun] }, required(base.enemyTeam[1])] });
    expect(casts(out.events).map(e => e.simClockMs)).toEqual([1700, 5100]);
    expect(out.events.find(e => e.kind === 'death' && e.target === 'second')).toMatchObject({ simClockMs: 1825 });
    expect(out.events.find(e => e.kind === 'dot' && e.target === 'second')).toMatchObject({ amount: 1, simClockMs: 1825 });
  });


  it('same-time deaths close in emitted order before an action at that timestamp', () => {
    const base = input(), timedBody = (id: string) => ({ ...body(id),
      statuses: [stun, { id: 'ignite', sourceId: 'hero', stacks: 1, remaining: 1,
        appliedAtMs: 700, expiresAtMs: 1700, dotPerStack: 1 }] });
    const out = record({ ...base, enemyTeam: [timedBody('z-first'), timedBody('a-second'), required(base.enemyTeam[1])] });
    const deaths = out.events.filter(e => e.kind === 'death');
    expect(deaths).toMatchObject([{ target: 'z-first', simClockMs: 1700 }, { target: 'a-second', simClockMs: 1700 }]);
    expect(feedback(out.events).map(e => e.kind === 'message' ? e.params?.count : undefined)).toEqual([1, 2, 1]);
    expect(out.events.indexOf(required(deaths[1]))).toBeLessThan(out.events.indexOf(required(feedback(out.events)[0])));
    expect(out.events.indexOf(required(feedback(out.events)[1]))).toBeLessThan(out.events.indexOf(required(casts(out.events)[0])));
    expect(casts(out.events)[0]?.simClockMs).toBe(1700);
  });

  it('two eligible heroes compete for one shared token in existing action order', () => {
    const base = input(), second = { ...unit('other'), skillOrder: [ALIAS] };
    const out = record({ ...base, playerTeam: [...base.playerTeam, second],
      corpseExplosion: [{ sourceHeroId: 'hero', rank: 1 }, { sourceHeroId: 'other', rank: 20 }] });
    const actions = out.events.filter(e => e.kind === 'action' && e.simClockMs === 1700);
    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({ skillId: CE });
    expect(actions[1]).toMatchObject({ skillId: null });
    expect(casts(out.events)).toHaveLength(1);
    expect(feedback(out.events)).toHaveLength(2);
  });

  it('exact alias redirection cannot enter another active or startup payment path', () => {
    const original = required(getSkill(CE)), base = input();
    for (const id of [CE, ALIAS]) {
      registerSkill({ ...original, id, summonOnStart: true, target: 'self', effects: [{ kind: 'heal', amount: 1, target: 'self' }] });
      const out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, skillOrder: [id] })) });
      expect(casts(out.events)).toEqual([]);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    }
  });

  it('resolved CE identity is gated even through an unlisted normalized order alias', () => {
    const base = input(), out = record({ ...base, corpseExplosion: undefined,
      playerTeam: base.playerTeam.map(u => ({ ...u, skillOrder: ['necromancer/corpse-explosion'] })) });
    expect(casts(out.events)).toEqual([]);
    expect(feedback(out.events)).toEqual([]);
  });

  it('keeps the monster death marker independent of player corpse authority', () => {
    const base = input(), snapshot = { ...base, playerTeam: base.playerTeam.map(u => ({ ...u, skillOrder: [], statuses: [stun] })),
      enemyTeam: [{ ...unit('monster', 'enemy'), skillOrder: ['monster.corpse_explosion'] }] };
    const out = record(snapshot);
    expect(out.events).toEqual(record({ ...snapshot, corpseExplosion: undefined }).events);
    expect(out.events.some(e => e.kind === 'action' && e.skillId === 'monster.corpse_explosion')).toBe(false);
    expect(out.events.some(e => e.kind === 'action' && e.actor === 'monster' && e.skillId === null)).toBe(true);
    expect(feedback(out.events)).toEqual([]);
  });

  it('A/A and A/B/A remain identical without resets; the next wave starts empty', () => {
    const a = input(), b = { ...input(), seed: 1, corpseExplosion: [{ sourceHeroId: 'hero', rank: 20 }] };
    const first = record(a);
    expect(record(a)).toEqual(first);
    record(b);
    expect(record(a)).toEqual(first);
    const next = record({ ...a, enemyTeam: [{ ...body(), life: 0 }, required(a.enemyTeam[1])] });
    expect(casts(next.events)).toEqual([]);
    expect(feedback(next.events)).toEqual([]);
  });


  it('rejects a trailing sparse effect before payment rather than throwing during effects', () => {
    const skill = required(getSkill(CE)), effects = [...skill.effects];
    effects.length = 2;
    registerSkill({ ...skill, effects });
    expect(() => record(input())).not.toThrow();
    expect(casts(record(input()).events)).toEqual([]);
  });

});

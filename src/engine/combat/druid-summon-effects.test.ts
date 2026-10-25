import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { buildSummon } from '../skills/summons';
import type { DruidSummonId } from '../skills/druid-summon-definition';
import type { DamageType } from '../types/attributes';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing synthetic summon fixture unit');
  return value;
}
const hold = (at = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'synthetic-isolation',
  stacks: 1,
  remaining: -1,
  appliedAtMs: at
});
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return {
    id,
    name: id,
    side,
    kind: side === 'player' ? 'hero' : 'monster',
    level: 30,
    tier: 'trash',
    life: 500,
    mana: 100,
    stats: {
      life: 10000,
      lifeMax: 10000,
      mana: 1000,
      manaMax: 1000,
      attack: 100,
      defense: 0,
      magicResist: 0,
      attackSpeed: 0,
      critChance: 0,
      critDamage: 1.5,
      physDodge: 0,
      magicDodge: 0,
      magicFind: 0,
      goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    },
    statuses: [hold()],
    skillOrder: [],
    skillLevels: {},
    activeBuffIds: [],
    cooldowns: {},
    enraged: false
  };
}
const slugs = {
  raven: 'raven',
  poison_creeper: 'poison_creeper',
  carrion_vine: 'carrion_vine',
  solar_creeper: 'solar_creeper',
  spirit_wolf: 'summon_spirit_wolf',
  dire_wolf: 'summon_dire_wolf',
  grizzly: 'summon_grizzly'
} as const;
function fixture(template: DruidSummonId): CombatSnapshot {
  const skillId = 'druid.' + slugs[template],
    hero: CombatUnit = {
      ...unit('hero', 'player'),
      skillOrder: [skillId],
      skillLevels: { [skillId]: 1 },
      druidSummonRanks: { [template]: 1 }
    };
  const built = buildSummon(hero, template);
  if (!built) throw new Error('Missing body');
  const body = {
    ...built,
    id: 'bound-body',
    statuses: [hold(2001)],
    stats: { ...built.stats, attack: 100, attackSpeed: 0, critChance: 0 }
  };
  // The existing finite corpse path sees one real primary death at 1000ms. No preloaded tokens.
  const dead = {
    ...unit('corpse-source', 'enemy'),
    life: 1,
    statuses: [
      hold(),
      {
        id: 'ignite',
        sourceId: hero.id,
        stacks: 1,
        remaining: -1,
        expiresAtMs: 1000,
        dotPerStack: 1,
        damageType: 'fire' as const
      }
    ]
  };
  return {
    seed: 42,
    playerTeam: [hero, body],
    enemyTeam:
      template === 'raven' || template === 'poison_creeper'
        ? [unit('target', 'enemy')]
        : [dead, unit('target', 'enemy')]
  };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input),
    output = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(output);
  return output;
}
beforeEach(loadDefaultSkills);
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});

describe('Raven Blind changes actual ordinary hit rolls', () => {
  function hit(seed: number, type: DamageType, start = 0, expiry = 401, blind = true) {
    const hero = unit('hero', 'player'),
      target = unit('target', 'enemy');
    const output = runBattleRecorded({
      seed,
      playerTeam: [
        {
          ...hero,
          stats: { ...hero.stats, attackSpeed: 300 },
          basicAttack: { damageType: type, damage: [100, 100] },
          statuses: [
            hold(401),
            ...(blind
              ? [
                  {
                    id: 'blind',
                    sourceId: 'raven',
                    stacks: 1,
                    remaining: 2,
                    appliedAtMs: start,
                    expiresAtMs: expiry
                  }
                ]
              : [])
          ]
        }
      ],
      enemyTeam: [target]
    });
    const damage = output.events.find((e) => e.kind === 'damage' && e.source === hero.id);
    if (!damage || damage.kind !== 'damage') throw new Error('Missing real attack');
    expect(damage.simClockMs).toBe(400);
    return damage;
  }
  it.each<DamageType>(['physical', 'thorns'])(
    '%s has fewer actual hits over the identical seed set',
    (type) => {
      const seeds = Array.from({ length: 32 }, (_, i) => i + 1);
      const normal = seeds.map((seed) => hit(seed, type, 0, 401, false));
      const blinded = seeds.map((seed) => hit(seed, type));
      expect(blinded.filter((e) => e.amount > 0).length).toBeLessThan(
        normal.filter((e) => e.amount > 0).length
      );
      for (let i = 0; i < seeds.length; i++)
        if (blinded[i]?.amount) expect(blinded[i]?.amount).toBe(normal[i]?.amount);
    }
  );
  it.each<DamageType>(['fire', 'cold', 'lightning', 'poison', 'arcane'])(
    '%s remains unchanged',
    (type) => {
      for (const seed of [1, 7, 42])
        expect(hit(seed, type)).toEqual(hit(seed, type, 0, 401, false));
    }
  );
  it('uses inclusive start and exclusive expiry without slowing the action', () => {
    for (let seed = 1; seed <= 32; seed++) {
      expect(hit(seed, 'physical', 401)).toEqual(hit(seed, 'physical', 0, 401, false));
      expect(hit(seed, 'physical', 0, 400)).toEqual(hit(seed, 'physical', 0, 401, false));
    }
  });
});

describe('source-bound summon effects and shared finite corpses', () => {
  it('Raven applies one finite refreshable blind through a real landed Physical hit', () => {
    const out = record(fixture('raven'));
    expect(
      out.events.some((e) => e.kind === 'damage' && e.source === 'bound-body' && e.amount === 100)
    ).toBe(true);
    const status = out.events.find(
      (e) =>
        e.kind === 'status-state' &&
        e.target === 'target' &&
        e.statuses.some((s) => s.id === 'blind')
    );
    expect(status).toMatchObject({
      simClockMs: 2000,
      statuses: [
        expect.objectContaining({ id: 'stun' }),
        expect.objectContaining({
          id: 'blind',
          sourceId: 'bound-body',
          stacks: 1,
          appliedAtMs: 2000,
          expiresAtMs: 4000
        })
      ]
    });
  });
  it('Poison Creeper keeps its Physical hit and later removes exactly 50 Poison HP', () => {
    const out = record(fixture('poison_creeper'));
    const physical = out.events.filter(
      (e) => e.kind === 'damage' && e.source === 'bound-body' && e.damageType === 'physical'
    );
    expect(physical).toEqual([expect.objectContaining({ amount: 100, simClockMs: 2000 })]);
    const poison = out.events.filter((e) => e.kind === 'dot' && e.target === 'target');
    expect(poison.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(50);
    expect(out.events).toContainEqual(
      expect.objectContaining({
        kind: 'status-state',
        target: 'target',
        simClockMs: 2000,
        statuses: [
          expect.objectContaining({ id: 'stun' }),
          expect.objectContaining({
            id: 'poison',
            damageType: 'poison',
            dotPerStack: 10,
            stacks: 1,
            appliedAtMs: 2000,
            expiresAtMs: 7000
          })
        ]
      })
    );
    expect(poison.every((e) => e.simClockMs > 2000 && e.simClockMs <= 7000)).toBe(true);
    expect(out.result.enemyTeam.find((u) => u.id === 'target')?.life).toBe(350);
  });
  it.each(['carrion_vine', 'solar_creeper'] as const)(
    '%s consumes one real body on its scheduled action',
    (template) => {
      const out = record(fixture(template));
      expect(
        out.events.filter(
          (e) => e.kind === 'message' && e.messageKey.startsWith('combat:corpses.consumed')
        )
      ).toEqual([
        expect.objectContaining({
          params: { count: 0, corpseId: 'corpse-source' },
          simClockMs: 2000
        })
      ]);
      expect(
        out.events.filter((e) => e.kind === 'action' && e.actor === 'bound-body')
      ).toHaveLength(1);
      expect(out.events.some((e) => e.kind === 'damage' && e.source === 'bound-body')).toBe(false);
      if (template === 'carrion_vine') {
        expect(out.result.playerTeam[0]?.life).toBe(1000);
        expect(out.events.filter((e) => e.kind === 'heal')).toEqual([
          expect.objectContaining({ target: 'hero', amount: 500, simClockMs: 2000 })
        ]);
      } else {
        expect(out.result.playerTeam[0]?.mana).toBe(150);
        expect(out.events.filter((e) => e.kind === 'mana')).toEqual([
          expect.objectContaining({
            target: 'hero',
            mana: 150,
            reason: 'solar-creeper',
            simClockMs: 2000
          })
        ]);
      }
    }
  );
  it.each(['raven', 'poison_creeper'] as const)(
    '%s misses apply no status or poison',
    (template) => {
      const input = fixture(template),
        target = input.enemyTeam[0];
      if (!target) throw new Error('Missing target');
      const out = record({
        ...input,
        enemyTeam: [{ ...target, stats: { ...target.stats, physDodge: 1 } }]
      });
      expect(
        out.events.some((e) => e.kind === 'damage' && e.source === 'bound-body' && e.dodged)
      ).toBe(true);
      expect(
        out.events.some((e) => e.kind === 'status' && ['blind', 'poison'].includes(e.statusId))
      ).toBe(false);
    }
  );
  it.each(['carrion_vine', 'solar_creeper'] as const)(
    '%s preserves token and falls back when full, empty or controlled',
    (template) => {
      for (const mode of ['full', 'empty', 'controlled'] as const) {
        const input = fixture(template),
          hero = required(input.playerTeam[0]),
          body = required(input.playerTeam[1]);
        const out = record({
          ...input,
          playerTeam: [
            { ...hero, ...(mode === 'full' ? { life: 10000, mana: 1000 } : {}) },
            { ...body, ...(mode === 'controlled' ? { statuses: [hold()] } : {}) }
          ],
          enemyTeam: mode === 'empty' ? [required(input.enemyTeam[1])] : input.enemyTeam
        });
        expect(
          out.events.some(
            (e) => e.kind === 'message' && e.messageKey.startsWith('combat:corpses.consumed')
          )
        ).toBe(false);
        expect(out.events.some((e) => e.kind === 'action' && e.actor === body.id)).toBe(
          mode !== 'controlled'
        );
        expect(out.events.some((e) => e.kind === 'damage' && e.source === body.id)).toBe(
          mode !== 'controlled'
        );
      }
    }
  );
  it('template markers and changed registered metadata grant no Blind', () => {
    const input = fixture('raven'),
      skill = getSkill('druid.raven');
    if (!skill) throw new Error('Missing Raven');
    const unauthorised = record({
      ...input,
      playerTeam: [
        { ...required(input.playerTeam[0]), druidSummonRanks: {} },
        required(input.playerTeam[1])
      ]
    });
    expect(unauthorised.events.some((e) => e.kind === 'status' && e.statusId === 'blind')).toBe(
      false
    );
    registerSkill({ ...skill, manaCost: 0 });
    expect(record(input).events.some((e) => e.kind === 'status' && e.statusId === 'blind')).toBe(
      false
    );
  });
  it.each(['raven', 'poison_creeper'] as const)(
    '%s requires its ordinary Physical carrier hit',
    (template) => {
      const input = fixture(template),
        hero = required(input.playerTeam[0]),
        body = required(input.playerTeam[1]);
      const out = record({
        ...input,
        playerTeam: [hero, { ...body, basicAttack: { damageType: 'fire', damage: [100, 100] } }]
      });
      expect(out.events).toContainEqual(
        expect.objectContaining({
          kind: 'damage',
          source: body.id,
          damageType: 'fire',
          amount: 100
        })
      );
      expect(
        out.events.some((e) => e.kind === 'status' && ['blind', 'poison'].includes(e.statusId))
      ).toBe(false);
    }
  );
  it('binds at most the authored Raven cap when surplus preloads already exist', () => {
    const input = fixture('raven'),
      hero = required(input.playerTeam[0]),
      body = required(input.playerTeam[1]);
    const out = record({ ...input, playerTeam: [hero, body, { ...body, id: 'surplus-body' }] });
    expect(out.events.some((e) => e.kind === 'damage' && e.source === 'surplus-body')).toBe(true);
    expect(
      out.events.some(
        (e) =>
          e.kind === 'status-state' &&
          e.statuses.some((s) => s.id === 'blind' && s.sourceId === 'surplus-body')
      )
    ).toBe(false);
  });
  it('two qualified vines compete for one body instead of duplicating its supply', () => {
    const input = fixture('carrion_vine'),
      hero = required(input.playerTeam[0]),
      carrion = required(input.playerTeam[1]);
    const solar = buildSummon(hero, 'solar_creeper');
    if (!solar) throw new Error('Missing Solar body');
    const out = record({
      ...input,
      playerTeam: [
        {
          ...hero,
          skillOrder: ['druid.carrion_vine', 'druid.solar_creeper'],
          skillLevels: { 'druid.carrion_vine': 1, 'druid.solar_creeper': 1 },
          druidSummonRanks: { carrion_vine: 1, solar_creeper: 1 }
        },
        carrion,
        {
          ...solar,
          id: 'solar-body',
          statuses: [hold(2001)],
          stats: { ...solar.stats, attackSpeed: 0 }
        }
      ]
    });
    expect(
      out.events.filter(
        (e) => e.kind === 'message' && e.messageKey.startsWith('combat:corpses.consumed')
      )
    ).toHaveLength(1);
    expect(
      out.events.filter((e) => e.kind === 'action' && [carrion.id, 'solar-body'].includes(e.actor))
    ).toHaveLength(2);
    expect(
      out.events.filter((e) => e.kind === 'damage' && [carrion.id, 'solar-body'].includes(e.source))
    ).toHaveLength(1);
    expect(
      out.events.filter(
        (e) => e.kind === 'heal' || (e.kind === 'mana' && e.reason === 'solar-creeper')
      )
    ).toHaveLength(1);
  });
  it('consumes real bodies in FIFO order, once each, across successive scheduled actions', () => {
    const input = fixture('carrion_vine'),
      body = required(input.playerTeam[1]),
      first = required(input.enemyTeam[0]);
    const second = {
      ...first,
      id: 'later-corpse',
      life: 3,
      statuses: first.statuses.map((s) =>
        s.id === 'ignite' ? { ...s, dotPerStack: 2, expiresAtMs: 1500 } : s
      )
    };
    const out = record({
      ...input,
      playerTeam: [required(input.playerTeam[0]), { ...body, statuses: [hold(4001)] }],
      enemyTeam: [first, second, required(input.enemyTeam[1])]
    });
    expect(
      out.events.filter(
        (e) => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedCarrion'
      )
    ).toEqual([
      expect.objectContaining({ simClockMs: 2000, params: { count: 1, corpseId: first.id } }),
      expect.objectContaining({ simClockMs: 4000, params: { count: 0, corpseId: second.id } })
    ]);
    expect(out.events.filter((e) => e.kind === 'heal').reduce((sum, e) => sum + e.amount, 0)).toBe(
      1000
    );
  });
  it.each(['carrion_vine', 'solar_creeper'] as const)(
    '%s stages capped recovery and preserves zero/nonfinite capacity tokens',
    (template) => {
      for (const capacity of [0, 10, NaN, Infinity]) {
        const input = fixture(template),
          hero = required(input.playerTeam[0]),
          body = required(input.playerTeam[1]);
        const out = record({
          ...input,
          playerTeam: [
            {
              ...hero,
              life: 1,
              mana: 1,
              stats: {
                ...hero.stats,
                lifeMax: template === 'carrion_vine' ? capacity : 10000,
                manaMax: template === 'solar_creeper' ? capacity : 1000
              }
            },
            body
          ]
        });
        expect(
          out.events.some(
            (e) => e.kind === 'message' && e.messageKey.startsWith('combat:corpses.consumed')
          )
        ).toBe(false);
        expect(out.events.some((e) => e.kind === 'damage' && e.source === body.id)).toBe(true);
      }
      const input = fixture(template),
        hero = required(input.playerTeam[0]),
        body = required(input.playerTeam[1]);
      const out = record({ ...input, playerTeam: [{ ...hero, life: 9999, mana: 999 }, body] });
      if (template === 'carrion_vine')
        expect(out.events.filter((e) => e.kind === 'heal')).toEqual([
          expect.objectContaining({ target: 'hero', amount: 1 })
        ]);
      else
        expect(out.events.filter((e) => e.kind === 'mana')).toEqual([
          expect.objectContaining({ target: 'hero', mana: 1000, reason: 'solar-creeper' })
        ]);
    }
  );
  it.each(['stun', 'freeze', 'paralyze'])(
    '%s blocks vine recovery before corpse consumption',
    (status) => {
      const input = fixture('carrion_vine'),
        body = required(input.playerTeam[1]);
      const out = record({
        ...input,
        playerTeam: [
          required(input.playerTeam[0]),
          { ...body, statuses: [{ ...hold(), id: status }] }
        ]
      });
      expect(
        out.events.some(
          (e) => e.kind === 'message' && e.messageKey.startsWith('combat:corpses.consumed')
        )
      ).toBe(false);
      expect(out.events.some((e) => e.kind === 'stunned' && e.target === body.id)).toBe(true);
    }
  );
  it('does not invent initial-dead, enemy-summon, orphan or terminal-battle corpse recovery', () => {
    for (const mode of ['initial-dead', 'summon', 'orphan', 'terminal'] as const) {
      const input = fixture('carrion_vine'),
        dead = required(input.enemyTeam[0]);
      const out = record({
        ...input,
        enemyTeam:
          mode === 'terminal'
            ? [dead]
            : [
                {
                  ...dead,
                  ...(mode === 'initial-dead'
                    ? { life: 0 }
                    : mode === 'summon'
                      ? { kind: 'summon' as const, summon: true }
                      : { summonOwnerId: 'target' })
                },
                required(input.enemyTeam[1])
              ]
      });
      expect(
        out.events.some(
          (e) => e.kind === 'message' && e.messageKey.startsWith('combat:corpses.consumed')
        )
      ).toBe(false);
      expect(
        out.events.some(
          (e) => e.kind === 'heal' || (e.kind === 'mana' && e.reason === 'solar-creeper')
        )
      ).toBe(false);
    }
  });
  it.each(['corpse_explosion', 'poison_explosion'] as const)(
    'shares the FIFO with earlier %s actions',
    (slug) => {
      const input = fixture('carrion_vine'),
        necro = {
          ...unit('necro', 'player'),
          skillOrder: ['necromancer.' + slug],
          skillLevels: { ['necromancer.' + slug]: 1 },
          statuses: [{ ...hold(), expiresAtMs: 1001 }, hold(1201)],
          stats: { ...unit('necro', 'player').stats, attackSpeed: 300 }
        };
      const authority = [{ sourceHeroId: necro.id, rank: 1 }];
      const out = record({
        ...input,
        playerTeam: [...input.playerTeam, necro],
        ...(slug === 'corpse_explosion'
          ? { corpseExplosion: authority }
          : { poisonExplosion: authority })
      });
      expect(
        out.events.filter(
          (e) => e.kind === 'message' && e.messageKey.startsWith('combat:corpses.consumed')
        )
      ).toEqual([
        expect.objectContaining({
          simClockMs: 1200,
          messageKey:
            slug === 'corpse_explosion'
              ? 'combat:corpses.consumed'
              : 'combat:corpses.consumedPoison'
        })
      ]);
      expect(out.events.some((e) => e.kind === 'heal')).toBe(false);
    }
  );
  it('shares the FIFO with Redemption at the same-time pulse before a vine action', () => {
    const input = fixture('carrion_vine'),
      paladin = unit('paladin', 'player');
    const out = record({
      ...input,
      playerTeam: [...input.playerTeam, paladin],
      statAura: {
        selectedAuraId: 'paladin.redemption',
        sourceHeroId: paladin.id,
        rank: 1,
        maxRank: 20,
        bonuses: { lifeRegenPct: 0.02, manaRegenPct: 0.02 },
        redemption: { intervalMs: 2000, life: 20, mana: 10 }
      }
    });
    expect(
      out.events.filter(
        (e) => e.kind === 'message' && e.messageKey.startsWith('combat:corpses.consumed')
      )
    ).toEqual([
      expect.objectContaining({ simClockMs: 2000, messageKey: 'combat:corpses.consumedRedemption' })
    ]);
    expect(out.events.some((e) => e.kind === 'damage' && e.source === 'bound-body')).toBe(true);
  });
});

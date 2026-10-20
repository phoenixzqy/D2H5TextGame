import { describe, expect, it } from 'vitest';
import sorceress from '../../../src/data/classes/sorceress.json';
import barbarian from '../../../src/data/classes/barbarian.json';
import act1 from '../../../src/data/maps/sub-areas/act1.json';
import skills from '../../../src/data/skills/sorceress.json';
import barbarianSkills from '../../../src/data/skills/barbarian.json';
import mercPool from '../../../src/data/gacha/mercenaries.json';
import { loadMercHireRoster } from '../../../src/data/loaders/mercs';
import bases from '../../../src/data/items/bases.json';
import mainQuests from '../../../src/data/quests/main.json';
import { parseFixture } from './fixture';
import { fingerprintEarnedFixture, parseEarnedFixture } from './earned-fixture';

const mercs = loadMercHireRoster().flatMap((act) => act.mercs);
const references = {
  classes: [sorceress],
  areas: act1,
  skills,
  mercs,
  bases,
  quests: mainQuests.quests
};
const fire = 'skills-sorceress-fire-bolt';
const frost = 'skills-sorceress-frost-nova';
const merc = 'mercs/act1-rogue-inner-sight';
const farm = {
  kind: 'farm-first-waves',
  subAreaId: 'areas/act1-blood-moor',
  count: 40,
  firstChallengeOrdinal: 0
};
const heroGloves = {
  kind: 'equip-earned',
  owner: 'hero',
  slot: 'gloves',
  selector: {
    baseId: 'items/base/glove-leather',
    rarity: 'normal',
    defense: 5,
    selection: 'first-acquired'
  }
};
// Structurally legal same40 Frost6/Fire1 recipe; parsing does not prove acquisition.
const example = {
  fixtureVersion: 2,
  id: 'earned-sorceress-den-frost-six',
  origin: {
    kind: 'new-character',
    classId: 'sorceress',
    name: 'Earned Sorc',
    policy: 'production-creation-defaults'
  },
  clockEpochMs: 1792497600000,
  seeds: [2223645302],
  acquisitionSeedPolicy: 'production-clock',
  actions: [
    { kind: 'hire-merc', mercId: merc },
    { kind: 'allocate-skill', skillId: fire, points: 1 },
    { kind: 'set-combo', skillIds: [fire] },
    farm,
    { kind: 'checkpoint', id: 'earned-level-six' },
    { kind: 'allocate-skill', skillId: frost, points: 5 },
    { kind: 'set-combo', skillIds: [frost, fire] },
    heroGloves,
    {
      kind: 'equip-earned',
      owner: 'hero',
      slot: 'boots',
      selector: {
        baseId: 'items/base/boot-leather',
        rarity: 'normal',
        defense: 3,
        selection: 'first-acquired'
      }
    },
    {
      kind: 'equip-earned',
      owner: 'merc',
      mercId: merc,
      slot: 'gloves',
      selector: {
        baseId: 'items/base/glove-leather',
        rarity: 'normal',
        defense: 4,
        selection: 'first-acquired'
      }
    },
    { kind: 'allocate-stats', deltas: { strength: 0, dexterity: 0, vitality: 15, energy: 10 } },
    { kind: 'accept-quest', questId: 'quests/act1-den-of-evil' },
    { kind: 'checkpoint', id: 'tracked' }
  ],
  scenario: {
    act: 1,
    subAreaId: 'areas/act1-den-of-evil',
    mode: 'manual',
    challengeOrdinal: 40,
    idleEliteMisses: 0
  },
  mercPolicy: 'recipe-actions',
  summonPolicy: 'production-default'
};
const withAction = (kind: string, patch: Record<string, unknown>) => ({
  ...example,
  actions: example.actions.map((action) =>
    action.kind === kind ? { ...action, ...patch } : action
  )
});
const without = (input: object, key: string) =>
  Object.fromEntries(Object.entries(input).filter(([name]) => name !== key));

describe('fresh earned recipe v2 contract', () => {
  it('accepts real catalog-backed actions without granting state or mutating input/references', () => {
    const input = structuredClone(example);
    const refs = structuredClone(references);
    const parsed = parseEarnedFixture(input, refs);
    expect(parsed).toEqual(example);
    expect(parsed).not.toBe(input);
    expect(parsed.actions).not.toBe(input.actions);
    expect(input).toEqual(example);
    expect(refs).toEqual(references);
    input.origin.name = 'Changed';
    input.seeds[0] = 0;
    const equipment = input.actions[7];
    if (!equipment || !('selector' in equipment) || !equipment.selector)
      throw new Error('Missing test selector');
    equipment.selector.defense = 99;
    const combo = input.actions[2];
    if (!combo || !('skillIds' in combo) || !combo.skillIds) throw new Error('Missing test combo');
    combo.skillIds.push(frost);
    input.scenario.challengeOrdinal = 1;
    expect(parsed).toEqual(example);
  });

  it('accepts one preparation and the32-action boundary without claiming affordability', () => {
    expect(
      parseEarnedFixture(
        {
          ...example,
          actions: [{ ...farm, count: 1 }],
          scenario: { ...example.scenario, challengeOrdinal: 1 }
        },
        references
      ).actions
    ).toHaveLength(1);
    const actions = [
      farm,
      ...Array.from({ length: 31 }, (_, i) => ({
        kind: 'checkpoint',
        id: `checkpoint-${String(i)}`
      }))
    ];
    expect(parseEarnedFixture({ ...example, actions }, references).actions).toHaveLength(32);
  });

  it('accepts numeric endpoints, bounded action points/deltas and an empty active combo', () => {
    for (const clockEpochMs of [0, Number.MAX_SAFE_INTEGER]) {
      expect(
        parseEarnedFixture(
          { ...example, clockEpochMs, seeds: [0, 1, 2, 3, 4, 5, 6, 4294967295] },
          references
        ).clockEpochMs
      ).toBe(clockEpochMs);
    }
    expect(
      parseEarnedFixture(withAction('allocate-skill', { points: 20 }), references).fixtureVersion
    ).toBe(2);
    expect(
      parseEarnedFixture(withAction('set-combo', { skillIds: [] }), references).fixtureVersion
    ).toBe(2);
    const activeIds = skills.filter((skill) => skill.trigger === 'active').map((skill) => skill.id);
    expect(activeIds.length).toBeGreaterThanOrEqual(10);
    expect(
      parseEarnedFixture(withAction('set-combo', { skillIds: activeIds.slice(0, 9) }), references)
        .fixtureVersion
    ).toBe(2);
    expect(() =>
      parseEarnedFixture(withAction('set-combo', { skillIds: activeIds.slice(0, 10) }), references)
    ).toThrow();
    expect(
      parseEarnedFixture(
        withAction('allocate-stats', {
          deltas: { strength: 25, dexterity: 0, vitality: 0, energy: 0 }
        }),
        references
      ).fixtureVersion
    ).toBe(2);
    for (const defense of [0, 1000]) {
      expect(
        parseEarnedFixture(
          {
            ...example,
            actions: [farm, { ...heroGloves, selector: { ...heroGloves.selector, defense } }]
          },
          references
        ).fixtureVersion
      ).toBe(2);
    }
  });

  it('does not broaden the original fresh-v1 boundary', () => {
    expect(() => parseFixture(example, references)).toThrow();
    expect(() => parseEarnedFixture({ ...example, fixtureVersion: 1 }, references)).toThrow();
  });

  it.each([0, 41, 1.5])(
    'rejects matching farm count and target ordinal outside the bound: %s',
    (count) => {
      expect(() =>
        parseEarnedFixture(
          {
            ...example,
            actions: [{ ...farm, count }],
            scenario: { ...example.scenario, challengeOrdinal: count }
          },
          references
        )
      ).toThrow();
    }
  );

  it('rejects foreign class and skills even when they are real supplied catalog rows', () => {
    const refs = {
      ...references,
      classes: [sorceress, barbarian],
      skills: [...skills, ...barbarianSkills]
    };
    const skillId = 'skills-barbarian-bash';
    expect(refs.skills.some((skill) => skill.id === skillId)).toBe(true);
    expect(() =>
      parseEarnedFixture({ ...example, origin: { ...example.origin, classId: 'barbarian' } }, refs)
    ).toThrow();
    expect(() => parseEarnedFixture(withAction('allocate-skill', { skillId }), refs)).toThrow();
    expect(() =>
      parseEarnedFixture(withAction('set-combo', { skillIds: [skillId] }), refs)
    ).toThrow();
  });

  it('rejects an invalid checkpoint slug without a duplicate checkpoint name', () => {
    const actions = example.actions.map((action, index) =>
      index === 4 ? { ...action, id: 'bad/id' } : action
    );
    expect(() => parseEarnedFixture({ ...example, actions }, references)).toThrow();
  });

  it.each(Object.keys(example))('requires top-level field %s', (key) => {
    expect(() => parseEarnedFixture(without(example, key), references)).toThrow();
  });

  it.each(example.actions.map((action, index) => [index, action] as const))(
    'requires every field of action %s and rejects extra action fields',
    (index, action) => {
      for (const key of Object.keys(action)) {
        const actions = example.actions.map((entry, i) =>
          i === index ? without(action, key) : entry
        );
        expect(() => parseEarnedFixture({ ...example, actions }, references)).toThrow();
      }
      const actions = example.actions.map((entry, i) =>
        i === index ? { ...entry, snapshot: {} } : entry
      );
      expect(() => parseEarnedFixture({ ...example, actions }, references)).toThrow();
    }
  );

  it.each([
    null,
    [],
    'recipe',
    2,
    { ...example, snapshot: {} },
    { ...example, derivedStats: { life: 10000 } },
    { ...example, id: '../recipe' },
    { ...example, origin: { ...example.origin, classId: 'barbarian' } },
    { ...example, origin: { ...example.origin, kind: 'checkpoint' } },
    { ...example, origin: { ...example.origin, policy: 'import' } },
    { ...example, origin: { ...example.origin, level: 6 } },
    { ...example, origin: { ...example.origin, name: '' } },
    { ...example, origin: { ...example.origin, name: 'x'.repeat(41) } },
    { ...example, acquisitionSeedPolicy: 'random' },
    { ...example, mercPolicy: 'injected' },
    { ...example, summonPolicy: 'none' },
    ...[-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '1792497600000'].map(
      (clockEpochMs) => ({ ...example, clockEpochMs })
    ),
    ...[
      [],
      [1, 1],
      [-1],
      [0.5],
      [4294967296],
      [NaN],
      [Infinity],
      ['1'],
      Array.from({ length: 9 }, (_, i) => i)
    ].map((seeds) => ({ ...example, seeds })),
    ...[
      { act: 2 },
      { subAreaId: 'a1-den-of-evil' },
      { subAreaId: 'areas/act1-blood-moor' },
      { mode: 'idle' },
      { challengeOrdinal: 0 },
      { challengeOrdinal: 41 },
      { challengeOrdinal: 39 },
      { idleEliteMisses: 1 },
      { cleared: true }
    ].map((patch) => ({ ...example, scenario: { ...example.scenario, ...patch } })),
    { ...example, actions: [] },
    { ...example, actions: example.actions.filter((action) => action.kind !== 'farm-first-waves') },
    { ...example, actions: [farm, farm] },
    {
      ...example,
      actions: [
        farm,
        ...Array.from({ length: 32 }, (_, i) => ({
          kind: 'checkpoint',
          id: `checkpoint-${String(i)}`
        }))
      ]
    },
    { ...example, actions: [...example.actions, { kind: 'checkpoint', id: 'tracked' }] },
    { ...example, actions: [farm, { kind: 'set-player', level: 6 }] },
    ...[0, 41, 1.5, '40'].map((count) => withAction('farm-first-waves', { count })),
    withAction('farm-first-waves', { firstChallengeOrdinal: 1 }),
    withAction('farm-first-waves', { subAreaId: 'areas/act1-den-of-evil' }),
    ...[0, 21, 1.5, '1'].map((points) => withAction('allocate-skill', { points })),
    withAction('allocate-skill', { skillId: 'sorceress.fire_bolt' }),
    withAction('allocate-skill', { skillId: 'skills-barbarian-bash' }),
    withAction('allocate-skill', { skillId: 'skills-sorceress-unknown' }),
    withAction('set-combo', { skillIds: [fire, fire] }),
    withAction('set-combo', {
      skillIds: Array.from({ length: 10 }, (_, i) => `skills-sorceress-${String(i)}`)
    }),
    withAction('set-combo', { skillIds: ['skills-sorceress-warmth'] }),
    withAction('set-combo', { skillIds: ['sorceress.fire_bolt'] }),
    withAction('hire-merc', { mercId: 'mercs/unknown' }),
    withAction('accept-quest', { questId: 'quests/act1-sisters-to-the-slaughter' }),
    withAction('checkpoint', { id: 'bad/id' }),
    ...[
      {},
      { strength: 0, dexterity: 0, vitality: 0, energy: 0 },
      { strength: -1, dexterity: 0, vitality: 0, energy: 0 },
      { strength: 26, dexterity: 0, vitality: 0, energy: 0 },
      { strength: 25, dexterity: 1, vitality: 0, energy: 0 },
      { strength: 0.5, dexterity: 0, vitality: 0, energy: 0 },
      { strength: '1', dexterity: 0, vitality: 0, energy: 0 },
      { strength: 1, dexterity: 0, vitality: 0, energy: 0, life: 999 }
    ].map((deltas) => withAction('allocate-stats', { deltas }))
  ])('rejects malformed, unsupported and injected recipes %#', (input) => {
    expect(() => parseEarnedFixture(input, references)).toThrow();
  });

  it('requires closed nested origin, scenario, selector and allocation objects', () => {
    for (const key of Object.keys(example.origin)) {
      expect(() =>
        parseEarnedFixture({ ...example, origin: without(example.origin, key) }, references)
      ).toThrow();
    }
    for (const key of Object.keys(example.scenario)) {
      expect(() =>
        parseEarnedFixture({ ...example, scenario: without(example.scenario, key) }, references)
      ).toThrow();
    }
    for (const key of Object.keys(heroGloves.selector)) {
      expect(() =>
        parseEarnedFixture(
          {
            ...example,
            actions: [farm, { ...heroGloves, selector: without(heroGloves.selector, key) }]
          },
          references
        )
      ).toThrow();
    }
    for (const key of ['strength', 'dexterity', 'vitality', 'energy']) {
      expect(() =>
        parseEarnedFixture(
          withAction('allocate-stats', {
            deltas: without({ strength: 1, dexterity: 0, vitality: 0, energy: 0 }, key)
          }),
          references
        )
      ).toThrow();
    }
  });

  it.each([
    { ...heroGloves, owner: 'stash' },
    { ...heroGloves, mercId: merc },
    { ...heroGloves, owner: 'merc' },
    { ...heroGloves, owner: 'merc', mercId: 'mercs/unknown' },
    { ...heroGloves, slot: 'head' },
    ...[
      { baseId: 'items/base/unknown' },
      { baseId: 'items/base/helm-cap' },
      { rarity: 'rare' },
      { defense: -1 },
      { defense: 1001 },
      { defense: 1.5 },
      { defense: NaN },
      { defense: '5' },
      { selection: 'best-stat' },
      { item: { id: 'injected' } }
    ].map((patch) => ({ ...heroGloves, selector: { ...heroGloves.selector, ...patch } }))
  ])('rejects unsupported equipment selectors and ownership %#', (action) => {
    expect(() => parseEarnedFixture({ ...example, actions: [farm, action] }, references)).toThrow();
  });

  it('requires current canonical class, both area/act links and every referenced catalog row', () => {
    for (const key of ['classes', 'areas', 'skills', 'mercs', 'bases', 'quests'] as const) {
      expect(() => parseEarnedFixture(example, { ...references, [key]: [] })).toThrow();
    }
    for (const areaId of ['areas/act1-blood-moor', 'areas/act1-den-of-evil']) {
      expect(() =>
        parseEarnedFixture(example, {
          ...references,
          areas: references.areas.filter((area) => area.id !== areaId)
        })
      ).toThrow();
      const areas = references.areas.map((area) =>
        area.id === areaId ? { ...area, actId: 'acts/act2' } : area
      );
      expect(() => parseEarnedFixture(example, { ...references, areas })).toThrow();
    }
    const quests = references.quests.map((quest) => ({ ...quest, actId: 'acts/act2' }));
    expect(() => parseEarnedFixture(example, { ...references, quests })).toThrow();
    const wrongBases = bases.map((base) =>
      base.id === heroGloves.selector.baseId ? { ...base, slot: 'head' } : base
    );
    expect(() => parseEarnedFixture(example, { ...references, bases: wrongBases })).toThrow();
  });

  it.each(['mercs/act1-rogue-pierce', 'mercs/tavern-thief-pickpocket'])(
    'rejects real merc %s outside the production hire roster',
    (mercId) => {
      expect(mercPool.some((entry) => entry.id === mercId)).toBe(true);
      expect(mercs.some((entry) => entry.id === mercId)).toBe(false);
      expect(() => parseEarnedFixture(withAction('hire-merc', { mercId }), references)).toThrow();
      expect(() =>
        parseEarnedFixture(
          { ...example, actions: [farm, { ...heroGloves, owner: 'merc', mercId }] },
          references
        )
      ).toThrow();
    }
  );
});

describe('earned recipe fingerprint', () => {
  it('uses the existing path/byte protocol and canonical object keys for the whole recipe', () => {
    const fixture = parseEarnedFixture(example, references);
    const hash = fingerprintEarnedFixture(fixture);
    // Independently calculated with Python hashlib and sorted compact JSON:
    // domain bytes + ["fixture.json",1693] + canonical UTF-8 recipe bytes.
    expect(hash).toBe('60ac311d50e7db36d7d95d77dff9244adf3b54534290bc22c8b791546765d90a');
    const reordered = {
      ...Object.fromEntries(Object.entries(example).reverse()),
      origin: Object.fromEntries(Object.entries(example.origin).reverse())
    };
    expect(fingerprintEarnedFixture(parseEarnedFixture(reordered, references))).toBe(hash);
    expect(fixture).toEqual(example);
  });

  it('changes identity when action order, allocations, selector, count, clock or target seed changes', () => {
    const baseline = fingerprintEarnedFixture(parseEarnedFixture(example, references));
    const variants = [
      { ...example, id: 'different-recipe' },
      { ...example, origin: { ...example.origin, name: 'Other Sorc' } },
      { ...example, clockEpochMs: example.clockEpochMs + 1 },
      { ...example, seeds: [1] },
      { ...example, seeds: [1, 2] },
      { ...example, seeds: [2, 1] },
      {
        ...example,
        actions: [example.actions[1], example.actions[0], ...example.actions.slice(2)]
      },
      withAction('allocate-skill', { points: 4 }),
      {
        ...withAction('farm-first-waves', { count: 39 }),
        scenario: { ...example.scenario, challengeOrdinal: 39 }
      },
      {
        ...example,
        actions: example.actions.map((action, index) =>
          index === 7 ? { ...heroGloves, selector: { ...heroGloves.selector, defense: 6 } } : action
        )
      }
    ];
    const hashes = variants.map((input) =>
      fingerprintEarnedFixture(parseEarnedFixture(input, references))
    );
    expect(hashes.every((hash) => hash !== baseline)).toBe(true);
    expect(new Set(hashes).size).toBe(hashes.length);
  });
});

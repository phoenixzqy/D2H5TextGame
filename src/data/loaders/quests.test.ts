import { describe, expect, it } from 'vitest';
import mainDocument from '../quests/main.json';
import sideDocument from '../quests/side.json';
import itemBases from '../items/bases.json';
import uniqueItems from '../items/uniques.json';
import {
  actNumber, loadQuests, loadQuestsByAct, questI18nKey, questSlug
} from './quests';

const fixture = (id: string, fields: Record<string, unknown> = {}) => ({
  id: `quests/${id}`, name: `Fixture ${id}`, type: 'side', actId: 'acts/act1',
  description: 'Quest loader fixture',
  objectives: [{ id: 'clear', type: 'clear-area', description: 'Clear area', areaId: 'areas/cave' }],
  rewards: { xp: 0 }, ...fields
});
const envelope = (quests: object[]) => ({ $schema: '../schema/quest.schema.json', quests });

/** Replace only this isolated worker's imports; restore exact descriptors and row references. */
function withDocuments(main: object, side: object, check: () => void) {
  const savedMain = Object.getOwnPropertyDescriptors(mainDocument);
  const savedSide = Object.getOwnPropertyDescriptors(sideDocument);
  const clear = (target: object) => {
    for (const key of Reflect.ownKeys(target)) Reflect.deleteProperty(target, key);
  };
  try {
    clear(mainDocument);
    Object.assign(mainDocument, main);
    clear(sideDocument);
    Object.assign(sideDocument, side);
    check();
  } finally {
    clear(mainDocument);
    Object.defineProperties(mainDocument, savedMain);
    clear(sideDocument);
    Object.defineProperties(sideDocument, savedSide);
  }
}

const callers = [['loadQuests', loadQuests], ['loadQuestsByAct', loadQuestsByAct]] as const;
const catalogRewardIds = ['items/base/helm-skull-cap', 'items/unique/coif-of-glory'];
// Syntax-only examples: nonexistent references and the authoritative leading-hyphen boundary.
const syntaxRewardIds = ['items/base/not-in-catalog', 'items/unique/not-in-catalog',
  'items/base/-', 'items/unique/-'];
const legacyRewardIds = ['items/unique_act1_boss', 'items/quest-token', 'items/base',
  'items/unique', 'items/sets', 'items/legacy.name_with-dash'];
const invalidRewardIds: unknown[] = ['', null, 0, true, {}, [], 'items/base/', 'items/unique/',
  'items/unknown/foo', 'items/sets/foo', 'items/unique/foo/bar', 'items/unique/Foo',
  'items/unique/foo_bar', 'items/unique/foo.bar', 'items/base/Foo', 'items/base/foo_bar',
  'items/base/foo.bar', 'items//foo', '../items/unique/foo', 'unique/foo'];
const invalidDocuments = [
  { label: 'missing quests envelope', document: { $schema: '../schema/quest.schema.json' }, field: 'quests' },
  { label: 'missing clear-area areaId', document: envelope([fixture('invalid', {
    objectives: [{ id: 'clear', type: 'clear-area', description: 'Clear area' }]
  })]), field: 'areaId' },
  { label: 'unsupported objective kind', document: envelope([fixture('invalid', {
    objectives: [{ id: 'clear', type: 'unsupported', description: 'Clear area' }]
  })]), field: '/quests/0/objectives/0' },
  { label: 'negative XP', document: envelope([fixture('invalid', { rewards: { xp: -1 } })]), field: '/quests/0/rewards/xp' },
  { label: 'fractional XP', document: envelope([fixture('invalid', { rewards: { xp: 0.5 } })]), field: '/quests/0/rewards/xp' },
  { label: 'string XP', document: envelope([fixture('invalid', { rewards: { xp: '1' } })]), field: '/quests/0/rewards/xp' },
  { label: 'unknown quest field', document: envelope([fixture('invalid', { typo: true })]), field: '/quests/0' }
];

describe('synchronous quest consumer validation', () => {
  it('accepts empty documents and optional envelope metadata without inventing quests', () => {
    withDocuments({ quests: [] }, envelope([]), () => {
      const all = loadQuests();
      expect(all).toEqual([]);
      expect(Object.isFrozen(all)).toBe(true);
      expect(loadQuestsByAct().size).toBe(0);
      expect(mainDocument).toEqual({ quests: [] });
      expect(sideDocument).toEqual(envelope([]));
    });
  });

  it('preserves optional fields, zero rewards and structurally valid gameplay content unchanged', () => {
    const noRewards = fixture('no-rewards');
    const { rewards: omitted, ...withoutRewards } = noRewards;
    expect(omitted).toEqual({ xp: 0 });
    const futureRewards = fixture('structural-only', {
      unlocks: null, objectives: [{ id: 'gamble', type: 'gamble', description: 'Authored legacy objective', count: 1 }],
      rewards: { xp: 0, gold: 0, itemDrop: 'items/quest-token', npcUnlock: 'npc/cain' }
    });
    const main = { quests: [withoutRewards] };
    const side = envelope([futureRewards]);
    withDocuments(main, side, () => {
      const before = JSON.stringify([main, side]);
      const all = loadQuests();
      expect(all).toEqual([withoutRewards, futureRewards]);
      expect(all[0]).toBe(withoutRewards);
      expect(all[1]).toBe(futureRewards);
      expect(JSON.stringify([main, side])).toBe(before);
    });
  });

  it('returns all 46 authored rows by identity in main/side order without mutating the documents', () => {
    const before = JSON.stringify([mainDocument, sideDocument]);
    const expected = [...mainDocument.quests, ...sideDocument.quests];
    expect(mainDocument.quests).toHaveLength(24);
    expect(sideDocument.quests).toHaveLength(22);
    const first = loadQuests();
    const second = loadQuests();
    expect(first).toHaveLength(46);
    expect(first).toEqual(expected);
    first.forEach((row, index) => { expect(row).toBe(expected[index]); });
    expect(Object.isFrozen(first)).toBe(true);
    expect(second).not.toBe(first);
    expect(second).toEqual(first);
    expect(new Set(first.flatMap(row => row.objectives.map(objective => objective.type))).size).toBe(15);
    expect(new Set(first.flatMap(row => Object.keys(row.rewards ?? {}))).size).toBe(13);
    expect(JSON.stringify([mainDocument, sideDocument])).toBe(before);
  });

  for (const [caller, load] of callers) {
    for (const documentName of ['main', 'side'] as const) {
      it.each(invalidDocuments)(`${caller} rejects ${documentName}: $label with document/field context`, ({ document, field }) => {
        const main = documentName === 'main' ? document : envelope([fixture('valid-main')]);
        const side = documentName === 'side' ? document : envelope([fixture('valid-side')]);
        withDocuments(main, side, () => {
          let returned = false;
          let failure: unknown;
          try { load(); returned = true; } catch (error) { failure = error; }
          expect(returned).toBe(false);
          expect(failure).toBeInstanceOf(Error);
          if (!(failure instanceof Error)) throw new Error('Expected quest document rejection');
          expect(failure.message).toContain(`quests/${documentName}.json`);
          expect(failure.message).toContain(field);
        });
      });

      it(`${caller} rejects duplicate IDs within ${documentName}`, () => {
        const repeated = fixture('duplicate');
        const main = envelope(documentName === 'main' ? [repeated, repeated] : [fixture('valid-main')]);
        const side = envelope(documentName === 'side' ? [repeated, repeated] : [fixture('valid-side')]);
        withDocuments(main, side, () => {
          expect(load).toThrow(`Duplicate quest id "quests/duplicate" in quests/${documentName}.json`);
        });
      });

      it(`${caller} revalidates ${documentName} on valid/invalid/valid calls`, () => {
        const main = envelope([fixture('valid-main')]);
        const side = envelope([fixture('valid-side')]);
        withDocuments(main, side, () => {
          const before = load();
          const document = documentName === 'main' ? main : side;
          const row = document.quests[0];
          if (!row) throw new Error('Missing fixture quest');
          const malformed = fixture('invalid', { rewards: { xp: -1 } });
          document.quests[0] = malformed;
          try { expect(load).toThrow(`quests/${documentName}.json`); }
          finally { document.quests[0] = row; }
          expect(load()).toEqual(before);
        });
      });
    }

    it(`${caller} rejects duplicate IDs across main and side`, () => {
      const row = fixture('cross-duplicate');
      withDocuments(envelope([row]), envelope([row]), () => {
        expect(load).toThrow('Duplicate quest id "quests/cross-duplicate" in quests/side.json');
      });
    });

    it(`${caller} validates the side envelope before collecting duplicate main entries`, () => {
      const row = fixture('duplicate');
      withDocuments(envelope([row, row]), envelope([fixture('invalid', { rewards: { xp: -1 } })]), () => {
        expect(load).toThrow('quests/side.json');
        expect(load).toThrow('/quests/0/rewards/xp');
      });
    });
  }

  it('preserves act grouping, main-first order, optional order and ID tie sorting', () => {
    const mainB = fixture('main-b', { type: 'main', order: 2 });
    const mainA = fixture('main-a', { type: 'main', order: 2 });
    const mainFirst = fixture('main-first', { type: 'main', order: 1 });
    const side = fixture('side', { order: 1 });
    const bounty = fixture('bounty', { type: 'bounty', order: 3 });
    const unordered = fixture('unordered');
    const otherAct = fixture('act2', { actId: 'acts/act2' });
    const main = envelope([mainB, mainA, mainFirst]);
    const sides = envelope([unordered, bounty, side, otherAct]);
    withDocuments(main, sides, () => {
      const before = JSON.stringify([main, sides]);
      const grouped = loadQuestsByAct();
      expect([...grouped.keys()]).toEqual(['acts/act1', 'acts/act2']);
      const act1 = grouped.get('acts/act1');
      expect(act1?.map(row => row.id)).toEqual([
        'quests/main-first', 'quests/main-a', 'quests/main-b', 'quests/side', 'quests/bounty', 'quests/unordered'
      ]);
      expect(act1?.[0]).toBe(mainFirst);
      expect(grouped.get('acts/act2')?.[0]).toBe(otherAct);
      expect(JSON.stringify([main, sides])).toBe(before);
    });
  });

  it('preserves the existing slug, localization key and act helpers', () => {
    expect(questSlug('quests/act1-den-of-evil')).toBe('act1-den-of-evil');
    expect(questSlug('bare-id')).toBe('bare-id');
    expect(questI18nKey('quests/side-act1-charsis-imbue')).toBe('act1-charsis-imbue');
    expect(questI18nKey('quests/act1-den-of-evil')).toBe('act1-den-of-evil');
    expect(actNumber('acts/act5')).toBe('5');
    expect(actNumber('unknown')).toBe('unknown');
  });
});

describe('quest item reward identifier compatibility (BUG050)', () => {
  it('uses actual base and unique catalog IDs for the authored reward fixtures', () => {
    expect(itemBases.some(item => item.id === catalogRewardIds[0])).toBe(true);
    expect(uniqueItems.some(item => item.id === catalogRewardIds[1])).toBe(true);
    expect(syntaxRewardIds.every(id => !itemBases.some(item => item.id === id) &&
      !uniqueItems.some(item => item.id === id))).toBe(true);
  });

  for (const [caller] of callers) {
    for (const documentName of ['main', 'side'] as const) {
      it.each(catalogRewardIds)(`${caller} accepts ${documentName} canonical itemDrop %s unchanged`, itemDrop => {
        const row = fixture('canonical-reward', { rewards: { itemDrop, xp: 0 } });
        const main = envelope(documentName === 'main' ? [row] : []);
        const side = envelope(documentName === 'side' ? [row] : []);
        withDocuments(main, side, () => {
          const before = JSON.stringify([mainDocument, sideDocument]);
          const rows = caller === 'loadQuests' ? loadQuests() : loadQuestsByAct().get('acts/act1');
          expect(rows).toEqual([row]);
          expect(rows?.[0]).toBe(row);
          expect(rows?.[0]?.rewards).toBe(row.rewards);
          expect(JSON.stringify([mainDocument, sideDocument])).toBe(before);
        });
      });

      it.each([...syntaxRewardIds, ...legacyRewardIds])(
        `${caller} preserves ${documentName} syntax-only/legacy itemDrop %s without resolution`, itemDrop => {
          const row = fixture('syntax-reward', { rewards: { itemDrop } });
          const main = envelope(documentName === 'main' ? [row] : []);
          const side = envelope(documentName === 'side' ? [row] : []);
          withDocuments(main, side, () => {
            const before = JSON.stringify([mainDocument, sideDocument]);
            const rows = caller === 'loadQuests' ? loadQuests() : loadQuestsByAct().get('acts/act1');
            expect(rows).toEqual([row]);
            expect(rows?.[0]).toBe(row);
            expect(rows?.[0]?.rewards).toBe(row.rewards);
            expect(JSON.stringify([mainDocument, sideDocument])).toBe(before);
          });
        });

      it.each(invalidRewardIds)(`${caller} rejects ${documentName} malformed itemDrop %j with context`, itemDrop => {
        const row = fixture('invalid-reward', { rewards: { itemDrop } });
        const main = envelope(documentName === 'main' ? [row] : []);
        const side = envelope(documentName === 'side' ? [row] : []);
        withDocuments(main, side, () => {
          const before = JSON.stringify([mainDocument, sideDocument]);
          let failure: unknown;
          try { (caller === 'loadQuests' ? loadQuests : loadQuestsByAct)(); }
          catch (error) { failure = error; }
          expect(failure).toBeInstanceOf(Error);
          if (!(failure instanceof Error)) throw new Error('Expected malformed reward rejection');
          expect(failure.message).toContain(`quests/${documentName}.json`);
          expect(failure.message).toContain('/quests/0/rewards/itemDrop');
          expect(JSON.stringify([mainDocument, sideDocument])).toBe(before);
        });
      });
    }
  }
});


describe('explicit unique reward object syntax (P04a07a)', () => {
  const valid = [
    { uniqueId: 'items/unique/coif-of-glory', ilvl: 19 },
    { uniqueId: 'items/unique/pelta-lunata', ilvl: 3 },
    { uniqueId: 'items/unique/coif-of-glory', ilvl: 1 },
    { uniqueId: 'items/unique/not-in-catalog', ilvl: 1000000 },
    { uniqueId: 'items/unique/-', ilvl: 1 }
  ];
  const invalid: unknown[] = [
    {}, { uniqueId: valid[0]?.uniqueId }, { ilvl: 19 },
    ...[null, 19, true, [], {}, '', 'items/base/helm-skull-cap', 'items/unique/',
      'items/unique/Foo', 'items/unique/foo_bar', 'items/unique/foo.bar',
      'items/unique/foo/bar'].map(uniqueId => ({ uniqueId, ilvl: 19 })),
    ...[null, '19', true, 0, -1, 1.5, [], {}].map(ilvl => ({ uniqueId: valid[0]?.uniqueId, ilvl })),
    ...['quantity', 'rarity', 'metadata'].map(key => ({ ...valid[0], [key]: 1 }))
  ];
  it('anchors known fixtures in the production unique catalog', () => {
    for (const entry of valid.slice(0, 2)) expect(uniqueItems.some(item => item.id === entry.uniqueId)).toBe(true);
  });
  for (const [caller, load] of callers) {
    for (const documentName of ['main', 'side'] as const) {
      it.each(valid)(`${caller} preserves ${documentName} explicit $uniqueId level $ilvl without resolving`, itemDrop => {
        const row = fixture('explicit-unique', { rewards: { itemDrop, xp: 0 } });
        withDocuments(envelope(documentName === 'main' ? [row] : []),
          envelope(documentName === 'side' ? [row] : []), () => {
            const before = JSON.stringify([mainDocument, sideDocument]);
            const rows = caller === 'loadQuests' ? loadQuests() : loadQuestsByAct().get('acts/act1');
            expect(rows).toEqual([row]);
            expect(rows?.[0]).toBe(row);
            expect(rows?.[0]?.rewards).toBe(row.rewards);
            expect(rows?.[0]?.rewards?.itemDrop).toBe(itemDrop);
            expect(JSON.stringify([mainDocument, sideDocument])).toBe(before);
          });
      });
      it.each(invalid)(`${caller} rejects ${documentName} malformed explicit reward %j without mutation`, itemDrop => {
        const row = fixture('invalid-unique', { rewards: { itemDrop } });
        withDocuments(envelope(documentName === 'main' ? [row] : []),
          envelope(documentName === 'side' ? [row] : []), () => {
            const before = JSON.stringify([mainDocument, sideDocument]);
            let failure: unknown;
            try { load(); } catch (error) { failure = error; }
            expect(failure).toBeInstanceOf(Error);
            if (!(failure instanceof Error)) throw new Error('Expected explicit reward rejection');
            expect(failure.message).toContain(`quests/${documentName}.json`);
            expect(failure.message).toContain('/quests/0/rewards/itemDrop');
            expect(JSON.stringify([mainDocument, sideDocument])).toBe(before);
          });
      });
    }
  }
});


describe('closed permanent resistance data contract', () => {
  it.each([
    { fire_resist: 30 }, { cold_resist: 30 }, { fire_resist: -1, cold_resist: 30 },
    { fire_resist: 30.5, cold_resist: 30 }, { fire_resist: 30, cold_resist: Number.MAX_SAFE_INTEGER + 1 },
    { fire_resist: 30, cold_resist: 30, all_resist: 30 }, { fire_resist: '30', cold_resist: 30 }
  ])('rejects incomplete or unsafe stat pair %j', stat => {
    withDocuments(envelope([fixture('sun', { rewards: { stat } })]), envelope([]), () => {
      expect(() => loadQuests()).toThrow();
    });
  });
  it.each([{ fire_resist: 0, cold_resist: 0 }, { fire_resist: 17, cold_resist: 23 }])('accepts safe authored pair %j', stat => {
    withDocuments(envelope([fixture('sun', { rewards: { stat } })]), envelope([]), () => {
      expect(loadQuests()[0]?.rewards).toEqual({ stat });
    });
  });
});

import { describe, expect, it } from 'vitest';
import quests from '../quests/main.json';
import acts from '../maps/acts.json';

describe('compact Act II quest unlock metadata', () => {
  it.each(['quests/act2-horadric-staff', 'quests/act2-arcane-sanctuary'])(
    '%s does not advertise another map area', id => {
      const quest = quests.quests.find(row => row.id === id);
      expect(quest).toBeDefined();
      expect(quest?.unlocks).toBeNull();
    }
  );

  it('resolves objective and unlock areas against the unchanged six-area Act II map', () => {
    const act = acts.find(row => row.id === 'acts/act2');
    expect(act?.subAreas).toEqual([
      'areas/act2-rocky-waste', 'areas/act2-dry-hills', 'areas/act2-far-oasis',
      'areas/act2-lost-city', 'areas/act2-arcane-sanctuary', 'areas/act2-tomb-of-tal-rasha'
    ]);
    const references: { quest: string; area: string }[] = [];
    for (const row of quests.quests.filter(quest => quest.actId === 'acts/act2')) {
      if (row.unlocks?.startsWith('areas/')) references.push({ quest: row.id, area: row.unlocks });
      for (const objective of row.objectives) {
        if ('areaId' in objective && typeof objective.areaId === 'string') {
          references.push({ quest: row.id, area: objective.areaId });
        }
      }
    }
    expect(references.length).toBeGreaterThan(0);
    expect(references.filter(row => !act?.subAreas.includes(row.area))).toEqual([]);
  });

  it('retains the Seven Tombs Act III progression reference', () => {
    expect(quests.quests.find(row => row.id === 'quests/act2-seven-tombs')?.unlocks)
      .toBe('acts/act3');
  });
});

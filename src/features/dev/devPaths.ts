export interface DevDataFile {
  readonly label: string;
  readonly path: string;
}

export const classFiles: readonly DevDataFile[] = [
  { label: 'Amazon', path: 'src/data/classes/amazon.json' },
  { label: 'Assassin', path: 'src/data/classes/assassin.json' },
  { label: 'Barbarian', path: 'src/data/classes/barbarian.json' },
  { label: 'Druid', path: 'src/data/classes/druid.json' },
  { label: 'Necromancer', path: 'src/data/classes/necromancer.json' },
  { label: 'Paladin', path: 'src/data/classes/paladin.json' },
  { label: 'Sorceress', path: 'src/data/classes/sorceress.json' }
];

export const skillFiles: readonly DevDataFile[] = [
  { label: 'Amazon', path: 'src/data/skills/amazon.json' },
  { label: 'Assassin', path: 'src/data/skills/assassin.json' },
  { label: 'Barbarian', path: 'src/data/skills/barbarian.json' },
  { label: 'Druid', path: 'src/data/skills/druid.json' },
  { label: 'Necromancer', path: 'src/data/skills/necromancer.json' },
  { label: 'Paladin', path: 'src/data/skills/paladin.json' },
  { label: 'Sorceress', path: 'src/data/skills/sorceress.json' },
  { label: 'Monsters', path: 'src/data/skills/monsters.json' },
  { label: 'Mercenary', path: 'src/data/skills/mercenary.json' }
];

export const monsterFiles: readonly DevDataFile[] = [1, 2, 3, 4, 5].map((act) => ({
  label: `Act ${String(act)}`,
  path: `src/data/monsters/act${String(act)}.json`
}));

export const subAreaFiles: readonly DevDataFile[] = [1, 2, 3, 4, 5].map((act) => ({
  label: `Act ${String(act)}`,
  path: `src/data/maps/sub-areas/act${String(act)}.json`
}));

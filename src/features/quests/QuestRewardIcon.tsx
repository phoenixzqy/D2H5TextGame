// Inline artwork avoids depending on platform emoji fonts for reward badges.
const PATHS: Readonly<Record<string, string>> = {
  xp: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z',
  gemShards: 'm3 8 4-5h10l4 5-9 13L3 8Zm0 0h18M7 3l5 18 5-18',
  runeShards: 'M8 3h8v18H8V3Zm3 4 3 3-3 3 3 3-3 2',
  gold: 'M20 6c0 2-4 3-8 3S4 8 4 6s4-3 8-3 8 1 8 3ZM4 6v12c0 2 4 3 8 3s8-1 8-3V6M4 12c0 2 4 3 8 3s8-1 8-3',
  skillPoints: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-4 0a5 5 0 1 1-10 0 5 5 0 0 1 10 0Zm-5-2v4m-2-2h4',
  statPoints: 'M3 3v18h18M6 16l5-5 4 3 6-8m-5 0h5v5',
  stat: 'M3 3v18h18M6 16l5-5 4 3 6-8m-5 0h5v5',
  mercenaryUnlock: 'm12 2 9 4v6c0 5-5 8-9 10-4-2-9-5-9-10V6l9-4Zm0 5v10m-4-5h8',
  service: 'M3 3h7l11 11-7 7L3 10V3Zm4 4h.01',
  title: 'm8 3 4 6 4-6M7 14a5 5 0 1 0 10 0 5 5 0 0 0-10 0Zm5-2v4m-2-2h4',
  itemDrop: 'M3 8h18v4H3V8Zm2 4v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z',
  questItem: 'M5 3h14v18H5V3Zm4 5h6m-6 4h6m-6 4h4',
  lootTable: 'm3 7 9-4 9 4v13H3V7Zm0 0h18M12 7v13m-3-9h6',
  areaUnlock: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16',
  npcUnlock: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 6 0 0 1 16 0v2',
  vendorUnlock: 'M3 10h18l-2-7H5l-2 7Zm2 0v11h14V10M9 21v-7h6v7'
};

/** Decorative reward artwork; the adjacent localized text supplies its meaning. */
export function QuestRewardIcon({ kind }: { kind: string }) {
  const path = PATHS[kind];
  if (!path) return null;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-1 inline-block h-3.5 w-3.5 align-text-bottom"
    >
      <path d={path} />
    </svg>
  );
}

import { afterEach, describe, expect, it, vi } from 'vitest';
import * as quests from '@/data/loaders/quests';
import { useMapStore } from './mapStore';

const id = 'quests/side-act3-ormus-charm', first = 'obj-kill-shamans';
const area = 'areas/act3-flayer-jungle', proof = `${id}#action:flayer-jungle-victory`;
const catalog = quests.loadQuests(), quest = catalog.find(row => row.id === id);
if (!quest) throw new Error('Missing advertised Ormus quest');
function track(objective: quests.QuestDef['objectives'][number], flags: Record<string, boolean> = {}) {
  vi.spyOn(quests, 'loadQuests').mockReturnValue(catalog.map(row => row.id === id ? { ...row, objectives: [objective] } : row));
  useMapStore.getState().reset(); useMapStore.setState({ currentAct: 3,
    questProgress: { [id]: { id, status: 'inProgress', rewardClaimed: false, objectives: flags } },
    questReceipts: { [proof]: true } });
}
afterEach(() => { useMapStore.getState().reset(); vi.restoreAllMocks(); });
describe('Ormus objectives require their protected source actions', () => {
  it('generic area marks retain area history without granting the clear objective', () => {
    track({ id: first, type: 'clear-area', areaId: area, description: 'fixture' });
    const row = useMapStore.getState().questProgress[id];
    useMapStore.getState().markCleared(area);
    expect(useMapStore.getState().clearedSubAreas).toEqual([area]);
    expect(useMapStore.getState().questProgress[id]).toBe(row);
  });
  it('generic actual-town Ormus talk cannot grant the protected Talk', () => {
    track({ id: 'obj-return-ormus', type: 'talk', npcId: 'npc/ormus', description: 'fixture' });
    const row = useMapStore.getState().questProgress[id];
    useMapStore.getState().recordNpcTalk('npc/ormus');
    expect(useMapStore.getState().questProgress[id]).toBe(row);
  });
  it('generic monster kills cannot activate the old shaman objective', () => {
    track({ id: first, type: 'kill', targetId: 'monsters/fetish_shaman', areaId: area, count: 1, description: 'fixture' });
    const row = useMapStore.getState().questProgress[id];
    useMapStore.getState().recordMonsterKills({ actId: 'acts/act3', areaId: area, archetypeIds: ['monsters/fetish_shaman'] });
    expect(useMapStore.getState().questProgress[id]).toBe(row);
  });
  it('generic boss events cannot activate a matching protected objective', () => {
    track({ id: first, type: 'kill-boss', targetId: 'monsters/fetish_shaman', areaId: area, description: 'fixture' });
    const row = useMapStore.getState().questProgress[id];
    useMapStore.getState().recordBossKill({ actId: 'acts/act3', areaId: area, bossArchetypeId: 'monsters/fetish_shaman' });
    expect(useMapStore.getState().questProgress[id]).toBe(row);
  });
});

import { snapshotStores } from './persistence';
import { beginMaterialTransaction, endMaterialTransaction, reserveWaveRestore, releaseWaveRestore } from './waveTransitionGuard';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useHydrationStore } from './hydrationStore';
import { useCombatStore } from './combatStore';
import { prepareTownRespec, executeTownRespec } from './respecActions';

beforeEach(() => {
  useCombatStore.getState().reset(); useMapStore.getState().reset(); useInventoryStore.getState().reset();
  useHydrationStore.getState().setStatus('ready');
  const p = createMockPlayer('Reset', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...p, level: 24, skillPoints: 2, skillLevels: { 'sorceress.ice_blast': 20 },
    derivedStats: { ...p.derivedStats, life: 31, mana: 17 } });
});
function request() {
  const quote = prepareTownRespec('npc/akara', 'skill');
  if (quote.kind !== 'ok') throw new Error(quote.kind);
  return quote.request;
}
describe('ordinary town reset transaction', () => {
  it('does not mutate on quote; consumes once and preserves real resources', () => {
    const before = usePlayerStore.getState().player, quoted = request();
    expect(usePlayerStore.getState().player).toBe(before);
    expect(executeTownRespec(quoted)).toBe('ok');
    expect(usePlayerStore.getState().player).toMatchObject({ skillPoints: 22, skillLevels: {},
      respecsRemaining: { stat: 3, skill: 2 }, derivedStats: { life: 31, mana: 17 } });
    expect(executeTownRespec(quoted)).toBe('stale');
  });
  it('pays real wishstones with no synthetic gold or gacha payment', () => {
    usePlayerStore.setState(state => ({ player: state.player && { ...state.player, respecsRemaining: { stat: 3, skill: 0 } } }));
    useInventoryStore.setState({ currencies: { wishstone: 5, 'rune-shard': 19 } });
    expect(executeTownRespec(request())).toBe('ok');
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 0, 'rune-shard': 19 });
  });
  it('refuses changed confirmation basis and combat without spending', () => {
    const quote = request(); useInventoryStore.setState({ currencies: { wishstone: 1 } });
    expect(executeTownRespec(quote)).toBe('stale');
    useCombatStore.setState({ inCombat: true });
    expect(prepareTownRespec('npc/akara', 'skill').kind).toBe('combat-active');
  });
  it('refuses wrong NPC and incomplete hydration', () => {
    expect(prepareTownRespec('npc/drognan', 'skill').kind).toBe('wrong-town');
    useHydrationStore.getState().setStatus('loading');
    expect(prepareTownRespec('npc/akara', 'skill').kind).toBe('not-ready');
  });
  it('restores both participants after a player observer throws', () => {
    usePlayerStore.setState(state => ({ player: state.player && { ...state.player, respecsRemaining: { stat: 3, skill: 0 } } }));
    useInventoryStore.setState({ currencies: { wishstone: 5 } });
    const before = usePlayerStore.getState().player, quote = request();
    let throws = true;
    const unsubscribe = usePlayerStore.subscribe(() => { if (throws) { throws = false; throw new Error('observer'); } });
    try { expect(executeTownRespec(quote)).toBe('grant-failed'); } finally { unsubscribe(); }
    expect(usePlayerStore.getState().player).toBe(before);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 5 });
  });
});

describe('town reset ownership and separate allowances', () => {
  it('keeps snapshots and competing payments excluded until every publication finishes', () => {
    usePlayerStore.setState(state => ({ player: state.player && { ...state.player, respecsRemaining: { stat: 3, skill: 0 } } }));
    useInventoryStore.setState({ currencies: { wishstone: 5 } });
    const quote = request(); let checks = 0;
    const unsubscribe = useInventoryStore.subscribe(() => {
      checks++; expect(() => snapshotStores()).toThrow();
      expect(() => useInventoryStore.getState().spendCurrency('wishstone', 1)).toThrow();
    });
    try { expect(executeTownRespec(quote)).toBe('ok'); } finally { unsubscribe(); }
    expect(checks).toBe(1); expect(snapshotStores()?.player.respecsRemaining).toEqual({ stat: 3, skill: 0 });
  });
  it('refuses unresolved restore and competing transactions without touching the hero', () => {
    const before = usePlayerStore.getState().player;
    const restore = reserveWaveRestore();
    try { expect(() => prepareTownRespec('npc/akara', 'skill')).toThrow(); } finally { releaseWaveRestore(restore); }
    const material = beginMaterialTransaction(true);
    try { expect(() => prepareTownRespec('npc/akara', 'skill')).toThrow(); } finally { endMaterialTransaction(material); }
    expect(usePlayerStore.getState().player).toBe(before);
  });
  it('uses each free allowance independently and clamps only reduced stat maxima', () => {
    const p = usePlayerStore.getState().player; if (!p) throw new Error('Missing fixture hero');
    usePlayerStore.setState({ player: { ...p, coreStats: { ...p.coreStats, vitality: 110, energy: 135 }, statPoints: 7,
      derivedStats: { ...p.derivedStats, life: 999, mana: 999 } } });
    const skill = request(); expect(executeTownRespec(skill)).toBe('ok');
    const stat = prepareTownRespec('npc/akara', 'stat'); if (stat.kind !== 'ok') throw new Error(stat.kind);
    expect(stat.refund).toBe(200); expect(executeTownRespec(stat.request)).toBe('ok');
    const result = usePlayerStore.getState().player; if (!result) throw new Error('Missing reset hero');
    expect(result.statPoints).toBe(207); expect(result.skillPoints).toBe(22);
    expect(result.respecsRemaining).toEqual({ stat: 2, skill: 2 });
    expect(result.derivedStats.life).toBe(result.derivedStats.lifeMax);
    expect(result.derivedStats.mana).toBe(result.derivedStats.manaMax);
  });
});

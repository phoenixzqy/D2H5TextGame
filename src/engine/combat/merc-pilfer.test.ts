import { afterEach, beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from '@/stores/mercFactory';
import { mercToCombatUnit } from '@/stores/mercToCombatUnit';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { MERC_PILFER_SKILL } from '../skills/merc-pilfer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const PILFER = 'mskill-pilfer';
const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1,
  remaining: -1, appliedAtMs });
function fixture() {
  const def = loadMercPool().pool.find(row => row.id === 'mercs/tavern-thief-pickpocket');
  if (!def) throw new Error('Missing native Pickpocket');
  const native = mercToCombatUnit(createMercFromDef(def, 'combat'));
  // Constructed survivor pools and timed target death isolate native mechanics, not earned play.
  const merc: CombatUnit = { ...native, life: 10000, mana: 0,
    stats: { ...native.stats, life: 10000, lifeMax: 10000, mana: 0, manaMax: 0,
      attack: 1, attackSpeed: 263, defense: 0, critChance: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const enemy: CombatUnit = { ...merc, id: 'pilfer-target', kind: 'monster', side: 'enemy', skillOrder: [],
    life: 3000, attackRange: [10, 10], statuses: [hold(), { id: 'poison', sourceId: 'fixture', stacks: 1,
      remaining: -1, dotPerStack: 500, damageType: 'poison' }],
    stats: { ...merc.stats, life: 3000, lifeMax: 3000, attack: 10, attackSpeed: 100 } };
  return { merc, enemy };
}
function record(merc: CombatUnit, enemy: CombatUnit, allies: readonly CombatUnit[] = [], seed = 7) {
  const input: CombatSnapshot = { seed, playerTeam: [...allies, ...(merc.side === 'player' ? [merc] : [])],
    enemyTeam: [...(merc.side === 'enemy' ? [merc] : []), enemy] };
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  return out;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it('pays ordinary CD2 at zero MP, repeats without stacking and preserves caller stats', () => {
  const { merc, enemy } = fixture(), out = record(merc, enemy);
  const casts = out.events.filter(event => event.kind === 'action' && event.actor === merc.id && event.skillId === PILFER);
  expect(casts.length).toBeGreaterThan(1);
  expect(casts[0]?.simClockMs).toBe(400);
  for (let i = 1; i < casts.length; i++) {
    expect((casts[i]?.simClockMs ?? 0) - (casts[i - 1]?.simClockMs ?? 0)).toBe(2000);
  }
  expect(out.result.mercPilferGoldFind).toBe(30);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
  expect(out.result.playerTeam[0]?.stats).toEqual(merc.stats);
});

it('uses fixed authored damage independently of Attack and rank', () => {
  const { merc, enemy } = fixture();
  const amounts = ([[1, 1], [1, 9999], [20, 1], [20, 9999]] as const).map(([rank, attack]) => {
    const out = record({ ...merc, statuses: [hold(401)], skillLevels: { [PILFER]: rank },
      stats: { ...merc.stats, attack } }, enemy);
    const hit = out.events.find(event => event.kind === 'damage' && event.source === merc.id);
    if (hit?.kind !== 'damage') throw new Error('Missing native Pilfer hit');
    expect(hit.simClockMs).toBe(400);
    expect(hit.damageType).toBe('physical');
    expect(hit.dodged).toBe(false);
    expect(hit.amount).toBeGreaterThanOrEqual(14);
    expect(hit.amount).toBeLessThanOrEqual(24);
    expect(out.result.mercPilferGoldFind).toBe(30);
    return hit.amount;
  });
  expect(new Set(amounts).size).toBe(1);
});

it('activates on a paid miss', () => {
  const { merc, enemy } = fixture(), out = record({ ...merc, statuses: [hold(401)] },
    { ...enemy, stats: { ...enemy.stats, physDodge: 1 } }, [], 4);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'damage', source: merc.id,
    simClockMs: 400, amount: 0, dodged: true }));
  expect(out.result.mercPilferGoldFind).toBe(30);
});

it('retains the paid modifier after the source dies and another ally survives', () => {
  const { merc, enemy } = fixture();
  const ally: CombatUnit = { ...merc, id: 'surviving-ally', kind: 'hero', skillOrder: [], statuses: [hold()] };
  const out = record({ ...merc, life: 1 }, { ...enemy,
    statuses: enemy.statuses.filter(status => status.id !== 'stun') }, [ally]);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: merc.id }));
  expect(out.result.playerTeam.find(unit => unit.id === merc.id)?.life).toBe(0);
  expect(out.result.winner).toBe('player');
  expect(out.result.mercPilferGoldFind).toBe(30);
});

it('does not stack across two actual qualified Pickpockets', () => {
  const { merc, enemy } = fixture(), second = { ...merc, id: `${merc.id}#second` };
  const out = record(merc, enemy, [second]);
  for (const id of [merc.id, second.id]) expect(out.events).toContainEqual(expect.objectContaining({
    kind: 'action', actor: id, skillId: PILFER }));
  expect(out.result.mercPilferGoldFind).toBe(30);
});

it.each([
  { id: 'merc-mercs/tavern-thief-pickpocket-forged#1' },
  { kind: 'hero' as const }, { kind: 'monster' as const }, { kind: 'summon' as const },
  { summon: true }, { ownerId: 'owner' }, { summonOwnerId: 'owner' }, { summonTemplateId: 'minion' },
  { side: 'enemy' as const }, ...[0, NaN, Infinity, 1.5].map(level => ({ level })),
  { life: 0 }, { statuses: [hold()] }, { skillOrder: [] }, { cooldowns: { [PILFER]: 1000000000 } },
  { mana: NaN }, { mana: -1 }
])('requires a live eligible original body and an actual paid native cast %j', patch => {
  const { merc, enemy } = fixture();
  const ally = { ...merc, id: 'held-ally', kind: 'hero' as const, statuses: [hold()], skillOrder: [] };
  const body = { ...merc, ...patch }, out = record(body, enemy, [ally]);
  expect(out.result).not.toHaveProperty('mercPilferGoldFind');
  expect(out.events.some(event => event.kind === 'action' && event.actor === body.id && event.skillId === PILFER)).toBe(false);
});

it('requires the factory marker even on the exact template and owned bar', () => {
  const { merc, enemy } = fixture();
  const { mercPilferSource: _marker, ...unqualified } = merc;
  expect(record(unqualified, enemy).result).not.toHaveProperty('mercPilferGoldFind');
});

it('refuses a same-ID registry replacement before native payment', () => {
  registerSkill({ ...MERC_PILFER_SKILL });
  const { merc, enemy } = fixture(), out = record(merc, enemy);
  expect(out.result).not.toHaveProperty('mercPilferGoldFind');
  expect(out.events.some(event => event.kind === 'action' && event.skillId === PILFER)).toBe(false);
});

it('starts a new simulation inactive even with prior carried units and forged paid fields', () => {
  const { merc, enemy } = fixture(), first = record(merc, enemy);
  const carried = first.result.playerTeam[0];
  if (!carried) throw new Error('Missing paid source');
  const next = { ...carried, statuses: [hold()], activeBuffIds: [PILFER] };
  Object.assign(next, { mercPilferGoldFind: 30 });
  expect(first.result.mercPilferGoldFind).toBe(30);
  expect(record(next, enemy).result).not.toHaveProperty('mercPilferGoldFind');
});

import { afterEach, beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/amazon.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import type { Item } from '@/engine/types/items';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useFormationStore } from '@/stores/formationStore';

const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'synthetic-hold', stacks: 1,
  remaining: -1, appliedAtMs });
function owner(slug: string, rank = 1) {
  const levels: Record<string, number> = {};
  function add(id: string) {
    const row = rows.find(row => row.id === id);
    if (!row) throw new Error('Missing Amazon prerequisite');
    for (const prerequisite of row.prerequisites ?? []) add(prerequisite);
    levels[id] = 1;
  }
  const id = 'skills-amazon-' + slug; add(id); levels[id] = rank;
  return { ...createMockPlayer('Synthetic native Amazon javelin diagnosis', 'amazon'), id: 'hero',
    level: 30, skillLevels: levels, comboOrder: [id] };
}
/** Real canonical equip/projection; isolated pools and cadence are not earned balance. */
function fixture(slug: string, rank = 1): CombatSnapshot {
  const player = owner(slug, rank);
  usePlayerStore.getState().setPlayer({ ...player, skillLevels: {}, skillPoints: 29 });
  for (const [id, points] of Object.entries(player.skillLevels)) for (let point = 0; point < points; point++)
    expect(usePlayerStore.getState().allocateSkillPoint(id)).toBe('ok');
  expect(usePlayerStore.getState().player?.skillPoints).toBe(29 - Object.values(player.skillLevels).reduce((a,b) => a+b, 0));
  const bow: Item = { id: 'javelin-diagnostic-bow', baseId: 'items/base/weapon-bow-training',
    rarity: 'normal', level: 1, ilvl: 1, baseRolls: { attack: 13 }, identified: true, equipped: false };
  useInventoryStore.getState().addItem(bow);
  expect(useInventoryStore.getState().equipItem(bow)).toEqual({ ok: true });
  const current = usePlayerStore.getState().player;
  if (!current) throw new Error('Missing native Amazon');
  const native = playerToCombatUnit(current);
  expect(native.equippedWeapon?.weaponType).toBe('bow');
  const hero: CombatUnit = { ...native, life: 2000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, statuses: [hold(1701)],
    stats: { ...native.stats, life: 2000, lifeMax: 2000, mana: 100, manaMax: 100,
      attack: 1, attackSpeed: 100, defense: 0, magicResist: 0, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  const target: CombatUnit = { ...hero, id: 'target', side: 'enemy', kind: 'monster', tier: 'trash',
    mana: 0, skillOrder: [], skillLevels: {}, statuses: [hold()], gridPosition: { row: 0, col: 0 } };
  return { seed: 7, playerTeam: [hero], enemyTeam: [target,
    { ...target, id: 'reserve', gridPosition: { row: 2, col: 2 } }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  return out;
}
beforeEach(() => {
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useFormationStore]) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

const hits = (out: ReturnType<typeof record>) => out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []);
function nearby(slug: string, rank = 1): CombatSnapshot {
  const input = fixture(slug, rank), target = input.enemyTeam[0];
  if (!target) throw new Error('Missing native target');
  return { ...input, enemyTeam: [target, { ...target, id: 'nearby', gridPosition: { row: 0, col: 1 } },
    { ...target, id: 'outside', gridPosition: { row: 9, col: 9 } }] };
}
for (const rank of [1, 20]) {
  it(`Power rank${String(rank)} settles one mixed primary then two independent Lightning bolts for 10MP`, () => {
    const out = record(fixture('power-strike', rank));
    expect(hits(out).map(e => [e.target,e.damageType,e.amount])).toEqual((rank === 1 ? [20,20,13,11] : [58,58,32,30])
      .map((amount,index) => ['target',index === 0 ? 'physical' : 'lightning',amount]));
    expect(out.result.enemyTeam.map(u => u.life)).toEqual(rank === 1 ? [1936,2000] : [1822,2000]);
    expect(out.result.playerTeam[0]?.mana).toBe(90);
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero')).toHaveLength(1);
    expect(out.events.flatMap(e => e.kind === 'mana' && e.reason === 'cast' ? [e.mana] : [])).toEqual([90]);
    expect(out.events.some(e => e.kind === 'status' && e.statusId === 'paralyze')).toBe(false);
  });
  it(`Charged rank${String(rank)} lands once and sends one bolt to its adjacent original without outside fill`, () => {
    const out = record(nearby('charged-strike', rank));
    expect(hits(out).map(e => [e.target,e.damageType,e.amount])).toEqual([
      ['target','lightning',rank === 1 ? 71 : 185],['nearby','lightning',rank === 1 ? 43 : 100]]);
    expect(out.result.enemyTeam.map(u => u.life)).toEqual(rank === 1 ? [1929,1957,2000] : [1815,1900,2000]);
    expect(out.events.flatMap(e => e.kind === 'mana' && e.reason === 'cast' ? [e.mana] : [])).toEqual([80]);
  });
  it(`Poison cloud rank${String(rank)} pays once for two direct hits and exact five-second Poison tails`, () => {
    const out = record(nearby('poison-javelin', rank));
    expect(hits(out).filter(e => e.damageType === 'poison').map(e => [e.target,e.amount])).toEqual([
      ['target',rank === 1 ? 20 : 305],['nearby',rank === 1 ? 26 : 311]]);
    expect(out.events.flatMap(e => e.kind === 'status' && e.statusId === 'poison' ? [e.target] : [])).toEqual(['target','nearby']);
    expect(out.result.enemyTeam.map(u => u.life)).toEqual(rank === 1 ? [1975,1969,2000] : [1620,1614,2000]);
    expect(out.result.enemyTeam.every(u => !u.statuses.some(s => s.id === 'poison'))).toBe(true);
    expect(out.events.flatMap(e => e.kind === 'mana' && e.reason === 'cast' ? [e.mana] : [])).toEqual([90]);
  });
  it(`Lightning chain rank${String(rank)} reaches three distinct originals with independent damage and Paralyze`, () => {
    const input=fixture('lightning-strike',rank), target=input.enemyTeam[0];
    if (!target) throw new Error('Missing native target');
    const out=record({...input,enemyTeam:[target,{...target,id:'diagonal',gridPosition:{row:2,col:2}},
      {...target,id:'far',gridPosition:{row:4,col:4}}]});
    expect(hits(out).map(e => [e.target,e.amount])).toEqual((rank === 1 ? [81,92,102] : [1506,1517,1527])
      .map((amount,i) => [['target','diagonal','far'][i],amount]));
    expect(out.events.flatMap(e => e.kind === 'status' && e.statusId === 'paralyze' ? [e.target] : [])).toEqual(['target','diagonal','far']);
    expect(out.events.flatMap(e => e.kind === 'mana' && e.reason === 'cast' ? [e.mana] : [])).toEqual([75]);
  });
}
for (const [slug,cost] of [['power-strike',10],['charged-strike',20],['poison-javelin',10],['lightning-strike',25]] as const) {
  it.each(['mana','cooldown'] as const)(`${slug} refuses all payloads for insufficient %s`, reason => {
    const input=fixture(slug), runtime='amazon.'+slug.replaceAll('-','_');
    const out=record({...input,playerTeam:input.playerTeam.map(u=>({...u,mana:reason==='mana'?cost-1:100,
      cooldowns:reason==='cooldown'?{[runtime]:100000}:{}}))});
    expect(out.events.some(e=>e.kind==='action'&&e.skillId===runtime)).toBe(false);
    expect(out.events.some(e=>e.kind==='mana'&&e.reason==='cast')).toBe(false);
    expect(out.result.playerTeam[0]?.mana).toBe(reason==='mana'?cost-1:100);
  });
  it(`${slug} filters wrong class, level, hard allocation and prerequisite`,()=>{
    fixture(slug);const player=owner(slug),row=rows.find(r=>r.id==='skills-amazon-'+slug);
    if(!row) throw new Error('Missing native definition');
    expect(playerToCombatUnit(player).skillOrder).toContain(row.id);
    const absent={...player.skillLevels};Reflect.deleteProperty(absent,row.id);
    const missing={...player.skillLevels};const prerequisite=row.prerequisites?.[0];
    if(!prerequisite) throw new Error('Missing native prerequisite');
    Reflect.deleteProperty(missing,prerequisite);
    for(const patch of [{class:'barbarian' as const},{level:row.requiredLevel-1},{skillLevels:absent},{skillLevels:missing}])
      expect(playerToCombatUnit({...player,...patch}).skillOrder).not.toContain(row.id);
  });
}

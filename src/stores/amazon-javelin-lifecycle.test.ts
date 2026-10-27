import { afterEach, beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/amazon.json';
import { createRng } from '@/engine/rng';
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
function units(input: CombatSnapshot) { const hero=input.playerTeam[0],target=input.enemyTeam[0];
  if(!hero||!target) throw new Error('Missing isolated native units');return {hero,target}; }
it('Power shares one primary hit/base/crit decision and independently rolls two bolts across 64 seeds',()=>{
  const input=fixture('power-strike'),{hero}=units(input);
  for(let seed=1;seed<=64;seed++) {
    const rng=createRng(seed),landed=rng.chance(.85),base=landed?rng.nextInt(40,60):0,crit=landed?rng.chance(.5):false;
    const expected=[...['physical','lightning'].map(damageType=>({damageType,amount:landed?Math.floor(base/2*(crit?1.5:1)):0,crit,dodged:!landed}))];
    if(landed) for(let bolt=0;bolt<2;bolt++) {
      const hit=rng.chance(.85),raw=hit?rng.nextInt(10,15):0,critical=hit?rng.chance(.5):false;
      expected.push({damageType:'lightning',amount:hit?Math.floor(raw*(critical?1.5:1)):0,crit:critical,dodged:!hit});
    }
    const out=record({...input,seed,playerTeam:[{...hero,stats:{...hero.stats,critChance:.5}}]});
    expect(hits(out).map(({damageType,amount,crit,dodged})=>({damageType,amount,crit,dodged})),String(seed)).toEqual(expected);
  }
});
it('Power applies Physical and Lightning mitigation separately, including each independent bolt',()=>{
  const input=fixture('power-strike'),out=record({...input,enemyTeam:input.enemyTeam.map(u=>({...u,
    stats:{...u.stats,defense:7,magicResist:4,resistances:{...u.stats.resistances,physical:50,lightning:25}}}))});
  expect(hits(out).map(e=>e.amount)).toEqual([3,11,5,4]);
  expect(out.result.enemyTeam.map(u=>u.life)).toEqual([1977,2000]);
});
for(const slug of ['power-strike','charged-strike']) it(`${slug} emits no bolt when the paid primary misses`,()=>{
  const out=record({...fixture(slug),seed:41});
  expect(hits(out)).toHaveLength(slug==='power-strike'?2:1);
  expect(hits(out).every(e=>e.amount===0&&e.dodged)).toBe(true);
  expect(out.result.enemyTeam.map(u=>u.life)).toEqual([2000,2000]);
});
it('Power stops original-target bolts after lethal primary without spill or repeated death',()=>{
  const input=fixture('power-strike'),out=record({...input,enemyTeam:input.enemyTeam.map((u,i)=>i===0?{...u,life:1}:u)});
  expect(hits(out).map(e=>[e.target,e.damageType])).toEqual([['target','physical'],['target','lightning']]);
  expect(out.result.enemyTeam.map(u=>u.life)).toEqual([0,2000]);
  expect(out.events.filter(e=>e.kind==='death'&&e.target==='target')).toHaveLength(1);
});
it('Power finishes reflection before releasing bolts and stops if the caster dies',()=>{
  const input=fixture('power-strike'),out=record({...input,playerTeam:input.playerTeam.map(u=>({...u,life:5})),
    enemyTeam:input.enemyTeam.map(u=>({...u,physicalReflectionPct:1}))});
  expect(hits(out).map(e=>[e.target,e.damageType])).toEqual([['target','physical'],['target','lightning']]);
  expect(out.result.playerTeam[0]?.life).toBe(0);expect(out.result.enemyTeam.map(u=>u.life)).toEqual([1960,2000]);
});
it('landed fully absorbed mixed primary still releases bolts, sharing one finite personal shield',()=>{
  const input=fixture('power-strike'),{hero,target}=units(input);
  const out=record({...input,playerTeam:[{...target,side:'player',kind:'hero',statuses:[hold(),
    {id:'bone-armor',sourceId:'target',remaining:-1,stacks:1,boneArmor:{rank:20,remaining:45}}]}],
    enemyTeam:[{...hero,side:'enemy',kind:'monster'}]});
  expect(hits(out).map(e=>[e.amount,e.absorbed??0])).toEqual([[0,20],[0,20],[8,5],[11,0]]);
  expect(out.result.playerTeam[0]?.life).toBe(1981);
});
it('Charged captures two primary-adjacent originals and cannot recenter on a denser distant group',()=>{
  const input=fixture('charged-strike'),{hero,target}=units(input);
  const enemies=[{...target,gridPosition:{row:1,col:1}},
    {...target,id:'east',gridPosition:{row:1,col:2}}, {...target,id:'north',gridPosition:{row:0,col:1}},
    {...target,id:'west',gridPosition:{row:1,col:0}}, {...target,id:'south',gridPosition:{row:2,col:1}},
    ...[0,1,2,3].map(i=>({...target,id:'distant'+String(i),gridPosition:{row:8,col:8+i}}))];
  const out=record({...input,playerTeam:[hero,{...hero,id:'ally',skillOrder:[],statuses:[hold()],gridPosition:{row:1,col:1}}],enemyTeam:enemies});
  expect(hits(out).map(e=>e.target)).toEqual(['target','east','north']);
  expect(out.result.enemyTeam.filter(u=>u.life<2000).map(u=>u.id)).toEqual(['target','east','north']);
  expect(out.result.playerTeam[1]?.life).toBe(2000);
});
it('Charged releases original adjacent bolts even when its primary victim dies',()=>{
  const input=fixture('charged-strike'),{target}=units(input);
  const out=record({...input,enemyTeam:[{...target,life:1},{...target,id:'nearby',gridPosition:{row:0,col:1}},
    {...target,id:'outside',gridPosition:{row:9,col:9}}]});
  expect(hits(out).map(e=>e.target)).toEqual(['target','nearby']);
  // Primary death/orb settlement consumes RNG before the adjacent bolt (42, versus43 without death).
  expect(out.result.enemyTeam.map(u=>u.life)).toEqual([0,1958,2000]);
});
it('Charged skips dead neighbors and never fills a sparse cross from outside',()=>{
  const input=fixture('charged-strike'),{target}=units(input);
  const out=record({...input,enemyTeam:[target,{...target,id:'dead',life:0,gridPosition:{row:0,col:1}},
    {...target,id:'outside',gridPosition:{row:9,col:9}}]});
  expect(hits(out).map(e=>e.target)).toEqual(['target']);expect(out.result.enemyTeam[2]?.life).toBe(2000);
});
it('Charged settles lethal Chilling Armor retaliation before selecting any bolt damage',()=>{
  const input=fixture('charged-strike'),{target}=units(input);
  const out=record({...input,playerTeam:input.playerTeam.map(u=>({...u,life:1})),enemyTeam:[
    {...target,activeBuffIds:['chilling-armor'],coldArmors:{'chilling-armor':{sourceId:'target',rank:20}}},
    {...target,id:'nearby',gridPosition:{row:0,col:1}}]});
  expect(hits(out).map(e=>e.target)).toEqual(['target']);expect(out.result.playerTeam[0]?.life).toBe(0);
  expect(out.result.enemyTeam[1]?.life).toBe(2000);
});
it('Lightning chain uses nearest Manhattan neighbors, preserves priority ties and caps five originals',()=>{
  const input=fixture('lightning-strike'),{target}=units(input);
  const positions=[['target',0,0],['far',9,9],['east',0,1],['south',1,0],['corner',1,1],['near-far',8,9]] as const;
  const out=record({...input,enemyTeam:positions.map(([id,row,col])=>({...target,id,gridPosition:{row,col}}))});
  expect(hits(out).map(e=>e.target)).toEqual(['target','east','corner','south','near-far']);
  expect(out.result.enemyTeam.find(u=>u.id==='far')?.life).toBe(2000);
});
it('Lightning chain consumes its missed first attempt and never substitutes a sixth target',()=>{
  const input=fixture('lightning-strike'),{target}=units(input);
  const out=record({...input,seed:41,enemyTeam:Array.from({length:6},(_,i)=>({...target,id:String(i),gridPosition:{row:0,col:i}}))});
  expect(hits(out).map(e=>e.target)).toEqual(['0','1','2','3','4']);expect(hits(out)[0]).toMatchObject({amount:0,dodged:true});
  expect(out.result.enemyTeam.find(u=>u.id==='5')?.life).toBe(2000);
});
it('Poison impact footprint caps nine covered originals and leaves a tenth original untouched',()=>{
  const input=fixture('poison-javelin'),{target}=units(input);
  const out=record({...input,enemyTeam:[...Array.from({length:9},(_,i)=>({...target,id:String(i),
    gridPosition:{row:Math.floor(i/3),col:i%3}})),{...target,id:'tenth',gridPosition:{row:2,col:2}},
    {...target,id:'outside',gridPosition:{row:9,col:9}}]});
  expect(hits(out).map(e=>e.target)).toEqual(['0','1','2','3','4','5','6','7','8']);
  expect(out.result.enemyTeam.filter(u=>['tenth','outside'].includes(u.id)).map(u=>u.life)).toEqual([2000,2000]);
});
it.each([{priorExpiry:3000,expectedExpiry:6700},{priorExpiry:10000,expectedExpiry:10000}])('Poison refresh retains rate/cap and maximum expiry %j',({priorExpiry,expectedExpiry})=>{
  const input=fixture('poison-javelin'),{target}=units(input);
  const out=record({...input,enemyTeam:[{...target,statuses:[hold(),{id:'poison',sourceId:'old',stacks:9,
    remaining:priorExpiry/1000,appliedAtMs:0,expiresAtMs:priorExpiry,dotPerStack:7,damageType:'poison'}]},
    {...target,id:'nearby',gridPosition:{row:0,col:1}}]});
  const refresh=out.events.find(e=>e.kind==='status-state'&&e.target==='target'&&e.simClockMs===1700);
  if(refresh?.kind!=='status-state') throw new Error('Missing actual refreshed status view');
  expect(refresh.statuses.find(s=>s.id==='poison')).toMatchObject({stacks:10,dotPerStack:7,expiresAtMs:expectedExpiry});
  // Nine preexisting Poison stacks retain the ordinary1+.15*9 direct-hit combo.
  expect(hits(out).filter(e=>e.damageType==='poison').map(e=>e.amount)).toEqual([46,26]);
  expect(out.result.enemyTeam.every(u=>!u.statuses.some(s=>s.id==='poison'))).toBe(true);
});
it('Poison cloud misses apply no Poison to that original and still consume its one shared payment',()=>{
  const input=fixture('poison-javelin'),{target}=units(input);
  const out=record({...input,seed:41,enemyTeam:[target,{...target,id:'nearby',gridPosition:{row:0,col:1}}]});
  expect(hits(out)[0]).toMatchObject({target:'target',amount:0,dodged:true});
  expect(out.events.some(e=>e.kind==='status'&&e.target==='target'&&e.statusId==='poison')).toBe(false);
  expect(out.result.enemyTeam[0]?.life).toBe(2000);
  expect(out.events.flatMap(e=>e.kind==='mana'&&e.reason==='cast'?[e.mana]:[])).toEqual([90]);
});
it('Charged excludes a genuinely paid converted neighbor from its primary-anchored bolt targets',()=>{
  const input=fixture('charged-strike'),{hero,target}=units(input);
  const converter:CombatUnit={...hero,id:'converter',mana:25,conversionRank:1,
    skillOrder:['paladin.conversion'],skillLevels:{'paladin.conversion':1},statuses:[hold(501)],
    stats:{...hero.stats,attack:100,attackSpeed:250}};
  const out=record({...input,playerTeam:[hero,converter],enemyTeam:[
    {...target,id:'converted-neighbor',gridPosition:{row:0,col:1}},target,
    {...target,id:'hostile-neighbor',gridPosition:{row:1,col:0}}]});
  expect(out.events.some(e=>e.kind==='status'&&e.target==='converted-neighbor'&&e.statusId==='converted'&&e.simClockMs===500)).toBe(true);
  expect(hits(out).map(e=>e.target)).toEqual(['target','hostile-neighbor']);
  expect(out.events.flatMap(e=>e.kind==='damage'&&e.target==='converted-neighbor'?[e]:[]).every(e=>e.source==='converter')).toBe(true);
});

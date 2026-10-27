import { afterEach, beforeEach, expect, it } from 'vitest';
import { runBattle, runBattleRecorded } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import type { DamageEffect } from '@/engine/skills/effects';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
const hold=(appliedAtMs=0):ActiveStatus=>({id:'stun',sourceId:'fixture',stacks:1,remaining:-1,appliedAtMs});
function unit(id:string,side:'player'|'enemy'):CombatUnit {
 return {id,name:id,side,kind:side==='player'?'hero':'monster',tier:'trash',level:30,life:1000,mana:100,
  stats:{life:1000,lifeMax:1000,mana:100,manaMax:100,attack:1,attackSpeed:100,defense:0,magicResist:0,
   critChance:0,critDamage:1.5,physDodge:0,magicDodge:0,magicFind:0,goldFind:0,
   resistances:{physical:0,fire:0,cold:0,lightning:0,poison:0,arcane:0}},
  statuses:[hold()],cooldowns:{},skillOrder:[],activeBuffIds:[],enraged:false};
}
function fight(mode:'original'|'adjacent-others'='original',patch:Partial<DamageEffect>={},life=1000,reflection=0,seed=7,guaranteed=true) {
 const effect:DamageEffect={kind:'damage',damageType:'lightning',base:[20,20],...(guaranteed?{alwaysHits:true as const}:{}),
  onHitBolts:{count:2,targetMode:mode,damage:{min:10,max:10,perRank:1}},...patch};
 registerSkill({id:'fixture.impact',archetype:'fixture',minLevel:1,target:'single-enemy',manaCost:10,cooldown:1,effects:[effect]});
 const hero={...unit('hero','player'),life,skillOrder:['fixture.impact'],statuses:[hold(1701)]},target=unit('target','enemy');
 const input={seed,playerTeam:[hero],enemyTeam:[{...target,physicalReflectionPct:reflection,gridPosition:{row:0,col:0}},
  {...target,id:'nearby',gridPosition:{row:0,col:1}}, {...target,id:'outside',gridPosition:{row:9,col:9}}]};
 const before=structuredClone(input),out=runBattleRecorded(input);
 expect(input).toEqual(before);expect(runBattleRecorded(input)).toEqual(out);expect(runBattle(input)).toEqual(out.result);return out;
}
const hits=(out:ReturnType<typeof fight>)=>out.events.flatMap(e=>e.kind==='damage'&&e.source==='hero'?[e]:[]);
beforeEach(()=>{resetRegistry();loadDefaultSkills();});
afterEach(()=>{resetRegistry();loadDefaultSkills();});
it('releases two ordinary Lightning attempts at the same original from one paid parent',()=>{
 const out=fight();expect(hits(out).map(e=>[e.target,e.damageType])).toEqual([
  ['target','lightning'],['target','lightning'],['target','lightning']]);
 expect(hits(out)[0]?.amount).toBe(20);
 expect(out.result.enemyTeam.slice(1).map(u=>u.life)).toEqual([1000,1000]);
 expect(out.events.flatMap(e=>e.kind==='mana'&&e.reason==='cast'?[e.mana]:[])).toEqual([90]);
 expect(out.events.filter(e=>e.kind==='action'&&e.actor==='hero')).toHaveLength(1);
});
it('a primary guarantee never grants the children an accuracy or status guarantee',()=>{
 const out=fight('original',{applyStatus:{id:'stun'}});
 expect(hits(out)).toHaveLength(3);
 expect(hits(out).slice(1).some(e=>e.dodged)).toBe(true);
 expect(out.events.filter(e=>e.kind==='status'&&e.target==='target'&&e.statusId==='stun')).toHaveLength(1);
});
it('captures adjacent others without filling a sparse footprint from outside',()=>{
 const out=fight('adjacent-others');expect(hits(out).map(e=>e.target)).toEqual(['target','nearby']);
 expect(out.result.enemyTeam[2]?.life).toBe(1000);
});
it('an ordinary primary miss cancels all children but keeps the one parent payment',()=>{
 const out=fight('original',{},1000,0,41,false);
 expect(hits(out)).toEqual([expect.objectContaining({amount:0,dodged:true})]);
 expect(out.result.enemyTeam.map(u=>u.life)).toEqual([1000,1000,1000]);expect(out.result.playerTeam[0]?.mana).toBe(90);
});
it('finishes parent reflection and stops child settlement if it kills the caster',()=>{
 const out=fight('original',{damageType:'physical'},1,1);
 expect(hits(out)).toHaveLength(1);expect(out.result.playerTeam[0]?.life).toBe(0);
 expect(out.result.enemyTeam.map(u=>u.life)).toEqual([980,1000,1000]);
});
it.each([0,1.5,9])('rejects invalid child attempt count%i instead of looping unbounded',count=>{
 expect(()=>fight('original',{onHitBolts:{count,targetMode:'original',damage:{min:10,max:10,perRank:1}}})).toThrow('Invalid impact bolts');
});

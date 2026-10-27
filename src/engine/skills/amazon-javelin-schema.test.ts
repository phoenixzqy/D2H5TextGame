import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from '@/engine/skills/dataCatalog';
import { createSkillValidator } from '@/engine/skills/skill-validator';
const validate=createSkillValidator();
function row(slug:string) { const result=PLAYABLE_CLASS_SKILL_DATA.amazon.find(s=>s.id==='skills-amazon-'+slug);
  if(!result) throw new Error('Missing authored javelin definition');return result; }
for(const slug of ['power-strike','charged-strike','poison-javelin','lightning-strike']) {
  const skill=row(slug), capability=slug==='power-strike'||slug==='charged-strike'?'onHitBolts':'aoeShape';
  it(`${slug} has a valid exact contract and immutable source projection`,()=>{
    const before=structuredClone(skill);expect(validate(skill),JSON.stringify(validate.errors)).toBe(true);
    const registered=registeredSkillFromJson(skill);expect(skill).toEqual(before);
    expect(registered.effects).toEqual([expect.objectContaining({kind:'damage',damageType:skill.damageType})]);
    if(capability==='onHitBolts') {
      expect(registered.effects[0]).toHaveProperty('onHitBolts',skill.onHitBolts);
      if(registered.effects[0]?.kind!=='damage') throw new Error('Missing actual damage');
      expect(Object.isFrozen(registered.effects[0].onHitBolts)).toBe(true);
      expect(Object.isFrozen(registered.effects[0].onHitBolts?.damage)).toBe(true);
    } else expect(registered).toMatchObject({aoeShape:slug==='poison-javelin'?'box-3x3':'chain',maxTargets:slug==='poison-javelin'?9:5});
    if(slug==='power-strike') expect(registered.effects[0]).toHaveProperty('components',[
      {damageType:'physical',weight:30},{damageType:'lightning',weight:30}]);
  });
  it(`${slug} rejects missing capabilities and foreign transplantation`,()=>{
    const missing:Record<string,unknown>={...structuredClone(skill)};Reflect.deleteProperty(missing,capability);
    expect(validate(missing)).toBe(false);expect(validate({...skill,id:'skills-amazon-fire-arrow'})).toBe(false);
  });
  it.each([{trigger:'passive'},{passive:true},{aura:true},{summon:true},{target:'self'},{damageType:'fire'},
    {cooldown:0},{requiredLevel:1},{maxLevel:21},{prerequisites:[]},{appliesStatus:['burn']},
    {requires:{weaponType:['bow']}},{alwaysHits:true},{hitSequence:{strikes:2}},{ignoresDefense:true}])(
    `${slug} rejects contradictory payload %j`,patch=>{expect(validate({...skill,...patch})).toBe(false);});
}
for(const slug of ['power-strike','charged-strike']) {
  it.each([null,{}, {count:0,targetMode:'original',damage:{min:10,max:15,perRank:1}},
    {count:3,targetMode:'original',damage:{min:10,max:15,perRank:1}},
    {count:2,targetMode:'all-enemies',damage:{min:10,max:15,perRank:1}},
    {count:2,targetMode:'original',damage:{min:15,max:10,perRank:1}},
    {count:2,targetMode:'original',damage:{min:10,max:15,perRank:1,typo:true}}])(
      `${slug} rejects malformed or unauthored bolt tuning %j`,onHitBolts=>{expect(validate({...row(slug),onHitBolts})).toBe(false);});
}
it('ordinary Lightning Bolt cannot acquire impact bolts',()=>{
  expect(validate({...row('lightning-bolt'),onHitBolts:row('power-strike').onHitBolts})).toBe(false);
});
it('every current playable class definition remains schema-valid',()=>{
  for(const rows of Object.values(PLAYABLE_CLASS_SKILL_DATA)) for(const skill of rows)
    expect(validate(skill),skill.id+JSON.stringify(validate.errors)).toBe(true);
});
it.each([{slug:'poison-javelin',maxTargets:5},{slug:'lightning-strike',maxTargets:9},
  {slug:'multiple-shot',maxTargets:9},{slug:'charged-strike',maxTargets:9}])('cannot transplant the cloud cap to $slug',({slug,maxTargets})=>{
  expect(validate({...row(slug),maxTargets})).toBe(false);
});

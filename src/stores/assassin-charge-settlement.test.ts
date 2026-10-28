import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useFormationStore } from '@/stores/formationStore';
const TIGER = 'skills-assassin-tiger-strike', TALON = 'skills-assassin-dragon-talon';
const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'constructed-hold', stacks: 1, remaining: -1, appliedAtMs });
function fixture(rank: number, withCharge = true): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed charges', 'assassin'),
    id: 'hero', level: 30, comboOrder: withCharge ? [TIGER, TALON] : [TALON],
    skillLevels: { 'assassin.tiger_strike': rank, 'assassin.dragon_talon': rank } });
  const hero: CombatUnit = { ...native, life: 2000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, statuses: [hold(6801)],
    stats: { ...native.stats, lifeMax: 2000, manaMax: 100, attackSpeed: 100, attack: 100,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0, critChance: 0, critDamage: 2,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  const target: CombatUnit = { id: 'target', name: 'Constructed target', side: 'enemy', kind: 'monster',
    tier: 'trash', level: 30, life: 99999, mana: 0, stats: { ...hero.stats, lifeMax: 99999 },
    cooldowns: {}, activeBuffIds: [], skillOrder: [], statuses: [hold()], enraged: false };
  return { seed: 7, playerTeam: [hero], enemyTeam: [target] };
}
beforeEach(() => { useInventoryStore.getState().reset(); useMapStore.getState().reset();
  useFormationStore.getState().reset(); resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  return out;
}
function reflected(life: number, shield = false) {
  const input = fixture(1), hero = input.playerTeam[0], target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing native fixture');
  return { ...input, playerTeam: [{ ...hero, life,
    statuses: [...hero.statuses, ...(shield ? [{ id: 'bone-armor', sourceId: hero.id, stacks: 1,
      remaining: -1, boneArmor: { rank: 20, remaining: 240 } }] : [])] }],
    enemyTeam: [{ ...target, physicalReflectionPct: 1 }] };
}
it('does not gain a charge when the paid builder kills its caster through reflection', () => {
  const out = record(reflected(1));
  expect(out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'hero')).toHaveLength(1);
  expect(out.events.some(e => e.kind === 'damage' && e.source === 'hero' && e.amount > 0)).toBe(true);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' &&
    e.statuses.some(s => s.id === 'charge-tiger-strike'))).toBe(false);
  expect(out.result.playerTeam[0]?.life).toBe(0);
});
it('does not discharge already-paid pools when the first finisher hit reflects lethal damage', () => {
  const out = record(reflected(150));
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' &&
    e.statuses.some(s => s.id === 'charge-tiger-strike' && s.stacks === 3))).toBe(true);
  expect(out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'hero').map(e => e.skillId))
    .toEqual(['assassin.tiger_strike','assassin.tiger_strike','assassin.tiger_strike','assassin.dragon_talon']);
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero' && e.simClockMs === 6800)).toHaveLength(1);
  expect(out.result.playerTeam[0]?.life).toBe(0);
  expect(out.events.filter(e => e.kind === 'death').filter(e => e.target === 'hero')).toHaveLength(1);
});
it('spends a finite personal shield before reflection kills the caster and stops the finisher', () => {
  const out = record(reflected(1, true));
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' &&
    e.statuses.some(s => s.id === 'charge-tiger-strike' && s.stacks === 3))).toBe(true);
  const reflectedHits = out.events.filter(e => e.kind === 'damage').filter(e => e.target === 'hero');
  expect(reflectedHits.reduce((sum,e) => sum + (e.absorbed ?? 0), 0)).toBe(240);
  expect(out.result.playerTeam[0]?.life).toBe(0);
  const death = out.events.findIndex(e => e.kind === 'death' && e.target === 'hero');
  expect(out.events.slice(death + 1).some(e => e.kind === 'damage' && e.source === 'hero')).toBe(false);
});
it('consumes on a lethal first victim without retargeting the stored release or remaining kicks', () => {
  const input = fixture(1), target = input.enemyTeam[0]; if (!target) throw new Error('Missing target');
  const out = record({ ...input, enemyTeam: [{ ...target, life: 122 }, { ...target, id: 'other' }] });
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' &&
    e.statuses.some(s => s.id === 'charge-tiger-strike' && s.stacks === 3))).toBe(true);
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero' && e.simClockMs === 6800))
    .toEqual([expect.objectContaining({ target: 'target' })]);
  expect(out.result.enemyTeam.find(u => u.id === 'other')?.life).toBe(99999);
  expect(out.events.filter(e => e.kind === 'death').filter(e => e.target === 'target')).toHaveLength(1);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 6800 &&
    !e.statuses.some(s => s.id === 'charge-tiger-strike'))).toBe(true);
});
function cobra(victimMana: number, missingLife = 1000, manaMax = 100) {
  const input = fixture(1), hero = input.playerTeam[0], target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing Cobra fixture');
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed Cobra settlement','assassin'),
    id: 'hero', level: 30, comboOrder: ['skills-assassin-cobra-strike'],
    skillLevels: { 'assassin.tiger_strike': 1, 'assassin.cobra_strike': 1 } });
  return { ...input, playerTeam: [{ ...hero,...native,life: 2000 - missingLife,mana: 9,
    stats: { ...hero.stats,manaMax }, manaRegenPerSecond: 0,manaRegenBaselinePerSecond: 0,
    statuses: [hold(3401)] }], enemyTeam: [{ ...target,mana: victimMana,stats: { ...target.stats,manaMax: 500 } }] };
}
it.each([0,5,500])('Cobra generates the same caster MP without changing synthetic victim MP%i', mana => {
  const out = record(cobra(mana)), expected = 10;
  expect(out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'hero').map(e => e.skillId))
    .toEqual(['assassin.cobra_strike',null]);
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero' && e.simClockMs === 3400))
    .toEqual([expect.objectContaining({ amount: 100 })]);
  expect(out.result.playerTeam[0]).toMatchObject({ life: 1010,mana: expected });
  expect(out.result.enemyTeam[0]?.mana).toBe(mana);
  const recovery = out.events.filter(e => e.kind === 'mana').filter(e => e.reason === 'cobra-strike');
  expect(recovery).toEqual([expect.objectContaining({ target: 'hero', mana: expected, simClockMs: 3400 })]);
  expect(out.events.some(e => e.kind === 'mana' && e.target === 'target')).toBe(false);
});
it.each([0,5])('Cobra clamps to missing life%i and mana capacity without charging extra damage', missing => {
  const out = record(cobra(500,missing,9));
  expect(out.result.playerTeam[0]).toMatchObject({ life: 2000,mana: 9 });
  expect(out.result.enemyTeam[0]?.mana).toBe(500);
  expect(out.events.filter(e => e.kind === 'mana').filter(e => e.reason === 'cobra-strike'))
    .toEqual([expect.objectContaining({ target: 'hero', mana: 9, simClockMs: 3400 })]);
  expect(out.events.filter(e => e.kind === 'heal').filter(e => e.target === 'hero').map(e => e.amount))
    .toEqual(missing > 0 ? [missing] : []);
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero')).toHaveLength(2);
});
it('a multi-target Tail releases once at the first successful original victim', () => {
  const input = fixture(1), hero = input.playerTeam[0], target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing Tail fixture');
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed Tail settlement','assassin'),id: 'hero',level: 30,
    comboOrder: [TIGER,'skills-assassin-dragon-tail'],skillLevels: {
      'assassin.tiger_strike':1,'assassin.dragon_talon':1,'assassin.dragon_tail':1 } });
  const out = record({ ...input,playerTeam: [{ ...hero,...native,life: hero.life,mana: hero.mana,stats: hero.stats,
    manaRegenPerSecond: 0,manaRegenBaselinePerSecond: 0,statuses: hero.statuses }],
    enemyTeam: [target,{ ...target,id:'second' },{ ...target,id:'third' }] });
  const hits = out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero' && e.simClockMs === 6800);
  expect(hits.filter(e => e.damageType === 'fire')).toHaveLength(3);
  expect(hits.filter(e => e.damageType === 'physical')).toEqual([expect.objectContaining({ target: 'target' })]);
  expect(out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'hero' && e.simClockMs === 6800))
    .toEqual([expect.objectContaining({ skillId: 'assassin.dragon_tail' })]);
  expect(out.result.playerTeam[0]?.mana).toBe(78);
});


// UNEXECUTED additions: fixed seed7 constructed settlement controls, not authored-monster/public proof.
// A failed action/hit/charge/orb precondition is a fixture failure; do not search seeds or retune it.
const COBRA = 'skills-assassin-cobra-strike', TAIL = 'skills-assassin-dragon-tail';
const cobraEvents = (out: ReturnType<typeof record>) => out.events
  .filter(e => e.kind === 'mana').filter(e => e.reason === 'cobra-strike');
function expectCredit(out: ReturnType<typeof record>, mana: number, simClockMs = 3400): void {
  expect(cobraEvents(out)).toEqual([expect.objectContaining({ target: 'hero', mana, simClockMs })]);
  expect(out.result.playerTeam[0]?.mana).toBe(mana);
  expect(out.result.enemyTeam.every(unit => unit.mana === 0)).toBe(true);
  expect(out.events.some(e => e.kind === 'mana' && e.target !== 'hero')).toBe(false);
}
function paidCobraBasic(out: ReturnType<typeof record>) {
  expect(out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'hero')
    .map(e => [e.skillId,e.simClockMs])).toEqual([['assassin.cobra_strike',1700],[null,3400]]);
  const hits = out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero');
  expect(hits).toHaveLength(2);
  const builder = hits[0], basic = hits[1];
  if (!builder || !basic) throw new Error('FIXTURE: missing Cobra/basic hit');
  expect(builder).toMatchObject({ target: 'target', simClockMs: 1700, dodged: false });
  expect(builder.amount).toBeGreaterThan(0);
  expect(basic).toMatchObject({ target: 'target', simClockMs: 3400, dodged: false });
  expect(basic.amount).toBeGreaterThan(0);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 1700 &&
    e.statuses.some(s => s.id === 'charge-cobra-strike' && s.stacks === 1))).toBe(true);
  expect(out.events.slice(out.events.indexOf(basic) + 1).some(e => e.kind === 'status-state' &&
    e.target === 'hero' && e.simClockMs === 3400 &&
    !e.statuses.some(s => s.id === 'charge-cobra-strike'))).toBe(true);
  return { builder,basic };
}

it.each([9,100])('Cobra uses lethal actual HP loss and fresh post-orb MP capacity, initial MP%i', initialMana => {
  const base = cobra(0), hero = base.playerTeam[0], target = base.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing Cobra lethal fixture');
  // Boss tier guarantees native HP/MP orbs; no RNG mocking or searched drop seed.
  const out = record({ ...base, playerTeam: [{ ...hero,mana: initialMana }],
    enemyTeam: [{ ...target,life: 130,tier: 'boss',stats: { ...target.stats,lifeMax: 130 } }] });
  const { builder,basic } = paidCobraBasic(out);
  expect(builder.amount).toBeGreaterThanOrEqual(55);
  expect(builder.amount).toBeLessThanOrEqual(80);
  expect(basic.amount).toBe(100);
  const actualH = 130 - builder.amount; // Victim survives builder; basic overkills the remainder.
  expect(actualH).toBeGreaterThanOrEqual(50);
  expect(actualH).toBeLessThanOrEqual(75);
  expect(basic.amount).toBeGreaterThan(actualH);
  expect(out.result.enemyTeam[0]?.life).toBe(0);
  const postOrbMana = Math.min(100,initialMana - 9 + 5);
  const expectedRecovery = Math.min(100 - postOrbMana,Math.floor(actualH * .1));
  const orb = out.events.find(e => e.kind === 'mana' && e.reason === 'orb');
  expect(orb).toMatchObject({ target: 'hero',mana: postOrbMana,simClockMs: 3400 });
  const deathIndex = out.events.findIndex(e => e.kind === 'death' && e.target === 'target');
  expect(deathIndex).toBeGreaterThan(out.events.indexOf(basic));
  if (!orb) throw new Error('FIXTURE: guaranteed lethal MP orb missing');
  expect(out.events.indexOf(orb)).toBeGreaterThan(deathIndex);
  expectCredit(out,postOrbMana + expectedRecovery);
  const credit = cobraEvents(out)[0];
  if (!credit) throw new Error('Missing generated lethal Cobra MP');
  expect(out.events.indexOf(credit)).toBeGreaterThan(out.events.indexOf(orb));
  expect(out.result.playerTeam[0]?.life).toBe(1100 + Math.floor(actualH * .1));
  if (initialMana === 9) expect(expectedRecovery).toBe(Math.floor(actualH * .1)); // Overkill discriminant.
  else expect(expectedRecovery).toBe(4); // Orb leaves4 capacity, below the captured-H entitlement.
});

it('Cobra cannot heal or restore MP after its basic hit reflects lethal damage', () => {
  const base = cobra(0), hero = base.playerTeam[0], target = base.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing Cobra reflection fixture');
  // Builder55-80 leaves this100-life caster alive; the100 basic reflects lethally.
  const out = record({ ...base,playerTeam: [{ ...hero,life: 100 }],
    enemyTeam: [{ ...target,physicalReflectionPct: 1 }] });
  // Reflection stops release before consumption, so assert paid pool exists rather than a consume cue.
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 1700 &&
    e.statuses.some(s => s.id === 'charge-cobra-strike' && s.stacks === 1))).toBe(true);
  const hits = out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero');
  expect(hits).toHaveLength(2);
  expect(hits[1]).toMatchObject({ target: 'target',amount: 100,simClockMs: 3400,dodged: false });
  expect(out.events.filter(e => e.kind === 'death').filter(e => e.target === 'hero'))
    .toEqual([expect.objectContaining({ simClockMs: 3400 })]);
  expect(out.result.playerTeam[0]).toMatchObject({ life: 0,mana: 0 });
  expect(out.events.filter(e => e.kind === 'heal').filter(e => e.target === 'hero')).toEqual([]);
  expect(cobraEvents(out)).toEqual([]);
  expect(out.result.enemyTeam[0]?.mana).toBe(0);
});

it('Cobra uses captured original HP loss after an earlier ordered Tiger release kills the victim', () => {
  const base = cobra(0), first = base.playerTeam[0], target = base.enemyTeam[0];
  if (!first || !target) throw new Error('Missing ordered Cobra fixture');
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed ordered Cobra','assassin'),
    id: 'hero',level: 30,comboOrder: [TIGER,COBRA],
    skillLevels: { 'assassin.tiger_strike': 20,'assassin.cobra_strike': 1 } });
  // Tiger20=111-131 and Cobra1=55-80 leave109-154 of320 before basic100.
  // The earlier one-stack Tiger20 release55-65 then kills the remaining9-54.
  const out = record({ ...base,playerTeam: [{ ...first,...native,life: 1000,mana: 12,
    stats: { ...first.stats,attackSpeed: 200,manaMax: 1000 },
    manaRegenPerSecond: 0,manaRegenBaselinePerSecond: 0,statuses: [hold(2701)] }],
    enemyTeam: [{ ...target,life: 320,tier: 'boss',stats: { ...target.stats,lifeMax: 320 } }] });
  expect(out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'hero')
    .map(e => [e.skillId,e.simClockMs])).toEqual([
      ['assassin.tiger_strike',900],['assassin.cobra_strike',1800],[null,2700] ]);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 1800 &&
    e.statuses.some(s => s.id === 'charge-tiger-strike' && s.stacks === 1) &&
    e.statuses.some(s => s.id === 'charge-cobra-strike' && s.stacks === 1))).toBe(true);
  const hits = out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero');
  expect(hits).toHaveLength(4);
  const tiger = hits[0], cobraHit = hits[1], basic = hits[2], release = hits[3];
  if (!tiger || !cobraHit || !basic || !release) throw new Error('FIXTURE: missing ordered hit');
  const beforeBasic = 320 - tiger.amount - cobraHit.amount;
  expect(beforeBasic).toBeGreaterThan(100);
  expect(basic).toMatchObject({ amount: 100,simClockMs: 2700,target: 'target',dodged: false });
  expect(release).toMatchObject({ simClockMs: 2700,target: 'target',damageType: 'physical',dodged: false });
  expect(release.amount).toBeGreaterThanOrEqual(beforeBasic - 100);
  expect(out.result.enemyTeam[0]?.life).toBe(0);
  const deathIndex = out.events.findIndex(e => e.kind === 'death' && e.target === 'target');
  expect(deathIndex).toBeGreaterThan(out.events.indexOf(release));
  expect(out.events.find(e => e.kind === 'mana' && e.reason === 'orb'))
    .toMatchObject({ target: 'hero',mana: 50,simClockMs: 2700 });
  expectCredit(out,60,2700); // Captured basicH100 ->10; neither dead victim nor Tiger's later H replaces it.
  const credit = cobraEvents(out)[0];
  if (!credit) throw new Error('Missing generated ordered Cobra MP');
  expect(out.events.indexOf(credit)).toBeGreaterThan(deathIndex);
  expect(out.result.playerTeam[0]?.life).toBe(1110);
});

it.each([TALON,TAIL])('Cobra pays once during native multi-hit/multi-target finisher %s', finisher => {
  const base = cobra(0), first = base.playerTeam[0], target = base.enemyTeam[0];
  if (!first || !target) throw new Error('Missing Cobra finisher fixture');
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed Cobra finisher','assassin'),
    id: 'hero',level: 30,comboOrder: [COBRA,finisher],skillLevels: {
      'assassin.tiger_strike': 1,'assassin.cobra_strike': 1,
      'assassin.dragon_talon': 1,'assassin.dragon_tail': 1 } });
  const out = record({ ...base,playerTeam: [{ ...first,...native,life: 1000,mana: 100,stats: first.stats,
    manaRegenPerSecond: 0,manaRegenBaselinePerSecond: 0,statuses: [hold(3401)] }],
    enemyTeam: finisher === TAIL ? [target,{ ...target,id: 'second' },{ ...target,id: 'third' }] : [target] });
  const canonical = finisher === TALON ? 'assassin.dragon_talon' : 'assassin.dragon_tail';
  expect(out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'hero')
    .map(e => [e.skillId,e.simClockMs])).toEqual([['assassin.cobra_strike',1700],[canonical,3400]]);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 1700 &&
    e.statuses.some(s => s.id === 'charge-cobra-strike' && s.stacks === 1))).toBe(true);
  const hits = out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero' && e.simClockMs === 3400);
  expect(hits).toHaveLength(3); // Original3 kicks or3 target attempts; no Cobra damage.
  const triggeringHit = hits.find(e => e.amount > 0);
  if (!triggeringHit) throw new Error('FIXTURE: finisher did not remove HP');
  expect(triggeringHit.target).toBe('target');
  expect(out.result.enemyTeam.every(unit => unit.life > 0)).toBe(true); // No overkill/orb in this control.
  const recovery = Math.floor(triggeringHit.amount * .1);
  expect(recovery).toBeGreaterThan(0);
  const castMana = finisher === TALON ? 87 : 78;
  expect(out.events.filter(e => e.kind === 'mana').filter(e => e.reason === 'cast').map(e => e.mana))
    .toEqual([91,castMana]);
  expectCredit(out,castMana + recovery);
  expect(out.events.filter(e => e.kind === 'heal').filter(e => e.target === 'hero').map(e => e.amount))
    .toEqual([recovery]);
  expect(out.result.playerTeam[0]?.life).toBe(1000 + recovery);
});

it('positive Cobra MP clears only an active Mana Burn marker and clears carry on reaching capacity', () => {
  const base = cobra(0,1000,10), hero = base.playerTeam[0];
  if (!hero) throw new Error('Missing Cobra marker fixture');
  const active: ActiveStatus = { id: 'mana-burn',sourceId: 'constructed-active',stacks: 1,remaining: -1 };
  const future: ActiveStatus = { ...active,sourceId: 'constructed-future',appliedAtMs: 4000 };
  const out = record({ ...base,playerTeam: [{ ...hero,statuses: [...hero.statuses,active,future],
    manaRegenCarry: .75,manaRegenCompensation: 0,manaRegenExactCarry: '0.75' }] });
  const { basic } = paidCobraBasic(out);
  expect(basic.amount).toBe(100);
  expectCredit(out,10);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 3400 &&
    !e.statuses.some(s => s.id === 'mana-burn'))).toBe(true);
  expect(out.result.playerTeam[0]?.statuses.filter(s => s.id === 'mana-burn')).toEqual([future]);
  expect(out.result.playerTeam[0]).toMatchObject({ manaRegenCarry: 0,manaRegenCompensation: 0,manaRegenExactCarry: '0' });
  expect(out.events.filter(e => e.kind === 'mana').map(e => e.reason)).toEqual(['cast','cobra-strike']);
});

it('Cobra emits no MP at fresh full capacity and retains the now-active marker after an earlier orb', () => {
  const base = cobra(0,1000,200), hero = base.playerTeam[0], target = base.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing full Cobra fixture');
  const marker: ActiveStatus = { id: 'mana-burn',sourceId: 'constructed-after-orb',stacks: 1,
    remaining: -1,appliedAtMs: 3200 };
  // Native periodic settlement kills this held boss at3000, after the1700 payment and before3400 basic.
  const body: CombatUnit = { ...target,id: 'orb-body',life: 1,tier: 'boss',stats: { ...target.stats,lifeMax: 1 },
    statuses: [hold(),{ id: 'burn',sourceId: 'hero',stacks: 1,remaining: 1,
      appliedAtMs: 2000,expiresAtMs: 3000,dotPerStack: 1 }] };
  const out = record({ ...base,playerTeam: [{ ...hero,mana: 200,statuses: [...hero.statuses,marker] }],
    enemyTeam: [target,body] });
  const { basic } = paidCobraBasic(out);
  expect(basic.amount).toBe(100);
  expect(out.events.filter(e => e.kind === 'death').filter(e => e.target === body.id))
    .toEqual([expect.objectContaining({ simClockMs: 3000 })]);
  expect(out.events.filter(e => e.kind === 'mana').map(e => [e.reason,e.mana,e.simClockMs]))
    .toEqual([['cast',191,1700],['orb',200,3000]]);
  expect(cobraEvents(out)).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(200);
  expect(out.result.playerTeam[0]?.statuses.filter(s => s.id === 'mana-burn')).toEqual([marker]);
  expect(out.events.filter(e => e.kind === 'heal').filter(e => e.target === 'hero').map(e => e.amount)).toEqual([10]);
});

it('positive basic HP loss below10 consumes Cobra but floor-zero recovery emits no MP or marker clearing', () => {
  const base = cobra(0), hero = base.playerTeam[0];
  if (!hero) throw new Error('Missing floor-zero Cobra fixture');
  const marker: ActiveStatus = { id: 'mana-burn',sourceId: 'constructed-floor-zero',stacks: 1,remaining: -1 };
  const out = record({ ...base,playerTeam: [{ ...hero,stats: { ...hero.stats,attack: 9 },
    statuses: [...hero.statuses,marker] }] });
  const { basic } = paidCobraBasic(out);
  expect(basic.amount).toBe(9);
  expect(cobraEvents(out)).toEqual([]);
  expect(out.result.playerTeam[0]).toMatchObject({ life: 1000,mana: 0 });
  expect(out.result.playerTeam[0]?.statuses.filter(s => s.id === 'mana-burn')).toEqual([marker]);
  expect(out.events.filter(e => e.kind === 'heal').filter(e => e.target === 'hero')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'mana').map(e => e.reason)).toEqual(['cast']);
});

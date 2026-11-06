import { afterEach, beforeEach, expect, it } from 'vitest';
import { monsters, subAreas } from '@/data/index';
import { createRng } from '../rng';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import { buildMonsterUnit } from './monster-factory';
import { resolveChallengeWavePlan } from './sub-area-run';
import type { CombatUnit, MonsterTier } from './types';

const cases = [
 ['monsters/act1.ghost', 1, 27.2, 4.25, 1780, ['monster-curse'], ['monster.curse', null, null]],
 ['monsters/act1.wraith', 1, 32, 5, 1700, ['monster-mana-rift'], ['monster.mana_rift', null]],
 ['monsters/act2.greater-mummy', 2, 32, 5, 1700, ['monster-fire-breath', 'monster-curse'], ['monster.fire_breath', 'monster.curse', 'monster.fire_breath', null]],
 ['monsters/act2.horadrim-ancient', 2, 35.2, 5.5, 1740, ['monster-fire-breath', 'monster-curse'], ['monster.fire_breath', 'monster.curse', 'monster.fire_breath', null]],
 ['monsters/act4.oblivion-knight', 4, 35.2, 5.5, 1700, ['monster-bone-spirit'], ['monster.bone_spirit', null]]
] as const;
function definition(id: string) {
  const def = monsters.find(row => row.id === id);
  if (!def) throw new Error('Missing native curse/arcane: ' + id);
  return def;
}
function build(id: string, level = 12, tier: MonsterTier = 'trash') {
  return buildMonsterUnit({ def: definition(id), level, tier, rng: createRng(7), id: 'enemy' });
}
function input(enemy: CombatUnit, act: 1 | 2 | 3 | 4 | 5): CombatSnapshot {
  const hero: CombatUnit = { ...enemy, id: 'hero', kind: 'hero', side: 'player',
    life: 10_000_000, mana: 0, skillOrder: [], attackRange: [0, 0],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    stats: { ...enemy.stats, attack: 0, life: 10_000_000, lifeMax: 10_000_000,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  return { seed: 13, act, playerTeam: [hero], enemyTeam: [enemy] };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });


it.each(cases)('%s has literal role curves, undead melee identity and unchanged nonattack stats/RNG', (id, _act, base, growth, _period, skills) => {
 expect(definition(id)).toMatchObject({ attack: [base, base], attackGrowth: [growth, growth], skills, undead: true, canBeBoss: false });
 const probes: [number, MonsterTier][] = [[1, 'trash'], [12, 'trash'], [17, 'elite'], [17, 'champion'],
  [17, 'rare-elite'], [90, 'trash'], [17, 'boss'], [17, 'rare-minion']];
 const expected = id === 'monsters/act1.ghost' ? [27, 74, 124, 143, 143, 405, 152, 105]
  : base === 32 ? [32, 87, 146, 168, 168, 477, 179, 123] : [35, 96, 160, 185, 185, 525, 197, 136];
 expect(probes.map(([level, tier]) => build(id, level, tier).stats.attack)).toEqual(expected);
 expect(probes.map(([level, tier]) => build(id, level, tier).attackRange)).toEqual(expected.map(n => [n, n]));
 expect(build(id).basicAttackDelivery).toBe('melee');
 const def = definition(id), legacy = { ...def }; Reflect.deleteProperty(legacy, 'attack'); Reflect.deleteProperty(legacy, 'attackGrowth');
 const a = createRng(7), b = createRng(7), current = buildMonsterUnit({ def, level: 12, tier: 'trash', rng: a }),
  old = buildMonsterUnit({ def: legacy, level: 12, tier: 'trash', rng: b });
 const unchanged = { ...current, stats: { ...current.stats, attack: old.stats.attack } }, oldUnchanged = { ...old };
 for (const unit of [unchanged, oldUnchanged]) { Reflect.deleteProperty(unit, 'attackRange'); Reflect.deleteProperty(unit, 'basicAttackDelivery'); }
 expect(unchanged).toEqual(oldUnchanged); expect(a.next()).toBe(b.next());
});
it.each(cases)('%s exposes native signature cadence and natural ordinary gaps with immutable replay', (id, act, _base, _growth, period, skills, first) => {
 const enemy = build(id), snapshot = input(enemy, act), before = structuredClone(snapshot);
 expect(enemy.skillOrder).toEqual(skills);
 const out = runBattleRecorded(snapshot), actions = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'enemy');
 expect(actions.length).toBeGreaterThan(6);
 expect(actions.every((e, i) => e.skillId === first[i % first.length] && e.simClockMs === period * (i + 1))).toBe(true);
 expect(actions.some(e => e.skillId === null)).toBe(first.some(skill => skill === null));
 const clocks = new Set(actions.filter(e => e.skillId === null).map(e => e.simClockMs));
 const hits = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> => e.kind === 'damage' && e.source === 'enemy' && clocks.has(e.simClockMs) && !e.dodged && !e.crit);
 if (first.some(skill => skill === null)) {
  expect(hits.length).toBeGreaterThan(0);
  // Ghost swings inside and after the curse. Mummy gaps can retain Ignite;
  // a missed Fire Breath leaves the ordinary base hit instead.
  const allowed = id.endsWith('.ghost') ? [74, 111]
    : id.endsWith('.greater-mummy') ? [87, 108]
    : id.endsWith('.horadrim-ancient') ? [96, 120]
    : [id.endsWith('.wraith') ? 87 : 96];
  expect(hits.every(e => e.damageType === 'physical' && allowed.includes(e.amount))).toBe(true);
  if (id.endsWith('.ghost')) expect(hits.some(e => e.amount === 111)).toBe(true);
 }
 expect(runBattle(snapshot)).toEqual(out.result); expect(runBattleRecorded(snapshot)).toEqual(out); expect(snapshot).toEqual(before);
});
it.each(cases)('%s delivers literal ordinary physical damage when real ManaBurn suppresses skills', (id, act) => {
 const enemy = { ...build(id), statuses: [{ id: 'mana-burn', sourceId: 'fixture', remaining: -1, stacks: 1 }] };
 const snapshot = input(enemy, act), before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
 const actions = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'enemy');
 expect(actions.length).toBeGreaterThan(0); expect(actions.every(e => e.skillId === null)).toBe(true);
 const hits = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> => e.kind === 'damage' && e.source === 'enemy' && !e.dodged && !e.crit);
 expect(hits.length).toBeGreaterThan(0);
 expect(hits.every(e => e.damageType === 'physical' && e.amount === (id.endsWith('.ghost') ? 74 : id.endsWith('.wraith') || id.endsWith('.greater-mummy') ? 87 : 96))).toBe(true);
 expect(runBattle(snapshot)).toEqual(out.result); expect(snapshot).toEqual(before);
});
it('keeps Ghost/Wraith poison capped at 75 and existing cold/physical resistances', () => {
 for (const id of ['monsters/act1.ghost', 'monsters/act1.wraith']) {
  expect(definition(id).resistances).toMatchObject({ poison: 100, cold: 50, physical: 25 });
  expect(build(id).stats.resistances).toMatchObject({ poison: 75, cold: 50, physical: 25 });
 }
});
it('preserves actual BoneSpirit flight and arcane damage rather than adding a Knight curse', () => {
 const snapshot = input(build('monsters/act4.oblivion-knight'), 4), out = runBattleRecorded(snapshot);
 const hits = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> => e.kind === 'damage' && e.source === 'enemy' && e.damageType === 'arcane' && !e.dodged && !e.crit);
 expect(hits.length).toBeGreaterThan(0); expect(hits[0]?.simClockMs).toBe(2200);
 expect(hits.every(e => e.amount >= 40 && e.amount <= 60)).toBe(true);
 expect(out.events.some(e => e.kind === 'action' && e.skillId === 'monster.curse')).toBe(false);
});

it.each([
 ['areas/act2-lost-city', 'w1', 'act2-lc-w1-e1', 22, 'trash', 'GGMMMGGM', 'monsters/act2.greater-mummy', 'monsters/act2.mummy', 137],
 ['areas/act2-lost-city', 'w4', 'act2-lc-w4-e1', 24, 'elite', 'SSGGSSGGSSG', 'monsters/act2.greater-mummy', 'monsters/act2.scarab', 191],
 ['areas/act2-arcane-sanctuary', 'w2', 'act2-as-w2-e1', 24, 'trash', 'GGVVGGVVG', 'monsters/act2.greater-mummy', 'monsters/act2.claw-viper', 147],
 ['areas/act2-arcane-sanctuary', 'w4', 'act2-as-w4-e1', 27, 'champion', 'RRGGRRGGRRG', 'monsters/act2.greater-mummy', 'monsters/act2.sand-raider', 243],
 ['areas/act2-tomb-of-tal-rasha', 'w1', 'act2-tt-w1-e1', 27, 'trash', 'GGGMMMGG', 'monsters/act2.greater-mummy', 'monsters/act2.mummy', 162],
 ['areas/act2-tomb-of-tal-rasha', 'w3', 'act2-tt-w3-e1', 29, 'elite', 'GGHHGGHHGG', 'monsters/act2.greater-mummy', 'monsters/act2.horror-mage', 224],
 ['areas/act4-plains-of-despair', 'w2', 'act4-pod-w2-e1', 46, 'trash', 'KKAAKKAAK', 'monsters/act4.oblivion-knight', 'monsters/act4.abyss-knight', 283],
 ['areas/act4-city-of-the-damned', 'w3', 'act4-cd-w3-e1', 51, 'trash', 'KKPPKKPPKK', 'monsters/act4.oblivion-knight', 'monsters/act4.pit-lord', 310],
 ['areas/act4-river-of-flame', 'w3', 'act4-rof-w3-e1', 54, 'elite', 'KKAAKKAAKK', 'monsters/act4.oblivion-knight', 'monsters/act4.abyss-knight', 425],
 ['areas/act4-chaos-sanctuary', 'w1', 'act4-cs-w1-e1', 56, 'trash', 'KKKVVKKK', 'monsters/act4.oblivion-knight', 'monsters/act4.venom-lord', 338],
 ['areas/act4-chaos-sanctuary', 'w4', 'act4-cs-w4-e1', 58, 'elite', 'KKKKKKKKKKK', 'monsters/act4.oblivion-knight', 'monsters/act4.abyss-knight', 453]
] as const)('pins %s/%s full native curse/arcane roster, source and inherited ordinary curve', (areaId, id, encounterId, level, tier, pattern, selected, other, attack) => {
 const area = subAreas.find(row => row.id === areaId); if (!area) throw new Error('Missing native area: ' + areaId);
 const plan = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: selected, fallbackLevel: 1, seed: 7, challengeOrdinal: 0 });
 const wave = plan.waves.find(w => w.source?.kind === 'wave' && w.source.waveId === id); if (!wave) throw new Error('Missing native wave');
 expect(wave.source).toEqual({ kind: 'wave', waveId: id, encounterIds: [encounterId] });
 // BUG447: these authored elite rosters have four bodies, except Chaos W4's
 // three Knights. Fitting the crowd preserves that core and adds trash copies.
 const coreSize = tier === 'champion' || areaId === 'areas/act4-chaos-sanctuary' ? 3 : 4;
 expect(wave.spawns.map(s => [s.archetypeId, s.level, s.tier, s.encounterId])).toEqual(
  [...pattern].map((letter, index) => [letter === 'G' || letter === 'K' ? selected : other, level,
   (tier === 'champion' || tier === 'elite') && index >= coreSize ? 'trash' : tier, encounterId]));
 const enemies = wave.spawns.map((s, i) => buildMonsterUnit({ def: definition(s.archetypeId), level: s.level, tier: s.tier, rng: createRng(i), id: 'native-' + String(i) }));
 const subject = enemies.find(e => e.monsterArchetypeId === selected);
 if (!subject) throw new Error('Missing selected native subject');
 expect(subject.stats.attack).toBe(attack);
 const act = areaId.includes('act2') ? 2 : 4, tank = input(build(selected), act).playerTeam;
 const snapshot: CombatSnapshot = { seed: 13, act, playerTeam: tank, enemyTeam: enemies }, before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
 expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: subject.id,
  skillId: selected.endsWith('.greater-mummy') ? 'monster.fire_breath' : 'monster.bone_spirit', simClockMs: 1700 }));
 expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: subject.id,
  skillId: selected.endsWith('.greater-mummy') ? 'monster.curse' : null, simClockMs: 3400 }));
 expect(runBattle(snapshot)).toEqual(out.result); expect(snapshot).toEqual(before);
});
it('pins actual Izual boss source/roster and ordinary Knight attack299', () => {
 const area = subAreas.find(row => row.id === 'areas/act4-plains-of-despair'); if (!area) throw new Error('Missing Plains');
 const plan = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: 'monsters/act4.izual', fallbackLevel: 1, seed: 7, challengeOrdinal: 0 });
 const wave = plan.waves.find(w => w.source?.kind === 'bossEncounter'); if (!wave) throw new Error('Missing Izual');
 expect(wave.source).toEqual({ kind: 'bossEncounter', encounterId: 'act4-pod-izual' });
 expect(wave.spawns.map(s => [s.archetypeId, s.level, s.tier, s.encounterId])).toEqual(
  ['monsters/act4.izual', 'monsters/act4.oblivion-knight', 'monsters/act4.oblivion-knight'].map((id, i) => [id, 49, i === 0 ? 'boss' : 'trash', 'act4-pod-izual']));
 expect(wave.spawns.slice(1).map(s => build(s.archetypeId, s.level, s.tier).stats.attack)).toEqual([299, 299]);
});
it('exposes elite appended FrostNova in the Ghost cooldown gap', () => {
 const enemy = buildMonsterUnit({ def: definition('monsters/act1.ghost'), level: 12, tier: 'elite', rng: createRng(7), id: 'enemy', extraSkillIds: ['monster-frost-nova'] });
 const out = runBattleRecorded(input(enemy, 1));
 expect(enemy.skillOrder).toEqual(['monster-curse', 'monster-frost-nova']);
 expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'enemy', skillId: 'monster.frost_nova', simClockMs: 3560 }));
});
it('uses single-target nondamaging Curse without inventing Ghost mana drain', () => {
 const snapshot = input(build('monsters/act1.ghost'), 1), hero = snapshot.playerTeam[0]; if (!hero) throw new Error('Missing tank');
 const active = { ...snapshot, playerTeam: [{ ...hero, mana: 100 }, { ...hero, id: 'ally', kind: 'merc' as const, mana: 100 }] };
 const before = structuredClone(active), out = runBattleRecorded(active);
 const casts = out.events.filter(e => e.kind === 'status' && e.simClockMs === 1780);
 expect(casts).toHaveLength(1);
 expect(casts[0]).toMatchObject({ statusId: 'amplify-damage' });
 expect(out.events.some(e => e.kind === 'damage' && e.source === 'enemy' && e.simClockMs === 1780)).toBe(false);
 expect(out.events.some(e => e.kind === 'status-state' && e.simClockMs === 1780 &&
  e.statuses.some(status => status.id === 'amplify-damage' && status.expiresAtMs === 4780))).toBe(true);
 expect(out.events.some(e => e.kind === 'mana' && e.reason === 'mana-burn')).toBe(false);
 expect(out.result.playerTeam.map(u => u.mana)).toEqual([100, 100]);
 expect(runBattle(active)).toEqual(out.result); expect(active).toEqual(before);
});
it('uses native Rift all-target ManaBurn and HP-based mana drain', () => {
 const snapshot = input(build('monsters/act1.wraith'), 1), hero = snapshot.playerTeam[0]; if (!hero) throw new Error('Missing tank');
 const active = { ...snapshot, playerTeam: [{ ...hero, mana: 100 }, { ...hero, id: 'ally', kind: 'merc' as const, mana: 100 }] };
 const before = structuredClone(active), out = runBattleRecorded(active);
 for (const id of ['hero', 'ally']) {
  const hit = out.events.find(e => e.kind === 'damage' && e.target === id && e.source === 'enemy' && e.simClockMs === 1700);
  expect(hit).toMatchObject({ kind: 'damage', damageType: 'arcane', dodged: false });
  if (!hit || hit.kind !== 'damage') throw new Error('Missing native Rift hit');
  expect(hit.amount).toBeGreaterThanOrEqual(10); expect(hit.amount).toBeLessThanOrEqual(hit.crit ? 40 : 20);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status', target: id, statusId: 'mana-burn', simClockMs: 1700 }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'mana', target: id, mana: 100 - Math.floor(hit.amount * .2), reason: 'mana-burn', simClockMs: 1700 }));
 }
 expect(runBattle(active)).toEqual(out.result); expect(active).toEqual(before);
});
it('lets GreaterMummy Amplify benefit an allied Mummy after native Ignite', () => {
 const gm = buildMonsterUnit({ def: definition('monsters/act2.greater-mummy'), level: 22, tier: 'trash', rng: createRng(7), id: 'greater' });
 const mummy = buildMonsterUnit({ def: definition('monsters/act2.mummy'), level: 22, tier: 'trash', rng: createRng(7), id: 'mummy' });
 expect(mummy.stats.attack).toBe(137);
 const snapshot: CombatSnapshot = { ...input(gm, 2), enemyTeam: [gm, mummy] }, before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
 const hits = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> => e.kind === 'damage' && e.source === 'mummy' && !e.dodged && !e.crit);
 // The first Mummy swing at seed13 is excluded by the landed/noncrit filter.
 // These later literal clocks prove both combos and each independent expiry.
 expect(hits).toContainEqual(expect.objectContaining({ simClockMs: 5820, amount: 256, damageType: 'physical' }));
 expect(hits).toContainEqual(expect.objectContaining({ simClockMs: 11640, amount: 205, damageType: 'physical' }));
 expect(hits).toContainEqual(expect.objectContaining({ simClockMs: 13580, amount: 171, damageType: 'physical' }));
 expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status', target: 'hero', statusId: 'amplify-damage', simClockMs: 3400 }));
 expect(runBattle(snapshot)).toEqual(out.result); expect(snapshot).toEqual(before);
});

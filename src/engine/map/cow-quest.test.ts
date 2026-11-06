import { describe, expect, it } from 'vitest';
import { monsters } from '@/data';
import { buildMonsterUnit } from '../combat/monster-factory';
import { createRng } from '../rng';
import type { CombatUnit } from '../combat/types';
import type { WaveSpec } from '../combat/sub-area-run';
import type { QuestActionReceipts, QuestItemLedger, QuestProgressData } from '../types/save';
import { COW, COW_DOMAIN, canEarnCowLeg, captureCowEncounter, hasCowCompletion, hasOriginalCowVictory, isCowAdmissionEligible, validateCowQuestGraph } from './cow-quest';
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing Cow graph fixture'); return value; }
function progress(completed = false, claimed = false): Record<string, QuestProgressData> {
  return { [COW.quest]: { id: COW.quest, status: completed ? 'completed' : 'inProgress', rewardClaimed: claimed,
    objectives: { [COW.legObjective]: completed, [COW.portalObjective]: completed } } };
}
function open() {
  const rows = progress(true), items: Record<string, QuestItemLedger[string]> = {
    [COW.legSource]: { itemId: COW.legItemId, state: 'consumed' }, [COW.tomeSource]: { itemId: COW.tomeItemId, state: 'consumed' },
    [COW.cubeSource]: { itemId: COW.cubeItemId, state: 'owned' } }, receipts: Record<string, true> = { [COW.tomeSource]: true, [COW.openProof]: true };
  return { rows, items, receipts };
}
const wave: WaveSpec = { id: COW.encounter, source: { kind: 'questEncounter', encounterId: COW.encounter }, waveTier: 'boss', lootTable: COW.lootTable,
  spawns: [{ archetypeId: COW.king, encounterId: COW.encounter, tier: 'boss', level: 13, index: 0 },
    { archetypeId: COW.bovine, encounterId: COW.encounter, tier: 'trash', level: 13, index: 0 },
    { archetypeId: COW.bovine, encounterId: COW.encounter, tier: 'trash', level: 13, index: 1 }] };
function actors() {
  const template = monsters.find(row => row.id === 'monsters/act1.brute'); if (!template) throw new Error('Missing Cow constructed template');
  const base = buildMonsterUnit({ def: template, level: 13, tier: 'trash', rng: createRng(7), id: 'template' });
  const hero: CombatUnit = { ...base, id: 'hero', kind: 'hero', side: 'player', life: 3 };
  const enemies: CombatUnit[] = [0, 1, 2].map(index => ({ ...base, id: `cow-${String(index)}`, kind: 'monster', side: 'enemy',
    monsterArchetypeId: index === 0 ? COW.king : COW.bovine, tier: index === 0 ? 'boss' : 'trash', life: 7 }));
  const witness = captureCowEncounter(1, COW.area, wave, [hero], enemies); if (!witness) throw new Error('Missing original Cow witness');
  return { hero, enemies, witness, outcome: { winner: 'player' as string | null, finalPlayerTeam: [hero], finalEnemyTeam: enemies.map(enemy => ({ ...enemy, life: 0 })) } };
}
describe('finite Cow graph authority', () => {
  it('permits proofless ordinary and sparse completed/claimed legacy rows without granting admission or Claim', () => {
    for (const claimed of [false, true]) {
      const rows = progress(true, claimed); rows[COW.quest] = { ...required(rows[COW.quest]), objectives: {} };
      expect(() => { validateCowQuestGraph(rows, {}, {}, COW_DOMAIN); }).not.toThrow();
      expect(canEarnCowLeg(rows, {}, {})).toBe(true); expect(isCowAdmissionEligible(rows, {}, {})).toBe(false); expect(hasCowCompletion(rows, {}, {})).toBe(false);
    }
  });
  it('accepts each real owned/consumed stage; victory closes entry regardless claimed flag', () => {
    const rows = progress(), items: Record<string, QuestItemLedger[string]> = {}, receipts: Record<string, true> = {};
    rows[COW.quest] = { ...required(rows[COW.quest]), objectives: { [COW.legObjective]: true, [COW.portalObjective]: false } };
    items[COW.legSource] = { itemId: COW.legItemId, state: 'owned' };
    expect(() => { validateCowQuestGraph(rows, items, receipts, COW_DOMAIN); }).not.toThrow();
    items[COW.tomeSource] = { itemId: COW.tomeItemId, state: 'owned' }; receipts[COW.tomeSource] = true;
    expect(() => { validateCowQuestGraph(rows, items, receipts, COW_DOMAIN); }).not.toThrow();
    const full = open(); expect(isCowAdmissionEligible(full.rows, full.items, full.receipts)).toBe(true);
    full.receipts[COW.victoryProof] = true; full.rows[COW.quest] = { ...required(full.rows[COW.quest]), rewardClaimed: true };
    expect(hasCowCompletion(full.rows, full.items, full.receipts)).toBe(true); expect(isCowAdmissionEligible(full.rows, full.items, full.receipts)).toBe(false);
  });
  it.each(['missing-leg', 'missing-tome', 'one-consumed', 'missing-cube', 'consumed-cube', 'missing-receive', 'missing-open', 'false-receipt', 'wrong-item', 'unknown-source', 'objective-false'] as const)('rejects contradictory %s', fault => {
    const g = open();
    if (fault === 'missing-leg') Reflect.deleteProperty(g.items, COW.legSource);
    if (fault === 'missing-tome') Reflect.deleteProperty(g.items, COW.tomeSource);
    if (fault === 'one-consumed') g.items[COW.tomeSource] = { itemId: COW.tomeItemId, state: 'owned' };
    if (fault === 'missing-cube') Reflect.deleteProperty(g.items, COW.cubeSource);
    if (fault === 'consumed-cube') g.items[COW.cubeSource] = { itemId: COW.cubeItemId, state: 'consumed' };
    if (fault === 'missing-receive') Reflect.deleteProperty(g.receipts, COW.tomeSource);
    if (fault === 'missing-open') Reflect.deleteProperty(g.receipts, COW.openProof);
    if (fault === 'false-receipt') Reflect.set(g.receipts, COW.openProof, false);
    if (fault === 'wrong-item') g.items[COW.legSource] = { itemId: COW.tomeItemId, state: 'consumed' };
    if (fault === 'unknown-source') g.receipts[`${COW.quest}#action:forged`] = true;
    if (fault === 'objective-false') g.rows[COW.quest] = { ...required(g.rows[COW.quest]), objectives: { [COW.legObjective]: true, [COW.portalObjective]: false } };
    expect(() => { validateCowQuestGraph(g.rows, g.items, g.receipts, COW_DOMAIN); }).toThrow(); expect(isCowAdmissionEligible(g.rows, g.items, g.receipts)).toBe(false);
  });
  it('explicit historical absence rejects every future source and descriptor reads never invoke accessors', () => {
    const g = open(); expect(() => { validateCowQuestGraph(g.rows, g.items, g.receipts, undefined); }).toThrow();
    const items = Object.create({ [COW.legSource]: g.items[COW.legSource] }) as QuestItemLedger;
    expect(() => { validateCowQuestGraph(g.rows, items, {}, COW_DOMAIN); }).toThrow(); let invoked = false;
    Object.defineProperty(g.receipts, COW.openProof, { enumerable: true, get() { invoked = true; return true; } });
    expect(() => { validateCowQuestGraph(g.rows, g.items, g.receipts, COW_DOMAIN); }).toThrow(); expect(invoked).toBe(false);
    expect(() => { validateCowQuestGraph({}, {}, {} as QuestActionReceipts, undefined); }).not.toThrow();
  });
});
describe('all original Cow bodies', () => {
  it('accepts only the captured exact three-member win and freezes copied identities', () => {
    const a = actors(); expect(hasOriginalCowVictory(a.witness, a.outcome)).toBe(true);
    expect(Object.isFrozen(a.witness.originalMemberIds)).toBe(true); expect(Object.isFrozen(a.witness)).toBe(true);
  });
  it.each(['partial', 'missing', 'renamed', 'duplicate', 'extra-body', 'summon', 'owner', 'archetype', 'tier', 'level', 'hero-dead', 'hero-replaced', 'draw', 'wrong-side'] as const)('rejects %s before income', fault => {
    const a = actors(), enemy = required(a.outcome.finalEnemyTeam[1]);
    if (fault === 'partial') a.outcome.finalEnemyTeam[1] = { ...enemy, life: 1 };
    if (fault === 'missing') a.outcome.finalEnemyTeam.pop();
    if (fault === 'renamed') a.outcome.finalEnemyTeam[1] = { ...enemy, id: 'renamed' };
    if (fault === 'duplicate') a.outcome.finalEnemyTeam.push(enemy);
    if (fault === 'extra-body') a.outcome.finalEnemyTeam.push({ ...enemy, id: 'foreign-extra-body' });
    if (fault === 'summon') a.outcome.finalEnemyTeam[1] = { ...enemy, summon: true };
    if (fault === 'owner') a.outcome.finalEnemyTeam[1] = { ...enemy, ownerId: a.hero.id };
    if (fault === 'archetype') a.outcome.finalEnemyTeam[1] = { ...enemy, monsterArchetypeId: COW.king };
    if (fault === 'tier') a.outcome.finalEnemyTeam[1] = { ...enemy, tier: 'boss' };
    if (fault === 'level') a.outcome.finalEnemyTeam[1] = { ...enemy, level: 14 };
    if (fault === 'hero-dead') a.outcome.finalPlayerTeam[0] = { ...a.hero, life: 0 };
    if (fault === 'hero-replaced') a.outcome.finalPlayerTeam[0] = { ...a.hero, id: 'replacement' };
    if (fault === 'draw') a.outcome.winner = null;
    if (fault === 'wrong-side') a.outcome.finalEnemyTeam[1] = { ...enemy, side: 'player' };
    expect(hasOriginalCowVictory(a.witness, a.outcome)).toBe(false);
  });
});

import { expect, it } from 'vitest';
import { loadMercPool } from '../../data/loaders/mercs';
import { composeMercSignature, mercSignatureFactor, scaleMercSignatureEffect } from './merc-signature-rank';
import type { Mercenary } from '../types/entities';
import type { CombatUnit } from '../combat/types';
import { deriveStats } from '../progression/stats';

const def = loadMercPool().pool[0];
if (!def) throw new Error('Empty native pool');
const stats = deriveStats(def.baseStats, 1);
const merc: Mercenary = { id: def.id + '#earned', name: 'Test', type: 'mercenary', team: 'player',
  level: 1, classId: def.classRef, archetype: def.archetype, rarity: def.rarity,
  coreStats: def.baseStats, derivedStats: stats, statusEffects: [], cooldowns: [], skills: [],
  comboOrder: [], signatureSkillId: def.signatureSkillId, alive: true, turnOrder: 0, equipment: [] };
const signature = composeMercSignature(merc, 5);
if (!signature) throw new Error('Missing native signature');
const unit: CombatUnit = { id: 'test', name: 'Test', side: 'player', kind: 'merc', level: 1, tier: 'trash',
  stats, life: stats.lifeMax, mana: stats.manaMax, statuses: [], cooldowns: {}, skillOrder: [],
  activeBuffIds: [], enraged: false, mercSignature: signature };
it('requires the exact canonical signature and excludes secondary abilities', () => {
  expect(unit.mercSignature?.rank).toBe(6);
  expect(mercSignatureFactor(unit, def.signatureSkillId)).toBeCloseTo(1.6, 12);
  expect(mercSignatureFactor(unit, 'mskill-jab')).toBe(1);
  expect(composeMercSignature({ ...merc, signatureSkillId: 'mskill-jab' }, 5)).toBeUndefined();
  expect(composeMercSignature({ ...merc, id: 'unknown-merc' }, 5)).toBeUndefined();
});
it.each([{ kind: 'hero' as const }, { side: 'enemy' as const }, { summon: true },
  { ownerId: 'hero' }, { mercSignature: { skillId: def.signatureSkillId, rank: 7 } },
  { mercSignature: { skillId: def.signatureSkillId, rank: NaN } }])('refuses invalid transient authority %j', patch => {
  expect(mercSignatureFactor({ ...unit, ...patch }, def.signatureSkillId)).toBe(1);
});
it('does not mutate the registry primitive or scale unrelated effect properties', () => {
  const effect = { kind: 'damage' as const, damageType: 'physical' as const, base: [10, 20] as const,
    attackDamagePct: 100, hitSequence: { strikes: 3 }, applyStatus: { id: 'chill', chance: .3 } };
  const before = structuredClone(effect);
  expect(scaleMercSignatureEffect(effect, 'mskill-jab', 1.6)).toMatchObject({
    base: [16, 32], attackDamagePct: 160, hitSequence: { strikes: 3 }, applyStatus: { chance: .3 } });
  expect(effect).toEqual(before);
});

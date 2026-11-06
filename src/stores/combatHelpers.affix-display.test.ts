import { afterEach, beforeEach, expect, it } from 'vitest';
import { eliteConfig } from '@/data';
import i18n from '@/i18n';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import type { WaveSpec } from '@/engine/combat/sub-area-run';
import { runBattleRecorded } from '@/engine/combat/combat';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useCombatStore } from './combatStore';
import { stageRecordedWave } from './recordedWaveStaging';
import { battleEventToLogEntry, buildEnemiesForWave, playerToCombatUnit, resolveCombatUnitDisplayName } from './combatHelpers';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(async () => { await i18n.changeLanguage('zh-CN'); });

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing native affix fixture');
  return value;
}

const wave: WaveSpec = {
  id: 'affix-display', waveTier: 'elite',
  spawns: eliteConfig.affixes.map((eliteAffix, index) => ({
    archetypeId: 'monsters/act2.sand-raider', level: 20,
    tier: 'champion', index, eliteAffix,
  })),
};

it.each(['en', 'zh-CN'])('preserves selected affixes and localizes distinguishable native names in %s', async locale => {
  await i18n.changeLanguage(locale);
  const before = structuredClone(wave);
  const enemies = buildEnemiesForWave(wave, 7);
  enemies.forEach((unit, index) => {
    const key = required(wave.spawns[index]?.eliteAffix?.nameKey);
    expect(unit).toHaveProperty('eliteAffixNameKey', key);
    const label = i18n.t(`combat:eliteAffixTag.${key.replace('combat.eliteAffix.', '')}`);
    expect(resolveCombatUnitDisplayName(unit)).toContain(`[${label}]`);
    expect(resolveCombatUnitDisplayName(unit)).not.toContain('combat.');
  });
  expect(wave).toEqual(before);
  const plain = required(buildEnemiesForWave({ ...wave, spawns: [{
    archetypeId: 'monsters/act2.sand-raider', level: 20, tier: 'champion', index: 0,
  }] }, 7)[0]);
  expect(plain).not.toHaveProperty('eliteAffixNameKey');
  expect(resolveCombatUnitDisplayName(plain)).not.toContain('[');
  expect(new Set(enemies.map(resolveCombatUnitDisplayName)).size).toBe(enemies.length);
});

it('retains the selected tag through real recorded-wave simulation and log projection', async () => {
  await i18n.changeLanguage('en');
  const enemies = buildEnemiesForWave({ ...wave, spawns: [required(wave.spawns[0])] }, 7);
  const hero = playerToCombatUnit(createMockPlayer('Affix fixture', 'necromancer'));
  const snapshot = { seed: 7, playerTeam: [hero], enemyTeam: enemies };
  const before = structuredClone(snapshot);
  const staged = stageRecordedWave({ snapshot, waveIdx: 0, totalWaves: 1,
    subAreaRunId: 'affix-display', defaults: useCombatStore.getState(),
    resolveDisplayName: resolveCombatUnitDisplayName });
  const finalEnemy = required(staged.recording.outcome.finalEnemyTeam[0]);
  expect(finalEnemy).toHaveProperty('eliteAffixNameKey', wave.spawns[0]?.eliteAffix?.nameKey);
  const names = new Map([[hero.id, hero.name], [finalEnemy.id, resolveCombatUnitDisplayName(finalEnemy)]]);
  const event = staged.recording.events.find(event => event.kind === 'damage' && event.source === finalEnemy.id);
  expect(event).toBeDefined();
  const entry = battleEventToLogEntry(required(event), names);
  expect(entry?.message).toContain('[🔥 Extra Fire Damage]');
  expect(staged.publication.unitNameMap.get(finalEnemy.id)).toBe(names.get(finalEnemy.id));
  const { eliteAffixNameKey, ...unlabelled } = required(enemies[0]);
  expect(eliteAffixNameKey).toBe(wave.spawns[0]?.eliteAffix?.nameKey);
  expect(runBattleRecorded({ ...snapshot, enemyTeam: [unlabelled] }).events).toEqual(staged.recording.events);
  expect(snapshot).toEqual(before);
});

it('omits unknown keys and never labels heroes from monster presentation metadata', () => {
  const enemy = required(buildEnemiesForWave(wave, 7)[0]);
  const unknown = { ...enemy, eliteAffixNameKey: 'combat.eliteAffix.unknown' };
  const wrongNamespace = { ...enemy, eliteAffixNameKey: 'common.confirm' };
  const hero = { ...playerToCombatUnit(createMockPlayer('Hero', 'necromancer')),
    eliteAffixNameKey: 'combat.eliteAffix.fast' };
  for (const unit of [unknown, wrongNamespace, hero]) {
    expect(resolveCombatUnitDisplayName(unit)).not.toContain('[');
    expect(resolveCombatUnitDisplayName(unit)).not.toContain('combat.');
  }
  expect(resolveCombatUnitDisplayName(hero)).toBe('Hero');
});

import { describe, expect, it } from 'vitest';
import { monsters } from '@/data';
import i18n from '@/i18n';
import { runBattleRecorded } from '@/engine/combat/combat';
import { buildMonsterUnit } from '@/engine/combat/monster-factory';
import { createRng } from '@/engine/rng';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from './combatPlayback';
import { eventToLocalizedLogEntry } from './eventToLogI18n';

describe('native Panic replay projection', () => {
  it.each(['en', 'zh-CN'])('localizes the finite reaction and status in %s', async locale => {
    const previous = i18n.language;
    try {
      await i18n.changeLanguage(locale);
      const label = locale === 'en' ? 'Panic Flee' : '惊慌逃窜';
      expect(i18n.t('combat:effect.status.panic_flee')).toBe(label);
      expect(eventToLocalizedLogEntry({ kind: 'buff', target: 'fallen', buffId: 'panic_flee', statusBacked: true },
        new Map([['fallen', 'Fallen']]))?.message).toContain(label);
      const description = i18n.t('skills:monster.panic-flee.desc');
      expect(description).toContain(locale === 'en' ? '20 percentage points' : '20个百分点');
      expect(description).toContain(locale === 'en' ? '5 seconds' : '5秒');
      expect(description).not.toContain('skills:');
    } finally { await i18n.changeLanguage(previous); }
  });
  it('shows only the paid five-second window and reproduces final resource/status state', () => {
    const build = (slug: string) => {
      const def = monsters.find(row => row.id === `monsters/act1.${slug}`);
      if (!def) throw new Error('Missing native monster');
      return buildMonsterUnit({ def, id: slug, tier: 'trash', level: 1, rng: createRng(7) });
    };
    const body = build('fallen'), source = build('fallen-shaman');
    const playerTeam = [{ ...body, id: 'hero', kind: 'hero' as const, side: 'player' as const,
      life: 100_000, stats: { ...body.stats, life: 100_000, lifeMax: 100_000 }, skillOrder: [],
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] }];
    const enemyTeam = [body, { ...source, life: 1, statuses: [
      { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 },
      { id: 'ignite', sourceId: 'hero', stacks: 1, remaining: 1, expiresAtMs: 1000, dotPerStack: 1 }
    ] }];
    const input = { seed: 7, playerTeam, enemyTeam }, before = structuredClone(input), out = runBattleRecorded(input);
    const statusPlayback = stageStatusPlayback(playerTeam, enemyTeam, out.events);
    if (!statusPlayback) throw new Error('Missing native status prefix');
    let view: PlaybackStepResult = { playerTeam, enemyTeam, statusPlayback };
    let applied = 0, expired = false;
    for (const event of out.events) {
      view = applyEventToTeams(view.playerTeam, view.enemyTeam, event, view.statusPlayback);
      if (event.kind !== 'status-state' || event.target !== body.id) continue;
      const shown = view.enemyTeam.find(unit => unit.id === body.id);
      expect(shown?.statuses).toEqual(event.statuses);
      const panic = event.statuses.find(status => status.id === 'panic_flee');
      if (panic) {
        applied = panic.appliedAtMs ?? 0;
        expect(panic.expiresAtMs).toBe(applied + 5000);
        expect(shown?.activeBuffIds).not.toContain('panic_flee');
      } else if (applied > 0 && event.simClockMs === applied + 5000) expired = true;
    }
    expect(applied).toBe(1740);
    expect(expired).toBe(true);
    for (const unit of [...out.result.playerTeam, ...out.result.enemyTeam]) {
      const shown = [...view.playerTeam, ...view.enemyTeam].find(candidate => candidate.id === unit.id);
      expect(shown).toMatchObject({ life: unit.life, mana: unit.mana, statuses: unit.life > 0 ? unit.statuses : [] });
    }
    expect(input).toEqual(before);
  });
});

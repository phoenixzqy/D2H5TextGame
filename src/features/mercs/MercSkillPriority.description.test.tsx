import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { loadMercPool } from '@/data/loaders/mercs';
import { socketRunewords } from '@/data/loaders/socket-effects';
import type { Item } from '@/engine/types/items';
import { useCombatStore } from '@/stores/combatStore';
import { createMercFromDef } from '@/stores/mercFactory';
import { useMercStore } from '@/stores/mercStore';
import { MercSkillPriority } from './MercSkillPriority';

const definition = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight');
if (!definition) throw new Error('Missing Rogue fixture');
const merc = { ...createMercFromDef(definition), level: 40 };

function runeword(id: string, baseId: string): Item {
  const row = socketRunewords.find(entry => entry.id === `runewords/${id}`);
  if (!row) throw new Error(`Missing ${id}`);
  return { id, baseId, rarity: 'runeword', level: 70, identified: true, equipped: false,
    runewordId: row.id, socketCapacity: row.sockets,
    socketContents: row.runes.map(rune => ({ kind: 'rune', id: rune })) };
}

beforeEach(() => { useMercStore.getState().reset(); useCombatStore.getState().reset(); });
afterEach(() => { useMercStore.getState().reset(); useCombatStore.getState().reset(); });

describe.each(['en', 'zh-CN'] as const)('skill descriptions in %s', locale => {
  it('shows native descriptions and remains readable during combat', async () => {
    await i18n.changeLanguage(locale);
    useCombatStore.setState({ inCombat: true });
    render(<I18nextProvider i18n={i18n}><MercSkillPriority merc={merc} equipment={{}} /></I18nextProvider>);
    expect(screen.getByText(i18n.t('skills:mercenary.basic-arrow.desc'))).toBeVisible();
    expect(screen.getByRole('button', { name: i18n.t('mercs:priority.earlier', {
      skill: i18n.t('mercs:skillName.mskill-pierce-arrow') }) })).toBeDisabled();
  });

  it('shows the equipment description even after the grant becomes unavailable', async () => {
    await i18n.changeLanguage(locale);
    const stored = { ...merc, comboOrder: [...merc.comboOrder, 'item.redemption'] };
    render(<I18nextProvider i18n={i18n}><MercSkillPriority merc={stored} equipment={{}} /></I18nextProvider>);
    expect(screen.getByText(i18n.t('skills:item.redemption.desc'))).toBeVisible();
    expect(screen.getByText(i18n.t('skills:equipmentUnavailable', {
      skill: i18n.t('skills:item.redemption.name') }), { exact: false })).toBeVisible();
  });

  it('labels rank-one previews of removed spell grants and tolerates legacy skills', async () => {
    await i18n.changeLanguage(locale);
    const stored = { ...merc, comboOrder: [...merc.comboOrder, 'sorceress.fire_bolt', 'old-unknown'] };
    const { container } = render(<I18nextProvider i18n={i18n}>
      <MercSkillPriority merc={stored} equipment={{}} />
    </I18nextProvider>);
    expect(screen.getByText(i18n.t('mercs:priority.rankPreview'))).toBeVisible();
    expect(screen.getByText(i18n.t('skills:equipmentUnavailable', {
      skill: i18n.t('skills:sorceress.fire-bolt.name') }), { exact: false })).toBeVisible();
    expect(screen.getByText(i18n.t('mercs:priority.unknown', { skill: 'old unknown' }), { exact: false })).toBeVisible();
    expect(container).toHaveTextContent(locale === 'en' ? '30–45' : '30～45');
    expect(container).not.toHaveTextContent('{{');
  });

  it('labels the base values of upgraded signature skills', async () => {
    await i18n.changeLanguage(locale);
    useMercStore.setState({ recruitmentProgress: { [merc.id]: { stars: 1, shards: 0 } } });
    render(<I18nextProvider i18n={i18n}><MercSkillPriority merc={merc} equipment={{}} /></I18nextProvider>);
    expect(screen.getByText(i18n.t('mercs:priority.signatureBaseValues'))).toBeVisible();
  });

  it.each([
    ['leaf', 'items/base/weapon-staff', 'fire-bolt', '38–53'],
    ['hand-of-justice', 'items/base/wp1h-phase-blade', 'blaze', '80–105'],
    ['death', 'items/base/wp2h-colossus-blade', 'chain-lightning', '70–90']
  ])('renders the complete %s equipment skill at its granted rank', async (word, base, skill, damage) => {
    await i18n.changeLanguage(locale);
    const { container } = render(<I18nextProvider i18n={i18n}>
      <MercSkillPriority merc={merc} equipment={{ weapon: runeword(word, base) }} />
    </I18nextProvider>);
    const description = i18n.t(`skills:sorceress.${skill}.desc`).split('{{')[0];
    expect(screen.getByText(text => text.startsWith(description))).toHaveTextContent(locale === 'en' ? damage : damage.replace('–', '～'));
    expect(container).not.toHaveTextContent('{{');
  });
});

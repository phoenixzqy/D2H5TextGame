import { describe, it, expect, vi } from 'vitest';
import { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { SkillFields } from './SkillsEditor';

vi.mock('./devClient', () => ({
  loadDevJson: vi.fn().mockResolvedValue({
    version: 1,
    overrides: { class: {}, monster: {}, item: {}, merc: {}, skill: {} }
  }),
  saveDevJson: vi.fn().mockResolvedValue(undefined)
}));

function renderSkill(entry: Record<string, unknown>) {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <SkillFields entry={entry} onChange={() => { /* no-op for preview tests */ }} />
      </Suspense>
    </I18nextProvider>
  );
}

describe('SkillsEditor SkillFields', () => {
  it('previews skill icons using the normalized generated skill icon key', async () => {
    renderSkill({
      id: 'skills-amazon-magic-arrow',
      icon: 'skills/amazon/magic-arrow.png',
      damage: { min: 1, max: 2 },
      cooldown: 1,
      cost: { mana: 1 },
      scaling: {}
    });

    const field = await screen.findByTestId('dev-image-field');
    expect(field.dataset.kind).toBe('skill');
    expect(field.dataset.entityId).toBe('skills.amazon.magic-arrow');
    const img = field.querySelector('img');
    expect(img?.getAttribute('src')).toMatch(/skills\.amazon\.magic-arrow\.v1\.png$/);
  });

  it('exposes summon scaling fields for Raise Skeleton', async () => {
    renderSkill({
      id: 'skills-necromancer-raise-skeleton',
      icon: 'skills/necromancer/raise-skeleton.png',
      summon: true,
      summonId: 'skeleton',
      cooldown: 1,
      cost: { mana: 15 },
      scaling: {
        summonMaxCount: { kind: 'raise-skeleton-1-6-12-cap-3' },
        summonStatsPerLevel: { lifeMax: 10, attack: 2, defense: 1 }
      }
    });

    expect(await screen.findByLabelText(/召唤模板|Summon template/i)).toHaveValue('skeleton');
    expect(screen.getByLabelText(/每级召唤生命|Summon life per level/i)).toHaveValue(10);
    expect(screen.getByLabelText(/每级召唤攻击|Summon attack per level/i)).toHaveValue(2);
    expect(screen.getByLabelText(/每级召唤防御|Summon defense per level/i)).toHaveValue(1);
    expect(screen.getByLabelText(/召唤上限曲线|Summon cap curve/i)).toHaveValue('raise-skeleton-1-6-12-cap-3');
  });
});

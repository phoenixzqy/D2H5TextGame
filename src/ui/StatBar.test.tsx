import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { StatBar } from './StatBar';

describe.each(['en', 'zh-CN'] as const)('StatBar resource names (%s)', locale => {
  it('distinguishes Life, Mana and XP by their current localized names', async () => {
    await i18n.changeLanguage(locale);
    const labels = locale === 'en' ? ['Life', 'Mana', 'XP'] : ['生命', '法力', '经验'];
    render(<>
      <StatBar label={i18n.t('common:life')} current={40} max={100} color="hp" />
      <StatBar label={i18n.t('common:mana')} current={20} max={50} color="mp" />
      <StatBar label={i18n.t('common:xp')} current={10} max={200} color="xp" />
    </>);
    expect(screen.getAllByRole('progressbar')).toHaveLength(3);
    for (const [index, label] of labels.entries()) {
      const bar = screen.getByRole('progressbar', { name: label });
      expect(bar).toHaveAttribute('aria-valuenow', String([40, 20, 10][index]));
      expect(bar).toHaveAttribute('aria-valuemax', String([100, 50, 200][index]));
    }
  });
});

it('updates the accessible name and values when locale and resource values change', async () => {
  await i18n.changeLanguage('en');
  const { rerender } = render(<StatBar label={i18n.t('common:mana')} current={20} max={50} showValues={false} />);
  expect(screen.getByRole('progressbar', { name: 'Mana' })).toHaveAttribute('aria-valuenow', '20');
  await i18n.changeLanguage('zh-CN');
  rerender(<StatBar label={i18n.t('common:mana')} current={12} max={60} showValues={false} />);
  expect(screen.queryByRole('progressbar', { name: 'Mana' })).not.toBeInTheDocument();
  const bar = screen.getByRole('progressbar', { name: '法力' });
  expect(bar).toHaveAttribute('aria-valuenow', '12');
  expect(bar).toHaveAttribute('aria-valuemax', '60');
  expect(bar).toHaveAttribute('aria-valuemin', '0');
  expect(screen.queryByText('12 / 60')).not.toBeInTheDocument();
});

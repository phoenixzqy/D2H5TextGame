/**
 * GameCard — RTL smoke tests covering each variant + a11y semantics.
 */
import { describe, it, expect, vi } from 'vitest';
import { Suspense } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { GameCard } from './GameCard';

function withI18n(node: React.ReactNode) {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>{node}</Suspense>
    </I18nextProvider>
  );
}

describe('GameCard', () => {
  it('renders a character card as an article when not interactive', () => {
    render(
      withI18n(
        <GameCard
          variant="character"
          name="Paladin"
          subtitle="Holy Order"
          rarity="unique"
          stats={[
            { label: 'STR', value: 25 },
            { label: 'DEX', value: 20 },
            { label: 'VIT', value: 25 },
            { label: 'ENG', value: 15 }
          ]}
          bars={[
            { kind: 'hp', current: 55, max: 55 },
            { kind: 'mp', current: 15, max: 15 }
          ]}
        />
      )
    );
    const card = screen.getByLabelText('Paladin · Holy Order');
    expect(card.tagName.toLowerCase()).toBe('article');
    expect(card).toHaveTextContent('Paladin');
    expect(card).toHaveTextContent('STR');
    // hp + mp progressbars
    expect(screen.getAllByRole('progressbar').length).toBe(2);
  });

  it('renders a clickable monster card as button + fires onClick', () => {
    const onClick = vi.fn();
    render(
      withI18n(
        <GameCard
          variant="monster"
          name="Fallen"
          subtitle="Demon"
          rarity="common"
          stats={[
            { label: 'ATK', value: 12 },
            { label: 'HP', value: 40, tone: 'hp' }
          ]}
          bars={[{ kind: 'hp', current: 30, max: 40 }]}
          onClick={onClick}
          selected
        />
      )
    );
    const btn = screen.getByRole('button', { name: /Fallen · Demon/ });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('renders a compact item card with no banner and a rarity gem', () => {
    render(
      withI18n(
        <GameCard
          variant="item"
          size="sm"
          name="Shako"
          rarity="unique"
          image="/assets/d2/generated/item-icons/items.unique.shako.png"
        />
      )
    );
    const card = screen.getByLabelText(/Shako/);
    expect(card).not.toHaveTextContent('Shako'); // banner suppressed for item compact
    const img = card.querySelector('img');
    expect(img).toHaveAttribute('alt', 'Shako');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('falls back to silhouette when no image is supplied', () => {
    render(withI18n(<GameCard variant="character" name="Nameless" />));
    const card = screen.getByLabelText(/Nameless/);
    expect(card.querySelector('svg')).toBeInTheDocument();
    expect(card.querySelector('img')).toBeNull();
  });

  it('falls back to silhouette when image fails to load', () => {
    render(
      withI18n(
        <GameCard variant="monster" name="Ghost" image="/does-not-exist.png" />
      )
    );
    const img = screen.getByLabelText(/Ghost/).querySelector('img');
    expect(img).not.toBeNull();
    if (img) fireEvent.error(img);
    expect(screen.getByLabelText(/Ghost/).querySelector('svg')).toBeInTheDocument();
  });

  it('progressbar aria reflects current/max', () => {
    render(
      withI18n(
        <GameCard
          variant="merc"
          name="Pierce"
          subtitle="Rogue Archer"
          rarity="rare"
          bars={[{ kind: 'hp', current: 45, max: 90 }]}
        />
      )
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '45');
    expect(bar).toHaveAttribute('aria-valuemax', '90');
  });
});

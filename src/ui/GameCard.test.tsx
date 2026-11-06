/**
 * GameCard — RTL smoke tests covering each variant + a11y semantics.
 */
import { describe, it, expect, vi } from 'vitest';
import { Suspense } from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
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
    render(withI18n(<GameCard variant="monster" name="Ghost" image="/does-not-exist.png" />));
    const img = screen.getByLabelText(/Ghost/).querySelector('img');
    expect(img).not.toBeNull();
    if (img) fireEvent.error(img);
    expect(screen.getByLabelText(/Ghost/).querySelector('svg')).toBeInTheDocument();
  });

  it.each(['character', 'monster', 'item', 'merc'] as const)(
    'retries failed %s art only on reconnection and preserves healthy art',
    (variant) => {
      render(withI18n(<GameCard variant={variant} name="Recovery" image="/portrait.png" />));
      const card = screen.getByLabelText(/^Recovery ·/u);
      const first = card.querySelector('img');
      if (!first) throw new Error('Expected initial card image');
      fireEvent.online(window);
      expect(card.querySelector('img')).toBe(first);

      fireEvent.error(first);
      expect(card.querySelector('img')).toBeNull();
      expect(card.querySelector('svg')).toBeInTheDocument();
      fireEvent.offline(window);
      expect(card.querySelector('img')).toBeNull();
      fireEvent.online(window);
      const retry = card.querySelector('img');
      expect(retry).toHaveAttribute('src', '/portrait.png');
      expect(retry).toHaveClass(variant === 'item' ? 'object-center' : 'object-top');
      if (!retry) throw new Error('Expected reconnection retry');
      fireEvent.online(window);
      expect(card.querySelector('img')).toBe(retry);

      fireEvent.error(retry);
      expect(card.querySelector('img')).toBeNull();
      expect(card.querySelector('svg')).toBeInTheDocument();
      fireEvent.online(window);
      expect(card.querySelector('img')).toHaveAttribute('src', '/portrait.png');
      expect(screen.getByLabelText(/^Recovery ·/u)).toBe(card);
    }
  );

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

  it.each(['en', 'zh-CN'] as const)(
    'names each resource in %s without changing its values',
    async (locale) => {
      await i18n.changeLanguage(locale);
      render(withI18n(
        <GameCard variant="character" name="Resources" bars={[
          { kind: 'hp', current: 45, max: 90 },
          { kind: 'mp', current: 15, max: 60 },
          { kind: 'stamina', current: 0, max: 100 }
        ]} />
      ));
      const names = locale === 'en'
        ? ['Life', 'Mana', 'Stamina']
        : ['生命', '法力', '耐力'];
      expect(screen.getAllByRole('progressbar')).toHaveLength(3);
      for (const [index, name] of names.entries()) {
        const bar = screen.getByRole('progressbar', { name });
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuenow', String([45, 15, 0][index]));
        expect(bar).toHaveAttribute('aria-valuemax', String([90, 60, 100][index]));
      }
    }
  );

  it('updates mounted resource names when language changes with identical card props', async () => {
    await i18n.changeLanguage('en');
    render(withI18n(
      <GameCard variant="character" name="Resources" bars={[
        { kind: 'hp', current: 45, max: 90 },
        { kind: 'mp', current: 15, max: 60 }
      ]} />
    ));
    const life = screen.getByRole('progressbar', { name: 'Life' });
    const mana = screen.getByRole('progressbar', { name: 'Mana' });
    await act(async () => { await i18n.changeLanguage('zh-CN'); });
    expect(screen.queryByRole('progressbar', { name: 'Life' })).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: 'Mana' })).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '生命' })).toBe(life);
    expect(screen.getByRole('progressbar', { name: '法力' })).toBe(mana);
    expect(life).toHaveAttribute('aria-valuenow', '45');
    expect(mana).toHaveAttribute('aria-valuenow', '15');
  });

  it.each(['character', 'item'] as const)(
    'recovers %s art when its source changes without remounting the card',
    (variant) => {
      const { rerender } = render(
        withI18n(<GameCard variant={variant} name="Recovery" image="/a.png" />)
      );
      const card = screen.getByLabelText(/^Recovery ·/u);
      const first = card.querySelector('img');
      if (!first) throw new Error('Expected initial card image');
      fireEvent.error(first);
      expect(card.querySelector('img')).toBeNull();
      expect(card.querySelector('svg')).toBeInTheDocument();

      rerender(withI18n(<GameCard variant={variant} name="Recovery" image="/b.png" />));
      expect(screen.getByLabelText(/^Recovery ·/u)).toBe(card);
      const recovered = card.querySelector('img');
      expect(recovered).toHaveAttribute('src', '/b.png');
      expect(recovered).toHaveClass(variant === 'item' ? 'object-center' : 'object-top');
      if (!recovered) throw new Error('Expected recovered card image');
      fireEvent.error(recovered);
      expect(card.querySelector('svg')).toBeInTheDocument();
      expect(card.querySelector('img')).toBeNull();

      rerender(withI18n(<GameCard variant={variant} name="Recovery" />));
      expect(card.querySelector('svg')).toBeInTheDocument();
      rerender(withI18n(<GameCard variant={variant} name="Recovery" image="/a.png" />));
      expect(card.querySelector('img')).toHaveAttribute('src', '/a.png');
    }
  );
});

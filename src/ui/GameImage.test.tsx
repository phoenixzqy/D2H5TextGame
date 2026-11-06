import { describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { GameImage } from './GameImage';

describe('GameImage source recovery', () => {
  it('retries failed art on reconnection without replacing healthy art or looping on failure', () => {
    const { container } = render(<GameImage src="/portrait.png" alt="Portrait" fallbackIcon="P" />);
    const first = container.querySelector('img');
    if (!first) throw new Error('Expected initial image');
    fireEvent.online(window);
    expect(container.querySelector('img')).toBe(first);

    fireEvent.error(first);
    expect(container.querySelector('img')).toBeNull();
    fireEvent.offline(window);
    expect(container.querySelector('img')).toBeNull();
    fireEvent.online(window);
    const retry = container.querySelector('img');
    expect(retry).toHaveAttribute('src', '/portrait.png');
    if (!retry) throw new Error('Expected reconnection retry');
    fireEvent.online(window);
    expect(container.querySelector('img')).toBe(retry);

    fireEvent.error(retry);
    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('P');
    fireEvent.online(window);
    expect(container.querySelector('img')).toHaveAttribute('src', '/portrait.png');
  });

  it('loads a changed source after failure and still falls back if that source fails', () => {
    const { container, rerender } = render(
      <GameImage src="/failed-a.png" alt="Portrait" fallbackIcon="P" objectPosition="top" />
    );
    const first = container.querySelector('img');
    expect(first).not.toBeNull();
    if (!first) throw new Error('Expected initial image');
    fireEvent.error(first);
    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('P');

    rerender(<GameImage src="/valid-b.png" alt="Portrait" fallbackIcon="P" objectPosition="top" />);
    const recovered = container.querySelector('img');
    expect(recovered).toHaveAttribute('src', '/valid-b.png');
    expect(recovered).toHaveClass('object-top');
    expect(recovered).toHaveAttribute('loading', 'lazy');
    expect(recovered).toHaveAttribute('decoding', 'async');
    if (!recovered) throw new Error('Expected replacement image');
    fireEvent.error(recovered);
    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('P');
  });

  it('retries a previous URL after changing through another source', () => {
    const { container, rerender } = render(<GameImage src="/a.png" alt="Icon" />);
    const first = container.querySelector('img');
    if (!first) throw new Error('Expected initial image');
    fireEvent.error(first);
    rerender(<GameImage src="/b.png" alt="Icon" />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/b.png');
    rerender(<GameImage src="/a.png" alt="Icon" />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/a.png');
  });

  it.each([undefined, null, ''])('keeps missing source %s safe and can recover', (src) => {
    const { container, rerender } = render(
      <GameImage {...(src === undefined ? {} : { src })} alt="Icon" fallbackIcon="I" inline />
    );
    expect(container.firstElementChild?.tagName).toBe('SPAN');
    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('I');
    fireEvent.online(window);
    expect(container.querySelector('img')).toBeNull();
    rerender(<GameImage src="/valid.png" alt="Icon" fallbackIcon="I" inline />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/valid.png');
    expect(container.querySelector('img')).toHaveClass('object-center');
  });
});

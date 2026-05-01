import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Tabs } from './Tabs';

describe('<Tabs>', () => {
  it('exposes ARIA tab semantics and switches tabs with arrow keys', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        onChange={onChange}
        tabs={[
          { id: 'first', label: 'First', content: <p>First panel</p> },
          { id: 'second', label: 'Second', content: <p>Second panel</p> },
          { id: 'third', label: 'Third', content: <p>Third panel</p> }
        ]}
      />
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    const first = screen.getByRole('tab', { name: 'First' });
    const second = screen.getByRole('tab', { name: 'Second' });
    expect(first).toHaveAttribute('id', 'tab-first');
    expect(first).toHaveAttribute('aria-controls', 'tabpanel-first');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-first');

    fireEvent.keyDown(first, { key: 'ArrowRight' });

    expect(second).toHaveAttribute('aria-selected', 'true');
    expect(onChange).toHaveBeenCalledWith('second');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Second panel');
  });
});

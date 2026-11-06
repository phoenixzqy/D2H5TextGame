import { StrictMode, useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

function Confirmation({ empty = false }: { readonly empty?: boolean }) {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => { setOpen(true); }}>Open confirmation</button>
    <Modal isOpen={open} onClose={() => { setOpen(false); }} title="Confirm discard">
      {empty ? <p>Nothing to discard</p> : <>
        <button onClick={() => { setOpen(false); }}>Cancel</button>
        <button>Discard</button>
      </>}
    </Modal>
    <button>Outside action</button>
  </>;
}

describe('Modal keyboard focus', () => {
  it('never hides the focused opener while entering a dialog', async () => {
    const hiddenFocus: Element[] = [];
    const setAttribute = Object.getOwnPropertyDescriptor(Element.prototype, 'setAttribute')?.value as Element['setAttribute'];
    const observer = vi.spyOn(Element.prototype, 'setAttribute').mockImplementation(function (this: Element, name, value) {
      if (name === 'aria-hidden' && value === 'true' && this.contains(document.activeElement)) hiddenFocus.push(this);
      setAttribute.call(this, name, value);
    });
    try {
      render(<StrictMode><Confirmation /></StrictMode>);
      const opener = screen.getByRole('button', { name: 'Open confirmation' });
      opener.focus(); fireEvent.click(opener);
      const dialog = screen.getByRole('dialog', { name: 'Confirm discard' });
      await waitFor(() => { expect(dialog).toHaveFocus(); });
      expect(hiddenFocus).toEqual([]);
      expect(opener.closest('[aria-hidden="true"]')).not.toBeNull();
      fireEvent.keyDown(dialog, { key: 'Escape' });
      await waitFor(() => { expect(opener).toHaveFocus(); });
      expect(opener.closest('[aria-hidden="true"]')).toBeNull();
    } finally { observer.mockRestore(); }
  });

  it('focuses the named dialog without selecting a destructive action and returns to the opener', async () => {
    render(<StrictMode><Confirmation /></StrictMode>);
    const opener = screen.getByRole('button', { name: 'Open confirmation' });
    opener.focus(); fireEvent.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Confirm discard' });
    await waitFor(() => { expect(dialog).toHaveFocus(); });
    expect(within(dialog).getByRole('button', { name: 'Discard' })).not.toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => { expect(opener).toHaveFocus(); });
  });

  it('does not steal focus when callbacks or content change while open', async () => {
    const view = (title: string) => <Modal isOpen onClose={() => undefined} title={title}>
      <label>Save text<input /></label><button>Cancel</button>
    </Modal>;
    const { rerender } = render(view('Import'));
    await waitFor(() => { expect(screen.getByRole('dialog')).toHaveFocus(); });
    const input = screen.getByRole('textbox', { name: 'Save text' });
    input.focus(); fireEvent.change(input, { target: { value: 'retained input' } });
    rerender(view('Import backup'));
    await waitFor(() => { expect(input).toHaveFocus(); });
    expect(input).toHaveValue('retained input');
    expect(screen.getByRole('dialog', { name: 'Import backup' })).toBeInTheDocument();
  });

  it('recovers focus and Escape dismissal when a focused action disappears', async () => {
    function EquipmentPicker() {
      const [open, setOpen] = useState(false), [candidate, setCandidate] = useState(true);
      return <>
        <button onClick={() => { setOpen(true); }}>Open equipment</button>
        <Modal isOpen={open} onClose={() => { setOpen(false); }} title="Equipment">
          {candidate && <button onClick={() => { setCandidate(false); }}>Equip candidate</button>}
          <button>Close equipment</button>
        </Modal>
      </>;
    }
    render(<EquipmentPicker />);
    const opener = screen.getByRole('button', { name: 'Open equipment' });
    opener.focus(); fireEvent.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Equipment' });
    await waitFor(() => { expect(dialog).toHaveFocus(); });
    const candidate = screen.getByRole('button', { name: 'Equip candidate' });
    candidate.focus();
    // jsdom omits the native focusout dispatched when Chromium removes a focused button.
    fireEvent.focusOut(candidate, { relatedTarget: null });
    fireEvent.click(candidate);
    expect(candidate).not.toBeInTheDocument();
    await waitFor(() => { expect(dialog.contains(document.activeElement)).toBe(true); });
    const focused = document.activeElement;
    if (!(focused instanceof HTMLElement)) throw new Error('Missing focused dialog control');
    fireEvent.keyDown(focused, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => { expect(opener).toHaveFocus(); });
  });

  it('keeps focus in an empty dialog until Escape closes it', async () => {
    render(<Confirmation empty />);
    const opener = screen.getByRole('button', { name: 'Open confirmation' });
    opener.focus(); fireEvent.click(opener);
    const dialog = screen.getByRole('dialog');
    await waitFor(() => { expect(dialog).toHaveFocus(); });
    expect(fireEvent.keyDown(dialog, { key: 'Tab' })).toBe(false);
    expect(fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })).toBe(false);
    expect(dialog).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => { expect(opener).toHaveFocus(); });
  });

  it('gives nested dialogs distinct names and closes only the active child on Escape', async () => {
    function Nested() {
      const [parent, setParent] = useState(false), [child, setChild] = useState(false);
      return <>
        <button onClick={() => { setParent(true); }}>Open parent</button>
        <Modal isOpen={parent} onClose={() => { setParent(false); }} title="Parent">
          <button onClick={() => { setChild(true); }}>Open child</button>
          <Modal isOpen={child} onClose={() => { setChild(false); }} title="Child">
            <button>Child action</button>
          </Modal>
        </Modal>
      </>;
    }
    render(<Nested />);
    const opener = screen.getByRole('button', { name: 'Open parent' });
    opener.focus(); fireEvent.click(opener);
    await waitFor(() => { expect(screen.getByRole('dialog', { name: 'Parent' })).toHaveFocus(); });
    const childOpener = screen.getByRole('button', { name: 'Open child' });
    childOpener.focus(); fireEvent.click(childOpener);
    const child = screen.getByRole('dialog', { name: 'Child' });
    const parent = screen.getByRole('dialog', { name: 'Parent' });
    expect(child.getAttribute('aria-labelledby')).not.toBe(parent.getAttribute('aria-labelledby'));
    await waitFor(() => { expect(child).toHaveFocus(); });
    fireEvent.keyDown(child, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Child' })).not.toBeInTheDocument();
    expect(parent).toBeInTheDocument();
    await waitFor(() => { expect(childOpener).toHaveFocus(); });
    fireEvent.keyDown(childOpener, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => { expect(opener).toHaveFocus(); });
  });

  it('respects handled Escape events and keeps content clicks separate from backdrop dismissal', async () => {
    const close = vi.fn();
    render(<Modal isOpen onClose={close} title="Edit">
      <input aria-label="Editor" onKeyDown={event => { if (event.key === 'Escape') event.preventDefault(); }} />
    </Modal>);
    const dialog = screen.getByRole('dialog');
    await waitFor(() => { expect(dialog).toHaveFocus(); });
    const input = screen.getByRole('textbox', { name: 'Editor' });
    input.focus(); fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.click(input);
    expect(close).not.toHaveBeenCalled();
    const backdrop = dialog.parentElement;
    if (!backdrop) throw new Error('Dialog backdrop is missing');
    fireEvent.click(backdrop);
    expect(close).toHaveBeenCalledTimes(1);
  });
});

import { describe, expect, it, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { fireEvent, renderWithProviders, screen } from '../../testing/test-utils';
import Modal from './Modal';

function open(props = {}) {
  return renderWithProviders(
    <Modal isOpen onClose={props.onClose ?? vi.fn()} title="Delete this motorcycle?" {...props}>
      <button type="button">Confirm</button>
    </Modal>,
  );
}

describe('Modal', () => {
  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
  });

  it('renders nothing while closed', () => {
    renderWithProviders(
      <Modal isOpen={false} onClose={vi.fn()} title="Hidden">
        <p>Body</p>
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exposes a modal dialog labelled by its title', () => {
    open();

    const dialog = screen.getByRole('dialog', { name: 'Delete this motorcycle?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('describes the dialog with the optional description', () => {
    open({ description: 'This action cannot be undone.' });

    const dialog = screen.getByRole('dialog');
    const describedBy = dialog.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy)).toHaveTextContent('This action cannot be undone.');
  });

  it('leaves aria-describedby unset when there is no description', () => {
    open();
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
  });

  it('renders its children in the body', () => {
    open();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('closes from the labelled close button', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    open({ onClose });
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    open({ onClose });
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores keys other than Escape and Tab', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    open({ onClose });
    await user.keyboard('{ArrowDown}');

    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes when the backdrop itself is pressed', () => {
    const onClose = vi.fn();
    open({ onClose });

    // The backdrop is the dialog's parent element; it carries no role of its own.
    fireEvent.mouseDown(screen.getByRole('dialog').parentElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays open when the press starts inside the panel', () => {
    const onClose = vi.fn();
    open({ onClose });

    fireEvent.mouseDown(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('moves focus into the dialog when it opens', () => {
    open();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
  });

  it('wraps Tab from the last focusable back to the first', async () => {
    const user = userEvent.setup();
    open();

    screen.getByRole('button', { name: 'Confirm' }).focus();
    await user.tab();

    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
  });

  it('wraps Shift+Tab from the first focusable to the last', async () => {
    const user = userEvent.setup();
    open();

    screen.getByRole('button', { name: 'Close dialog' }).focus();
    await user.tab({ shift: true });

    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus();
  });

  it('leaves interior tab moves alone', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Modal isOpen onClose={vi.fn()} title="Two controls">
        <button type="button">First</button>
        <button type="button">Second</button>
      </Modal>,
    );

    screen.getByRole('button', { name: 'First' }).focus();
    await user.tab();

    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus();
  });

  it('locks page scrolling while open and restores it on close', () => {
    const { rerender } = open();
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={vi.fn()} title="Delete this motorcycle?">
        <button type="button">Confirm</button>
      </Modal>,
    );

    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('returns focus to whatever opened it', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();

    const { unmount } = open();
    unmount();

    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});

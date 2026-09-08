import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  it('does not render when closed', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Título">
        conteúdo
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders with correct aria attributes when open', () => {
    render(
      <Modal open onClose={() => {}} title="Confirmar ação" description="Tem certeza?">
        <button>OK</button>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Confirmar ação')).toBeInTheDocument();
    expect(screen.getByText('Tem certeza?')).toBeInTheDocument();
  });

  it('closes on Escape key', async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="X">
        <button>ok</button>
      </Modal>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('close button has accessible name', () => {
    render(
      <Modal open onClose={() => {}} title="X">
        body
      </Modal>,
    );
    expect(screen.getByRole('button', { name: 'Fechar modal' })).toBeInTheDocument();
  });
});

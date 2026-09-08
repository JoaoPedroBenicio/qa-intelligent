import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children and is accessible by role', () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    let clicked = false;
    render(<Button onClick={() => (clicked = true)}>Clicar</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(clicked).toBe(true);
  });

  it('respects disabled state', async () => {
    let clicked = false;
    render(
      <Button disabled onClick={() => (clicked = true)}>
        Bloqueado
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(clicked).toBe(false);
  });

  it('renders icon-only buttons with explicit aria-label', () => {
    render(<Button aria-label="Fechar">×</Button>);
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
  });
});

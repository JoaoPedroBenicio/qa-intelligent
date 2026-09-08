import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('associates label with input', () => {
    render(<Input label="Email" name="email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('name', 'email');
  });

  it('shows error and aria-invalid', () => {
    render(<Input label="Email" error="Email inválido" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Email inválido')).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    render(<Input label="Nome" />);
    const input = screen.getByLabelText('Nome');
    await userEvent.type(input, 'João');
    expect(input).toHaveValue('João');
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../../components/ui/Input';

describe('Input', () => {
  it('renderiza com label associada', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('exibe mensagem de erro', () => {
    render(<Input error="Campo obrigatório" />);
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
  });

  it('aceita digitação', async () => {
    render(<Input label="Nome" />);
    const input = screen.getByLabelText('Nome');
    await userEvent.type(input, 'João');
    expect(input).toHaveValue('João');
  });

  it('aplica border-red-500 quando há erro', () => {
    render(<Input error="Inválido" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });
});

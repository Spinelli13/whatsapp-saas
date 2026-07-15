import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotasPanel } from '../../components/dashboard/NotasPanel';

describe('NotasPanel', () => {
  it('deve renderizar o título "Notas Internas"', () => {
    render(<NotasPanel ticketId={null} />);
    expect(screen.getByText('Notas Internas')).toBeInTheDocument();
  });

  it('deve mostrar mensagem quando nenhum ticket selecionado', () => {
    render(<NotasPanel ticketId={null} />);
    expect(screen.getByText(/selecione um ticket/i)).toBeInTheDocument();
  });

  it('deve mostrar campo de texto quando ticket selecionado', async () => {
    render(<NotasPanel ticketId="ticket-001" />);
    const textarea = screen.getByPlaceholderText(/adicionar nota/i);
    expect(textarea).toBeInTheDocument();

    await userEvent.type(textarea, 'Nota de teste');
    expect(textarea).toHaveValue('Nota de teste');
  });
});
